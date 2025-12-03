import { IsOptional, IsEnum, IsDateString, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { RecurrencePattern, ReminderStatus } from '@prisma/client';

export class FilterRemindersDto {
  @ApiPropertyOptional({
    enum: ReminderStatus,
    description: 'Filter reminders by status (Pending, Completed, Overdue)',
    example: ReminderStatus.Pending,
  })
  @IsOptional()
  @IsEnum(ReminderStatus, {
    message: 'Status must be a valid value (Pending, Completed, Overdue)',
  })
  status?: ReminderStatus;

  @ApiPropertyOptional({
    description: 'Filter by whether the reminder is recurring',
    example: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'Is recurring must be a boolean' })
  isRecurring?: boolean;

  @ApiPropertyOptional({
    enum: RecurrencePattern,
    description: 'Filter by recurrence pattern (Daily, Weekly, Monthly)',
    example: RecurrencePattern.Monthly,
  })
  @IsOptional()
  @IsEnum(RecurrencePattern, {
    message:
      'Recurrence pattern must be a valid value (Daily, Weekly, Monthly)',
  })
  recurrencePattern?: RecurrencePattern;

  @ApiPropertyOptional({
    description: 'Filter reminders from this date (YYYY-MM-DD)',
    example: '2025-10-14',
  })
  @IsOptional()
  @IsDateString(
    {},
    { message: 'Date from must be a valid date string (YYYY-MM-DD)' },
  )
  dateFrom?: string;

  @ApiPropertyOptional({
    description: 'Filter reminders up to this date (YYYY-MM-DD)',
    example: '2025-10-20',
  })
  @IsOptional()
  @IsDateString(
    {},
    { message: 'Date to must be a valid date string (YYYY-MM-DD)' },
  )
  dateTo?: string;
}
