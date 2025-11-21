import { IsNumber, Min } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateBaseSalaryDto {
  @ApiProperty({ description: 'Base salary amount', example: 55000.00 })
  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  @Min(0)
  baseSalary: number;
} 