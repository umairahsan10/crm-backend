import { IsString, IsOptional, IsNumber, IsEnum } from 'class-validator';
import { NotificationStatus, UserType, NotificationType } from '@prisma/client';

export class CreateBulkNotificationDto {
  @IsString()
  heading: string;

  @IsString()
  content: string;

  @IsOptional()
  @IsNumber()
  sentBy?: number;

  @IsEnum(UserType)
  userType: UserType;

  @IsEnum(NotificationType)
  notificationType: NotificationType;

  @IsOptional()
  @IsNumber()
  targetDepartmentId?: number; // Required for 'bulk_department', null for 'bulk_all'

  @IsOptional()
  @IsEnum(NotificationStatus)
  status?: NotificationStatus;
}
