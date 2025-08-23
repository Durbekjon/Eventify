import { PrismaService } from '@core/prisma/prisma.service'
import { Injectable } from '@nestjs/common'
import { QueryFilterDto } from './dto/query-filter.dto'
import { Prisma } from '@prisma/client'

@Injectable()
export class TransactionRepository {
  private readonly includeTransaction = {
    plan: {
      select: {
        id: true,
        name: true,
        price: true,
      },
    },
  }

  constructor(private readonly prisma: PrismaService) {}

  async getTransactions(companyId: string, filter: QueryFilterDto) {
    const where = this.buildWhereClause(companyId, filter)
    const pagination = this.buildPaginationOptions(filter)
    const ordering = this.buildOrderingOptions(filter)

    const [transactions, count] = await this.prisma.$transaction([
      this.prisma.transaction.findMany({
        where,
        include: this.includeTransaction,
        ...pagination,
        orderBy: ordering,
      }),
      this.prisma.transaction.count({ where }),
    ])

    return { transactions, count }
  }

  async getTransaction(transactionId: string, companyId: string) {
    return this.prisma.transaction.findUnique({
      where: {
        id: transactionId,
        companyId,
      },
      include: this.includeTransaction,
    })
  }

  private buildWhereClause(companyId: string, filter: QueryFilterDto): Prisma.TransactionWhereInput {
    const where: Prisma.TransactionWhereInput = {
      companyId,
    }

    const dateFilter = this.buildDateFilter(filter)
    if (dateFilter) {
      where.createdAt = dateFilter
    }

    return where
  }

  private buildDateFilter(filter: QueryFilterDto): Prisma.DateTimeFilter | undefined {
    const { startDate, endDate } = filter
    
    if (!startDate && !endDate) {
      return undefined
    }

    const dateFilter: Prisma.DateTimeFilter = {}
    
    if (startDate) {
      dateFilter.gte = startDate
    }
    
    if (endDate) {
      dateFilter.lte = endDate
    }

    return dateFilter
  }

  private buildPaginationOptions(filter: QueryFilterDto) {
    const { page, limit } = filter
    return {
      skip: (page - 1) * limit,
      take: limit,
    }
  }

  private buildOrderingOptions(filter: QueryFilterDto) {
    return {
      createdAt: filter.orderBy,
    }
  }
}
