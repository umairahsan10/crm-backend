export interface MonthlyAttendanceResponseDto {
  id: number;
  employee_id: number;
  employee_first_name: string;
  employee_last_name: string;
  month: string;
  total_present: number;
  total_absent: number;
  total_leave_days: number;
  total_late_days: number;
  total_half_days: number;
  total_remote_days: number;
  generated_on: string;
  created_at: string;
  updated_at: string;
} 