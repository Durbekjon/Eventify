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
} from '@nestjs/common'
import { TaskService } from './task.service'
import { CreateTaskDto } from './dto/create-task.dto'
import { UpdateTaskDto } from './dto/update-task.dto'
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger'
import { User } from '@decorators/user.decorator'
import { IUser } from '@user/dto/IUser'
import { JwtAuthGuard } from '@guards/jwt-auth.guard'
import { Task } from '@prisma/client'
import { DeleteTaskResponseDto, TaskResponseDto } from './dto/task-reponse.dto'
import { TaskReorderDto } from './dto/reorder-tasks.dto'
import { TaskQueryDto } from './dto/query.task.dto'
import { MoveTaskDto } from './dto/move-task.dto'

@ApiBearerAuth()
@ApiTags('Task')
@UseGuards(JwtAuthGuard)
@Controller({ path: 'task', version: '1' })
export class TaskController {
  constructor(private readonly service: TaskService) {}

  @Get(':id')
  @ApiOperation({ summary: 'Get tasks by sheet id' })
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
}
