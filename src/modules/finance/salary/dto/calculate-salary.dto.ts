import { IsInt, IsOptional, IsString, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CalculateSalaryDto {
  @ApiProperty({
    example: 123,
    description: 'ID of the employee for salary calculation',
  })
  @IsInt()
  employee_id: number;

  @ApiPropertyOptional({
    example: '2025-09-01',
    description: 'Start date of the salary period (optional)',
  })
  @IsOptional()
  @IsString()
  @IsDateString()
  start_date?: string;

  @ApiPropertyOptional({
    example: '2025-09-30',
    description: 'End date of the salary period (optional)',
  })
  @IsOptional()
  @IsString()
  @IsDateString()
  end_date?: string;
}
