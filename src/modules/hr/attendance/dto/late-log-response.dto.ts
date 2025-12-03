import { ApiProperty } from '@nestjs/swagger';

export class LateLogResponseDto {
  @ApiProperty({ description: 'Unique identifier for the late log entry' })
  late_log_id: number;

  @ApiProperty({ description: 'Employee ID associated with this late log' })
  emp_id: number;

  @ApiProperty({ description: 'Date of the late entry (YYYY-MM-DD)' })
  date: string;

  @ApiProperty({ description: 'Scheduled check-in time (HH:mm:ss)' })
  scheduled_time_in: string;

  @ApiProperty({ description: 'Actual check-in time (HH:mm:ss)' })
  actual_time_in: string;

  @ApiProperty({ description: 'Number of minutes the employee was late' })
  minutes_late: number;

  @ApiProperty({
    description: 'Reason provided by the employee for being late',
  })
  reason: string;

  @ApiProperty({
    type: Boolean,
    nullable: true,
    description: 'Indicates whether the late entry was justified',
  })
  justified: boolean | null;

  @ApiProperty({
    enum: ['paid', 'unpaid'],
    nullable: true,
    description: 'Type of late entry (paid or unpaid)',
  })
  late_type: 'paid' | 'unpaid' | null;

  @ApiProperty({
    enum: ['Created', 'Pending', 'Completed'],
    description: 'Current status of the late log process',
  })
  action_taken: 'Created' | 'Pending' | 'Completed';

  @ApiProperty({
    type: Number,
    nullable: true,
    description: 'Reviewer ID who reviewed this late entry, if applicable',
  })
  reviewed_by: number | null;

  @ApiProperty({
    description: 'Timestamp when the record was created (ISO 8601)',
  })
  created_at: string;

  @ApiProperty({
    description: 'Timestamp when the record was last updated (ISO 8601)',
  })
  updated_at: string;

  @ApiProperty({
    type: () => Object,
    required: false,
    description:
      'Attendance table updates applied when the action is marked as Completed',
    example: { late_days: 5, monthly_lates: 2 },
  })
  attendance_updates?: {
    late_days: number;
    monthly_lates: number;
  };
}
