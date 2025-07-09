import { JwtAuthGuard } from '@guards/jwt-auth.guard'
import { Controller, Get, Param, UseGuards } from '@nestjs/common'
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
  @ApiOperation({ summary: "Get company's logs" })
  get(@User() user: IUser) {
    return this.service.getLogs(user)
  }

  @Get('workspace/:workspaceId')
  @ApiOperation({ summary: 'Get by workspace id' })
  getByWorkspace(
    @User() user: IUser,
    @Param('workspaceId') workspaceId: string,
  ) {
    return this.service.getByWorkspace(user, workspaceId)
  }

  @Get('sheet/:sheetId')
  @ApiOperation({ summary: 'Get by sheet id' })
  getBySheet(@User() user: IUser, @Param('sheetId') sheetId: string) {
    return this.service.getByWorkspace(user, sheetId)
  }

  @Get('task/:taksId')
  @ApiOperation({ summary: 'Get by task id' })
  getByTask(@User() user: IUser, @Param('taksId') taksId: string) {
    return this.service.getByWorkspace(user, taksId)
  }
}
