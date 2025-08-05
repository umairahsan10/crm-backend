import { IsNumber, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateBaseSalaryDto {
  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  @Min(0)
  baseSalary: number;
} 