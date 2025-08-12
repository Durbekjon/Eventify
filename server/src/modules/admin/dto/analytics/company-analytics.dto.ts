import { ApiProperty } from '@nestjs/swagger'

export class CompanyMetricsDto {
  @ApiProperty({ description: 'Total number of companies' })
  total: number

  @ApiProperty({ description: 'Number of active companies' })
  active: number

  @ApiProperty({ description: 'Number of blocked companies' })
  blocked: number

  @ApiProperty({ description: 'New companies this month' })
  newThisMonth: number

  @ApiProperty({ description: 'New companies this week' })
  newThisWeek: number

  @ApiProperty({ description: 'Growth rate percentage' })
  growthRate: number
}

export class CompanyGrowthTrendDto {
  @ApiProperty({ description: 'Date in YYYY-MM-DD format' })
  date: string

  @ApiProperty({ description: 'Number of new companies on this date' })
  newCompanies: number

  @ApiProperty({ description: 'Number of blocked companies on this date' })
  blockedCompanies: number
}

export class CompanyUsagePatternsDto {
  @ApiProperty({ description: 'Total number of companies' })
  totalCompanies: number

  @ApiProperty({ description: 'Average number of workspaces per company' })
  averageWorkspaces: number

  @ApiProperty({ description: 'Average number of sheets per company' })
  averageSheets: number

  @ApiProperty({ description: 'Average number of members per company' })
  averageMembers: number

  @ApiProperty({ description: 'Average number of tasks per company' })
  averageTasks: number

  @ApiProperty({ type: [Object], description: 'Detailed usage statistics per company' })
  usageStats: Array<{
    companyId: string
    companyName: string
    workspaces: number
    sheets: number
    members: number
    tasks: number
    planName: string
    planPrice: number
  }>
}

export class PlanDistributionDto {
  @ApiProperty({ description: 'Plan name' })
  plan: string

  @ApiProperty({ description: 'Number of companies on this plan' })
  count: number

  @ApiProperty({ description: 'Total revenue from this plan' })
  revenue: number

  @ApiProperty({ description: 'Percentage of companies on this plan' })
  percentage: number
}

export class CompanyHealthScoreDto {
  @ApiProperty({ description: 'Company ID' })
  companyId: string

  @ApiProperty({ description: 'Company name' })
  companyName: string

  @ApiProperty({ description: 'Health score (0-100)' })
  healthScore: number

  @ApiProperty({ description: 'Number of workspaces' })
  workspaces: number

  @ApiProperty({ description: 'Number of sheets' })
  sheets: number

  @ApiProperty({ description: 'Number of members' })
  members: number

  @ApiProperty({ description: 'Number of tasks' })
  tasks: number

  @ApiProperty({ description: 'Whether company has active subscription' })
  hasActiveSubscription: boolean

  @ApiProperty({ description: 'Whether company is blocked' })
  isBlocked: boolean
}

export class CompanyActivityMetricsDto {
  @ApiProperty({ description: 'Total number of companies' })
  totalCompanies: number

  @ApiProperty({ description: 'Companies active in last 30 days' })
  active30Days: number

  @ApiProperty({ description: 'Companies active in last 7 days' })
  active7Days: number

  @ApiProperty({ description: '30-day retention rate percentage' })
  retention30Days: number

  @ApiProperty({ description: '7-day retention rate percentage' })
  retention7Days: number
}
