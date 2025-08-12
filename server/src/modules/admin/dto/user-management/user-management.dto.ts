import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsOptional, IsString, IsBoolean, IsArray, IsEnum, IsUUID } from 'class-validator'
import { AdminPaginationDto, AdminFilterDto } from '../common/admin-pagination.dto'

export class UserFilterDto extends AdminFilterDto {
  @ApiPropertyOptional({ description: 'Filter by email' })
  @IsOptional()
  @IsString()
  email?: string

  @ApiPropertyOptional({ description: 'Filter by first name' })
  @IsOptional()
  @IsString()
  firstName?: string

  @ApiPropertyOptional({ description: 'Filter by last name' })
  @IsOptional()
  @IsString()
  lastName?: string

  @ApiPropertyOptional({ description: 'Filter by admin status' })
  @IsOptional()
  @IsBoolean()
  isAdmin?: boolean
}

export class UpdateUserDto {
  @ApiPropertyOptional({ description: 'User first name' })
  @IsOptional()
  @IsString()
  firstName?: string

  @ApiPropertyOptional({ description: 'User last name' })
  @IsOptional()
  @IsString()
  lastName?: string

  @ApiPropertyOptional({ description: 'User email' })
  @IsOptional()
  @IsString()
  email?: string

  @ApiPropertyOptional({ description: 'Admin status' })
  @IsOptional()
  @IsBoolean()
  isAdmin?: boolean
}

export class ToggleUserBlockDto {
  @ApiProperty({ description: 'Whether to block or unblock the user' })
  @IsBoolean()
  isBlocked: boolean
}

export class DeleteUserDto {
  @ApiPropertyOptional({ description: 'Whether to hard delete the user', default: false })
  @IsOptional()
  @IsBoolean()
  hardDelete?: boolean = false
}

export class BulkUserOperationDto {
  @ApiProperty({ description: 'Array of user IDs', type: [String] })
  @IsArray()
  @IsUUID('4', { each: true })
  userIds: string[]

  @ApiProperty({ description: 'Operation to perform', enum: ['block', 'unblock', 'delete'] })
  @IsEnum(['block', 'unblock', 'delete'])
  operation: 'block' | 'unblock' | 'delete'

  @ApiPropertyOptional({ description: 'Additional data for the operation' })
  @IsOptional()
  data?: any
}

export class UserResponseDto {
  @ApiProperty({ description: 'User ID' })
  id: string

  @ApiProperty({ description: 'User first name' })
  firstName: string

  @ApiProperty({ description: 'User last name' })
  lastName: string

  @ApiProperty({ description: 'User email' })
  email: string

  @ApiProperty({ description: 'Admin status' })
  isAdmin: boolean

  @ApiProperty({ description: 'Creation date' })
  createdAt: Date

  @ApiProperty({ description: 'Last update date' })
  updatedAt: Date

  @ApiProperty({ description: 'Number of companies' })
  companyCount: number

  @ApiProperty({ description: 'Number of tasks' })
  taskCount: number

  @ApiProperty({ description: 'Number of activities' })
  activityCount: number

  @ApiProperty({ description: 'User companies', type: [Object] })
  companies: Array<{
    id: string
    name: string
  }>
}

export class UserDetailResponseDto extends UserResponseDto {
  @ApiProperty({ description: 'User tasks', type: [Object] })
  tasks: Array<{
    id: string
    title: string
    createdAt: Date
    sheet: {
      id: string
      name: string
      company: {
        id: string
        name: string
      }
    }
  }>

  @ApiProperty({ description: 'User activity logs', type: [Object] })
  logs: Array<{
    id: string
    message: string
    createdAt: Date
    company: {
      id: string
      name: string
    }
  }>

  @ApiProperty({ description: 'User transactions', type: [Object] })
  transactions: Array<{
    id: string
    amount: number
    status: string
    createdAt: Date
    company: {
      id: string
      name: string
    }
  }>
}

export class UserStatisticsDto {
  @ApiProperty({ description: 'User ID' })
  userId: string

  @ApiProperty({ description: 'User email' })
  email: string

  @ApiProperty({ description: 'User full name' })
  name: string

  @ApiProperty({ description: 'Admin status' })
  isAdmin: boolean

  @ApiProperty({ description: 'User statistics' })
  statistics: {
    companies: number
    tasks: number
    activities: number
    transactions: number
    files: number
    totalSpent: number
    lastActivity: Date | null
  }
}

export class UserActivityResponseDto {
  @ApiProperty({ description: 'Activity logs', type: [Object] })
  logs: Array<{
    id: string
    message: string
    createdAt: Date
    company: {
      id: string
      name: string
    }
  }>

  @ApiProperty({ description: 'Pagination information' })
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}
