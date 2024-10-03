import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
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

@ApiBearerAuth()
@ApiTags('Task')
@UseGuards(JwtAuthGuard)
@Controller({ path: 'task', version: '1' })
export class TaskController {
  constructor(private readonly service: TaskService) {}

  @Post()
  @ApiOperation({ summary: 'Create task' })
  @ApiResponse({ type: () => TaskResponseDto })
  createTask(@User() user: IUser, @Body() body: CreateTaskDto): Promise<Task> {
    return this.service.createTask(body, user)
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

  @Delete(':id')
  @ApiOperation({ summary: 'Delete task' })
  @ApiResponse({ type: () => DeleteTaskResponseDto })
  deleteTask(@User() user: IUser, @Param('id') id: string) {
    return this.service.deleteTask(id, user)
  }
}
