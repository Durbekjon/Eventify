import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  BadRequestException,
} from '@nestjs/common'
import { Observable } from 'rxjs'
import { FILE_UPLOAD_CONFIG, FILE_ERROR_MESSAGES } from '@consts/file-upload'

@Injectable()
export class FileUploadInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest()
    const files = request.files

    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded')
    }

    if (files.length > FILE_UPLOAD_CONFIG.MAX_FILES_PER_REQUEST) {
      throw new BadRequestException(FILE_ERROR_MESSAGES.TOO_MANY_FILES)
    }

    return next.handle()
  }
}
