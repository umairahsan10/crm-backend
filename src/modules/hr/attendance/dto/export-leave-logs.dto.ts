import { IsOptional, IsInt, IsDateString, IsString, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class ExportLeaveLogsDto {
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
  include_confirmation_reason?: boolean = true;
}
