export enum AdminPermission {
  // User Management
  VIEW_USERS = 'admin:users:view',
  MANAGE_USERS = 'admin:users:manage',
  BLOCK_USERS = 'admin:users:block',
  DELETE_USERS = 'admin:users:delete',

  // Company Management
  VIEW_COMPANIES = 'admin:companies:view',
  MANAGE_COMPANIES = 'admin:companies:manage',
  BLOCK_COMPANIES = 'admin:companies:block',
  DELETE_COMPANIES = 'admin:companies:delete',

  // Subscription Management
  VIEW_SUBSCRIPTIONS = 'admin:subscriptions:view',
  MANAGE_SUBSCRIPTIONS = 'admin:subscriptions:manage',
  EXTEND_SUBSCRIPTIONS = 'admin:subscriptions:extend',
  SUSPEND_SUBSCRIPTIONS = 'admin:subscriptions:suspend',

  // Analytics & Dashboard
  VIEW_DASHBOARD = 'admin:dashboard:view',
  VIEW_ANALYTICS = 'admin:analytics:view',
  EXPORT_DATA = 'admin:data:export',

  // System Management
  VIEW_SYSTEM = 'admin:system:view',
  MANAGE_SYSTEM = 'admin:system:manage',
  VIEW_LOGS = 'admin:logs:view',

  // Content Moderation
  MODERATE_CONTENT = 'admin:content:moderate',
  VIEW_REPORTS = 'admin:reports:view',

  // Security
  VIEW_SECURITY = 'admin:security:view',
  MANAGE_SECURITY = 'admin:security:manage',

  // Features
  MANAGE_FEATURES = 'admin:features:manage',
  TOGGLE_FEATURES = 'admin:features:toggle',

  // Notifications
  SEND_NOTIFICATIONS = 'admin:notifications:send',
  MANAGE_NOTIFICATIONS = 'admin:notifications:manage',

  // Super Admin
  SUPER_ADMIN = 'admin:super',
}

export interface AdminPermissions {
  permissions: AdminPermission[]
  isSuperAdmin: boolean
}

export interface AdminAction {
  action: string
  resource: string
  resourceId?: string
  details?: Record<string, any>
  timestamp: Date
  adminId: string
}
