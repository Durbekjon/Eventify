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
  MemberStatus,
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

@Injectable()
export class MemberService {
  constructor(
    private readonly repository: MemberRepository,
    private readonly notification: NotificationService,
    private readonly user: UserService,
    private readonly role: RoleService,
    private readonly log: LogRepository,
  ) {}

  async createMember(dto: CreateMemberDto, user: IUser) {
    const selectedRole = await this.validateUserRole(user)

    const member = await this.repository.createMember(
      dto,
      selectedRole.companyId,
    )


    const notificationData: CreateNotificationDto = {
      text: APP_MESSAGES.INVITATION_TEXT,
      type: NotificationType.INVITATION,
      from: NotificationFrom.COMPANY,
      userId: dto.userId,
      member: member.id,
      companyId: selectedRole.companyId,
    }

    await this.notification.createNotification(notificationData)
    await this.createLog(user.id, selectedRole.companyId, '')
    
    return {
      status: 'OK',
      result: member,
    }
  }

  async getMembers(user: IUser) {
    const selectedRole = await this.validateUserRole(user)

    return this.repository.getActiveMembersInReverseOrder(
      selectedRole.companyId,
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

    return {
      status: 'OK',
      message: `Member status updated to ${body.status}.`,
    }
  }

  async updateMember(memberId: string, user: IUser, body: UpdateMemberDto) {
    const selectedRole = await this.validateUserRole(user)

    await this.findMemberById(memberId, selectedRole.companyId)

    const member = await this.repository.updateMember(memberId, body)

    return { status: 'OK', result: member }
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
