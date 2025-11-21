import { IsInt, IsDateString, IsEnum, IsOptional, IsString, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CheckinDto {
  @ApiProperty({ description: 'Employee ID', example: 1 })
  @Type(() => Number)
  @IsInt()
  employee_id: number;

  @ApiProperty({ description: 'Date in YYYY-MM-DD format', example: '2023-01-15' })
  @IsDateString()
  date: string;

  @ApiProperty({ description: 'Check-in time in HH:MM:SS format', example: '09:00:00' })
  @IsDateString()
  checkin: string;

  @ApiPropertyOptional({ description: 'Work mode', enum: ['onsite', 'remote'], example: 'onsite' })
  @IsOptional()
  @IsEnum(['onsite', 'remote'])
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
} 