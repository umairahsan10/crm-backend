export class BulkNotificationResponseDto {
  heading: string;
  content: string;
  notificationType: string;
  targetDepartmentId?: number;
  targetDepartmentName?: string;
  sentAt: Date;
  recipientCount: number;
  sentBy: number;
  senderName: string;
  senderDepartment: string;
}
