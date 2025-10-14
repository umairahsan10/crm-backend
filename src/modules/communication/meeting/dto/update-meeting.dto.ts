import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsDateString, IsBoolean, IsEnum } from 'class-validator';
import { MeetingStatus } from '@prisma/client';

export class UpdateMeetingDto {
  @ApiPropertyOptional({
    description: 'Client ID associated with the meeting',
    example: 42,
  })
  @IsOptional()
  @IsNumber()
  clientId?: number;

  @ApiPropertyOptional({
    description: 'Project ID associated with the meeting',
    example: 7,
  })
  @IsOptional()
  @IsNumber()
  projectId?: number;

  @ApiPropertyOptional({
    description: 'Updated topic or title for the meeting',
    example: 'Revised Project Timeline Discussion',
  })
  @IsOptional()
  @IsString()
  topic?: string;

  @ApiPropertyOptional({
    description: 'Updated scheduled date and time for the meeting (ISO 8601 format)',
    example: '2025-10-22T14:30:00Z',
  })
  @IsOptional()
  @IsDateString()
  dateTime?: string;

  @ApiPropertyOptional({
    description: 'Updated meeting status',
    enum: MeetingStatus,
    example: MeetingStatus.completed,
  })
  @IsOptional()
  @IsEnum(MeetingStatus)
  status?: MeetingStatus;

  @ApiPropertyOptional({
    description: 'Indicates whether automatic reminders should be enabled or disabled',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  autoReminder?: boolean;

  @ApiPropertyOptional({
    description: 'Updated meeting link (Zoom, Google Meet, etc.)',
    example: 'https://meet.google.com/xyz-abcd-123',
  })
  @IsOptional()
  @IsString()
  meetingLink?: string;
}
