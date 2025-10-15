import { IsOptional, IsInt, IsDateString, IsString, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ExportLeaveLogsDto {
  @ApiPropertyOptional({
    description: 'Filter leave logs by specific employee ID',
    example: 42,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  employee_id?: number;

  @ApiPropertyOptional({
    description: 'Start date for filtering leave logs (inclusive)',
    example: '2025-09-01',
  })
  @IsOptional()
  @IsDateString()
  start_date?: string;

  @ApiPropertyOptional({
    description: 'End date for filtering leave logs (inclusive)',
    example: '2025-09-30',
  })
  @IsOptional()
  @IsDateString()
  end_date?: string;

  @ApiPropertyOptional({
    description: 'Export file format (CSV or JSON)',
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
    description: 'Include confirmation reason for each leave entry',
    example: true,
    default: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  include_confirmation_reason?: boolean = true;
}
