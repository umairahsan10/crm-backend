# Admin Requests API Documentation

## Overview
The Admin Requests API allows HR personnel to create requests that require admin approval, and admins to manage these requests by updating their status.

## Base URL
```
/hr/admin-requests
```

## Authentication
All endpoints require JWT authentication with appropriate role and department permissions.

## Endpoints

### 1. Create Admin Request (HR Only)
**POST** `/hr/admin-requests`

Creates a new admin request that requires approval.

**Permissions Required:**
- Department: HR
- Permission: `employee_add_permission`

**Request Body:**
```json
{
  "description": "Request for salary increase for employee John Doe",
  "type": "salary_increase",
  "hrLogId": 123
}
```

**Request Type Options:**
- `salary_increase` - For salary increase requests
- `late_approval` - For late arrival approval requests
- `others` - For other miscellaneous requests

**Response:**
```json
{
  "id": 1,
  "hrLogId": 123,
  "description": "Request for salary increase for employee John Doe",
  "type": "salary_increase",
  "status": "pending",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z",
  "hrLog": {
    "id": 123,
    "hrId": 456,
    "actionType": "hr_created",
    "affectedEmployeeId": 789,
    "description": "HR record created for employee John Doe",
    "createdAt": "2024-01-15T10:25:00Z"
  }
}
```

### 2. Get All Admin Requests (Admin Only)
**GET** `/hr/admin-requests`

Retrieves all admin requests with pagination and filtering.

**Permissions Required:**
- Department: HR
- Permission: `employee_add_permission`

**Response:**
```json
{
  "adminRequests": [
    {
      "id": 1,
      "hrLogId": 123,
      "description": "Request for salary increase for employee John Doe",
      "type": "salary_increase",
      "status": "pending",
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z",
      "hrLog": {
        "id": 123,
        "hrId": 456,
        "actionType": "hr_created",
        "affectedEmployeeId": 789,
        "description": "HR record created for employee John Doe",
        "createdAt": "2024-01-15T10:25:00Z"
      }
    }
  ],
  "total": 1
}
```

### 3. Get Admin Requests by Status (Admin Only)
**GET** `/hr/admin-requests/status/:status`

Retrieves admin requests filtered by status (pending, approved, declined).

**Permissions Required:**
- Role: Admin (bypasses role check)

**Parameters:**
- `status` - The status to filter by (pending, approved, declined)

**Response:**
```json
{
  "adminRequests": [
    {
      "id": 1,
      "hrLogId": 123,
      "description": "Request for salary increase for employee John Doe",
      "type": "salary_increase",
      "status": "pending",
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z",
      "hrLog": {
        "id": 123,
        "hrId": 456,
        "actionType": "hr_created",
        "affectedEmployeeId": 789,
        "description": "HR record created for employee John Doe",
        "createdAt": "2024-01-15T10:25:00Z"
      }
    }
  ],
  "total": 1
}
```

### 4. Get Admin Request by ID
**GET** `/hr/admin-requests/:id`

Retrieves a specific admin request by its ID.

**Permissions Required:**
- Department: HR
- Permission: `employee_add_permission`

**Response:**
```json
{
  "id": 1,
  "hrLogId": 123,
  "description": "Request for salary increase for employee John Doe",
  "type": "salary_increase",
  "status": "pending",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z",
  "hrLog": {
    "id": 123,
    "hrId": 456,
    "actionType": "hr_created",
    "affectedEmployeeId": 789,
    "description": "HR record created for employee John Doe",
    "createdAt": "2024-01-15T10:25:00Z"
  }
}
```

### 5. Update Admin Request (HR Only, Pending Status Only)
**PUT** `/hr/admin-requests/:id`

Updates an admin request. Only pending requests can be updated.

**Permissions Required:**
- Department: HR
- Permission: `employee_add_permission`

**Request Body:**
```json
{
  "description": "Updated request description",
  "type": "late_approval"
}
```

**Response:**
```json
{
  "id": 1,
  "hrLogId": 123,
  "description": "Updated request description",
  "type": "late_approval",
  "status": "pending",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T11:00:00Z",
  "hrLog": {
    "id": 123,
    "hrId": 456,
    "actionType": "hr_created",
    "affectedEmployeeId": 789,
    "description": "HR record created for employee John Doe",
    "createdAt": "2024-01-15T10:25:00Z"
  }
}
```

### 6. Delete Admin Request (HR Only, Pending Status Only)
**DELETE** `/hr/admin-requests/:id`

Deletes an admin request. Only pending requests can be deleted.

**Permissions Required:**
- Department: HR
- Permission: `employee_add_permission`

**Response:**
```json
{
  "message": "Admin request 1 deleted successfully"
}
```

### 7. Update Admin Request Status (Admin Only)
**PUT** `/hr/admin-requests/:id/status`

Updates the status of an admin request (approved, declined, or pending).

**Permissions Required:**
- Department: HR
- Permission: `employee_add_permission`

**Request Body:**
```json
{
  "status": "approved"
}
```

**Status Options:**
- `approved` - Request has been approved
- `declined` - Request has been declined
- `pending` - Request is still pending

**Response:**
```json
{
  "id": 1,
  "hrLogId": 123,
  "description": "Request for salary increase for employee John Doe",
  "type": "salary_increase",
  "status": "approved",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T12:00:00Z",
  "hrLog": {
    "id": 123,
    "hrId": 456,
    "actionType": "hr_created",
    "affectedEmployeeId": 789,
    "description": "HR record created for employee John Doe",
    "createdAt": "2024-01-15T10:25:00Z"
  }
}
```

## Error Responses

### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": "Failed to create admin request: Invalid data",
  "error": "Bad Request"
}
```

### 403 Forbidden
```json
{
  "statusCode": 403,
  "message": "Cannot update admin request with status: approved. Only pending requests can be updated.",
  "error": "Forbidden"
}
```

### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "Admin request with ID 999 not found",
  "error": "Not Found"
}
```

## Business Rules

1. **HR Only Operations:**
   - Only HR employees can create, update, and delete admin requests
   - HR employees must have a valid HR record in the system

2. **Status Restrictions:**
   - Only pending requests can be updated or deleted by HR
   - Once a request is approved or declined, it cannot be modified by HR

3. **Admin Operations:**
   - Only admins can update the status of admin requests
   - Admins can change status to approved, declined, or pending

4. **Validation:**
   - All requests require a description and type
   - HR log ID is optional but must be valid if provided
   - Request types must be one of the predefined enum values

## Usage Examples

### Creating a Salary Increase Request
```bash
curl -X POST /hr/admin-requests \
  -H "Authorization: Bearer <jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Request for 10% salary increase for employee ID 123",
    "type": "salary_increase"
  }'
```

### Approving a Request
```bash
curl -X PUT /hr/admin-requests/1/status \
  -H "Authorization: Bearer <jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "approved"
  }'
```

### Getting All Requests
```bash
curl -X GET /hr/admin-requests \
  -H "Authorization: Bearer <jwt-token>"
```

### Getting Pending Requests Only
```bash
curl -X GET /hr/admin-requests/status/pending \
  -H "Authorization: Bearer <jwt-token>"
``` 