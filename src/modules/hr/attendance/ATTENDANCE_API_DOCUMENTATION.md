# Attendance Management System API Documentation

## Overview
The Attendance Management System provides comprehensive APIs for managing employee attendance, including check-ins/check-outs, late policies, leave management, and automated triggers. All endpoints require JWT authentication and appropriate permissions.

---

## Authentication & Authorization
- **Authentication**: JWT Bearer Token required for all endpoints
- **Authorization**: HR and Admin roles require `attendance_permission`
- **Database Access**: All operations use Prisma ORM with PostgreSQL

---

## Core Attendance APIs

### 1. Get Attendance Logs
**Endpoint**: `GET /attendance/logs`  
**Method**: GET  
**Access**: HR, Admin (requires `attendance_permission`)

#### Description
Retrieve daily attendance logs for employees with filtering capabilities. Returns logs within the last 3 months with employee names.

#### Query Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `employee_id` | integer | No | Filter by specific employee ID |
| `start_date` | string (YYYY-MM-DD) | No | Start date for filtering (within last 3 months) |
| `end_date` | string (YYYY-MM-DD) | No | End date for filtering (within last 3 months) |

#### Sample Request
```bash
GET /attendance/logs?employee_id=1&start_date=2025-07-28&end_date=2025-07-31
```

#### Sample Response
```json
[
  {
    "id": 1,
    "employee_id": 1,
    "employee_first_name": "John",
    "employee_last_name": "Doe",
    "date": "2025-07-28",
    "checkin": "2025-07-28T09:00:00.000Z",
    "checkout": "2025-07-28T17:00:00.000Z",
    "mode": "onsite",
    "status": "present",
    "created_at": "2025-07-28T09:00:00.000Z",
    "updated_at": "2025-07-28T17:00:00.000Z"
  }
]
```

#### Tables Affected
- **Read**: `attendance_logs`, `employees`

#### Error Responses
- `403`: Unauthorized access
- `400`: Invalid date format or date range
- `500`: Internal server error

---

### 2. Employee Check-in
**Endpoint**: `POST /attendance/checkin`  
**Method**: POST  
**Access**: All authenticated employees

#### Description
Record employee check-in with dynamic late policy application based on company settings and employee shift times. Updates multiple tables and may trigger late log creation.

#### Request Body
```json
{
  "employee_id": 1,
  "date": "2025-07-28",
  "checkin": "2025-07-28T09:45:00.000Z",
  "mode": "onsite"
}
```

#### Required Fields
- `employee_id` (integer): Employee ID
- `date` (string): Date in YYYY-MM-DD format
- `checkin` (string): Check-in time in ISO format

#### Optional Fields
- `mode` (string): "onsite" or "remote" (default: "onsite")

#### Sample Response
```json
{
  "id": 1,
  "employee_id": 1,
  "date": "2025-07-28",
  "checkin": "2025-07-28T09:45:00.000Z",
  "mode": "onsite",
  "status": "late",
  "late_details": {
    "minutes_late": 45,
    "requires_reason": true
  },
  "created_at": "2025-07-28T09:45:00.000Z",
  "updated_at": "2025-07-28T09:45:00.000Z"
}
```

#### Tables Affected
- **Create/Update**: `attendance_logs`
- **Update**: `attendance` (present_days, late_days, half_days, absent_days)
- **Update**: `monthly_attendance_summary` (total_present, total_late, total_half_days, total_absent)
- **Create**: `late_logs` (if late/half_day status)

#### Late Policy Rules
- **9:00-9:30**: Present
- **9:31-10:00**: Late
- **10:01-12:00**: Half-day
- **12:01 onwards**: Absent

#### Error Responses
- `400`: Invalid input data
- `403`: Unauthorized access
- `500`: Internal server error

---

### 3. Employee Check-out
**Endpoint**: `POST /attendance/checkout`  
**Method**: POST  
**Access**: All authenticated employees

#### Description
Record employee check-out and calculate total hours worked for the day.

#### Request Body
```json
{
  "employee_id": 1,
  "date": "2025-07-28",
  "checkout": "2025-07-28T17:30:00.000Z"
}
```

#### Required Fields
- `employee_id` (integer): Employee ID
- `date` (string): Date in YYYY-MM-DD format
- `checkout` (string): Check-out time in ISO format

#### Sample Response
```json
{
  "id": 1,
  "employee_id": 1,
  "date": "2025-07-28",
  "checkin": "2025-07-28T09:00:00.000Z",
  "checkout": "2025-07-28T17:30:00.000Z",
  "total_hours": 8.5,
  "mode": "onsite",
  "status": "present",
  "created_at": "2025-07-28T09:00:00.000Z",
  "updated_at": "2025-07-28T17:30:00.000Z"
}
```

#### Tables Affected
- **Update**: `attendance_logs` (checkout time, total_hours)

#### Error Responses
- `400`: Invalid input or no check-in found
- `403`: Unauthorized access
- `500`: Internal server error

---

## Attendance Management APIs

### 4. Get All Attendance Records
**Endpoint**: `GET /attendance/list`  
**Method**: GET  
**Access**: HR, Admin (requires `attendance_permission`)

#### Description
Retrieve all aggregated attendance records from the attendance table with employee details.

#### Sample Response
```json
[
  {
    "id": 1,
    "employee_id": 1,
    "employee_first_name": "John",
    "employee_last_name": "Doe",
    "present_days": 20,
    "absent_days": 2,
    "late_days": 3,
    "leave_days": 5,
    "remote_days": 8,
    "quarterly_leaves": 7,
    "monthly_lates": 2,
    "half_days": 1,
    "created_at": "2025-01-01T00:00:00.000Z",
    "updated_at": "2025-07-28T00:00:00.000Z"
  }
]
```

#### Tables Affected
- **Read**: `attendance`, `employees`

---

### 5. Get Employee Attendance Record
**Endpoint**: `GET /attendance/list/:id`  
**Method**: GET  
**Access**: HR, Admin (requires `attendance_permission`)

#### Description
Retrieve a specific employee's aggregated attendance record.

#### Path Parameters
- `id` (integer): Employee ID

#### Sample Response
```json
{
  "id": 1,
  "employee_id": 1,
  "employee_first_name": "John",
  "employee_last_name": "Doe",
  "present_days": 20,
  "absent_days": 2,
  "late_days": 3,
  "leave_days": 5,
  "remote_days": 8,
  "quarterly_leaves": 7,
  "monthly_lates": 2,
  "half_days": 1,
  "created_at": "2025-01-01T00:00:00.000Z",
  "updated_at": "2025-07-28T00:00:00.000Z"
}
```

#### Error Responses
- `400`: Invalid employee ID
- `404`: Employee not found

---

### 6. Get Monthly Attendance Records
**Endpoint**: `GET /attendance/month`  
**Method**: GET  
**Access**: HR, Admin (requires `attendance_permission`)

#### Description
Retrieve all employees' monthly attendance records.

#### Query Parameters
- `month` (string, optional): Month in YYYY-MM format (default: current month)

#### Sample Response
```json
[
  {
    "id": 1,
    "emp_id": 1,
    "employee_first_name": "John",
    "employee_last_name": "Doe",
    "month": "2025-07",
    "total_present": 20,
    "total_absent": 2,
    "total_leave_days": 5,
    "total_late_days": 3,
    "total_half_days": 1,
    "total_remote_days": 8,
    "generated_on": "2025-07-01T00:00:00.000Z",
    "created_at": "2025-07-01T00:00:00.000Z",
    "updated_at": "2025-07-28T00:00:00.000Z"
  }
]
```

#### Tables Affected
- **Read**: `monthly_attendance_summary`, `employees`

---

### 7. Get Employee Monthly Attendance
**Endpoint**: `GET /attendance/month/:emp_id`  
**Method**: GET  
**Access**: HR, Admin (requires `attendance_permission`)

#### Description
Retrieve a specific employee's monthly attendance record.

#### Path Parameters
- `emp_id` (integer): Employee ID

#### Query Parameters
- `month` (string, optional): Month in YYYY-MM format (default: current month)

#### Sample Response
```json
{
  "id": 1,
  "emp_id": 1,
  "employee_first_name": "John",
  "employee_last_name": "Doe",
  "month": "2025-07",
  "total_present": 20,
  "total_absent": 2,
  "total_leave_days": 5,
  "total_late_days": 3,
  "total_half_days": 1,
  "total_remote_days": 8,
  "generated_on": "2025-07-01T00:00:00.000Z",
  "created_at": "2025-07-01T00:00:00.000Z",
  "updated_at": "2025-07-28T00:00:00.000Z"
}
```

---

### 8. Update Attendance Record
**Endpoint**: `PUT /attendance/update`  
**Method**: PUT  
**Access**: HR, Admin (requires `attendance_permission`)

#### Description
HR can update any field in an employee's attendance record.

#### Request Body
```json
{
  "employee_id": 1,
  "present_days": 22,
  "absent_days": 1,
  "late_days": 2,
  "leave_days": 6,
  "remote_days": 10,
  "quarterly_leaves": 8,
  "monthly_lates": 1,
  "half_days": 0
}
```

#### Required Fields
- `employee_id` (integer): Employee ID

#### Optional Fields
- All attendance fields can be updated

#### Tables Affected
- **Update**: `attendance`

---

### 9. Update Monthly Attendance Record
**Endpoint**: `PUT /attendance/monthly/update`  
**Method**: PUT  
**Access**: HR, Admin (requires `attendance_permission`)

#### Description
HR can update any field in an employee's monthly attendance record.

#### Request Body
```json
{
  "emp_id": 1,
  "month": "2025-07",
  "total_present": 22,
  "total_absent": 1,
  "total_leave_days": 6,
  "total_late_days": 2,
  "total_half_days": 0,
  "total_remote_days": 10
}
```

#### Required Fields
- `emp_id` (integer): Employee ID
- `month` (string): Month in YYYY-MM format

#### Tables Affected
- **Update**: `monthly_attendance_summary`

---

## Late Policy Management APIs

### 10. Get Late Logs
**Endpoint**: `GET /attendance/late-logs`  
**Method**: GET  
**Access**: HR, Admin (requires `attendance_permission`)

#### Description
Retrieve late logs with filtering options.

#### Query Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `emp_id` | integer | No | Filter by employee ID |
| `date` | string (YYYY-MM-DD) | No | Filter by specific date |
| `action_taken` | string | No | Filter by action status |

#### Sample Response
```json
[
  {
    "late_log_id": 1,
    "emp_id": 1,
    "employee_first_name": "John",
    "employee_last_name": "Doe",
    "date": "2025-07-28",
    "scheduled_time_in": "09:00",
    "actual_time_in": "09:45",
    "minutes_late": 45,
    "reason": "Heavy traffic",
    "justified": null,
    "late_type": null,
    "action_taken": "Pending",
    "created_at": "2025-07-28T09:45:00.000Z",
    "updated_at": "2025-07-28T09:45:00.000Z"
  }
]
```

#### Tables Affected
- **Read**: `late_logs`, `employees`

---

### 11. Get Employee Late Logs
**Endpoint**: `GET /attendance/late-logs/employee/:emp_id`  
**Method**: GET  
**Access**: HR, Admin (requires `attendance_permission`)

#### Description
Retrieve late logs for a specific employee.

#### Path Parameters
- `emp_id` (integer): Employee ID

---

### 12. Submit Late Reason
**Endpoint**: `PUT /attendance/late-logs`  
**Method**: PUT  
**Access**: All authenticated employees

#### Description
Employee submits a reason for being late. Updates existing late log created by check-in.

#### Request Body
```json
{
  "emp_id": 1,
  "date": "2025-07-28",
  "scheduled_time_in": "09:00",
  "actual_time_in": "09:45",
  "minutes_late": 45,
  "reason": "Heavy traffic due to road construction"
}
```

#### Required Fields
- `emp_id` (integer): Employee ID
- `date` (string): Date in YYYY-MM-DD format
- `scheduled_time_in` (string): Scheduled time in HH:MM format
- `actual_time_in` (string): Actual arrival time in HH:MM format
- `minutes_late` (integer): Minutes late
- `reason` (string): Reason for being late

#### Tables Affected
- **Update**: `late_logs`

---

### 13. Process Late Action
**Endpoint**: `PUT /attendance/late-logs/:id/action`  
**Method**: PUT  
**Access**: HR, Admin (requires `attendance_permission`)

#### Description
HR processes a late action (approve/reject) and updates attendance counters.

#### Path Parameters
- `id` (integer): Late log ID

#### Request Body
```json
{
  "action": "Completed",
  "reviewer_id": 2,
  "late_type": "paid"
}
```

#### Required Fields
- `action` (string): "Pending" or "Completed"
- `reviewer_id` (integer): HR reviewer ID

#### Optional Fields
- `late_type` (string): "paid" or "unpaid" (when action is "Completed")

#### Sample Response
```json
{
  "late_log_id": 1,
  "emp_id": 1,
  "employee_first_name": "John",
  "employee_last_name": "Doe",
  "date": "2025-07-28",
  "scheduled_time_in": "09:00",
  "actual_time_in": "09:45",
  "minutes_late": 45,
  "reason": "Heavy traffic",
  "justified": true,
  "late_type": "paid",
  "action_taken": "Completed",
  "reviewer_name": "Jane Smith",
  "reviewed_on": "2025-07-28T10:00:00.000Z",
  "attendance_updates": {
    "late_days": 2,
    "monthly_lates": 1
  },
  "created_at": "2025-07-28T09:45:00.000Z",
  "updated_at": "2025-07-28T10:00:00.000Z"
}
```

#### Tables Affected
- **Update**: `late_logs`
- **Update**: `attendance` (late_days, monthly_lates)
- **Update**: `monthly_attendance_summary` (total_late_days)

---

## Half-Day Management APIs

### 14. Get Half-Day Logs
**Endpoint**: `GET /attendance/half-day-logs`  
**Method**: GET  
**Access**: HR, Admin (requires `attendance_permission`)

#### Description
Retrieve half-day logs with filtering options.

#### Query Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `emp_id` | integer | No | Filter by employee ID |
| `date` | string (YYYY-MM-DD) | No | Filter by specific date |
| `action_taken` | string | No | Filter by action status |

#### Sample Response
```json
[
  {
    "half_day_log_id": 1,
    "emp_id": 1,
    "employee_first_name": "John",
    "employee_last_name": "Doe",
    "date": "2025-07-28",
    "scheduled_time_in": "09:00",
    "actual_time_in": "10:30",
    "minutes_late": 90,
    "reason": "Medical appointment",
    "justified": null,
    "half_day_type": null,
    "action_taken": "Pending",
    "created_at": "2025-07-28T10:30:00.000Z",
    "updated_at": "2025-07-28T10:30:00.000Z"
  }
]
```

#### Tables Affected
- **Read**: `half_day_logs`, `employees`

---

### 15. Get Employee Half-Day Logs
**Endpoint**: `GET /attendance/half-day-logs/employee/:emp_id`  
**Method**: GET  
**Access**: HR, Admin (requires `attendance_permission`)

#### Description
Retrieve half-day logs for a specific employee.

#### Path Parameters
- `emp_id` (integer): Employee ID

---

### 16. Submit Half-Day Reason
**Endpoint**: `PUT /attendance/half-day-logs`  
**Method**: PUT  
**Access**: All authenticated employees

#### Description
Employee submits a reason for half-day.

#### Request Body
```json
{
  "emp_id": 1,
  "date": "2025-07-28",
  "scheduled_time_in": "09:00",
  "actual_time_in": "10:30",
  "minutes_late": 90,
  "reason": "Medical appointment"
}
```

#### Required Fields
- `emp_id` (integer): Employee ID
- `date` (string): Date in YYYY-MM-DD format
- `scheduled_time_in` (string): Scheduled time in HH:MM format
- `actual_time_in` (string): Actual arrival time in HH:MM format
- `minutes_late` (integer): Minutes late
- `reason` (string): Reason for half-day

#### Tables Affected
- **Update**: `half_day_logs`

---

### 17. Process Half-Day Action
**Endpoint**: `PUT /attendance/half-day-logs/:id/action`  
**Method**: PUT  
**Access**: HR, Admin (requires `attendance_permission`)

#### Description
HR processes a half-day action (approve/reject).

#### Path Parameters
- `id` (integer): Half-day log ID

#### Request Body
```json
{
  "action": "Completed",
  "reviewer_id": 2,
  "half_day_type": "paid"
}
```

#### Required Fields
- `action` (string): "Pending" or "Completed"
- `reviewer_id` (integer): HR reviewer ID

#### Optional Fields
- `half_day_type` (string): "paid" or "unpaid" (when action is "Completed")

#### Tables Affected
- **Update**: `half_day_logs`
- **Update**: `attendance` (half_days)
- **Update**: `monthly_attendance_summary` (total_half_days)

---

## Leave Management APIs

### 18. Get Leave Logs
**Endpoint**: `GET /attendance/leave-logs`  
**Method**: GET  
**Access**: HR, Admin (requires `attendance_permission`)

#### Description
Retrieve leave logs with filtering options.

#### Query Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `emp_id` | integer | No | Filter by employee ID |
| `start_date` | string (YYYY-MM-DD) | No | Filter by start date |
| `end_date` | string (YYYY-MM-DD) | No | Filter by end date |
| `status` | string | No | Filter by leave status |

#### Sample Response
```json
[
  {
    "leave_log_id": 1,
    "emp_id": 1,
    "employee_first_name": "John",
    "employee_last_name": "Doe",
    "leave_type": "sick",
    "start_date": "2025-07-28",
    "end_date": "2025-07-30",
    "reason": "Medical emergency",
    "status": "Approved",
    "applied_on": "2025-07-25T10:00:00.000Z",
    "reviewed_by": 2,
    "reviewer_name": "Jane Smith",
    "reviewed_on": "2025-07-25T14:00:00.000Z",
    "confirmation_reason": "Approved for medical emergency",
    "created_at": "2025-07-25T10:00:00.000Z",
    "updated_at": "2025-07-25T14:00:00.000Z"
  }
]
```

#### Tables Affected
- **Read**: `leave_logs`, `employees`

---

### 19. Get Employee Leave Logs
**Endpoint**: `GET /attendance/leave-logs/employee/:emp_id`  
**Method**: GET  
**Access**: HR, Admin (requires `attendance_permission`)

#### Description
Retrieve leave logs for a specific employee.

#### Path Parameters
- `emp_id` (integer): Employee ID

---

### 20. Create Leave Log
**Endpoint**: `POST /attendance/leave-logs`  
**Method**: POST  
**Access**: All authenticated employees

#### Description
Employee applies for leave with overlap checking.

#### Request Body
```json
{
  "emp_id": 1,
  "leave_type": "sick",
  "start_date": "2025-07-28",
  "end_date": "2025-07-30",
  "reason": "Medical emergency"
}
```

#### Required Fields
- `emp_id` (integer): Employee ID
- `leave_type` (string): Type of leave
- `start_date` (string): Start date in YYYY-MM-DD format
- `end_date` (string): End date in YYYY-MM-DD format
- `reason` (string): Reason for leave

#### Sample Response
```json
{
  "leave_log_id": 1,
  "emp_id": 1,
  "employee_first_name": "John",
  "employee_last_name": "Doe",
  "leave_type": "sick",
  "start_date": "2025-07-28",
  "end_date": "2025-07-30",
  "reason": "Medical emergency",
  "status": "Pending",
  "applied_on": "2025-07-25T10:00:00.000Z",
  "reviewed_by": null,
  "reviewer_name": null,
  "reviewed_on": null,
  "confirmation_reason": null,
  "created_at": "2025-07-25T10:00:00.000Z",
  "updated_at": "2025-07-25T10:00:00.000Z"
}
```

#### Tables Affected
- **Create**: `leave_logs`

#### Error Responses
- `400`: Overlapping leave request
- `400`: Invalid date range

---

### 21. Process Leave Action
**Endpoint**: `PUT /attendance/leave-logs/:id/action`  
**Method**: PUT  
**Access**: HR, Admin (requires `attendance_permission`)

#### Description
HR processes a leave action (approve/reject) with complex logic for past and future leaves.

#### Path Parameters
- `id` (integer): Leave log ID

#### Request Body
```json
{
  "action": "Approved",
  "reviewer_id": 2,
  "confirmation_reason": "Approved for medical emergency"
}
```

#### Required Fields
- `action` (string): "Approved" or "Rejected"
- `reviewer_id` (integer): HR reviewer ID

#### Optional Fields
- `confirmation_reason` (string): Reason for approval/rejection

#### Leave Processing Logic

**For Past Leaves (endDate < currentDate):**
1. Update attendance table:
   - `absent_days` - total_leave_days
   - `leave_days` + total_leave_days
   - `quarterly_leaves` - total_leave_days (not less than 0)
2. Update monthly attendance summary:
   - `total_absent` - total_leave_days
   - `total_leave_days` + total_leave_days
3. Update attendance logs:
   - Change status from 'absent' to 'leave' for leave dates

**For Future Leaves (startDate >= currentDate):**
- No action taken

#### Tables Affected
- **Update**: `leave_logs`
- **Update**: `attendance` (absent_days, leave_days, quarterly_leaves)
- **Update**: `monthly_attendance_summary` (total_absent, total_leave_days)
- **Update**: `attendance_logs` (status changes for past leaves)

---

## Automated Triggers

### 22. Monthly Lates Reset Trigger
**Endpoint**: `POST /attendance/triggers/monthly-lates-reset`  
**Method**: POST  
**Access**: HR, Admin (requires `attendance_permission`)

#### Description
Manually trigger monthly lates reset. Automatically resets `monthly_lates` to 3 for all employees.

#### Sample Response
```json
{
  "message": "Monthly lates reset triggered successfully",
  "updated_count": 25
}
```

#### Tables Affected
- **Update**: `attendance` (monthly_lates)

---

### 23. Quarterly Leaves Add Trigger
**Endpoint**: `POST /attendance/triggers/quarterly-leaves-add`  
**Method**: POST  
**Access**: HR, Admin (requires `attendance_permission`)

#### Description
Manually trigger quarterly leaves addition. Adds 5 to `quarterly_leaves` for all employees.

#### Sample Response
```json
{
  "message": "Quarterly leaves add triggered successfully",
  "updated_count": 25
}
```

#### Tables Affected
- **Update**: `attendance` (quarterly_leaves)

---

### 24. Quarterly Leaves Reset Trigger
**Endpoint**: `POST /attendance/triggers/quarterly-leaves-reset`  
**Method**: POST  
**Access**: HR, Admin (requires `attendance_permission`)

#### Description
Manually trigger quarterly leaves reset. Resets `quarterly_leaves` to 5 for all employees.

#### Sample Response
```json
{
  "message": "Quarterly leaves reset triggered successfully",
  "updated_count": 25
}
```

#### Tables Affected
- **Update**: `attendance` (quarterly_leaves)

---

### 25. Auto-Mark Absent Trigger
**Endpoint**: `POST /attendance/triggers/auto-mark-absent`  
**Method**: POST  
**Access**: HR, Admin (requires `attendance_permission`)

#### Description
Automatically mark employees as absent if they don't arrive after their shift end time + 30 minutes.

#### Activation Conditions
- Current time > (Employee's shift_end_time + 30 minutes)
- Employee status = 'active'
- Employee has shift_end_time
- Employee has no attendance log for today

#### Processing Logic
1. **If employee has approved leave**: Apply leave instead of absent
2. **If employee has no approved leave**: Mark as absent

#### Sample Response
```json
{
  "message": "Auto-mark absent process completed successfully",
  "absent_marked": 3,
  "leave_applied": 2
}
```

#### Tables Affected
- **Create/Update**: `attendance_logs` (status: 'absent' or 'leave')
- **Update**: `attendance` (absent_days, leave_days, quarterly_leaves)
- **Update**: `monthly_attendance_summary` (total_absent, total_leave_days)

---

## Database Schema Overview

### Core Tables

#### `employees`
- Employee information including shift times
- **Key Fields**: `id`, `firstName`, `lastName`, `shiftStart`, `shiftEnd`, `status`

#### `attendance`
- Aggregated attendance metrics per employee
- **Key Fields**: `employeeId`, `presentDays`, `absentDays`, `lateDays`, `leaveDays`, `quarterlyLeaves`, `monthlyLates`, `halfDays`

#### `attendance_logs`
- Daily check-in/check-out records
- **Key Fields**: `employeeId`, `date`, `checkin`, `checkout`, `mode`, `status`

#### `monthly_attendance_summary`
- Monthly aggregated attendance data
- **Key Fields**: `empId`, `month`, `totalPresent`, `totalAbsent`, `totalLeaveDays`, `totalLateDays`, `totalHalfDays`

#### `late_logs`
- Late reason submissions and HR actions
- **Key Fields**: `empId`, `date`, `reason`, `actionTaken`, `lateType`, `justified`

#### `half_day_logs`
- Half-day reason submissions
- **Key Fields**: `empId`, `date`, `reason`, `actionTaken`, `halfDayType`, `justified`

#### `leave_logs`
- Leave applications and approvals
- **Key Fields**: `empId`, `leaveType`, `startDate`, `endDate`, `reason`, `status`

#### `company`
- Company settings for late policy thresholds
- **Key Fields**: `lateTime`, `halfTime`, `absentTime`

---

## Error Handling

### Common Error Responses

#### 400 Bad Request
- Invalid input data
- Invalid date format
- Missing required fields
- Overlapping leave requests
- Invalid employee ID

#### 401 Unauthorized
- Missing or invalid JWT token

#### 403 Forbidden
- User lacks required permissions
- User role doesn't have attendance_permission

#### 404 Not Found
- Employee not found
- Record not found

#### 500 Internal Server Error
- Database connection issues
- Prisma ORM errors
- Unexpected server errors

---

## Security Considerations

### Authentication
- All endpoints require valid JWT token
- Tokens must be included in Authorization header: `Bearer <token>`

### Authorization
- HR and Admin roles require `attendance_permission`
- Employee endpoints accessible to all authenticated users
- Management endpoints restricted to HR/Admin

### Data Validation
- Input validation using class-validator
- Date format validation (YYYY-MM-DD)
- Time format validation (HH:MM)
- Numeric range validation

### Database Security
- Prisma ORM prevents SQL injection
- Parameterized queries for all database operations
- Transaction support for complex operations

---

## Timezone Handling

### PKT (Pakistan Standard Time)
- All time calculations use PKT
- Input times preserved as entered
- Storage in UTC with PKT conversion
- Display in local timezone

### Date/Time Formats
- **Dates**: YYYY-MM-DD format
- **Times**: HH:MM:SS format
- **ISO**: Full ISO format for API responses

---

## Performance Considerations

### Database Indexing
- Primary keys on all tables
- Foreign key indexes for relationships
- Composite indexes for common queries

### Query Optimization
- Selective field loading
- Pagination for large datasets
- Efficient date range queries

### Caching
- No built-in caching (can be added)
- Database-level query optimization
- Connection pooling via Prisma

---

## Testing

### API Testing
- Use Postman or similar tool
- Test all endpoints with valid/invalid data
- Verify error responses
- Test authentication/authorization

### Sample Test Data
```json
{
  "employee_id": 1,
  "date": "2025-07-28",
  "checkin": "2025-07-28T09:45:00.000Z",
  "mode": "onsite"
}
```

### Common Test Scenarios
1. Employee check-in (on time, late, half-day, absent)
2. Leave application and approval
3. Late reason submission and processing
4. Auto-mark absent trigger
5. Monthly/quarterly triggers

---

## Weekend Auto-Present System

### Overview
The system automatically marks employees as present on weekends when their shift start time arrives, eliminating the need for manual weekend attendance management.

### How It Works
- **Automatic Detection**: Runs every minute to check for weekend shifts
- **Shift Time Matching**: Compares current time with employee shift start times
- **Grace Period**: 5-minute window before and after shift start time
- **Auto-Present**: Creates attendance logs and updates summaries automatically

### Weekend Definition
- **Saturday**: 6th day of the week (Day 6)
- **Sunday**: 7th day of the week (Day 7)
- **Shift Ownership**: Based on shift start time (not end time)

### API Endpoints

#### 1. Manual Weekend Auto-Present Override (Testing)
**Endpoint**: `POST /hr/attendance/triggers/weekend-auto-present/override`  
**Method**: POST  
**Access**: HR, Admin (requires `attendance_permission`)

**Description**: **Testing endpoint** that bypasses weekend checks and processes employees immediately. Use this for testing the system regardless of current day.

**Response**:
```json
{
  "message": "Weekend auto-present override activated successfully (bypassing weekend check)",
  "marked_present": 5,
  "errors": 0
}
```

**Testing Behavior**: 
- **Processes all employees immediately** (no time restrictions)
- **Creates attendance logs** with actual shift start/end times
- **Updates all three tables** for comprehensive testing
- **Perfect for development** and system verification

#### 2. Get Weekend Status
**Endpoint**: `GET /hr/attendance/triggers/weekend-status`  
**Method**: GET  
**Access**: HR, Admin (requires `attendance_permission`)

**Description**: Get current weekend status and system information.

**Response**:
```json
{
  "isWeekend": true,
  "dayOfWeek": 6,
  "dayName": "Saturday",
  "currentTime": "21:00",
  "activeEmployees": 25
}
```

### Configuration
- **Timezone**: Asia/Karachi (PKT)
- **Check Frequency**: Every minute
- **Grace Period**: 5 minutes before/after shift start time
- **Employee Filter**: Only active employees with defined shift start times

### Business Logic
1. **Weekend Detection**: Checks if current day is Saturday (6) or Sunday (7)
2. **Time Matching**: Compares current time with employee shift start times
3. **Attendance Creation**: Creates attendance logs with "present" status
4. **Summary Updates**: Updates both attendance and monthly summary tables
5. **Duplicate Prevention**: Skips if attendance log already exists for the day

### Table Updates
The system updates **all three tables** when marking employees present on weekends:

#### 1. **attendance_logs** Table
- **Creates new record** with:
  - `employeeId`: Employee ID
  - `date`: Current date
  - `checkin`: Employee's shift start time (e.g., 21:00 for 9 PM)
  - `checkout`: Employee's shift end time (e.g., 05:00 for 5 AM)
  - `mode`: "onsite"
  - `status`: "present"

#### 2. **attendance** Table (Summary Table)
- **Updates or creates record** with:
  - `presentDays`: Increments by 1
  - Creates new record if none exists
  - Sets default values for other fields

#### 3. **monthly_attendance_summary** Table
- **Updates or creates monthly record** with:
  - `totalPresent`: Increments by 1
  - Creates new monthly record if none exists
  - Tracks monthly attendance statistics

### Data Flow
```

---

## Future Holiday Trigger System

### **Overview**
The Future Holiday Trigger System automatically marks employees as present on holidays when their individual shift start times arrive, ensuring proactive attendance management for planned holidays.

### **How It Works**
- **Automatic Detection**: Runs every minute to check for holidays and shift start times
- **Shift Time Matching**: Compares current time with each employee's shift start time
- **Grace Period**: 5-minute window before and after shift start time
- **Auto-Present**: Creates attendance logs and updates summaries automatically
- **Future Holiday Support**: Works with holidays created for future dates

### **Holiday Detection**
- **Daily Check**: System checks every minute if today is a holiday
- **Holiday Lookup**: Queries holidays table for current date
- **Employee Processing**: Only processes employees when their shift starts

### **API Endpoints**

#### 1. Get Future Holiday Trigger Status
**Endpoint**: `GET /hr/attendance/triggers/future-holiday-status`  
**Method**: GET  
**Access**: HR, Admin (requires `attendance_permission`)

**Description**: Get current status of the future holiday trigger system.

**Response**:
```json
{
  "isActive": true,
  "nextCheck": "2025-01-15T10:01:00.000Z",
  "todayHoliday": "Eid al-Fitr",
  "activeEmployees": 56
}
```

#### 2. Manual Future Holiday Trigger (Testing)
**Endpoint**: `POST /hr/attendance/triggers/future-holiday-manual/:date`  
**Method**: POST  
**Access**: HR, Admin (requires `attendance_permission`)

**Description**: **Testing endpoint** that manually triggers attendance marking for a specific holiday date.

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `date` | string | Yes | Date in YYYY-MM-DD format |

**Sample Request**:
```bash
POST /hr/attendance/triggers/future-holiday-manual/2025-01-15
```

**Response**:
```json
{
  "marked_present": 56,
  "errors": 0,
  "message": "Successfully marked 56 employees as present for holiday: Eid al-Fitr on 2025-01-15"
}
```

### **Configuration**
- **Timezone**: Asia/Karachi (PKT)
- **Check Frequency**: Every minute
- **Grace Period**: 5 minutes before/after shift start time
- **Employee Filter**: Only active employees with defined shift start times

### **Business Logic**
1. **Holiday Detection**: Checks if current date is a holiday
2. **Time Matching**: Compares current time with employee shift start times
3. **Attendance Creation**: Creates attendance logs with "present" status
4. **Summary Updates**: Updates both attendance and monthly summary tables
5. **Duplicate Prevention**: Skips if attendance log already exists for the day

### **Table Updates**
The system updates **all three tables** when marking employees present on holidays:

#### 1. **attendance_logs** Table
- **Creates new record** with:
  - `employeeId`: Employee ID
  - `date`: Holiday date
  - `checkin`: Employee's shift start time
  - `checkout`: Employee's shift end time
  - `mode`: "onsite"
  - `status`: "present"

#### 2. **attendance** Table (Summary Table)
- **Updates or creates record** with:
  - `presentDays`: Increments by 1
  - Creates new record if none exists
  - Sets default values for other fields

#### 3. **monthly_attendance_summary** Table
- **Updates or creates monthly record** with:
  - `totalPresent`: Increments by 1
  - Creates new monthly record if none exists
  - Tracks monthly attendance statistics

### **Use Cases**
1. **Planned Holidays**: Eid, Christmas, Independence Day, etc.
2. **Company Events**: Annual functions, team building days
3. **Government Holidays**: National holidays, public holidays
4. **Testing**: Manual triggers for immediate processing

### **Benefits**
- **Proactive Management**: No need to wait for holiday to pass
- **Accurate Records**: Employees marked present at their actual shift times
- **Automatic Processing**: No manual intervention required
- **Comprehensive Updates**: All relevant tables updated automatically
- **Testing Support**: Manual triggers for development and verification
Weekend Trigger → Check Employee Shift Times → Create Attendance Log → Update Attendance Summary → Update Monthly Summary
```

### Shift Time Handling
- **Shift Start Time**: Retrieved from `Employee.shiftStart` field
- **Shift End Time**: Retrieved from `Employee.shiftEnd` field
- **When Trigger Activates**:
  - `checkin` field is set to employee's actual shift start time (e.g., 21:00)
  - `checkout` field is set to employee's actual shift end time (e.g., 05:00)
  - Shift times are converted to DateTime objects for proper storage
  - System handles night shifts that cross midnight correctly

### Trigger Activation Details
- **Frequency**: Every minute
- **Weekend Detection**: Saturday (Day 6) and Sunday (Day 7)
- **Time Matching**: 5-minute grace period around shift start time
- **Employee Filter**: Only active employees with defined shift start times
- **Duplicate Prevention**: Won't create multiple attendance logs for same day

### Benefits
- **Automated Weekend Management**: No manual intervention needed
- **Accurate Reporting**: Weekend shifts properly tracked
- **Policy Compliance**: Consistent weekend attendance handling
- **Reduced Errors**: Eliminates manual weekend attendance mistakes

### Monitoring
- **Logs**: All actions logged with employee details
- **Error Tracking**: Failed operations are counted and logged
- **Performance**: Efficient processing with minimal database impact

---

## Maintenance

### Regular Tasks
- Monitor attendance data consistency
- Review late/leave policies
- Update company settings as needed
- Backup attendance data

### Troubleshooting
- Check database connectivity
- Verify JWT token validity
- Review server logs for errors
- Validate input data formats

---

*This documentation covers all attendance management APIs. For additional support, refer to the source code or contact the development team.* 