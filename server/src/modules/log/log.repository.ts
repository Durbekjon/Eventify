import { PrismaService } from '@core/prisma/prisma.service'
import { Injectable } from '@nestjs/common'
import { CreateLogDto } from './dto/create-log.dto'
import { Prisma } from '@prisma/client'

@Injectable()
export class LogRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.LogCreateInput) {
    return this.prisma.log.create({ data })
  }

  getByCompany(companyId: string) {
    return this.prisma.log.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
    })
  }
}
