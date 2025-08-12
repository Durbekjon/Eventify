export const ADMIN_MESSAGES = {
  // Admin Authentication
  AUTH: {
    ACCESS_DENIED: 'Access denied: Admin privileges required',
    INVALID_PERMISSION: 'Invalid admin permission',
    RATE_LIMIT_EXCEEDED: 'Rate limit exceeded for admin operations',
  },

  // Admin Operations
  OPERATIONS: {
    USER_BLOCKED: 'User blocked successfully',
    USER_UNBLOCKED: 'User unblocked successfully',
    COMPANY_BLOCKED: 'Company blocked successfully',
    COMPANY_UNBLOCKED: 'Company unblocked successfully',
    SUBSCRIPTION_EXTENDED: 'Subscription extended successfully',
    SUBSCRIPTION_SUSPENDED: 'Subscription suspended successfully',
    FEATURE_TOGGLED: 'Feature toggled successfully',
  },

  // Admin Errors
  ERRORS: {
    USER_NOT_FOUND: 'User not found',
    COMPANY_NOT_FOUND: 'Company not found',
    SUBSCRIPTION_NOT_FOUND: 'Subscription not found',
    INVALID_OPERATION: 'Invalid admin operation',
    AUDIT_LOG_FAILED: 'Failed to log admin action',
    CACHE_OPERATION_FAILED: 'Cache operation failed',
  },

  // Admin Success
  SUCCESS: {
    OPERATION_COMPLETED: 'Admin operation completed successfully',
    DATA_RETRIEVED: 'Data retrieved successfully',
    METRICS_UPDATED: 'Metrics updated successfully',
    SYSTEM_HEALTHY: 'System is healthy',
  },

  // Admin Validation
  VALIDATION: {
    INVALID_PAGE: 'Invalid page number',
    INVALID_LIMIT: 'Invalid limit value',
    INVALID_FILTERS: 'Invalid filter parameters',
    INVALID_SORT: 'Invalid sort parameters',
  },
}
