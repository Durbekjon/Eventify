import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { CreateTaskDto } from './dto/create-task.dto'
import { UpdateTaskDto } from './dto/update-task.dto'
import { IUser } from '@user/dto/IUser'
import { TaskRepository } from './task.repository'
import { UserService } from '@user/user.service'
import { RoleService } from '@role/role.service'
import {
  MemberPermissions,
  Prisma,
  RoleTypes,
  Task,
  ViewType,
} from '@prisma/client'
import { HTTP_MESSAGES } from '@consts/http-messages'
import { TaskReorderDto } from './dto/reorder-tasks.dto'
import { TaskQueryDto } from './dto/query.task.dto'
import { MoveTaskDto } from './dto/move-task.dto'
import { RoleDto } from '@role/dto/role.dto'
import { SheetService } from '@sheet/sheet.service'
import { fieldsToCheck } from './dto/task.fields'
import { PrismaService } from '@core/prisma/prisma.service'
import { MemberService } from '@member/member.service'
import { TaskWithRelations } from './types/task.types'
import { SubscriptionValidationService } from '@core/subscription-validation/subscription-validation.service'
import { FileStorageService } from '@core/file-storage/file-storage.service'
import { FileRepository } from '../file/file.repository'
import {
  TaskAuditService,
  TaskAuditContext,
} from './services/task-audit.service'

@Injectable()
export class TaskService {
  constructor(
    private readonly repository: TaskRepository,
    private readonly user: UserService,
    private readonly role: RoleService,
    private readonly sheet: SheetService,
    private readonly prisma: PrismaService,
    private readonly member: MemberService,
    private readonly subscriptionValidationService: SubscriptionValidationService,
    private readonly fileStorage: FileStorageService,
    private readonly fileRepository: FileRepository,
    private readonly taskAuditService: TaskAuditService,
  ) {}

  // TASK RETRIEVAL
  async getTasksBySheet(user: IUser, sheetId: string, query: TaskQueryDto) {
    const role = await this.validateUserAccess(user, MemberPermissions.READ)
    const memberId = this.getMemberIdForTaskRetrieval(role)
    return this.repository.getTasksBySheet({ sheetId, memberId }, query)
  }

  // TASK CREATION
  async createTask(body: CreateTaskDto, user: IUser): Promise<Task> {
    const startTime = Date.now()

    try {
      const role = await this.validateUserAccess(user, MemberPermissions.CREATE)
      if (role.type === RoleTypes.MEMBER) {
        body.members = [role.access.id]
      }
      if (body.members?.length > 0) {
        await this.validateBodyMembers(body)
      }

      await this.subscriptionValidationService.validateSubscriptionToTask(
        role.companyId,
      )

      const task = await this.repository.createTask(
        body,
        role.companyId,
        user.id,
      )
      const endTime = Date.now()

      // Create audit context
      const auditContext: TaskAuditContext = {
        userId: user.id,
        companyId: role.companyId,
        workspaceId: task.workspaceId,
        sheetId: task.sheetId,
        taskId: task.id,
      }

      // Log comprehensive audit trail
      await this.taskAuditService.logTaskCreation(
        body,
        task as TaskWithRelations,
        auditContext,
        { startTime, endTime },
      )

      // Keep legacy logging for backward compatibility
      await this.logUserAction(
        user.id,
        role.companyId,
        `Created task: ${body.name}`,
        task.id,
        task.workspaceId,
        task.sheetId,
      )

      return task
    } catch (error) {
      const endTime = Date.now()

      // Log creation failure
      const auditContext: TaskAuditContext = {
        userId: user.id,
        companyId: await this.getCompanyIdFromUser(user),
      }

      await this.taskAuditService.logTaskOperationError(
        'CREATE' as any,
        error,
        auditContext,
        { taskData: body, duration: endTime - startTime },
      )

      throw error
    }
  }

  // TASK UPDATING
  async updateTask(
    id: string,
    body: UpdateTaskDto,
    user: IUser,
  ): Promise<Task> {
    const startTime = Date.now()

    try {
      const role = await this.validateUserAccess(user, MemberPermissions.UPDATE)
      const originalTask = await this.findById(id, role.companyId)

      const updateData: Prisma.TaskUpdateInput = {
        lastUpdatedByUser: { connect: { id: user.id } }, // Track who updated the task
      }
      const changes: Array<{
        updatedKey: string
        oldValue: any
        newValue: any
      }> = []

      // Process regular fields
      for (const field of fieldsToCheck) {
        if (body[field] !== undefined && originalTask[field] !== body[field]) {
          changes.push({
            updatedKey: field,
            oldValue: originalTask[field],
            newValue: body[field],
          })
          updateData[field] = body[field]
        }
      }

      // Handle members separately
      if (body.members !== undefined) {
        changes.push({
          updatedKey: 'members',
          oldValue: originalTask.members,
          newValue: body.members,
        })

        if (body.members.length > 0) {
          await this.validateBodyMembers(body)
          updateData.members = {
            set: body.members.map((id) => ({ id })),
          }
        } else {
          updateData.members = { set: [] }
        }

        // Update chat members as well
        updateData.chat = {
          update: {
            members: updateData.members,
          },
        }
      }

      if (Object.keys(updateData).length <= 1) {
        // Only lastUpdatedByUser field
        return originalTask // No actual changes
      }

      const updatedTask = await this.repository.updateTask(
        originalTask.id,
        updateData,
      )
      const endTime = Date.now()

      // Create audit context
      const auditContext: TaskAuditContext = {
        userId: user.id,
        companyId: role.companyId,
        workspaceId: originalTask.workspaceId,
        sheetId: originalTask.sheetId,
        taskId: originalTask.id,
      }

      // Log comprehensive audit trail
      await this.taskAuditService.logTaskUpdate(
        originalTask,
        body,
        updatedTask as TaskWithRelations,
        auditContext,
        { startTime, endTime },
      )

      // Keep legacy logging for backward compatibility
      await this.logTaskChanges(changes, role.companyId, user.id)

      return updatedTask
    } catch (error) {
      const endTime = Date.now()

      // Log update failure
      const auditContext: TaskAuditContext = {
        userId: user.id,
        companyId: await this.getCompanyIdFromUser(user),
        taskId: id,
      }

      await this.taskAuditService.logTaskOperationError(
        'UPDATE' as any,
        error,
        auditContext,
        { updateData: body, duration: endTime - startTime },
      )

      throw error
    }
  }

  // TASK REORDERING
  async reorderTasks(user: IUser, body: TaskReorderDto) {
    const startTime = Date.now()

    try {
      const role = await this.validateUserAccess(user, MemberPermissions.UPDATE)

      // Get affected tasks before reordering
      const affectedTasks = await Promise.all(
        body.taskId.map((id) => this.repository.findById(id)),
      )
      const validTasks = affectedTasks.filter(
        (task) => task !== null,
      ) as TaskWithRelations[]

      const result = await this.repository.reorder(body)
      const endTime = Date.now()

      // Create audit context
      const auditContext: TaskAuditContext = {
        userId: user.id,
        companyId: role.companyId,
        workspaceId: result.workspaceId,
        sheetId: result.sheetId,
      }

      // Log comprehensive audit trail
      await this.taskAuditService.logTaskReorder(
        body,
        validTasks,
        auditContext,
        { startTime, endTime },
      )

      // Keep legacy logging for backward compatibility
      await this.logUserAction(
        user.id,
        role.companyId,
        'Reordered tasks',
        null,
        result.workspaceId,
        result.sheetId,
      )

      return this.createResponse(HTTP_MESSAGES.TASK.REORDER_SUCCESS)
    } catch (error) {
      const endTime = Date.now()

      // Log reorder failure
      const auditContext: TaskAuditContext = {
        userId: user.id,
        companyId: await this.getCompanyIdFromUser(user),
      }

      await this.taskAuditService.logTaskOperationError(
        'REORDER' as any,
        error,
        auditContext,
        { reorderData: body, duration: endTime - startTime },
      )

      throw error
    }
  }

  // TASK MOVING
  async moveTask(user: IUser, body: MoveTaskDto) {
    const startTime = Date.now()

    try {
      const role = await this.validateUserAccess(user, MemberPermissions.UPDATE)
      const targetSheet = await this.sheet.findOne(body.sheetId)

      this.validateMoveTaskAccess(role, targetSheet)
      await this.ensureTaskExists(body.taskId)

      // Get the task before moving to capture source information
      const taskToMove = await this.findById(body.taskId, role.companyId)
      const sourceSheetId = taskToMove.sheetId

      await this.repository.move(body, targetSheet.workspaceId)
      const endTime = Date.now()

      // Create audit context
      const auditContext: TaskAuditContext = {
        userId: user.id,
        companyId: role.companyId,
        taskId: body.taskId,
        workspaceId: targetSheet.workspaceId,
        sheetId: body.sheetId,
      }

      // Log comprehensive audit trail
      await this.taskAuditService.logTaskMove(
        taskToMove,
        body,
        sourceSheetId,
        targetSheet.workspaceId,
        auditContext,
        { startTime, endTime },
      )

      return this.createResponse(HTTP_MESSAGES.TASK.MOVE_SUCCESS)
    } catch (error) {
      const endTime = Date.now()

      // Log move failure
      const auditContext: TaskAuditContext = {
        userId: user.id,
        companyId: await this.getCompanyIdFromUser(user),
        taskId: body.taskId,
      }

      await this.taskAuditService.logTaskOperationError(
        'MOVE' as any,
        error,
        auditContext,
        { moveData: body, duration: endTime - startTime },
      )

      throw error
    }
  }

  // TASK DELETION
  async deleteTask(id: string, user: IUser): Promise<any> {
    const startTime = Date.now()

    try {
      const role = await this.validateUserAccess(user, MemberPermissions.DELETE)
      const taskToDelete = await this.findById(id, role.companyId)

      // Create audit context before deletion
      const auditContext: TaskAuditContext = {
        userId: user.id,
        companyId: role.companyId,
        taskId: taskToDelete.id,
        workspaceId: taskToDelete.workspaceId,
        sheetId: taskToDelete.sheetId,
      }

      // Log deletion BEFORE actually deleting to preserve task data
      await this.taskAuditService.logTaskDeletion(taskToDelete, auditContext, {
        startTime,
        endTime: Date.now(),
      })

      // Keep legacy logging for backward compatibility
      await this.logUserAction(
        user.id,
        role.companyId,
        `Task deleted: ${taskToDelete.name}`,
        taskToDelete.id,
        taskToDelete.workspaceId,
        taskToDelete.sheetId,
      )

      // Actually delete the task
      await this.repository.deleteTask(taskToDelete.id)

      return this.createResponse(HTTP_MESSAGES.TASK.DELETE_SUCCESS)
    } catch (error) {
      const endTime = Date.now()

      // Log deletion failure
      const auditContext: TaskAuditContext = {
        userId: user.id,
        companyId: await this.getCompanyIdFromUser(user),
        taskId: id,
      }

      await this.taskAuditService.logTaskOperationError(
        'DELETE' as any,
        error,
        auditContext,
        { taskId: id, duration: endTime - startTime },
      )

      throw error
    }
  }

  // SHARED FUNCTIONALITY
  findBySheet(sheet: string) {
    return this.repository.findBySheet(sheet)
  }

  updateMany(args: Prisma.TaskUpdateManyArgs) {
    return this.repository.updateMany(args)
  }

  private async validateUserAccess(
    iUser: IUser,
    permission: MemberPermissions,
  ): Promise<RoleDto> {
    const user = await this.user.getUser(iUser.id)
    const selectedRole = await this.role.getUserSelectedRole({
      roles: user.roles,
      selectedRole: user.selectedRole,
    })

    if (!selectedRole)
      throw new BadRequestException(HTTP_MESSAGES.ROLE.NOT_EXIST)
    if (selectedRole.type === RoleTypes.AUTHOR) return selectedRole

    const userPermissions = selectedRole.access.permissions
    if (
      !userPermissions.includes(permission) &&
      !userPermissions.includes(MemberPermissions.ALL)
    ) {
      throw new ForbiddenException(HTTP_MESSAGES.GENERAL.ACCESS_DENIED)
    }
    return selectedRole
  }

  // Public method to get user's current role (used by controller for file uploads)
  async getUserCurrentRole(user: IUser): Promise<RoleDto | null> {
    try {
      const userData = await this.user.getUser(user.id)
      const selectedRole = await this.role.getUserSelectedRole({
        roles: userData.roles,
        selectedRole: userData.selectedRole,
      })
      return selectedRole || null
    } catch {
      return null
    }
  }

  // Upload files and update task in a single operation
  async uploadFilesAndUpdateTask(
    taskId: string,
    files: Express.Multer.File[],
    updateData: UpdateTaskDto,
    user: IUser,
  ): Promise<{ task: Task; files: any[] }> {
    const startTime = Date.now()

    try {
      // Validate user access and get role
      const role = await this.validateUserAccess(user, MemberPermissions.UPDATE)
      const originalTask = await this.findById(taskId, role.companyId)

      // Upload files first using local services
      const uploadedFiles = await this.uploadFilesToTask(
        files,
        taskId,
        role.companyId,
        user.id,
      )

      // Prepare task update data
      const taskUpdateData: Prisma.TaskUpdateInput = {
        lastUpdatedByUser: { connect: { id: user.id } }, // Track who updated the task
      }

      // Process regular fields
      for (const field of fieldsToCheck) {
        if (updateData[field] !== undefined) {
          taskUpdateData[field] = updateData[field]
        }
      }

      // Handle members separately
      if (updateData.members !== undefined) {
        if (updateData.members.length > 0) {
          await this.validateBodyMembers(updateData)
          taskUpdateData.members = {
            set: updateData.members.map((id) => ({ id })),
          }
        } else {
          taskUpdateData.members = { set: [] }
        }

        // Update chat members as well
        taskUpdateData.chat = {
          update: {
            members: taskUpdateData.members,
          },
        }
      }

      // Update the task
      const updatedTask = await this.repository.updateTask(
        taskId,
        taskUpdateData,
      )
      const endTime = Date.now()

      // Create audit context
      const auditContext: TaskAuditContext = {
        userId: user.id,
        companyId: role.companyId,
        workspaceId: originalTask.workspaceId,
        sheetId: originalTask.sheetId,
        taskId: taskId,
      }

      // Log comprehensive audit trail for file upload + update
      await this.taskAuditService.logTaskUpdate(
        originalTask,
        updateData,
        updatedTask as TaskWithRelations,
        auditContext,
        { startTime, endTime },
      )

      // Keep legacy logging for backward compatibility
      await this.logUserAction(
        user.id,
        role.companyId,
        `Updated task and uploaded ${files.length} file(s): ${originalTask.name}`,
        taskId,
        originalTask.workspaceId,
        originalTask.sheetId,
      )

      return {
        task: updatedTask,
        files: uploadedFiles,
      }
    } catch (error) {
      const endTime = Date.now()

      // Log file upload failure
      const auditContext: TaskAuditContext = {
        userId: user.id,
        companyId: await this.getCompanyIdFromUser(user),
        taskId: taskId,
      }

      await this.taskAuditService.logTaskOperationError(
        'UPDATE' as any,
        error,
        auditContext,
        {
          operation: 'FILE_UPLOAD_AND_UPDATE',
          fileCount: files.length,
          updateData,
          duration: endTime - startTime,
        },
      )

      throw error
    }
  }

  // Upload files to a specific task
  async uploadFilesToTask(
    files: Express.Multer.File[],
    taskId: string,
    companyId: string,
    userId: string,
  ): Promise<any[]> {
    const uploadedFiles = []

    for (const file of files) {
      try {
        // Save file to storage
        const fileInfo = await this.fileStorage.saveFile(file, userId)

        // Create file record in database
        const fileRecord = await this.fileRepository.createFile({
          filename: fileInfo.filename,
          originalName: fileInfo.originalName,
          mimeType: fileInfo.mimeType,
          size: fileInfo.size,
          path: fileInfo.path,
          uploadedBy: userId,
          companyId: companyId,
          taskId: taskId,
        })

        uploadedFiles.push(fileRecord)
      } catch (error) {
        // Clean up any files that were already uploaded
        for (const uploadedFile of uploadedFiles) {
          await this.fileStorage.deleteFile(uploadedFile.filename)
        }
        throw new BadRequestException(
          `Failed to upload file ${file.originalname}: ${error.message}`,
        )
      }
    }

    return uploadedFiles
  }

  // Upload files to a sheet
  async uploadFilesToSheet(
    files: Express.Multer.File[],
    sheetId: string,
    companyId: string,
    userId: string,
  ): Promise<any[]> {
    const uploadedFiles = []

    for (const file of files) {
      try {
        // Save file to storage
        const fileInfo = await this.fileStorage.saveFile(file, userId)

        // Create file record in database
        const fileRecord = await this.fileRepository.createFile({
          filename: fileInfo.filename,
          originalName: fileInfo.originalName,
          mimeType: fileInfo.mimeType,
          size: fileInfo.size,
          path: fileInfo.path,
          uploadedBy: userId,
          companyId: companyId,
          sheetId: sheetId,
        })

        uploadedFiles.push(fileRecord)
      } catch (error) {
        // Clean up any files that were already uploaded
        for (const uploadedFile of uploadedFiles) {
          await this.fileStorage.deleteFile(uploadedFile.filename)
        }
        throw new BadRequestException(
          `Failed to upload file ${file.originalname}: ${error.message}`,
        )
      }
    }

    return uploadedFiles
  }

  // Get files for a specific task
  async getTaskFiles(taskId: string, user: IUser): Promise<any[]> {
    const role = await this.validateUserAccess(user, MemberPermissions.READ)
    await this.findById(taskId, role.companyId)

    return this.fileRepository.getFilesByTask(taskId)
  }

  // Get files for a specific sheet
  async getSheetFiles(sheetId: string, user: IUser): Promise<any[]> {
    const role = await this.validateUserAccess(user, MemberPermissions.READ)

    // Validate sheet access
    const sheet = await this.sheet.findOne(sheetId)
    if (!sheet || sheet.companyId !== role.companyId) {
      throw new BadRequestException('Sheet not found or access denied')
    }

    return this.fileRepository.getFilesBySheet(sheetId)
  }

  // Delete files from a task
  async deleteTaskFiles(fileIds: string[], user: IUser): Promise<void> {
    const startTime = Date.now()

    try {
      const role = await this.validateUserAccess(user, MemberPermissions.UPDATE)

      // Get files to validate access
      const files = await this.fileRepository.getFilesByIds(fileIds)

      if (files.length === 0) {
        throw new BadRequestException('No files found to delete')
      }

      // Validate that all files belong to the user's company
      for (const file of files) {
        if (file.companyId !== role.companyId) {
          throw new BadRequestException('Access denied to delete these files')
        }
      }

      // Get unique task IDs for audit logging
      const taskIds = [
        ...new Set(files.map((file) => file.taskId).filter(Boolean)),
      ]

      // Delete files from storage and database
      for (const file of files) {
        await this.fileStorage.deleteFile(file.filename)
      }

      await this.fileRepository.deleteFiles(fileIds)

      // Log file deletion for each affected task
      for (const taskId of taskIds) {
        if (taskId) {
          await this.logUserAction(
            user.id,
            role.companyId,
            `Deleted ${files.filter((f) => f.taskId === taskId).length} file(s) from task`,
            taskId,
            null,
            null,
          )
        }
      }
    } catch (error) {
      const endTime = Date.now()

      // Log file deletion failure
      const auditContext: TaskAuditContext = {
        userId: user.id,
        companyId: await this.getCompanyIdFromUser(user),
      }

      await this.taskAuditService.logTaskOperationError(
        'UPDATE' as any,
        error,
        auditContext,
        {
          operation: 'FILE_DELETE',
          fileIds,
          duration: endTime - startTime,
        },
      )

      throw error
    }
  }

  private async findById(
    id: string,
    companyId: string,
  ): Promise<TaskWithRelations> {
    const task = await this.repository.findById(id)
    if (!task || task.companyId !== companyId) {
      throw new BadRequestException(HTTP_MESSAGES.TASK.NOT_FOUND)
    }
    return task
  }

  private getMemberIdForTaskRetrieval(role: RoleDto): string | null {
    return role.type !== RoleTypes.AUTHOR &&
      !role.access.permissions.includes(MemberPermissions.ALL)
      ? role.access.id
      : null
  }

  private async validateBodyMembers(body: CreateTaskDto | UpdateTaskDto) {
    const notFoundMembers: string[] = []

    const validatePromise = body.members.map(async (memberId: string) => {
      const data = await this.member.findOneMember(memberId)
      if (!data) notFoundMembers.push(memberId)
    })

    await Promise.all(validatePromise)

    if (notFoundMembers.length > 0) {
      const responseMessage: string = `Members not found with ids' ${notFoundMembers.join(', ')}`
      throw new BadRequestException(responseMessage)
    }
  }

  private async logTaskChanges(
    changes: Array<{ updatedKey: string; oldValue: any; newValue: any }>,
    companyId: string,
    userId: string,
  ) {
    const logs = changes.map((change) => ({
      message: `Task ${change.updatedKey} changed from ${change.oldValue} to ${change.newValue}`,
      companyId,
      userId,
      updatedKey: change.updatedKey,
      oldValue: change.oldValue?.toString(),
      newValue: change.newValue?.toString(),
    }))
    await this.prisma.log.createMany({ data: logs })
  }

  private async ensureTaskExists(taskId: string) {
    const isTaskExist = await this.repository.findOne(taskId)
    if (!isTaskExist) throw new NotFoundException(HTTP_MESSAGES.TASK.NOT_FOUND)
  }

  private validateMoveTaskAccess(role: RoleDto, sheet: any) {
    if (
      role.type !== RoleTypes.AUTHOR &&
      role.access.view === ViewType.OWN &&
      !role.access.workspaces.some(
        (workspace) => workspace.id === sheet.workspaceId,
      )
    ) {
      throw new ForbiddenException(HTTP_MESSAGES.GENERAL.ACCESS_DENIED)
    }
  }

  private createResponse(message: string) {
    return { status: 'OK', result: message }
  }

  private async logUserAction(
    userId: string,
    companyId: string,
    logMessage: string,
    relatedTaskId: string | null,
    workspaceId: string | null,
    sheetId: string | null,
  ) {
    const logData: Prisma.LogCreateInput = {
      message: logMessage,
      user: { connect: { id: userId } },
      company: { connect: { id: companyId } },
      task: relatedTaskId ? { connect: { id: relatedTaskId } } : undefined,
      workspace: workspaceId ? { connect: { id: workspaceId } } : undefined,
      sheet: sheetId ? { connect: { id: sheetId } } : undefined,
    }
    await this.prisma.log.create({ data: logData })
  }

  /**
   * Helper method to get company ID from user when role validation fails
   */
  private async getCompanyIdFromUser(user: IUser): Promise<string> {
    try {
      const userData = await this.user.getUser(user.id)
      const selectedRole = await this.role.getUserSelectedRole({
        roles: userData.roles,
        selectedRole: userData.selectedRole,
      })
      return selectedRole?.companyId || 'unknown'
    } catch {
      return 'unknown'
    }
  }
}
