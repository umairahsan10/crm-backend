import { ApiProperty } from '@nestjs/swagger';

export class MonthlyAttendanceResponseDto {
  @ApiProperty({ description: 'Unique identifier for the monthly attendance record' })
  id: number;

  @ApiProperty({ description: 'Employee ID associated with this attendance summary' })
  employee_id: number;

  @ApiProperty({ description: 'First name of the employee' })
  employee_first_name: string;

  @ApiProperty({ description: 'Last name of the employee' })
  employee_last_name: string;

  @ApiProperty({ description: 'Month of the attendance record in YYYY-MM format' })
  month: string;

  @ApiProperty({ description: 'Total number of days the employee was present in the month' })
  total_present: number;

  @ApiProperty({ description: 'Total number of days the employee was absent in the month' })
  total_absent: number;

  @ApiProperty({ description: 'Total number of leave days taken by the employee in the month' })
  total_leave_days: number;

  @ApiProperty({ description: 'Total number of late days recorded in the month' })
  total_late_days: number;

  @ApiProperty({ description: 'Total number of half days recorded in the month' })
  total_half_days: number;

  @ApiProperty({ description: 'Total number of remote work days recorded in the month' })
  total_remote_days: number;

  @ApiProperty({ description: 'Date when the monthly attendance summary was generated (ISO 8601)' })
  generated_on: string;

  @ApiProperty({ description: 'Timestamp when the record was created (ISO 8601)' })
  created_at: string;

  @ApiProperty({ description: 'Timestamp when the record was last updated (ISO 8601)' })
  updated_at: string;
} 