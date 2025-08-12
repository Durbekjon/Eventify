export interface AdminMetrics {
  users: UserMetrics
  companies: CompanyMetrics
  subscriptions: SubscriptionMetrics
  revenue: RevenueMetrics
  system: SystemMetrics
  timestamp: Date
}

export interface UserMetrics {
  total: number
  active: number
  inactive: number
  admin: number
  newThisMonth: number
  newThisWeek: number
  growthRate: number
}

export interface CompanyMetrics {
  total: number
  active: number
  blocked: number
  newThisMonth: number
  newThisWeek: number
  growthRate: number
}

export interface SubscriptionMetrics {
  total: number
  active: number
  expired: number
  trial: number
  paid: number
  churnRate: number
}

export interface RevenueMetrics {
  total: number
  monthly: number
  annual: number
  averageTransaction: number
  successRate: number
  growthRate: number
}

export interface SystemMetrics {
  uptime: number
  responseTime: number
  errorRate: number
  activeConnections: number
  databaseHealth: string
}

export interface AdminDashboardData {
  overview: AdminOverview
  recentActivity: AdminActivity[]
  alerts: AdminAlert[]
  quickStats: QuickStats
}

export interface AdminOverview {
  totalUsers: number
  totalCompanies: number
  totalTasks: number
  activeSubscriptions: number
  totalRevenue: number
  systemStatus: string
}

export interface AdminActivity {
  id: string
  type: string
  description: string
  timestamp: Date
  adminId: string
  resourceId?: string
  details?: Record<string, any>
}

export interface AdminAlert {
  id: string
  type: 'info' | 'warning' | 'error' | 'success'
  title: string
  message: string
  timestamp: Date
  isRead: boolean
}

export interface QuickStats {
  usersToday: number
  companiesToday: number
  revenueToday: number
  errorsToday: number
}
