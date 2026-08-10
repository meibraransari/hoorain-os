import { Body, Controller, Delete, Get, Param, Post, Put, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ContributeGoalDto } from './dto/contribute-goal.dto';
import { CreateGoalDto } from './dto/create-goal.dto';
import { UpdateGoalDto } from './dto/update-goal.dto';
import { GoalsService } from './goals.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('goals')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/goals')
export class GoalsController {
  constructor(private readonly goalsService: GoalsService) {}

  @Get()
  @ApiOperation({ summary: "List the user's savings goals" })
  @ApiResponse({ status: 200, description: 'List of goals' })
  findAll(@Req() req: any) {
    return this.goalsService.findAll(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single goal by id' })
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.goalsService.findOne(id, req.user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new savings goal' })
  create(@Body() dto: CreateGoalDto, @Req() req: any) {
    return this.goalsService.create(req.user.id, dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an existing goal' })
  update(@Param('id') id: string, @Body() dto: UpdateGoalDto, @Req() req: any) {
    return this.goalsService.update(id, req.user.id, dto);
  }

  @Post(':id/contribute')
  @ApiOperation({ summary: "Contribute towards a goal's currentAmount (clamped to [0, targetAmount])" })
  contribute(@Param('id') id: string, @Body() dto: ContributeGoalDto, @Req() req: any) {
    return this.goalsService.contribute(id, req.user.id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a goal' })
  remove(@Param('id') id: string, @Req() req: any) {
    return this.goalsService.remove(id, req.user.id);
  }
}
