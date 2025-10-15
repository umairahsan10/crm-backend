import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsEnum } from 'class-validator';
import { NotificationStatus, UserType, NotificationType } from '@prisma/client';

export class CreateBulkNotificationDto {
  @ApiProperty({ description: 'Title or heading of the notification' })
  @IsString()
  heading: string;

  @ApiProperty({ description: 'Main content or body of the notification' })
  @IsString()
  content: string;

  @ApiProperty({
    description: 'ID of the sender (optional, system may assign automatically)',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  sentBy?: number;

  @ApiProperty({
    description: 'Type of user the notification is targeted to (e.g., CLIENT, EMPLOYEE)',
    enum: UserType,
  })
  @IsEnum(UserType)
  userType: UserType;

  @ApiProperty({
    description: 'Category of notification such as individual, bulk_all or bulk_department',
    enum: NotificationType,
    example: NotificationType.bulk_all,
  })
  @IsEnum(NotificationType)
  notificationType: NotificationType;

  @ApiProperty({
    description:
      'Target department ID (required for bulk_department notifications, null for bulk_all)',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  targetDepartmentId?: number; // Required for 'bulk_department', null for 'bulk_all'

  @ApiProperty({
    description: 'Current status of the notification (e.g., read, unread)',
    enum: NotificationStatus,
    required: false,
  })
  @IsOptional()
  @IsEnum(NotificationStatus)
  status?: NotificationStatus;
}
