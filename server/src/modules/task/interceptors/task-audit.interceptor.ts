import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common'
import { Observable, throwError } from 'rxjs'
import { tap, catchError } from 'rxjs/operators'
import { TaskAuditService } from '../services/task-audit.service'
import { TASK_PERFORMANCE_THRESHOLDS } from '../constants/audit-constants'
import { TaskLoggingUtil, OperationMetrics } from '../utils/task-logging.util'

@Injectable()
export class TaskAuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(TaskAuditInterceptor.name)

  constructor(private readonly auditService: TaskAuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest()
    const handler = context.getHandler()
    const className = context.getClass().name
    const methodName = handler.name

    // Only intercept task-related operations
    if (className !== 'TaskController') {
      return next.handle()
    }

    const startTime = Date.now()
    const operation = this.getOperationType(methodName, request.method)
    const user = request.user
    const userAgent = request.get('User-Agent')
    const ipAddress = request.ip || request.connection.remoteAddress

    this.logger.log(
      `Starting ${operation} operation for user ${user?.id} from ${ipAddress}`,
    )

    return next.handle().pipe(
      tap((result) => {
        const endTime = Date.now()
        const duration = endTime - startTime

        // Create comprehensive metrics
        const metrics: OperationMetrics = {
          operation,
          duration,
          success: true,
          timestamp: new Date().toISOString(),
          userId: user?.id,
          taskId: this.extractTaskId(request, result),
          companyId: this.extractCompanyId(user),
        }

        // Log using our enhanced utilities
        TaskLoggingUtil.logPerformanceMetrics(metrics)

        // Create operation summary for audit trail
        if (user) {
          const summary = TaskLoggingUtil.createOperationSummary(
            operation,
            user,
            metrics.companyId || 'unknown',
            undefined, // Task data would need to be extracted from result
            {
              userAgent,
              ipAddress,
              duration,
              requestSize: JSON.stringify(request.body || {}).length,
            },
          )

          // Log audit entry
          const auditEntry = TaskLoggingUtil.createAuditLogEntry(
            summary,
            metrics,
            {
              userAgent,
              ipAddress,
              endpoint: `${request.method} ${request.url}`,
            },
          )

          this.logger.debug(`Audit entry: ${JSON.stringify(auditEntry)}`)
        }

        // Performance warning
        if (this.isSlowOperation(operation, duration)) {
          this.logger.warn(
            `Slow ${operation} operation detected: ${duration}ms (user: ${user?.id}, IP: ${ipAddress})`,
          )
        }

        // Create monitoring summary for external systems
        const monitoringSummary = TaskLoggingUtil.createMonitoringSummary(
          operation,
          true,
          duration,
          {
            hasResult: !!result,
            resultSize: JSON.stringify(result || {}).length,
          },
        )

        this.logger.debug(`Monitoring: ${JSON.stringify(monitoringSummary)}`)
      }),
      catchError((error) => {
        const endTime = Date.now()
        const duration = endTime - startTime

        // Create error metrics
        const metrics: OperationMetrics = {
          operation,
          duration,
          success: false,
          timestamp: new Date().toISOString(),
          userId: user?.id,
          taskId: this.extractTaskId(request),
          companyId: this.extractCompanyId(user),
          errorMessage: error.message,
        }

        // Log error using our enhanced utilities
        TaskLoggingUtil.logPerformanceMetrics(metrics)

        // Enhanced error logging
        this.logger.error(
          `Failed ${operation} operation: ${error.message} (duration: ${duration}ms, user: ${user?.id}, IP: ${ipAddress}, stack: ${error.stack?.substring(0, 200)}...)`,
        )

        // Create monitoring summary for failed operations
        const monitoringSummary = TaskLoggingUtil.createMonitoringSummary(
          operation,
          false,
          duration,
          {
            errorType: error.constructor.name,
            errorCode: error.status || 500,
          },
        )

        this.logger.debug(
          `Error monitoring: ${JSON.stringify(monitoringSummary)}`,
        )

        return throwError(() => error)
      }),
    )
  }

  private getOperationType(methodName: string, httpMethod: string): string {
    const operationMap: Record<string, string> = {
      createTask: 'CREATE',
      updateTask: 'UPDATE',
      deleteTask: 'DELETE',
      reorderTasks: 'REORDER',
      moveTask: 'MOVE',
      getTasksBySheet: 'READ',
    }

    return operationMap[methodName] || `${httpMethod}_UNKNOWN`
  }

  private isSlowOperation(operation: string, duration: number): boolean {
    const thresholds = {
      CREATE: TASK_PERFORMANCE_THRESHOLDS.CREATE_SLOW,
      UPDATE: TASK_PERFORMANCE_THRESHOLDS.UPDATE_SLOW,
      DELETE: TASK_PERFORMANCE_THRESHOLDS.DELETE_SLOW,
      REORDER: TASK_PERFORMANCE_THRESHOLDS.REORDER_SLOW,
      MOVE: TASK_PERFORMANCE_THRESHOLDS.MOVE_SLOW,
    }

    const threshold = thresholds[operation] || 1000
    return duration > threshold
  }

  private logPerformanceMetrics(
    operation: string,
    duration: number,
    success: boolean,
  ): void {
    const metrics = {
      operation,
      duration,
      success,
      timestamp: new Date().toISOString(),
    }

    // In a production environment, you might want to send these metrics
    // to a monitoring service like DataDog, New Relic, or CloudWatch
    this.logger.debug(`Task operation metrics: ${JSON.stringify(metrics)}`)
  }

  /**
   * Extract task ID from request parameters or response
   */
  private extractTaskId(request: any, result?: any): string | undefined {
    // Try to get from URL parameters first
    if (request.params?.id) {
      return request.params.id
    }

    // Try to get from request body
    if (request.body?.taskId) {
      return request.body.taskId
    }

    // Try to get from query parameters
    if (request.query?.taskId) {
      return request.query.taskId
    }

    // Try to get from response (for create operations)
    if (result?.id) {
      return result.id
    }

    // For bulk operations, try to get from taskId array
    if (request.body?.taskId && Array.isArray(request.body.taskId)) {
      return request.body.taskId[0] // Return first task ID for bulk operations
    }

    return undefined
  }

  /**
   * Extract company ID from user context
   */
  private extractCompanyId(user: any): string | undefined {
    // This would depend on how user context is structured
    // Might need to be enhanced based on actual user object structure
    return user?.companyId || user?.selectedRole?.companyId
  }
}
