import { ApiProperty } from '@nestjs/swagger'

export class UserMetricsDto {
  @ApiProperty({ description: 'Total number of users' })
  total: number

  @ApiProperty({ description: 'Number of active users (last 30 days)' })
  active: number

  @ApiProperty({ description: 'Number of inactive users' })
  inactive: number

  @ApiProperty({ description: 'Number of admin users' })
  admin: number

  @ApiProperty({ description: 'New users this month' })
  newThisMonth: number

  @ApiProperty({ description: 'New users this week' })
  newThisWeek: number

  @ApiProperty({ description: 'Growth rate percentage' })
  growthRate: number
}

export class UserGrowthTrendDto {
  @ApiProperty({ description: 'Date in YYYY-MM-DD format' })
  date: string

  @ApiProperty({ description: 'Number of new users on this date' })
  newUsers: number

  @ApiProperty({ description: 'Number of new admin users on this date' })
  newAdmins: number
}

export class UserEngagementDto {
  @ApiProperty({ description: 'Total number of users' })
  totalUsers: number

  @ApiProperty({ description: 'Users active in last 30 days' })
  active30Days: number

  @ApiProperty({ description: 'Users active in last 7 days' })
  active7Days: number

  @ApiProperty({ description: 'Users active in last 24 hours' })
  active1Day: number

  @ApiProperty({ description: '30-day retention rate percentage' })
  retention30Days: number

  @ApiProperty({ description: '7-day retention rate percentage' })
  retention7Days: number

  @ApiProperty({ description: '1-day retention rate percentage' })
  retention1Day: number
}

export class UserGeographicDistributionDto {
  @ApiProperty({ type: [Object], description: 'Regional distribution data' })
  regions: Array<{
    region: string
    count: number
    percentage: number
  }>
}

export class UserActivityByTimeDto {
  @ApiProperty({ description: 'Hour of day (0-23)' })
  hour: number

  @ApiProperty({ description: 'Activity count for this hour' })
  activity: number
}
