import { IsOptional, IsString, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class GetAttendanceListDto {
  @IsOptional()
  @IsString()
  start_date?: string; // YYYY-MM-DD

  @IsOptional()
  @IsString()
  end_date?: string; // YYYY-MM-DD

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;

  @IsOptional()
  @IsString()
  search?: string; // employee name or id
}

export class AttendanceListItemDto {
  id: number;
  employee_id: number;
  employee_first_name: string;
  employee_last_name: string;
  present_days: number;
  absent_days: number;
  late_days: number;
  leave_days: number;
  half_days: number;
  remote_days?: number;
  monthly_lates?: number;
  quarterly_leaves?: number;
  period_start?: string;
  period_end?: string;
  created_at: string;
  updated_at: string;
}

export class PaginationMetaDto {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export class AttendanceListResponseDto {
  data: AttendanceListItemDto[];
  meta: PaginationMetaDto;
}
