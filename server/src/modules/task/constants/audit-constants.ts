/**
 * Task Audit Constants and Types
 * Centralized constants for consistent task audit logging
 */

export const TASK_AUDIT_ACTIONS = {
  CREATE: 'TASK_CREATE',
  UPDATE: 'TASK_UPDATE',
  DELETE: 'TASK_DELETE',
  REORDER: 'TASK_REORDER',
  MOVE: 'TASK_MOVE',
  BULK_UPDATE: 'TASK_BULK_UPDATE',
  MEMBER_ADD: 'TASK_MEMBER_ADD',
  MEMBER_REMOVE: 'TASK_MEMBER_REMOVE',
  STATUS_CHANGE: 'TASK_STATUS_CHANGE',
  PRIORITY_CHANGE: 'TASK_PRIORITY_CHANGE',
} as const

export const TASK_FIELD_TYPES = {
  STRING: 'string',
  NUMBER: 'number',
  BOOLEAN: 'boolean',
  DATE: 'date',
  ARRAY: 'array',
  OBJECT: 'object',
} as const

export const SIGNIFICANT_TASK_FIELDS = [
  'name',
  'status',
  'priority',
  'members',
  'price',
  'paid',
] as const

export const TASK_AUDIT_MESSAGES = {
  CREATE: {
    SUCCESS: (taskName: string) => `Task "${taskName}" created successfully`,
    FAILED: (taskName: string) => `Failed to create task "${taskName}"`,
  },
  UPDATE: {
    SUCCESS: (taskName: string, fieldCount: number) =>
      `Task "${taskName}" updated (${fieldCount} field${fieldCount > 1 ? 's' : ''})`,
    FAILED: (taskName: string) => `Failed to update task "${taskName}"`,
    NO_CHANGES: (taskName: string) =>
      `No changes detected for task "${taskName}"`,
  },
  DELETE: {
    SUCCESS: (taskName: string) => `Task "${taskName}" deleted successfully`,
    FAILED: (taskName: string) => `Failed to delete task "${taskName}"`,
  },
  REORDER: {
    SUCCESS: (count: number) => `Successfully reordered ${count} tasks`,
    FAILED: (count: number) => `Failed to reorder ${count} tasks`,
  },
  MOVE: {
    SUCCESS: (taskName: string) =>
      `Task "${taskName}" moved to different sheet`,
    FAILED: (taskName: string) => `Failed to move task "${taskName}"`,
  },
} as const

export const TASK_PERFORMANCE_THRESHOLDS = {
  // Milliseconds
  CREATE_SLOW: 1000,
  UPDATE_SLOW: 500,
  DELETE_SLOW: 300,
  REORDER_SLOW: 2000,
  MOVE_SLOW: 800,
} as const

export const TASK_AUDIT_PRIORITIES = {
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
} as const

/**
 * Determines audit priority based on action type and context
 */
export function getAuditPriority(
  action: keyof typeof TASK_AUDIT_ACTIONS,
  fieldChanges?: string[],
  // memberCount?: number,
): string {
  // High priority events
  if (action === 'DELETE' || action === 'CREATE') {
    return TASK_AUDIT_PRIORITIES.HIGH
  }

  // High priority updates
  if (
    action === 'UPDATE' &&
    fieldChanges?.some((field) =>
      SIGNIFICANT_TASK_FIELDS.includes(field as any),
    )
  ) {
    return TASK_AUDIT_PRIORITIES.HIGH
  }

  // Medium priority bulk operations
  if (['REORDER', 'MOVE', 'BULK_UPDATE'].includes(action)) {
    return TASK_AUDIT_PRIORITIES.MEDIUM
  }

  return TASK_AUDIT_PRIORITIES.LOW
}

/**
 * Get human-readable field names for audit logs
 */
export const TASK_FIELD_LABELS: Record<string, string> = {
  name: 'Task Name',
  status: 'Status',
  priority: 'Priority',
  link: 'Main Link',
  price: 'Price',
  paid: 'Payment Status',
  members: 'Assigned Members',
  text1: 'Text Field 1',
  text2: 'Text Field 2',
  text3: 'Text Field 3',
  text4: 'Text Field 4',
  text5: 'Text Field 5',
  number1: 'Number Field 1',
  number2: 'Number Field 2',
  number3: 'Number Field 3',
  number4: 'Number Field 4',
  number5: 'Number Field 5',
  checkbox1: 'Checkbox 1',
  checkbox2: 'Checkbox 2',
  checkbox3: 'Checkbox 3',
  checkbox4: 'Checkbox 4',
  checkbox5: 'Checkbox 5',
  select1: 'Dropdown 1',
  select2: 'Dropdown 2',
  select3: 'Dropdown 3',
  select4: 'Dropdown 4',
  select5: 'Dropdown 5',
  date1: 'Date Field 1',
  date2: 'Date Field 2',
  date3: 'Date Field 3',
  date4: 'Date Field 4',
  date5: 'Date Field 5',
  link1: 'Link Field 1',
  link2: 'Link Field 2',
  link3: 'Link Field 3',
  link4: 'Link Field 4',
  link5: 'Link Field 5',
}

/**
 * Risk assessment for task operations
 */
export function assessOperationRisk(
  action: keyof typeof TASK_AUDIT_ACTIONS,
  metadata: Record<string, any>,
): 'low' | 'medium' | 'high' {
  switch (action) {
    case 'DELETE':
      return 'high'
    case 'UPDATE':
      if (metadata.significantChanges?.length > 0) return 'medium'
      return 'low'
    case 'MOVE':
      return metadata.crossWorkspace ? 'medium' : 'low'
    case 'REORDER':
      return metadata.taskCount > 10 ? 'medium' : 'low'
    default:
      return 'low'
  }
}
