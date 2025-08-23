import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
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
import { FilterDto } from './dto/filter.dto'
import { Member } from '@prisma/client'

@ApiBearerAuth()
@ApiTags('Member')
@UseGuards(JwtAuthGuard)
@Controller({ path: 'member', version: '1' })
export class MemberController {
  constructor(private readonly service: MemberService) {}

  @Get()
  @ApiOperation({ summary: 'Get members' })
<<<<<<< HEAD
  getUser(@User() user: IUser) {
    return this.service.getMembers(user, null)
  }

  @Get('paginated')
  @ApiOperation({ summary: 'Get paginated members' })
  getPaginatedMembers(@User() user: IUser, @Query() filter: FilterDto) {
=======
  getMembers(
    @User() user: IUser,
    @Query() filter: FilterDto,
  ): Promise<{ members: Member[]; count: number }> {
>>>>>>> refs/remotes/origin/main
    return this.service.getMembers(user, filter)
  }

  @Get('invitations')
  @ApiOperation({ summary: 'Get invitations' })
  getInvitations(@User() user: IUser) {
    return this.service.getInvitations(user)
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

  @Put(':id')
  @ApiOperation({ summary: 'Update member' })
  updateMember(
    @Param('id') id: string,
    @User() user: IUser,
    @Body() body: UpdateMemberDto,
  ): Promise<Member> {
    return this.service.updateMember(id, user, body)
  }
}
