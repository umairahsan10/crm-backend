import { IsInt, IsDateString, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateLeaveLogDto {
  @ApiProperty({ description: 'Employee ID', example: 1 })
  @Type(() => Number)
  @IsInt()
  emp_id: number;

  @ApiPropertyOptional({ description: 'Type of leave', example: 'sick' })
  @IsOptional()
  @IsString()
  leave_type?: string;

  @ApiProperty({
    description: 'Leave start date (YYYY-MM-DD)',
    example: '2023-01-15',
  })
  @IsDateString()
  start_date: string;

  @ApiProperty({
    description: 'Leave end date (YYYY-MM-DD)',
    example: '2023-01-17',
  })
  @IsDateString()
  end_date: string;

  @ApiPropertyOptional({
    description: 'Reason for leave',
    example: 'Medical appointment',
  })
  @IsOptional()
  @IsString()
  reason?: string;
}
