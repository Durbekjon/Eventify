import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common'
import { TransactionService } from './transaction.service'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { User } from '@decorators/user.decorator'
import { IUser } from '@user/dto/IUser'
import { QueryFilterDto } from './dto/query-filter.dto'
import { JwtAuthGuard } from '@guards/jwt-auth.guard'

@ApiBearerAuth()
@ApiTags('Company Transactions')
@UseGuards(JwtAuthGuard)
@Controller({ path: 'transaction', version: '1' })
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Get()
  @ApiOperation({ summary: 'Get transactions' })
  async getTransactions(@User() user: IUser, @Query() filter: QueryFilterDto) {
    return this.transactionService.getTransactions(user, filter)
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get transaction' })
  async getTransaction(@User() user: IUser, @Param('id') id: string) {
    return this.transactionService.getTransaction(user, id)
  }
}
