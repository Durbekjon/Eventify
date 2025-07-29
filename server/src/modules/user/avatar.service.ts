import { Injectable, BadRequestException } from '@nestjs/common'
import { FileStorageService } from '@core/file-storage/file-storage.service'
import { UserRepository } from './user.repository'
import { IUser } from './dto/IUser'
import { FileResponseDto } from '../file/dto/file-response.dto'

@Injectable()
export class AvatarService {
  constructor(
    private readonly fileStorage: FileStorageService,
    private readonly userRepository: UserRepository,
  ) {}

  async uploadAvatar(
    file: Express.Multer.File,
    user: IUser,
  ): Promise<FileResponseDto> {
    if (!file) {
      throw new BadRequestException('No avatar file uploaded')
    }

    // Validate that it's an image file
    const allowedImageTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
    ]
    if (!allowedImageTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Avatar must be an image file (JPEG, PNG, GIF, or WebP)',
      )
    }

    // Save file to storage
    const fileInfo = await this.fileStorage.saveFile(file, user.id)

    // Create file record in database
    const fileRecord = await this.userRepository.createAvatarFile({
      filename: fileInfo.filename,
      originalName: fileInfo.originalName,
      mimeType: fileInfo.mimeType,
      size: fileInfo.size,
      path: fileInfo.path,
      uploadedBy: user.id,
    })

    // Update user's avatar
    await this.userRepository.updateFileAvatar(user.id, fileRecord.id)

    return this.mapToResponseDto(fileRecord)
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
      url: `/public/uploads/${file.filename}`,
    }
  }
}
