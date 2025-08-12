import { ApiProperty } from '@nestjs/swagger'

export class RevenueMetricsDto {
  @ApiProperty({ description: 'Total revenue' })
  total: number

  @ApiProperty({ description: 'Monthly revenue' })
  monthly: number

  @ApiProperty({ description: 'Annual revenue' })
  annual: number

  @ApiProperty({ description: 'Average transaction value' })
  averageTransaction: number

  @ApiProperty({ description: 'Payment success rate percentage' })
  successRate: number

  @ApiProperty({ description: 'Growth rate percentage' })
  growthRate: number
}

export class RevenueTrendDto {
  @ApiProperty({ description: 'Date in YYYY-MM-DD format' })
  date: string

  @ApiProperty({ description: 'Revenue for this date' })
  revenue: number
}

export class MRRAnalysisDto {
  @ApiProperty({ description: 'Current Monthly Recurring Revenue' })
  currentMRR: number

  @ApiProperty({ description: 'Previous month MRR' })
  previousMRR: number

  @ApiProperty({ description: 'MRR growth amount' })
  mrrGrowth: number

  @ApiProperty({ description: 'MRR growth rate percentage' })
  mrrGrowthRate: number
}

export class ARRAnalysisDto {
  @ApiProperty({ description: 'Current Annual Recurring Revenue' })
  currentARR: number

  @ApiProperty({ description: 'Previous year ARR' })
  previousARR: number

  @ApiProperty({ description: 'ARR growth amount' })
  arrGrowth: number

  @ApiProperty({ description: 'ARR growth rate percentage' })
  arrGrowthRate: number
}

export class ChurnAnalysisDto {
  @ApiProperty({ description: 'Number of active subscriptions' })
  activeSubscriptions: number

  @ApiProperty({ description: 'Number of churned subscriptions' })
  churnedSubscriptions: number

  @ApiProperty({ description: 'Total subscriptions' })
  totalSubscriptions: number

  @ApiProperty({ description: 'Churn rate percentage' })
  churnRate: number
}

export class PaymentMethodDistributionDto {
  @ApiProperty({ type: [Object], description: 'Payment method statistics' })
  paymentMethods: Array<{
    method: string
    count: number
    amount: number
    percentage: number
  }>

  @ApiProperty({ description: 'Total number of transactions' })
  totalTransactions: number

  @ApiProperty({ description: 'Total amount across all payment methods' })
  totalAmount: number
}

export class RevenueByPlanDto {
  @ApiProperty({ description: 'Plan name' })
  planName: string

  @ApiProperty({ description: 'Number of subscriptions on this plan' })
  count: number

  @ApiProperty({ description: 'Total revenue from this plan' })
  revenue: number

  @ApiProperty({ description: 'Percentage of total revenue from this plan' })
  percentage: number
}
