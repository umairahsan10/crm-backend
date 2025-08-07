import { IsInt, IsOptional, IsString, IsDateString } from 'class-validator';

export class CalculateSalaryDto {
  @IsInt()
  employee_id: number;

  @IsOptional()
  @IsString()
  @IsDateString()
  start_date?: string;

  @IsOptional()
  @IsString()
  @IsDateString()
  end_date?: string;
} 