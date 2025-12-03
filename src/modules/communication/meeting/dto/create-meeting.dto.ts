import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsDateString,
  IsBoolean,
  IsEnum,
} from 'class-validator';
import { MeetingStatus } from '@prisma/client';

export class CreateMeetingDto {
  @ApiPropertyOptional({
    description: 'ID of the client associated with the meeting',
    example: 42,
  })
  @IsOptional()
  @IsNumber()
  clientId?: number;

  @ApiPropertyOptional({
    description: 'ID of the project associated with the meeting',
    example: 101,
  })
  @IsOptional()
  @IsNumber()
  projectId?: number;

  @ApiProperty({
    description: 'Topic or agenda of the meeting',
    example: 'Project kickoff meeting',
  })
  @IsString()
  topic: string;

  @ApiProperty({
    description: 'Scheduled date and time for the meeting (ISO format)',
    example: '2025-11-12T14:00:00Z',
  })
  @IsDateString()
  dateTime: string;

  @ApiPropertyOptional({
    description: 'Current status of the meeting',
    enum: MeetingStatus,
    example: MeetingStatus.scheduled,
  })
  @IsOptional()
  @IsEnum(MeetingStatus)
  status?: MeetingStatus;

  @ApiPropertyOptional({
    description:
      'Whether an automatic reminder should be sent before the meeting',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  autoReminder?: boolean;

  @ApiProperty({
    description: 'Meeting link or virtual conference URL',
    example: 'https://meet.google.com/abc-defg-hij',
  })
  @IsString()
  meetingLink: string;
}
