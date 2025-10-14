import { ApiProperty } from '@nestjs/swagger';

export class BulkNotificationResponseDto {
  @ApiProperty({ description: 'Title or heading of the bulk notification' })
  heading: string;

  @ApiProperty({ description: 'Main message content of the notification' })
  content: string;

  @ApiProperty({ description: 'Type or category of the notification' })
  notificationType: string;

  @ApiProperty({
    description: 'Target department ID for which the notification is intended',
    required: false,
  })
  targetDepartmentId?: number;

  @ApiProperty({
    description: 'Name of the target department',
    required: false,
  })
  targetDepartmentName?: string;

  @ApiProperty({ description: 'Timestamp when the notification was sent' })
  sentAt: Date;

  @ApiProperty({ description: 'Number of recipients who received this notification' })
  recipientCount: number;

  @ApiProperty({ description: 'ID of the employee who sent the notification' })
  sentBy: number;

  @ApiProperty({ description: 'Full name of the sender' })
  senderName: string;

  @ApiProperty({ description: 'Department of the sender' })
  senderDepartment: string;
}
