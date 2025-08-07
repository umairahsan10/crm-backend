export interface LeaveLogResponseDto {
  leave_log_id: number;
  emp_id: number;
  employee_name: string;
  leave_type: string | null;
  start_date: string;
  end_date: string;
  reason: string | null;
  status: 'Pending' | 'Approved' | 'Rejected' | null;
  applied_on: string;
  reviewed_by: number | null;
  reviewer_name: string | null;
  reviewed_on: string | null;
  confirmation_reason: string | null;
  created_at: string;
  updated_at: string;
} 