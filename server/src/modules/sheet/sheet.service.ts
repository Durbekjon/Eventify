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
import { RoleTypes } from '@prisma/client'
import { WorkspaceService } from '../workspace/workspace.service'
import { RoleDto } from '@role/dto/role.dto'
import { UpdateSheetDto } from './dto/update-sheet.dto'
import { SheetReorderDto } from './dto/reorder-sheets.dto'

@Injectable()
export class SheetService {
  constructor(
    private readonly repository: SheetRepository,
    private readonly user: UserService,
    private readonly role: RoleService,
    @Inject(forwardRef(() => WorkspaceService))
    private readonly workspace: WorkspaceService,
  ) {}

  async createSheet(user: IUser, body: CreateSheetDto) {
    const role: RoleDto = await this.validateUserRole(user)

    await this.isWorkspaceBelongToCompany(body.workspaceId, role.companyId)

    return this.repository.createSheet(body, role.companyId)
  }

  async getSheetsByWorkspace(workspaceId: string, user: IUser) {
    await this.verifyUserWorkspaceAccess(user, workspaceId)

    return this.repository.getSheetsByWorkspace(workspaceId)
  }

  async getSheet(sheetId: string, user: IUser) {
    const sheet = await this.repository.findById(sheetId)

    if (!sheet) throw new NotFoundException(HTTP_MESSAGES.SHEET_NOT_FOUND)

    await this.verifyUserWorkspaceAccess(user, sheet.workspaceId)

    return sheet
  }

  async updateSheet(sheetId: string, user: IUser, body: UpdateSheetDto) {
    const role = await this.validateUserRole(user)

    await this.isExistSheetInCompany(sheetId, role.companyId)

    return this.repository.updateSheet(sheetId, body)
  }

  async reorderSheets(user: IUser, body: SheetReorderDto) {
    await this.validateUserRole(user)

    await this.repository.reorder(body)

    return {
      status: 'OK',
      result: HTTP_MESSAGES.SHEETS_REORDERED,
    }
  }

  async deleteSheet(sheetId: string, user: IUser) {
    const role = await this.validateUserRole(user)

    await this.isExistSheetInCompany(sheetId, role.companyId)

    return this.repository.deleteSheet(sheetId)
  }

  deleteMultipleSheetsByWorkspace(workspaceId: string) {
    return this.repository.deleteMultipleSheetsByWorkspace(workspaceId)
  }

  private async isExistSheetInCompany(sheetId: string, companyId: string) {
    const sheet = await this.repository.findById(sheetId)

    if (!sheet || sheet.companyId !== companyId)
      throw new NotFoundException(HTTP_MESSAGES.SHEET_NOT_FOUND)

    return sheet
  }

  private async validateUserRole(user: IUser) {
    const userId = user.id
    const currentUser = await this.user.getUser(userId)

    const selectedRole = this.role.getUserSelectedRole({
      roles: currentUser.roles,
      selectedRole: currentUser.selectedRole,
    })

    if (!selectedRole || selectedRole.type !== RoleTypes.AUTHOR)
      throw new BadRequestException(HTTP_MESSAGES.ROLE_NOT_EXIST)

    return selectedRole
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
      !workspace.members.some((e) => e.id === selectedRole.access.id) // Fixed the equality check here
    ) {
      throw new NotFoundException(HTTP_MESSAGES.COMPANY_NOT_FOUND)
    }

    return selectedRole
  }

  private async isWorkspaceBelongToCompany(
    workspaceId: string,
    companyId: string,
  ) {
    const workspace = await this.workspace.findWorkspaceById(workspaceId)

    if (workspace.companyId !== companyId)
      throw new BadRequestException(HTTP_MESSAGES.INCORRECT_WORKSPACE_ID)
  }
}
