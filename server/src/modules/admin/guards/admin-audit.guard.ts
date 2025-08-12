import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common'
import { PrismaService } from '@/core/prisma/prisma.service'

@Injectable()
export class AdminAuditGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest()
    const adminId = request.user?.id
    const method = request.method
    const url = request.url
    const body = request.body
    const params = request.params
    const query = request.query

    // Only audit non-GET requests (modifications)
    if (method !== 'GET' && adminId) {
      try {
        await this.logAdminAction({
          adminId,
          action: `${method} ${url}`,
          resource: this.getResourceFromUrl(url),
          resourceId: params.id || body.id,
          details: {
            method,
            url,
            body: method !== 'GET' ? body : undefined,
            params,
            query,
            userAgent: request.headers['user-agent'],
            ip: request.ip,
          },
        })
      } catch (error) {
        // Don't block the request if audit logging fails
        console.error('Admin audit logging failed:', error)
      }
    }

    return true
  }

  private getResourceFromUrl(url: string): string {
    const parts = url.split('/')
    if (parts.length >= 3) {
      return parts[2] // Get the resource from /v1/admin/resource
    }
    return 'unknown'
  }

  private async logAdminAction(action: {
    adminId: string
    action: string
    resource: string
    resourceId?: string
    details?: Record<string, any>
  }) {
    // For now, we'll use the existing Log model
    // In a production environment, you might want a dedicated AdminAuditLog model
    await this.prisma.log.create({
      data: {
        message: `${action.action} on ${action.resource}`,
        userId: action.adminId,
        workspaceId: null,
        sheetId: null,
        taskId: null,
        newValue: action.resourceId || '',
        oldValue: '',
        updatedKey: action.resource,
      },
    })
  }
}
