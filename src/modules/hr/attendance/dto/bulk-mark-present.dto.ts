import { IsDateString, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class BulkMarkPresentDto {
  @ApiProperty({ description: 'Date to mark all employees present (YYYY-MM-DD)', example: '2023-01-15' })
  @IsDateString()
  date: string; // Format: YYYY-MM-DD

  @ApiPropertyOptional({ description: 'Optional reason for marking all present', example: 'Company event' })
  @IsOptional()
  @IsString()
  reason?: string; // Optional reason for marking all present (e.g., "Company event", "Holiday compensation")
}
