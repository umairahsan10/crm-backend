import { ApiProperty } from '@nestjs/swagger';

export class HalfDayLogResponseDto {
  @ApiProperty({ description: 'Unique identifier for the half-day log entry' })
  half_day_log_id: number;

  @ApiProperty({ description: 'Employee ID associated with this half-day log' })
  emp_id: number;

  @ApiProperty({ description: 'Date of the half-day log (YYYY-MM-DD)' })
  date: string;

  @ApiProperty({ description: 'Scheduled time the employee was expected to check in (HH:mm:ss)' })
  scheduled_time_in: string;

  @ApiProperty({ description: 'Actual time the employee checked in (HH:mm:ss)' })
  actual_time_in: string;

  @ApiProperty({ description: 'Number of minutes the employee was late' })
  minutes_late: number;

  @ApiProperty({ description: 'Reason provided for being late' })
  reason: string;

  @ApiProperty({ type: Boolean, nullable: true, description: 'Indicates whether the lateness has been justified by the reviewer' })
  justified: boolean | null;

  @ApiProperty({ enum: ['paid', 'unpaid'], nullable: true, description: 'Type of half day applied to the employee' })
  half_day_type: 'paid' | 'unpaid' | null;

  @ApiProperty({ enum: ['Created', 'Pending', 'Completed'], description: 'Current status of the half-day log process' })
  action_taken: 'Created' | 'Pending' | 'Completed';

  @ApiProperty({ type: Number, nullable: true, description: 'Reviewer ID who reviewed the log, if applicable' })
  reviewed_by: number | null;

  @ApiProperty({ description: 'Timestamp when the log was created (ISO 8601)' })
  created_at: string;

  @ApiProperty({ description: 'Timestamp when the log was last updated (ISO 8601)' })
  updated_at: string;
  // Attendance table updates (only included when action is 'Completed')

  @ApiProperty({
    type: () => Object,
    description: 'Attendance table updates (included only when action_taken is "Completed")',
    example: { half_days: 3, monthly_half_days: 1 },
    additionalProperties: false,
  })
  attendance_updates?: {
    half_days: number;
    monthly_half_days: number;
  };
}