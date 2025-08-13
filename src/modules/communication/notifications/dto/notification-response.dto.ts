import { NotificationStatus, UserType, NotificationType } from '@prisma/client';

export class NotificationResponseDto {
  id: number;
  heading: string;
  content: string;
  sentTo: number;
  sentBy?: number;
  userType: UserType;
  notificationType: NotificationType;
  targetDepartmentId?: number | null;
  status: NotificationStatus;
  createdAt: Date;
  updatedAt: Date;
  
  // Additional fields for better UX
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

  targetDepartment?: {
    id: number;
    name: string;
  } | null;
}
