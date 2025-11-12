import { ApiProperty } from '@nestjs/swagger';

export class PeriodSummaryDto {
  @ApiProperty({ description: 'Average attendance rate', example: 92.5 })
  averageAttendanceRate: number;

  @ApiProperty({ description: 'Total number of employees', example: 120 })
  totalEmployees: number;

  @ApiProperty({ description: 'Average present count', example: 111 })
  averagePresent: number;

  @ApiProperty({ description: 'Average absent count', example: 9 })
  averageAbsent: number;

  @ApiProperty({ description: 'Best day/month details', required: false })
  bestDay?: {
    date: string;
    rate: number;
  };

  @ApiProperty({ description: 'Worst day/month details', required: false })
  worstDay?: {
    date: string;
    rate: number;
  };
}

export class ChangeDto {
  @ApiProperty({ description: 'Rate change', example: 2.3 })
  rate: number;

  @ApiProperty({ description: 'Trend direction', example: 'up', enum: ['up', 'down', 'neutral'] })
  trend: 'up' | 'down' | 'neutral';

  @ApiProperty({ description: 'Percentage change', example: 2.55 })
  percentage: number;
}

export class AttendanceSummaryDto {
  @ApiProperty({ description: 'Current period summary', type: PeriodSummaryDto })
  currentPeriod: PeriodSummaryDto;

  @ApiProperty({ description: 'Previous period summary', type: PeriodSummaryDto })
  previousPeriod: PeriodSummaryDto;

  @ApiProperty({ description: 'Change comparison', type: ChangeDto })
  change: ChangeDto;
}

export class DepartmentAttendanceDto {
  @ApiProperty({ description: 'Attendance rate for department', example: 95 })
  rate: number;

  @ApiProperty({ description: 'Present count', example: 48 })
  present: number;

  @ApiProperty({ description: 'Absent count', example: 2 })
  absent: number;

  @ApiProperty({ description: 'Total employees in department', example: 50 })
  employees?: number;
}

export class AttendanceDataPointDto {
  @ApiProperty({ description: 'Date in ISO format (YYYY-MM-DD for daily, YYYY-MM for monthly)', example: '2025-01-15' })
  date: string;

  @ApiProperty({ description: 'Short label for chart', example: 'Mon' })
  label: string;

  @ApiProperty({ description: 'Full label for display', example: 'Mon, Jan 15' })
  fullLabel: string;

  @ApiProperty({ description: 'Attendance rate percentage', example: 95 })
  attendanceRate: number;

  @ApiProperty({ description: 'Total employees', example: 120 })
  totalEmployees: number;

  @ApiProperty({ description: 'Present count', example: 114 })
  present: number;

  @ApiProperty({ description: 'Absent count', example: 6 })
  absent: number;

  @ApiProperty({ description: 'On leave count', required: false, example: 3 })
  onLeave?: number;

  @ApiProperty({ description: 'Remote work count', required: false, example: 8 })
  remote?: number;

  @ApiProperty({ description: 'Late count', required: false, example: 2 })
  late?: number;

  @ApiProperty({ description: 'Value for chart mapping', example: 95 })
  chartValue: number;

  @ApiProperty({ description: 'Is weekend', required: false, example: false })
  isWeekend?: boolean;

  @ApiProperty({ description: 'Is holiday', required: false, example: false })
  isHoliday?: boolean;

  @ApiProperty({ description: 'Month number (for monthly view)', required: false, example: 1 })
  monthNumber?: number;

  @ApiProperty({ description: 'Year (for monthly view)', required: false, example: 2025 })
  year?: number;

  @ApiProperty({ description: 'Working days in month (for monthly view)', required: false, example: 22 })
  workingDays?: number;

  @ApiProperty({ description: 'Department breakdown (Admin only)', required: false, type: Object })
  byDepartment?: Record<string, DepartmentAttendanceDto>;
}

export class DateRangeDto {
  @ApiProperty({ description: 'Start date', example: '2025-01-15' })
  start: string;

  @ApiProperty({ description: 'End date', example: '2025-01-21' })
  end: string;
}

export class AttendanceMetadataDto {
  @ApiProperty({ description: 'Date range', type: DateRangeDto })
  dateRange: DateRangeDto;

  @ApiProperty({ description: 'Total days/months', example: 7 })
  totalDays?: number;

  @ApiProperty({ description: 'Total months', example: 12 })
  totalMonths?: number;

  @ApiProperty({ description: 'Working days count', required: false, example: 5 })
  workingDays?: number;

  @ApiProperty({ description: 'Weekend days count', required: false, example: 2 })
  weekendDays?: number;

  @ApiProperty({ description: 'Generation timestamp', example: '2025-01-21T10:30:00Z' })
  generatedAt: string;
}

export class AdminDepartmentSummaryDto {
  @ApiProperty({ description: 'Overall summary', type: PeriodSummaryDto })
  overall: PeriodSummaryDto;

  @ApiProperty({ description: 'Summary by department', type: Object })
  byDepartment: Record<string, { rate: number; employees: number }>;
}

export class AttendanceTrendsResponseDto {
  @ApiProperty({ description: 'User department', example: 'HR' })
  department: string;

  @ApiProperty({ description: 'User role', example: 'dep_manager' })
  role: string;

  @ApiProperty({ description: 'Period type', example: 'daily', enum: ['daily', 'monthly'] })
  period: 'daily' | 'monthly';

  @ApiProperty({ description: 'Summary statistics', type: AttendanceSummaryDto })
  summary: AttendanceSummaryDto | AdminDepartmentSummaryDto;

  @ApiProperty({ description: 'Trend data points', type: [AttendanceDataPointDto] })
  data: AttendanceDataPointDto[];

  @ApiProperty({ description: 'Response metadata', type: AttendanceMetadataDto })
  metadata: AttendanceMetadataDto;
}

