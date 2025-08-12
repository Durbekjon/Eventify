import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common'
import { Observable, of } from 'rxjs'
import { tap } from 'rxjs/operators'

@Injectable()
export class AdminCacheInterceptor implements NestInterceptor {
  private cache = new Map<string, { data: any; timestamp: number }>()
  private readonly CACHE_TTL = 5 * 60 * 1000 // 5 minutes

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest()
    const method = request.method
    const url = request.url

    // Only cache GET requests
    if (method !== 'GET') {
      return next.handle()
    }

    const cacheKey = this.generateCacheKey(request)
    const cached = this.cache.get(cacheKey)

    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return of(cached.data)
    }

    return next.handle().pipe(
      tap((response) => {
        this.cache.set(cacheKey, {
          data: response,
          timestamp: Date.now(),
        })
      }),
    )
  }

  private generateCacheKey(request: any): string {
    const { method, url, query, user } = request
    const adminId = user?.id || 'anonymous'
    
    // Create a unique key based on method, URL, query params, and admin ID
    const queryString = Object.keys(query)
      .sort()
      .map(key => `${key}=${query[key]}`)
      .join('&')
    
    return `${method}:${url}:${queryString}:${adminId}`
  }

  /**
   * Clear cache for specific patterns
   */
  clearCache(pattern?: string): void {
    if (pattern) {
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          this.cache.delete(key)
        }
      }
    } else {
      this.cache.clear()
    }
  }
}
