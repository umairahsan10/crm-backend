import {
  IsInt,
  IsString,
  IsDateString,
  IsNotEmpty,
  Min,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class SubmitLateReasonDto {
  @ApiProperty({ description: 'Employee ID', example: 1 })
  @IsInt()
  @Type(() => Number)
  @IsNotEmpty()
  emp_id: number;

  @ApiProperty({
    description: 'Date of late arrival (YYYY-MM-DD)',
    example: '2023-01-15',
  })
  @IsDateString()
  @IsNotEmpty()
  date: string;

  @ApiProperty({
    description: 'Scheduled check-in time (HH:MM)',
    example: '09:00',
    maxLength: 10,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(10)
  scheduled_time_in: string;

  @ApiProperty({
    description: 'Actual check-in time (HH:MM)',
    example: '09:15',
    maxLength: 10,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(10)
  actual_time_in: string;

  @ApiProperty({
    description: 'Number of minutes late',
    example: 15,
    minimum: 0,
  })
  @IsInt()
  @Type(() => Number)
  @Min(0)
  minutes_late: number;

  @ApiProperty({ description: 'Reason for being late', example: 'Traffic jam' })
  @IsString()
  @IsNotEmpty()
  reason: string;
}
