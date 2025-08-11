import { IsString, IsOptional, IsNumber, IsEnum } from 'class-validator';
import { NotificationStatus, UserType } from '@prisma/client';

export class CreateNotificationDto {
  @IsString()
  heading: string;

  @IsString()
  content: string;

  @IsNumber()
  sentTo: number; 

  @IsOptional()
  @IsNumber()
  sentBy?: number; 

  @IsEnum(UserType)
  userType: UserType;

  @IsOptional()
  @IsEnum(NotificationStatus)
  status?: NotificationStatus;
}
