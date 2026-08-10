import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

export class ContributeGoalDto {
  @ApiProperty({ description: 'Amount to add to the goal (use a negative value to withdraw)' })
  @IsNumber()
  amount: number;
}
