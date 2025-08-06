export interface LateLogsListResponseDto {
  late_log_id: number;
  emp_id: number;
  employee_name: string;
  date: string;
  scheduled_time_in: string;
  actual_time_in: string;
  minutes_late: number;
  reason: string | null;
  justified: boolean | null;
  late_type: 'paid' | 'unpaid' | null;
  action_taken: 'Created' | 'Pending' | 'Completed';
  reviewed_by: number | null;
  reviewer_name: string | null;
  created_at: string;
  updated_at: string;
} 