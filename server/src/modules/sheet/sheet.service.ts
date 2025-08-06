import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { SheetRepository } from './sheet.repository'
import { IUser } from '@/modules/user/dto/IUser'
import { CreateSheetDto } from './dto/create-sheet.dto'
import { UserService } from '@user/user.service'
import { HTTP_MESSAGES } from '@consts/http-messages'
import { RoleService } from '@role/role.service'
import { Prisma, RoleTypes, User } from '@prisma/client'
import { WorkspaceService } from '@workspace/workspace.service'
import { RoleDto } from '@role/dto/role.dto'
import { UpdateSheetDto } from './dto/update-sheet.dto'
import { SheetReorderDto } from './dto/reorder-sheets.dto'
import { LogRepository } from '@log/log.repository'
import { SubscriptionValidationService } from '@core/subscription_validation/subscription_validation.service'

@Injectable()
export class SheetService {
  constructor(
    private readonly repository: SheetRepository,
    private readonly user: UserService,
    private readonly role: RoleService,
    private readonly log: LogRepository,
    @Inject(forwardRef(() => WorkspaceService))
    private readonly workspace: WorkspaceService,
    private readonly validateSubscriptionValidationService: SubscriptionValidationService,
  ) {}

  async createSheet(iUser: IUser, body: CreateSheetDto) {
    const { user, role } = await this.validateUserRole(iUser)
    await Promise.all([
      this.isWorkspaceBelongToCompany(body.workspaceId, role.company.id),
      this.validateSubscriptionValidationService.validateSubscriptionToSheet(
        role.company.id,
      ),
    ])
    const logMessage = `created new sheet ${body.name}`

    const [sheet, _] = await Promise.all([
      this.repository.createSheet(body, role.company.id),
      this.createLog(user.id, role.company.id, null, logMessage),
    ])

    return sheet
  }

  async getSheetsByWorkspace(workspaceId: string, user: IUser) {
    await this.verifyUserWorkspaceAccess(user, workspaceId)

    return this.repository.getSheetsByWorkspace(workspaceId)
  }

  async getSheet(sheetId: string, user: IUser) {
    const sheet = await this.repository.findById(sheetId)

    if (!sheet) throw new NotFoundException(HTTP_MESSAGES.SHEET.NOT_FOUND)

    await this.verifyUserWorkspaceAccess(user, sheet.workspaceId)

    return sheet
  }

  findOne(id: string) {
    return this.repository.findOne(id)
  }

  async updateSheet(sheetId: string, iUser: IUser, body: UpdateSheetDto) {
    const { user, role } = await this.validateUserRole(iUser)

    await this.isExistSheetInCompany(sheetId, role.companyId)

    const logMessage = `updated sheet`
    await this.createLog(user.id, role.companyId, sheetId, logMessage)

    return this.repository.updateSheet(sheetId, body)
  }

  async reorderSheets(iUser: IUser, body: SheetReorderDto) {
    const { user, role } = await this.validateUserRole(iUser)

    if (body.sheetIds.length === 0 || body.sheetIds === null)
      throw new BadRequestException(HTTP_MESSAGES.SHEET.INVALID_IDS)

    const logMessage = `reordered sheets`

    await Promise.all([
      this.repository.reorder(body),
      this.createLog(user.id, role.companyId, null, logMessage),
    ])

    return {
      status: 'OK',
      result: HTTP_MESSAGES.SHEET.REORDER_SUCCESS,
    }
  }

  async deleteSheet(sheetId: string, iUser: IUser) {
    const { user, role } = await this.validateUserRole(iUser)

    const sheet = await this.isExistSheetInCompany(sheetId, role.companyId)

    const logMessage = `deleted sheet ${sheet.name}`

    await Promise.all([
      this.createLog(user.id, role.companyId, sheetId, logMessage),
      this.repository.deleteSheet(sheetId),
    ])

    return {
      status: 'OK',
      result: HTTP_MESSAGES.SHEET.DELETE_SUCCESS,
    }
  }

  async deleteMultipleSheetsByWorkspace(workspaceId: string) {
    await this.repository.deleteMultipleSheetsByWorkspace(workspaceId)
    return {
      status: 'OK',
      result: HTTP_MESSAGES.SHEET.DELETE_MULTIPLE_SUCCESS,
    }
  }

  private async isExistSheetInCompany(sheetId: string, companyId: string) {
    const sheet = await this.repository.findById(sheetId)

    if (!sheet || sheet.companyId !== companyId)
      throw new NotFoundException(HTTP_MESSAGES.SHEET.NOT_FOUND)

    return sheet
  }

  private async validateUserRole(
    user: IUser,
  ): Promise<{ user: User; role: RoleDto }> {
    const userId = user.id
    const currentUser = await this.user.getUser(userId)

    const selectedRole = this.role.getUserSelectedRole({
      roles: currentUser.roles,
      selectedRole: currentUser.selectedRole,
    })

    if (!selectedRole || selectedRole.type !== RoleTypes.AUTHOR)
      throw new BadRequestException(HTTP_MESSAGES.ROLE.NOT_EXIST)

    return { user: currentUser, role: selectedRole }
  }

  private async verifyUserWorkspaceAccess(
    user: IUser,
    workspaceId: string | null,
  ) {
    const userId = user.id
    const currentUser = await this.user.getUser(userId)

    const selectedRole = this.role.getUserSelectedRole({
      roles: currentUser.roles,
      selectedRole: currentUser.selectedRole,
    })

    if (selectedRole.type === 'AUTHOR' || selectedRole.view === 'ALL') {
      return selectedRole
    }

    const workspace = workspaceId
      ? await this.workspace.findWorkspaceById(workspaceId)
      : null

    if (
      selectedRole.view === 'OWN' &&
      workspace &&
      !workspace.members.some((e) => e.id === selectedRole.access.id)
    ) {
      throw new NotFoundException(HTTP_MESSAGES.COMPANY.NOT_FOUND)
    }

    return selectedRole
  }

  private async isWorkspaceBelongToCompany(
    workspaceId: string,
    companyId: string,
  ) {
    const workspace = await this.workspace.findWorkspaceById(workspaceId)

    if (!workspace) throw new NotFoundException('Workspace not found')

    if (workspace.companyId !== companyId)
      throw new BadRequestException(HTTP_MESSAGES.WORKSPACE.INVALID_ID)
  }

  private async createLog(
    userId: string,
    companyId: string,
    sheetId: string | null,
    message: string,
  ) {
    const options: Prisma.LogCreateInput = {
      message,
      user: { connect: { id: userId } },
      company: { connect: { id: companyId } },
      ...(sheetId && { sheet: { connect: { id: sheetId } } }),
    }

    return this.log.create(options)
  }
}
