import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Delete,
  UseGuards,
  Put,
  Body,
  Query,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
} from '@nestjs/common'
import { TaskService } from './task.service'
import { CreateTaskDto } from './dto/create-task.dto'
import { UpdateTaskDto } from './dto/update-task.dto'
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger'
import { User } from '@decorators/user.decorator'
import { IUser } from '@user/dto/IUser'
import { JwtAuthGuard } from '@guards/jwt-auth.guard'
import { Task } from '@prisma/client'
import { DeleteTaskResponseDto, TaskResponseDto } from './dto/task-reponse.dto'
import { TaskReorderDto } from './dto/reorder-tasks.dto'
import { TaskQueryDto } from './dto/query.task.dto'
import { MoveTaskDto } from './dto/move-task.dto'
import { FileResponseDto } from '../file/dto/file-response.dto'
import { FilesInterceptor } from '@nestjs/platform-express'
import { TaskAuditInterceptor } from './interceptors/task-audit.interceptor'

@ApiBearerAuth()
@ApiTags('Task')
@UseGuards(JwtAuthGuard)
@UseInterceptors(TaskAuditInterceptor)
@Controller({ path: 'task', version: '1' })
export class TaskController {
  constructor(private readonly service: TaskService) {}
  @Get(':id')
  @ApiOperation({ summary: 'Get tasks by sheet id with search' })
  getTasksBySheet(
    @User() user: IUser,
    @Param('id') id: string,
    @Query() query: TaskQueryDto,
  ) {
    return this.service.getTasksBySheet(user, id, query)
  }

  @Post()
  @ApiOperation({ summary: 'Create task' })
  @ApiResponse({ type: () => TaskResponseDto })
  createTask(@User() user: IUser, @Body() body: CreateTaskDto): Promise<Task> {
    return this.service.createTask(body, user)
  }

  @Post('upload')
  @UseInterceptors(FilesInterceptor('files', 10))
  @ApiOperation({ summary: 'Upload multiple files to a task' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
          description: 'Multiple files to upload to the task (max 10 files)',
        },
        taskId: {
          type: 'string',
          format: 'uuid',
          description: 'Task ID to attach files to',
        },
      },
      required: ['files', 'taskId'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Files uploaded successfully',
    type: [FileResponseDto],
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - invalid input or no files',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - user does not have access to the task',
  })
  async uploadTaskFiles(
    @UploadedFiles() files: Express.Multer.File[],
    @User() user: IUser,
    @Body() body: { taskId: string },
  ) {
    return this.service.uploadFilesAndUpdateTask(body.taskId, files, {}, user)
  }

  @Patch('move')
  @ApiOperation({ summary: 'Move task to another workspace' })
  moveTask(@User() user: IUser, @Body() body: MoveTaskDto) {
    return this.service.moveTask(user, body)
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update task' })
  @ApiResponse({ type: () => TaskResponseDto })
  updateTask(
    @User() user: IUser,
    @Param('id') id: string,
    @Body() body: UpdateTaskDto,
  ): Promise<Task> {
    return this.service.updateTask(id, body, user)
  }

  @Put('reorder')
  @ApiOperation({ summary: 'Reorder tasks' })
  reorderTasks(@User() user: IUser, @Body() body: TaskReorderDto) {
    return this.service.reorderTasks(user, body)
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete task' })
  @ApiResponse({ type: () => DeleteTaskResponseDto })
  deleteTask(@User() user: IUser, @Param('id') id: string) {
    return this.service.deleteTask(id, user)
  }

  @Get(':id/files')
  @ApiOperation({ summary: 'Get files attached to a specific task' })
  @ApiResponse({
    status: 200,
    description: 'Files retrieved successfully',
    type: [FileResponseDto],
  })
  async getTaskFiles(@User() user: IUser, @Param('id') taskId: string) {
    return this.service.getTaskFiles(taskId, user)
  }

  @Delete(':id/files')
  @ApiOperation({ summary: 'Delete files from a task' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        fileIds: {
          type: 'array',
          items: { type: 'string', format: 'uuid' },
          description: 'Array of file IDs to delete',
        },
      },
      required: ['fileIds'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Files deleted successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', description: 'Success message' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - no file IDs provided',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - user does not have access to delete these files',
  })
  async deleteTaskFiles(
    @User() user: IUser,
    @Param('id') taskId: string,
    @Body() body: { fileIds: string[] },
  ) {
    if (!body.fileIds || body.fileIds.length === 0) {
      throw new BadRequestException('No file IDs provided')
    }

    await this.service.deleteTaskFiles(body.fileIds, user)
    return { message: 'Files deleted successfully' }
  }
}
