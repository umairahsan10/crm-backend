import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsString, Matches, IsPositive, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';

export class MarkPaidBulkDto {
  @ApiProperty({
    description: 'Array of employee IDs to mark as paid',
    type: [Number],
    example: [1, 2, 3],
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one employee ID is required' })
  @IsNumber({}, { each: true, message: 'Each employee ID must be a number' })
  @IsPositive({ each: true, message: 'Each employee ID must be a positive number' })
  @Type(() => Number)
  employeeIds: number[];

  @ApiPropertyOptional({
    description: 'Optional month in YYYY-MM format. If not provided, defaults to current month',
    example: '2025-10',
    pattern: '^\\d{4}-\\d{2}$',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}$/, {
    message: 'Month must be in YYYY-MM format (e.g., 2025-10)',
  })
  month?: string;
}

