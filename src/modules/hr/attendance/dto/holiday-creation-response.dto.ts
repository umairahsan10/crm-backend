import { HolidayResponseDto } from './holiday-response.dto';

export class HolidayCreationResponseDto extends HolidayResponseDto {
  attendanceAdjusted?: boolean;
  employeesAffected?: number;
  message?: string;
}
