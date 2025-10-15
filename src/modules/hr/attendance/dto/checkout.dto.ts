import { IsInt, IsDateString, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CheckoutDto {
  @ApiProperty({ description: 'Employee ID', example: 1 })
  @Type(() => Number)
  @IsInt()
  employee_id: number;

  @ApiProperty({ description: 'Date in YYYY-MM-DD format', example: '2023-01-15' })
  @IsDateString()
  date: string;

  @ApiProperty({ description: 'Check-out time in HH:MM:SS format', example: '17:30:00' })
  @IsDateString()
  checkout: string;
} 