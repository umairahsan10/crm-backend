import { ApiProperty } from '@nestjs/swagger';

export class LateLogsListResponseDto {
  @ApiProperty({ description: 'Unique identifier for the late log entry' })
  late_log_id: number;

  @ApiProperty({ description: 'Employee ID associated with this late entry' })
  emp_id: number;

  @ApiProperty({ description: 'Full name of the employee related to the late log' })
  employee_name: string;

  @ApiProperty({ description: 'Date of the late entry (YYYY-MM-DD)' })
  date: string;

  @ApiProperty({ description: 'Scheduled check-in time (HH:mm:ss)' })
  scheduled_time_in: string;

  @ApiProperty({ description: 'Actual check-in time (HH:mm:ss)' })
  actual_time_in: string;

  @ApiProperty({ description: 'Number of minutes the employee was late' })
  minutes_late: number;

  @ApiProperty({ type: String, nullable: true, description: 'Reason provided for being late, if any' })
  reason: string | null;

  @ApiProperty({ type: Boolean, nullable: true, description: 'Indicates if the lateness was justified' })
  justified: boolean | null;

  @ApiProperty({ enum: ['paid', 'unpaid'], nullable: true, description: 'Specifies whether the late entry is paid or unpaid' })
  late_type: 'paid' | 'unpaid' | null;

  @ApiProperty({ enum: ['Created', 'Pending', 'Completed'], description: 'Current processing status of the late log' })
  action_taken: 'Created' | 'Pending' | 'Completed';

  @ApiProperty({ type: Number, nullable: true, description: 'Reviewer ID who reviewed the late entry, if applicable' })
  reviewed_by: number | null;

  @ApiProperty({ type: String, nullable: true, description: 'Name of the reviewer who reviewed the late entry, if applicable' })
  reviewer_name: string | null;

  @ApiProperty({ description: 'Timestamp when the late log was created (ISO 8601)' })
  created_at: string;

  @ApiProperty({ description: 'Timestamp when the late log was last updated (ISO 8601)' })
  updated_at: string;
}