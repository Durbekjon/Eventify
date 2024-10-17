import { JwtAuthGuard } from '@guards/jwt-auth.guard'
import { Controller, Get, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { LogService } from './log.service'
import { User } from '@decorators/user.decorator'
import { IUser } from '@user/dto/IUser'

@ApiBearerAuth()
@ApiTags('Log')
@UseGuards(JwtAuthGuard)
@Controller({ path: 'log', version: '1' })
export class LogController {
  constructor(private readonly service: LogService) {}

  @Get()
  @ApiOperation({ summary: "Get company's datas" })
  get(@User() user: IUser) {
    return this.service.getLogs(user)
  }
}
