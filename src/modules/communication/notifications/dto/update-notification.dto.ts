import { IsString, IsOptional, IsNumber, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { NotificationStatus, UserType } from '@prisma/client';

export class UpdateNotificationDto {
  @ApiPropertyOptional({
    description: 'Updated notification heading',
    example: 'Meeting Schedule Updated',
  })
  @IsOptional()
  @IsString()
  heading?: string;

  @ApiPropertyOptional({
    description: 'Updated notification content/message body',
    example: 'The meeting time has been rescheduled to 4:00 PM.',
  })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional({
    description: 'Recipient user ID (for targeted notifications)',
    example: 42,
  })
  @IsOptional()
  @IsNumber()
  sentTo?: number;

  @ApiPropertyOptional({
    description: 'Sender user ID who updated/sent the notification',
    example: 5,
  })
  @IsOptional()
  @IsNumber()
  sentBy?: number;

  @ApiPropertyOptional({
    description: 'User type of the recipient',
    enum: UserType,
    example: UserType.admin,
  })
  @IsOptional()
  @IsEnum(UserType)
  userType?: UserType;

  @ApiPropertyOptional({
    description: 'Current status of the notification',
    enum: NotificationStatus,
    example: NotificationStatus.read,
  })
  @IsOptional()
  @IsEnum(NotificationStatus)
  status?: NotificationStatus;
}
