import {
  BadRequestException,
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { WorkspaceRepository } from './workspace.repository'
import { CreateWorkspaceDto } from './dto/create-workspace.dto'
import { IUser } from '../user/dto/IUser'
import { UserService } from '../user/user.service'
import { RoleService } from '../role/role.service'
import { HTTP_MESSAGES } from '@/consts/http-messages'
import { UpdateWorkspaceDto } from './dto/update-workspace.dto'
import { RoleTypes, ViewType, Workspace } from '@prisma/client'
import { SheetService } from '../sheet/sheet.service'

@Injectable()
export class WorkspaceService {
  constructor(
    private readonly repository: WorkspaceRepository,
    private readonly user: UserService,
    private readonly role: RoleService,
    @Inject(forwardRef(() => SheetService))
    private readonly sheet: SheetService,
  ) {}

  async createWorkspace(body: CreateWorkspaceDto, user: IUser) {
    const role = await this.validateUserRole(user)

    return this.repository.createWorkspace(body, role.companyId)
  }

  async updateWorkspace(
    workspaceId: string,
    body: UpdateWorkspaceDto,
    user: IUser,
  ) {
    const role = await this.validateUserRole(user)

    await this.validateWorkspaceOwnership(workspaceId, role.companyId)

    return this.repository.updateWorkspace(workspaceId, body)
  }

  async getWorkspaces(user: IUser) {
    const role = await this.validateUserRole(user)
    if (role.access?.view === ViewType.OWN)
      return this.getOwnMemberWorkspaces(role.access.id)

    return this.repository.getWorkspaces(role.companyId)
  }

  async getWorkspace(user: IUser, workspaceId: string) {
    const role = await this.validateUserRole(user)

    const workspace = await this.validateWorkspaceOwnership(
      workspaceId,
      role.companyId,
    )

    if (role.access?.view === ViewType.OWN) {
      this.checkWorkspaceAccess(role.access.workspaces, workspace)
    }

    return workspace
  }

  async deleteWorkspace(user: IUser, workspaceId: string) {
    const role = await this.validateUserRole(user)

    const workspace = await this.validateWorkspaceOwnership(
      workspaceId,
      role.companyId,
    )

    if (workspace.sheets.length > 0)
      await this.sheet.deleteMultipleSheetsByWorkspace(workspace.id)

    return this.repository.deleteWorkspace(workspaceId)
  }

  private async getOwnMemberWorkspaces(memberId: string) {
    return this.repository.getOwnMemberWorkspaces(memberId)
  }

  private async validateUserRole(user: IUser) {
    const currentUser = await this.user.getUser(user.id)

    if (!currentUser) {
      throw new BadRequestException(HTTP_MESSAGES.USER_NOT_FOUND)
    }

    const selectedRole = this.role.getUserSelectedRole({
      roles: currentUser.roles,
      selectedRole: currentUser.selectedRole,
    })

    if (!selectedRole) {
      throw new BadRequestException(HTTP_MESSAGES.ROLE_NOT_EXIST)
    }

    if (selectedRole.type === RoleTypes.AUTHOR) return selectedRole

    const member = selectedRole.access
    if (!member) {
      throw new ForbiddenException(HTTP_MESSAGES.ACTION_FAILED)
    }

    return selectedRole

    // throw new ForbiddenException(HTTP_MESSAGES.ACTION_FAILED)
  }

  findWorkspaceById(id: string) {
    return this.repository.findById(id)
  }

  private checkWorkspaceAccess(workspaces: Workspace[], workspace: Workspace) {
    if (!workspaces.find((e) => e.id === workspace.id))
      throw new NotFoundException(HTTP_MESSAGES.WORKSPACE_NOT_FOUND)
  }

  private async validateWorkspaceOwnership(
    workspaceId: string,
    companyId: string,
  ) {
    const workspace = await this.repository.findById(workspaceId)

    if (!workspace || workspace.companyId !== companyId) {
      throw new NotFoundException(HTTP_MESSAGES.WORKSPACE_NOT_FOUND)
    }

    return workspace
  }
}
