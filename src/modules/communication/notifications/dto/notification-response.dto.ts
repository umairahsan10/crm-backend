import { ApiProperty } from '@nestjs/swagger';
import { NotificationStatus, UserType, NotificationType } from '@prisma/client';

export class NotificationResponseDto {
  @ApiProperty({ description: 'Unique identifier for the notification' })
  id: number;

  @ApiProperty({ description: 'Title or heading of the notification' })
  heading: string;

  @ApiProperty({ description: 'Main content or message of the notification' })
  content: string;

  @ApiProperty({ description: 'User ID of the recipient' })
  sentTo: number;

  @ApiProperty({ description: 'User ID of the sender', required: false })
  sentBy?: number;

  @ApiProperty({
    description: 'Type of user the notification is targeted to (e.g., admin, EMPLOYEE)',
    enum: UserType,
    example: UserType.admin,
  })
  userType: UserType;

  @ApiProperty({
    description: 'Category of the notification (e.g., single, bulk_all, bulk_department)',
    enum: NotificationType,
    example: NotificationType.bulk_all,
  })
  notificationType: NotificationType;

  @ApiProperty({
    description: 'Department ID if notification is department-targeted',
    required: false,
    nullable: true,
  })
  targetDepartmentId?: number | null;

  @ApiProperty({
    description: 'Current status of the notification (e.g., read, unread)',
    enum: NotificationStatus,
    example: NotificationStatus.read,
  })
  status: NotificationStatus;

  @ApiProperty({ description: 'Date and time when the notification was created' })
  createdAt: Date;

  @ApiProperty({ description: 'Date and time when the notification was last updated' })
  updatedAt: Date;

  // Additional fields for better UX
  @ApiProperty({
    description: 'Details of the sender (optional)',
    required: false,
    type: () => Object,
    example: {
      id: 1,
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      department: {
        id: 3,
        name: 'Engineering',
      },
    },
  })
  sender?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    department?: {
      id: number;
      name: string;
    };
  };

  @ApiProperty({
    description: 'Details of the recipient (optional)',
    required: false,
    type: () => Object,
    example: {
      id: 2,
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane.smith@example.com',
      department: {
        id: 5,
        name: 'Marketing',
      },
    },
  })
  recipient?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    department?: {
      id: number;
      name: string;
    };
  };

  @ApiProperty({
    description: 'Target department details (if applicable)',
    required: false,
    nullable: true,
    type: () => Object,
    example: {
      id: 1,
      name: 'HR',
    },
  })
  targetDepartment?: {
    id: number;
    name: string;
  } | null;
}
