import { Test, TestingModule } from '@nestjs/testing'
import { AdminService } from './admin.service'
import { PrismaService } from '@/core/prisma/prisma.service'

describe('AdminService', () => {
  let service: AdminService
  let prismaService: PrismaService

  const mockPrismaService = {
    user: {
      count: jest.fn(),
    },
    company: {
      count: jest.fn(),
    },
    task: {
      count: jest.fn(),
    },
    companySubscription: {
      count: jest.fn(),
    },
    $queryRaw: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile()

    service = module.get<AdminService>(AdminService)
    prismaService = module.get<PrismaService>(PrismaService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('getHealth', () => {
    it('should return healthy status when database is accessible', async () => {
      mockPrismaService.$queryRaw.mockResolvedValue([{ '1': 1 }])

      const result = await service.getHealth()

      expect(result.status).toBe('healthy')
      expect(result.services.database.status).toBe('healthy')
      expect(result.timestamp).toBeDefined()
    })

    it('should return unhealthy status when database is not accessible', async () => {
      mockPrismaService.$queryRaw.mockRejectedValue(new Error('Database connection failed'))

      const result = await service.getHealth()

      expect(result.status).toBe('healthy')
      expect(result.services.database.status).toBe('unhealthy')
      expect(result.services.database.error).toBe('Database connection failed')
    })
  })

  describe('getOverview', () => {
    it('should return overview with correct counts', async () => {
      const mockUserCount = 100
      const mockCompanyCount = 50
      const mockTaskCount = 200
      const mockSubscriptionCount = 30

      mockPrismaService.user.count.mockResolvedValue(mockUserCount)
      mockPrismaService.company.count.mockResolvedValue(mockCompanyCount)
      mockPrismaService.task.count.mockResolvedValue(mockTaskCount)
      mockPrismaService.companySubscription.count.mockResolvedValue(mockSubscriptionCount)

      const mockAdmin = { id: 'admin-123' }
      const result = await service.getOverview(mockAdmin as any)

      expect(result.overview.totalUsers).toBe(mockUserCount)
      expect(result.overview.totalCompanies).toBe(mockCompanyCount)
      expect(result.overview.totalTasks).toBe(mockTaskCount)
      expect(result.overview.activeSubscriptions).toBe(mockSubscriptionCount)
      expect(result.adminId).toBe(mockAdmin.id)
      expect(result.lastUpdated).toBeDefined()
    })
  })
})
