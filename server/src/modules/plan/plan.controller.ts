import { Admin } from '@/decorators/admin.decorator'
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
import {
  ApiBearerAuth,
  ApiOperation,
  ApiProperty,
  ApiTags,
} from '@nestjs/swagger'
import { PlanService } from './plan.service'
import { CreatePlanDto } from './dto/create-plan.dto'
import { UpdatePlanDto } from './dto/update-plan.dto'

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
  @ApiOperation({ summary: 'Get plans' })
  getPlans() {
    return this.service.getPlans()
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
