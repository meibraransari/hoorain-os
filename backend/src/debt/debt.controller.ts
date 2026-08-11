import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DebtService } from './debt.service';
import { CreateDebtDto } from './dto/create-debt.dto';
import { UpdateDebtDto } from './dto/update-debt.dto';

@ApiTags('Debt Payoff & Amortization Planner')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('debts')
export class DebtController {
  constructor(private readonly debtService: DebtService) {}

  @Get()
  @ApiOperation({ summary: 'Get all debts with Snowball & Avalanche payoff simulations' })
  @ApiResponse({ status: 200, description: 'Debts list and payoff comparison metrics' })
  async findAll(@Request() req: any) {
    return this.debtService.findAll(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a debt record by ID' })
  async findOne(@Param('id') id: string, @Request() req: any) {
    return this.debtService.findOne(id, req.user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new debt or loan record' })
  async create(@Request() req: any, @Body() dto: CreateDebtDto) {
    return this.debtService.create(req.user.id, dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an existing debt record' })
  async update(@Param('id') id: string, @Request() req: any, @Body() dto: UpdateDebtDto) {
    return this.debtService.update(id, req.user.id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a debt record' })
  async remove(@Param('id') id: string, @Request() req: any) {
    return this.debtService.remove(id, req.user.id);
  }
}
