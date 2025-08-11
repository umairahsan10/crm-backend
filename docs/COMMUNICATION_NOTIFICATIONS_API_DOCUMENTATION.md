# Notifications API Documentation

## Overview

The Notifications module provides a simple, privacy-focused notification system for the CRM. It allows employees to create, manage, and receive notifications while maintaining strict access controls.

### Key Features
- **Privacy-First Design**: Employees can only see notifications sent to them or by them
- **Simple Permissions**: Clear, straightforward access rules
- **HR Logging**: Automatic audit trail for HR actions
- **Status Management**: Track read/unread notifications
- **Individual Control**: Senders manage their own notifications

### Business Rules
- **Everyone can create notifications** - No role restrictions
- **Employees can only see their own notifications** - Complete privacy
- **Senders can only update/delete their own notifications** - No cross-editing
- **HR actions are automatically logged** - Compliance tracking
- **No global notification access** - Even for Admin/HR roles

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
  "status": "unread"
}
```

**Field Descriptions:**
- `heading` (required): Notification title/heading
- `content` (required): Notification message content
- `sentTo` (required): ID of the employee receiving the notification
- `userType` (required): Type of user (`"employee"` or `"admin"`)
- `status` (optional): Notification status (`"read"` or `"unread"`), defaults to `"unread"`
- `sentBy` (optional): ID of sender, defaults to current user ID

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
    }
  }
]
```

**Error Responses:**
- `400 Bad Request`: Invalid data or recipient not found
- `401 Unauthorized`: Missing or invalid JWT token
- `500 Internal Server Error`: Database or server error

---

## 2. Get All Notifications

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
    "status": "unread",
    "createdAt": "2024-01-01T10:00:00Z",
    "updatedAt": "2024-01-01T10:00:00Z",
    "sender": { /* sender details */ },
    "recipient": { /* recipient details */ }
  }
]
```

**Error Responses:**
- `401 Unauthorized`: Missing or invalid JWT token
- `500 Internal Server Error`: Database or server error

---

## 3. Get Notification by ID

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
  "status": "unread",
  "createdAt": "2024-01-01T10:00:00Z",
  "updatedAt": "2024-01-01T10:00:00Z",
  "sender": { /* sender details */ },
  "recipient": { /* recipient details */ }
}
```

**Error Responses:**
- `401 Unauthorized`: Missing or invalid JWT token
- `403 Forbidden`: Access denied to this notification
- `404 Not Found`: Notification not found
- `500 Internal Server Error`: Database or server error

---

## 4. Update Notification

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
  "status": "unread",
  "createdAt": "2024-01-01T10:00:00Z",
  "updatedAt": "2024-01-01T11:00:00Z",
  "sender": { /* sender details */ },
  "recipient": { /* recipient details */ }
}
```

**Error Responses:**
- `400 Bad Request`: Invalid data or foreign key constraint failed
- `401 Unauthorized`: Missing or invalid JWT token
- `403 Forbidden`: Only sender can update this notification
- `404 Not Found`: Notification not found
- `500 Internal Server Error`: Database or server error

---

## 5. Delete Notification

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

## 6. Get My Notifications

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
    "status": "unread",
    "createdAt": "2024-01-01T10:00:00Z",
    "updatedAt": "2024-01-01T10:00:00Z",
    "sender": { /* sender details */ },
    "recipient": { /* recipient details */ }
  }
]
```

**Error Responses:**
- `401 Unauthorized`: Missing or invalid JWT token
- `500 Internal Server Error`: Database or server error

---

## 7. Mark Notification as Read

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
  "status": "read",
  "createdAt": "2024-01-01T10:00:00Z",
  "updatedAt": "2024-01-01T12:00:00Z",
  "sender": { /* sender details */ },
  "recipient": { /* recipient details */ }
}
```

**Error Responses:**
- `401 Unauthorized`: Missing or invalid JWT token
- `403 Forbidden`: You can only mark your own notifications as read
- `404 Not Found`: Notification not found
- `500 Internal Server Error`: Database or server error

---

## 8. Get Unread Count

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

## 9. Get Notifications by Status

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
    "status": "unread",
    "createdAt": "2024-01-01T10:00:00Z",
    "updatedAt": "2024-01-01T10:00:00Z",
    "sender": { /* sender details */ },
    "recipient": { /* recipient details */ }
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
  employee = 'employee'
}
```

---

## Business Rules

### 1. Permission System
- **Create**: Everyone can create notifications
- **Read**: Users can only see notifications sent to them or by them
- **Update**: Only notification sender can update
- **Delete**: Only notification sender can delete
- **Mark as Read**: Only notification recipient can mark as read

### 2. Privacy Controls
- **No global access**: Even Admin/HR can only see their own notifications
- **Complete isolation**: Employees cannot see others' notifications
- **Sender restrictions**: Users can only modify their own sent notifications

### 3. HR Logging
- **Automatic tracking**: All HR actions are logged to HRLog table
- **Action types**: `NOTIFICATION_CREATED`, `NOTIFICATION_UPDATED`, `NOTIFICATION_DELETED`
- **Detailed descriptions**: Include notification content and affected employees
- **Compliance**: Maintains audit trail for HR activities

### 4. Data Validation
- **Recipient validation**: Ensures recipient employee exists
- **Field validation**: All required fields must be provided
- **Type validation**: Enums must match valid values
- **Error handling**: Comprehensive error messages for debugging

---

## HR Logging

### Logged Actions
1. **NOTIFICATION_CREATED**: When HR creates a notification
2. **NOTIFICATION_UPDATED**: When HR updates a notification
3. **NOTIFICATION_DELETED**: When HR deletes a notification

### Log Information
- **HR ID**: Who performed the action
- **Action Type**: What operation was performed
- **Affected Employee ID**: Recipient of the notification
- **Description**: Detailed description with notification details
- **Timestamp**: When the action occurred

### Example HR Log Entry
```json
{
  "hrId": 5,
  "actionType": "NOTIFICATION_CREATED",
  "affectedEmployeeId": 10,
  "description": "HR created notification: \"Company Policy Update\" for employee 10"
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

#### Create Notification
```bash
curl -X POST http://localhost:3000/communication/notifications \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "heading": "Test Notification",
    "content": "This is a test notification",
    "sentTo": 1,
    "userType": "employee",
    "status": "unread"
  }'
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

#### Scenario 1: Employee Creates Notification
1. Login as regular employee
2. Create notification for another employee
3. Verify only recipient can see it
4. Try to update/delete (should fail - not sender)

#### Scenario 2: HR Actions
1. Login as HR employee
2. Create notification
3. Check HR logs are created
4. Update/delete own notification
5. Try to access others' notifications (should fail)

#### Scenario 3: Privacy Test
1. Create notification as Employee A
2. Login as Employee B
3. Try to access Employee A's notification (should fail)
4. Verify only own notifications are visible

#### Scenario 4: Status Management
1. Create notification
2. Mark as read
3. Filter by status (read/unread)
4. Check unread count

---

## Notes

### 1. Bulk Notifications
- **Current limitation**: Schema supports single recipient per notification
- **Workaround**: Service creates individual records for each recipient
- **Benefit**: Better tracking and individual management
- **Consideration**: Multiple database records for bulk sends

### 2. Performance Considerations
- **Indexing**: Ensure `sentTo` and `sentBy` fields are indexed
- **Pagination**: Consider adding pagination for large notification lists
- **Caching**: Implement caching for frequently accessed notifications

### 3. Security Features
- **JWT validation**: All endpoints require valid authentication
- **Permission checks**: Server-side validation of all permissions
- **Input sanitization**: All user inputs are validated and sanitized
- **SQL injection protection**: Prisma ORM prevents SQL injection attacks

### 4. Future Enhancements
- **Real-time notifications**: WebSocket integration for instant delivery
- **Email integration**: Send email notifications for important messages
- **Notification templates**: Predefined templates for common notifications
- **Advanced filtering**: Search and filter by date, sender, content, etc.
- **Bulk operations**: Optimize bulk notification creation

---

## Support

For technical support or questions about the Notifications API, please contact the development team or refer to the internal documentation.

---

*Last updated: January 2024*
*Version: 1.0*
