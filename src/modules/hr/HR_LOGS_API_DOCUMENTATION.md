# HR Logs API Documentation

## Overview
The HR Logs API provides access to HR activity logs and audit trails. This API is restricted to **Department Managers only** and requires proper authentication and authorization.

## Base URL
```
/hr/logs
```

## Authentication & Authorization
- **Authentication**: JWT Bearer Token required
- **Authorization**: 
  - Department: HR
  - Role: `dep_manager` (Department Manager only)
  - Permission: `employee_add_permission`

## Endpoints

### 1. Get HR Logs
**GET** `/hr/logs`

Retrieves HR activity logs with filtering and pagination options.

**Permissions Required:**
- Department: HR
- Role: `dep_manager` (Department Manager)
- Permission: `employee_add_permission`

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `hr_id` | integer | No | Filter by specific HR employee ID |
| `action_type` | string | No | Filter by action type (e.g., 'employee_created', 'employee_updated') |
| `affected_employee_id` | integer | No | Filter by affected employee ID |
| `start_date` | string (YYYY-MM-DD) | No | Filter logs from this date (legacy) |
| `end_date` | string (YYYY-MM-DD) | No | Filter logs until this date (legacy) |
| `created_start` | string (YYYY-MM-DD) | No | Filter logs created from this date |
| `created_end` | string (YYYY-MM-DD) | No | Filter logs created until this date |
| `updated_start` | string (YYYY-MM-DD) | No | Filter logs updated from this date |
| `updated_end` | string (YYYY-MM-DD) | No | Filter logs updated until this date |
| `page` | integer | No | Page number (default: 1) |
| `limit` | integer | No | Items per page (default: 10) |
| `orderBy` | string | No | Field to sort by: `id`, `createdAt`, `updatedAt`, `actionType`, `affectedEmployeeId` (default: `createdAt`) |
| `orderDirection` | string | No | Sort direction: `asc` or `desc` (default: `desc`) |

**Sample Request:**
```bash
GET /hr/logs?action_type=employee_created&created_start=2025-01-01&created_end=2025-01-31&page=1&limit=20&orderBy=createdAt&orderDirection=desc
Authorization: Bearer <jwt-token>
```

**Sample Response:**
```json
{
  "logs": [
    {
      "id": 1,
      "hrId": 123,
      "actionType": "employee_created",
      "affectedEmployeeId": 456,
      "description": "New employee John Doe created with email john.doe@company.com in department Engineering",
      "createdAt": "2025-01-15T10:30:00.000Z",
      "updatedAt": "2025-01-15T10:30:00.000Z",
      "affectedEmployee": {
        "id": 456,
        "firstName": "John",
        "lastName": "Doe",
        "email": "john.doe@company.com"
      },
      "hr": {
        "id": 123,
        "employee": {
          "id": 789,
          "firstName": "Jane",
          "lastName": "Smith",
          "email": "jane.smith@company.com"
        }
      }
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 20,
  "totalPages": 1
}
```

## Action Types

The following action types are logged in the HR logs:

### Employee Management
- `employee_created` - When a new employee is created
- `employee_updated` - When employee information is updated
- `employee_terminated` - When an employee is terminated
- `employee_deleted` - When an employee is permanently deleted

### HR Management
- `hr_created` - When an HR record is created
- `hr_updated` - When HR permissions are updated
- `hr_deleted` - When an HR record is deleted

### Compensation & Benefits
- `bonus_updated` - When an employee's bonus is updated
- `shift_updated` - When employee shift times are updated

### Attendance Management
- `attendance_log_updated` - When attendance log status is changed
- `late_log_processed` - When late logs are processed
- `half_day_log_processed` - When half-day logs are processed
- `leave_log_processed` - When leave logs are processed

## Error Responses

### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

### 403 Forbidden
```json
{
  "statusCode": 403,
  "message": "User does not have the required roles. Required: dep_manager. User role: senior",
  "error": "Forbidden"
}
```

### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": "Failed to get HR logs: Invalid date format",
  "error": "Bad Request"
}
```

### 500 Internal Server Error
```json
{
  "statusCode": 500,
  "message": "Internal server error",
  "error": "Internal Server Error"
}
```

## Security Features

### Role-Based Access Control
- Only users with `dep_manager` role can access HR logs
- Admin users bypass role checks (automatic access)
- Department restriction: Only HR department users

### Data Privacy
- HR logs contain sensitive employee information
- Access is logged and audited
- Only authorized managers can view audit trails

### Filtering & Pagination
- Prevents data overload with pagination
- Allows filtering to find specific logs
- Date range filtering for compliance

## Usage Examples

### Get All HR Logs
```bash
GET /hr/logs
```

### Get Employee Creation Logs
```bash
GET /hr/logs?action_type=employee_created
```

### Get Logs for Specific Employee
```bash
GET /hr/logs?affected_employee_id=123
```

### Get Recent Logs (Last 30 Days)
```bash
GET /hr/logs?start_date=2025-01-01&end_date=2025-01-31
```

### Get Logs with Pagination
```bash
GET /hr/logs?page=2&limit=50
```

## Database Tables Affected
- **Read**: `hr_logs`, `employees`, `hr`

---

## HR Logs Statistics API

### 2. Get HR Logs Statistics
**GET** `/hr/logs/stats`

Retrieves HR logs statistics including total logs, today's logs, this week's logs, and this month's logs.

**Permissions Required:**
- Department: HR
- Role: `dep_manager` (Department Manager)
- Permission: `employee_add_permission`

**Sample Request:**
```bash
GET /hr/logs/stats
Authorization: Bearer <jwt-token>
```

**Sample Response:**
```json
{
  "totalLogs": 23,
  "todayLogs": 1,
  "thisWeekLogs": 5,
  "thisMonthLogs": 12
}
```

**Response Fields:**
| Field | Type | Description |
|-------|------|-------------|
| `totalLogs` | integer | Total number of HR logs in the system |
| `todayLogs` | integer | Number of logs created today (from 00:00:00) |
| `thisWeekLogs` | integer | Number of logs created this week (from Monday) |
| `thisMonthLogs` | integer | Number of logs created this month (from 1st day) |

**Time Zone Handling:**
- All calculations use server timezone (UTC)
- "Today" starts at 00:00:00 of current day
- "This Week" starts from Monday of current week
- "This Month" starts from 1st day of current month

**Error Responses:**
Same as the main HR logs API (401, 403, 500)

---

## Notes
- HR logs are automatically created when HR actions are performed
- Logs are immutable (cannot be modified or deleted)
- All timestamps are in UTC format
- Maximum limit per request: 100 items
- Default pagination: 10 items per page
- Statistics are calculated in real-time based on `createdAt` timestamps
