import { IsInt, IsDateString, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateLeaveLogDto {
  @Type(() => Number)
  @IsInt()
  emp_id: number;

  @IsOptional()
  @IsString()
  leave_type?: string;

  @IsDateString()
  start_date: string;

  @IsDateString()
  end_date: string;

  @IsOptional()
  @IsString()
  reason?: string;
} 