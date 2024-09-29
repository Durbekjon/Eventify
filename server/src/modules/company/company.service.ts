import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { CreateCompanyDto } from './dto/create-company.dto'
import { CompanyRepository } from './company.repository'
import { PrismaService } from '@core/prisma/prisma.service'
import { IUser } from '@/modules/user/dto/IUser'
import { RoleService } from '@role/role.service'
import { RoleTypes } from '@prisma/client'
import { HTTP_MESSAGES } from '@consts/http-messages'
import { UpdateCompanyDto } from './dto/update-company.dto'
import { MemberService } from '@member/member.service'

@Injectable()
export class CompanyService {
  constructor(
    private readonly repository: CompanyRepository,
    private readonly role: RoleService,
    private readonly member: MemberService,
    private readonly prisma: PrismaService,
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

    return {
      status: 'OK',
      result: company.id,
    }
  }

  async getOne(id: string, user: IUser) {
    const company = await this.repository.findById(id)

    if (!company || company.authorId !== user.id)
      throw new NotFoundException(HTTP_MESSAGES.COMPANY_NOT_FOUND)

    return company
  }

  async update(id: string, body: UpdateCompanyDto, user: IUser) {
    const company = await this.repository.findById(id)

    if (!company || company.authorId !== user.id)
      throw new NotFoundException(HTTP_MESSAGES.COMPANY_NOT_FOUND)

    const data = { name: body.name }
    return await this.prisma.company.update({
      where: { id },
      data,
    })
  }

  async delete(id: string, user: IUser) {
    const company = await this.repository.findById(id)

    if (!company || company.authorId !== user.id)
      throw new NotFoundException(HTTP_MESSAGES.COMPANY_NOT_FOUND)

    await this.prisma.company.delete({ where: { id } })

    if (company.roles.length > 0) await this.role.deleteCompanyRoles(company.id)
    if (company.members.length > 0)
      await this.member.deleteManyMembersByCompany(company.id)

    return { status: 'OK' }
  }
}
