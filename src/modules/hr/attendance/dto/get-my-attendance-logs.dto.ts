import { IsOptional, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class GetMyAttendanceLogsDto {
  @ApiPropertyOptional({ description: 'Start date for filtering (YYYY-MM-DD)', example: '2024-01-01' })
  @IsOptional()
  @IsDateString()
  start_date?: string;

  @ApiPropertyOptional({ description: 'End date for filtering (YYYY-MM-DD)', example: '2024-01-31' })
  @IsOptional()
  @IsDateString()
  end_date?: string;
}

