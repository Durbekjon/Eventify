/**
 * Task Audit Middleware
 * Provides detailed request/response logging for task operations
 */

import { Injectable, NestMiddleware, Logger } from '@nestjs/common'
import { Request, Response, NextFunction } from 'express'

interface AuditRequest extends Request {
  startTime?: number
  requestId?: string
  user?: any
}

interface RequestAuditData {
  requestId: string
  method: string
  url: string
  userAgent: string
  ipAddress: string
  userId?: string
  bodySize: number
  timestamp: string
}

interface ResponseAuditData {
  requestId: string
  statusCode: number
  responseSize: number
  duration: number
  timestamp: string
}

@Injectable()
export class TaskAuditMiddleware implements NestMiddleware {
  private readonly logger = new Logger(TaskAuditMiddleware.name)

  use(req: AuditRequest, res: Response, next: NextFunction): void {
    // Only apply to task routes
    if (!req.url.includes('/task')) {
      return next()
    }

    // Generate unique request ID
    req.requestId = this.generateRequestId()
    req.startTime = Date.now()

    // Capture request details
    const requestAudit = this.captureRequestData(req)
    this.logRequestStart(requestAudit)

    // Capture original send method
    const originalSend = res.send
    const originalJson = res.json

    // Override response methods to capture response data
    res.send = function (body: any) {
      const responseAudit = {
        requestId: req.requestId!,
        statusCode: res.statusCode,
        responseSize: JSON.stringify(body || {}).length,
        duration: Date.now() - (req.startTime || Date.now()),
        timestamp: new Date().toISOString(),
      }

      // Log response details
      this.logResponseEnd(responseAudit, req.method, res.statusCode >= 400)

      return originalSend.call(this, body)
    }.bind(this)

    res.json = function (body: any) {
      const responseAudit = {
        requestId: req.requestId!,
        statusCode: res.statusCode,
        responseSize: JSON.stringify(body || {}).length,
        duration: Date.now() - (req.startTime || Date.now()),
        timestamp: new Date().toISOString(),
      }

      // Log response details
      this.logResponseEnd(responseAudit, req.method, res.statusCode >= 400)

      return originalJson.call(this, body)
    }.bind(this)

    // Handle response finish event
    res.on('finish', () => {
      if (!res.headersSent) {
        const responseAudit = {
          requestId: req.requestId!,
          statusCode: res.statusCode,
          responseSize: 0,
          duration: Date.now() - (req.startTime || Date.now()),
          timestamp: new Date().toISOString(),
        }

        this.logResponseEnd(responseAudit, req.method, res.statusCode >= 400)
      }
    })

    next()
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Capture request data for audit
   */
  private captureRequestData(req: AuditRequest): RequestAuditData {
    return {
      requestId: req.requestId!,
      method: req.method,
      url: req.url,
      userAgent: req.get('User-Agent') || 'unknown',
      ipAddress: req.ip || req.connection.remoteAddress || 'unknown',
      userId: req.user?.id,
      bodySize: JSON.stringify(req.body || {}).length,
      timestamp: new Date().toISOString(),
    }
  }

  /**
   * Log request start
   */
  private logRequestStart(requestAudit: RequestAuditData): void {
    const logData = {
      event: 'request_start',
      ...requestAudit,
      sensitive_data_sanitized: this.containsSensitiveData(requestAudit.url),
    }

    this.logger.log(
      `[${requestAudit.requestId}] ${requestAudit.method} ${requestAudit.url} - START`,
    )
    this.logger.debug(`Request audit: ${JSON.stringify(logData)}`)
  }

  /**
   * Log response end
   */
  private logResponseEnd(
    responseAudit: ResponseAuditData,
    method: string,
    isError: boolean,
  ): void {
    const logData = {
      event: 'response_end',
      ...responseAudit,
      performance_category: this.categorizePerformance(responseAudit.duration),
      is_slow_request: responseAudit.duration > 1000,
    }

    const logLevel = this.getLogLevel(
      responseAudit.statusCode,
      responseAudit.duration,
    )
    const message = `[${responseAudit.requestId}] ${method} ${responseAudit.statusCode} - END (${responseAudit.duration}ms)`

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

    this.logger.debug(`Response audit: ${JSON.stringify(logData)}`)

    // Create monitoring summary for external systems
    const monitoringSummary = {
      metric: 'task.request.completed',
      success: !isError,
      duration: responseAudit.duration,
      statusCode: responseAudit.statusCode,
      timestamp: Date.now(),
      metadata: {
        responseSize: responseAudit.responseSize,
        performanceCategory: logData.performance_category,
      },
    }

    this.logger.debug(
      `Request monitoring: ${JSON.stringify(monitoringSummary)}`,
    )
  }

  /**
   * Check if URL contains sensitive data patterns
   */
  private containsSensitiveData(url: string): boolean {
    const sensitivePatterns = [
      /password/i,
      /token/i,
      /secret/i,
      /key/i,
      /auth/i,
    ]

    return sensitivePatterns.some((pattern) => pattern.test(url))
  }

  /**
   * Categorize performance based on duration
   */
  private categorizePerformance(duration: number): string {
    if (duration < 100) return 'fast'
    if (duration < 500) return 'normal'
    if (duration < 1000) return 'slow'
    if (duration < 5000) return 'very_slow'
    return 'critical'
  }

  /**
   * Determine appropriate log level
   */
  private getLogLevel(statusCode: number, duration: number): string {
    // Error status codes
    if (statusCode >= 500) return 'error'
    if (statusCode >= 400) return 'warn'

    // Performance-based logging
    if (duration > 5000) return 'error'
    if (duration > 2000) return 'warn'
    if (duration > 1000) return 'debug'

    return 'log'
  }
}

/**
 * Security and Privacy Utilities for Audit Logging
 */
export class AuditSecurityUtil {
  /**
   * Sanitize sensitive data from request body
   */
  static sanitizeRequestBody(body: any): any {
    if (!body || typeof body !== 'object') {
      return body
    }

    const sanitized = { ...body }
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'auth']

    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]'
      }
    }

    return sanitized
  }

  /**
   * Hash sensitive identifiers for privacy-compliant logging
   */
  static hashSensitiveId(id: string): string {
    // Simple hash for demonstration - use proper cryptographic hash in production
    return `hash_${Buffer.from(id).toString('base64').substr(0, 8)}`
  }

  /**
   * Check if request requires special audit attention
   */
  static requiresSpecialAudit(
    method: string,
    url: string,
    statusCode: number,
  ): boolean {
    // High-value operations that require detailed auditing
    const criticalOperations = [
      'DELETE',
      'PUT /task/reorder',
      'PATCH /task/move',
    ]

    const operation = `${method} ${url}`
    return (
      criticalOperations.some((critical) => operation.includes(critical)) ||
      statusCode >= 400
    )
  }

  /**
   * Generate compliance-friendly audit summary
   */
  static generateComplianceSummary(
    requestAudit: RequestAuditData,
    responseAudit: ResponseAuditData,
  ): Record<string, any> {
    return {
      audit_id: requestAudit.requestId,
      timestamp: requestAudit.timestamp,
      operation: `${requestAudit.method} ${requestAudit.url}`,
      user_hash: requestAudit.userId
        ? this.hashSensitiveId(requestAudit.userId)
        : null,
      ip_address: requestAudit.ipAddress,
      success: responseAudit.statusCode < 400,
      response_time_ms: responseAudit.duration,
      data_accessed: requestAudit.url.includes('/task/'),
      data_modified: ['POST', 'PUT', 'PATCH', 'DELETE'].includes(
        requestAudit.method,
      ),
      compliance_flags: {
        gdpr_relevant: !!requestAudit.userId,
        high_risk_operation: this.requiresSpecialAudit(
          requestAudit.method,
          requestAudit.url,
          responseAudit.statusCode,
        ),
        performance_concern: responseAudit.duration > 2000,
      },
    }
  }
}
