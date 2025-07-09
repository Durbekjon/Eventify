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
import { IUser } from '@user/dto/IUser'
import { UserService } from '@user/user.service'
import { RoleService } from '@role/role.service'
import { HTTP_MESSAGES } from '@/consts/http-messages'
import { UpdateWorkspaceDto } from './dto/update-workspace.dto'
import {
  Log,
  Prisma,
  RoleTypes,
  User,
  ViewType,
  Workspace,
} from '@prisma/client'
import { SheetService } from '@sheet/sheet.service'
import { WorkspaceReorderDto } from './dto/reorder-workspaces.dto'
import { RoleDto } from '@role/dto/role.dto'
import { LogRepository } from '@log/log.repository'
@Injectable()
export class WorkspaceService {
  constructor(
    private readonly repository: WorkspaceRepository,
    private readonly user: UserService,
    private readonly role: RoleService,
    @Inject(forwardRef(() => SheetService))
    private readonly sheet: SheetService,
    private readonly log: LogRepository,
  ) {}

  async createWorkspace(body: CreateWorkspaceDto, iUser: IUser) {
    const { user, role } = await this.validateUserRole(iUser)
    const workspace: Workspace = await this.repository.createWorkspace(
      body,
      role.companyId,
    )

    // Fix: Use logical OR (||) for fallback
    const logMessage = `${user.firstName || user.email} created new workspace: ${workspace.name}`
    await this.createLog(user.id, role.companyId, logMessage, workspace.id)

    return workspace
  }

  async updateWorkspace(
    workspaceId: string,
    body: UpdateWorkspaceDto,
    iUser: IUser,
  ) {
    const { user, role } = await this.validateUserRole(iUser)

    await this.validateWorkspaceOwnership(workspaceId, role.companyId)

    // Fix: Use logical OR (||) for fallback
    const logMessage = `${user.firstName || user.email} updated workspace`
    await this.createLog(user.id, role.companyId, logMessage, workspaceId)

    return this.repository.updateWorkspace(workspaceId, body)
  }

  async reorderWorkspaces(iUser: IUser, body: WorkspaceReorderDto) {
    const { user, role } = await this.validateUserRole(iUser)

    await this.repository.reorder(body)

    // Fix: Use logical OR (||) for fallback
    const logMessage = `${user.firstName || user.email} reordered workspaces`
    await this.createLog(user.id, role.companyId, logMessage)
    return {
      status: 'OK',
      result: HTTP_MESSAGES.WORKSPACE.REORDER_SUCCESS,
    }
  }

  async getWorkspaces(user: IUser) {
    const { role } = await this.validateUserRole(user)
    if (role.access?.view === ViewType.OWN) {
      return this.getOwnMemberWorkspaces(role.access.id)
    }
    return this.repository.getWorkspaces(role.companyId)
  }

  async getWorkspace(user: IUser, workspaceId: string) {
    const { role } = await this.validateUserRole(user)

    const workspace = await this.validateWorkspaceOwnership(
      workspaceId,
      role.companyId,
    )

    if (role.access?.view === ViewType.OWN) {
      this.checkWorkspaceAccess(role.access.workspaces, workspace)
    }

    return workspace
  }

  async deleteWorkspace(iUser: IUser, workspaceId: string) {
    const { user, role } = await this.validateUserRole(iUser)

    const workspace = await this.validateWorkspaceOwnership(
      workspaceId,
      role.companyId,
    )

    // Fix: Use logical OR (||) for fallback
    const logMessage = `${user.firstName || user.email} deleted workspace: ${workspace.name}`
    await this.createLog(user.id, role.companyId, logMessage, workspace.id)

    // if (workspace.sheets.length > 0)
    //   await this.sheet.deleteMultipleSheetsByWorkspace(workspace.id)

    return this.repository.deleteWorkspace(workspaceId)
  }

  private async createLog(
    userId: string,
    companyId: string,
    message: string,
    workspaceId?: string | null,
  ): Promise<Log> {
    const data: Prisma.LogCreateInput = {
      user: { connect: { id: userId } },
      company: { connect: { id: companyId } },
      message,
      ...(workspaceId ? { workspace: { connect: { id: workspaceId } } } : {}), // Conditionally connect workspace if provided
    }

    return this.log.create(data)
  }

  private async getOwnMemberWorkspaces(memberId: string) {
    return this.repository.getOwnMemberWorkspaces(memberId)
  }

  private async validateUserRole(
    user: IUser,
  ): Promise<{ user: User; role: RoleDto }> {
    const currentUser = await this.user.getUser(user.id)

    if (!currentUser) {
      throw new BadRequestException(HTTP_MESSAGES.USER.NOT_FOUND)
    }

    const selectedRole = this.role.getUserSelectedRole({
      roles: currentUser.roles,
      selectedRole: currentUser.selectedRole,
    })

    if (!selectedRole) {
      throw new BadRequestException(HTTP_MESSAGES.ROLE.NOT_EXIST)
    }

    if (selectedRole.type === RoleTypes.AUTHOR)
      return { user: currentUser, role: selectedRole }

    const member = selectedRole.access
    if (!member) {
      throw new ForbiddenException(HTTP_MESSAGES.GENERAL.FAILURE)
    }

    return { user: currentUser, role: selectedRole }
  }

  findWorkspaceById(id: string) {
    return this.repository.findById(id)
  }

  private checkWorkspaceAccess(workspaces: Workspace[], workspace: Workspace) {
    if (!workspaces.find((e) => e.id === workspace.id))
      throw new NotFoundException(HTTP_MESSAGES.WORKSPACE.NOT_FOUND)
  }

  private async validateWorkspaceOwnership(
    workspaceId: string,
    companyId: string,
  ) {
    const workspace = await this.repository.findById(workspaceId)

    if (!workspace || workspace.companyId !== companyId) {
      throw new NotFoundException(HTTP_MESSAGES.WORKSPACE.NOT_FOUND)
    }

    return workspace
  }
}
