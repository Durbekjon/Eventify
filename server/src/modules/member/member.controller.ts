import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common'
import { MemberService } from './member.service'
import { CreateMemberDto } from './dto/create-member.dto'
import { User } from '@decorators/user.decorator'
import { IUser } from '@/modules/user/dto/IUser'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { JwtAuthGuard } from '@/guards/jwt-auth.guard'
import { StatusUpdateDto } from './dto/status-update.dto'
import { UpdateMemberDto } from './dto/update-member.dto'

@ApiBearerAuth()
@ApiTags('Member')
@UseGuards(JwtAuthGuard)
@Controller({ path: 'member', version: '1' })
export class MemberController {
  constructor(private readonly service: MemberService) {}

  @Get()
  @ApiOperation({ summary: 'Get members' })
  getUser(@User() user: IUser) {
    return this.service.getMembers(user)
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get member' })
  getMember(@User() user: IUser, @Param('id') id: string) {
    return this.service.getMember(id, user)
  }

  @Post()
  @ApiOperation({ summary: 'Create member' })
  createMember(@User() user: IUser, @Body() body: CreateMemberDto) {
    return this.service.createMember(body, user)
  }

  @Patch('cancel-invite/:id')
  @ApiOperation({ summary: 'Cancel member' })
  cancelMemberInvite(@Param('id') id: string, @User() user: IUser) {
    return this.service.cancel(id, user)
  }

  @Patch('status/:id')
  @ApiOperation({ summary: 'Change member status' })
  statusMember(
    @Param('id') id: string,
    @User() user: IUser,
    @Body() body: StatusUpdateDto,
  ) {
    return this.service.updateMemberStatus(id, user, body)
  }

  @Put()
  @ApiOperation({ summary: 'Update member' })
  updateMember(
    @Param('id') id: string,
    @User() user: IUser,
    @Body() body: UpdateMemberDto,
  ) {
    return this.service.updateMember(id, user, body)
  }
}
