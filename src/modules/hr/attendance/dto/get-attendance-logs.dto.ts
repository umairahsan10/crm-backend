import { IsOptional, IsInt, IsDateString, Min, Max } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class GetAttendanceLogsDto {
  @ApiPropertyOptional({ description: 'Filter by employee ID', example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  employee_id?: number;

  @ApiPropertyOptional({ description: 'Start date for filtering (YYYY-MM-DD)', example: '2023-01-01' })
  @IsOptional()
  @IsDateString()
  start_date?: string;

  @ApiPropertyOptional({ description: 'End date for filtering (YYYY-MM-DD)', example: '2023-01-31' })
  @IsOptional()
  @IsDateString()
  end_date?: string;
} 