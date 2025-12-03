import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsDateString,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RecurrencePattern } from '@prisma/client';

export class CreateReminderDto {
  @ApiProperty({ description: 'Title of the reminder' })
  @IsNotEmpty({ message: 'Title is required' })
  @IsString({ message: 'Title must be a string' })
  title: string;

  @ApiPropertyOptional({ description: 'Description of the reminder' })
  @IsOptional()
  @IsString({ message: 'Description must be a string' })
  description?: string;

  @ApiProperty({
    description: 'Date of the reminder in YYYY-MM-DD format',
    example: '2025-10-14',
  })
  @IsNotEmpty({ message: 'Reminder date is required' })
  @IsDateString(
    {},
    { message: 'Reminder date must be a valid date string (YYYY-MM-DD)' },
  )
  reminderDate: string;

  @ApiProperty({
    description: 'Time of the reminder in HH:MM format',
    example: '14:30',
  })
  @IsNotEmpty({ message: 'Reminder time is required' })
  @IsString({ message: 'Reminder time must be a string in HH:MM format' })
  reminderTime: string;

  @ApiProperty({
    description: 'Flag indicating whether the reminder is recurring',
    example: false,
  })
  @IsNotEmpty({ message: 'Is recurring flag is required' })
  @IsBoolean({ message: 'Is recurring must be a boolean' })
  isRecurring: boolean;

  @ApiPropertyOptional({
    enum: RecurrencePattern,
    description: 'Recurrence pattern if reminder is recurring',
    example: RecurrencePattern.Weekly,
  })
  @IsOptional()
  @IsEnum(RecurrencePattern, {
    message:
      'Recurrence pattern must be a valid value (Daily, Weekly, Monthly)',
  })
  recurrencePattern?: RecurrencePattern;
}
