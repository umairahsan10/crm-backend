export interface CheckoutResponseDto {
  id: number;
  employee_id: number;
  date: string | null;
  checkin: string | null;
  checkout: string | null;
  mode: 'onsite' | 'remote' | null;
  status: 'present' | 'late' | 'half_day' | 'absent' | null;
  total_hours_worked: number;
  created_at: string;
  updated_at: string;
} 