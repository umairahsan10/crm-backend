import { IsInt, IsString, IsDateString, IsNotEmpty, Min, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class SubmitHalfDayReasonDto {
  @ApiProperty({
    description: 'Unique ID of the employee submitting the half-day reason',
    example: 101,
  })
  @IsInt()
  @Type(() => Number)
  @IsNotEmpty()
  emp_id: number;

  @ApiProperty({
    description: 'Date for which the half-day or late arrival is being logged (ISO format)',
    example: '2025-10-15',
  })
  @IsDateString()
  @IsNotEmpty()
  date: string;

  @ApiProperty({
    description: 'Scheduled time the employee was supposed to check in',
    example: '09:00',
    maxLength: 10,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(10)
  scheduled_time_in: string;

  @ApiProperty({
    description: 'Actual time the employee checked in',
    example: '09:45',
    maxLength: 10,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(10)
  actual_time_in: string;

  @ApiProperty({
    description: 'Total number of minutes the employee was late',
    example: 45,
    minimum: 0,
  })
  @IsInt()
  @Type(() => Number)
  @Min(0)
  minutes_late: number;

  @ApiProperty({
    description: 'Reason provided by the employee for being late or taking a half day',
    example: 'Car broke down on the way to work',
  })
  @IsString()
  @IsNotEmpty()
  reason: string;
} 