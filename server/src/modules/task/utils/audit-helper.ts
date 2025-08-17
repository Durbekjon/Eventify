import { Injectable } from '@nestjs/common'
import { TaskWithRelations } from '../types/task.types'
import {
  TASK_FIELD_LABELS,
  TASK_FIELD_TYPES,
} from '../constants/audit-constants'

export interface AuditDiff {
  field: string
  fieldLabel: string
  oldValue: any
  newValue: any
  fieldType: string
  significance: 'high' | 'medium' | 'low'
}

export interface TaskSnapshot {
  id: string
  name: string
  status: string | null
  priority: string | null
  price: number | null
  paid: boolean
  memberIds: string[]
  customFields: Record<string, any>
  createdAt: Date
  lastModified: Date
}

@Injectable()
export class TaskAuditHelper {
  /**
   * Create a comprehensive diff between two task states
   */
  createTaskDiff(
    originalTask: TaskWithRelations,
    updatedTask: TaskWithRelations,
  ): AuditDiff[] {
    const diffs: AuditDiff[] = []

    // Standard fields
    const standardFields = [
      'name',
      'status',
      'priority',
      'links',
      'price',
      'paid',
    ]

    for (const field of standardFields) {
      if (this.hasFieldChanged(originalTask[field], updatedTask[field])) {
        diffs.push(
          this.createFieldDiff(field, originalTask[field], updatedTask[field]),
        )
      }
    }

    // Custom fields
    for (let i = 1; i <= 5; i++) {
      const customFields = [
        `text${i}`,
        `number${i}`,
        `checkbox${i}`,
        `select${i}`,
        `date${i}`,
      ]

      for (const field of customFields) {
        if (this.hasFieldChanged(originalTask[field], updatedTask[field])) {
          diffs.push(
            this.createFieldDiff(
              field,
              originalTask[field],
              updatedTask[field],
            ),
          )
        }
      }
    }

    // Members (special handling for arrays)
    if (this.hasMembersChanged(originalTask.members, updatedTask.members)) {
      const oldMemberIds = originalTask.members?.map((m) => m.id) || []
      const newMemberIds = updatedTask.members?.map((m) => m.id) || []

      diffs.push({
        field: 'members',
        fieldLabel: TASK_FIELD_LABELS.members,
        oldValue: oldMemberIds,
        newValue: newMemberIds,
        fieldType: TASK_FIELD_TYPES.ARRAY,
        significance: 'high',
      })
    }

    return diffs
  }

  /**
   * Create a complete snapshot of a task for audit purposes
   */
  createTaskSnapshot(task: TaskWithRelations): TaskSnapshot {
    const customFields = {}

    // Collect all custom fields
    for (let i = 1; i <= 5; i++) {
      const fields = [
        `text${i}`,
        `number${i}`,
        `checkbox${i}`,
        `select${i}`,
        `date${i}`,
      ]

      for (const field of fields) {
        if (
          task[field] !== null &&
          task[field] !== undefined &&
          task[field] !== ''
        ) {
          customFields[field] = task[field]
        }
      }
    }

    return {
      id: task.id,
      name: task.name,
      status: task.status,
      priority: task.priority,
      price: task.price,
      paid: task.paid,
      memberIds: task.members?.map((m) => m.id) || [],
      customFields,
      createdAt: task.createdAt,
      lastModified: task.createdAt,
    }
  }

  /**
   * Generate a human-readable summary of changes
   */
  generateChangeSummary(diffs: AuditDiff[]): string {
    if (diffs.length === 0) {
      return 'No changes detected'
    }

    if (diffs.length === 1) {
      const diff = diffs[0]
      return `${diff.fieldLabel} changed from "${this.formatValue(diff.oldValue)}" to "${this.formatValue(diff.newValue)}"`
    }

    const significantChanges = diffs.filter((d) => d.significance === 'high')
    if (significantChanges.length > 0) {
      const fieldNames = significantChanges.map((d) => d.fieldLabel).join(', ')
      return `${significantChanges.length} significant change${significantChanges.length > 1 ? 's' : ''}: ${fieldNames}`
    }

    const fieldNames = diffs
      .map((d) => d.fieldLabel)
      .slice(0, 3)
      .join(', ')
    const remaining = diffs.length - 3

    if (remaining > 0) {
      return `${fieldNames} and ${remaining} other field${remaining > 1 ? 's' : ''}`
    }

    return fieldNames
  }

  /**
   * Calculate task complexity score for audit prioritization
   */
  calculateTaskComplexity(task: TaskWithRelations): number {
    let complexity = 0

    // Base complexity
    complexity += 1

    // Member complexity
    complexity += (task.members?.length || 0) * 0.5

    // Price/payment complexity
    if (task.price && task.price > 0) complexity += 1
    if (task.paid) complexity += 0.5

    // Custom field usage
    const customFieldsUsed = this.getUsedCustomFieldCount(task)
    complexity += customFieldsUsed * 0.3

    // Link complexity
    if (task.links) complexity += 0.5
    const additionalLinks = task.links.filter(Boolean).length
    complexity += additionalLinks * 0.2

    return Math.round(complexity * 10) / 10
  }

  /**
   * Determine if a change is business-critical
   */
  isBusinessCriticalChange(diffs: AuditDiff[]): boolean {
    const criticalFields = [
      'name',
      'status',
      'priority',
      'paid',
      'price',
      'members',
    ]
    return diffs.some((diff) => criticalFields.includes(diff.field))
  }

  /**
   * Generate audit tags for categorization
   */
  generateAuditTags(
    action: string,
    task: TaskWithRelations,
    diffs?: AuditDiff[],
  ): string[] {
    const tags: string[] = [action.toLowerCase()]

    // Task characteristics
    if (task.price && task.price > 0) tags.push('has-price')
    if (task.paid) tags.push('paid')
    if (task.members && task.members.length > 1) tags.push('multi-member')
    if (task.members && task.members.length === 0) tags.push('unassigned')

    // Change characteristics
    if (diffs) {
      if (this.isBusinessCriticalChange(diffs)) tags.push('business-critical')
      if (diffs.length > 5) tags.push('major-update')
      if (diffs.some((d) => d.field === 'members')) tags.push('member-change')
      if (diffs.some((d) => d.field === 'status')) tags.push('status-change')
      if (diffs.some((d) => d.field === 'priority'))
        tags.push('priority-change')
    }

    // Custom field usage
    const customFieldCount = this.getUsedCustomFieldCount(task)
    if (customFieldCount > 3) tags.push('complex-task')

    return tags
  }

  private hasFieldChanged(oldValue: any, newValue: any): boolean {
    // Handle null/undefined equivalence
    if ((oldValue == null) !== (newValue == null)) return true
    if (oldValue == null && newValue == null) return false

    // Handle dates
    if (oldValue instanceof Date && newValue instanceof Date) {
      return oldValue.getTime() !== newValue.getTime()
    }

    // Handle arrays
    if (Array.isArray(oldValue) && Array.isArray(newValue)) {
      return JSON.stringify(oldValue.sort()) !== JSON.stringify(newValue.sort())
    }

    return oldValue !== newValue
  }

  private hasMembersChanged(oldMembers: any[], newMembers: any[]): boolean {
    const oldIds = new Set(oldMembers?.map((m) => m.id) || [])
    const newIds = new Set(newMembers?.map((m) => m.id) || [])

    if (oldIds.size !== newIds.size) return true

    for (const id of oldIds) {
      if (!newIds.has(id)) return true
    }

    return false
  }

  private createFieldDiff(
    field: string,
    oldValue: any,
    newValue: any,
  ): AuditDiff {
    return {
      field,
      fieldLabel: TASK_FIELD_LABELS[field] || field,
      oldValue,
      newValue,
      fieldType: this.determineFieldType(field),
      significance: this.determineSignificance(field, oldValue, newValue),
    }
  }

  private determineFieldType(field: string): string {
    if (field.includes('date')) return TASK_FIELD_TYPES.DATE
    if (field.includes('number') || field === 'price')
      return TASK_FIELD_TYPES.NUMBER
    if (field.includes('checkbox') || field === 'paid')
      return TASK_FIELD_TYPES.BOOLEAN
    if (field === 'members') return TASK_FIELD_TYPES.ARRAY
    return TASK_FIELD_TYPES.STRING
  }

  private determineSignificance(
    field: string,
    oldValue: any,
    newValue: any,
  ): 'high' | 'medium' | 'low' {
    // High significance fields
    if (['name', 'status', 'priority', 'members', 'paid'].includes(field)) {
      return 'high'
    }

    // Medium significance for price changes
    if (field === 'price') {
      return 'medium'
    }

    // Medium significance for first-time value setting
    if (oldValue == null && newValue != null) {
      return 'medium'
    }

    return 'low'
  }

  private formatValue(value: any): string {
    if (value == null) return 'empty'
    if (Array.isArray(value)) return `[${value.join(', ')}]`
    if (value instanceof Date) return value.toISOString().split('T')[0]
    if (typeof value === 'boolean') return value ? 'Yes' : 'No'
    return String(value)
  }

  private getUsedCustomFieldCount(task: TaskWithRelations): number {
    let count = 0

    for (let i = 1; i <= 5; i++) {
      const fields = [
        `text${i}`,
        `number${i}`,
        `checkbox${i}`,
        `select${i}`,
        `date${i}`,
      ]

      for (const field of fields) {
        if (
          task[field] !== null &&
          task[field] !== undefined &&
          task[field] !== ''
        ) {
          count++
        }
      }
    }

    return count
  }
}
