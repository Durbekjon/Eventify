import { Injectable, BadRequestException } from '@nestjs/common'
import { v4 as uuidv4 } from 'uuid'
import * as fs from 'fs-extra'
import * as path from 'path'
import { FILE_UPLOAD_CONFIG, FILE_ERROR_MESSAGES } from '@consts/file-upload'

export interface FileInfo {
  filename: string
  originalName: string
  mimeType: string
  size: number
  path: string
}

@Injectable()
export class FileStorageService {
  private readonly uploadPath = FILE_UPLOAD_CONFIG.UPLOAD_PATH

  constructor() {
    this.ensureUploadDirectory()
  }

  private async ensureUploadDirectory(): Promise<void> {
    try {
      await fs.ensureDir(this.uploadPath)
    } catch (error) {
      throw new BadRequestException('Failed to create upload directory')
    }
  }

  async saveFile(file: Express.Multer.File, userId: string): Promise<FileInfo> {
    // Validate file
    this.validateFile(file)

    // Generate unique filename
    const uniqueFilename = this.generateUniqueFilename(file.originalname)
    const filePath = path.join(this.uploadPath, uniqueFilename)

    try {
      // Save file to disk
      await fs.writeFile(filePath, file.buffer)

      return {
        filename: uniqueFilename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        path: filePath,
      }
    } catch (error) {
      throw new BadRequestException(FILE_ERROR_MESSAGES.UPLOAD_FAILED)
    }
  }

  async deleteFile(filename: string): Promise<void> {
    const filePath = path.join(this.uploadPath, filename)

    try {
      await fs.remove(filePath)
    } catch (error) {
      throw new BadRequestException(FILE_ERROR_MESSAGES.DELETE_FAILED)
    }
  }

  async getFileInfo(filename: string): Promise<FileInfo> {
    const filePath = path.join(this.uploadPath, filename)

    try {
      const stats = await fs.stat(filePath)
      const ext = path.extname(filename)

      return {
        filename,
        originalName: filename,
        mimeType: this.getMimeTypeFromExtension(ext),
        size: stats.size,
        path: filePath,
      }
    } catch (error) {
      throw new BadRequestException(FILE_ERROR_MESSAGES.FILE_NOT_FOUND)
    }
  }

  async fileExists(filename: string): Promise<boolean> {
    const filePath = path.join(this.uploadPath, filename)
    return await fs.pathExists(filePath)
  }

  private validateFile(file: Express.Multer.File): void {
    // Check file size
    if (file.size > FILE_UPLOAD_CONFIG.MAX_FILE_SIZE) {
      throw new BadRequestException(FILE_ERROR_MESSAGES.FILE_TOO_LARGE)
    }

    // Check file type - try MIME type first, then fallback to extension
    if (!FILE_UPLOAD_CONFIG.ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      // Fallback: check if file extension is allowed
      const ext = path.extname(file.originalname).toLowerCase()
      const allowedExtensions = this.getAllowedExtensions()
      
      if (!allowedExtensions.includes(ext)) {
        throw new BadRequestException(FILE_ERROR_MESSAGES.INVALID_FILE_TYPE)
      }
    }
  }

  private generateUniqueFilename(originalName: string): string {
    const ext = path.extname(originalName)
    const nameWithoutExt = path.basename(originalName, ext)
    const timestamp = Date.now()
    const uuid = uuidv4().substring(0, 8)

    return `${nameWithoutExt}_${timestamp}_${uuid}${ext}`
  }

  private getMimeTypeFromExtension(ext: string): string {
    const mimeTypes: { [key: string]: string } = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx':
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.xls': 'application/vnd.ms-excel',
      '.xlsx':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.txt': 'text/plain',
      '.md': 'text/markdown',
      '.markdown': 'text/markdown',
      '.html': 'text/html',
      '.htm': 'text/html',
      '.css': 'text/css',
      '.js': 'text/javascript',
      '.json': 'application/json',
      '.xml': 'application/xml',
      '.mp3': 'audio/mpeg',
      '.wav': 'audio/wav',
      '.mp4': 'video/mp4',
      '.webm': 'video/webm',
    }

    return mimeTypes[ext.toLowerCase()] || 'application/octet-stream'
  }

  private getAllowedExtensions(): string[] {
    return [
      '.jpg', '.jpeg', '.png', '.gif', '.webp',
      '.pdf',
      '.doc', '.docx',
      '.xls', '.xlsx',
      '.txt', '.md', '.markdown', '.html', '.htm', '.css', '.js', '.json', '.xml',
      '.mp3', '.wav',
      '.mp4', '.webm',
    ]
  }
}
