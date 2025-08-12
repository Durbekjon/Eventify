import { Controller, Get, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { AdminGuard } from '@/guards/admin.guard'
import { AdminService } from './admin.service'
import { Admin } from '@/decorators/admin.decorator'
import { IUser } from '@/modules/user/dto/IUser'

@ApiBearerAuth()
@ApiTags('Admin')
@UseGuards(AdminGuard)
@Controller({ path: 'admin', version: '1' })
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('health')
  @ApiOperation({ summary: 'Admin system health check' })
  async getHealth() {
    return this.adminService.getHealth()
  }

  @Get('overview')
  @ApiOperation({ summary: 'Admin system overview' })
  async getOverview(@Admin() admin: IUser) {
    return this.adminService.getOverview(admin)
  }

  @Get('stats')
  @ApiOperation({ summary: 'Admin system statistics' })
  async getStats(@Admin() admin: IUser) {
    return this.adminService.getStats(admin)
  }
}
