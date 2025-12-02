import { ApiProperty } from '@nestjs/swagger';

export class HalfDayLogsListResponseDto {
  @ApiProperty({ description: 'Unique identifier for the half-day log entry' })
  half_day_log_id: number;

  @ApiProperty({ description: 'Employee ID associated with this half-day log' })
  emp_id: number;

  @ApiProperty({ description: 'Full name of the employee' })
  employee_name: string;

  @ApiProperty({ description: 'Date of the half-day log (YYYY-MM-DD)' })
  date: string;

  @ApiProperty({ description: 'Scheduled check-in time (HH:mm:ss)' })
  scheduled_time_in: string;

  @ApiProperty({ description: 'Actual check-in time (HH:mm:ss)' })
  actual_time_in: string;

  @ApiProperty({ description: 'Number of minutes the employee was late' })
  minutes_late: number;

  @ApiProperty({
    type: String,
    nullable: true,
    description: 'Reason provided for being late, if any',
  })
  reason: string | null;

  @ApiProperty({
    type: Boolean,
    nullable: true,
    description:
      'Indicates whether the lateness has been justified by the reviewer',
  })
  justified: boolean | null;

  @ApiProperty({
    enum: ['paid', 'unpaid'],
    nullable: true,
    description: 'Type of half-day applied to the employee',
  })
  half_day_type: 'paid' | 'unpaid' | null;

  @ApiProperty({
    enum: ['Created', 'Pending', 'Completed'],
    description: 'Current status of the half-day log process',
  })
  action_taken: 'Created' | 'Pending' | 'Completed';

  @ApiProperty({
    type: Number,
    nullable: true,
    description: 'Reviewer ID who reviewed the log, if applicable',
  })
  reviewed_by: number | null;

  @ApiProperty({
    type: String,
    nullable: true,
    description: 'Name of the reviewer, if available',
  })
  reviewer_name: string | null;

  @ApiProperty({ description: 'Timestamp when the log was created (ISO 8601)' })
  created_at: string;

  @ApiProperty({
    description: 'Timestamp when the log was last updated (ISO 8601)',
  })
  updated_at: string;
}
