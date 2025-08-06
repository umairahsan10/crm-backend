import { IsInt, IsDateString, IsEnum, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class CheckinDto {
  @Type(() => Number)
  @IsInt()
  employee_id: number;

  @IsDateString()
  date: string;

  @IsDateString()
  checkin: string;

  @IsOptional()
  @IsEnum(['onsite', 'remote'])
  mode?: 'onsite' | 'remote';
} 