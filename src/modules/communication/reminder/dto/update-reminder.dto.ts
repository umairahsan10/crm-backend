import { IsOptional, IsString, IsEnum, IsDateString, IsBoolean } from 'class-validator';
import { RecurrencePattern, ReminderStatus } from '@prisma/client';

export class UpdateReminderDto {
  @IsOptional()
  @IsString({ message: 'Title must be a string' })
  title?: string;

  @IsOptional()
  @IsString({ message: 'Description must be a string' })
  description?: string;

  @IsOptional()
  @IsDateString({}, { message: 'Reminder date must be a valid date string (YYYY-MM-DD)' })
  reminderDate?: string;

  @IsOptional()
  @IsString({ message: 'Reminder time must be a string in HH:MM format' })
  reminderTime?: string;

  @IsOptional()
  @IsBoolean({ message: 'Is recurring must be a boolean' })
  isRecurring?: boolean;

  @IsOptional()
  @IsEnum(RecurrencePattern, { message: 'Recurrence pattern must be a valid value (Daily, Weekly, Monthly)' })
  recurrencePattern?: RecurrencePattern;

  @IsOptional()
  @IsEnum(ReminderStatus, { message: 'Status must be a valid value (Pending, Completed, Overdue)' })
  status?: ReminderStatus;
}
