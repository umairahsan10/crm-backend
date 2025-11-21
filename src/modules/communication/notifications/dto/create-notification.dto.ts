import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsEnum } from 'class-validator';
import { NotificationStatus, UserType, NotificationType } from '@prisma/client';

export class CreateNotificationDto {
  @ApiProperty({ description: 'Title or heading of the notification' })
  @IsString()
  heading: string;

  @ApiProperty({ description: 'Main content or message body of the notification' })
  @IsString()
  content: string;

  @ApiProperty({
    description: 'Recipient user ID (optional for bulk notifications)',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  sentTo?: number; // Optional for bulk notifications

  @ApiProperty({
    description: 'Sender user ID (optional if system-generated)',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  sentBy?: number;

  @ApiProperty({
    description: 'Type of user the notification is targeted to (e.g., admin, employee)',
    enum: UserType,
    example: UserType.admin,
  })
  @IsEnum(UserType)
  userType: UserType;

  @ApiProperty({
    description: 'Category of notification (e.g., individual, bulk_all, bulk_department)',
    enum: NotificationType,
    example: NotificationType.bulk_all,
  })
  @IsEnum(NotificationType)
  notificationType: NotificationType;

  @ApiProperty({
    description: 'Target department ID for department-specific bulk notifications',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  targetDepartmentId?: number; // For department-specific bulk notifications

  @ApiProperty({
    description: 'Status of the notification (e.g., read, unread)',
    enum: NotificationStatus,
    required: false,
    example: NotificationStatus.read,
  })
  @IsOptional()
  @IsEnum(NotificationStatus)
  status?: NotificationStatus;
}
