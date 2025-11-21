import { IsOptional, IsInt, IsDateString, IsString, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ExportHalfDayLogsDto {
  @ApiPropertyOptional({
    description: 'Filter by specific employee ID',
    example: 42,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  employee_id?: number;

  @ApiPropertyOptional({
    description: 'Start date for filtering logs (inclusive)',
    example: '2025-09-01',
  })
  @IsOptional()
  @IsDateString()
  start_date?: string;

  @ApiPropertyOptional({
    description: 'End date for filtering logs (inclusive)',
    example: '2025-09-30',
  })
  @IsOptional()
  @IsDateString()
  end_date?: string;

  @ApiPropertyOptional({
    description: 'Export format of the data (CSV or JSON)',
    enum: ['csv', 'json'],
    example: 'csv',
  })
  @IsOptional()
  @IsString()
  @IsIn(['csv', 'json'])
  format?: string;

  @ApiPropertyOptional({
    description: 'Whether to include reviewer details in export',
    example: true,
    default: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  include_reviewer_details?: boolean = true;

  @ApiPropertyOptional({
    description: 'Whether to include half-day type information in export',
    example: true,
    default: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  include_half_day_type?: boolean = true;
}
