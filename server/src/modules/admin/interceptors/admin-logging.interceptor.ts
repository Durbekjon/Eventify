import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common'
import { Observable, throwError } from 'rxjs'
import { tap, catchError } from 'rxjs/operators'

@Injectable()
export class AdminLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AdminLoggingInterceptor.name)

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest()
    const { method, url, user } = request
    const adminId = user?.id || 'anonymous'
    const startTime = Date.now()

    this.logger.log(`Admin ${method} ${url} - Admin: ${adminId} - Started`)

    return next.handle().pipe(
      tap((response) => {
        const duration = Date.now() - startTime
        this.logger.log(
          `Admin ${method} ${url} - Admin: ${adminId} - Completed in ${duration}ms`,
        )
      }),
      catchError((error) => {
        const duration = Date.now() - startTime
        this.logger.error(
          `Admin ${method} ${url} - Admin: ${adminId} - Failed in ${duration}ms - Error: ${error.message}`,
          error.stack,
        )
        return throwError(() => error)
      }),
    )
  }
}
