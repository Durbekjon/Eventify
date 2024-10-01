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
import { CompanyService } from './company.service'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { CreateCompanyDto } from './dto/create-company.dto'
import { JwtAuthGuard } from '@/guards/jwt-auth.guard'
import { UpdateCompanyDto } from './dto/update-company.dto'
import { User } from '@decorators/user.decorator'
import { IUser } from '@/modules/user/dto/IUser'

@ApiBearerAuth()
@ApiTags('Company')
@UseGuards(JwtAuthGuard)
@Controller({ path: 'company', version: '1' })
export class CompanyController {
  constructor(private readonly service: CompanyService) {}

  @Post()
  @ApiOperation({ summary: 'Create company' })
  createCompany(@User() user: IUser, @Body() body: CreateCompanyDto) {
    return this.service.create(body, user)
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get company' })
  getCompanyById(@User() user: IUser, @Param('id') id: string) {
    return this.service.getOne(id, user)
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update company' })
  updateCompany(
    @User() user: IUser,
    @Param('id') id: string,
    @Body() body: UpdateCompanyDto,
  ) {
    return this.service.update(id, body, user)
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete company' })
  deleteCompany(@User() user: IUser, @Param('id') id: string) {
    return this.service.delete(id, user)
  }
}
