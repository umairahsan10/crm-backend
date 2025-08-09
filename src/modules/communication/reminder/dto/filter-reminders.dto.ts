import { IsOptional, IsEnum, IsDateString, IsBoolean } from 'class-validator';
import { RecurrencePattern, ReminderStatus } from '@prisma/client';

export class FilterRemindersDto {
  @IsOptional()
  @IsEnum(ReminderStatus, { message: 'Status must be a valid value (Pending, Completed, Overdue)' })
  status?: ReminderStatus;

  @IsOptional()
  @IsBoolean({ message: 'Is recurring must be a boolean' })
  isRecurring?: boolean;

  @IsOptional()
  @IsEnum(RecurrencePattern, { message: 'Recurrence pattern must be a valid value (Daily, Weekly, Monthly)' })
  recurrencePattern?: RecurrencePattern;

  @IsOptional()
  @IsDateString({}, { message: 'Date from must be a valid date string (YYYY-MM-DD)' })
  dateFrom?: string;

  @IsOptional()
  @IsDateString({}, { message: 'Date to must be a valid date string (YYYY-MM-DD)' })
  dateTo?: string;
}
