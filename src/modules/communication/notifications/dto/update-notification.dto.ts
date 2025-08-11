import { IsString, IsOptional, IsNumber, IsEnum } from 'class-validator';
import { NotificationStatus, UserType } from '@prisma/client';

export class UpdateNotificationDto {
  @IsOptional()
  @IsString()
  heading?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsNumber()
  sentTo?: number;

  @IsOptional()
  @IsNumber()
  sentBy?: number;

  @IsOptional()
  @IsEnum(UserType)
  userType?: UserType;

  @IsOptional()
  @IsEnum(NotificationStatus)
  status?: NotificationStatus;
}
