import { Test, TestingModule } from '@nestjs/testing';
import { PaymentService } from './payment.service';
import { PaymentRepository } from './payment.repository';
import { PrismaService } from '@core/prisma/prisma.service';
import { UserService } from '@user/user.service';
import { RoleService } from '@role/role.service';
import { StripeService } from '@stripe/stripe.service';
import { BadRequestException } from '@nestjs/common';
import { TransactionStatus, RoleTypes } from '@prisma/client';

describe('PaymentService', () => {
  let service: PaymentService;
  let mockRepository: any;
  let mockPrisma: any;
  let mockUserService: any;
  let mockRoleService: any;
  let mockStripeService: any;

  beforeEach(async () => {
    mockRepository = { getPlan: jest.fn() };
    mockPrisma = {
      transaction: { update: jest.fn() },
      companySubscription: { create: jest.fn() },
      company: { update: jest.fn() },
    };
    mockUserService = { getUser: jest.fn() };
    mockRoleService = { getUserSelectedRole: jest.fn() };
    mockStripeService = {
      createCheckoutSession: jest.fn(),
      checkSessionPayment: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentService,
        { provide: PaymentRepository, useValue: mockRepository },
        { provide: PrismaService, useValue: mockPrisma },
        { provide: UserService, useValue: mockUserService },
        { provide: RoleService, useValue: mockRoleService },
        { provide: StripeService, useValue: mockStripeService },
      ],
    }).compile();
    service = module.get<PaymentService>(PaymentService);
    jest.clearAllMocks();
  });

  describe('createPaymentSession', () => {
    it('should create a payment session for valid user and role', async () => {
      const iUser = { id: 'user1' };
      const plan = { id: 'plan1' };
      const user = { id: 'user1', roles: [], selectedRole: 'role1' };
      const role = { type: RoleTypes.AUTHOR, companyId: 'company1' };
      const body = { planId: 'plan1', companyId: 'company1' };
      mockUserService.getUser.mockResolvedValue(user);
      mockRoleService.getUserSelectedRole.mockReturnValue(role);
      mockRepository.getPlan.mockResolvedValue(plan);
      mockStripeService.createCheckoutSession.mockResolvedValue('session');

      const result = await service.createPaymentSession(iUser, body);
      expect(result).toBe('session');
      expect(mockStripeService.createCheckoutSession).toHaveBeenCalledWith(plan, user.id, role.companyId);
    });

    it('should throw if role is not AUTHOR', async () => {
      const iUser = { id: 'user1' };
      const user = { id: 'user1', roles: [], selectedRole: 'role1' };
      const role = { type: RoleTypes.VIEWER };
      mockUserService.getUser.mockResolvedValue(user);
      mockRoleService.getUserSelectedRole.mockReturnValue(role);
      await expect(service.createPaymentSession(iUser, { planId: 'plan1', companyId: 'company1' })).rejects.toThrow(BadRequestException);
    });
  });

  describe('checkoutPayment', () => {
    it('should update transaction and company on successful payment', async () => {
      mockStripeService.checkSessionPayment.mockResolvedValue('paid');
      mockPrisma.transaction.update.mockResolvedValue({ planId: 'plan1' });
      mockPrisma.companySubscription.create.mockResolvedValue({ id: 'sub1' });
      mockPrisma.company.update.mockResolvedValue({});
      const input = { companyId: 'c1', transactionId: 't1', sessionId: 's1' };
      const result = await service.checkoutPayment(input);
      expect(result).toEqual({ status: 'OK', result: 'SUCCESS' });
      expect(mockPrisma.transaction.update).toHaveBeenCalledWith({ where: { id: 't1' }, data: { status: TransactionStatus.SUCCEEDED } });
      expect(mockPrisma.company.update).toHaveBeenCalled();
    });

    it('should cancel transaction if payment not successful', async () => {
      mockStripeService.checkSessionPayment.mockResolvedValue('not_paid');
      mockPrisma.transaction.update.mockResolvedValue({});
      const input = { companyId: 'c1', transactionId: 't1', sessionId: 's1' };
      const result = await service.checkoutPayment(input);
      expect(result).toEqual({ status: 'OK', result: 'CANCELLED' });
      expect(mockPrisma.transaction.update).toHaveBeenCalledWith({ where: { id: 't1' }, data: { status: 'CANCELED', sessionUrl: '' } });
    });
  });
}); 