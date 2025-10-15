import { ApiProperty } from '@nestjs/swagger';

export class LeaveLogResponseDto {
  @ApiProperty({ description: 'Unique identifier for the leave log entry' })
  leave_log_id: number;

  @ApiProperty({ description: 'Employee ID associated with this leave entry' })
  emp_id: number;

  @ApiProperty({ description: 'Full name of the employee who applied for leave' })
  employee_name: string;

  @ApiProperty({ type: String, nullable: true, description: 'Type of leave (e.g., annual, sick, casual)' })
  leave_type: string | null;

  @ApiProperty({ description: 'Start date of the leave (YYYY-MM-DD)' })
  start_date: string;

  @ApiProperty({ description: 'End date of the leave (YYYY-MM-DD)' })
  end_date: string;

  @ApiProperty({ type: String, nullable: true, description: 'Reason provided by the employee for the leave' })
  reason: string | null;

  @ApiProperty({ enum: ['Pending', 'Approved', 'Rejected'], nullable: true, description: 'Current status of the leave request' })
  status: 'Pending' | 'Approved' | 'Rejected' | null;

  @ApiProperty({ description: 'Date when the leave was applied (ISO 8601)' })
  applied_on: string;

  @ApiProperty({ type: Number, nullable: true, description: 'ID of the reviewer who processed the leave, if applicable' })
  reviewed_by: number | null;

  @ApiProperty({ type: String, nullable: true, description: 'Name of the reviewer who processed the leave, if applicable' })
  reviewer_name: string | null;

  @ApiProperty({ type: String, nullable: true, description: 'Date when the leave was reviewed (ISO 8601)' })
  reviewed_on: string | null;

  @ApiProperty({ type: String, nullable: true, description: 'Reason provided by the reviewer for approval or rejection' })
  confirmation_reason: string | null;

  @ApiProperty({ description: 'Timestamp when the leave record was created (ISO 8601)' })
  created_at: string;

  @ApiProperty({ description: 'Timestamp when the leave record was last updated (ISO 8601)' })
  updated_at: string;
}