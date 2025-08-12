import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { PrismaService } from '@/core/prisma/prisma.service'
import { ADMIN_MESSAGES } from '../../constants/admin-messages.const'

@Injectable()
export class CompanyManagementService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get companies with pagination and filtering
   */
  async getCompanies(page: number = 1, limit: number = 10, filters?: any) {
    const skip = (page - 1) * limit
    const where = this.buildCompanyFilters(filters)

    const [companies, total] = await Promise.all([
      this.prisma.company.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          plan: {
            select: {
              id: true,
              name: true,
              price: true,
            },
          },
          subscriptions: {
            where: { isExpired: false },
            orderBy: { createdAt: 'desc' },
            take: 1,
            include: {
              plan: {
                select: {
                  id: true,
                  name: true,
                  price: true,
                },
              },
            },
          },
          _count: {
            select: {
              workspaces: true,
              sheets: true,
              members: true,
              tasks: true,
              transactions: true,
            },
          },
        },
      }),
      this.prisma.company.count({ where }),
    ])

    return {
      companies: companies.map(company => ({
        ...company,
        workspaceCount: company._count.workspaces,
        sheetCount: company._count.sheets,
        memberCount: company._count.members,
        taskCount: company._count.tasks,
        transactionCount: company._count.transactions,
        currentPlan: company.subscriptions[0]?.plan || company.plan,
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
   * Get company by ID with detailed information
   */
  async getCompanyById(companyId: string) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        plan: {
          select: {
            id: true,
            name: true,
            price: true,
          },
        },
        subscriptions: {
          orderBy: { createdAt: 'desc' },
          include: {
            plan: {
              select: {
                id: true,
                name: true,
                price: true,
              },
            },
          },
        },
        workspaces: {
          select: {
            id: true,
            name: true,
            createdAt: true,
            _count: {
              select: {
                sheets: true,
              },
            },
          },
        },
        members: {
          select: {
            id: true,
            type: true,
            createdAt: true,
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
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
            plan: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    })

    if (!company) {
      throw new NotFoundException(ADMIN_MESSAGES.ERRORS.COMPANY_NOT_FOUND)
    }

    return company
  }

  /**
   * Update company information
   */
  async updateCompany(companyId: string, updateData: any) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
    })

    if (!company) {
      throw new NotFoundException(ADMIN_MESSAGES.ERRORS.COMPANY_NOT_FOUND)
    }

    const updatedCompany = await this.prisma.company.update({
      where: { id: companyId },
      data: updateData,
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        plan: {
          select: {
            id: true,
            name: true,
            price: true,
          },
        },
      },
    })

    return updatedCompany
  }

  /**
   * Block/unblock company
   */
  async toggleCompanyBlock(companyId: string, isBlocked: boolean) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
    })

    if (!company) {
      throw new NotFoundException(ADMIN_MESSAGES.ERRORS.COMPANY_NOT_FOUND)
    }

    const updatedCompany = await this.prisma.company.update({
      where: { id: companyId },
      data: { isBlocked },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    })

    return {
      company: updatedCompany,
      action: isBlocked ? 'blocked' : 'unblocked',
      message: isBlocked 
        ? ADMIN_MESSAGES.OPERATIONS.COMPANY_BLOCKED 
        : ADMIN_MESSAGES.OPERATIONS.COMPANY_UNBLOCKED,
    }
  }

  /**
   * Delete company (soft delete or hard delete)
   */
  async deleteCompany(companyId: string, hardDelete: boolean = false) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      include: {
        workspaces: true,
        sheets: true,
        members: true,
        tasks: true,
        transactions: true,
      },
    })

    if (!company) {
      throw new NotFoundException(ADMIN_MESSAGES.ERRORS.COMPANY_NOT_FOUND)
    }

    // Check if company has associated data
    if (company.workspaces.length > 0 || company.sheets.length > 0 || 
        company.members.length > 0 || company.tasks.length > 0 || 
        company.transactions.length > 0) {
      throw new BadRequestException('Cannot delete company with associated data. Consider blocking instead.')
    }

    if (hardDelete) {
      await this.prisma.company.delete({
        where: { id: companyId },
      })
    } else {
      // Soft delete - update company status
      await this.prisma.company.update({
        where: { id: companyId },
        data: {
          isBlocked: true, // Use isBlocked as soft delete indicator
        },
      })
    }

    return {
      message: `Company ${hardDelete ? 'deleted' : 'soft deleted'} successfully`,
      companyId,
    }
  }

  /**
   * Get company usage statistics
   */
  async getCompanyUsage(companyId: string) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      include: {
        plan: {
          select: {
            id: true,
            name: true,
            price: true,
            maxWorkspaces: true,
            maxSheets: true,
            maxMembers: true,
            maxViewers: true,
            maxTasks: true,
          },
        },
        subscriptions: {
          where: { isExpired: false },
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            plan: {
              select: {
                id: true,
                name: true,
                price: true,
                maxWorkspaces: true,
                maxSheets: true,
                maxMembers: true,
                maxViewers: true,
                maxTasks: true,
              },
            },
          },
        },
        _count: {
          select: {
            workspaces: true,
            sheets: true,
            members: true,
            tasks: true,
          },
        },
        members: {
          select: {
            type: true,
          },
        },
      },
    })

    if (!company) {
      throw new NotFoundException(ADMIN_MESSAGES.ERRORS.COMPANY_NOT_FOUND)
    }

    const currentPlan = company.subscriptions[0]?.plan || company.plan
    const viewerCount = company.members.filter(m => m.type === 'VIEWER').length
    const memberCount = company.members.filter(m => m.type === 'MEMBER').length

    const usage = {
      workspaces: {
        used: company._count.workspaces,
        limit: currentPlan?.maxWorkspaces || 0,
        percentage: currentPlan?.maxWorkspaces ? (company._count.workspaces / currentPlan.maxWorkspaces) * 100 : 0,
      },
      sheets: {
        used: company._count.sheets,
        limit: currentPlan?.maxSheets || 0,
        percentage: currentPlan?.maxSheets ? (company._count.sheets / currentPlan.maxSheets) * 100 : 0,
      },
      members: {
        used: memberCount,
        limit: currentPlan?.maxMembers || 0,
        percentage: currentPlan?.maxMembers ? (memberCount / currentPlan.maxMembers) * 100 : 0,
      },
      viewers: {
        used: viewerCount,
        limit: currentPlan?.maxViewers || 0,
        percentage: currentPlan?.maxViewers ? (viewerCount / currentPlan.maxViewers) * 100 : 0,
      },
      tasks: {
        used: company._count.tasks,
        limit: currentPlan?.maxTasks || 0,
        percentage: currentPlan?.maxTasks ? (company._count.tasks / currentPlan.maxTasks) * 100 : 0,
      },
    }

    return {
      companyId: company.id,
      companyName: company.name,
      currentPlan: currentPlan,
      usage,
      totalMembers: company._count.members,
    }
  }

  /**
   * Get company activity logs
   */
  async getCompanyActivity(companyId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit

    const [logs, total] = await Promise.all([
      this.prisma.log.findMany({
        where: { companyId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      }),
      this.prisma.log.count({ where: { companyId } }),
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
  }

  /**
   * Get company financial summary
   */
  async getCompanyFinancialSummary(companyId: string) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      include: {
        transactions: {
          where: { status: 'SUCCEEDED' },
          select: {
            amount: true,
            createdAt: true,
            plan: {
              select: {
                name: true,
                price: true,
              },
            },
          },
        },
        subscriptions: {
          include: {
            plan: {
              select: {
                name: true,
                price: true,
              },
            },
          },
        },
      },
    })

    if (!company) {
      throw new NotFoundException(ADMIN_MESSAGES.ERRORS.COMPANY_NOT_FOUND)
    }

    const totalSpent = company.transactions.reduce((sum, t) => sum + (t.amount / 100), 0)
    const currentSubscription = company.subscriptions.find(s => !s.isExpired)
    const monthlyRevenue = currentSubscription ? (currentSubscription.plan?.price || 0) / 100 : 0

    return {
      companyId: company.id,
      companyName: company.name,
      financial: {
        totalSpent: Math.round(totalSpent * 100) / 100,
        monthlyRevenue: Math.round(monthlyRevenue * 100) / 100,
        transactionCount: company.transactions.length,
        currentPlan: currentSubscription?.plan?.name || 'No Plan',
        currentPlanPrice: currentSubscription ? (currentSubscription.plan?.price || 0) / 100 : 0,
      },
    }
  }

  /**
   * Bulk operations on companies
   */
  async bulkCompanyOperations(companyIds: string[], operation: string, data?: any) {
    const companies = await this.prisma.company.findMany({
      where: { id: { in: companyIds } },
    })

    if (companies.length !== companyIds.length) {
      throw new BadRequestException('Some companies not found')
    }

    switch (operation) {
      case 'block':
        await this.prisma.company.updateMany({
          where: { id: { in: companyIds } },
          data: { isBlocked: true },
        })
        return { message: `${companies.length} companies blocked successfully` }

      case 'unblock':
        await this.prisma.company.updateMany({
          where: { id: { in: companyIds } },
          data: { isBlocked: false },
        })
        return { message: `${companies.length} companies unblocked successfully` }

      case 'delete':
        // Check for associated data before deletion
        const companiesWithData = await this.prisma.company.findMany({
          where: { id: { in: companyIds } },
          include: {
            _count: {
              select: {
                workspaces: true,
                sheets: true,
                members: true,
                tasks: true,
                transactions: true,
              },
            },
          },
        })

        const canDelete = companiesWithData.every(
          company => company._count.workspaces === 0 && company._count.sheets === 0 && 
                    company._count.members === 0 && company._count.tasks === 0 && 
                    company._count.transactions === 0
        )

        if (!canDelete) {
          throw new BadRequestException('Some companies have associated data and cannot be deleted')
        }

        await this.prisma.company.deleteMany({
          where: { id: { in: companyIds } },
        })
        return { message: `${companies.length} companies deleted successfully` }

      default:
        throw new BadRequestException('Invalid operation')
    }
  }

  // Private helper methods
  private buildCompanyFilters(filters?: any) {
    const where: any = {}

    if (filters?.name) {
      where.name = { contains: filters.name, mode: 'insensitive' }
    }

    if (filters?.isBlocked !== undefined) {
      where.isBlocked = filters.isBlocked
    }

    if (filters?.authorId) {
      where.authorId = filters.authorId
    }

    if (filters?.planId) {
      where.planId = filters.planId
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
