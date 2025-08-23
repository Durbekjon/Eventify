import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common'
import { CreateMemberDto } from './dto/create-member.dto'
import { MemberRepository } from './member.repository'
import { NotificationService } from '@notification/notification.service'
import { CreateNotificationDto } from '@notification/dto/create-notification.dto'
import {
  Member,
  MemberStatus,
  MemberTypes,
  NotificationFrom,
  NotificationType,
  Prisma,
  RoleTypes,
} from '@prisma/client'
import { APP_MESSAGES } from '@consts/app-messages'
import { IUser } from '@/modules/user/dto/IUser'
import { UserService } from '@user/user.service'
import { RoleService } from '@role/role.service'
import { HTTP_MESSAGES } from '@consts/http-messages'
import { StatusUpdateDto } from './dto/status-update.dto'
import { CreateRoleDto } from '@role/dto/create-role.dto'
import { MemberDto } from './dto/member.dto'
import { UpdateMemberDto } from './dto/update-member.dto'
import { LogRepository } from '@log/log.repository'
import { RoleDto } from '@role/dto/role.dto'
import { UtilsService } from '@core/utils/utils.service'
import { EmailService } from '@core/email/email.service'
import { SubscriptionValidationService } from '../../core/subscription-validation/subscription-validation.service'
import { FilterDto } from './dto/filter.dto'

@Injectable()
export class MemberService {
  constructor(
    private readonly repository: MemberRepository,
    private readonly notification: NotificationService,
    private readonly user: UserService,
    private readonly role: RoleService,
    private readonly log: LogRepository,
    private readonly utils: UtilsService,
    private readonly email: EmailService,
    private readonly subscriptionValidationService: SubscriptionValidationService,
  ) {}

  async createMember(dto: CreateMemberDto, user: IUser) {
    const selectedRole = await this.validateUserRole(user)

    const { member, newUserPassword } = await this.createMemberWithUser(
      dto,
      selectedRole,
    )
    switch (dto.type) {
      case MemberTypes.MEMBER:
        await this.subscriptionValidationService.validateSubscriptionToMember(
          selectedRole.companyId,
        )
      case MemberTypes.VIEWER:
        await this.subscriptionValidationService.validateSubscriptionToViewer(
          selectedRole.companyId,
        )
    }

    await Promise.all([
      this.createInvitationNotification(member, selectedRole.companyId),
      this.sendInvitationEmail(dto, selectedRole, newUserPassword),
      this.createLog(user.id, selectedRole.companyId, ''),
    ])

    return {
      status: 'OK',
      result: member,
    }
  }

  async getInvitations(user: IUser) {
    const selectedRole = await this.validateUserRole(user)
    return this.repository.getInvitations(selectedRole.companyId)
  }

  /**
   * Creates a member and associated user if needed
   * @param dto - Member creation data
   * @param selectedRole - User's selected role with company info
   * @returns Object containing created member and optional new user password
   */
  private async createMemberWithUser(
    dto: CreateMemberDto,
    selectedRole: RoleDto,
  ): Promise<{ member: Member; newUserPassword?: string }> {
    if (dto.userId) {
      return this.createMemberForExistingUser(dto, selectedRole.companyId)
    } else {
      return this.createMemberForNewUser(dto, selectedRole.companyId)
    }
  }

  /**
   * Creates a member for an existing user
   * @param dto - Member creation data with userId
   * @param companyId - Company ID
   * @returns Created member
   */
  private async createMemberForExistingUser(
    dto: CreateMemberDto,
    companyId: string,
  ): Promise<{ member: Member; newUserPassword?: string }> {
    const member = await this.repository.createMember(dto, companyId)
    return { member }
  }

  /**
   * Creates a new user and member
   * @param dto - Member creation data with email
   * @param companyId - Company ID
   * @returns Created member and generated password
   */
  private async createMemberForNewUser(
    dto: CreateMemberDto,
    companyId: string,
  ): Promise<{ member: Member; newUserPassword: string }> {
    const newUserPassword = this.utils.generateRandomPassword()
    const newUser = await this.user.createUser(dto.email!, newUserPassword)

    const memberData = { ...dto, userId: newUser.id }
    const member = await this.repository.createMember(memberData, companyId)

    return { member, newUserPassword }
  }

  /**
   * Creates an invitation notification for the member
   * @param member - Created member
   * @param companyId - Company ID
   */
  private async createInvitationNotification(
    member: Member,
    companyId: string,
  ): Promise<void> {
    const notificationData: CreateNotificationDto = {
      text: APP_MESSAGES.INVITATION_TEXT,
      type: NotificationType.INVITATION,
      from: NotificationFrom.COMPANY,
      userId: member.userId,
      member: member.id,
      companyId,
    }

    await this.notification.createNotification(notificationData)
  }

  /**
   * Sends appropriate invitation email based on whether user is new or existing
   * @param dto - Original member creation data
   * @param selectedRole - User's selected role with company info
   * @param newUserPassword - Optional password for new users
   */
  private async sendInvitationEmail(
    dto: CreateMemberDto,
    selectedRole: RoleDto,
    newUserPassword?: string,
  ): Promise<void> {
    const emailMessage = dto.userId
      ? this.email.sendInviteCompany(dto.email!, selectedRole.company.name)
      : this.email.sendInviteToNewUser(
          dto.email!,
          newUserPassword!,
          selectedRole.company.name,
        )

    await emailMessage
  }

  async getMembers(user: IUser, filter: FilterDto | null) {
    const selectedRole = await this.validateUserRole(user)

    return this.repository.getActiveMembersInReverseOrder(
      selectedRole.companyId,
      filter,
    )
  }

  async getMember(memberId: string, user: IUser) {
    const selectedRole = await this.validateUserRole(user)

    return await this.findMemberById(memberId, selectedRole.companyId)
  }

  async cancel(memberId: string, user: IUser) {
    const selectedRole = await this.validateUserRole(user)

    await this.findMemberById(memberId, selectedRole.companyId)

    await this.repository.cancelMember(memberId)

    return {
      status: 'OK',
    }
  }

  async findOneMember(memberId: string) {
    return this.repository.getMember(memberId)
  }

  async updateMemberStatus(
    memberId: string,
    user: IUser,
    body: StatusUpdateDto,
  ) {
    const member = await this.findMemberAndValidateUser(user, memberId)

    if (member.status !== 'NEW')
      throw new BadRequestException(HTTP_MESSAGES.MEMBER.BLOCKED)

    await this.repository.statusMember(body, memberId)

    if (body.status === MemberStatus.ACTIVE)
      await this.createRoleForMember(member)
    else if (body.status === MemberStatus.CANCELLED)
      await this.repository.cancelMember(memberId)

    return {
      status: 'OK',
      message: `Member status updated to ${body.status}.`,
    }
  }

  async updateMember(memberId: string, user: IUser, body: UpdateMemberDto) {
    const selectedRole = await this.validateUserRole(user)

    await this.findMemberById(memberId, selectedRole.companyId)

    return await this.repository.updateMember(memberId, body)
  }

  deleteManyMembersByCompany(companyId: string) {
    return this.repository.deleteCompanyMembers(companyId)
  }

  private async findMemberById(memberId: string, companyId: string) {
    const member = await this.repository.getMember(memberId)

    if (!member || member.companyId !== companyId)
      throw new NotFoundException(HTTP_MESSAGES.MEMBER.NOT_FOUND)

    return member
  }

  private async validateUserRole(user: IUser): Promise<RoleDto> {
    const userId = user.id
    const currentUser = await this.user.getUser(userId)

    const selectedRole = this.role.getUserSelectedRole({
      roles: currentUser.roles,
      selectedRole: currentUser.selectedRole,
    })

    if (!selectedRole || selectedRole.type !== RoleTypes.AUTHOR)
      throw new BadRequestException(HTTP_MESSAGES.ROLE.NOT_EXIST)

    return selectedRole
  }

  private async findMemberAndValidateUser(user: IUser, memberId: string) {
    const userId = user.id

    const member = await this.repository.getMember(memberId)
    if (!member || member.userId !== userId)
      throw new NotFoundException(HTTP_MESSAGES.MEMBER.NOT_FOUND)

    return member
  }

  private async createRoleForMember(member: MemberDto): Promise<void> {
    const createRoleData: CreateRoleDto = {
      user: member.userId,
      company: member.companyId,
      type: member.type,
      access: member.id,
    }
    await this.role.createRole(createRoleData)
  }

  private createLog(userId: string, companyId: string, message: string) {
    const data: Prisma.LogCreateInput = {
      user: { connect: { id: userId } },
      company: { connect: { id: companyId } },
      message,
    }
    return this.log.create(data)
  }
}
