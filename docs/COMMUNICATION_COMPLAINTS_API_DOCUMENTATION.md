# Communication Complaints API Documentation

## Overview
The Communication Complaints module handles complaint management within the organization. Employees can raise complaints against other employees or departments, and HR can manage them with proper tracking.

## Base URL
```
/communication/complaints
```

## Authentication
All endpoints require JWT authentication and department-based authorization.

## Endpoints

### 1. Get All Complaints (HR/Admin Only)
**GET** `/complaints`

**Authorization:** HR, Admin

**Description:** Retrieve all complaints in the system.

**Response:**
```json
[
  {
    "id": 1,
    "raisedBy": 1,
    "againstEmployeeId": 2,
    "departmentId": 3,
    "complaintType": "HR",
    "subject": "Unprofessional Behavior",
    "description": "Employee has been displaying unprofessional behavior...",
    "status": "Open",
    "priority": "Medium",
    "assignedTo": 5,
    "resolutionNotes": null,
    "resolutionDate": null,
    "createdAt": "2024-12-08T10:00:00.000Z",
    "updatedAt": "2024-12-08T10:00:00.000Z",
    "raisedByEmployee": {
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
    "againstEmployee": {
      "id": 2,
      "firstName": "Jane",
      "lastName": "Smith",
      "email": "jane.smith@company.com"
    },
    "department": {
      "id": 3,
      "name": "Marketing"
    },
    "assignedToEmployee": {
      "id": 5,
      "firstName": "HR",
      "lastName": "Manager",
      "email": "hr.manager@company.com"
    }
  }
]
```

### 2. Get Complaint by ID (HR/Admin Only)
**GET** `/complaints/{id}`

**Authorization:** HR, Admin

**Parameters:**
- `id` (path): The complaint ID

**Description:** Retrieve a specific complaint by ID.

**Response:** Same format as Get All Complaints (single object)

### 3. Get Complaints by Priority (HR/Admin Only)
**GET** `/complaints/priority/{priority}`

**Authorization:** HR, Admin

**Parameters:**
- `priority` (path): Priority level (Low, Medium, High, Critical)

**Description:** Retrieve complaints filtered by priority.

**Response:** Array of complaints with specified priority

### 4. Get Complaints by Status (HR/Admin Only)
**GET** `/complaints/status/{status}`

**Authorization:** HR, Admin

**Parameters:**
- `status` (path): Complaint status (Open, In_Progress, Resolved, Dismissed)

**Description:** Retrieve complaints filtered by status.

**Response:** Array of complaints with specified status

### 5. Create Complaint
**POST** `/complaints`

**Authorization:** HR, Admin, Development, Marketing, Sales, Production

**Description:** Create a new complaint.

**Request Body:**
```json
{
  "raisedBy": 1,
  "againstEmployeeId": 2,
  "departmentId": 3,
  "complaintType": "HR",
  "subject": "Unprofessional Behavior",
  "description": "Employee has been displaying unprofessional behavior during team meetings and has been making inappropriate comments.",
  "status": "Open",
  "priority": "Medium",
  "assignedTo": 5
}
```

**Field Descriptions:**
- `raisedBy` (required): Employee ID raising the complaint
- `againstEmployeeId` (optional): Employee ID against whom the complaint is filed
- `departmentId` (optional): Department ID related to the complaint
- `complaintType` (optional): Type of complaint (HR, Managerial, Technical, Facility, Others)
- `subject` (required): Complaint subject/title
- `description` (required): Detailed description of the complaint
- `status` (optional): Initial status (defaults to "Open")
- `priority` (optional): Priority level (defaults to "Low")
- `assignedTo` (optional): Employee ID to assign the complaint to

**Response:**
```json
{
  "message": "Complaint created successfully",
  "data": {
    // Complaint object with full details
  }
}
```

### 6. Update Complaint Action (HR Only)
**PUT** `/complaints/{id}/action?hrEmployeeId={hrEmployeeId}`

**Authorization:** HR

**Parameters:**
- `id` (path): The complaint ID
- `hrEmployeeId` (query): The HR employee ID taking the action

**Description:** Take action on a complaint or update existing action.

**Request Body:**
```json
{
  "status": "In_Progress",
  "resolutionNotes": "Complaint received and under investigation. Will conduct interviews with involved parties.",
  "assignedTo": 5,
  "priority": "High",
  "complaintType": "HR - Updated",
  "subject": "Unprofessional Behavior - Modified",
  "description": "Updated complaint with additional details and evidence.",
  "departmentId": 3,
  "againstEmployeeId": 2
}
```

**Field Descriptions:**
- `status` (optional): New status for the complaint
- `resolutionNotes` (optional): HR's resolution notes and actions taken
- `assignedTo` (optional): HR employee ID to assign
- `priority` (optional): Updated priority level
- `complaintType` (optional): Updated complaint type
- `subject` (optional): Updated subject
- `description` (optional): Updated description
- `departmentId` (optional): Updated department ID
- `againstEmployeeId` (optional): Updated against employee ID

**Response:**
```json
{
  "message": "Complaint action updated successfully",
  "data": {
    // Updated complaint object
  }
}
```

### 7. Delete Complaint (Department Manager HR/Admin Only)
**DELETE** `/complaints/{id}?hrEmployeeId={hrEmployeeId}`

**Authorization:** HR, Admin

**Parameters:**
- `id` (path): The complaint ID
- `hrEmployeeId` (query): The employee ID performing the deletion

**Description:** Delete a complaint from the system. Only department manager HR and admin can perform this action.

**Response:**
```json
{
  "message": "Complaint deleted successfully",
  "data": {
    "id": 1
  }
}
```

## Data Models

### Complaint Object
```json
{
  "id": 1,
  "raisedBy": 1,
  "againstEmployeeId": 2,
  "departmentId": 3,
  "complaintType": "HR",
  "subject": "Unprofessional Behavior",
  "description": "Complaint description...",
  "status": "Open",
  "priority": "Medium",
  "assignedTo": 5,
  "resolutionNotes": "Resolution notes...",
  "resolutionDate": "2024-12-10T10:00:00.000Z",
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
- `"Open"`
- `"In_Progress"`
- `"Resolved"`
- `"Dismissed"`

### Complaint Type (String)
- `"HR"`
- `"Managerial"`
- `"Technical"`
- `"Facility"`
- `"Others"`

## Authorization Rules

### Employee Access
- Can create complaints
- Cannot view complaints (for privacy and security)

### HR Access
- Can view all complaints
- Can create complaints
- Can take actions on any complaint
- Can update any field in complaints
- Must be registered in `hr` table

### Department Manager HR Access
- Can view all complaints
- Can create complaints
- Can take actions on any complaint
- Can update any field in complaints
- Can delete complaints
- Must be registered in `hr` table

### Admin Access
- Can view all complaints
- Can create complaints
- Cannot take HR actions (status updates, etc.)
- Can delete complaints

## Audit Trail

All HR actions are automatically logged in the `hr_logs` table:

### Log Types
- **COMPLAINT_CREATE**: When HR creates a new complaint
- **COMPLAINT_UPDATE**: When HR updates any field (with before/after values)
- **COMPLAINT_DELETE**: When HR/Admin deletes a complaint

### Log Details
- HR employee ID who performed the action
- Affected employee ID (complaint raiser or against employee)
- Detailed description of changes or creation details
- Timestamp of action

### Log Examples
```json
// Complaint Creation Log
{
  "hrId": 1,
  "actionType": "COMPLAINT_CREATE",
  "affectedEmployeeId": 2,
  "description": "Created Complaint #5 (Subject: \"Unprofessional Behavior\", Type: HR, Priority: Medium)"
}

// Complaint Update Log
{
  "hrId": 1,
  "actionType": "COMPLAINT_UPDATE",
  "affectedEmployeeId": 2,
  "description": "Updated Complaint #5: Status: Open → In_Progress, Priority: Medium → High, Resolution Notes: None → Investigation started"
}

// Complaint Delete Log
{
  "hrId": 1,
  "actionType": "COMPLAINT_DELETE",
  "affectedEmployeeId": 2,
  "description": "Deleted Complaint #5 (Subject: \"Unprofessional Behavior\", Employee: John Doe)"
}
```

## Error Responses

### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "Complaint with ID 1 not found. Please check the ID and try again.",
  "error": "Not Found"
}
```

### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": "Employee with ID 1 not found. Please check the employee ID and try again.",
  "error": "Bad Request"
}
```

### 500 Internal Server Error
```json
{
  "statusCode": 500,
  "message": "Failed to create complaint: Database connection error",
  "error": "Internal Server Error"
}
```

## Testing Examples

### Create Complaint
```bash
curl -X POST http://localhost:3000/communication/complaints \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "raisedBy": 1,
    "againstEmployeeId": 2,
    "departmentId": 3,
    "complaintType": "HR",
    "subject": "Unprofessional Behavior",
    "description": "Employee has been displaying unprofessional behavior during team meetings.",
    "priority": "Medium"
  }'
```

### Get All Complaints
```bash
curl -X GET http://localhost:3000/communication/complaints \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Get Complaint by ID
```bash
curl -X GET http://localhost:3000/communication/complaints/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Get Complaints by Priority
```bash
curl -X GET http://localhost:3000/communication/complaints/priority/High \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Get Complaints by Status
```bash
curl -X GET http://localhost:3000/communication/complaints/status/Open \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Update Complaint Action
```bash
curl -X PUT "http://localhost:3000/communication/complaints/1/action?hrEmployeeId=5" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "status": "In_Progress",
    "resolutionNotes": "Complaint received and under investigation.",
    "priority": "High"
  }'
```

### Update Complaint Action (Resolve)
```bash
curl -X PUT "http://localhost:3000/communication/complaints/1/action?hrEmployeeId=5" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "status": "Resolved",
    "resolutionNotes": "Complaint resolved after investigation. Employee has been counseled.",
    "priority": "Medium"
  }'
```

### Delete Complaint
```bash
curl -X DELETE "http://localhost:3000/communication/complaints/1?hrEmployeeId=5" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Notes

1. **Employee Validation**: All employee IDs (raisedBy, againstEmployeeId, assignedTo) are validated before creating complaints.
2. **Department Validation**: Department IDs are validated if provided.
3. **Privacy**: Only HR and Admin can view complaints to maintain confidentiality.
4. **Default Values**: Status defaults to "Open" and priority defaults to "Low" if not specified.
5. **Ordering**: Complaints are returned in descending order by creation date (newest first).
6. **Relations**: All employee and department relations are included in responses for complete context.
