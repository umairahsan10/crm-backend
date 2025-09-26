import { IsOptional, IsInt, IsDateString, IsString, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class ExportHalfDayLogsDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  employee_id?: number;

  @IsOptional()
  @IsDateString()
  start_date?: string;

  @IsOptional()
  @IsDateString()
  end_date?: string;

  @IsOptional()
  @IsString()
  @IsIn(['csv', 'json'])
  format?: string;

  @IsOptional()
  @Type(() => Boolean)
  include_reviewer_details?: boolean = true;

  @IsOptional()
  @Type(() => Boolean)
  include_half_day_type?: boolean = true;
}
