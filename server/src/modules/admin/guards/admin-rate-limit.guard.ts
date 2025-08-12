import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common'
import { ADMIN_MESSAGES } from '../constants/admin-messages.const'

@Injectable()
export class AdminRateLimitGuard implements CanActivate {
  private requestCounts = new Map<
    string,
    { count: number; resetTime: number }
  >()

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest()
    const adminId = request.user?.id

    if (!adminId) {
      return true // Let other guards handle authentication
    }

    const key = `admin:${adminId}`
    const now = Date.now()
    const windowMs = 60 * 1000 // 1 minute window
    const maxRequests = 100 // Max 100 requests per minute

    const current = this.requestCounts.get(key)

    if (!current || now > current.resetTime) {
      // Reset or initialize
      this.requestCounts.set(key, {
        count: 1,
        resetTime: now + windowMs,
      })
      return true
    }

    if (current.count >= maxRequests) {
      throw new ForbiddenException(ADMIN_MESSAGES.AUTH.RATE_LIMIT_EXCEEDED)
    }

    current.count++
    return true
  }
}
