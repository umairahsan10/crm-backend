import { ApiProperty } from '@nestjs/swagger';

export class CheckoutResponseDto {
  @ApiProperty({ description: 'Unique identifier for the attendance record' })
  id: number;

  @ApiProperty({ description: 'Employee ID associated with this checkout' })
  employee_id: number;

  @ApiProperty({ type: String, nullable: true, description: 'Date of the attendance record (YYYY-MM-DD)' })
  date: string | null;

  @ApiProperty({ type: String, nullable: true, description: 'Timestamp of employee check-in (ISO 8601)' })
  checkin: string | null;

  @ApiProperty({ type: String, nullable: true, description: 'Timestamp of employee check-out (ISO 8601)' })
  checkout: string | null;

  @ApiProperty({ type: String, nullable: true, description: 'Local timestamp of employee check-out after timezone conversion (ISO 8601)' })
  checkout_local?: string | null;

  @ApiProperty({ enum: ['onsite', 'remote'], nullable: true, description: 'Mode of work for the day' })
  mode: 'onsite' | 'remote' | null;

  @ApiProperty({ enum: ['present', 'late', 'half_day', 'absent'], nullable: true, description: 'Final attendance status after checkout' })
  status: 'present' | 'late' | 'half_day' | 'absent' | null;

  @ApiProperty({ description: 'Total number of hours worked, calculated from check-in and check-out times' })
  total_hours_worked: number;

  @ApiProperty({ type: String, required: false, description: 'Timezone used for conversion (IANA)', example: 'Asia/Karachi' })
  timezone?: string;

  @ApiProperty({ type: Number, required: false, description: 'UTC offset in minutes used for conversion', example: 300 })
  offset_minutes?: number;

  @ApiProperty({ type: String, required: false, description: 'Local business date used for attendance (YYYY-MM-DD)' })
  local_date?: string;

  @ApiProperty({ description: 'Timestamp when the record was created (ISO 8601)' })
  created_at: string;

  @ApiProperty({ description: 'Timestamp when the record was last updated (ISO 8601)' })
  updated_at: string;
}