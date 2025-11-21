# Notifications API Documentation

## Overview

The Notifications module provides a simple, privacy-focused notification system for the CRM. It allows employees to create, manage, and receive notifications while maintaining strict access controls. **NEW: Bulk notifications support for HR and department managers.**

### Key Features
- **Privacy-First Design**: Employees can only see notifications sent to them or by them
- **Simple Permissions**: Clear, straightforward access rules
- **HR Logging**: Automatic audit trail for HR actions
- **Status Management**: Track read/unread notifications
- **Individual Control**: Senders manage their own notifications
- **Bulk Notifications**: HR and department managers can send notifications to multiple employees at once

### Business Rules
- **Everyone can create notifications** - No role restrictions
- **Employees can only see their own notifications** - Complete privacy
- **Senders can only update/delete their own notifications** - No cross-editing
- **HR actions are automatically logged** - Compliance tracking
- **No global notification access** - Even for Admin/HR roles
- **Bulk notifications** - Only HR and department managers can send bulk notifications
- **Bulk notifications are immutable** - Once sent, they cannot be updated or deleted (similar to email)

---

## API Endpoints

### Base URL
```
/communication/notifications
```

### Authentication
All endpoints require JWT authentication via `Authorization: Bearer <token>` header.

---

## 1. Create Notification

Creates a new notification for a specific employee.

**Endpoint:** `POST /communication/notifications`

**Permissions:** Everyone can create notifications

**Request Body:**
```json
{
  "heading": "Meeting Reminder",
  "content": "Your team meeting starts in 15 minutes. Please join the Zoom call.",
  "sentTo": 1,
  "userType": "employee",
  "notificationType": "individual",
  "status": "unread"
}
```

**Field Descriptions:**
- `heading` (required): Notification title/heading
- `content` (required): Notification message content
- `sentTo` (required): ID of the employee receiving the notification
- `userType` (required): Type of user (`"employee"`, `"manager"`, `"admin"`)
- `notificationType` (required): Type of notification (`"individual"`, `"bulk_department"`, `"bulk_all"`)
- `status` (optional): Notification status (`"read"` or `"unread"`), defaults to `"unread"`
- `sentBy` (optional): ID of sender, defaults to current user ID
- `targetDepartmentId` (optional): Department ID for department-specific notifications

**Response:**
```json
[
  {
    "id": 1,
    "heading": "Meeting Reminder",
    "content": "Your team meeting starts in 15 minutes. Please join the Zoom call.",
    "sentTo": 1,
    "sentBy": 2,
    "userType": "employee",
    "notificationType": "individual",
    "targetDepartmentId": null,
    "status": "unread",
    "createdAt": "2024-01-01T10:00:00Z",
    "updatedAt": "2024-01-01T10:00:00Z",
    "sender": {
      "id": 2,
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@company.com",
      "department": {
        "id": 1,
        "name": "HR"
      }
    },
    "recipient": {
      "id": 1,
      "firstName": "Jane",
      "lastName": "Smith",
      "email": "jane.smith@company.com",
      "department": {
        "id": 2,
        "name": "Sales"
      }
    },
    "targetDepartment": null
  }
]
```

**Error Responses:**
- `400 Bad Request`: Invalid data or recipient not found
- `401 Unauthorized`: Missing or invalid JWT token
- `500 Internal Server Error`: Database or server error

---

## 2. Create Bulk Notification

Creates notifications for multiple employees at once (HR and department managers only).

**Endpoint:** `POST /communication/notifications/bulk`

**Permissions:** Only HR employees and department managers can create bulk notifications

**Request Body:**
```json
{
  "heading": "Company-wide Announcement",
  "content": "Dear team, we have an important company-wide announcement. Please review the attached document.",
  "userType": "employee",
  "notificationType": "bulk_all",
  "status": "unread"
}
```

**Field Descriptions:**
- `heading` (required): Notification title/heading
- `content` (required): Notification message content
- `userType` (required): Type of user (`"employee"`, `"manager"`, `"admin"`)
- `notificationType` (required): Type of bulk notification (`"bulk_all"` or `"bulk_department"`)
- `targetDepartmentId` (required for `bulk_department`): ID of the target department
- `status` (optional): Notification status, defaults to `"unread"`
- `sentBy` (optional): ID of sender, defaults to current user ID

**Response:**
```json
{
  "message": "Bulk notification sent successfully to 50 employees",
  "recipientCount": 50
}
```

**Error Responses:**
- `400 Bad Request`: Invalid data, department not found, or no active employees
- `401 Unauthorized`: Missing or invalid JWT token
- `403 Forbidden`: Only HR and department managers can send bulk notifications
- `500 Internal Server Error`: Database or server error

---

## 3. Get Bulk Notification Summary

Retrieves a summary of all bulk notifications sent (HR and department managers only).

**Endpoint:** `GET /communication/notifications/bulk`

**Permissions:** Only HR employees and department managers can view bulk notification summary

**Query Parameters:**
- `departmentId` (optional): Filter by specific department ID
- `notificationType` (optional): Filter by notification type (`"bulk_all"` or `"bulk_department"`)

**Examples:**

**Get all bulk notifications:**
```
GET /communication/notifications/bulk
```

**Get only department-specific bulk notifications:**
```
GET /communication/notifications/bulk?notificationType=bulk_department
```

**Get bulk notifications for specific department:**
```
GET /communication/notifications/bulk?departmentId=1
```

**Get department-specific bulk notifications for specific department:**
```
GET /communication/notifications/bulk?notificationType=bulk_department&departmentId=1
```

**Response:**
```json
[
  {
    "heading": "Company-wide Announcement",
    "content": "Dear team, we have an important company-wide announcement.",
    "notificationType": "bulk_all",
    "targetDepartmentId": null,
    "targetDepartmentName": null,
    "sentAt": "2024-01-01T10:00:00Z",
    "recipientCount": 50,
    "sentBy": 5,
    "senderName": "John Doe",
    "senderDepartment": "HR"
  },
  {
    "heading": "IT Department Meeting",
    "content": "All IT department members are required to attend the monthly team meeting.",
    "notificationType": "bulk_department",
    "targetDepartmentId": 1,
    "targetDepartmentName": "IT Department",
    "sentAt": "2024-01-01T09:00:00Z",
    "recipientCount": 15,
    "sentBy": 5,
    "senderName": "John Doe",
    "senderDepartment": "HR"
  }
]
```

**Error Responses:**
- `401 Unauthorized`: Missing or invalid JWT token
- `403 Forbidden`: Only HR and department managers can view bulk notification summary
- `500 Internal Server Error`: Database or server error

---

## 4. Get All Notifications

Retrieves notifications sent to or by the current user.

**Endpoint:** `GET /communication/notifications`

**Permissions:** Users can only see notifications sent to them or by them

**Response:**
```json
[
  {
    "id": 1,
    "heading": "Meeting Reminder",
    "content": "Your team meeting starts in 15 minutes.",
    "sentTo": 1,
    "sentBy": 2,
    "userType": "employee",
    "notificationType": "individual",
    "targetDepartmentId": null,
    "status": "unread",
    "createdAt": "2024-01-01T10:00:00Z",
    "updatedAt": "2024-01-01T10:00:00Z",
    "sender": { /* sender details */ },
    "recipient": { /* recipient details */ },
    "targetDepartment": null
  }
]
```

**Error Responses:**
- `401 Unauthorized`: Missing or invalid JWT token
- `500 Internal Server Error`: Database or server error

---

## 5. Get Notification by ID

Retrieves a specific notification by ID.

**Endpoint:** `GET /communication/notifications/:id`

**Permissions:** Only recipient or sender can access the notification

**Parameters:**
- `id` (path): Notification ID

**Response:**
```json
{
  "id": 1,
  "heading": "Meeting Reminder",
  "content": "Your team meeting starts in 15 minutes.",
  "sentTo": 1,
  "sentBy": 2,
  "userType": "employee",
  "notificationType": "individual",
  "targetDepartmentId": null,
  "status": "unread",
  "createdAt": "2024-01-01T10:00:00Z",
  "updatedAt": "2024-01-01T10:00:00Z",
  "sender": { /* sender details */ },
  "recipient": { /* recipient details */ },
  "targetDepartment": null
}
```

**Error Responses:**
- `401 Unauthorized`: Missing or invalid JWT token
- `403 Forbidden`: Access denied to this notification
- `404 Not Found`: Notification not found
- `500 Internal Server Error`: Database or server error

---

## 6. Update Notification

Updates an existing notification.

**Endpoint:** `PATCH /communication/notifications/:id`

**Permissions:** Only the notification sender can update

**Parameters:**
- `id` (path): Notification ID

**Request Body:**
```json
{
  "heading": "Meeting Rescheduled",
  "content": "Your meeting has been moved to 3:00 PM today.",
  "status": "unread"
}
```

**Field Descriptions:**
- `heading` (optional): New notification heading
- `content` (optional): New notification content
- `sentTo` (optional): New recipient ID
- `sentBy` (optional): New sender ID
- `userType` (optional): New user type
- `status` (optional): New notification status

**Response:**
```json
{
  "id": 1,
  "heading": "Meeting Rescheduled",
  "content": "Your meeting has been moved to 3:00 PM today.",
  "sentTo": 1,
  "sentBy": 2,
  "userType": "employee",
  "notificationType": "individual",
  "targetDepartmentId": null,
  "status": "unread",
  "createdAt": "2024-01-01T10:00:00Z",
  "updatedAt": "2024-01-01T11:00:00Z",
  "sender": { /* sender details */ },
  "recipient": { /* recipient details */ },
  "targetDepartment": null
}
```

**Error Responses:**
- `400 Bad Request`: Invalid data or foreign key constraint failed
- `401 Unauthorized`: Missing or invalid JWT token
- `403 Forbidden`: Only sender can update this notification
- `404 Not Found`: Notification not found
- `500 Internal Server Error`: Database or server error

---

## 7. Delete Notification

Deletes a notification.

**Endpoint:** `DELETE /communication/notifications/:id`

**Permissions:** Only the notification sender can delete

**Parameters:**
- `id` (path): Notification ID

**Response:**
```json
{
  "message": "Notification deleted successfully"
}
```

**Error Responses:**
- `401 Unauthorized`: Missing or invalid JWT token
- `403 Forbidden`: Only sender can delete this notification
- `404 Not Found`: Notification not found
- `500 Internal Server Error`: Database or server error

---

## 8. Get My Notifications

Retrieves notifications sent to the current user.

**Endpoint:** `GET /communication/notifications/my/notifications`

**Permissions:** Current user only

**Response:**
```json
[
  {
    "id": 1,
    "heading": "Meeting Reminder",
    "content": "Your team meeting starts in 15 minutes.",
    "sentTo": 1,
    "sentBy": 2,
    "userType": "employee",
    "notificationType": "individual",
    "targetDepartmentId": null,
    "status": "unread",
    "createdAt": "2024-01-01T10:00:00Z",
    "updatedAt": "2024-01-01T10:00:00Z",
    "sender": { /* sender details */ },
    "recipient": { /* recipient details */ },
    "targetDepartment": null
  }
]
```

**Error Responses:**
- `401 Unauthorized`: Missing or invalid JWT token
- `500 Internal Server Error`: Database or server error

---

## 9. Mark Notification as Read

Marks a notification as read.

**Endpoint:** `PATCH /communication/notifications/:id/read`

**Permissions:** Only the notification recipient can mark as read

**Parameters:**
- `id` (path): Notification ID

**Response:**
```json
{
  "id": 1,
  "heading": "Meeting Reminder",
  "content": "Your team meeting starts in 15 minutes.",
  "sentTo": 1,
  "sentBy": 2,
  "userType": "employee",
  "notificationType": "individual",
  "targetDepartmentId": null,
  "status": "read",
  "createdAt": "2024-01-01T10:00:00Z",
  "updatedAt": "2024-01-01T12:00:00Z",
  "sender": { /* sender details */ },
  "recipient": { /* recipient details */ },
  "targetDepartment": null
}
```

**Error Responses:**
- `401 Unauthorized`: Missing or invalid JWT token
- `403 Forbidden`: You can only mark your own notifications as read
- `404 Not Found`: Notification not found
- `500 Internal Server Error`: Database or server error

---

## 10. Get Unread Count

Retrieves the count of unread notifications for the current user.

**Endpoint:** `GET /communication/notifications/unread/count`

**Permissions:** Current user only

**Response:**
```json
{
  "count": 5
}
```

**Error Responses:**
- `401 Unauthorized`: Missing or invalid JWT token
- `500 Internal Server Error`: Database or server error

---

## 11. Get Notifications by Status

Retrieves notifications filtered by status for the current user.

**Endpoint:** `GET /communication/notifications/status/:status`

**Permissions:** Current user only

**Parameters:**
- `status` (path): Notification status (`"read"` or `"unread"`)

**Response:**
```json
[
  {
    "id": 1,
    "heading": "Meeting Reminder",
    "content": "Your team meeting starts in 15 minutes.",
    "sentTo": 1,
    "sentBy": 2,
    "userType": "employee",
    "notificationType": "individual",
    "targetDepartmentId": null,
    "status": "unread",
    "createdAt": "2024-01-01T10:00:00Z",
    "updatedAt": "2024-01-01T10:00:00Z",
    "sender": { /* sender details */ },
    "recipient": { /* recipient details */ },
    "targetDepartment": null
  }
]
```

**Error Responses:**
- `401 Unauthorized`: Missing or invalid JWT token
- `500 Internal Server Error`: Database or server error

---

## Data Models

### CreateNotificationDto
```typescript
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

  @IsEnum(NotificationType)
  notificationType: NotificationType;

  @IsOptional()
  @IsNumber()
  targetDepartmentId?: number;

  @IsOptional()
  @IsEnum(NotificationStatus)
  status?: NotificationStatus;
}
```

### CreateBulkNotificationDto
```typescript
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
  targetDepartmentId?: number;

  @IsOptional()
  @IsEnum(NotificationStatus)
  status?: NotificationStatus;
}
```

### UpdateNotificationDto
```typescript
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
```

### NotificationResponseDto
```typescript
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
```

### BulkNotificationResponseDto
```typescript
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
```

---

## Enums

### NotificationStatus
```typescript
enum NotificationStatus {
  read = 'read',
  unread = 'unread'
}
```

### UserType
```typescript
enum UserType {
  admin = 'admin',
  employee = 'employee',
  manager = 'manager'
}
```

### NotificationType
```typescript
enum NotificationType {
  individual = 'individual',
  bulk_department = 'bulk_department',
  bulk_all = 'bulk_all'
}
```

---

## Business Rules

### 1. Permission System
- **Create**: Everyone can create individual notifications
- **Create Bulk**: Only HR and department managers can create bulk notifications
- **Read**: Users can only see notifications sent to them or by them
- **Update**: Only notification sender can update (individual notifications only)
- **Delete**: Only notification sender can delete (individual notifications only)
- **Mark as Read**: Only notification recipient can mark as read
- **Bulk Summary**: Only HR and department managers can view bulk notification summary

### 2. Privacy Controls
- **No global access**: Even Admin/HR can only see their own notifications
- **Complete isolation**: Employees cannot see others' notifications
- **Sender restrictions**: Users can only modify their own sent notifications
- **Bulk notifications**: Each employee receives their own individual notification record

### 3. Bulk Notification Rules
- **Immutable**: Once sent, bulk notifications cannot be updated or deleted
- **Department-specific**: Can target specific departments or all employees
- **Individual records**: Creates separate notification records for each recipient
- **Transaction-based**: All notifications are created atomically
- **Permission-based**: Only HR and department managers can send bulk notifications

### 4. HR Logging
- **Automatic tracking**: All HR actions are logged to HRLog table
- **Action types**: `NOTIFICATION_CREATED`, `NOTIFICATION_UPDATED`, `NOTIFICATION_DELETED`, `BULK_NOTIFICATION_CREATED`
- **Detailed descriptions**: Include notification content and affected employees
- **Compliance**: Maintains audit trail for HR activities

### 5. Data Validation
- **Recipient validation**: Ensures recipient employee exists
- **Department validation**: Ensures target department exists for department-specific bulk notifications
- **Field validation**: All required fields must be provided
- **Type validation**: Enums must match valid values
- **Error handling**: Comprehensive error messages for debugging

---

## HR Logging

### Logged Actions
1. **NOTIFICATION_CREATED**: When HR creates an individual notification
2. **NOTIFICATION_UPDATED**: When HR updates an individual notification
3. **NOTIFICATION_DELETED**: When HR deletes an individual notification
4. **BULK_NOTIFICATION_CREATED**: When HR creates bulk notifications

### Log Information
- **HR ID**: Who performed the action
- **Action Type**: What operation was performed
- **Affected Employee ID**: Recipient of the notification (null for bulk)
- **Description**: Detailed description with notification details
- **Timestamp**: When the action occurred

### Example HR Log Entry
```json
{
  "hrId": 5,
  "actionType": "BULK_NOTIFICATION_CREATED",
  "affectedEmployeeId": null,
  "description": "HR created bulk notification: \"Company Policy Update\" for 50 employees"
}
```

---

## Error Handling

### Common Error Codes
- **400 Bad Request**: Invalid input data or business rule violation
- **401 Unauthorized**: Missing or invalid authentication
- **403 Forbidden**: Insufficient permissions for the action
- **404 Not Found**: Resource not found
- **500 Internal Server Error**: Server or database error

### Error Response Format
```json
{
  "message": "Error description",
  "error": "Error type",
  "statusCode": 400
}
```

---

## Testing Examples

### cURL Commands

#### Create Individual Notification
```bash
curl -X POST http://localhost:3000/communication/notifications \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "heading": "Test Notification",
    "content": "This is a test notification",
    "sentTo": 1,
    "userType": "employee",
    "notificationType": "individual",
    "status": "unread"
  }'
```

#### Create Bulk Notification to All Employees
```bash
curl -X POST http://localhost:3000/communication/notifications/bulk \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "heading": "Company-wide Announcement",
    "content": "Dear team, we have an important announcement.",
    "userType": "employee",
    "notificationType": "bulk_all",
    "status": "unread"
  }'
```

#### Create Bulk Notification to Specific Department
```bash
curl -X POST http://localhost:3000/communication/notifications/bulk \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "heading": "IT Department Meeting",
    "content": "All IT team members must attend the meeting.",
    "userType": "employee",
    "notificationType": "bulk_department",
    "targetDepartmentId": 1,
    "status": "unread"
  }'
```

#### Get Bulk Notification Summary
```bash
curl -X GET http://localhost:3000/communication/notifications/bulk \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Get Only Department-Specific Bulk Notifications
```bash
curl -X GET "http://localhost:3000/communication/notifications/bulk?notificationType=bulk_department" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Get Bulk Notifications for Specific Department
```bash
curl -X GET "http://localhost:3000/communication/notifications/bulk?departmentId=1" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Get Department-Specific Bulk Notifications for Specific Department
```bash
curl -X GET "http://localhost:3000/communication/notifications/bulk?notificationType=bulk_department&departmentId=1" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Update Notification
```bash
curl -X PATCH http://localhost:3000/communication/notifications/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "heading": "Updated Heading",
    "content": "Updated content"
  }'
```

#### Mark as Read
```bash
curl -X PATCH http://localhost:3000/communication/notifications/1/read \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Delete Notification
```bash
curl -X DELETE http://localhost:3000/communication/notifications/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Test Scenarios

#### Scenario 1: Employee Creates Individual Notification
1. Login as regular employee
2. Create notification for another employee
3. Verify only recipient can see it
4. Try to update/delete (should fail - not sender)

#### Scenario 2: HR Actions
1. Login as HR employee
2. Create individual notification
3. Check HR logs are created
4. Update/delete own notification
5. Try to access others' notifications (should fail)

#### Scenario 3: Bulk Notifications
1. Login as HR employee or department manager
2. Send bulk notification to all employees
3. Send bulk notification to specific department
4. Verify bulk notification summary shows correct data
5. Check that each employee receives their own notification record

#### Scenario 4: Bulk Notification Permissions
1. Login as regular employee
2. Try to send bulk notification (should fail - insufficient permissions)
3. Try to view bulk notification summary (should fail - insufficient permissions)

#### Scenario 5: Privacy Test
1. Create notification as Employee A
2. Login as Employee B
3. Try to access Employee A's notification (should fail)
4. Verify only own notifications are visible

#### Scenario 6: Status Management
1. Create notification
2. Mark as read
3. Filter by status (read/unread)
4. Check unread count

---

## Notes

### 1. Bulk Notifications
- **Implementation**: Creates individual notification records for each recipient
- **Benefits**: Better tracking, individual management, and privacy
- **Immutability**: Once sent, bulk notifications cannot be modified
- **Transaction-based**: All notifications are created atomically
- **Permission-based**: Only HR and department managers can send bulk notifications

### 2. Performance Considerations
- **Indexing**: Ensure `sentTo`, `sentBy`, `notificationType`, and `targetDepartmentId` fields are indexed
- **Pagination**: Consider adding pagination for large notification lists
- **Caching**: Implement caching for frequently accessed notifications
- **Bulk operations**: Optimized for creating multiple notifications efficiently

### 3. Security Features
- **JWT validation**: All endpoints require valid authentication
- **Permission checks**: Server-side validation of all permissions
- **Input sanitization**: All user inputs are validated and sanitized
- **SQL injection protection**: Prisma ORM prevents SQL injection attacks
- **Role-based access**: Bulk notifications restricted to authorized roles

### 4. Future Enhancements
- **Real-time notifications**: WebSocket integration for instant delivery
- **Email integration**: Send email notifications for important messages
- **Notification templates**: Predefined templates for common notifications
- **Advanced filtering**: Search and filter by date, sender, content, department, etc.
- **Notification preferences**: Allow users to set notification preferences
- **Read receipts**: Track when notifications are read by recipients

---

## Support

For technical support or questions about the Notifications API, please contact the development team or refer to the internal documentation.

---

*Last updated: January 2024*
*Version: 2.0 - Added Bulk Notifications Support*
