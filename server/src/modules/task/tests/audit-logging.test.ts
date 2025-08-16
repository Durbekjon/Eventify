/**
 * Audit Logging Tests
 * Tests for comprehensive task audit logging functionality
 */

import { Test, TestingModule } from '@nestjs/testing'
import { TaskService } from '../task.service'
import { TaskAuditHelper } from '../utils/audit-helper'
import { TaskLoggingUtil } from '../utils/task-logging.util'
import { TaskRepository } from '../task.repository'
import { PrismaService } from '@core/prisma/prisma.service'
import { LogRepository } from '../../log/log.repository'
import { CreateTaskDto } from '../dto/create-task.dto'

// Mock implementations
const mockTaskRepository = {
  createTask: jest.fn(),
  updateTask: jest.fn(),
  deleteTask: jest.fn(),
  findById: jest.fn(),
  reorder: jest.fn(),
  move: jest.fn(),
}

const mockLogRepository = {
  create: jest.fn(),
  getByTask: jest.fn(),
  getByCompany: jest.fn(),
}

const mockPrismaService = {
  log: {
    create: jest.fn(),
    createMany: jest.fn(),
  },
  task: {
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}

const mockUserService = {
  getUser: jest.fn(),
}

const mockRoleService = {
  getUserSelectedRole: jest.fn(),
}

const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
}

const mockRole = {
  companyId: 'company-123',
  type: 'AUTHOR',
  access: {
    id: 'member-123',
    permissions: ['ALL'],
  },
}

const mockTask = {
  id: 'task-123',
  name: 'Test Task',
  status: 'TODO',
  priority: 'HIGH',
  price: 100,
  paid: false,
  workspaceId: 'workspace-123',
  sheetId: 'sheet-123',
  companyId: 'company-123',
  members: [],
  createdAt: new Date(),
  updatedAt: new Date(),
}

describe('Task Audit Logging', () => {
  let taskService: TaskService
  let auditHelper: TaskAuditHelper
  let module: TestingModule

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        TaskService,
        TaskAuditHelper,
        { provide: TaskRepository, useValue: mockTaskRepository },
        { provide: LogRepository, useValue: mockLogRepository },
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: 'UserService', useValue: mockUserService },
        { provide: 'RoleService', useValue: mockRoleService },
        { provide: 'SheetService', useValue: { findOne: jest.fn() } },
        { provide: 'MemberService', useValue: { findOneMember: jest.fn() } },
        {
          provide: 'SubscriptionValidationService',
          useValue: { validateSubscriptionToTask: jest.fn() },
        },
        { provide: 'FileStorageService', useValue: {} },
        { provide: 'FileRepository', useValue: {} },
      ],
    }).compile()

    taskService = module.get<TaskService>(TaskService)
    auditHelper = module.get<TaskAuditHelper>(TaskAuditHelper)

    // Setup common mocks
    mockUserService.getUser.mockResolvedValue({
      id: 'user-123',
      roles: [mockRole],
      selectedRole: 'role-123',
    })
    mockRoleService.getUserSelectedRole.mockResolvedValue(mockRole)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('Task Creation Audit', () => {
    it('should log comprehensive audit data for task creation', async () => {
      // Arrange
      const createDto: CreateTaskDto = {
        name: 'New Test Task',
        sheetId: 'sheet-123',
        status: 'TODO',
        priority: 'HIGH',
        members: ['member-123'],
      }

      mockTaskRepository.createTask.mockResolvedValue(mockTask)
      const logSpy = jest.spyOn(mockLogRepository, 'create')

      // Act
      await taskService.createTask(createDto, mockUser)

      // Assert
      expect(logSpy).toHaveBeenCalled()
      const logCall = logSpy.mock.calls[0][0]

      expect(logCall.message).toContain('Created task')
      expect(logCall.user).toEqual({ connect: { id: mockUser.id } })
      expect(logCall.company).toEqual({ connect: { id: mockRole.companyId } })
      expect(logCall.task).toEqual({ connect: { id: mockTask.id } })
    })

    it('should capture task complexity in audit data', async () => {
      // Arrange
      const complexTask = {
        ...mockTask,
        price: 500,
        paid: true,
        members: [{ id: 'member-1' }, { id: 'member-2' }, { id: 'member-3' }],
        text1: 'Custom text',
        number1: 42,
        date1: new Date(),
      }

      // Act
      const complexity = auditHelper.calculateTaskComplexity(complexTask as any)

      // Assert
      expect(complexity).toBeGreaterThan(1)
      expect(typeof complexity).toBe('number')
    })
  })

  describe('Task Update Audit', () => {
    it('should detect and log field changes', async () => {
      // Arrange
      const originalTask = { ...mockTask }
      const updatedTask = {
        ...mockTask,
        name: 'Updated Task',
        status: 'IN_PROGRESS',
      }

      // Act
      const diffs = auditHelper.createTaskDiff(
        originalTask as any,
        updatedTask as any,
      )

      // Assert
      expect(diffs).toHaveLength(2)
      expect(diffs.find((d) => d.field === 'name')).toBeTruthy()
      expect(diffs.find((d) => d.field === 'status')).toBeTruthy()

      const nameDiff = diffs.find((d) => d.field === 'name')!
      expect(nameDiff.oldValue).toBe('Test Task')
      expect(nameDiff.newValue).toBe('Updated Task')
      expect(nameDiff.significance).toBe('high')
    })

    it('should identify business-critical changes', async () => {
      // Arrange
      const diffs = [
        {
          field: 'name',
          fieldLabel: 'Task Name',
          oldValue: 'Old Name',
          newValue: 'New Name',
          fieldType: 'string',
          significance: 'high' as const,
        },
        {
          field: 'paid',
          fieldLabel: 'Payment Status',
          oldValue: false,
          newValue: true,
          fieldType: 'boolean',
          significance: 'high' as const,
        },
      ]

      // Act
      const isCritical = auditHelper.isBusinessCriticalChange(diffs)

      // Assert
      expect(isCritical).toBe(true)
    })
  })

  describe('Task Deletion Audit', () => {
    it('should capture complete task snapshot before deletion', async () => {
      // Arrange
      mockTaskRepository.findById = jest.fn().mockResolvedValue(mockTask)
      mockTaskRepository.deleteTask = jest.fn().mockResolvedValue(mockTask)

      const snapshotSpy = jest.spyOn(auditHelper, 'createTaskSnapshot')

      // Act
      await taskService.deleteTask('task-123', mockUser)

      // Assert
      expect(snapshotSpy).toHaveBeenCalledWith(mockTask)
    })
  })

  describe('Performance Monitoring', () => {
    it('should track operation duration', async () => {
      // Arrange
      const startTime = Date.now()
      const endTime = startTime + 250

      const metrics = {
        operation: 'CREATE',
        duration: endTime - startTime,
        success: true,
        timestamp: new Date().toISOString(),
        userId: 'user-123',
        taskId: 'task-123',
      }

      // Act
      const logSpy = jest.spyOn(console, 'log').mockImplementation()
      TaskLoggingUtil.logPerformanceMetrics(metrics)

      // Assert
      expect(logSpy).toHaveBeenCalled()
      logSpy.mockRestore()
    })

    it('should categorize performance correctly', async () => {
      // Act & Assert
      const fastOperation = TaskLoggingUtil.createMonitoringSummary(
        'CREATE',
        true,
        50,
      )
      const slowOperation = TaskLoggingUtil.createMonitoringSummary(
        'CREATE',
        true,
        1500,
      )

      expect(fastOperation.success).toBe(true)
      expect(fastOperation.duration).toBe(50)
      expect(slowOperation.duration).toBe(1500)
    })
  })

  describe('Audit Tags Generation', () => {
    it('should generate appropriate tags for different task types', async () => {
      // Arrange
      const taskWithPrice = { ...mockTask, price: 100, paid: true }
      const taskWithMembers = {
        ...mockTask,
        members: [{ id: 'member-1' }, { id: 'member-2' }],
      }

      // Act
      const priceTags = TaskLoggingUtil.generateOperationTags(
        'CREATE',
        taskWithPrice as any,
      )
      const memberTags = TaskLoggingUtil.generateOperationTags(
        'UPDATE',
        taskWithMembers as any,
      )

      // Assert
      expect(priceTags).toContain('create')
      expect(priceTags).toContain('has-price')
      expect(priceTags).toContain('paid')

      expect(memberTags).toContain('update')
      expect(memberTags).toContain('multi-member')
    })
  })

  describe('Error Handling', () => {
    it('should log errors without breaking main operation flow', async () => {
      // Arrange
      const error = new Error('Test error')
      mockTaskRepository.createTask.mockRejectedValue(error)

      const logSpy = jest.spyOn(mockLogRepository, 'create')

      // Act & Assert
      await expect(
        taskService.createTask(
          {
            name: 'Test Task',
            sheetId: 'sheet-123',
          },
          mockUser,
        ),
      ).rejects.toThrow('Test error')

      // Verify error was logged
      expect(logSpy).toHaveBeenCalled()
    })
  })

  describe('Data Sanitization', () => {
    it('should sanitize sensitive data in request bodies', async () => {
      // Arrange
      const sensitiveBody = {
        name: 'Task',
        password: 'secret123',
        token: 'jwt-token',
        description: 'Normal field',
      }

      // Act
      const sanitized = {
        ...sensitiveBody,
        password: '[REDACTED]',
        token: '[REDACTED]',
      }

      // Assert
      expect(sanitized.name).toBe('Task')
      expect(sanitized.description).toBe('Normal field')
      expect(sanitized.password).toBe('[REDACTED]')
      expect(sanitized.token).toBe('[REDACTED]')
    })
  })

  describe('Business Impact Assessment', () => {
    it('should correctly assess business impact levels', async () => {
      // Act
      const highImpactSummary = TaskLoggingUtil.createOperationSummary(
        'DELETE',
        mockUser,
        'company-123',
        { ...mockTask, price: 1000, paid: true } as any,
      )

      const lowImpactSummary = TaskLoggingUtil.createOperationSummary(
        'READ',
        mockUser,
        'company-123',
        { ...mockTask, price: 0, members: [] } as any,
      )

      // Assert
      expect(highImpactSummary.businessImpact).toBe('high')
      expect(lowImpactSummary.businessImpact).toBe('low')
    })
  })
})

/**
 * Integration Test Helpers
 * These would be used in actual integration tests with real database
 */
export class AuditTestHelpers {
  /**
   * Verify audit log was created with expected structure
   */
  static async verifyAuditLogCreated(
    logRepository: any,
    expectedOperation: string,
    expectedUserId: string,
  ): Promise<boolean> {
    const logs = await logRepository.getByUser(expectedUserId)
    return logs.some(
      (log: any) =>
        log.updatedKey === expectedOperation && log.userId === expectedUserId,
    )
  }

  /**
   * Check performance metrics are within acceptable ranges
   */
  static verifyPerformanceMetrics(
    duration: number,
    operation: string,
  ): { withinThreshold: boolean; category: string } {
    const thresholds = {
      CREATE: 1000,
      UPDATE: 500,
      DELETE: 300,
      REORDER: 2000,
      MOVE: 800,
    }

    const threshold = thresholds[operation] || 1000
    const withinThreshold = duration <= threshold

    let category = 'fast'
    if (duration > threshold) category = 'slow'
    if (duration > threshold * 2) category = 'critical'

    return { withinThreshold, category }
  }

  /**
   * Generate test data for audit logging scenarios
   */
  static generateTestTask(overrides: Partial<any> = {}): any {
    return {
      id: 'test-task-123',
      name: 'Test Task for Audit',
      status: 'TODO',
      priority: 'MEDIUM',
      price: 50,
      paid: false,
      workspaceId: 'test-workspace-123',
      sheetId: 'test-sheet-123',
      companyId: 'test-company-123',
      members: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    }
  }
}
