import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common'
import { Observable } from 'rxjs'
import { tap } from 'rxjs/operators'
import { PrismaService } from '@/core/prisma/prisma.service'

@Injectable()
export class AdminAuditInterceptor implements NestInterceptor {
  constructor(private readonly prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest()
    const adminId = request.user?.id
    const method = request.method
    const url = request.url

    // Only audit non-GET requests
    if (method === 'GET' || !adminId) {
      return next.handle()
    }

    const startTime = Date.now()

    return next.handle().pipe(
      tap(async (response) => {
        try {
          const duration = Date.now() - startTime

          await this.logAdminAction({
            adminId,
            action: `${method} ${url}`,
            resource: this.getResourceFromUrl(url),
            resourceId: request.params.id || request.body?.id,
            details: {
              method,
              url,
              duration,
              status: 'success',
              responseSize: JSON.stringify(response).length,
              userAgent: request.headers['user-agent'],
              ip: request.ip,
            },
          })
        } catch (error) {
          console.error('Admin audit interceptor failed:', error)
        }
      }),
    )
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
