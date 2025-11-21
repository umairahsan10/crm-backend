# Departments Management API

This document describes the departments management endpoints available in the HR module.

## Authentication & Authorization

All endpoints require:
- JWT authentication
- HR department access
- `employee_add_permission` permission (for create, update, delete operations)

## Endpoints

### 1. Create Department
**POST** `/hr/departments`

Creates a new department with optional manager assignment.

**Request Body:**
```json
{
  "name": "Engineering",
  "description": "Software Engineering Department",
  "managerId": 2
}
```

**Response:**
```json
{
  "id": 1,
  "name": "Engineering",
  "description": "Software Engineering Department",
  "managerId": 2,
  "createdAt": "2025-01-01T00:00:00.000Z",
  "updatedAt": "2025-01-01T00:00:00.000Z",
  "manager": {
    "id": 2,
    "firstName": "Jane",
    "lastName": "Smith",
    "email": "jane.smith@company.com"
  },
  "employees": []
}
```

### 2. Get All Departments
**GET** `/hr/departments`

Retrieves departments with optional filters and pagination.

**Query Parameters:**
- `managerId` (optional): Filter by manager ID
- `search` (optional): Search by name or description
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

**Example Request:**
```
GET /hr/departments?managerId=2&search=engineering&page=1&limit=10
```

**Response:**
```json
{
  "departments": [
    {
      "id": 1,
      "name": "Engineering",
      "description": "Software Engineering Department",
      "managerId": 2,
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z",
      "manager": {
        "id": 2,
        "firstName": "Jane",
        "lastName": "Smith",
        "email": "jane.smith@company.com"
      },
      "employees": [
        {
          "id": 3,
          "firstName": "John",
          "lastName": "Doe",
          "email": "john.doe@company.com"
        }
      ]
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10,
  "totalPages": 1
}
```

### 3. Get Department by ID
**GET** `/hr/departments/:id`

Retrieves detailed information about a specific department.

**Example Request:**
```
GET /hr/departments/1
```

**Response:**
```json
{
  "id": 1,
  "name": "Engineering",
  "description": "Software Engineering Department",
  "managerId": 2,
  "createdAt": "2025-01-01T00:00:00.000Z",
  "updatedAt": "2025-01-01T00:00:00.000Z",
  "manager": {
    "id": 2,
    "firstName": "Jane",
    "lastName": "Smith",
    "email": "jane.smith@company.com"
  },
  "employees": [
    {
      "id": 3,
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@company.com"
    }
  ]
}
```

### 4. Update Department
**PUT** `/hr/departments/:id`

Updates department information. Only provided fields are updated.

**Request Body:**
```json
{
  "name": "Software Engineering",
  "description": "Updated description",
  "managerId": 5
}
```

**Response:**
```json
{
  "id": 1,
  "name": "Software Engineering",
  "description": "Updated description",
  "managerId": 5,
  "createdAt": "2025-01-01T00:00:00.000Z",
  "updatedAt": "2025-01-01T12:00:00.000Z",
  "manager": {
    "id": 5,
    "firstName": "Bob",
    "lastName": "Johnson",
    "email": "bob.johnson@company.com"
  },
  "employees": []
}
```

### 5. Delete Department
**DELETE** `/hr/departments/:id`

Deletes a department. Only allowed if the department has no employees.

**Example Request:**
```
DELETE /hr/departments/1
```

**Response:**
```json
{
  "message": "Department deleted successfully"
}
```

## Error Responses

### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": "Department with name \"Engineering\" already exists",
  "error": "Bad Request"
}
```

### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "Department with ID 999 not found",
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
- Department name uniqueness
- Manager existence (if provided)
- Manager not already managing another department
- Department has no employees before deletion

## Business Rules

### Manager Assignment
- A manager can only manage one department at a time
- Manager assignment is optional
- Manager must be an existing employee

### Department Deletion
- Departments with employees cannot be deleted
- Employees must be reassigned to other departments first

### Name Uniqueness
- Department names must be unique across the system
- Case-sensitive validation
