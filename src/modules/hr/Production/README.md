# Production Management Module

This module handles production department functionality for HR management.

## Structure
- `controllers/` - Production management controllers
- `services/` - Production management business logic
- `dto/` - Data transfer objects for production operations
- `production.module.ts` - Module configuration

## API Endpoints

### POST /hr/production
Create a new production record for an employee.

**Request Body:**
```json
{
  "employeeId": 123,
  "specialization": "Web Development",
  "productionUnitId": 1,
  "projectsCompleted": 5
}
```

**Response:**
```json
{
  "id": 1,
  "employeeId": 123,
  "specialization": "Web Development",
  "productionUnitId": 1,
  "projectsCompleted": 5,
  "createdAt": "2025-01-15T10:30:00Z",
  "updatedAt": "2025-01-15T10:30:00Z",
  "employee": {
    "id": 123,
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com"
  },
  "productionUnit": {
    "id": 1,
    "name": "Web Development Unit"
  }
}
```

### GET /hr/production
Get all production records or filter by employee ID.

**Query Parameters:**
- `employeeId` (optional): Filter by specific employee ID

**Response:**
```json
{
  "productions": [...],
  "total": 10
}
```

### GET /hr/production/:id
Get a specific production record by ID.

**Response:**
```json
{
  "id": 1,
  "employeeId": 123,
  "specialization": "Web Development",
  "productionUnitId": 1,
  "projectsCompleted": 5,
  "createdAt": "2025-01-15T10:30:00Z",
  "updatedAt": "2025-01-15T10:30:00Z",
  "employee": {...},
  "productionUnit": {...}
}
```

### PUT /hr/production/:id
Update a production record. Allows updating any column of the production table.

**Request Body:**
```json
{
  "specialization": "Mobile Development",
  "projectsCompleted": 8
}
```

**Response:**
```json
{
  "id": 1,
  "employeeId": 123,
  "specialization": "Mobile Development",
  "productionUnitId": 1,
  "projectsCompleted": 8,
  "createdAt": "2025-01-15T10:30:00Z",
  "updatedAt": "2025-01-15T10:35:00Z",
  "employee": {...},
  "productionUnit": {...}
}
```

### DELETE /hr/production/:id
Delete a production record and handle related cleanup.

**Response:**
```json
{
  "message": "Employee John Doe removed from production department successfully"
}
```

## Features

- **Employee Validation**: Checks if the employee exists in the employee table before creating production records
- **Duplicate Prevention**: Prevents creating multiple production records for the same employee
- **Production Unit Validation**: Validates production unit references
- **Flexible Updates**: Allows updating any column of the production table
- **Comprehensive Responses**: Returns related employee and production unit data
- **Safe Deletion**: Removes employee from production and handles related cleanup (production unit heads, team leads)

## Required Permissions

All endpoints require:
- `employee_add_permission`
- HR department access
- JWT authentication 