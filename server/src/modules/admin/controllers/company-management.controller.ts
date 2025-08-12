import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags, ApiParam, ApiQuery } from '@nestjs/swagger'
import { AdminGuard } from '@/guards/admin.guard'
import { AdminRateLimitGuard } from '../guards/admin-rate-limit.guard'
import { AdminAuditInterceptor } from '../interceptors/admin-audit.interceptor'
import { AdminLoggingInterceptor } from '../interceptors/admin-logging.interceptor'
import { CompanyManagementService } from '../services/company-management/company-management.service'
import { Admin } from '@/decorators/admin.decorator'
import { IUser } from '@/modules/user/dto/IUser'
import { RequireAdminPermission } from '../decorators/admin-permission.decorator'
import { AdminPermission } from '../types/admin-permissions.types'
import {
  CompanyFilterDto,
  UpdateCompanyDto,
  ToggleCompanyBlockDto,
  DeleteCompanyDto,
  BulkCompanyOperationDto,
  CompanyResponseDto,
  CompanyDetailResponseDto,
  CompanyUsageDto,
  CompanyFinancialDto,
  CompanyActivityResponseDto,
} from '../dto/company-management/company-management.dto'

@ApiBearerAuth()
@ApiTags('Admin Company Management')
@UseGuards(AdminGuard, AdminRateLimitGuard)
@UseInterceptors(AdminAuditInterceptor, AdminLoggingInterceptor)
@Controller({ path: 'admin/companies', version: '1' })
export class CompanyManagementController {
  constructor(private readonly companyManagementService: CompanyManagementService) {}

  @Get()
  @ApiOperation({ summary: 'Get companies with pagination and filtering' })
  @RequireAdminPermission(AdminPermission.VIEW_COMPANIES)
  async getCompanies(
    @Admin() admin: IUser,
    @Query() filters: CompanyFilterDto,
  ) {
    return this.companyManagementService.getCompanies(
      filters.page,
      filters.limit,
      filters,
    )
  }

  @Get(':companyId')
  @ApiOperation({ summary: 'Get company by ID with detailed information' })
  @ApiParam({ name: 'companyId', description: 'Company ID' })
  @RequireAdminPermission(AdminPermission.VIEW_COMPANIES)
  async getCompanyById(
    @Admin() admin: IUser,
    @Param('companyId') companyId: string,
  ) {
    return this.companyManagementService.getCompanyById(companyId)
  }

  @Put(':companyId')
  @ApiOperation({ summary: 'Update company information' })
  @ApiParam({ name: 'companyId', description: 'Company ID' })
  @RequireAdminPermission(AdminPermission.MANAGE_COMPANIES)
  async updateCompany(
    @Admin() admin: IUser,
    @Param('companyId') companyId: string,
    @Body() updateData: UpdateCompanyDto,
  ) {
    return this.companyManagementService.updateCompany(companyId, updateData)
  }

  @Post(':companyId/block')
  @ApiOperation({ summary: 'Block or unblock company' })
  @ApiParam({ name: 'companyId', description: 'Company ID' })
  @RequireAdminPermission(AdminPermission.BLOCK_COMPANIES)
  async toggleCompanyBlock(
    @Admin() admin: IUser,
    @Param('companyId') companyId: string,
    @Body() blockData: ToggleCompanyBlockDto,
  ) {
    return this.companyManagementService.toggleCompanyBlock(companyId, blockData.isBlocked)
  }

  @Delete(':companyId')
  @ApiOperation({ summary: 'Delete company (soft or hard delete)' })
  @ApiParam({ name: 'companyId', description: 'Company ID' })
  @RequireAdminPermission(AdminPermission.DELETE_COMPANIES)
  async deleteCompany(
    @Admin() admin: IUser,
    @Param('companyId') companyId: string,
    @Body() deleteData: DeleteCompanyDto,
  ) {
    return this.companyManagementService.deleteCompany(companyId, deleteData.hardDelete)
  }

  @Get(':companyId/usage')
  @ApiOperation({ summary: 'Get company usage statistics' })
  @ApiParam({ name: 'companyId', description: 'Company ID' })
  @RequireAdminPermission(AdminPermission.VIEW_COMPANIES)
  async getCompanyUsage(
    @Admin() admin: IUser,
    @Param('companyId') companyId: string,
  ) {
    return this.companyManagementService.getCompanyUsage(companyId)
  }

  @Get(':companyId/activity')
  @ApiOperation({ summary: 'Get company activity logs' })
  @ApiParam({ name: 'companyId', description: 'Company ID' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @RequireAdminPermission(AdminPermission.VIEW_COMPANIES)
  async getCompanyActivity(
    @Admin() admin: IUser,
    @Param('companyId') companyId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.companyManagementService.getCompanyActivity(companyId, page || 1, limit || 20)
  }

  @Get(':companyId/financial')
  @ApiOperation({ summary: 'Get company financial summary' })
  @ApiParam({ name: 'companyId', description: 'Company ID' })
  @RequireAdminPermission(AdminPermission.VIEW_COMPANIES)
  async getCompanyFinancialSummary(
    @Admin() admin: IUser,
    @Param('companyId') companyId: string,
  ) {
    return this.companyManagementService.getCompanyFinancialSummary(companyId)
  }

  @Post('bulk')
  @ApiOperation({ summary: 'Perform bulk operations on companies' })
  @RequireAdminPermission(AdminPermission.MANAGE_COMPANIES)
  async bulkCompanyOperations(
    @Admin() admin: IUser,
    @Body() bulkData: BulkCompanyOperationDto,
  ) {
    return this.companyManagementService.bulkCompanyOperations(
      bulkData.companyIds,
      bulkData.operation,
      bulkData.data,
    )
  }
}
