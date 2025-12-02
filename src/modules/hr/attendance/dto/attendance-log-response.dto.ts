import { ApiProperty } from '@nestjs/swagger';

export class AttendanceLogResponseDto {
  @ApiProperty({ description: 'Unique identifier of the attendance record' })
  id: number;

  @ApiProperty({ description: 'Unique ID of the employee' })
  employee_id: number;

  @ApiProperty({ description: 'First name of the employee' })
  employee_first_name: string;

  @ApiProperty({ description: 'Last name of the employee' })
  employee_last_name: string;

  @ApiProperty({
    type: String,
    nullable: true,
    description: 'Date of attendance (YYYY-MM-DD)',
  })
  date: string | null;

  @ApiProperty({
    type: String,
    nullable: true,
    description: 'Recorded check-in time (HH:mm:ss)',
  })
  checkin: string | null;

  @ApiProperty({
    type: String,
    nullable: true,
    description: 'Recorded check-out time (HH:mm:ss)',
  })
  checkout: string | null;

  @ApiProperty({
    enum: ['onsite', 'remote'],
    nullable: true,
    description: 'Work mode for the day (onsite or remote)',
  })
  mode: 'onsite' | 'remote' | null;

  @ApiProperty({
    enum: ['present', 'absent', 'late', 'half_day', 'leave'],
    nullable: true,
    description: 'Attendance status for the day',
  })
  status: 'present' | 'absent' | 'late' | 'half_day' | 'leave' | null;

  @ApiProperty({
    description: 'Timestamp when this record was created (ISO 8601)',
  })
  created_at: string;

  @ApiProperty({
    description: 'Timestamp when this record was last updated (ISO 8601)',
  })
  updated_at: string;
}
