import { PrismaService } from '@core/prisma/prisma.service'
import { Injectable } from '@nestjs/common'
import { CreateLogDto } from './dto/create-log.dto'

@Injectable()
export class LogRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(body: CreateLogDto) {
    return this.prisma.log.create({
      data: {
        message: body.message,
        company: { connect: { id: body.companyId } },
        user: { connect: { id: body.userId } },
      },
    })
  }

  getByCompany(companyId: string) {
    return this.prisma.log.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
    })
  }
}
