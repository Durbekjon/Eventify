import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { CreateCompanyDto } from './dto/create-company.dto'
import { CompanyRepository } from './company.repository'
import { PrismaService } from '@core/prisma/prisma.service'
import { IUser } from '@/modules/user/dto/IUser'
import { RoleService } from '@role/role.service'
import { Company, Prisma, RoleTypes } from '@prisma/client'
import { HTTP_MESSAGES } from '@consts/http-messages'
import { UpdateCompanyDto } from './dto/update-company.dto'
import { LogRepository } from '@log/log.repository'
import { CreateLogDto } from '@log/dto/create-log.dto'
import { LOG_MESSAGES } from '@consts/log.messages'
import { UserService } from '@user/user.service'
import { RoleDto } from '@role/dto/role.dto'

@Injectable()
export class CompanyService {
  constructor(
    private readonly repository: CompanyRepository,
    private readonly role: RoleService,
    private readonly prisma: PrismaService,
    private readonly log: LogRepository,
    private readonly user: UserService,
  ) {}
  async create(body: CreateCompanyDto, user: IUser) {
    const company = await this.prisma.company.create({
      data: { name: body.name, author: { connect: { id: user.id } } },
    })

    const roleOptions = {
      user: user.id,
      company: company.id,
      type: RoleTypes.AUTHOR,
      access: null,
    }

    await this.role.createRole(roleOptions)
    
    await this.createLog(user.id, company.id, LOG_MESSAGES.CREATED_COMPANY)
    return {
      status: 'OK',
      result: company.id,
    }
  }

  async getOne(id: string, user: IUser) {
    await this.validateUserRole(user)

    const company = await this.repository.findById(id)

    if (!company) throw new NotFoundException(HTTP_MESSAGES.COMPANY.NOT_FOUND)

    return company
  }

  async update(id: string, body: UpdateCompanyDto, user: IUser) {
    await this.validateUserRole(user)

    const company = await this.findOne(id, user.id)

    const data = { name: body.name }

    const logMessage = `Company name: ${company.name} changed to ${body.name}`

    await this.createLog(user.id, company.id, logMessage)

    return await this.prisma.company.update({
      where: { id },
      data,
    })
  }

  async delete(id: string, user: IUser) {
    await this.validateUserRole(user)

    await this.findOne(id, user.id)

    await this.prisma.company.delete({ where: { id } })

    await this.cleanDatas(id)

    return { status: 'OK' }
  }

  private async findOne(companyId: string, userId: string): Promise<Company> {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
    })

    if (!company) throw new NotFoundException(HTTP_MESSAGES.COMPANY.NOT_FOUND)

    if (company.authorId !== userId)
      throw new ForbiddenException(HTTP_MESSAGES.COMPANY.NOT_AUTHOR)

    return company
  }

  private async cleanDatas(companyId: string) {
    const option = { where: { companyId } }
    await this.prisma.$transaction([
      this.prisma.log.deleteMany(option),
      this.prisma.task.deleteMany(option),
      this.prisma.member.deleteMany(option),
      this.prisma.notification.deleteMany(option),
      this.prisma.workspace.deleteMany(option),
      this.prisma.sheet.deleteMany(option),
      this.prisma.select.deleteMany(option),
      this.prisma.column.deleteMany(option),
      this.prisma.companySubscription.deleteMany(option),
      this.prisma.role.deleteMany(option),
      this.prisma.log.deleteMany(option),
    ])
  }

  private async createLog(userId: string, companyId: string, message: string) {
    const data: Prisma.LogCreateInput = {
      user: { connect: { id: userId } },
      company: { connect: { id: companyId } },
      message,
    }
    return this.log.create(data)
  }

  private async validateUserRole(iUser: IUser): Promise<RoleDto> {
    const { id } = iUser

    const user = await this.user.getUser(id)
    if (!user) throw new BadRequestException(HTTP_MESSAGES.USER.NOT_FOUND)

    const role: RoleDto = await this.role.getUserSelectedRole(user)
    if (role.type !== RoleTypes.AUTHOR)
      throw new ForbiddenException(HTTP_MESSAGES.GENERAL.ACCESS_DENIED)

    return role
  }
}
