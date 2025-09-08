import { IsString, IsOptional, IsNumber, IsEnum } from 'class-validator';
import { NotificationStatus, UserType, NotificationType } from '@prisma/client';

export class CreateNotificationDto {
  @IsString()
  heading: string;

  @IsString()
  content: string;

  @IsOptional()
  @IsNumber()
  sentTo?: number; // Optional for bulk notifications

  @IsOptional()
  @IsNumber()
  sentBy?: number; 

  @IsEnum(UserType)
  userType: UserType;

  @IsEnum(NotificationType)
  notificationType: NotificationType;

  @IsOptional()
  @IsNumber()
  targetDepartmentId?: number; // For department-specific bulk notifications

  @IsOptional()
  @IsEnum(NotificationStatus)
  status?: NotificationStatus;
}
