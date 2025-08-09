# Communication Reminders API Documentation

## Overview
The Communication Reminders API allows employees to create, manage, and track personal reminders within the CRM system. All reminders are personal to the authenticated user, ensuring complete privacy and access control.

## Base URL
```
http://localhost:3000/communication/reminders
```

## Authentication
All endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer YOUR_JWT_TOKEN_HERE
```

## API Endpoints

### 1. Create Reminder
**Endpoint:** `POST /communication/reminders`  
**Method:** POST  
**Access Control:** All authenticated employees can create reminders  
**Business Logic:** Creates a personal reminder for the authenticated user  

#### Request Body
```json
{
  "title": "string (required)",
  "description": "string (optional)",
  "reminderDate": "string (required, YYYY-MM-DD format)",
  "reminderTime": "string (required, HH:MM format)",
  "isRecurring": "boolean (required)",
  "recurrencePattern": "string (optional, enum: Daily, Weekly, Monthly)"
}
```

#### Validation Rules
- `title`: Required, must be a string
- `reminderDate`: Required, must be valid date in YYYY-MM-DD format
- `reminderTime`: Required, must be in HH:MM format (24-hour)
- `isRecurring`: Required boolean value
- `recurrencePattern`: Required if `isRecurring` is true, must be one of: Daily, Weekly, Monthly
- `recurrencePattern`: Must not be provided if `isRecurring` is false

#### Example Request
```json
{
  "title": "Team Meeting",
  "description": "Weekly team standup meeting to discuss project progress",
  "reminderDate": "2024-01-15",
  "reminderTime": "10:30",
  "isRecurring": true,
  "recurrencePattern": "Weekly"
}
```

#### Success Response (201 Created)
```json
{
  "success": true,
  "message": "Reminder created successfully",
  "data": {
    "id": 1,
    "empId": 123,
    "title": "Team Meeting",
    "description": "Weekly team standup meeting to discuss project progress",
    "reminderDate": "2024-01-15T00:00:00.000Z",
    "reminderTime": "10:30",
    "isRecurring": true,
    "recurrencePattern": "Weekly",
    "status": "Pending",
    "createdAt": "2024-01-10T08:30:00.000Z",
    "updatedAt": "2024-01-10T08:30:00.000Z",
    "employee": {
      "id": 123,
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@company.com"
    }
  }
}
```

#### Error Scenarios
- **400 Bad Request**: Invalid data or validation errors
- **401 Unauthorized**: User not authenticated
- **500 Internal Server Error**: Server error

#### Database Tables Accessed
- `reminders` (INSERT)
- `employees` (SELECT for validation and response)

---

### 2. Get Reminders (with filters)
**Endpoint:** `GET /communication/reminders`  
**Method:** GET  
**Access Control:** Only authenticated user can get their own reminders  
**Business Logic:** Retrieves personal reminders with optional filters  

#### Query Parameters (Optional)
```
status: string (enum: Pending, Completed, Overdue)
isRecurring: boolean
recurrencePattern: string (enum: Daily, Weekly, Monthly)
dateFrom: string (YYYY-MM-DD format)
dateTo: string (YYYY-MM-DD format)
```

#### Example Requests
```http
GET /communication/reminders
GET /communication/reminders?status=Pending
GET /communication/reminders?isRecurring=true
GET /communication/reminders?recurrencePattern=Daily
GET /communication/reminders?dateFrom=2024-01-01&dateTo=2024-01-31
GET /communication/reminders?status=Pending&isRecurring=true&dateFrom=2024-01-01
```

#### Success Response (200 OK)
```json
{
  "success": true,
  "message": "Reminders retrieved successfully",
  "data": [
    {
      "id": 1,
      "empId": 123,
      "title": "Team Meeting",
      "description": "Weekly team standup meeting",
      "reminderDate": "2024-01-15T00:00:00.000Z",
      "reminderTime": "10:30",
      "isRecurring": true,
      "recurrencePattern": "Weekly",
      "status": "Pending",
      "createdAt": "2024-01-10T08:30:00.000Z",
      "updatedAt": "2024-01-10T08:30:00.000Z",
      "employee": {
        "id": 123,
        "firstName": "John",
        "lastName": "Doe",
        "email": "john.doe@company.com"
      }
    }
  ],
  "count": 1
}
```

#### Error Scenarios
- **401 Unauthorized**: User not authenticated
- **404 Not Found**: User not found
- **500 Internal Server Error**: Server error

#### Database Tables Accessed
- `reminders` (SELECT with filters)
- `employees` (JOIN for user details)

---

### 3. Get Reminder by ID
**Endpoint:** `GET /communication/reminders/:id`  
**Method:** GET  
**Access Control:** Only authenticated user can get their own reminders  
**Business Logic:** Retrieves a specific personal reminder by ID  

#### URL Parameters
- `id`: number (reminder ID)

#### Example Request
```http
GET /communication/reminders/1
```

#### Success Response (200 OK)
```json
{
  "success": true,
  "message": "Reminder retrieved successfully",
  "data": {
    "id": 1,
    "empId": 123,
    "title": "Team Meeting",
    "description": "Weekly team standup meeting",
    "reminderDate": "2024-01-15T00:00:00.000Z",
    "reminderTime": "10:30",
    "isRecurring": true,
    "recurrencePattern": "Weekly",
    "status": "Pending",
    "createdAt": "2024-01-10T08:30:00.000Z",
    "updatedAt": "2024-01-10T08:30:00.000Z",
    "employee": {
      "id": 123,
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@company.com"
    }
  }
}
```

#### Error Scenarios
- **401 Unauthorized**: User not authenticated
- **404 Not Found**: Reminder not found or not owned by user
- **500 Internal Server Error**: Server error

#### Database Tables Accessed
- `reminders` (SELECT by ID and empId)
- `employees` (JOIN for user details)

---

### 4. Update Reminder
**Endpoint:** `PUT /communication/reminders/:id`  
**Method:** PUT  
**Access Control:** Only authenticated user can update their own reminders  
**Business Logic:** Updates a personal reminder (only if owned by user)  

#### URL Parameters
- `id`: number (reminder ID)

#### Request Body (All fields optional)
```json
{
  "title": "string (optional)",
  "description": "string (optional)",
  "reminderDate": "string (optional, YYYY-MM-DD format)",
  "reminderTime": "string (optional, HH:MM format)",
  "isRecurring": "boolean (optional)",
  "recurrencePattern": "string (optional, enum: Daily, Weekly, Monthly)",
  "status": "string (optional, enum: Pending, Completed, Overdue)"
}
```

#### Validation Rules
- `reminderTime`: Must be in HH:MM format if provided
- `recurrencePattern`: Required for recurring reminders
- `recurrencePattern`: Cannot be provided for non-recurring reminders
- Setting `isRecurring` to false will automatically remove `recurrencePattern`

#### Example Requests

**Update basic fields:**
```json
{
  "title": "Updated Team Meeting",
  "description": "Updated description for the team meeting",
  "reminderTime": "11:00"
}
```

**Change from non-recurring to recurring:**
```json
{
  "isRecurring": true,
  "recurrencePattern": "Weekly"
}
```

**Change from recurring to non-recurring:**
```json
{
  "isRecurring": false
}
```

**Mark as completed:**
```json
{
  "status": "Completed"
}
```

#### Success Response (200 OK)
```json
{
  "success": true,
  "message": "Reminder updated successfully",
  "data": {
    "id": 1,
    "empId": 123,
    "title": "Updated Team Meeting",
    "description": "Updated description for the team meeting",
    "reminderDate": "2024-01-15T00:00:00.000Z",
    "reminderTime": "11:00",
    "isRecurring": true,
    "recurrencePattern": "Weekly",
    "status": "Pending",
    "createdAt": "2024-01-10T08:30:00.000Z",
    "updatedAt": "2024-01-10T09:15:00.000Z",
    "employee": {
      "id": 123,
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@company.com"
    }
  }
}
```

#### Error Scenarios
- **400 Bad Request**: Invalid data or validation errors
- **401 Unauthorized**: User not authenticated
- **404 Not Found**: Reminder not found or not owned by user
- **500 Internal Server Error**: Server error

#### Database Tables Accessed
- `reminders` (SELECT for validation, UPDATE)
- `employees` (JOIN for response)

---

### 5. Delete Reminder
**Endpoint:** `DELETE /communication/reminders/:id`  
**Method:** DELETE  
**Access Control:** Only authenticated user can delete their own reminders  
**Business Logic:** Deletes a personal reminder (only if owned by user)  

#### URL Parameters
- `id`: number (reminder ID)

#### Example Request
```http
DELETE /communication/reminders/1
```

#### Success Response (200 OK)
```json
{
  "success": true,
  "message": "Reminder deleted successfully",
  "data": {
    "id": 1,
    "empId": 123,
    "title": "Team Meeting",
    "description": "Weekly team standup meeting",
    "reminderDate": "2024-01-15T00:00:00.000Z",
    "reminderTime": "10:30",
    "isRecurring": true,
    "recurrencePattern": "Weekly",
    "status": "Pending",
    "createdAt": "2024-01-10T08:30:00.000Z",
    "updatedAt": "2024-01-10T08:30:00.000Z",
    "employee": {
      "id": 123,
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@company.com"
    }
  }
}
```

#### Error Scenarios
- **401 Unauthorized**: User not authenticated
- **404 Not Found**: Reminder not found or not owned by user
- **500 Internal Server Error**: Server error

#### Database Tables Accessed
- `reminders` (SELECT for validation, DELETE)
- `employees` (JOIN for response)

---

## Data Models

### Reminder Object
```typescript
interface Reminder {
  id: number;
  empId: number;
  title: string;
  description: string | null;
  reminderDate: Date;
  reminderTime: string;
  isRecurring: boolean;
  recurrencePattern: RecurrencePattern | null;
  status: ReminderStatus;
  createdAt: Date;
  updatedAt: Date;
  employee: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
}
```

### Enums
```typescript
enum RecurrencePattern {
  Daily = 'Daily',
  Weekly = 'Weekly',
  Monthly = 'Monthly'
}

enum ReminderStatus {
  Pending = 'Pending',
  Completed = 'Completed',
  Overdue = 'Overdue'
}
```

## Security Features

### Access Control
- **JWT Authentication**: All endpoints require valid JWT token
- **Personal Ownership**: Users can only access their own reminders
- **Automatic User Association**: Reminders are automatically associated with the authenticated user
- **Ownership Validation**: All read/update/delete operations verify reminder ownership

### Input Validation
- **Class Validators**: All DTOs use class-validator decorators
- **Time Format Validation**: Custom validation for HH:MM time format
- **Business Logic Validation**: Recurring pattern validation based on isRecurring flag
- **SQL Injection Protection**: Prisma ORM provides automatic protection

## Error Handling

### Standard Error Response Format
```json
{
  "statusCode": 400,
  "message": [
    "Title is required",
    "Reminder time must be in HH:MM format"
  ],
  "error": "Bad Request"
}
```

### Common Error Codes
- **400**: Bad Request - Validation errors or invalid data
- **401**: Unauthorized - Missing or invalid JWT token
- **404**: Not Found - Resource not found or access denied
- **500**: Internal Server Error - Unexpected server error

## Testing Examples

### Authentication Flow
1. **Login to get JWT token:**
```http
POST /auth/login
Content-Type: application/json

{
  "email": "john.doe@company.com",
  "password": "password123"
}
```

2. **Use token in subsequent requests:**
```http
GET /communication/reminders
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Test Scenarios

#### Valid Reminder Creation
```json
{
  "title": "Daily Standup",
  "description": "Daily team sync meeting",
  "reminderDate": "2024-01-15",
  "reminderTime": "09:00",
  "isRecurring": true,
  "recurrencePattern": "Daily"
}
```

#### Non-recurring Reminder
```json
{
  "title": "Project Deadline",
  "description": "Submit final project deliverables",
  "reminderDate": "2024-01-30",
  "reminderTime": "17:00",
  "isRecurring": false
}
```

#### Invalid Time Format (Will fail)
```json
{
  "title": "Invalid Time",
  "reminderDate": "2024-01-15",
  "reminderTime": "25:70",
  "isRecurring": false
}
```

#### Missing Recurrence Pattern (Will fail)
```json
{
  "title": "Missing Pattern",
  "reminderDate": "2024-01-15",
  "reminderTime": "10:00",
  "isRecurring": true
}
```

## Database Schema

The API uses the `reminders` table with the following structure:

```sql
CREATE TABLE reminders (
  reminder_id SERIAL PRIMARY KEY,
  emp_id INTEGER NOT NULL REFERENCES employees(emp_id),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  reminder_date DATE NOT NULL,
  reminder_time VARCHAR(10) NOT NULL,
  is_recurring BOOLEAN NOT NULL,
  recurrence_pattern VARCHAR(20), -- 'Daily', 'Weekly', 'Monthly'
  status VARCHAR(20) NOT NULL DEFAULT 'Pending', -- 'Pending', 'Completed', 'Overdue'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## Performance Considerations

- **Indexed Queries**: Queries are optimized with proper indexing on `emp_id` and `reminder_date`
- **Filtered Results**: Support for date range and status filtering to limit result sets
- **Efficient Joins**: Minimal employee data included in responses
- **Pagination**: Consider implementing pagination for large reminder lists

## Future Enhancements

- **Push Notifications**: Integration with notification service for reminder alerts
- **Reminder Categories**: Support for categorizing reminders (work, personal, etc.)
- **Shared Reminders**: Team-based reminders for collaborative tasks
- **Timezone Support**: Multi-timezone support for global teams
- **Reminder Templates**: Pre-defined reminder templates for common tasks
- **Bulk Operations**: Support for bulk create/update/delete operations
