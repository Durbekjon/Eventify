import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags, ApiParam, ApiQuery } from '@nestjs/swagger'
import { AdminGuard } from '@/guards/admin.guard'
import { AdminRateLimitGuard } from '../guards/admin-rate-limit.guard'
import { AdminAuditInterceptor } from '../interceptors/admin-audit.interceptor'
import { AdminLoggingInterceptor } from '../interceptors/admin-logging.interceptor'
import { UserManagementService } from '../services/user-management/user-management.service'
import { Admin } from '@/decorators/admin.decorator'
import { IUser } from '@/modules/user/dto/IUser'
import { RequireAdminPermission } from '../decorators/admin-permission.decorator'
import { AdminPermission } from '../types/admin-permissions.types'
import {
  UserFilterDto,
  UpdateUserDto,
  ToggleUserBlockDto,
  DeleteUserDto,
  BulkUserOperationDto,
  UserResponseDto,
  UserDetailResponseDto,
  UserStatisticsDto,
  UserActivityResponseDto,
} from '../dto/user-management/user-management.dto'

@ApiBearerAuth()
@ApiTags('Admin User Management')
@UseGuards(AdminGuard, AdminRateLimitGuard)
@UseInterceptors(AdminAuditInterceptor, AdminLoggingInterceptor)
@Controller({ path: 'admin/users', version: '1' })
export class UserManagementController {
  constructor(private readonly userManagementService: UserManagementService) {}

  @Get()
  @ApiOperation({ summary: 'Get users with pagination and filtering' })
  @RequireAdminPermission(AdminPermission.VIEW_USERS)
  async getUsers(
    @Admin() admin: IUser,
    @Query() filters: UserFilterDto,
  ) {
    return this.userManagementService.getUsers(
      filters.page,
      filters.limit,
      filters,
    )
  }

  @Get(':userId')
  @ApiOperation({ summary: 'Get user by ID with detailed information' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @RequireAdminPermission(AdminPermission.VIEW_USERS)
  async getUserById(
    @Admin() admin: IUser,
    @Param('userId') userId: string,
  ) {
    return this.userManagementService.getUserById(userId)
  }

  @Put(':userId')
  @ApiOperation({ summary: 'Update user information' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @RequireAdminPermission(AdminPermission.MANAGE_USERS)
  async updateUser(
    @Admin() admin: IUser,
    @Param('userId') userId: string,
    @Body() updateData: UpdateUserDto,
  ) {
    return this.userManagementService.updateUser(userId, updateData)
  }

  @Post(':userId/block')
  @ApiOperation({ summary: 'Block or unblock user' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @RequireAdminPermission(AdminPermission.BLOCK_USERS)
  async toggleUserBlock(
    @Admin() admin: IUser,
    @Param('userId') userId: string,
    @Body() blockData: ToggleUserBlockDto,
  ) {
    return this.userManagementService.toggleUserBlock(userId, blockData.isBlocked)
  }

  @Delete(':userId')
  @ApiOperation({ summary: 'Delete user (soft or hard delete)' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @RequireAdminPermission(AdminPermission.DELETE_USERS)
  async deleteUser(
    @Admin() admin: IUser,
    @Param('userId') userId: string,
    @Body() deleteData: DeleteUserDto,
  ) {
    return this.userManagementService.deleteUser(userId, deleteData.hardDelete)
  }

  @Get(':userId/activity')
  @ApiOperation({ summary: 'Get user activity logs' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @RequireAdminPermission(AdminPermission.VIEW_USERS)
  async getUserActivity(
    @Admin() admin: IUser,
    @Param('userId') userId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.userManagementService.getUserActivity(userId, page || 1, limit || 20)
  }

  @Get(':userId/statistics')
  @ApiOperation({ summary: 'Get user statistics' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @RequireAdminPermission(AdminPermission.VIEW_USERS)
  async getUserStatistics(
    @Admin() admin: IUser,
    @Param('userId') userId: string,
  ) {
    return this.userManagementService.getUserStatistics(userId)
  }

  @Post('bulk')
  @ApiOperation({ summary: 'Perform bulk operations on users' })
  @RequireAdminPermission(AdminPermission.MANAGE_USERS)
  async bulkUserOperations(
    @Admin() admin: IUser,
    @Body() bulkData: BulkUserOperationDto,
  ) {
    return this.userManagementService.bulkUserOperations(
      bulkData.userIds,
      bulkData.operation,
      bulkData.data,
    )
  }
}
