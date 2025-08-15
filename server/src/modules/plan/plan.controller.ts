import { AdminGuard } from '@/guards/admin.guard'
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
import { PlanService } from './plan.service'
import { CreatePlanDto } from './dto/create-plan.dto'
import { UpdatePlanDto } from './dto/update-plan.dto'
import { User } from '@decorators/user.decorator'
import { IUser } from '@user/dto/IUser'
import { JwtAuthGuard } from '@guards/jwt-auth.guard'

@ApiBearerAuth()
@ApiTags('Plan')
@Controller({ path: 'plan', version: '1' })
export class PlanController {
  constructor(private readonly service: PlanService) {}
  @Post()
  @ApiOperation({ summary: 'Create plan' })
  @UseGuards(AdminGuard)
  createPlan(@Body() body: CreatePlanDto) {
    return this.service.createPlan(body)
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get plans' })
  getPlans(@User() user: IUser) {
    return this.service.getPlans(user.id)
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get plan' })
  getPlan(@Param('id') id: string) {
    return this.service.getPlan(id)
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update plan' })
  @UseGuards(AdminGuard)
  updatePlan(@Param('id') id: string, @Body() body: UpdatePlanDto) {
    return this.service.updatePlan(id, body)
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete plan' })
  @UseGuards(AdminGuard)
  deletePlan(@Param('id') id: string) {
    return this.service.deleletePlan(id)
  }
}
