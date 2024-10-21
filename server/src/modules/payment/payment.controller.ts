import { JwtAuthGuard } from '@guards/jwt-auth.guard'
import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { PaymentService } from './payment.service'
import { IUser } from '@user/dto/IUser'
import { CreatePaymentDto } from './dto/create-payment.dto'
import { User } from '@decorators/user.decorator'
@ApiTags('Payment')
@Controller({ path: 'payment', version: '1' })
export class PaymentController {
  constructor(private readonly service: PaymentService) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create Payment Intent' })
  createPayment(@User() user: IUser, @Body() body: CreatePaymentDto) {
    return this.service.createPaymentSession(user, body)
  }

  @Get()
  get(
    @Query()
    query: {
      companyId: string
      transactionId: string
      sessionId: string
    },
  ) {
    return this.service.checkoutPayment(query)
  }
}
