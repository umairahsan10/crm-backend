import { IsOptional, IsString, IsNumber, Min, Max, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export class GetLeaveLogsDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  employee_id?: number;

  @IsOptional()
  @IsString()
  start_date?: string; // YYYY-MM-DD

  @IsOptional()
  @IsString()
  end_date?: string; // YYYY-MM-DD

  @IsOptional()
  @IsString()
  status?: string; // 'pending', 'approved', 'rejected', 'cancelled'

  @IsOptional()
  @IsString()
  leave_type?: string; // 'annual', 'sick', etc.

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
}

export class LeaveLogItemDto {
  id: number;
  employee_id: number;
  employee_first_name?: string;
  employee_last_name?: string;
  start_date: string; // YYYY-MM-DD
  end_date: string; // YYYY-MM-DD
  days: number;
  leave_type: string; // e.g., 'annual', 'sick'
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  reason?: string | null;
  reviewer_id?: number | null;
  reviewer_notes?: string | null;
  created_at: string;
  updated_at: string;
}

export class LeaveLogsResponseDto {
  data: LeaveLogItemDto[];
  meta?: { page: number; limit: number; total: number };
}

export class GetLeaveLogsStatsDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  employee_id?: number;

  @IsOptional()
  @IsString()
  start_date?: string;

  @IsOptional()
  @IsString()
  end_date?: string;

  @IsOptional()
  @IsString()
  period?: string; // 'daily', 'weekly', 'monthly', 'yearly'

  @IsOptional()
  @Type(() => Boolean)
  include_breakdown?: boolean;
}

export class LeaveLogsStatsDto {
  total_leaves: number;
  pending: number;
  approved: number;
  rejected: number;
  days_by_type?: { [leave_type: string]: number };
  by_employee?: Array<{ employee_id: number; name: string; total_leaves: number }>;
}

export class LeaveLogActionDto {
  @IsEnum(['approve', 'reject', 'cancel'])
  action: 'approve' | 'reject' | 'cancel';

  @Type(() => Number)
  @IsNumber()
  reviewer_id: number;

  @IsOptional()
  @IsString()
  reviewer_notes?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  adjust_days?: number;

  @IsOptional()
  @IsEnum(['approved', 'rejected', 'cancelled'])
  status?: 'approved' | 'rejected' | 'cancelled';
}

export class LeaveLogActionResponseDto {
  message: string;
  data: LeaveLogItemDto;
}
