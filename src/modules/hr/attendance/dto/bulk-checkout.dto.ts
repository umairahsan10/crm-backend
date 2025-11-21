import { IsDateString, IsOptional, IsString, IsArray, IsNumber, ArrayMinSize } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class BulkCheckoutDto {
  @ApiPropertyOptional({ 
    description: 'Date to checkout employees (YYYY-MM-DD). If not provided, uses current PKT date. Supports cross-day scenarios for night shifts.', 
    example: '2023-01-15' 
  })
  @IsOptional()
  @IsDateString()
  date?: string; // Format: YYYY-MM-DD, optional - defaults to current PKT date

  @ApiPropertyOptional({ 
    description: 'Array of employee IDs to checkout. If not provided, checks out all employees with active check-ins for the date.', 
    example: [1, 2, 3],
    type: [Number]
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1, { message: 'If provided, employee_ids array must contain at least one employee ID' })
  @IsNumber({}, { each: true, message: 'Each employee ID must be a number' })
  @Type(() => Number)
  employee_ids?: number[];

  @ApiPropertyOptional({ description: 'Optional reason for bulk checkout', example: 'End of day checkout' })
  @IsOptional()
  @IsString()
  reason?: string; // Optional reason for bulk checkout

  @ApiPropertyOptional({ description: 'IANA timezone of the client (e.g., Asia/Karachi)', example: 'Asia/Karachi' })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiPropertyOptional({ description: 'Client UTC offset in minutes at event time (e.g., 300 for +05:00)', example: 300 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  offset_minutes?: number;
}

