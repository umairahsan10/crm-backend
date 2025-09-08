import { IsString, IsOptional, IsNumber, IsDateString, IsBoolean, IsEnum } from 'class-validator';
import { MeetingStatus } from '@prisma/client';

export class CreateMeetingDto {
  @IsOptional()
  @IsNumber()
  clientId?: number;

  @IsOptional()
  @IsNumber()
  projectId?: number;

  @IsString()
  topic: string;

  @IsDateString()
  dateTime: string;

  @IsOptional()
  @IsEnum(MeetingStatus)
  status?: MeetingStatus;

  @IsOptional()
  @IsBoolean()
  autoReminder?: boolean;

  @IsString()
  meetingLink: string;
}
