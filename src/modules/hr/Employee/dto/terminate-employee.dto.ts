import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsString, IsDateString, IsOptional } from 'class-validator';

export class TerminateEmployeeDto {
  @ApiProperty({ description: 'ID of the employee to terminate', example: 123 })
  @IsInt()
  employee_id: number;

  @ApiProperty({
    description: 'Date of termination (ISO format YYYY-MM-DD)',
    example: '2025-10-15',
  })
  @IsDateString()
  termination_date: string;

  @ApiPropertyOptional({
    description: 'Optional reason or description for termination',
    example: 'Contract ended due to project completion.',
  })
  @IsOptional()
  @IsString()
  description?: string;
}