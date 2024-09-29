import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { SheetService } from './sheet.service'
import { CreateSheetDto } from './dto/create-sheet.dto'
import { User } from '@/decorators/user.decorator'
import { IUser } from '../auth/dto/IUser'
import { UpdateSheetDto } from './dto/update-sheet.dto'

@ApiBearerAuth()
@ApiTags('Sheet')
@UseGuards(JwtAuthGuard)
@Controller({ path: 'sheet', version: '1' })
export class SheetController {
  constructor(private readonly service: SheetService) {}

  @Post()
  @ApiOperation({ summary: 'Create sheet' })
  createSheet(@Body() body: CreateSheetDto, @User() user: IUser) {
    return this.service.createSheet(user, body)
  }
  @Get('/workspace/:id')
  @ApiOperation({ summary: 'Get sheets by workspace id' })
  getSheetsByWorkspaceId(@Param('id') id: string, @User() user: IUser) {
    return this.service.getSheetsByWorkspace(id, user)
  }
  @Get('/:id')
  @ApiOperation({ summary: 'Get sheet' })
  getSheet(@Param('id') id: string, @User() user: IUser) {
    return this.service.getSheet(id, user)
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update sheet' })
  updateSheet(
    @Param('id') id: string,
    @User() user: IUser,
    @Body() body: UpdateSheetDto,
  ) {
    return this.service.updateSheet(id, user, body)
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete sheet' })
  deleteSheet(@Param('id') id: string, @User() user: IUser) {
    return this.service.deleteSheet(id, user)
  }
}
