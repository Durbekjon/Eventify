import { Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { BackupStatus } from '@prisma/client'
import { exec } from 'child_process'
import * as fs from 'fs'
import * as path from 'path'
import { promisify } from 'util'

import { PrismaService } from '@core/prisma/prisma.service'
import { S3Service } from '@core/s3/s3.service'

const execAsync = promisify(exec)

@Injectable()
export class BackupService {
  private readonly logger = new Logger(BackupService.name)

  private readonly config = {
    dbName: process.env.DB_NAME || 'eventify',
    dbUser: process.env.DB_USER || 'durbek',
    dbHost: process.env.DB_HOST || 'localhost',
    dbPort: process.env.DB_PORT || '5432',
    dbPassword: process.env.DB_PASSWORD || 'Saydaliyev0512',
    backupFolder: '/tmp',
  }

  constructor(
    private readonly prisma: PrismaService,
    private readonly s3: S3Service,
  ) {}

  /**
   * Run every day at 05:00 UTC
   */
  @Cron('0 5 * * *', {
    timeZone: 'UTC',
  })
  async backup(): Promise<void> {
    this.logger.log('⏳ Starting daily backup...')

    const backup = await this.createBackupRecord()
    const { fileName, filePath } = this.generateBackupPaths()

    try {
      await this.createDatabaseDump(filePath)
      const uploadResult = await this.uploadToS3(filePath, fileName)
      await this.updateBackupSuccess(backup.id, uploadResult)
      this.cleanupTempFile(filePath)

      this.logger.log(`✅ Backup successful: ${uploadResult.url}`)
    } catch (error) {
      await this.handleBackupError(backup.id, error as Error)
      this.cleanupTempFile(filePath)
      throw error
    }
  }

  private async createBackupRecord() {
    return this.prisma.backup.create({
      data: { status: BackupStatus.PENDING },
    })
  }

  private generateBackupPaths() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const fileName = `backup_${this.config.dbName}_${timestamp}.sql`
    const filePath = path.join(this.config.backupFolder, fileName)

    return { fileName, filePath }
  }

  private async createDatabaseDump(filePath: string): Promise<void> {
    const dumpCommand = this.buildDumpCommand(filePath)

    try {
      await execAsync(dumpCommand)
    } catch (error) {
      throw new Error(`Database dump failed: ${(error as Error).message}`)
    }
  }

  private buildDumpCommand(filePath: string): string {
    const { dbHost, dbPort, dbUser, dbName, dbPassword } = this.config

    return `PGPASSWORD=${dbPassword} pg_dump -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${dbName} > ${filePath}`
  }

  private async uploadToS3(filePath: string, fileName: string) {
    const fileBuffer = fs.readFileSync(filePath)

    return this.s3.uploadFile({
      body: fileBuffer,
      originalFileName: fileName,
      contentType: 'application/sql',
      folder: 'db-backups',
    })
  }

  private async updateBackupSuccess(
    backupId: string,
    uploadResult: any,
  ): Promise<void> {
    await this.prisma.backup.update({
      where: { id: backupId },
      data: {
        status: BackupStatus.COMPLETED,
        endedAt: new Date(),
        s3Key: uploadResult.key,
        s3Url: uploadResult.url,
      },
    })
  }

  private async handleBackupError(
    backupId: string,
    error: Error,
  ): Promise<void> {
    this.logger.error(`❌ Backup error: ${error.message}`)

    await this.prisma.backup.update({
      where: { id: backupId },
      data: {
        status: BackupStatus.FAILED,
        endedAt: new Date(),
        errorMessage: error.message,
      },
    })
  }

  private cleanupTempFile(filePath: string): void {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
      }
    } catch (error) {
      this.logger.warn(
        `Failed to cleanup temp file: ${(error as Error).message}`,
      )
    }
  }
}
