import {
  IsOptional,
  IsString,
  IsEnum,
  IsDateString,
  IsBoolean,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { RecurrencePattern, ReminderStatus } from '@prisma/client';

export class UpdateReminderDto {
  @ApiPropertyOptional({
    description: 'Title of the reminder',
    example: 'Team Meeting',
  })
  @IsOptional()
  @IsString({ message: 'Title must be a string' })
  title?: string;

  @ApiPropertyOptional({
    description: 'Description of the reminder',
    example: 'Discuss project milestones',
  })
  @IsOptional()
  @IsString({ message: 'Description must be a string' })
  description?: string;

  @ApiPropertyOptional({
    description: 'Date of the reminder (YYYY-MM-DD)',
    example: '2025-10-15',
  })
  @IsOptional()
  @IsDateString(
    {},
    { message: 'Reminder date must be a valid date string (YYYY-MM-DD)' },
  )
  reminderDate?: string;

  @ApiPropertyOptional({
    description: 'Time of the reminder (HH:MM)',
    example: '14:30',
  })
  @IsOptional()
  @IsString({ message: 'Reminder time must be a string in HH:MM format' })
  reminderTime?: string;

  @ApiPropertyOptional({
    description: 'Whether the reminder is recurring',
    example: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'Is recurring must be a boolean' })
  isRecurring?: boolean;

  @ApiPropertyOptional({
    enum: RecurrencePattern,
    description: 'Recurrence pattern if the reminder is recurring',
    example: RecurrencePattern.Daily,
  })
  @IsOptional()
  @IsEnum(RecurrencePattern, {
    message:
      'Recurrence pattern must be a valid value (Daily, Weekly, Monthly)',
  })
  recurrencePattern?: RecurrencePattern;

  @ApiPropertyOptional({
    enum: ReminderStatus,
    description: 'Status of the reminder',
    example: ReminderStatus.Pending,
  })
  @IsOptional()
  @IsEnum(ReminderStatus, {
    message: 'Status must be a valid value (Pending, Completed, Overdue)',
  })
  status?: ReminderStatus;
}
