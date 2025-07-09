import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common'
import { SelectService } from './select.service'
import { User } from '@/decorators/user.decorator'
import { IUser } from '@user/dto/IUser'
import { CreateSelectDto } from './dto/create-select.dto'
import { UpdateSelectDto } from './dto/update-select.dto'
import { DeleteSelectsDto } from './dto/delete-selects.dto'
import { ApiBearerAuth, ApiOperation, ApiTags, ApiParam } from '@nestjs/swagger'
import { JwtAuthGuard } from '@/guards/jwt-auth.guard'
import {
  DeleteResponseDto,
  SelectResponseDto,
  UpdateSelectResponseDto,
} from './dto/select-response.dto'

@ApiBearerAuth()
@ApiTags('Select')
@UseGuards(JwtAuthGuard)
@Controller({ path: 'select', version: '1' })
export class SelectController {
  constructor(private readonly service: SelectService) {}

  @Post()
  @ApiOperation({ summary: 'Create select' })
  createSelect(
    @User() user: IUser,
    @Body() body: CreateSelectDto,
  ): Promise<SelectResponseDto> {
    return this.service.createSelect(body, user)
  }

  @Get()
  @ApiOperation({ summary: 'Get all selects' })
  getSelects(@User() user: IUser) {
    return this.service.getSelects(user)
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific select' })
  @ApiParam({ name: 'id', description: 'Select ID' })
  getSelect(@User() user: IUser, @Param('id') id: string) {
    return this.service.getSelect(user, id)
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a select' })
  @ApiParam({ name: 'id', description: 'Select ID' })
  updateSelect(
    @User() user: IUser,
    @Param('id') id: string,
    @Body() body: UpdateSelectDto,
  ): Promise<UpdateSelectResponseDto> {
    return this.service.updateSelect(user, id, body)
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a select' })
  @ApiParam({ name: 'id', description: 'Select ID' })
  deleteSelect(
    @User() user: IUser,
    @Param('id') id: string,
  ): Promise<DeleteResponseDto> {
    return this.service.deleteSelect(user, id)
  }

  @Delete()
  @ApiOperation({ summary: 'Delete multiple selects' })
  deleteSelects(
    @User() user: IUser,
    @Body() body: DeleteSelectsDto,
  ): Promise<DeleteResponseDto> {
    return this.service.deleteSelects(user, body)
  }
}
