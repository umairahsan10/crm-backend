import { ApiProperty } from '@nestjs/swagger';

export class LateDetailsDto {
  @ApiProperty({ description: 'Number of minutes the employee was late' })
  minutes_late: number;

  @ApiProperty({ description: 'Indicates whether a reason submission is required for the late arrival' })
  requires_reason: boolean;
}

export class CheckinResponseDto {
  @ApiProperty({ description: 'Unique identifier for the check-in record' })
  id: number;

  @ApiProperty({ description: 'Employee ID associated with this check-in' })
  employee_id: number;

  @ApiProperty({ type: String, nullable: true, description: 'Date of the check-in (YYYY-MM-DD)' })
  date: string | null;

  @ApiProperty({ type: String, nullable: true, description: 'Timestamp of check-in (ISO 8601)' })
  checkin: string | null;

  @ApiProperty({ enum: ['onsite', 'remote'], nullable: true, description: 'Mode of work for this check-in' })
  mode: 'onsite' | 'remote' | null;

  @ApiProperty({ enum: ['present', 'late', 'half_day', 'absent'], nullable: true, description: 'Attendance status determined from check-in' })
  status: 'present' | 'late' | 'half_day' | 'absent' | null;

  @ApiProperty({ type: () => LateDetailsDto, nullable: true, description: 'Details about lateness if applicable' })
  late_details?: LateDetailsDto | null;

  @ApiProperty({ description: 'Timestamp when the check-in record was created (ISO 8601)' })
  created_at: string;

  @ApiProperty({ description: 'Timestamp when the check-in record was last updated (ISO 8601)' })
  updated_at: string;
}