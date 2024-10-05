import {
  Body,
  Controller,
  Delete,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common'
import { ColumnService } from './column.service'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { JwtAuthGuard } from '@guards/jwt-auth.guard'
import { CreateColumnDto } from './dto/create-column.dto'
import { User } from '@decorators/user.decorator'
import { IUser } from '@user/dto/IUser'
import { Column } from '@prisma/client'
import { UpdateColumnDto } from './dto/update-column.dto'

@ApiBearerAuth()
@ApiTags('Column')
@UseGuards(JwtAuthGuard)
@Controller({ path: 'column', version: '1' })
export class ColumnController {
  constructor(private readonly service: ColumnService) {}

  @Post()
  @ApiOperation({ summary: 'Create column' })
  createColumn(
    @Body() body: CreateColumnDto,
    @User() user: IUser,
  ) {
    return this.service.createColumn(body, user)
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update column' })
  updateColumn(
    @Param('id') id: string,
    @Body() body: UpdateColumnDto,
    @User() user: IUser,
  ): Promise<Column> {
    return this.service.updateColumn(user, id, body)
  }
  @Delete(':id')
  deleteColumn(@Param('id') id: string, @User() user: IUser) {
    return this.service.deleteColumn(id, user)
  }
}
