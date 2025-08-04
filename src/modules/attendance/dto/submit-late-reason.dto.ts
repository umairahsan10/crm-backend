import { IsInt, IsString, IsDateString, IsNotEmpty, Min, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

export class SubmitLateReasonDto {
  @IsInt()
  @Type(() => Number)
  @IsNotEmpty()
  emp_id: number;

  @IsDateString()
  @IsNotEmpty()
  date: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(10)
  scheduled_time_in: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(10)
  actual_time_in: string;

  @IsInt()
  @Type(() => Number)
  @Min(0)
  minutes_late: number;

  @IsString()
  @IsNotEmpty()
  reason: string;
} 