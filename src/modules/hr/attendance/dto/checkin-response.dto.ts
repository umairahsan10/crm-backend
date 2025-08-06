export interface LateDetailsDto {
  minutes_late: number;
  requires_reason: boolean;
}

export interface CheckinResponseDto {
  id: number;
  employee_id: number;
  date: string | null;
  checkin: string | null;
  mode: 'onsite' | 'remote' | null;
  status: 'present' | 'late' | 'half_day' | 'absent' | null;
  late_details?: LateDetailsDto | null;
  created_at: string;
  updated_at: string;
} 