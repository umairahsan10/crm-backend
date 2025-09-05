# Communication Employee API Documentation

## Overview
The Communication Employee module handles HR request management between employees and HR personnel. Employees can create requests, and HR can manage them with full audit trail logging.

## Base URL
```
/communication/employee
```

## Authentication
All endpoints require JWT authentication and department-based authorization.

## Endpoints

### 1. Get All HR Requests (HR/Admin Only)
**GET** `/hr-requests`

**Authorization:** HR, Admin

**Description:** Retrieve all HR requests in the system.

**Response:**
```json
[
  {
    "id": 1,
    "empId": 1,
    "departmentId": 2,
    "requestType": "Leave Request",
    "subject": "Annual Leave Application",
    "description": "I would like to request annual leave...",
    "priority": "Medium",
    "status": "Pending",
    "assignedTo": 5,
    "requestedOn": "2024-12-08T10:00:00.000Z",
    "resolvedOn": null,
    "createdAt": "2024-12-08T10:00:00.000Z",
    "updatedAt": "2024-12-08T10:00:00.000Z",
    "employee": {
      "id": 1,
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@company.com",
      "department": {
        "id": 2,
        "name": "Development"
      },
      "role": {
        "id": 3,
        "name": "developer"
      }
    },
    "department": {
      "id": 2,
      "name": "Development"
    },
    "assignedToEmployee": {
      "id": 5,
      "firstName": "Jane",
      "lastName": "Smith",
      "email": "jane.smith@company.com"
    }
  }
]
```

### 2. Get My HR Requests (Employee)
**GET** `/hr-requests/my-requests?employeeId={employeeId}`

**Authorization:** HR, Admin, Development, Marketing, Sales, Production

**Parameters:**
- `employeeId` (required): The ID of the employee

**Description:** Retrieve HR requests created by the specified employee.

**Response:** Same format as Get All HR Requests

### 3. Get HR Request by ID (HR/Admin Only)
**GET** `/hr-requests/{id}`

**Authorization:** HR, Admin

**Parameters:**
- `id` (path): The HR request ID

**Description:** Retrieve a specific HR request by ID.

**Response:** Same format as Get All HR Requests (single object)

### 4. Get HR Requests by Priority (HR/Admin Only)
**GET** `/hr-requests/priority/{priority}`

**Authorization:** HR, Admin

**Parameters:**
- `priority` (path): Priority level (Low, Medium, High, Critical)

**Description:** Retrieve HR requests filtered by priority.

**Response:** Array of HR requests with specified priority

### 5. Get HR Requests by Status (HR Only)
**GET** `/hr-requests/status/{status}`

**Authorization:** HR

**Parameters:**
- `status` (path): Request status (Pending, In Progress, Resolved, Rejected, On Hold)

**Description:** Retrieve HR requests filtered by status.

**Response:** Array of HR requests with specified status

### 6. Create HR Request
**POST** `/hr-requests`

**Authorization:** HR, Admin, Development, Marketing, Sales, Production

**Description:** Create a new HR request.

**Request Body:**
```json
{
  "empId": 1,
  "departmentId": 2,
  "requestType": "Leave Request",
  "subject": "Annual Leave Application",
  "description": "I would like to request annual leave from December 20-30, 2024 for family vacation.",
  "priority": "Medium",
  "status": "Pending",
  "assignedTo": null
}
```

**Field Descriptions:**
- `empId` (required): Employee ID creating the request
- `departmentId` (optional): Target department ID
- `requestType` (required): Type of request
- `subject` (required): Request subject/title
- `description` (required): Detailed description
- `priority` (optional): Priority level (defaults to "Low")
- `status` (optional): Initial status (defaults to "Pending")
- `assignedTo` (optional): HR employee ID to assign (if HR creates for employee)

**Response:**
```json
{
  "message": "HR request created successfully",
  "data": {
    // HR request object with full details
  }
}
```

### 7. Take HR Action
**POST** `/hr-requests/{id}/action?hrEmployeeId={hrEmployeeId}`

**Authorization:** HR

**Parameters:**
- `id` (path): The HR request ID
- `hrEmployeeId` (query): The HR employee ID taking the action

**Description:** Take action on an HR request (create initial action).

**Request Body:**
```json
{
  "status": "In Progress",
  "responseNotes": "Request received and under review. Will process within 3 business days.",
  "assignedTo": 5,
  "requestType": "Leave Request - Updated",
  "subject": "Annual Leave Application - Modified",
  "description": "Updated leave request with additional details.",
  "priority": "High",
  "departmentId": 3
}
```

**Field Descriptions:**
- `status` (optional): New status for the request
- `responseNotes` (optional): HR's response and notes
- `assignedTo` (optional): HR employee ID to assign
- `requestType` (optional): Updated request type
- `subject` (optional): Updated subject
- `description` (optional): Updated description
- `priority` (optional): Updated priority
- `departmentId` (optional): Updated department ID

**Response:**
```json
{
  "message": "HR action taken successfully",
  "data": {
    // Updated HR request object
  }
}
```

### 8. Update HR Action
**PUT** `/hr-requests/{id}/action?hrEmployeeId={hrEmployeeId}`

**Authorization:** HR

**Parameters:**
- `id` (path): The HR request ID
- `hrEmployeeId` (query): The HR employee ID updating the action

**Description:** Update an existing HR action on a request.

**Request Body:** Same as Take HR Action

**Response:**
```json
{
  "message": "HR request action updated successfully",
  "data": {
    // Updated HR request object
  }
}
```

### 9. Delete HR Request
**DELETE** `/hr-requests/{id}?hrEmployeeId={hrEmployeeId}`

**Authorization:** HR

**Parameters:**
- `id` (path): The HR request ID
- `hrEmployeeId` (query): The HR employee ID deleting the request

**Description:** Delete an HR request (will be logged in hr_logs).

**Response:**
```json
{
  "message": "HR request deleted successfully",
  "data": {
    "id": 1
  }
}
```

## Data Models

### HR Request Object
```json
{
  "id": 1,
  "empId": 1,
  "departmentId": 2,
  "requestType": "Leave Request",
  "subject": "Annual Leave Application",
  "description": "Request description...",
  "priority": "Medium",
  "status": "Pending",
  "assignedTo": 5,
  "responseNotes": "HR response notes...",
  "requestedOn": "2024-12-08T10:00:00.000Z",
  "resolvedOn": null,
  "createdAt": "2024-12-08T10:00:00.000Z",
  "updatedAt": "2024-12-08T10:00:00.000Z"
}
```

### Priority Enum
- `"Low"`
- `"Medium"`
- `"High"`
- `"Critical"`

### Status Enum
- `"Pending"`
- `"In Progress"`
- `"Resolved"`
- `"Rejected"`
- `"On Hold"`

## Authorization Rules

### Employee Access
- Can create HR requests
- Can view their own requests only
- Cannot update or delete requests

### HR Access
- Can view all requests
- Can take actions on any request
- Can update any field in requests
- Can delete requests
- Must be registered in `hr` table
- Must have role `dep_manager` or `unit_head`

### Admin Access
- Can view all requests
- Can create requests
- Cannot take HR actions (status updates, etc.)

## Audit Trail

All HR actions are automatically logged in the `hr_logs` table:

### Log Types
- **HR_REQUEST_CREATE**: When HR creates requests for employees
- **HR_REQUEST_UPDATE**: When HR updates any field (with before/after values)
- **HR_REQUEST_DELETE**: When HR deletes requests

### Log Details
- HR employee ID who performed the action
- Affected employee ID
- Detailed description of changes
- Timestamp of action

## Error Responses

### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "HR request with ID 1 not found. Please check the ID and try again.",
  "error": "Not Found"
}
```

### 403 Forbidden
```json
{
  "statusCode": 403,
  "message": "Employee with ID 1 is not authorized to take HR actions. Only HR personnel can perform this action.",
  "error": "Forbidden"
}
```

### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": "Employee ID is required for updating requests",
  "error": "Bad Request"
}
```

### 500 Internal Server Error
```json
{
  "statusCode": 500,
  "message": "Failed to create HR request: Database connection error",
  "error": "Internal Server Error"
}
```

## Testing Examples

### Create HR Request
```bash
curl -X POST http://localhost:3000/communication/employee/hr-requests \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "empId": 1,
    "departmentId": 2,
    "requestType": "Leave Request",
    "subject": "Annual Leave Application",
    "description": "I would like to request annual leave from December 20-30, 2024.",
    "priority": "Medium"
  }'
```

### Take HR Action
```bash
curl -X POST "http://localhost:3000/communication/employee/hr-requests/1/action?hrEmployeeId=5" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "status": "In Progress",
    "responseNotes": "Request received and under review.",
    "priority": "High"
  }'
```

### Delete HR Request
```bash
curl -X DELETE "http://localhost:3000/communication/employee/hr-requests/1?hrEmployeeId=5" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Notes

1. **HR Employee Validation**: The `hrEmployeeId` must be a valid employee registered in the `hr` table with appropriate role.
2. **Audit Trail**: All HR actions are logged with detailed change tracking.
3. **Field Updates**: HR can update any field in requests, including employee-submitted fields.
4. **Status Management**: When status is set to "Resolved", `resolvedOn` is automatically set.
5. **Department Validation**: All department IDs are validated before updates.
6. **Employee Ownership**: Employees can only view their own requests, not others'.
