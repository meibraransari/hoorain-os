import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { BudgetPeriod } from '../../database/entities/budget.entity';
import { BudgetCategoryAllocationDto } from './budget-category-allocation.dto';

export class CreateBudgetDto {
  @ApiProperty({ example: 'Monthly Groceries' })
  @IsString()
  name: string;

  @ApiProperty({ example: 500 })
  @IsNumber()
  amount: number;

  @ApiPropertyOptional({ enum: BudgetPeriod, default: BudgetPeriod.MONTHLY })
  @IsOptional()
  @IsEnum(BudgetPeriod)
  period?: BudgetPeriod;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isRollover?: boolean;

  @ApiPropertyOptional({ default: 80 })
  @IsOptional()
  @IsNumber()
  alertThreshold?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional({ type: [BudgetCategoryAllocationDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BudgetCategoryAllocationDto)
  categories?: BudgetCategoryAllocationDto[];
}
