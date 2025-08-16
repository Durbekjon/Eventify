import {
  Injectable,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common'
import { FileRepository } from './file.repository'
import { FileStorageService } from '@core/file-storage/file-storage.service'
import { UserService } from '@user/user.service'
import { RoleService } from '@role/role.service'
import { IUser } from '@user/dto/IUser'
import { FileResponseDto } from './dto/file-response.dto'
import { FILE_ERROR_MESSAGES } from '@consts/file-upload'

@Injectable()
export class FileService {
  constructor(
    private readonly repository: FileRepository,
    private readonly fileStorage: FileStorageService,
    private readonly userService: UserService,
    private readonly roleService: RoleService,
  ) {}

  async uploadFiles(
    files: Express.Multer.File[],
    user: IUser,
    context?: { taskId?: string; sheetId?: string; companyId?: string },
  ): Promise<FileResponseDto[]> {
    // Get company ID from context or automatically from user's role
    let companyId = context?.companyId

    if (!companyId) {
      // Automatically get company ID from user's current role
      const userData = await this.userService.getUser(user.id)
      const selectedRole = await this.roleService.getUserSelectedRole({
        roles: userData.roles,
        selectedRole: userData.selectedRole,
      })

      if (!selectedRole) {
        throw new BadRequestException('User has no active role')
      }

      companyId = selectedRole.companyId
    }

    // Validate user access
    await this.validateUserAccess(user, companyId)

    // Validate context-specific access
    if (context?.taskId) {
      await this.validateTaskAccess(user, context.taskId, companyId)
    }

    if (context?.sheetId) {
      await this.validateSheetAccess(user, context.sheetId, companyId)
    }

    const uploadedFiles: FileResponseDto[] = []

    for (const file of files) {
      try {
        // Save file to storage
        const fileInfo = await this.fileStorage.saveFile(file, user.id)

        // Create file record in database
        const fileRecord = await this.repository.createFile({
          filename: fileInfo.filename,
          originalName: fileInfo.originalName,
          mimeType: fileInfo.mimeType,
          size: fileInfo.size,
          path: fileInfo.path,
          uploadedBy: user.id,
          companyId: companyId,
          taskId: context?.taskId,
          sheetId: context?.sheetId,
        })

        uploadedFiles.push(this.mapToResponseDto(fileRecord))
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

  async deleteFiles(fileIds: string[], user: IUser): Promise<void> {
    // Get files to validate access
    const files = await this.repository.getFilesByIds(fileIds)

    if (files.length === 0) {
      throw new BadRequestException(FILE_ERROR_MESSAGES.FILE_NOT_FOUND)
    }

    // Validate user has access to all files
    for (const file of files) {
      await this.validateUserAccess(user, file.companyId)
    }

    // Delete files from storage
    for (const file of files) {
      await this.fileStorage.deleteFile(file.filename)
    }

    // Delete file records from database
    await this.repository.deleteFiles(fileIds)
  }

  async getFilesByCompany(
    companyId: string,
    user: IUser,
  ): Promise<FileResponseDto[]> {
    await this.validateUserAccess(user, companyId)

    const files = await this.repository.getFilesByCompany(companyId)
    return files.map((file) => this.mapToResponseDto(file))
  }

  async getFilesByTask(
    taskId: string,
    user: IUser,
  ): Promise<FileResponseDto[]> {
    // Get task to validate access
    const task = await this.repository.getTaskById(taskId)
    if (!task) {
      throw new BadRequestException('Task not found')
    }

    await this.validateUserAccess(user, task.companyId)

    const files = await this.repository.getFilesByTask(taskId)
    return files.map((file) => this.mapToResponseDto(file))
  }

  async getFilesBySheet(
    sheetId: string,
    user: IUser,
  ): Promise<FileResponseDto[]> {
    // Get sheet to validate access
    const sheet = await this.repository.getSheetById(sheetId)
    if (!sheet) {
      throw new BadRequestException('Sheet not found')
    }

    await this.validateUserAccess(user, sheet.companyId)

    const files = await this.repository.getFilesBySheet(sheetId)
    return files.map((file) => this.mapToResponseDto(file))
  }

  async uploadAvatar(
    file: Express.Multer.File,
    user: IUser,
  ): Promise<FileResponseDto> {
    // Save file to storage
    const fileInfo = await this.fileStorage.saveFile(file, user.id)

    // Create file record in database
    const fileRecord = await this.repository.createFile({
      filename: fileInfo.filename,
      originalName: fileInfo.originalName,
      mimeType: fileInfo.mimeType,
      size: fileInfo.size,
      path: fileInfo.path,

      uploadedBy: user.id,
      companyId: '', // Avatar files don't belong to a specific company
      taskId: undefined,
      sheetId: undefined,
    })

    // Update user's avatar
    await this.repository.updateFileAvatar(user.id, fileRecord.id)

    return this.mapToResponseDto(fileRecord)
  }

  private async validateUserAccess(
    user: IUser,
    companyId: string,
  ): Promise<void> {
    const currentUser = await this.userService.getUser(user.id)
    const selectedRole = this.roleService.getUserSelectedRole({
      roles: currentUser.roles,
      selectedRole: currentUser.selectedRole,
    })

    if (!selectedRole || selectedRole.companyId !== companyId) {
      throw new ForbiddenException(FILE_ERROR_MESSAGES.ACCESS_DENIED)
    }
  }

  private async validateTaskAccess(
    user: IUser,
    taskId: string,
    companyId: string,
  ): Promise<void> {
    const task = await this.repository.getTaskById(taskId)
    if (!task) {
      throw new BadRequestException('Task not found')
    }

    if (task.companyId !== companyId) {
      throw new ForbiddenException(FILE_ERROR_MESSAGES.ACCESS_DENIED)
    }
  }

  private async validateSheetAccess(
    user: IUser,
    sheetId: string,
    companyId: string,
  ): Promise<void> {
    const sheet = await this.repository.getSheetById(sheetId)
    if (!sheet) {
      throw new BadRequestException('Sheet not found')
    }

    if (sheet.companyId !== companyId) {
      throw new ForbiddenException(FILE_ERROR_MESSAGES.ACCESS_DENIED)
    }
  }

  private mapToResponseDto(file: any): FileResponseDto {
    return {
      id: file.id,
      filename: file.filename,
      originalName: file.originalName,
      mimeType: file.mimeType,
      size: file.size,
      path: file.path,
      createdAt: file.createdAt,
      updatedAt: file.updatedAt,
      uploadedBy: file.uploadedBy,
      companyId: file.companyId,
      taskId: file.taskId,
      sheetId: file.sheetId,
      url: `/uploads/${file.filename}`,
    }
  }
}
