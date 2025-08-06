import { IsOptional, IsInt, IsDateString, Min, Max } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class GetAttendanceLogsDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  employee_id?: number;

  @IsOptional()
  @IsDateString()
  start_date?: string;

  @IsOptional()
  @IsDateString()
  end_date?: string;
} 