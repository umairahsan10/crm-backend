# Communication Meeting API Documentation

This document provides comprehensive documentation for the Meeting module APIs within the Communication system.

## Table of Contents
1. [Overview](#overview)
2. [Authentication](#authentication)
3. [API Endpoints](#api-endpoints)
4. [Data Models](#data-models)
5. [Business Rules](#business-rules)
6. [Error Handling](#error-handling)
7. [Examples](#examples)
8. [HR Logging](#hr-logging)

---

## Overview

The Meeting module provides comprehensive meeting management functionality with role-based access control:

- **All employees** can create meetings
- **Sales team, HR, and Admin** can create meetings with clients
- **Access control** based on employee permissions and department
- **Meeting status tracking** (scheduled, completed, missed, declined, delayed)
- **Auto-reminder functionality**
- **Project association** for project-related meetings
- **HR action logging** for audit and compliance

**Important Note:** The `employeeId` field in meetings represents the **creator** of the meeting, not the participant. The frontend handles participant management and link distribution.

---

## Authentication

All endpoints require JWT authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

The JWT token contains user information including:
- `id`: Employee ID
- `role`: Employee role
- `type`: User type (employee/admin)
- `department`: Employee department
- `permissions`: Role-specific permissions

---

## API Endpoints

### Base URL
```
/communication/meetings
```

### 1. Create Meeting

**Endpoint:** `POST /communication/meetings`

**Description:** Create a new meeting. All employees can create meetings. Sales team, HR, and admin can create meetings with clients.

**Request Body:**
```json
{
  "clientId": null,
  "projectId": null,
  "topic": "Project Discussion",
  "dateTime": "2025-01-15T10:00:00Z",
  "status": "scheduled",
  "autoReminder": true,
  "meetingLink": "https://meet.google.com/abc-defg-hij"
}
```

**Required Fields:**
- `topic`: Meeting topic (string)
- `dateTime`: Meeting date and time (ISO 8601 format)
- `meetingLink`: Meeting link (string)

**Optional Fields:**
- `clientId`: Client ID (number) - Only for Sales/HR/Admin
- `projectId`: Project ID (number)
- `status`: Meeting status (scheduled, completed, missed, declined, delayed)
- `autoReminder`: Enable auto-reminder (boolean, default: true)

**Response (200):**
```json
{
  "id": 1,
  "employeeId": 1,
  "clientId": null,
  "projectId": null,
  "topic": "Project Discussion",
  "dateTime": "2025-01-15T10:00:00Z",
  "status": "scheduled",
  "autoReminder": true,
  "meetingLink": "https://meet.google.com/abc-defg-hij",
  "createdAt": "2025-01-10T09:00:00Z",
  "updatedAt": "2025-01-10T09:00:00Z",
  "employee": {
    "id": 1,
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@company.com",
    "department": {
      "id": 1,
      "name": "Sales"
    }
  },
  "client": null,
  "project": null
}
```

**Error Responses:**
- `400 Bad Request`: Invalid data or business rule violation
- `401 Unauthorized`: Invalid or missing JWT token
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Client or project not found

---

### 2. Get All Meetings

**Endpoint:** `GET /communication/meetings`

**Description:** Get all meetings with optional filters. **Only Admin and HR can access all meetings.**

**Query Parameters:**
- `employeeId` (optional): Filter by employee ID
- `clientId` (optional): Filter by client ID
- `projectId` (optional): Filter by project ID
- `status` (optional): Filter by meeting status
- `startDate` (optional): Filter by start date (ISO 8601)
- `endDate` (optional): Filter by end date (ISO 8601)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

**Example Request:**
```
GET /communication/meetings?status=scheduled&startDate=2025-01-01&page=1&limit=10
```

**Response (200):**
```json
[
  {
    "id": 1,
    "employeeId": 1,
    "clientId": null,
    "projectId": null,
    "topic": "Project Discussion",
    "dateTime": "2025-01-15T10:00:00Z",
    "status": "scheduled",
    "autoReminder": true,
    "meetingLink": "https://meet.google.com/abc-defg-hij",
    "createdAt": "2025-01-10T09:00:00Z",
    "updatedAt": "2025-01-10T09:00:00Z",
    "employee": {
      "id": 1,
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@company.com",
      "department": {
        "id": 1,
        "name": "Sales"
      }
    },
    "client": null,
    "project": null
  }
]
```

**Error Responses:**
- `403 Forbidden`: Only Admin and HR can access all meetings

---

### 3. Get Meeting by ID

**Endpoint:** `GET /communication/meetings/:id`

**Description:** Get a specific meeting by ID. Access control based on employee permissions.

**Path Parameters:**
- `id`: Meeting ID (number)

**Response (200):**
```json
{
  "id": 1,
  "employeeId": 1,
  "clientId": null,
  "projectId": null,
  "topic": "Project Discussion",
  "dateTime": "2025-01-15T10:00:00Z",
  "status": "scheduled",
  "autoReminder": true,
  "meetingLink": "https://meet.google.com/abc-defg-hij",
  "createdAt": "2025-01-10T09:00:00Z",
  "updatedAt": "2025-01-10T09:00:00Z",
  "employee": {
    "id": 1,
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@company.com",
    "department": {
      "id": 1,
      "name": "Sales"
    }
  },
  "client": null,
  "project": null
}
```

**Error Responses:**
- `403 Forbidden`: Access denied to this meeting
- `404 Not Found`: Meeting not found

---

### 4. Update Meeting

**Endpoint:** `PATCH /communication/meetings/:id`

**Description:** Update a meeting. **Only meeting creator or Admin can update (HR cannot update other people's meetings).**

**Path Parameters:**
- `id`: Meeting ID (number)

**Request Body:**
```json
{
  "topic": "Updated Project Discussion",
  "dateTime": "2025-01-16T11:00:00Z",
  "status": "completed",
  "meetingLink": "https://meet.google.com/xyz-uvw-rst"
}
```

**Response (200):**
```json
{
  "id": 1,
  "employeeId": 1,
  "clientId": null,
  "projectId": null,
  "topic": "Updated Project Discussion",
  "dateTime": "2025-01-16T11:00:00Z",
  "status": "completed",
  "autoReminder": true,
  "meetingLink": "https://meet.google.com/xyz-uvw-rst",
  "createdAt": "2025-01-10T09:00:00Z",
  "updatedAt": "2025-01-10T10:30:00Z",
  "employee": {
    "id": 1,
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@company.com",
    "department": {
      "id": 1,
      "name": "Sales"
    }
  },
  "client": null,
  "project": null
}
```

---

### 5. Delete Meeting

**Endpoint:** `DELETE /communication/meetings/:id`

**Description:** Delete a meeting. **Only meeting creator or Admin can delete (HR cannot delete other people's meetings).**

**Path Parameters:**
- `id`: Meeting ID (number)

**Response (200):**
```json
{
  "message": "Meeting deleted successfully"
}
```

---

### 6. Get My Meetings

**Endpoint:** `GET /communication/meetings/my/meetings`

**Description:** Get meetings created by the current employee.

**Response (200):**
```json
[
  {
    "id": 1,
    "employeeId": 1,
    "clientId": null,
    "projectId": null,
    "topic": "My Meeting",
    "dateTime": "2025-01-15T10:00:00Z",
    "status": "scheduled",
    "autoReminder": true,
    "meetingLink": "https://meet.google.com/abc-defg-hij",
    "createdAt": "2025-01-10T09:00:00Z",
    "updatedAt": "2025-01-10T09:00:00Z",
    "employee": {
      "id": 1,
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@company.com",
      "department": {
        "id": 1,
        "name": "Sales"
      }
    },
    "client": null,
    "project": null
  }
]
```

---

### 7. Get Upcoming Meetings

**Endpoint:** `GET /communication/meetings/upcoming/:days`

**Description:** Get upcoming meetings for the current employee within specified days.

**Path Parameters:**
- `days`: Number of days to look ahead

**Example Requests:**
```
GET /communication/meetings/upcoming/7
GET /communication/meetings/upcoming/14
```

**Default Endpoint:**
```
GET /communication/meetings/upcoming
```
Returns upcoming meetings for the next 7 days.

**Response (200):**
```json
[
  {
    "id": 1,
    "employeeId": 1,
    "clientId": null,
    "projectId": null,
    "topic": "Upcoming Meeting",
    "dateTime": "2025-01-15T10:00:00Z",
    "status": "scheduled",
    "autoReminder": true,
    "meetingLink": "https://meet.google.com/abc-defg-hij",
    "createdAt": "2025-01-10T09:00:00Z",
    "updatedAt": "2025-01-10T09:00:00Z",
    "employee": {
      "id": 1,
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@company.com",
      "department": {
        "id": 1,
        "name": "Sales"
      }
    },
    "client": null,
    "project": null
  }
]
```

---

## Data Models

### CreateMeetingDto
```typescript
{
  clientId?: number;
  projectId?: number;
  topic: string;
  dateTime: string; // ISO 8601 format
  status?: MeetingStatus;
  autoReminder?: boolean;
  meetingLink: string;
}
```

### UpdateMeetingDto
```typescript
{
  clientId?: number;
  projectId?: number;
  topic?: string;
  dateTime?: string; // ISO 8601 format
  status?: MeetingStatus;
  autoReminder?: boolean;
  meetingLink?: string;
}
```

### MeetingResponseDto
```typescript
{
  id: number;
  employeeId: number; // Creator ID
  clientId?: number;
  projectId?: number;
  topic: string;
  dateTime: Date;
  status: string;
  autoReminder: boolean;
  meetingLink: string;
  createdAt: Date;
  updatedAt: Date;
  employee?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    department?: {
      id: number;
      name: string;
    };
  };
  client?: {
    id: number;
    clientName?: string;
    companyName?: string;
    email?: string;
    phone?: string;
  };
  project?: {
    id: number;
    description?: string;
    status?: string;
  };
}
```

### MeetingStatus Enum
```typescript
enum MeetingStatus {
  scheduled = 'scheduled',
  completed = 'completed',
  missed = 'missed',
  declined = 'declined',
  delayed = 'delayed'
}
```

---

## Business Rules

### 1. Meeting Creation Permissions
- **All employees** can create meetings
- **Sales team, HR, and Admin** can create meetings with clients
- **Other departments** cannot create client meetings

### 2. Meeting Access Control
- **Admin and HR** can access all meetings
- **Other employees** can only access:
  - Meetings they created
  - Client meetings (if they are Sales/HR)

### 3. Meeting Update/Delete Permissions
- **Meeting creator** can update/delete their meetings
- **Admin** can update/delete any meeting
- **HR cannot modify** meetings they didn't create
- **Other employees** cannot modify meetings they didn't create

### 4. Date Validation
- Meeting date cannot be in the past
- Date must be in ISO 8601 format

### 5. Required Fields
- `topic`: Meeting topic is required
- `meetingLink`: Meeting link is required
- `dateTime`: Meeting date/time is required

### 6. Creator Tracking
- `employeeId` field always represents the **creator** of the meeting
- Frontend handles participant management and link distribution

---

## HR Logging

The system automatically logs all HR actions related to meetings for audit and compliance purposes:

### Logged Actions:
1. **MEETING_CREATED** - When HR creates a meeting
2. **MEETING_UPDATED** - When HR updates a meeting
3. **MEETING_DELETED** - When HR deletes a meeting

### Log Information:
- **HR ID** - Who performed the action
- **Action Type** - What operation was performed
- **Affected Employee ID** - Whose meeting was affected (creator)
- **Description** - Detailed description of the action
- **Timestamp** - When the action occurred

### Example Log Entries:
```
HR created meeting: Performance Review scheduled for 2024-12-22T11:00:00.000Z
HR updated meeting: "Performance Review" to "Annual Performance Review" scheduled for 2024-12-22T11:00:00.000Z
HR deleted meeting: "Annual Performance Review" that was scheduled for 2024-12-22T11:00:00.000Z
```

---

## Error Handling

### Common Error Responses

**400 Bad Request:**
```json
{
  "statusCode": 400,
  "message": "Meeting date cannot be in the past",
  "error": "Bad Request"
}
```

**401 Unauthorized:**
```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

**403 Forbidden:**
```json
{
  "statusCode": 403,
  "message": "Only Sales, HR, and Admin employees can schedule meetings with clients",
  "error": "Forbidden"
}
```

**404 Not Found:**
```json
{
  "statusCode": 404,
  "message": "Meeting not found",
  "error": "Not Found"
}
```

---

## Examples

### Example 1: Create Simple Meeting
```bash
curl -X POST http://localhost:3000/communication/meetings \
  -H "Authorization: Bearer <jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "Weekly Standup",
    "dateTime": "2025-01-15T10:00:00Z",
    "meetingLink": "https://meet.google.com/abc-defg-hij"
  }'
```

### Example 2: Create Client Meeting (Sales/HR/Admin only)
```bash
curl -X POST http://localhost:3000/communication/meetings \
  -H "Authorization: Bearer <jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": 1,
    "topic": "Client Presentation",
    "dateTime": "2025-01-16T14:00:00Z",
    "meetingLink": "https://meet.google.com/xyz-uvw-rst"
  }'
```

### Example 3: Create Project Meeting
```bash
curl -X POST http://localhost:3000/communication/meetings \
  -H "Authorization: Bearer <jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": 1,
    "topic": "Project Milestone Review",
    "dateTime": "2025-01-17T15:00:00Z",
    "meetingLink": "https://meet.google.com/project-review"
  }'
```

### Example 4: Get Upcoming Meetings
```bash
curl -X GET "http://localhost:3000/communication/meetings/upcoming/7" \
  -H "Authorization: Bearer <jwt_token>"
```

### Example 5: Update Meeting Status
```bash
curl -X PATCH http://localhost:3000/communication/meetings/1 \
  -H "Authorization: Bearer <jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "completed"
  }'
```

---

## Testing

The meeting module includes comprehensive unit tests covering:
- Service layer business logic
- Controller endpoint functionality
- Permission validation
- Error handling scenarios
- Data validation

Run tests with:
```bash
npm run test:unit -- --testPathPattern=meeting
```

---

## Notes

1. **Timezone Handling**: All dates are handled in UTC. Frontend should convert to local timezone for display.

2. **Auto-Reminder**: The `autoReminder` field is for future implementation of automated reminder functionality.

3. **Meeting Links**: Support for various meeting platforms (Google Meet, Zoom, Teams, etc.).

4. **Project Association**: Meetings can be optionally associated with projects for better organization.

5. **Access Control**: The system enforces strict access control based on employee roles and departments.

6. **Creator vs Participant**: The `employeeId` field represents the meeting creator, not participants. Frontend handles participant management.

7. **HR Logging**: All HR actions on meetings are automatically logged for audit purposes.
