import { Module } from '@nestjs/common';
import { TaskService } from './task.service';
import { TaskController } from './task.controller';
import { TaskRepository } from './task.repository';
import { UserService } from '@user/user.service';
import { RoleService } from '@role/role.service';
import { UserRepository } from '@user/user.repository';
import { PrismaService } from '@core/prisma/prisma.service';

@Module({
  controllers: [TaskController],
  providers: [TaskService,TaskRepository,UserService,RoleService,UserRepository,PrismaService],
})
export class TaskModule {}
