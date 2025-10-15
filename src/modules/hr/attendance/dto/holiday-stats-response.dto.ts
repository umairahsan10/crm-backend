import { ApiProperty } from '@nestjs/swagger';

export class HolidayMonthCountDto {
  @ApiProperty({ description: 'Month name', example: 'January' })
  month: string;

  @ApiProperty({ description: 'Number of holidays in the month', example: 2 })
  count: number;
}

export class HolidayStatsResponseDto {
  @ApiProperty({ description: 'Total number of holidays in the system', example: 25 })
  totalHolidays: number;

  @ApiProperty({ description: 'Number of holidays in the current year', example: 10 })
  holidaysThisYear: number;

  @ApiProperty({ description: 'Number of upcoming holidays', example: 3 })
  upcomingHolidays: number;

  @ApiProperty({ type: [HolidayMonthCountDto], description: 'List of holidays by month' })
  holidaysByMonth: HolidayMonthCountDto[];
}
