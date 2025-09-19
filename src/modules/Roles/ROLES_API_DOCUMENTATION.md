# Roles Management API

This document describes the roles management endpoints available in the HR module.

## Authentication & Authorization

All endpoints require:
- JWT authentication
- HR department access
- `employee_add_permission` permission (for create, update, delete operations)

## Endpoints

### 1. Create Role
**POST** `/hr/roles`

Creates a new role with a predefined name from the enum.

**Request Body:**
```json
{
  "name": "senior",
  "description": "Senior Developer Role"
}
```

**Available Role Names:**
- `dep_manager` - Department Manager
- `team_lead` - Team Lead
- `senior` - Senior Developer
- `junior` - Junior Developer
- `unit_head` - Unit Head

**Response:**
```json
{
  "id": 1,
  "name": "senior",
  "description": "Senior Developer Role",
  "createdAt": "2025-01-01T00:00:00.000Z",
  "updatedAt": "2025-01-01T00:00:00.000Z",
  "employees": []
}
```

### 2. Get All Roles
**GET** `/hr/roles`

Retrieves roles with optional filters and pagination.

**Query Parameters:**
- `search` (optional): Search by name or description
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

**Example Request:**
```
GET /hr/roles?search=senior&page=1&limit=10
```

**Response:**
```json
{
  "roles": [
    {
      "id": 1,
      "name": "senior",
      "description": "Senior Developer Role",
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z",
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

### 3. Get Role by ID
**GET** `/hr/roles/:id`

Retrieves detailed information about a specific role.

**Example Request:**
```
GET /hr/roles/1
```

**Response:**
```json
{
  "id": 1,
  "name": "senior",
  "description": "Senior Developer Role",
  "createdAt": "2025-01-01T00:00:00.000Z",
  "updatedAt": "2025-01-01T00:00:00.000Z",
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

### 4. Update Role
**PUT** `/hr/roles/:id`

Updates role information. Only provided fields are updated.

**Request Body:**
```json
{
  "name": "senior",
  "description": "Updated Senior Developer Role"
}
```

**Response:**
```json
{
  "id": 1,
  "name": "senior",
  "description": "Updated Senior Developer Role",
  "createdAt": "2025-01-01T00:00:00.000Z",
  "updatedAt": "2025-01-01T12:00:00.000Z",
  "employees": []
}
```

### 5. Delete Role
**DELETE** `/hr/roles/:id`

Deletes a role. Only allowed if the role has no employees assigned.

**Example Request:**
```
DELETE /hr/roles/1
```

**Response:**
```json
{
  "message": "Role deleted successfully"
}
```

## Error Responses

### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": "Role with name \"senior\" already exists",
  "error": "Bad Request"
}
```

### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "Role with ID 999 not found",
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
- Role name uniqueness
- Role name must be from predefined enum values
- Role has no employees before deletion

## Business Rules

### Role Names
- Role names are predefined in the database enum
- Available values: `dep_manager`, `team_lead`, `senior`, `junior`, `unit_head`
- Role names must be unique across the system

### Role Deletion
- Roles with assigned employees cannot be deleted
- Employees must be reassigned to other roles first

### Enum Validation
- Only predefined role names are allowed
- Case-sensitive validation against enum values

## Role Hierarchy

The system supports the following role hierarchy:
1. **Unit Head** - Highest level, manages multiple teams
2. **Department Manager** - Manages entire departments
3. **Team Lead** - Manages individual teams
4. **Senior** - Senior level individual contributor
5. **Junior** - Junior level individual contributor
