import { ApiProperty } from '@nestjs/swagger';

export class HrLogsStatsResponseDto {
  @ApiProperty({ description: 'Total number of HR logs' })
  totalLogs: number;

  @ApiProperty({ description: 'Number of HR logs created today' })
  todayLogs: number;

  @ApiProperty({ description: 'Number of HR logs created this week' })
  thisWeekLogs: number;

  @ApiProperty({ description: 'Number of HR logs created this month' })
  thisMonthLogs: number;
}