import { IsInt, IsDateString, IsOptional, IsString, IsNumber } from 'class-validator';
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

  @ApiProperty({ required: false, description: 'IANA timezone of the client (e.g., Asia/Karachi)', example: 'Asia/Karachi' })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiProperty({ required: false, description: 'Client UTC offset in minutes at event time (e.g., 300 for +05:00)', example: 300 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  offset_minutes?: number;
} 