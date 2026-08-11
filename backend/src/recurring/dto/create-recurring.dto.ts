import { IsString, IsNotEmpty, IsNumber, IsEnum, IsOptional, IsDateString, IsBoolean } from 'class-validator';
import { RecurringFrequency, RecurringType } from '../../database/entities/recurring-transaction.entity';

export class CreateRecurringDto {
  @IsString()
  @IsNotEmpty()
  accountId: string;

  @IsString()
  @IsOptional()
  categoryId?: string;

  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @IsEnum(RecurringType)
  type: RecurringType;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsEnum(RecurringFrequency)
  frequency: RecurringFrequency;

  @IsDateString()
  @IsNotEmpty()
  nextDate: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
