import {
  Body,
  Controller,
  Delete,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common'
import { OptionService } from './option.service'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { User } from '@decorators/user.decorator'
import { IUser } from '@user/dto/IUser'
import { CreateOptionDto } from './dto/create-option.dto'
import { UpdateOptionDto } from './dto/uptdate-option.dto'
import { JwtAuthGuard } from '@guards/jwt-auth.guard'
@ApiBearerAuth()
@ApiTags('Option')
@UseGuards(JwtAuthGuard)
@Controller({ path: 'option', version: '1' })
export class OptionController {
  constructor(private readonly service: OptionService) {}

  @Post()
  @ApiOperation({ summary: 'Create option' })
  createOption(@User() user: IUser, @Body() body: CreateOptionDto) {
    return this.service.createOption(user, body)
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update option' })
  updateOption(
    @User() user: IUser,
    @Param('id') id: string,
    @Body() body: UpdateOptionDto,
  ) {
    return this.service.updateOption(user, id, body)
  }
  @Delete('select/:id')
  @ApiOperation({ summary: 'Delete options by select id' })
  deleteOptions(@User() user: IUser, @Param('id') id: string) {
    return this.service.deleteOptions(user, id)
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete option' })
  deleteOption(@User() user: IUser, @Param('id') id: string) {
    return this.service.deleteOption(user, id)
  }
}
