import { IsNotEmpty, IsString, IsOptional, IsEnum, IsNumber, IsDateString, IsBoolean } from 'class-validator';
import { RecurrencePattern } from '@prisma/client';

export class CreateReminderDto {
  @IsNotEmpty({ message: 'Title is required' })
  @IsString({ message: 'Title must be a string' })
  title: string;

  @IsOptional()
  @IsString({ message: 'Description must be a string' })
  description?: string;

  @IsNotEmpty({ message: 'Reminder date is required' })
  @IsDateString({}, { message: 'Reminder date must be a valid date string (YYYY-MM-DD)' })
  reminderDate: string;

  @IsNotEmpty({ message: 'Reminder time is required' })
  @IsString({ message: 'Reminder time must be a string in HH:MM format' })
  reminderTime: string;

  @IsNotEmpty({ message: 'Is recurring flag is required' })
  @IsBoolean({ message: 'Is recurring must be a boolean' })
  isRecurring: boolean;

  @IsOptional()
  @IsEnum(RecurrencePattern, { message: 'Recurrence pattern must be a valid value (Daily, Weekly, Monthly)' })
  recurrencePattern?: RecurrencePattern;
}
