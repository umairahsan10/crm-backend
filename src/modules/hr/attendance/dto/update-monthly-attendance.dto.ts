import {
  IsNumber,
  IsOptional,
  IsInt,
  Min,
  IsString,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateMonthlyAttendanceDto {
  @ApiProperty({
    description:
      'ID of the employee whose monthly attendance record is being updated',
    example: 101,
  })
  @IsNumber()
  @Type(() => Number)
  employee_id: number;

  @ApiProperty({
    description: 'Month for which attendance is updated (format: YYYY-MM)',
    example: '2025-01',
  })
  @IsString()
  @Matches(/^\d{4}-\d{2}$/, {
    message: 'Month must be in YYYY-MM format (e.g., 2025-01)',
  })
  month: string;

  @ApiPropertyOptional({
    description: 'Total number of present days in the month',
    example: 20,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  total_present?: number;

  @ApiPropertyOptional({
    description: 'Total number of absent days in the month',
    example: 2,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  total_absent?: number;

  @ApiPropertyOptional({
    description: 'Total number of leave days taken in the month',
    example: 3,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  total_leave_days?: number;

  @ApiPropertyOptional({
    description: 'Total number of late days in the month',
    example: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  total_late_days?: number;

  @ApiPropertyOptional({
    description: 'Total number of half days in the month',
    example: 2,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  total_half_days?: number;

  @ApiPropertyOptional({
    description: 'Total number of remote work days in the month',
    example: 4,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  total_remote_days?: number;
}
