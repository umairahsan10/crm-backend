import { IsOptional, IsInt, IsDateString, IsString, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ExportLateLogsDto {
  @ApiPropertyOptional({
    description: 'Filter logs by specific employee ID',
    example: 42,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  employee_id?: number;

  @ApiPropertyOptional({
    description: 'Start date for filtering late logs (inclusive)',
    example: '2025-09-01',
  })
  @IsOptional()
  @IsDateString()
  start_date?: string;

  @ApiPropertyOptional({
    description: 'End date for filtering late logs (inclusive)',
    example: '2025-09-30',
  })
  @IsOptional()
  @IsDateString()
  end_date?: string;

  @ApiPropertyOptional({
    description: 'Desired export format for the data',
    enum: ['csv', 'json'],
    example: 'csv',
  })
  @IsOptional()
  @IsString()
  @IsIn(['csv', 'json'])
  format?: string;

  @ApiPropertyOptional({
    description: 'Include reviewer details in the exported data',
    example: true,
    default: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  include_reviewer_details?: boolean = true;

  @ApiPropertyOptional({
    description: 'Include late type details in the exported data',
    example: true,
    default: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  include_late_type?: boolean = true;
}
