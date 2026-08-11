import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DateRangeQueryDto } from './dto/date-range-query.dto';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('net-worth')
  @ApiOperation({ summary: 'Sum of currentBalance across accounts flagged includeInNetWorth' })
  @ApiResponse({ status: 200, description: 'Net worth total' })
  getNetWorth(@Req() req: any) {
    return this.reportsService.getNetWorth(req.user.id);
  }

  @Get('cash-flow')
  @ApiOperation({ summary: 'Income minus expense within a date range' })
  @ApiResponse({ status: 200, description: 'Cash flow summary' })
  getCashFlow(@Query() query: DateRangeQueryDto, @Req() req: any) {
    return this.reportsService.getCashFlow(req.user.id, query);
  }

  @Get('by-category')
  @ApiOperation({ summary: 'Expense spend grouped by categoryId within a date range' })
  @ApiResponse({ status: 200, description: 'Spend by category' })
  getByCategory(@Query() query: DateRangeQueryDto, @Req() req: any) {
    return this.reportsService.getByCategory(req.user.id, query);
  }

  @Get('profit-loss')
  @ApiOperation({ summary: 'Executive Profit & Loss summary with revenue, expenses, net margin, and MoM growth velocity' })
  @ApiResponse({ status: 200, description: 'Profit & Loss summary' })
  getProfitLoss(@Req() req: any) {
    return this.reportsService.getProfitLoss(req.user.id);
  }

  @Get('credit-utilization')
  @ApiOperation({ summary: 'Credit card and loan utilization percentages with debt safety status' })
  @ApiResponse({ status: 200, description: 'Credit utilization breakdown' })
  getCreditUtilization(@Req() req: any) {
    return this.reportsService.getCreditUtilization(req.user.id);
  }
}
