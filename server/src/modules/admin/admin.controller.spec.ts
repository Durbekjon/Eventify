import { Test, TestingModule } from '@nestjs/testing'
import { AdminController } from './admin.controller'
import { AdminService } from './admin.service'

describe('AdminController', () => {
  let controller: AdminController
  let service: AdminService

  const mockAdminService = {
    getHealth: jest.fn(),
    getOverview: jest.fn(),
    getStats: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminController],
      providers: [
        {
          provide: AdminService,
          useValue: mockAdminService,
        },
      ],
    }).compile()

    controller = module.get<AdminController>(AdminController)
    service = module.get<AdminService>(AdminService)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  describe('getHealth', () => {
    it('should return health status', async () => {
      const mockHealth = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
      }
      mockAdminService.getHealth.mockResolvedValue(mockHealth)

      const result = await controller.getHealth()

      expect(result).toEqual(mockHealth)
      expect(service.getHealth).toHaveBeenCalled()
    })
  })

  describe('getOverview', () => {
    it('should return overview data', async () => {
      const mockOverview = {
        overview: { totalUsers: 100 },
        adminId: 'admin-123',
      }
      mockAdminService.getOverview.mockResolvedValue(mockOverview)

      const mockAdmin = { id: 'admin-123' }
      const result = await controller.getOverview(mockAdmin as any)

      expect(result).toEqual(mockOverview)
      expect(service.getOverview).toHaveBeenCalledWith(mockAdmin)
    })
  })

  describe('getStats', () => {
    it('should return stats data', async () => {
      const mockStats = {
        stats: { users: { total: 100 } },
        adminId: 'admin-123',
      }
      mockAdminService.getStats.mockResolvedValue(mockStats)

      const mockAdmin = { id: 'admin-123' }
      const result = await controller.getStats(mockAdmin as any)

      expect(result).toEqual(mockStats)
      expect(service.getStats).toHaveBeenCalledWith(mockAdmin)
    })
  })
})
