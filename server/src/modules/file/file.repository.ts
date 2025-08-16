import { Injectable } from '@nestjs/common'
import { PrismaService } from '@core/prisma/prisma.service'
import { CreateFileDto } from './dto/create-file.dto'
import { File } from '@prisma/client'

@Injectable()
export class FileRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createFile(fileData: {
    filename: string
    originalName: string
    mimeType: string
    size: number
    path: string
    uploadedBy: string
    companyId: string
    taskId?: string
    sheetId?: string
  }): Promise<File> {
    return this.prisma.file.create({
      data: fileData,
    })
  }

  async deleteFiles(fileIds: string[]): Promise<void> {
    await this.prisma.file.deleteMany({
      where: {
        id: {
          in: fileIds,
        },
      },
    })
  }

  async getFilesByCompany(companyId: string): Promise<File[]> {
    return this.prisma.file.findMany({
      where: {
        companyId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
  }

  async getFilesByTask(taskId: string): Promise<File[]> {
    return this.prisma.file.findMany({
      where: {
        taskId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
  }

  async getFilesBySheet(sheetId: string): Promise<File[]> {
    return this.prisma.file.findMany({
      where: {
        sheetId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
  }

  async getFileById(id: string): Promise<File | null> {
    return this.prisma.file.findUnique({
      where: { id },
    })
  }

  async getFilesByIds(ids: string[]): Promise<File[]> {
    return this.prisma.file.findMany({
      where: {
        id: {
          in: ids,
        },
      },
    })
  }

  async getTaskById(taskId: string) {
    return this.prisma.task.findUnique({
      where: { id: taskId },
      select: { companyId: true },
    })
  }

  async getSheetById(sheetId: string) {
    return this.prisma.sheet.findUnique({
      where: { id: sheetId },
      select: { companyId: true },
    })
  }

  async updateFileAvatar(userId: string, fileId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { avatarId: fileId },
    })
  }
}
