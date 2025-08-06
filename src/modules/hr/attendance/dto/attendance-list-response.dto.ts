export interface AttendanceListResponseDto {
  id: number;
  employee_id: number;
  present_days: number | null;
  absent_days: number | null;
  late_days: number | null;
  leave_days: number | null;
  remote_days: number | null;
  quarterly_leaves: number | null;
  monthly_lates: number | null;
  half_days: number | null;
  created_at: string;
  updated_at: string;
} 