import { Controller, Get, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { AdminGuard } from '@/guards/admin.guard'
import { Admin } from '@/decorators/admin.decorator'
import { IUser } from '@/modules/user/dto/IUser'

@ApiBearerAuth()
@ApiTags('Admin System Management')
@UseGuards(AdminGuard)
@Controller({ path: 'admin/system', version: '1' })
export class SystemController {
  @Get()
  @ApiOperation({ summary: 'Get system status (Sprint 3)' })
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getSystemStatus(@Admin() admin: IUser) {
    // Placeholder for Sprint 3
    return {
      message: 'System management endpoints will be implemented in Sprint 3',
    }
  }
}
