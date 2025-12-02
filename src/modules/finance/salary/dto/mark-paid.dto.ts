import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Matches,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';

export class FinanceMarkSalaryPaidDto {
  @ApiPropertyOptional({
    description: 'Single employee ID to mark as paid (use for single mark)',
    example: 42,
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  employeeId?: number;

  @ApiPropertyOptional({
    description: 'Array of employee IDs to mark as paid (use for bulk mark)',
    type: [Number],
    example: [1, 2, 3],
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1, {
    message: 'At least one employee ID is required when using employeeIds',
  })
  @IsNumber({}, { each: true, message: 'Each employee ID must be a number' })
  @IsPositive({
    each: true,
    message: 'Each employee ID must be a positive number',
  })
  @Type(() => Number)
  @ValidateIf((dto) => !dto.employeeId)
  employeeIds?: number[];

  @ApiPropertyOptional({
    description:
      'Optional month in YYYY-MM format. Defaults to current month when omitted.',
    example: '2025-11',
    pattern: '^\\d{4}-\\d{2}$',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}$/, {
    message: 'Month must be in YYYY-MM format (e.g., 2025-11)',
  })
  month?: string;
}
