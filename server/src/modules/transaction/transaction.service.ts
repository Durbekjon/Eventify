import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { QueryFilterDto } from './dto/query-filter.dto'
import { IUser } from '@user/dto/IUser'
import { RoleDto } from '@role/dto/role.dto'
import { TransactionRepository } from './transaction.repository'
import { RoleService } from '@role/role.service'
import { HTTP_MESSAGES } from '@consts/http-messages'
import { RoleTypes, User } from '@prisma/client'
import { UserService } from '@user/user.service'

@Injectable()
export class TransactionService {
  constructor(
    private readonly transactionRepository: TransactionRepository,
    private readonly userService: UserService,
    private readonly roleService: RoleService,
  ) {}

  async getTransactions(user: IUser, filter: QueryFilterDto) {
    const companyId = await this.getCompanyId(user)
    return this.transactionRepository.getTransactions(companyId, filter)
  }

  async getTransaction(user: IUser, transactionId: string) {
    const companyId = await this.getCompanyId(user)
    const transaction = await this.transactionRepository.getTransaction(
      transactionId,
      companyId,
    )
    
    if (!transaction) {
      throw new NotFoundException(HTTP_MESSAGES.TRANSACTION.NOT_FOUND)
    }
    
    return transaction
  }

  private async getCompanyId(user: IUser): Promise<string> {
    const { role } = await this.validateUserRole(user)
    return role.companyId
  }

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
