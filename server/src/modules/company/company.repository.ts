import { PrismaService } from '@core/prisma/prisma.service'
import { Injectable } from '@nestjs/common'

@Injectable()
export class CompanyRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string) {
    return this.prisma.company.findUnique({
      where: { id },
      include: { roles: true, members: true },
    })
  }
}
