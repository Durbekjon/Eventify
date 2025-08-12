import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsOptional, IsString, IsBoolean, IsArray, IsEnum, IsUUID } from 'class-validator'
import { AdminPaginationDto, AdminFilterDto } from '../common/admin-pagination.dto'

export class CompanyFilterDto extends AdminFilterDto {
  @ApiPropertyOptional({ description: 'Filter by company name' })
  @IsOptional()
  @IsString()
  name?: string

  @ApiPropertyOptional({ description: 'Filter by blocked status' })
  @IsOptional()
  @IsBoolean()
  isBlocked?: boolean

  @ApiPropertyOptional({ description: 'Filter by author ID' })
  @IsOptional()
  @IsUUID('4')
  authorId?: string

  @ApiPropertyOptional({ description: 'Filter by plan ID' })
  @IsOptional()
  @IsUUID('4')
  planId?: string
}

export class UpdateCompanyDto {
  @ApiPropertyOptional({ description: 'Company name' })
  @IsOptional()
  @IsString()
  name?: string

  @ApiPropertyOptional({ description: 'Company description' })
  @IsOptional()
  @IsString()
  description?: string

  @ApiPropertyOptional({ description: 'Blocked status' })
  @IsOptional()
  @IsBoolean()
  isBlocked?: boolean
}

export class ToggleCompanyBlockDto {
  @ApiProperty({ description: 'Whether to block or unblock the company' })
  @IsBoolean()
  isBlocked: boolean
}

export class DeleteCompanyDto {
  @ApiPropertyOptional({ description: 'Whether to hard delete the company', default: false })
  @IsOptional()
  @IsBoolean()
  hardDelete?: boolean = false
}

export class BulkCompanyOperationDto {
  @ApiProperty({ description: 'Array of company IDs', type: [String] })
  @IsArray()
  @IsUUID('4', { each: true })
  companyIds: string[]

  @ApiProperty({ description: 'Operation to perform', enum: ['block', 'unblock', 'delete'] })
  @IsEnum(['block', 'unblock', 'delete'])
  operation: 'block' | 'unblock' | 'delete'

  @ApiPropertyOptional({ description: 'Additional data for the operation' })
  @IsOptional()
  data?: any
}

export class CompanyResponseDto {
  @ApiProperty({ description: 'Company ID' })
  id: string

  @ApiProperty({ description: 'Company name' })
  name: string

  @ApiProperty({ description: 'Company description' })
  description: string

  @ApiProperty({ description: 'Blocked status' })
  isBlocked: boolean

  @ApiProperty({ description: 'Creation date' })
  createdAt: Date

  @ApiProperty({ description: 'Last update date' })
  updatedAt: Date

  @ApiProperty({ description: 'Number of workspaces' })
  workspaceCount: number

  @ApiProperty({ description: 'Number of sheets' })
  sheetCount: number

  @ApiProperty({ description: 'Number of members' })
  memberCount: number

  @ApiProperty({ description: 'Number of tasks' })
  taskCount: number

  @ApiProperty({ description: 'Number of transactions' })
  transactionCount: number

  @ApiProperty({ description: 'Company author' })
  author: {
    id: string
    firstName: string
    lastName: string
    email: string
  }

  @ApiProperty({ description: 'Current plan' })
  currentPlan: {
    id: string
    name: string
    price: number
  } | null
}

export class CompanyDetailResponseDto extends CompanyResponseDto {
  @ApiProperty({ description: 'Company subscriptions', type: [Object] })
  subscriptions: Array<{
    id: string
    startDate: Date
    endDate: Date | null
    isExpired: boolean
    plan: {
      id: string
      name: string
      price: number
    }
  }>

  @ApiProperty({ description: 'Company workspaces', type: [Object] })
  workspaces: Array<{
    id: string
    name: string
    createdAt: Date
    _count: {
      sheets: number
    }
  }>

  @ApiProperty({ description: 'Company members', type: [Object] })
  members: Array<{
    id: string
    type: string
    createdAt: Date
    user: {
      id: string
      firstName: string
      lastName: string
      email: string
    }
  }>

  @ApiProperty({ description: 'Company transactions', type: [Object] })
  transactions: Array<{
    id: string
    amount: number
    status: string
    createdAt: Date
    plan: {
      id: string
      name: string
    }
  }>
}

export class CompanyUsageDto {
  @ApiProperty({ description: 'Company ID' })
  companyId: string

  @ApiProperty({ description: 'Company name' })
  companyName: string

  @ApiProperty({ description: 'Current plan' })
  currentPlan: {
    id: string
    name: string
    price: number
    maxWorkspaces: number
    maxSheets: number
    maxMembers: number
    maxViewers: number
    maxTasks: number
  } | null

  @ApiProperty({ description: 'Usage statistics' })
  usage: {
    workspaces: {
      used: number
      limit: number
      percentage: number
    }
    sheets: {
      used: number
      limit: number
      percentage: number
    }
    members: {
      used: number
      limit: number
      percentage: number
    }
    viewers: {
      used: number
      limit: number
      percentage: number
    }
    tasks: {
      used: number
      limit: number
      percentage: number
    }
  }

  @ApiProperty({ description: 'Total members' })
  totalMembers: number
}

export class CompanyFinancialDto {
  @ApiProperty({ description: 'Company ID' })
  companyId: string

  @ApiProperty({ description: 'Company name' })
  companyName: string

  @ApiProperty({ description: 'Financial information' })
  financial: {
    totalSpent: number
    monthlyRevenue: number
    transactionCount: number
    currentPlan: string
    currentPlanPrice: number
  }
}

export class CompanyActivityResponseDto {
  @ApiProperty({ description: 'Activity logs', type: [Object] })
  logs: Array<{
    id: string
    message: string
    createdAt: Date
    user: {
      id: string
      firstName: string
      lastName: string
      email: string
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
