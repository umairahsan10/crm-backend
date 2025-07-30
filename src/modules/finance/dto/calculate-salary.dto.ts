import { IsInt, IsOptional, IsString } from 'class-validator';

export class CalculateSalaryDto {
  @IsInt()
  employee_id: number;

  @IsOptional()
  @IsString()
  start_date?: string;

  @IsOptional()
  @IsString()
  end_date?: string;
} 