import { IsOptional, IsInt, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class GetProjectLogsDto {
  @ApiPropertyOptional({
    description: 'Filter project logs by specific project ID',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  project_id?: number;

  @ApiPropertyOptional({
    description: 'Filter project logs by specific developer/employee ID',
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
}
