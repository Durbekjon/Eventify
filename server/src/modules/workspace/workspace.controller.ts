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
import { WorkspaceService } from './workspace.service'
import {
  ApiBearerAuth,
  ApiOperation,
  ApiProperty,
  ApiTags,
} from '@nestjs/swagger'
import { JwtAuthGuard } from '@/guards/jwt-auth.guard'
import { User } from '@decorators/user.decorator'
import { IUser } from '@/modules/user/dto/IUser'
import { CreateWorkspaceDto } from './dto/create-workspace.dto'
import { UpdateWorkspaceDto } from './dto/update-workspace.dto'
import { WorkspaceReorderDto } from './dto/reorder-workspaces.dto'
@ApiBearerAuth()
@ApiTags('Workspace')
@UseGuards(JwtAuthGuard)
@Controller({ path: 'workspace', version: '1' })
export class WorkspaceController {
  constructor(private readonly service: WorkspaceService) {}

  @Post()
  @ApiOperation({ summary: 'Create workspace' })
  createWorkspace(@User() user: IUser, @Body() body: CreateWorkspaceDto) {
    return this.service.createWorkspace(body, user)
  }

  @Get()
  @ApiOperation({ summary: 'Get workspaces' })
  getWorkspaces(@User() user: IUser) {
    return this.service.getWorkspaces(user)
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get workspace' })
  getWorkspace(@User() user: IUser, @Param('id') id: string) {
    return this.service.getWorkspace(user, id)
  }

  @Put()
  @ApiOperation({ summary: 'Reorder workspaces' })
  reorderWorkspaces(@User() user: IUser, @Body() body: WorkspaceReorderDto) {
    return this.service.reorderWorkspaces(user, body)
  }
  @Put(':id')
  @ApiOperation({ summary: 'Update workspace' })
  updateWorkspace(
    @User() user: IUser,
    @Param('id') id: string,
    @Body() body: UpdateWorkspaceDto,
  ) {
    return this.service.updateWorkspace(id, body, user)
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Deleteworkspace' })
  deleteWorkspace(@User() user: IUser, @Param('id') id: string) {
    return this.service.deleteWorkspace(user, id)
  }
}
