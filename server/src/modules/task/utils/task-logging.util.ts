/**
 * Task Logging Utilities
 * Advanced utilities for task operation logging and monitoring
 */

import { Logger } from '@nestjs/common'
import { TaskWithRelations } from '../types/task.types'
import { IUser } from '@user/dto/IUser'

export interface OperationMetrics {
  operation: string
  duration: number
  success: boolean
  timestamp: string
  userId?: string
  taskId?: string
  companyId?: string
  errorMessage?: string
}

export interface TaskOperationSummary {
  operation: string
  taskName?: string
  userName?: string
  companyId: string
  changes?: string[]
  fileCount?: number
  memberCount?: number
  complexity?: number
  businessImpact: 'high' | 'medium' | 'low'
}

export class TaskLoggingUtil {
  private static readonly logger = new Logger(TaskLoggingUtil.name)

  /**
   * Create a standardized operation summary for audit logs
   */
  static createOperationSummary(
    operation: string,
    user: IUser,
    companyId: string,
    task?: TaskWithRelations,
    additionalData?: Record<string, any>,
  ): TaskOperationSummary {
    const summary: TaskOperationSummary = {
      operation,
      companyId,
      taskName: task?.name,
      userName: `${user.id}`, // Could be enhanced with actual user name
      businessImpact: this.assessBusinessImpact(
        operation,
        task,
        additionalData,
      ),
    }

    if (task) {
      summary.memberCount = task.members?.length || 0
      summary.complexity = this.calculateTaskComplexity(task)
    }

    if (additionalData?.changes) {
      summary.changes = additionalData.changes
    }

    if (additionalData?.fileCount) {
      summary.fileCount = additionalData.fileCount
    }

    return summary
  }

  /**
   * Log performance metrics for monitoring
   */
  static logPerformanceMetrics(metrics: OperationMetrics): void {
    const logLevel = this.getLogLevel(metrics)
    const message = this.formatMetricsMessage(metrics)

    switch (logLevel) {
      case 'error':
        this.logger.error(message)
        break
      case 'warn':
        this.logger.warn(message)
        break
      case 'debug':
        this.logger.debug(message)
        break
      default:
        this.logger.log(message)
    }
  }

  /**
   * Create a structured log entry for audit trail
   */
  static createAuditLogEntry(
    summary: TaskOperationSummary,
    metrics: OperationMetrics,
    context?: Record<string, any>,
  ): Record<string, any> {
    return {
      timestamp: new Date().toISOString(),
      operation: summary.operation,
      taskName: summary.taskName,
      companyId: summary.companyId,
      businessImpact: summary.businessImpact,
      performance: {
        duration: metrics.duration,
        success: metrics.success,
      },
      details: {
        changes: summary.changes,
        fileCount: summary.fileCount,
        memberCount: summary.memberCount,
        complexity: summary.complexity,
      },
      context,
    }
  }

  /**
   * Assess the business impact of an operation
   */
  private static assessBusinessImpact(
    operation: string,
    task?: TaskWithRelations,
    additionalData?: Record<string, any>,
  ): 'high' | 'medium' | 'low' {
    // High impact operations
    if (['DELETE', 'MOVE'].includes(operation)) {
      return 'high'
    }

    // High impact if task has payment information
    if (task && ((task.price && task.price > 0) || task.paid)) {
      return 'high'
    }

    // High impact if many members involved
    if (task && task.members && task.members.length > 5) {
      return 'high'
    }

    // Medium impact operations
    if (['CREATE', 'UPDATE', 'REORDER'].includes(operation)) {
      // Check for significant changes
      if (additionalData?.changes?.length > 3) {
        return 'medium'
      }

      // Medium impact for tasks with custom fields
      if (task && this.hasSignificantCustomFields(task)) {
        return 'medium'
      }

      return 'medium'
    }

    return 'low'
  }

  /**
   * Calculate task complexity score
   */
  private static calculateTaskComplexity(task: TaskWithRelations): number {
    let complexity = 1 // Base complexity

    // Member complexity
    complexity += (task.members?.length || 0) * 0.5

    // Price complexity
    if (task.price && task.price > 0) complexity += 1
    if (task.paid) complexity += 0.5

    // Custom fields complexity
    const customFieldsUsed = this.countUsedCustomFields(task)
    complexity += customFieldsUsed * 0.3

    // Link complexity
    const links = task.links.filter(Boolean).length
    complexity += links * 0.2

    return Math.round(complexity * 10) / 10
  }

  /**
   * Count used custom fields
   */
  private static countUsedCustomFields(task: TaskWithRelations): number {
    let count = 0
    for (let i = 1; i <= 5; i++) {
      const fields = [
        `text${i}`,
        `number${i}`,
        `checkbox${i}`,
        `select${i}`,
        `date${i}`,
        `duedate${i}`,
      ]
      for (const field of fields) {
        if (
          task[field] !== null &&
          task[field] !== undefined &&
          task[field] !== ''
        ) {
          count++
        }
      }
    }
    return count
  }

  /**
   * Check if task has significant custom fields
   */
  private static hasSignificantCustomFields(task: TaskWithRelations): boolean {
    return this.countUsedCustomFields(task) > 3
  }

  /**
   * Determine appropriate log level based on metrics
   */
  private static getLogLevel(metrics: OperationMetrics): string {
    if (!metrics.success) return 'error'

    // Performance thresholds
    const slowThresholds = {
      CREATE: 1000,
      UPDATE: 500,
      DELETE: 300,
      REORDER: 2000,
      MOVE: 800,
      READ: 200,
    }

    const threshold = slowThresholds[metrics.operation] || 1000
    if (metrics.duration > threshold) return 'warn'
    if (metrics.duration > threshold * 0.7) return 'debug'

    return 'log'
  }

  /**
   * Format metrics message for logging
   */
  private static formatMetricsMessage(metrics: OperationMetrics): string {
    const status = metrics.success ? 'SUCCESS' : 'FAILED'
    const base = `Task ${metrics.operation} ${status}: ${metrics.duration}ms`

    if (metrics.taskId) {
      return `${base} (task: ${metrics.taskId}, user: ${metrics.userId})`
    }

    if (metrics.userId) {
      return `${base} (user: ${metrics.userId})`
    }

    return base
  }

  /**
   * Generate operation tags for categorization
   */
  static generateOperationTags(
    operation: string,
    task?: TaskWithRelations,
    context?: Record<string, any>,
  ): string[] {
    const tags: string[] = [operation.toLowerCase()]

    if (task) {
      // Task characteristics
      if (task.price && task.price > 0) tags.push('has-price')
      if (task.paid) tags.push('paid')
      if (task.members && task.members.length > 1) tags.push('multi-member')
      if (task.members && task.members.length === 0) tags.push('unassigned')
      if (this.hasSignificantCustomFields(task)) tags.push('complex')
    }

    // Context-based tags
    if (context?.fileCount > 0) tags.push('file-operation')
    if (context?.crossWorkspace) tags.push('cross-workspace')
    if (context?.bulkOperation) tags.push('bulk-operation')

    return tags
  }

  /**
   * Create a sanitized summary for external monitoring systems
   */
  static createMonitoringSummary(
    operation: string,
    success: boolean,
    duration: number,
    metadata?: Record<string, any>,
  ): Record<string, any> {
    return {
      metric: `task.${operation.toLowerCase()}`,
      success,
      duration,
      timestamp: Date.now(),
      metadata: {
        complexity: metadata?.complexity || 1,
        memberCount: metadata?.memberCount || 0,
        hasPrice: !!metadata?.hasPrice,
        changeCount: metadata?.changeCount || 0,
      },
    }
  }
}
