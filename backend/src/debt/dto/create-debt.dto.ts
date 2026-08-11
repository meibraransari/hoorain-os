import { IsString, IsNotEmpty, IsNumber, IsOptional, Min } from 'class-validator';

export class CreateDebtDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsNumber()
  @Min(0)
  balance: number;

  @IsNumber()
  @Min(0)
  interestRate: number;

  @IsNumber()
  @Min(0)
  minimumPayment: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  extraPayment?: number;

  @IsString()
  @IsOptional()
  category?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
