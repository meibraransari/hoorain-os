import { Body, Controller, Delete, Get, Param, Post, Put, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { BudgetsService } from './budgets.service';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('budgets')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/budgets')
export class BudgetsController {
  constructor(private readonly budgetsService: BudgetsService) {}

  @Get()
  @ApiOperation({ summary: "List the user's budgets with category allocations" })
  @ApiResponse({ status: 200, description: 'List of budgets' })
  findAll(@Req() req: any) {
    return this.budgetsService.findAll(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single budget with its category allocations' })
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.budgetsService.findOne(id, req.user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new budget, optionally with category allocations' })
  create(@Body() dto: CreateBudgetDto, @Req() req: any) {
    return this.budgetsService.create(req.user.id, dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a budget and (optionally) replace its category allocations' })
  update(@Param('id') id: string, @Body() dto: UpdateBudgetDto, @Req() req: any) {
    return this.budgetsService.update(id, req.user.id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a budget and its category allocations' })
  remove(@Param('id') id: string, @Req() req: any) {
    return this.budgetsService.remove(id, req.user.id);
  }
}
