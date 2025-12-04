import {
  IsDateString,
  IsOptional,
  IsString,
  IsArray,
  IsNumber,
  ArrayMinSize,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class BulkMarkPresentDto {
  @ApiPropertyOptional({
    description:
      'Date to mark employees present (YYYY-MM-DD). If not provided, uses current PKT date. Supports cross-day scenarios for night shifts.',
    example: '2023-01-15',
  })
  @IsOptional()
  @IsDateString()
  date?: string; // Format: YYYY-MM-DD, optional - defaults to current PKT date

  @ApiPropertyOptional({
    description: 'Check-in time in ISO 8601 format. If not provided, uses current time.',
    example: '2023-01-15T09:00:00Z'
  })
  @IsOptional()
  @IsDateString()
  checkin?: string; // Format: ISO 8601 timestamp, optional - defaults to current time

  @ApiPropertyOptional({ 
    description: 'Array of employee IDs to mark present. If not provided, marks all active employees.', 
    example: [1, 2, 3],
    type: [Number],
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1, {
    message:
      'If provided, employee_ids array must contain at least one employee ID',
  })
  @IsNumber({}, { each: true, message: 'Each employee ID must be a number' })
  @Type(() => Number)
  employee_ids?: number[];

  @ApiPropertyOptional({ description: 'Work mode', enum: ['onsite', 'remote'], example: 'onsite' })
  @IsOptional()
  @IsString()
  mode?: 'onsite' | 'remote';

  @ApiPropertyOptional({ description: 'IANA timezone of the client (e.g., Asia/Karachi)', example: 'Asia/Karachi' })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiPropertyOptional({ description: 'Client UTC offset in minutes at event time (e.g., 300 for +05:00)', example: 300 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  offset_minutes?: number;

  @ApiPropertyOptional({
    description: 'Optional reason for marking employees present',
    example: 'Company event',
  })
  @IsOptional()
  @IsString()
  reason?: string; // Optional reason for marking employees present (e.g., "Company event", "Holiday compensation")
}
