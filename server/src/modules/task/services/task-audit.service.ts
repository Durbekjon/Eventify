import { Injectable } from '@nestjs/common'
import { LogRepository } from '../../log/log.repository'
import { Prisma } from '@prisma/client'

// Minimal interfaces kept for potential future use
export interface TaskAuditContext {
  userId: string
  companyId: string
  workspaceId?: string
  sheetId?: string
  taskId?: string
}

@Injectable()
export class TaskAuditService {
  constructor(private readonly logRepository: LogRepository) {}

  /**
   * Simple logging method for basic audit trails
   * Note: This service is kept for potential future use but currently unused
   */
  async createSimpleLog(
    userId: string,
    companyId: string,
    message: string,
    taskId?: string,
    workspaceId?: string,
    sheetId?: string,
  ): Promise<void> {
    try {
      const logData: Prisma.LogCreateInput = {
        message,
        user: { connect: { id: userId } },
        company: { connect: { id: companyId } },
        task: taskId ? { connect: { id: taskId } } : undefined,
        workspace: workspaceId ? { connect: { id: workspaceId } } : undefined,
        sheet: sheetId ? { connect: { id: sheetId } } : undefined,
        updatedKey: null,
        newValue: null,
        oldValue: null,
      }

      await this.logRepository.create(logData)
    } catch (error) {
      console.error('Failed to create simple log:', error)
    }
  }
}
