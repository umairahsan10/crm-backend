# Employee Management API

This document describes the employee management endpoints available in the HR module.

## Authentication & Authorization

Most endpoints require:
- JWT authentication
- HR department access
- `employee_add_permission` permission

**Special Permissions:**
- **Bonus Update**: Requires `bonuses_set` permission

## Endpoints

### 1. Create Employee
**POST** `/hr/employees`

Creates a new employee with all required information.

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@company.com",
  "phone": "+1234567890",
  "gender": "male",
  "cnic": "12345-1234567-1",
  "departmentId": 1,
  "roleId": 1,
  "managerId": 2,
  "teamLeadId": 3,
  "address": "123 Main St, City",
  "maritalStatus": true,
  "status": "active",
  "startDate": "2025-01-01",
  "endDate": null,
  "modeOfWork": "hybrid",
  "remoteDaysAllowed": 2,
  "dob": "1990-01-01",
  "emergencyContact": "+1234567890",
  "shiftStart": "09:00",
  "shiftEnd": "17:00",
  "employmentType": "full_time",
  "dateOfConfirmation": "2025-04-01",
  "periodType": "probation",
  "passwordHash": "hashed_password",
  "bonus": 1000
}
```

**Response:**
```json
{
  "id": 1,
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@company.com",
  "phone": "+1234567890",
  "gender": "male",
  "cnic": "12345-1234567-1",
  "departmentId": 1,
  "roleId": 1,
  "managerId": 2,
  "teamLeadId": 3,
  "address": "123 Main St, City",
  "maritalStatus": true,
  "status": "active",
  "startDate": "2025-01-01T00:00:00.000Z",
  "endDate": null,
  "modeOfWork": "hybrid",
  "remoteDaysAllowed": 2,
  "dob": "1990-01-01T00:00:00.000Z",
  "emergencyContact": "+1234567890",
  "shiftStart": "09:00",
  "shiftEnd": "17:00",
  "employmentType": "full_time",
  "dateOfConfirmation": "2025-04-01T00:00:00.000Z",
  "periodType": "probation",
  "bonus": 1000,
  "createdAt": "2025-01-01T00:00:00.000Z",
  "updatedAt": "2025-01-01T00:00:00.000Z",
  "department": {
    "id": 1,
    "name": "Engineering",
    "description": "Software Engineering Department"
  },
  "role": {
    "id": 1,
    "name": "senior",
    "description": "Senior Developer"
  },
  "manager": {
    "id": 2,
    "firstName": "Jane",
    "lastName": "Smith",
    "email": "jane.smith@company.com"
  },
  "teamLead": {
    "id": 3,
    "firstName": "Bob",
    "lastName": "Johnson",
    "email": "bob.johnson@company.com"
  }
}
```

### 2. Get All Employees
**GET** `/hr/employees`

Retrieves employees with optional filters and pagination.

**Query Parameters:**
- `departmentId` (optional): Filter by department ID
- `roleId` (optional): Filter by role ID
- `status` (optional): Filter by status (`active`, `terminated`, `inactive`)
- `employmentType` (optional): Filter by employment type (`full_time`, `part_time`)
- `modeOfWork` (optional): Filter by work mode (`hybrid`, `on_site`, `remote`)
- `search` (optional): Search by name or email
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

**Example Request:**
```
GET /hr/employees?departmentId=1&status=active&page=1&limit=10
```

**Response:**
```json
{
  "employees": [
    {
      "id": 1,
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@company.com",
      "phone": "+1234567890",
      "gender": "male",
      "cnic": "12345-1234567-1",
      "departmentId": 1,
      "roleId": 1,
      "managerId": 2,
      "teamLeadId": 3,
      "address": "123 Main St, City",
      "maritalStatus": true,
      "status": "active",
      "startDate": "2025-01-01T00:00:00.000Z",
      "endDate": null,
      "modeOfWork": "hybrid",
      "remoteDaysAllowed": 2,
      "dob": "1990-01-01T00:00:00.000Z",
      "emergencyContact": "+1234567890",
      "shiftStart": "09:00",
      "shiftEnd": "17:00",
      "employmentType": "full_time",
      "dateOfConfirmation": "2025-04-01T00:00:00.000Z",
      "periodType": "probation",
      "bonus": 1000,
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z",
      "department": {
        "id": 1,
        "name": "Engineering",
        "description": "Software Engineering Department"
      },
      "role": {
        "id": 1,
        "name": "senior",
        "description": "Senior Developer"
      },
      "manager": {
        "id": 2,
        "firstName": "Jane",
        "lastName": "Smith",
        "email": "jane.smith@company.com"
      },
      "teamLead": {
        "id": 3,
        "firstName": "Bob",
        "lastName": "Johnson",
        "email": "bob.johnson@company.com"
      }
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10,
  "totalPages": 1
}
```

### 3. Get Employee by ID
**GET** `/hr/employees/:id`

Retrieves detailed information about a specific employee.

**Example Request:**
```
GET /hr/employees/1
```

**Response:**
```json
{
  "id": 1,
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@company.com",
  "phone": "+1234567890",
  "gender": "male",
  "cnic": "12345-1234567-1",
  "departmentId": 1,
  "roleId": 1,
  "managerId": 2,
  "teamLeadId": 3,
  "address": "123 Main St, City",
  "maritalStatus": true,
  "status": "active",
  "startDate": "2025-01-01T00:00:00.000Z",
  "endDate": null,
  "modeOfWork": "hybrid",
  "remoteDaysAllowed": 2,
  "dob": "1990-01-01T00:00:00.000Z",
  "emergencyContact": "+1234567890",
  "shiftStart": "09:00",
  "shiftEnd": "17:00",
  "employmentType": "full_time",
  "dateOfConfirmation": "2025-04-01T00:00:00.000Z",
  "periodType": "probation",
  "bonus": 1000,
  "createdAt": "2025-01-01T00:00:00.000Z",
  "updatedAt": "2025-01-01T00:00:00.000Z",
  "department": {
    "id": 1,
    "name": "Engineering",
    "description": "Software Engineering Department"
  },
  "role": {
    "id": 1,
    "name": "senior",
    "description": "Senior Developer"
  },
  "manager": {
    "id": 2,
    "firstName": "Jane",
    "lastName": "Smith",
    "email": "jane.smith@company.com"
  },
  "teamLead": {
    "id": 3,
    "firstName": "Bob",
    "lastName": "Johnson",
    "email": "bob.johnson@company.com"
  }
}
```

### 4. Update Employee
**PUT** `/hr/employees/:id`

Updates employee information. Only provided fields are updated.

**Request Body:**
```json
{
  "firstName": "John Updated",
  "phone": "+1234567891",
  "bonus": 1500
}
```

**Response:**
```json
{
  "id": 1,
  "firstName": "John Updated",
  "lastName": "Doe",
  "email": "john.doe@company.com",
  "phone": "+1234567891",
  "gender": "male",
  "cnic": "12345-1234567-1",
  "departmentId": 1,
  "roleId": 1,
  "managerId": 2,
  "teamLeadId": 3,
  "address": "123 Main St, City",
  "maritalStatus": true,
  "status": "active",
  "startDate": "2025-01-01T00:00:00.000Z",
  "endDate": null,
  "modeOfWork": "hybrid",
  "remoteDaysAllowed": 2,
  "dob": "1990-01-01T00:00:00.000Z",
  "emergencyContact": "+1234567890",
  "shiftStart": "09:00",
  "shiftEnd": "17:00",
  "employmentType": "full_time",
  "dateOfConfirmation": "2025-04-01T00:00:00.000Z",
  "periodType": "probation",
  "bonus": 1500,
  "createdAt": "2025-01-01T00:00:00.000Z",
  "updatedAt": "2025-01-01T00:00:00.000Z",
  "department": {
    "id": 1,
    "name": "Engineering",
    "description": "Software Engineering Department"
  },
  "role": {
    "id": 1,
    "name": "senior",
    "description": "Senior Developer"
  },
  "manager": {
    "id": 2,
    "firstName": "Jane",
    "lastName": "Smith",
    "email": "jane.smith@company.com"
  },
  "teamLead": {
    "id": 3,
    "firstName": "Bob",
    "lastName": "Johnson",
    "email": "bob.johnson@company.com"
  }
}
```

### 5. Update Employee Bonus
**PATCH** `/hr/employees/:id/bonus`

Updates the bonus amount for a specific employee. This endpoint requires the `bonuses_set` permission.

**Request Body:**
```json
{
  "bonus": 2000
}
```

**Response:**
```json
{
  "id": 1,
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@company.com",
  "phone": "+1234567890",
  "gender": "male",
  "cnic": "12345-1234567-1",
  "departmentId": 1,
  "roleId": 1,
  "managerId": 2,
  "teamLeadId": 3,
  "address": "123 Main St, City",
  "maritalStatus": true,
  "status": "active",
  "startDate": "2025-01-01T00:00:00.000Z",
  "endDate": null,
  "modeOfWork": "hybrid",
  "remoteDaysAllowed": 2,
  "dob": "1990-01-01T00:00:00.000Z",
  "emergencyContact": "+1234567890",
  "shiftStart": "09:00",
  "shiftEnd": "17:00",
  "employmentType": "full_time",
  "dateOfConfirmation": "2025-04-01T00:00:00.000Z",
  "periodType": "probation",
  "bonus": 2000,
  "createdAt": "2025-01-01T00:00:00.000Z",
  "updatedAt": "2025-01-01T00:00:00.000Z",
  "department": {
    "id": 1,
    "name": "Engineering",
    "description": "Software Engineering Department"
  },
  "role": {
    "id": 1,
    "name": "senior",
    "description": "Senior Developer"
  },
  "manager": {
    "id": 2,
    "firstName": "Jane",
    "lastName": "Smith",
    "email": "jane.smith@company.com"
  },
  "teamLead": {
    "id": 3,
    "firstName": "Bob",
    "lastName": "Johnson",
    "email": "bob.johnson@company.com"
  }
}
```

### 6. Update Employee Shift Times
**PATCH** `/hr/employees/:id/shift`

Updates the shift start and/or end times for a specific employee. This endpoint requires the `employee_add_permission`.

**Request Body:**
```json
{
  "shift_start": "08:00",
  "shift_end": "16:00"
}
```

**Note:** Both `shift_start` and `shift_end` are optional. You can update one or both fields. Times must be in HH:MM format (24-hour).

**Response:**
```json
{
  "id": 1,
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@company.com",
  "phone": "+1234567890",
  "gender": "male",
  "cnic": "12345-1234567-1",
  "departmentId": 1,
  "roleId": 1,
  "managerId": 2,
  "teamLeadId": 3,
  "address": "123 Main St, City",
  "maritalStatus": true,
  "status": "active",
  "startDate": "2025-01-01T00:00:00.000Z",
  "endDate": null,
  "modeOfWork": "hybrid",
  "remoteDaysAllowed": 2,
  "dob": "1990-01-01T00:00:00.000Z",
  "emergencyContact": "+1234567890",
  "shiftStart": "08:00",
  "shiftEnd": "16:00",
  "employmentType": "full_time",
  "dateOfConfirmation": "2025-04-01T00:00:00.000Z",
  "periodType": "probation",
  "bonus": 1000,
  "createdAt": "2025-01-01T00:00:00.000Z",
  "updatedAt": "2025-01-01T00:00:00.000Z",
  "department": {
    "id": 1,
    "name": "Engineering",
    "description": "Software Engineering Department"
  },
  "role": {
    "id": 1,
    "name": "senior",
    "description": "Senior Developer"
  },
  "manager": {
    "id": 2,
    "firstName": "Jane",
    "lastName": "Smith",
    "email": "jane.smith@company.com"
  },
  "teamLead": {
    "id": 3,
    "firstName": "Bob",
    "lastName": "Johnson",
    "email": "bob.johnson@company.com"
  }
}
```

### 7. Delete Employee
**DELETE** `/hr/employees/:id`

Permanently deletes an employee and all related records from the database. This includes:
- Attendance records and logs
- Salary and commission records
- Project assignments and tasks
- Lead assignments and comments
- Financial records (expenses, revenues, assets, etc.)
- Communication records (chats, messages, meetings)
- HR requests and complaints
- All other related data

**⚠️ Warning: This action cannot be undone!**

**Example Request:**
```
DELETE /hr/employees/1
```

**Response:**
```json
{
  "message": "Employee and all related records deleted successfully"
}
```

## Error Responses

### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": "Employee with email john.doe@company.com already exists",
  "error": "Bad Request"
}
```

### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "Employee with ID 999 not found",
  "error": "Not Found"
}
```

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
  "message": "Forbidden resource",
  "error": "Forbidden"
}
```

## Data Validation

The API validates:
- Email uniqueness
- Department existence
- Role existence
- Manager existence (if provided)
- Team Lead existence (if provided)
- Date formats (YYYY-MM-DD)
- Enum values for gender, status, employment type, etc.

## HR Logging

All employee management operations are logged in the HR logs table for audit purposes:

### Action Types:
- `employee_created` - When a new employee is created
- `employee_updated` - When employee information is updated (includes list of changed fields)
- `bonus_updated` - When an employee's bonus is updated
- `shift_updated` - When an employee's shift times are updated
- `employee_terminated` - When an employee is terminated (soft delete)
- `employee_deleted` - When an employee is permanently deleted (hard delete)

### Log Details:
Each log entry includes:
- **HR Employee ID** - Who performed the action
- **Action Type** - What operation was performed
- **Affected Employee ID** - Which employee was affected
- **Description** - Detailed description of the action
- **Timestamp** - When the action was performed

### Example Log Entries:
```
employee_created: "New employee John Doe created with email john.doe@company.com in department Engineering"
employee_updated: "Employee John Doe updated - Fields changed: firstName, phone, bonus"
bonus_updated: "Bonus updated for employee John Doe from 1000 to 2000"
shift_updated: "Shift times updated for employee John Doe - Changes: shift_start: 09:00 → 08:00, shift_end: 17:00 → 16:00"
employee_terminated: "Employee John Doe terminated on 2025-12-31"
employee_deleted: "Employee John Doe (ID: 123, Email: john.doe@company.com) permanently deleted from all systems"
``` 