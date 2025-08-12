import { Test, TestingModule } from '@nestjs/testing'
import { UserAnalyticsService } from './user-analytics.service'
import { PrismaService } from '@/core/prisma/prisma.service'

describe('UserAnalyticsService', () => {
  let service: UserAnalyticsService
  let prismaService: PrismaService

  const mockPrismaService = {
    user: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    log: {
      findMany: jest.fn(),
    },
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserAnalyticsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile()

    service = module.get<UserAnalyticsService>(UserAnalyticsService)
    prismaService = module.get<PrismaService>(PrismaService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('getUserMetrics', () => {
    it('should return comprehensive user metrics', async () => {
      const mockCounts = {
        total: 100,
        active: 80,
        admin: 5,
        newThisMonth: 20,
        newThisWeek: 5,
        previousMonth: 15,
        previousWeek: 3,
      }

      mockPrismaService.user.count
        .mockResolvedValueOnce(mockCounts.total)
        .mockResolvedValueOnce(mockCounts.active)
        .mockResolvedValueOnce(mockCounts.admin)
        .mockResolvedValueOnce(mockCounts.newThisMonth)
        .mockResolvedValueOnce(mockCounts.newThisWeek)
        .mockResolvedValueOnce(mockCounts.previousMonth)
        .mockResolvedValueOnce(mockCounts.previousWeek)

      const result = await service.getUserMetrics()

      expect(result).toEqual({
        total: mockCounts.total,
        active: mockCounts.active,
        inactive: mockCounts.total - mockCounts.active,
        admin: mockCounts.admin,
        newThisMonth: mockCounts.newThisMonth,
        newThisWeek: mockCounts.newThisWeek,
        growthRate: 33.33, // (20-15)/15 * 100
      })
    })
  })

  describe('getUserGrowthTrends', () => {
    it('should return user growth trends for specified days', async () => {
      const mockUsers = [
        { createdAt: new Date('2024-01-01'), isAdmin: false },
        { createdAt: new Date('2024-01-01'), isAdmin: true },
        { createdAt: new Date('2024-01-02'), isAdmin: false },
      ]

      mockPrismaService.user.findMany.mockResolvedValue(mockUsers)

      const result = await service.getUserGrowthTrends(2)

      expect(result).toHaveLength(2)
      expect(result[0]).toHaveProperty('date')
      expect(result[0]).toHaveProperty('newUsers')
      expect(result[0]).toHaveProperty('newAdmins')
    })
  })

  describe('getUserEngagementMetrics', () => {
    it('should return user engagement metrics', async () => {
      const mockCounts = {
        total: 100,
        active30Days: 80,
        active7Days: 60,
        active1Day: 20,
      }

      mockPrismaService.user.count
        .mockResolvedValueOnce(mockCounts.total)
        .mockResolvedValueOnce(mockCounts.active30Days)
        .mockResolvedValueOnce(mockCounts.active7Days)
        .mockResolvedValueOnce(mockCounts.active1Day)

      const result = await service.getUserEngagementMetrics()

      expect(result).toEqual({
        totalUsers: mockCounts.total,
        active30Days: mockCounts.active30Days,
        active7Days: mockCounts.active7Days,
        active1Day: mockCounts.active1Day,
        retention30Days: 80,
        retention7Days: 60,
        retention1Day: 20,
      })
    })
  })

  describe('getUserGeographicDistribution', () => {
    it('should return geographic distribution data', async () => {
      const result = await service.getUserGeographicDistribution()

      expect(result).toHaveProperty('regions')
      expect(result.regions).toBeInstanceOf(Array)
      expect(result.regions).toHaveLength(4)
    })
  })

  describe('getUserActivityByTime', () => {
    it('should return user activity by time of day', async () => {
      const mockLogs = [
        { createdAt: new Date('2024-01-01T10:00:00Z') },
        { createdAt: new Date('2024-01-01T10:30:00Z') },
        { createdAt: new Date('2024-01-01T15:00:00Z') },
      ]

      mockPrismaService.log.findMany.mockResolvedValue(mockLogs)

      const result = await service.getUserActivityByTime()

      expect(result).toHaveLength(24)
      expect(result[10]).toEqual({ hour: 10, activity: 2 })
      expect(result[15]).toEqual({ hour: 15, activity: 1 })
    })
  })
})
