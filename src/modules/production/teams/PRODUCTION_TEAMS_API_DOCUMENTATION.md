# Production Teams API Documentation

This document contains all the APIs for the Production Teams module.

---

## 1. Assign Team to Production Unit

### Method and Endpoint
- **Method**: `POST`
- **Endpoint**: `/production/teams/assign`

### API Description and Flow
This API assigns a team to a production unit. The flow includes:
1. Validates that the team exists
2. Validates that the production unit exists
3. Checks if team is already assigned to this unit
4. Checks if team is assigned to another production unit
5. Validates that team has a team lead assigned
6. Validates that team lead belongs to Production department
7. Assigns team to the production unit
8. Returns success response with assignment details

### Request Body
```json
{
  "teamId": "number (required)",
  "productionUnitId": "number (required)"
}
```

**Required Fields:**
- `teamId`: ID of the team to assign
- `productionUnitId`: ID of the production unit to assign the team to

### Response Format

**Success Response (200):**
```json
{
  "success": true,
  "message": "Team \"Development Team A\" successfully assigned to production unit \"Production Unit A\"",
  "data": {
    "teamId": 1,
    "teamName": "Development Team A",
    "teamLead": {
      "id": 123,
      "firstName": "John",
      "lastName": "Doe"
    },
    "productionUnit": {
      "id": 1,
      "name": "Production Unit A"
    }
  }
}
```

**Error Responses:**

**Not Found Errors (404):**
```json
{
  "statusCode": 404,
  "message": "Team with ID 123 does not exist",
  "error": "Not Found"
}
```

```json
{
  "statusCode": 404,
  "message": "Production unit with ID 456 does not exist",
  "error": "Not Found"
}
```

**Conflict Errors (409):**
```json
{
  "statusCode": 409,
  "message": "Team is already assigned to this production unit",
  "error": "Conflict"
}
```

```json
{
  "statusCode": 409,
  "message": "Team is already assigned to production unit ID 2. Please unassign first.",
  "error": "Conflict"
}
```

**Bad Request Errors (400):**
```json
{
  "statusCode": 400,
  "message": "Team must have a team lead assigned before it can be assigned to a production unit",
  "error": "Bad Request"
}
```

```json
{
  "statusCode": 400,
  "message": "Team lead must belong to Production department. Current department: Sales",
  "error": "Bad Request"
}
```

**Authentication/Authorization Errors (401/403):**
```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

```json
{
  "statusCode": 403,
  "message": "User does not have the required roles. Required: dep_manager. User role: unit_head",
  "error": "Forbidden"
}
```

```json
{
  "statusCode": 403,
  "message": "User does not belong to required departments. Required: Production. User department: HR",
  "error": "Forbidden"
}
```

### Validations

**Business Logic Validations:**
- Team with `teamId` must exist
- Production unit with `productionUnitId` must exist
- Team must not already be assigned to this unit
- Team must not be assigned to another production unit
- Team must have a team lead assigned
- Team lead must belong to Production department

### Database Operations

**Tables Affected:**
- `teams` table (update)
- `employees` table (read - for team lead validation)
- `departments` table (read - for department validation)
- `production_units` table (read - for unit validation)

**Database Changes:**
- **UPDATE** operation on `teams` table to set `productionUnitId`

**Database Queries:**
1. **SELECT** from `teams` table to check if team exists
2. **SELECT** from `production_units` table to check if unit exists
3. **SELECT** from `employees` table with JOIN to `departments` for team lead validation
4. **UPDATE** `teams` table to assign team to unit

### Access Control
- **Authentication**: JWT token required
- **Roles**: `dep_manager` role required
- **Departments**: `Production` department required
- **Admin Access**: Admins (admin, supermanager) have automatic access

---

## 2. Unassign Team from Production Unit

### Method and Endpoint
- **Method**: `DELETE`
- **Endpoint**: `/production/teams/unassign/:teamId`

### API Description and Flow
This API unassigns a team from its current production unit. The flow includes:
1. Validates that the team exists
2. Checks if team is assigned to any production unit
3. Checks if team has active projects (blocks unassignment if active projects exist)
4. Unassigns team from the production unit
5. Returns success response with unassignment details

### Request Body/Parameters
- **Path Parameter**: `teamId` (number) - Team ID to unassign
- **Request Body**: None

### Response Format

**Success Response (200):**
```json
{
  "success": true,
  "message": "Team \"Development Team A\" successfully unassigned from production unit \"Production Unit A\"",
  "data": {
    "teamId": 1,
    "teamName": "Development Team A",
    "teamLead": {
      "id": 123,
      "firstName": "John",
      "lastName": "Doe"
    },
    "previousUnit": {
      "id": 1,
      "name": "Production Unit A"
    }
  }
}
```

**Error Responses:**

**Not Found Error (404):**
```json
{
  "statusCode": 404,
  "message": "Team with ID 123 does not exist",
  "error": "Not Found"
}
```

**Bad Request Error (400):**
```json
{
  "statusCode": 400,
  "message": "Team is not assigned to any production unit",
  "error": "Bad Request"
}
```

**Conflict Error (409):**
```json
{
  "statusCode": 409,
  "message": "Cannot unassign team. 3 active project(s) are assigned to this team. Please reassign or complete these projects first. Affected projects: ID 101, ID 102, ID 103",
  "error": "Conflict"
}
```

**Authentication/Authorization Errors (401/403):**
```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

```json
{
  "statusCode": 403,
  "message": "User does not have the required roles. Required: dep_manager. User role: unit_head",
  "error": "Forbidden"
}
```

```json
{
  "statusCode": 403,
  "message": "User does not belong to required departments. Required: Production. User department: HR",
  "error": "Forbidden"
}
```

### Validations

**Business Logic Validations:**
- Team with provided ID must exist
- Team must be assigned to a production unit
- Team must not have active projects (in_progress, onhold)

### Database Operations

**Tables Affected:**
- `teams` table (update)
- `projects` table (read - for active project check)

**Database Changes:**
- **UPDATE** operation on `teams` table to set `productionUnitId = null`

**Database Queries:**
1. **SELECT** from `teams` table to check if team exists and get current assignment
2. **SELECT** from `projects` table to check for active projects
3. **UPDATE** `teams` table to unassign team from unit

### Access Control
- **Authentication**: JWT token required
- **Roles**: `dep_manager` role required
- **Departments**: `Production` department required
- **Admin Access**: Admins (admin, supermanager) have automatic access

---

## 3. Get Teams in Production Unit

### Method and Endpoint
- **Method**: `GET`
- **Endpoint**: `/production/teams/unit/:productionUnitId`

### API Description and Flow
This API retrieves all teams assigned to a specific production unit. The flow includes:
1. Validates that the production unit exists
2. Fetches all teams assigned to the unit
3. Includes team lead details and current project information
4. Orders teams alphabetically by name
5. Returns formatted response with team data

### Request Body/Parameters
- **Path Parameter**: `productionUnitId` (number) - Production Unit ID to get teams for
- **Request Body**: None

### Response Format

**Success Response with Teams (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Development Team A",
      "teamLeadId": 123,
      "currentProjectId": 101,
      "employeeCount": 8,
      "productionUnitId": 1,
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z",
      "teamLead": {
        "id": 123,
        "firstName": "John",
        "lastName": "Doe"
      },
      "currentProject": {
        "id": 101,
        "description": "E-commerce website development",
        "status": "in_progress",
        "liveProgress": 65.50,
        "deadline": "2024-03-15T00:00:00.000Z"
      }
    }
  ],
  "total": 1,
  "message": "Teams in production unit \"Production Unit A\" retrieved successfully"
}
```

**Success Response - No Teams (200):**
```json
{
  "success": true,
  "data": [],
  "total": 0,
  "message": "No teams found in production unit \"Production Unit A\""
}
```

**Error Responses:**

**Not Found Error (404):**
```json
{
  "statusCode": 404,
  "message": "Production unit with ID 123 does not exist",
  "error": "Not Found"
}
```

**Authentication/Authorization Errors (401/403):**
```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

```json
{
  "statusCode": 403,
  "message": "User does not have the required roles. Required: dep_manager, unit_head. User role: junior",
  "error": "Forbidden"
}
```

```json
{
  "statusCode": 403,
  "message": "User does not belong to required departments. Required: Production. User department: HR",
  "error": "Forbidden"
}
```

### Validations
- Production unit with provided ID must exist
- No input validation required (no request body)

### Database Operations

**Tables Affected:**
- `production_units` table (read - for unit validation)
- `teams` table (read - for team data)
- `employees` table (read - for team lead details)
- `projects` table (read - for current project details)

**Database Changes:**
- **No changes** - read-only operation

**Database Queries:**
1. **SELECT** from `production_units` table to check if unit exists
2. **SELECT** from `teams` table with JOIN to `employees` and `projects` for team details
3. **ORDER BY** team name ascending for alphabetical sorting

### Access Control
- **Authentication**: JWT token required
- **Roles**: `dep_manager` OR `unit_head` role required
- **Departments**: `Production` department required
- **Admin Access**: Admins (admin, supermanager) have automatic access

---

## 4. Get Available Teams

### Method and Endpoint
- **Method**: `GET`
- **Endpoint**: `/production/teams/available`

### API Description and Flow
This API retrieves all teams that are available for assignment to production units. The flow includes:
1. Fetches all teams not assigned to any production unit
2. Filters teams that have a team lead assigned
3. Filters teams where team lead belongs to Production department
4. Orders teams alphabetically by name
5. Returns formatted response with available team data

### Request Body/Parameters
- **Path Parameter**: None
- **Request Body**: None

### Response Format

**Success Response with Available Teams (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 2,
      "name": "QA Team",
      "teamLeadId": 456,
      "currentProjectId": null,
      "employeeCount": 5,
      "productionUnitId": null,
      "createdAt": "2024-01-20T14:30:00Z",
      "updatedAt": "2024-01-20T14:30:00Z",
      "teamLead": {
        "id": 456,
        "firstName": "Jane",
        "lastName": "Smith",
        "department": {
          "name": "Production"
        }
      }
    }
  ],
  "total": 1,
  "message": "Available production teams retrieved successfully"
}
```

**Success Response - No Available Teams (200):**
```json
{
  "success": true,
  "data": [],
  "total": 0,
  "message": "No available production teams found"
}
```

**Error Responses:**

**Authentication/Authorization Errors (401/403):**
```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

```json
{
  "statusCode": 403,
  "message": "User does not have the required roles. Required: dep_manager. User role: unit_head",
  "error": "Forbidden"
}
```

```json
{
  "statusCode": 403,
  "message": "User does not belong to required departments. Required: Production. User department: HR",
  "error": "Forbidden"
}
```

### Validations
- No input validation required (no request body)
- Business logic filters teams automatically

### Database Operations

**Tables Affected:**
- `teams` table (read - for team data)
- `employees` table (read - for team lead details)
- `departments` table (read - for department filtering)

**Database Changes:**
- **No changes** - read-only operation

**Database Queries:**
1. **SELECT** from `teams` table with JOIN to `employees` and `departments`
2. **WHERE** productionUnitId = null AND teamLeadId IS NOT NULL
3. **FILTER** by team lead department = 'Production'
4. **ORDER BY** team name ascending for alphabetical sorting

### Access Control
- **Authentication**: JWT token required
- **Roles**: `dep_manager` role required
- **Departments**: `Production` department required
- **Admin Access**: Admins (admin, supermanager) have automatic access

---

## Business Rules

### Team Assignment Rules:
1. **One Unit Per Team**: A team can only be assigned to one production unit at a time
2. **Team Lead Required**: Team must have a team lead assigned before unit assignment
3. **Production Department**: Team lead must belong to Production department
4. **Active Projects**: Team cannot be unassigned if it has active projects
5. **No Duplicate Assignment**: Team cannot be assigned to the same unit twice

### Validation Hierarchy:
1. **Existence Check**: Team and unit must exist
2. **Assignment Status**: Check current assignment status
3. **Team Lead Validation**: Verify team lead exists and belongs to Production
4. **Project Status**: Check for active projects before unassignment
5. **Business Logic**: Apply department and role restrictions

---

## Planned APIs

### Team Management
- Create Team
- Update Team Details
- Delete Team
- Assign Team Lead to Team

### Employee Management
- Add Employee to Team
- Remove Employee from Team
- Get Team Members

---

*This documentation will be updated as new APIs are added to the production teams module.* 