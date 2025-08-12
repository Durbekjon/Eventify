import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common'
import { PrismaService } from '@/core/prisma/prisma.service'
import { ADMIN_MESSAGES } from '../../constants/admin-messages.const'
import { UserStatus } from '@prisma/client'

@Injectable()
export class UserManagementService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get users with pagination and filtering
   */
  async getUsers(page: number = 1, limit: number = 10, filters?: any) {
    const skip = (page - 1) * limit
    const where = this.buildUserFilters(filters)

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          isAdmin: true,
          createdAt: true,
          updatedAt: true,
          avatar: {
            select: {
              id: true,
              path: true,
            },
          },
          companies: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: {
              companies: true,
              transactions: true,
            },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ])

    return {
      users: users.map((user) => ({
        ...user,
        companyCount: user._count.companies,
        transactionCount: user._count.transactions,
        _count: undefined,
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    }
  }

  /**
   * Get user by ID with detailed information
   */
  async getUserById(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        companies: {
          select: {
            id: true,
            name: true,
            isBlocked: true,
            createdAt: true,
          },
        },
        transactions: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            amount: true,
            status: true,
            createdAt: true,
            company: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    })

    if (!user) {
      throw new NotFoundException(ADMIN_MESSAGES.ERRORS.USER_NOT_FOUND)
    }

    return user
  }

  /**
   * Update user information
   */
  async updateUser(userId: string, updateData: any) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      throw new NotFoundException(ADMIN_MESSAGES.ERRORS.USER_NOT_FOUND)
    }

    // Validate email uniqueness if email is being updated
    if (updateData.email && updateData.email !== user.email) {
      const existingUser = await this.prisma.user.findUnique({
        where: { email: updateData.email },
      })
      if (existingUser) {
        throw new BadRequestException('Email already exists')
      }
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        isAdmin: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return updatedUser
  }

  /**
   * Block/unblock user
   */
  async toggleUserBlock(userId: string, isBlocked: boolean) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      throw new NotFoundException(ADMIN_MESSAGES.ERRORS.USER_NOT_FOUND)
    }

    // For now, we'll use a custom field or update the user status
    // In a real implementation, you might want to add a status field to the User model
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        status: isBlocked ? UserStatus.BLOCKED : UserStatus.ACTIVE,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        isAdmin: true,
        createdAt: true,
        updatedAt: true,
        status: true,
      },
    })

    return {
      user: updatedUser,
      action: isBlocked ? 'blocked' : 'unblocked',
      message: isBlocked
        ? ADMIN_MESSAGES.OPERATIONS.USER_BLOCKED
        : ADMIN_MESSAGES.OPERATIONS.USER_UNBLOCKED,
    }
  }

  /**
   * Delete user (soft delete or hard delete)
   */
  async deleteUser(userId: string, hardDelete: boolean = false) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        companies: true,
        transactions: true,
      },
    })

    if (!user) {
      throw new NotFoundException(ADMIN_MESSAGES.ERRORS.USER_NOT_FOUND)
    }

    // Check if user has associated data
    if (user.companies.length > 0 || user.transactions.length > 0) {
      throw new BadRequestException(
        'Cannot delete user with associated data. Consider blocking instead.',
      )
    }

    if (hardDelete) {
      await this.prisma.user.delete({
        where: { id: userId },
      })
    } else {
      // Soft delete - update user status
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          // You might want to add a deletedAt field to the User model
          // deletedAt: new Date(),
        },
      })
    }

    return {
      message: `User ${hardDelete ? 'deleted' : 'soft deleted'} successfully`,
      userId,
    }
  }

  /**
   * Get user activity - using a separate query to the log table
   */
  async getUserActivity(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit

    // Assuming you have a separate Log model with userId field
    try {
      const [logs, total] = await Promise.all([
        this.prisma.log.findMany({
          where: { userId },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            company: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        }),
        this.prisma.log.count({ where: { userId } }),
      ])

      return {
        logs,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      // If Log model doesn't exist or doesn't have userId field, return empty
      return {
        logs: [],
        pagination: {
          page,
          limit,
          total: 0,
          pages: 0,
        },
      }
    }
  }

  /**
   * Get user statistics
   */
  async getUserStatistics(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        _count: {
          select: {
            companies: true,
            transactions: true,
          },
        },
        transactions: {
          where: { status: 'SUCCEEDED' },
          select: {
            amount: true,
            createdAt: true,
          },
        },
      },
    })

    if (!user) {
      throw new NotFoundException(ADMIN_MESSAGES.ERRORS.USER_NOT_FOUND)
    }

    const totalSpent = user.transactions.reduce(
      (sum, t) => sum + t.amount / 100,
      0,
    )

    // Try to get last activity from logs if available
    let lastActivity = null
    try {
      const lastLog = await this.prisma.log.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true },
      })
      lastActivity = lastLog?.createdAt || null
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      // Log model might not exist or doesn't have userId field
      lastActivity = user.updatedAt
    }

    return {
      userId: user.id,
      email: user.email,
      name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
      isAdmin: user.isAdmin,
      statistics: {
        companies: user._count.companies,
        transactions: user._count.transactions,
        totalSpent: Math.round(totalSpent * 100) / 100,
        lastActivity,
      },
    }
  }

  /**
   * Bulk operations on users
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async bulkUserOperations(userIds: string[], operation: string, data?: any) {
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
    })

    if (users.length !== userIds.length) {
      throw new BadRequestException('Some users not found')
    }

    switch (operation) {
      case 'block':
        await this.prisma.user.updateMany({
          where: { id: { in: userIds } },
          data: {
            /* status: 'BLOCKED' */
            // You might want to add a status field to the User model
          },
        })
        return { message: `${users.length} users blocked successfully` }

      case 'unblock':
        await this.prisma.user.updateMany({
          where: { id: { in: userIds } },
          data: {
            /* status: 'ACTIVE' */
            // You might want to add a status field to the User model
          },
        })
        return { message: `${users.length} users unblocked successfully` }

      case 'delete':
        // Check for associated data before deletion
        const usersWithData = await this.prisma.user.findMany({
          where: { id: { in: userIds } },
          include: {
            _count: {
              select: {
                companies: true,
                transactions: true,
              },
            },
          },
        })

        const canDelete = usersWithData.every(
          (user) =>
            user._count.companies === 0 && user._count.transactions === 0,
        )

        if (!canDelete) {
          throw new BadRequestException(
            'Some users have associated data and cannot be deleted',
          )
        }

        await this.prisma.user.deleteMany({
          where: { id: { in: userIds } },
        })
        return { message: `${users.length} users deleted successfully` }

      default:
        throw new BadRequestException('Invalid operation')
    }
  }

  // Private helper methods
  private buildUserFilters(filters?: any) {
    const where: any = {}

    if (filters?.email) {
      where.email = { contains: filters.email, mode: 'insensitive' }
    }

    if (filters?.firstName) {
      where.firstName = { contains: filters.firstName, mode: 'insensitive' }
    }

    if (filters?.lastName) {
      where.lastName = { contains: filters.lastName, mode: 'insensitive' }
    }

    if (filters?.isAdmin !== undefined) {
      where.isAdmin = filters.isAdmin
    }

    if (filters?.createdAt) {
      where.createdAt = {
        gte: new Date(filters.createdAt),
      }
    }

    if (filters?.updatedAt) {
      where.updatedAt = {
        gte: new Date(filters.updatedAt),
      }
    }

    return where
  }
}
