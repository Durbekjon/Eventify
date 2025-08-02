import { Test, TestingModule } from '@nestjs/testing'
import { PaymentService } from './payment.service'
import { PaymentRepository } from './payment.repository'
import { PrismaService } from '@core/prisma/prisma.service'
import { UserService } from '@user/user.service'
import { RoleService } from '@role/role.service'
import { StripeService } from '@stripe/stripe.service'
import { BadRequestException } from '@nestjs/common'
import { RoleTypes } from '@prisma/client'
import { PaymentError } from './payment.error'

describe('PaymentService', () => {
  let service: PaymentService
  let mockRepository: any
  let mockPrisma: any
  let mockUserService: any
  let mockRoleService: any
  let mockStripeService: any

  beforeEach(async () => {
    mockRepository = { getPlan: jest.fn() }
    mockPrisma = {
      companySubscription: { findFirst: jest.fn() },
      company: { findUnique: jest.fn(), update: jest.fn() },
    }
    mockUserService = { getUser: jest.fn() }
    mockRoleService = { getUserSelectedRole: jest.fn() }
    mockStripeService = {
      createPaymentIntent: jest.fn(),
      confirmPaymentIntent: jest.fn(),
      createCustomer: jest.fn(),
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentService,
        { provide: PaymentRepository, useValue: mockRepository },
        { provide: PrismaService, useValue: mockPrisma },
        { provide: UserService, useValue: mockUserService },
        { provide: RoleService, useValue: mockRoleService },
        { provide: StripeService, useValue: mockStripeService },
      ],
    }).compile()
    service = module.get<PaymentService>(PaymentService)
    jest.clearAllMocks()
  })

  describe('createInlinePayment', () => {
    it('should create a payment intent for valid user and role', async () => {
      const iUser = { id: 'user1' }
      const plan = { id: 'plan1', price: 1000 }
      const user = {
        id: 'user1',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        roles: [],
        selectedRole: 'role1',
      }
      const role = { type: RoleTypes.AUTHOR, companyId: 'company1' }
      const body = { planId: 'plan1' }
      const customer = { id: 'cus_123' }
      const paymentIntent = {
        clientSecret: 'secret',
        paymentIntentId: 'pi_123',
      }

      mockUserService.getUser.mockResolvedValue(user)
      mockRoleService.getUserSelectedRole.mockReturnValue(role)
      mockRepository.getPlan.mockResolvedValue(plan)
      mockPrisma.companySubscription.findFirst.mockResolvedValue(null)
      mockPrisma.company.findUnique.mockResolvedValue(null)
      mockStripeService.createCustomer.mockResolvedValue(customer)
      mockStripeService.createPaymentIntent.mockResolvedValue(paymentIntent)

      const result = await service.createInlinePayment(iUser, body)

      expect(result).toEqual(paymentIntent)
      expect(mockStripeService.createPaymentIntent).toHaveBeenCalledWith(
        plan,
        user.id,
        role.companyId,
        customer.id,
      )
    })

    it('should throw if role is not AUTHOR', async () => {
      const iUser = { id: 'user1' }
      const user = { id: 'user1', roles: [], selectedRole: 'role1' }
      const role = { type: RoleTypes.VIEWER }
      mockUserService.getUser.mockResolvedValue(user)
      mockRoleService.getUserSelectedRole.mockReturnValue(role)

      await expect(
        service.createInlinePayment(iUser, { planId: 'plan1' }),
      ).rejects.toThrow(BadRequestException)
    })

    it('should throw if plan not found', async () => {
      const iUser = { id: 'user1' }
      const user = { id: 'user1', roles: [], selectedRole: 'role1' }
      const role = { type: RoleTypes.AUTHOR, companyId: 'company1' }

      mockUserService.getUser.mockResolvedValue(user)
      mockRoleService.getUserSelectedRole.mockReturnValue(role)
      mockRepository.getPlan.mockResolvedValue(null)

      await expect(
        service.createInlinePayment(iUser, { planId: 'invalid' }),
      ).rejects.toThrow(PaymentError)
    })

    it('should throw if active subscription exists', async () => {
      const iUser = { id: 'user1' }
      const plan = { id: 'plan1', price: 1000 }
      const user = { id: 'user1', roles: [], selectedRole: 'role1' }
      const role = { type: RoleTypes.AUTHOR, companyId: 'company1' }
      const existingSubscription = { id: 'sub1' }

      mockUserService.getUser.mockResolvedValue(user)
      mockRoleService.getUserSelectedRole.mockReturnValue(role)
      mockRepository.getPlan.mockResolvedValue(plan)
      mockPrisma.companySubscription.findFirst.mockResolvedValue(
        existingSubscription,
      )

      await expect(
        service.createInlinePayment(iUser, { planId: 'plan1' }),
      ).rejects.toThrow(PaymentError)
    })
  })

  describe('confirmInlinePayment', () => {
    it('should confirm payment intent successfully', async () => {
      mockStripeService.confirmPaymentIntent.mockResolvedValue(undefined)

      const result = await service.confirmInlinePayment('pi_123')

      expect(result).toEqual({
        status: 'SUCCESS',
        message: 'Payment confirmed successfully',
      })
      expect(mockStripeService.confirmPaymentIntent).toHaveBeenCalledWith(
        'pi_123',
      )
    })

    it('should throw error if confirmation fails', async () => {
      const error = new Error('Confirmation failed')
      mockStripeService.confirmPaymentIntent.mockRejectedValue(error)

      await expect(service.confirmInlinePayment('pi_123')).rejects.toThrow(
        PaymentError,
      )
    })
  })

  describe('handleWebhookEvent', () => {
    it('should handle webhook event', async () => {
      const event = { type: 'payment_intent.succeeded', data: {} }
      mockStripeService.handleWebhookEvent.mockResolvedValue(undefined)

      await service.handleWebhookEvent(event)

      expect(mockStripeService.handleWebhookEvent).toHaveBeenCalledWith(event)
    })
  })
})
