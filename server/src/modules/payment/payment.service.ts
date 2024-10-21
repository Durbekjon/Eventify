import { PrismaService } from '@core/prisma/prisma.service'
import { BadRequestException, Injectable } from '@nestjs/common'
import { StripeService } from '@stripe/stripe.service'
import { IUser } from '@user/dto/IUser'
import { CreatePaymentDto } from './dto/create-payment.dto'
import { PaymentRepository } from './payment.repository'
import { RoleTypes, TransactionStatus, User } from '@prisma/client'
import { RoleDto } from '@role/dto/role.dto'
import { HTTP_MESSAGES } from '@consts/http-messages'
import { UserService } from '@user/user.service'
import { RoleService } from '@role/role.service'
import { query } from 'express'

@Injectable()
export class PaymentService {
  constructor(
    private readonly repository: PaymentRepository,
    private readonly prisma: PrismaService,
    private readonly userService: UserService,
    private readonly roleService: RoleService,
    private readonly stripeService: StripeService,
  ) {}

  // Creates a Stripe payment session after validating user and role
  async createPaymentSession(iUser: IUser, body: CreatePaymentDto) {
    const { user, role } = await this.validateUserRole(iUser)
    const plan = await this.repository.getPlan(body.planId)
    return this.stripeService.createCheckoutSession(
      plan,
      user.id,
      role.companyId,
    )
  }

  // Handles checkout payment and updates transaction and company details
  async checkoutPayment({
    companyId,
    transactionId,
    sessionId,
  }: {
    companyId: string
    transactionId: string
    sessionId: string
  }) {
    const sessionStatus =
      await this.stripeService.checkSessionPayment(sessionId)

    if (sessionStatus === 'paid') {
      const transaction = await this.prisma.transaction.update({
        where: { id: transactionId },
        data: { status: TransactionStatus.SUCCEEDED },
      })

      const nextMonthDate = getNextMonthSameDay(new Date())
      const newSubscription = await this.prisma.companySubscription.create({
        data: {
          companyId,
          startDate: new Date(),
          endDate: nextMonthDate,
          planId: transaction.planId,
        },
      })

      await this.prisma.company.update({
        where: { id: companyId },
        data: {
          isBlocked: false,
          plan: { connect: { id: transaction.planId } },
          currentSubscriptionId: newSubscription.id,
        },
      })

      return { status: 'OK', result: 'SUCCESS' }
    }

    await this.prisma.transaction.update({
      where: { id: transactionId },
      data: { status: 'CANCELED', sessionUrl: '' },
    })
    return { status: 'OK', result: 'CANCELLED' }
  }

  // Validates user role, ensuring it exists and is an AUTHOR
  private async validateUserRole(
    user: IUser,
  ): Promise<{ user: User; role: RoleDto }> {
    const currentUser = await this.userService.getUser(user.id)

    const selectedRole = this.roleService.getUserSelectedRole({
      roles: currentUser.roles,
      selectedRole: currentUser.selectedRole,
    })

    if (!selectedRole || selectedRole.type !== RoleTypes.AUTHOR) {
      throw new BadRequestException(HTTP_MESSAGES.ROLE.NOT_EXIST)
    }

    return { user: currentUser, role: selectedRole }
  }
}

// Utility function to calculate the same day of the next month at 00:00
function getNextMonthSameDay(date: Date): Date {
  const currentMonth = date.getMonth()
  const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1 // Handle December to January transition
  const year = nextMonth === 0 ? date.getFullYear() + 1 : date.getFullYear()

  const nextMonthSameDay = new Date(date)
  nextMonthSameDay.setMonth(nextMonth)
  nextMonthSameDay.setFullYear(year)
  nextMonthSameDay.setHours(0, 0, 0, 0) // Set time to 00:00:00

  return nextMonthSameDay
}
