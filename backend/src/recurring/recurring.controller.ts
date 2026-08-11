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
import { RecurringService } from './recurring.service';
import { CreateRecurringDto } from './dto/create-recurring.dto';
import { UpdateRecurringDto } from './dto/update-recurring.dto';

@ApiTags('Recurring Transactions & Bills')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/recurring-transactions')
export class RecurringController {
  constructor(private readonly recurringService: RecurringService) {}

  @Get()
  @ApiOperation({ summary: 'Get all recurring bills, rent, and subscription rules' })
  @ApiResponse({ status: 200, description: 'List of recurring rules' })
  async findAll(@Request() req: any) {
    return this.recurringService.findAll(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a recurring payment rule by ID' })
  async findOne(@Param('id') id: string, @Request() req: any) {
    return this.recurringService.findOne(id, req.user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new recurring bill or subscription rule' })
  async create(@Request() req: any, @Body() dto: CreateRecurringDto) {
    return this.recurringService.create(req.user.id, dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an existing recurring payment rule' })
  async update(@Param('id') id: string, @Request() req: any, @Body() dto: UpdateRecurringDto) {
    return this.recurringService.update(id, req.user.id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a recurring payment rule' })
  async remove(@Param('id') id: string, @Request() req: any) {
    return this.recurringService.remove(id, req.user.id);
  }

  @Post(':id/pay')
  @ApiOperation({ summary: 'Log a real bill payment transaction and advance next due date' })
  async payBill(
    @Param('id') id: string,
    @Request() req: any,
    @Body() payData: { accountId?: string; date?: string; notes?: string },
  ) {
    return this.recurringService.payBill(id, req.user.id, payData);
  }
}
