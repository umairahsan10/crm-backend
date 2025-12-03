import {
  IsOptional,
  IsInt,
  IsDateString,
  IsString,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ExportProjectLogsDto {
  @ApiPropertyOptional({
    description: 'Filter logs by specific project ID',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  project_id?: number;

  @ApiPropertyOptional({
    description: 'Filter logs by specific developer/employee ID',
    example: 42,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  developer_id?: number;

  @ApiPropertyOptional({
    description: 'Start date for filtering project logs (inclusive)',
    example: '2025-09-01',
  })
  @IsOptional()
  @IsDateString()
  start_date?: string;

  @ApiPropertyOptional({
    description: 'End date for filtering project logs (inclusive)',
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
    description: 'Include project details in the exported data',
    example: true,
    default: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  include_project_details?: boolean = true;

  @ApiPropertyOptional({
    description: 'Include developer details in the exported data',
    example: true,
    default: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  include_developer_details?: boolean = true;
}
