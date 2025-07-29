export interface AttendanceLogResponseDto {
  id: number;
  employee_id: number;
  employee_first_name: string;
  employee_last_name: string;
  date: string | null;
  checkin: string | null;
  checkout: string | null;
  mode: 'onsite' | 'remote' | null;
  status: 'present' | 'absent' | 'late' | 'half_day' | 'leave' | null;
  created_at: string;
  updated_at: string;
} 