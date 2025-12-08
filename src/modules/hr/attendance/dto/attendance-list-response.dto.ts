import { ApiProperty } from '@nestjs/swagger';

export class AttendanceListResponseDto {
  @ApiProperty({
    description: 'Unique identifier of the attendance summary record',
  })
  id: number;

  @ApiProperty({
    description: 'Employee ID associated with this attendance record',
  })
  employee_id: number;

  @ApiProperty({
    type: Number,
    nullable: true,
    description: 'Total number of present days in the period',
  })
  present_days: number | null;

  @ApiProperty({
    type: Number,
    nullable: true,
    description: 'Total number of absent days in the period',
  })
  absent_days: number | null;

  @ApiProperty({
    type: Number,
    nullable: true,
    description: 'Total number of late arrivals in the period',
  })
  late_days: number | null;

  @ApiProperty({
    type: Number,
    nullable: true,
    description: 'Total number of approved leave days in the period',
  })
  leave_days: number | null;

  @ApiProperty({
    type: Number,
    nullable: true,
    description: 'Total number of remote working days in the period',
  })
  remote_days: number | null;

  @ApiProperty({
    type: Number,
    nullable: true,
    description: 'Total number of available leave days',
  })
  available_leaves: number | null;

  @ApiProperty({
    type: Number,
    nullable: true,
    description: 'Total number of monthly late marks recorded',
  })
  monthly_lates: number | null;

  @ApiProperty({
    type: Number,
    nullable: true,
    description: 'Total number of half-day instances recorded',
  })
  half_days: number | null;

  @ApiProperty({
    description: 'Timestamp when this record was created (ISO 8601)',
  })
  created_at: string;

  @ApiProperty({
    description: 'Timestamp when this record was last updated (ISO 8601)',
  })
  updated_at: string;
}
