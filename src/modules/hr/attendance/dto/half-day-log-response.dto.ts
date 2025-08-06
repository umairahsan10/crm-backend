export interface HalfDayLogResponseDto {
  half_day_log_id: number;
  emp_id: number;
  date: string;
  scheduled_time_in: string;
  actual_time_in: string;
  minutes_late: number;
  reason: string;
  justified: boolean | null;
  half_day_type: 'paid' | 'unpaid' | null;
  action_taken: 'Created' | 'Pending' | 'Completed';
  reviewed_by: number | null;
  created_at: string;
  updated_at: string;
  // Attendance table updates (only included when action is 'Completed')
  attendance_updates?: {
    half_days: number;
    monthly_half_days: number;
  };
} 