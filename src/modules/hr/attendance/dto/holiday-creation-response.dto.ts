import { ApiPropertyOptional } from '@nestjs/swagger';
import { HolidayResponseDto } from './holiday-response.dto';

export class HolidayCreationResponseDto extends HolidayResponseDto {
  @ApiPropertyOptional({
    description: 'Indicates whether attendance records were automatically adjusted for the holiday',
    example: true,
  })
  attendanceAdjusted?: boolean;

  @ApiPropertyOptional({
    description: 'Number of employees whose attendance or schedules were affected by this holiday',
    example: 145,
  })
  employeesAffected?: number;

  @ApiPropertyOptional({
    description: 'System or informational message returned after holiday creation',
    example: 'Holiday created successfully and attendance adjusted for all employees.',
  })
  message?: string;
}
