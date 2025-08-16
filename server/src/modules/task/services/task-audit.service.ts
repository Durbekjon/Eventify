import { Injectable } from '@nestjs/common'
import { LogRepository } from '../../log/log.repository'
import { Prisma } from '@prisma/client'
import { TaskWithRelations } from '../types/task.types'
import { CreateTaskDto } from '../dto/create-task.dto'
import { UpdateTaskDto } from '../dto/update-task.dto'
import { TaskReorderDto } from '../dto/reorder-tasks.dto'
import { MoveTaskDto } from '../dto/move-task.dto'
import { TaskAuditHelper } from '../utils/audit-helper'
import {
  // TASK_AUDIT_ACTIONS,
  TASK_AUDIT_MESSAGES,
  getAuditPriority,
  assessOperationRisk,
} from '../constants/audit-constants'

export enum TaskAuditAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  REORDER = 'REORDER',
  MOVE = 'MOVE',
  BULK_UPDATE = 'BULK_UPDATE',
}

export interface TaskAuditContext {
  userId: string
  companyId: string
  workspaceId?: string
  sheetId?: string
  taskId?: string
  userAgent?: string
  ipAddress?: string
  sessionId?: string
}

export interface TaskFieldChange {
  field: string
  oldValue: any
  newValue: any
  fieldType: 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object'
}

export interface TaskAuditData {
  action: TaskAuditAction
  context: TaskAuditContext
  changes?: TaskFieldChange[]
  metadata?: Record<string, any>
  performanceMetrics?: {
    startTime: number
    endTime: number
    duration: number
  }
  errorDetails?: {
    error: string
    stack?: string
  }
}

@Injectable()
export class TaskAuditService {
  constructor(
    private readonly logRepository: LogRepository,
    private readonly auditHelper: TaskAuditHelper,
  ) {}

  /**
   * Log task creation with comprehensive details
   */
  async logTaskCreation(
    taskData: CreateTaskDto,
    createdTask: TaskWithRelations,
    context: TaskAuditContext,
    performanceMetrics?: { startTime: number; endTime: number },
  ): Promise<void> {
    try {
      const taskSnapshot = this.auditHelper.createTaskSnapshot(createdTask)
      const complexity = this.auditHelper.calculateTaskComplexity(createdTask)
      const auditTags = this.auditHelper.generateAuditTags(
        'CREATE',
        createdTask,
      )

      const auditData: TaskAuditData = {
        action: TaskAuditAction.CREATE,
        context: {
          ...context,
          taskId: createdTask.id,
          workspaceId: createdTask.workspaceId,
          sheetId: createdTask.sheetId,
        },
        metadata: {
          taskSnapshot,
          complexity,
          auditTags,
          priority: getAuditPriority('CREATE'),
          risk: assessOperationRisk('CREATE', { complexity }),
          memberCount: createdTask.members?.length || 0,
          hasPrice: !!createdTask.price,
          hasLinks: !!(createdTask.link || this.hasAnyLinks(createdTask)),
          customFieldsUsed: this.getUsedCustomFields(createdTask),
        },
        performanceMetrics: performanceMetrics
          ? {
              ...performanceMetrics,
              duration:
                performanceMetrics.endTime - performanceMetrics.startTime,
            }
          : undefined,
      }

      const message = TASK_AUDIT_MESSAGES.CREATE.SUCCESS(createdTask.name)
      await this.createAuditLog(auditData, message)
    } catch (error) {
      console.error('Failed to log task creation:', error)
      // Don't throw - logging should not break the main operation
    }
  }

  /**
   * Log task updates with detailed field-level changes
   */
  async logTaskUpdate(
    originalTask: TaskWithRelations,
    updateData: UpdateTaskDto,
    updatedTask: TaskWithRelations,
    context: TaskAuditContext,
    performanceMetrics?: { startTime: number; endTime: number },
  ): Promise<void> {
    try {
      const diffs = this.auditHelper.createTaskDiff(originalTask, updatedTask)

      if (diffs.length === 0) {
        return // No actual changes to log
      }

      const changeSummary = this.auditHelper.generateChangeSummary(diffs)
      const isBusinessCritical =
        this.auditHelper.isBusinessCriticalChange(diffs)
      const auditTags = this.auditHelper.generateAuditTags(
        'UPDATE',
        updatedTask,
        diffs,
      )
      const changedFields = diffs.map((d) => d.field)

      const auditData: TaskAuditData = {
        action: TaskAuditAction.UPDATE,
        context: {
          ...context,
          taskId: originalTask.id,
          workspaceId: originalTask.workspaceId,
          sheetId: originalTask.sheetId,
        },
        changes: diffs.map((diff) => ({
          field: diff.field,
          oldValue: diff.oldValue,
          newValue: diff.newValue,
          fieldType: diff.fieldType as
            | 'string'
            | 'number'
            | 'boolean'
            | 'date'
            | 'array'
            | 'object',
        })),
        metadata: {
          taskName: originalTask.name,
          changeSummary,
          changedFields,
          changeCount: diffs.length,
          isBusinessCritical,
          auditTags,
          priority: getAuditPriority('UPDATE', changedFields),
          risk: assessOperationRisk('UPDATE', {
            significantChanges: diffs
              .filter((d) => d.significance === 'high')
              .map((d) => d.field),
          }),
          significantChanges: diffs
            .filter((d) => d.significance === 'high')
            .map((d) => d.field),
          memberChanges: this.getMemberChanges(
            originalTask.members,
            updatedTask.members,
          ),
        },
        performanceMetrics: performanceMetrics
          ? {
              ...performanceMetrics,
              duration:
                performanceMetrics.endTime - performanceMetrics.startTime,
            }
          : undefined,
      }

      const message = TASK_AUDIT_MESSAGES.UPDATE.SUCCESS(
        originalTask.name,
        diffs.length,
      )
      await this.createAuditLog(auditData, message)

      // Log individual field changes for detailed audit trail
      const fieldChanges: TaskFieldChange[] = diffs.map((d) => ({
        field: d.field,
        oldValue: d.oldValue,
        newValue: d.newValue,
        fieldType: d.fieldType as
          | 'string'
          | 'number'
          | 'boolean'
          | 'date'
          | 'array'
          | 'object',
      }))
      await this.logIndividualFieldChanges(fieldChanges, context)
    } catch (error) {
      console.error('Failed to log task update:', error)
    }
  }

  /**
   * Log task deletion with complete snapshot
   */
  async logTaskDeletion(
    deletedTask: TaskWithRelations,
    context: TaskAuditContext,
    performanceMetrics?: { startTime: number; endTime: number },
  ): Promise<void> {
    try {
      const auditData: TaskAuditData = {
        action: TaskAuditAction.DELETE,
        context: {
          ...context,
          taskId: deletedTask.id,
          workspaceId: deletedTask.workspaceId,
          sheetId: deletedTask.sheetId,
        },
        metadata: {
          taskSnapshot: this.createTaskSnapshot(deletedTask),
          memberCount: deletedTask.members?.length || 0,
          hadPrice: !!deletedTask.price,
          hadLinks: !!(deletedTask.link || this.hasAnyLinks(deletedTask)),
          customFieldsUsed: this.getUsedCustomFields(deletedTask),
          taskAge: this.calculateTaskAge(deletedTask.createdAt),
        },
        performanceMetrics: performanceMetrics
          ? {
              ...performanceMetrics,
              duration:
                performanceMetrics.endTime - performanceMetrics.startTime,
            }
          : undefined,
      }

      await this.createAuditLog(
        auditData,
        `Task deleted: "${deletedTask.name}"`,
      )
    } catch (error) {
      console.error('Failed to log task deletion:', error)
    }
  }

  /**
   * Log task reordering operation
   */
  async logTaskReorder(
    reorderData: TaskReorderDto,
    affectedTasks: TaskWithRelations[],
    context: TaskAuditContext,
    performanceMetrics?: { startTime: number; endTime: number },
  ): Promise<void> {
    try {
      const auditData: TaskAuditData = {
        action: TaskAuditAction.REORDER,
        context,
        metadata: {
          taskCount: reorderData.taskId.length,
          taskIds: reorderData.taskId,
          newOrders: reorderData.orders,
          affectedTaskNames: affectedTasks.map((task) => task.name),
          reorderType: this.determineReorderType(reorderData.orders),
        },
        performanceMetrics: performanceMetrics
          ? {
              ...performanceMetrics,
              duration:
                performanceMetrics.endTime - performanceMetrics.startTime,
            }
          : undefined,
      }

      const message = `Reordered ${reorderData.taskId.length} tasks`
      await this.createAuditLog(auditData, message)
    } catch (error) {
      console.error('Failed to log task reorder:', error)
    }
  }

  /**
   * Log task move operation
   */
  async logTaskMove(
    movedTask: TaskWithRelations,
    moveData: MoveTaskDto,
    sourceSheetId: string,
    targetWorkspaceId: string,
    context: TaskAuditContext,
    performanceMetrics?: { startTime: number; endTime: number },
  ): Promise<void> {
    try {
      const auditData: TaskAuditData = {
        action: TaskAuditAction.MOVE,
        context: {
          ...context,
          taskId: movedTask.id,
        },
        metadata: {
          taskName: movedTask.name,
          sourceSheetId,
          targetSheetId: moveData.sheetId,
          targetWorkspaceId,
          crossWorkspace: sourceSheetId !== moveData.sheetId,
        },
        performanceMetrics: performanceMetrics
          ? {
              ...performanceMetrics,
              duration:
                performanceMetrics.endTime - performanceMetrics.startTime,
            }
          : undefined,
      }

      const message = `Task "${movedTask.name}" moved to different sheet`
      await this.createAuditLog(auditData, message)
    } catch (error) {
      console.error('Failed to log task move:', error)
    }
  }

  /**
   * Log operation errors for debugging and monitoring
   */
  async logTaskOperationError(
    action: TaskAuditAction,
    error: Error,
    context: TaskAuditContext,
    additionalData?: Record<string, any>,
  ): Promise<void> {
    try {
      const auditData: TaskAuditData = {
        action,
        context,
        errorDetails: {
          error: error.message,
          stack: error.stack,
        },
        metadata: {
          errorType: error.constructor.name,
          timestamp: new Date().toISOString(),
          ...additionalData,
        },
      }

      await this.createAuditLog(
        auditData,
        `Task operation failed: ${error.message}`,
      )
    } catch (logError) {
      console.error('Failed to log task operation error:', logError)
    }
  }

  /**
   * Create the actual audit log entry
   */
  private async createAuditLog(
    auditData: TaskAuditData,
    message: string,
  ): Promise<void> {
    const logData: Prisma.LogCreateInput = {
      message,
      user: { connect: { id: auditData.context.userId } },
      company: { connect: { id: auditData.context.companyId } },
      task: auditData.context.taskId
        ? { connect: { id: auditData.context.taskId } }
        : undefined,
      workspace: auditData.context.workspaceId
        ? { connect: { id: auditData.context.workspaceId } }
        : undefined,
      sheet: auditData.context.sheetId
        ? { connect: { id: auditData.context.sheetId } }
        : undefined,
      updatedKey: auditData.action,
      newValue: JSON.stringify({
        action: auditData.action,
        metadata: auditData.metadata,
        performanceMetrics: auditData.performanceMetrics,
        errorDetails: auditData.errorDetails,
      }),
      oldValue: auditData.changes ? JSON.stringify(auditData.changes) : null,
    }

    await this.logRepository.create(logData)
  }

  /**
   * Log individual field changes for detailed audit trail
   */
  private async logIndividualFieldChanges(
    changes: TaskFieldChange[],
    context: TaskAuditContext,
  ): Promise<void> {
    const fieldChangeLogs = changes.map((change) => ({
      message: `Field "${change.field}" changed from "${this.formatValue(change.oldValue)}" to "${this.formatValue(change.newValue)}"`,
      userId: context.userId,
      companyId: context.companyId,
      taskId: context.taskId,
      workspaceId: context.workspaceId,
      sheetId: context.sheetId,
      updatedKey: change.field,
      oldValue: this.formatValue(change.oldValue),
      newValue: this.formatValue(change.newValue),
    }))

    if (fieldChangeLogs.length > 0) {
      // Create individual logs for each field change
      await Promise.all(
        fieldChangeLogs.map((log) =>
          this.logRepository.create({
            message: log.message,
            user: { connect: { id: log.userId } },
            company: { connect: { id: log.companyId } },
            task: log.taskId ? { connect: { id: log.taskId } } : undefined,
            workspace: log.workspaceId
              ? { connect: { id: log.workspaceId } }
              : undefined,
            sheet: log.sheetId ? { connect: { id: log.sheetId } } : undefined,
            updatedKey: log.updatedKey,
            oldValue: log.oldValue,
            newValue: log.newValue,
          }),
        ),
      )
    }
  }

  /**
   * Calculate field-level changes between original and updated task
   */
  private calculateFieldChanges(
    original: TaskWithRelations,
    updated: TaskWithRelations,
  ): TaskFieldChange[] {
    const changes: TaskFieldChange[] = []

    // Define all fields to check
    const fieldsToCheck = [
      'name',
      'status',
      'priority',
      'link',
      'price',
      'paid',
      'text1',
      'text2',
      'text3',
      'text4',
      'text5',
      'number1',
      'number2',
      'number3',
      'number4',
      'number5',
      'checkbox1',
      'checkbox2',
      'checkbox3',
      'checkbox4',
      'checkbox5',
      'select1',
      'select2',
      'select3',
      'select4',
      'select5',
      'date1',
      'date2',
      'date3',
      'date4',
      'date5',
      'link1',
      'link2',
      'link3',
      'link4',
      'link5',
    ]

    for (const field of fieldsToCheck) {
      const oldValue = original[field]
      const newValue = updated[field]

      if (!this.valuesEqual(oldValue, newValue)) {
        changes.push({
          field,
          oldValue,
          newValue,
          fieldType: this.determineFieldType(field, newValue),
        })
      }
    }

    // Check members separately (array comparison)
    if (!this.arraysEqual(original.members, updated.members)) {
      changes.push({
        field: 'members',
        oldValue: original.members?.map((m) => m.id) || [],
        newValue: updated.members?.map((m) => m.id) || [],
        fieldType: 'array',
      })
    }

    return changes
  }

  /**
   * Helper methods
   */
  private valuesEqual(a: any, b: any): boolean {
    if (a === b) return true
    if (a instanceof Date && b instanceof Date) {
      return a.getTime() === b.getTime()
    }
    return false
  }

  private arraysEqual(a: any[], b: any[]): boolean {
    if (!a && !b) return true
    if (!a || !b) return false
    if (a.length !== b.length) return false

    const aIds = a.map((item) => item.id || item).sort()
    const bIds = b.map((item) => item.id || item).sort()

    return aIds.every((id, index) => id === bIds[index])
  }

  private determineFieldType(
    field: string,
    value: any,
  ): 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object' {
    if (field.includes('date')) return 'date'
    if (field.includes('number') || field === 'price') return 'number'
    if (field.includes('checkbox') || field === 'paid') return 'boolean'
    if (field === 'members') return 'array'
    if (typeof value === 'object' && value !== null) return 'object'
    return 'string'
  }

  private formatValue(value: any): string {
    if (value === null || value === undefined) return 'null'
    if (Array.isArray(value)) return `[${value.join(', ')}]`
    if (value instanceof Date) return value.toISOString()
    if (typeof value === 'object') return JSON.stringify(value)
    return String(value)
  }

  private generateUpdateMessage(
    taskName: string,
    changes: TaskFieldChange[],
  ): string {
    const fieldNames = changes.map((c) => c.field).join(', ')
    return `Task "${taskName}" updated: ${fieldNames} (${changes.length} field${changes.length > 1 ? 's' : ''})`
  }

  private getMemberChanges(
    oldMembers: any[],
    newMembers: any[],
  ): { added: string[]; removed: string[] } {
    const oldIds = new Set(oldMembers?.map((m) => m.id) || [])
    const newIds = new Set(newMembers?.map((m) => m.id) || [])

    return {
      added: [...newIds].filter((id) => !oldIds.has(id)),
      removed: [...oldIds].filter((id) => !newIds.has(id)),
    }
  }

  private getSignificantChanges(changes: TaskFieldChange[]): string[] {
    return changes
      .filter((change) =>
        ['name', 'status', 'priority', 'members'].includes(change.field),
      )
      .map((change) => change.field)
  }

  private hasAnyLinks(task: TaskWithRelations): boolean {
    return !!(
      task.link1 ||
      task.link2 ||
      task.link3 ||
      task.link4 ||
      task.link5
    )
  }

  private getUsedCustomFields(task: TaskWithRelations): string[] {
    const customFields = []
    for (let i = 1; i <= 5; i++) {
      if (task[`text${i}`]) customFields.push(`text${i}`)
      if (task[`number${i}`]) customFields.push(`number${i}`)
      if (task[`checkbox${i}`]) customFields.push(`checkbox${i}`)
      if (task[`select${i}`]) customFields.push(`select${i}`)
      if (task[`date${i}`]) customFields.push(`date${i}`)
      if (task[`link${i}`]) customFields.push(`link${i}`)
    }
    return customFields
  }

  private createTaskSnapshot(task: TaskWithRelations): Record<string, any> {
    return {
      id: task.id,
      name: task.name,
      status: task.status,
      priority: task.priority,
      price: task.price,
      paid: task.paid,
      memberCount: task.members?.length || 0,
      hasCustomFields: this.getUsedCustomFields(task).length > 0,
      createdAt: task.createdAt,
    }
  }

  private calculateTaskAge(createdAt: Date): { days: number; hours: number } {
    const now = new Date()
    const diffMs = now.getTime() - createdAt.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    const diffHours = Math.floor(
      (diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
    )

    return { days: diffDays, hours: diffHours }
  }

  private determineReorderType(
    orders: number[],
  ): 'sequential' | 'scattered' | 'reverse' {
    const isSequential = orders.every(
      (order, index) => index === 0 || order === orders[index - 1] + 1,
    )
    if (isSequential) return 'sequential'

    const isReverse = [...orders]
      .reverse()
      .every((order, index) => index === 0 || order === orders[index - 1] - 1)
    if (isReverse) return 'reverse'

    return 'scattered'
  }
}
