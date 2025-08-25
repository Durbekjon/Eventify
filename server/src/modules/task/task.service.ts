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
  ) {}

  // TASK RETRIEVAL
  async getTasksBySheet(user: IUser, sheetId: string, query: TaskQueryDto) {
    const role = await this.validateUserAccess(user, MemberPermissions.READ)
    const memberId = this.getMemberIdForTaskRetrieval(role)
    return this.repository.getTasksBySheet({ sheetId, memberId }, query)
  }

  // TASK CREATION
  async createTask(body: CreateTaskDto, user: IUser): Promise<Task> {
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

      // Simple logging (preferred format)
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
      // Log creation failure
      await this.logUserAction(
        user.id,
        await this.getCompanyIdFromUser(user),
        `Failed to create task: ${error.message}`,
        null,
        null,
        null,
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
        // Only consider fields that are actually present in the update body
        if (Object.prototype.hasOwnProperty.call(body, field)) {
          const oldValue = originalTask[field]
          const newValue = body[field]

          // Deep comparison for arrays and objects, simple comparison for primitives
          const hasChanged = this.hasValueChanged(oldValue, newValue)

          if (hasChanged) {
            changes.push({
              updatedKey: field,
              oldValue,
              newValue,
            })
            updateData[field] = newValue
          }
        }
      }

      // Handle members separately
      if (body.members !== undefined) {
        const oldMemberIds = originalTask.members?.map((m) => m.id).sort() || []
        const newMemberIds = body.members.sort()

        // Only log change if members actually changed
        if (JSON.stringify(oldMemberIds) !== JSON.stringify(newMemberIds)) {
          changes.push({
            updatedKey: 'members',
            oldValue: originalTask.members,
            newValue: body.members,
          })
        }

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

      // Detailed logging for updates - log each field change
      if (changes.length > 0) {
        console.log(changes)
        // First log a general update message
        // await this.logUserAction(
        //   user.id,
        //   role.companyId,
        //   `Updated task: ${originalTask.name}`,
        //   originalTask.id,
        //   originalTask.workspaceId,
        //   originalTask.sheetId,
        // )

        // Then log individual field changes with old/new values
        await this.logTaskChanges(
          changes,
          role.companyId,
          user.id,
          originalTask.id,
          originalTask.workspaceId,
          originalTask.sheetId,
        )
      }

      return updatedTask
    } catch (error) {
      // Log update failure
      await this.logUserAction(
        user.id,
        await this.getCompanyIdFromUser(user),
        `Failed to update task: ${error.message}`,
        id,
        null,
        null,
      )

      throw error
    }
  }

  // TASK REORDERING
  async reorderTasks(user: IUser, body: TaskReorderDto) {
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

      // Simple reorder logging
      await this.logUserAction(
        user.id,
        role.companyId,
        `Reordered ${validTasks.length} tasks`,
        null,
        result.workspaceId,
        result.sheetId,
      )

      return this.createResponse(HTTP_MESSAGES.TASK.REORDER_SUCCESS)
    } catch (error) {
      // Log reorder failure
      await this.logUserAction(
        user.id,
        await this.getCompanyIdFromUser(user),
        `Failed to reorder tasks: ${error.message}`,
        null,
        null,
        null,
      )

      throw error
    }
  }

  // TASK MOVING
  async moveTask(user: IUser, body: MoveTaskDto) {
    try {
      const role = await this.validateUserAccess(user, MemberPermissions.UPDATE)
      const targetSheet = await this.sheet.findOne(body.sheetId)

      this.validateMoveTaskAccess(role, targetSheet)
      await this.ensureTaskExists(body.taskId)

      // Get the task before moving to capture source information
      const taskToMove = await this.findById(body.taskId, role.companyId)

      await this.repository.move(body, targetSheet.workspaceId)

      // Simple move logging
      await this.logUserAction(
        user.id,
        role.companyId,
        `Moved task: ${taskToMove.name}`,
        body.taskId,
        targetSheet.workspaceId,
        body.sheetId,
      )

      return this.createResponse(HTTP_MESSAGES.TASK.MOVE_SUCCESS)
    } catch (error) {
      // Log move failure
      await this.logUserAction(
        user.id,
        await this.getCompanyIdFromUser(user),
        `Failed to move task: ${error.message}`,
        body.taskId,
        null,
        null,
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

      // Simple deletion logging
      await this.logUserAction(
        user.id,
        role.companyId,
        `Deleted task: ${taskToDelete.name}`,
        null,
        taskToDelete.workspaceId,
        taskToDelete.sheetId,
      )

      // Actually delete the task
      await this.repository.deleteTask(taskToDelete.id)

      return this.createResponse(HTTP_MESSAGES.TASK.DELETE_SUCCESS)
    } catch (error) {
      const endTime = Date.now()

      // Log deletion failure
      await this.logUserAction(
        user.id,
        await this.getCompanyIdFromUser(user),
        `Failed to delete task: ${error.message}`,
        id,
        null,
        null,
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

      // Simple logging for file upload + update
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
      await this.logUserAction(
        user.id,
        await this.getCompanyIdFromUser(user),
        `Failed to upload files and update task: ${error.message}`,
        taskId,
        null,
        null,
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

  async bulkDelete(taskIds: string[], user: IUser) {
    const role = await this.validateUserAccess(user, MemberPermissions.DELETE)
    await this.repository.bulkDelete(taskIds, role.companyId)
    return this.createResponse(HTTP_MESSAGES.TASK.DELETE_SUCCESS)
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

      // File deletion is already logged by the audit service
      // No need for additional logging here
    } catch (error) {
      const endTime = Date.now()

      // Log file deletion failure
      await this.logUserAction(
        user.id,
        await this.getCompanyIdFromUser(user),
        `Failed to delete files: ${error.message}`,
        null,
        null,
        null,
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
    taskId?: string,
    workspaceId?: string,
    sheetId?: string,
  ) {
    const logs = changes.map((change) => {
      console.log(change)
      // Format values properly for logging
      const formatValue = (value: any): string => {
        if (value === null || value === undefined) return 'null'
        if (Array.isArray(value)) {
          // For members array, show member IDs
          if (change.updatedKey === 'members') {
            return value.map((m) => m.id || m).join(', ') || 'empty'
          }
          return value.join(', ') || 'empty'
        }
        return String(value)
      }

      return {
        message: `Field "${change.updatedKey}" changed from "${formatValue(change.oldValue)}" to "${formatValue(change.newValue)}"`,
        user: { connect: { id: userId } },
        company: { connect: { id: companyId } },
        task: taskId ? { connect: { id: taskId } } : undefined,
        workspace: workspaceId ? { connect: { id: workspaceId } } : undefined,
        sheet: sheetId ? { connect: { id: sheetId } } : undefined,
        updatedKey: change.updatedKey,
        oldValue: formatValue(change.oldValue),
        newValue: formatValue(change.newValue),
      }
    })

    // Create individual logs for each change
    await Promise.all(logs.map((log) => this.prisma.log.create({ data: log })))
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
   * Helper method to deeply compare two values to determine if they have changed
   */
  private hasValueChanged(oldValue: any, newValue: any): boolean {
    // Handle null and undefined cases
    if (oldValue === null && newValue === null) return false
    if (oldValue === undefined && newValue === undefined) return false
    if (oldValue === null && newValue === undefined) return false
    if (oldValue === undefined && newValue === null) return false

    // Handle primitive types
    if (typeof oldValue !== 'object' && typeof newValue !== 'object') {
      return oldValue !== newValue
    }

    // Handle arrays
    if (Array.isArray(oldValue) && Array.isArray(newValue)) {
      if (oldValue.length !== newValue.length) return true

      // For arrays, use JSON.stringify for deep comparison
      return JSON.stringify(oldValue.sort()) !== JSON.stringify(newValue.sort())
    }

    // Handle one being array, other not
    if (Array.isArray(oldValue) !== Array.isArray(newValue)) {
      return true
    }

    // Handle objects (including dates)
    if (oldValue instanceof Date && newValue instanceof Date) {
      return oldValue.getTime() !== newValue.getTime()
    }

    // For other objects, use JSON.stringify
    if (typeof oldValue === 'object' && typeof newValue === 'object') {
      return JSON.stringify(oldValue) !== JSON.stringify(newValue)
    }

    // Different types
    return oldValue !== newValue
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
