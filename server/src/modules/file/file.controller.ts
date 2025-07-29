import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common'
import {
  FileFieldsInterceptor,
  FileInterceptor,
} from '@nestjs/platform-express'
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger'
import { JwtAuthGuard } from '@guards/jwt-auth.guard'
import { User } from '@decorators/user.decorator'
import { IUser } from '@user/dto/IUser'
import { FileService } from './file.service'
import { DeleteFileDto } from './dto/delete-file.dto'
import { FileResponseDto } from './dto/file-response.dto'
import { FileUploadInterceptor } from '@core/interceptors/file-upload.interceptor'

@ApiBearerAuth()
@ApiTags('File')
@UseGuards(JwtAuthGuard)
@Controller({ path: 'file', version: '1' })
export class FileController {
  constructor(private readonly fileService: FileService) {}

  @Post('upload')
  @UseInterceptors(FileFieldsInterceptor([{ name: 'files', maxCount: 10 }]))
  @UseInterceptors(FileUploadInterceptor)
  @ApiOperation({ summary: 'Upload multiple files' })
  @ApiConsumes('multipart/form-data')
  async uploadFiles(
    @UploadedFiles() files: { files?: Express.Multer.File[] },
    @User() user: IUser,
    @Body() body: { taskId?: string; sheetId?: string; companyId: string },
  ): Promise<FileResponseDto[]> {
    if (!files.files || files.files.length === 0) {
      throw new BadRequestException('No files uploaded')
    }

    return this.fileService.uploadFiles(files.files, user, {
      taskId: body.taskId,
      sheetId: body.sheetId,
      companyId: body.companyId,
    })
  }

  @Post('upload/avatar')
  @UseInterceptors(FileInterceptor('avatar'))
  @ApiOperation({ summary: 'Upload user avatar' })
  @ApiConsumes('multipart/form-data')
  async uploadAvatar(
    @UploadedFile() file: Express.Multer.File,
    @User() user: IUser,
  ): Promise<FileResponseDto> {
    if (!file) {
      throw new BadRequestException('No avatar file uploaded')
    }

    return this.fileService.uploadAvatar(file, user)
  }

  @Post('delete')
  @ApiOperation({ summary: 'Delete files' })
  async deleteFiles(
    @Body() body: DeleteFileDto,
    @User() user: IUser,
  ): Promise<{ message: string }> {
    await this.fileService.deleteFiles(body.fileIds, user)
    return { message: 'Files deleted successfully' }
  }

  @Get('company/:companyId')
  @ApiOperation({ summary: 'Get files by company' })
  async getCompanyFiles(
    @Param('companyId') companyId: string,
    @User() user: IUser,
  ): Promise<FileResponseDto[]> {
    return this.fileService.getFilesByCompany(companyId, user)
  }

  @Get('task/:taskId')
  @ApiOperation({ summary: 'Get files by task' })
  async getTaskFiles(
    @Param('taskId') taskId: string,
    @User() user: IUser,
  ): Promise<FileResponseDto[]> {
    return this.fileService.getFilesByTask(taskId, user)
  }

  @Get('sheet/:sheetId')
  @ApiOperation({ summary: 'Get files by sheet' })
  async getSheetFiles(
    @Param('sheetId') sheetId: string,
    @User() user: IUser,
  ): Promise<FileResponseDto[]> {
    return this.fileService.getFilesBySheet(sheetId, user)
  }
}
