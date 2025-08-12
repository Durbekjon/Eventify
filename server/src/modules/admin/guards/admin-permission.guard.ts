import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { ADMIN_MESSAGES } from '../constants/admin-messages.const'
import { AdminPermission } from '../types/admin-permissions.types'

@Injectable()
export class AdminPermissionGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.get<AdminPermission[]>(
      'adminPermissions',
      context.getHandler(),
    )

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true // No specific permissions required
    }

    const request = context.switchToHttp().getRequest()
    const user = request.user

    if (!user) {
      throw new ForbiddenException(ADMIN_MESSAGES.AUTH.ACCESS_DENIED)
    }

    // Super admin bypasses all permission checks
    if (user.isAdmin) {
      return true
    }

    // For now, we'll use the isAdmin flag as the primary permission check
    // In a more complex system, you might have granular permissions stored in the database
    if (!user.isAdmin) {
      throw new ForbiddenException(ADMIN_MESSAGES.AUTH.INVALID_PERMISSION)
    }

    return true
  }
}
