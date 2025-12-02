import { IsOptional, IsInt, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class GetLeaveLogsDto {
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
}
