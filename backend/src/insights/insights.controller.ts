import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { InsightsService } from './insights.service';

@ApiTags('AI Financial Health & Insights')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/insights')
export class InsightsController {
  constructor(private readonly insightsService: InsightsService) {}

  @Get('health-score')
  @ApiOperation({ summary: 'Get AI Financial Health Score (0-100) and Smart Spending Insights' })
  @ApiResponse({ status: 200, description: 'Health score breakdown and automated insights' })
  async getHealthScoreAndInsights(@Request() req: any) {
    return this.insightsService.getHealthScoreAndInsights(req.user.id);
  }
}
