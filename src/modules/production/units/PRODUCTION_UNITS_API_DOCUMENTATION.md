# Production Units API Documentation

This document contains all the APIs for the Production Units module.

---

## 1. Create Production Unit

### Method and Endpoint
- **Method**: `POST`
- **Endpoint**: `/production/units/create`

### API Description and Flow
This API creates a new production unit in the system. The flow includes:
1. Validates all required fields using DTO validation
2. Checks if the employee (headId) exists in the database
3. Verifies that the employee has the `unit_head` role
4. Validates that the unit name is unique (not already exists)
5. Creates the production unit in the database
6. Returns success response

### Request Body
```json
{
  "name": "string (required)",
  "headId": "number (required)"
}
```

**Required Fields:**
- `name`: Unit name (must be unique)
- `headId`: Employee ID who will be the unit head

### Response Format

**Success Response (200):**
```json
{
  "success": true,
  "message": "New Production Unit Created Successfully"
}
```

**Error Responses:**

**Validation Errors (400):**
```json
{
  "statusCode": 400,
  "message": [
    "Unit name is required",
    "Head ID must be a positive number"
  ],
  "error": "Bad Request"
}
```

**Business Logic Errors (400):**
```json
{
  "statusCode": 400,
  "message": "Employee with ID 123 does not exist",
  "error": "Bad Request"
}
```

```json
{
  "statusCode": 400,
  "message": "Employee must have unit_head role to be assigned as unit head",
  "error": "Bad Request"
}
```

**Conflict Errors (409):**
```json
{
  "statusCode": 409,
  "message": "Unit name already exists",
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
  "message": "User does not have the required roles. Required: dep_manager. User role: junior",
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

**DTO Validations (class-validator):**
- `name`: Required string, not empty
- `headId`: Required positive number

**Business Logic Validations:**
- Employee with `headId` must exist in `employees` table
- Employee must have `unit_head` role in `roles` table
- Unit name must be unique across all production units

### Database Operations

**Tables Affected:**
- `production_units` table

**Database Changes:**
- **INSERT** operation on `production_units` table with the following fields:
  - `name` (from request)
  - `head_id` (from request)
  - `created_at` (automatically set by Prisma `@default(now())`)
  - `updated_at` (automatically set by Prisma `@updatedAt`)

**Database Queries:**
1. **SELECT** from `employees` table to check if employee exists and get role
2. **SELECT** from `production_units` table to check name uniqueness
3. **INSERT** into `production_units` table to create new unit

### Access Control
- **Authentication**: JWT token required
- **Roles**: `dep_manager` role required
- **Departments**: `Production` department required
- **Admin Access**: Admins (admin, supermanager) have automatic access

---

## 2. Get All Production Units

### Method and Endpoint
- **Method**: `GET`
- **Endpoint**: `/production/units`

### API Description and Flow
This API retrieves all production units from the system. The flow includes:
1. Fetches all units from the database with head information
2. For each unit, calculates the count of associated teams
3. For each unit, calculates the count of associated employees
4. Orders units alphabetically by name
5. Returns formatted response with unit data, head information, and counts

### Request Body/Parameters
- **Request Body**: None
- **Query Parameters**: None
- **Path Parameters**: None

### Response Format

**Success Response with Units (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Production Unit A",
      "headId": 123,
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z",
      "head": {
        "id": 123,
        "firstName": "John",
        "lastName": "Doe"
      },
      "teamsCount": 3,
      "employeesCount": 8
    }
  ],
  "total": 1,
  "message": "Units retrieved successfully"
}
```

**Success Response - No Units (200):**
```json
{
  "success": true,
  "data": [],
  "total": 0,
  "message": "No units found"
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
  "message": "User does not have the required roles. Required: dep_manager. User role: junior",
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
- Business logic validation handled by access control guards

### Database Operations

**Tables Affected:**
- `production_units` table (read)
- `employees` table (read - for head details)
- `teams` table (read - for count)
- `production` table (read - for count)

**Database Changes:**
- **No changes** - read-only operation

**Database Queries:**
1. **SELECT** from `production_units` table with JOIN to `employees` table for head details
2. **COUNT** from `teams` table for each unit's teams count
3. **COUNT** from `production` table for each unit's employees count
4. **ORDER BY** name ascending for alphabetical sorting

### Access Control
- **Authentication**: JWT token required
- **Roles**: `dep_manager` role required
- **Departments**: `Production` department required
- **Admin Access**: Admins (admin, supermanager) have automatic access

---

## 3. Update Production Unit

### Method and Endpoint
- **Method**: `PATCH`
- **Endpoint**: `/production/units/update/:id`

### API Description and Flow
This API updates a production unit in the system. The flow includes:
1. Validates that the unit exists (returns 404 if not found)
2. Validates only the fields provided in the request (partial update)
3. Checks if the employee (headId) exists and has unit_head role (if headId provided)
4. Validates that the name is unique (excluding current unit)
5. Updates only the provided fields in the database
6. Returns success response

### Request Body/Parameters
- **Path Parameter**: `id` (number) - Unit ID to update
- **Request Body**: Partial data (only fields to update)

```json
{
  "name": "string (optional)",
  "headId": "number (optional)"
}
```

**All fields are optional** - only send the fields you want to update.

**Example Requests:**
```json
// Update only name
{
  "name": "Updated Unit Name"
}

// Update only head
{
  "headId": 456
}

// Update multiple fields
{
  "name": "Updated Unit",
  "headId": 456
}
```

### Response Format

**Success Response (200):**
```json
{
  "success": true,
  "message": "Unit updated successfully"
}
```

**Error Responses:**

**Not Found Error (404):**
```json
{
  "statusCode": 404,
  "message": "Unit with ID 123 does not exist",
  "error": "Not Found"
}
```

**Validation Errors (400):**
```json
{
  "statusCode": 400,
  "message": [
    "Unit name must be a string",
    "Head ID must be a positive number"
  ],
  "error": "Bad Request"
}
```

**Business Logic Errors (400):**
```json
{
  "statusCode": 400,
  "message": "Employee with ID 123 does not exist",
  "error": "Bad Request"
}
```

```json
{
  "statusCode": 400,
  "message": "Employee must have unit_head role to be assigned as unit head",
  "error": "Bad Request"
}
```

**Conflict Errors (409):**
```json
{
  "statusCode": 409,
  "message": "Unit name already exists",
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
  "message": "User does not have the required roles. Required: dep_manager. User role: junior",
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

**DTO Validations (class-validator):**
- All fields are optional
- `name`: String format (if provided)
- `headId`: Positive number (if provided)

**Business Logic Validations:**
- Unit with provided ID must exist
- Employee with `headId` must exist in `employees` table (if headId provided)
- Employee must have `unit_head` role in `roles` table (if headId provided)
- Unit name must be unique across all other production units (if name provided)

### Database Operations

**Tables Affected:**
- `production_units` table (update)
- `employees` table (read - for head validation, if headId provided)

**Database Changes:**
- **UPDATE** operation on `production_units` table with only the provided fields
- `updated_at` automatically updated by Prisma `@updatedAt`

**Database Queries:**
1. **SELECT** from `production_units` table to check if unit exists
2. **SELECT** from `employees` table to check if employee exists and get role (if headId provided)
3. **SELECT** from `production_units` table to check name uniqueness (exclude current unit, if name provided)
4. **UPDATE** `production_units` table with only provided fields

### Access Control
- **Authentication**: JWT token required
- **Roles**: `dep_manager` role required
- **Departments**: `Production` department required
- **Admin Access**: Admins (admin, supermanager) have automatic access

---

## 4. Delete Production Unit

### Method and Endpoint
- **Method**: `DELETE`
- **Endpoint**: `/production/units/delete/:id`

### API Description and Flow
This API deletes a production unit from the system. The flow includes:
1. Validates that the unit exists (returns 404 if not found)
2. Checks for dependencies: teams, employees, and projects associated with the unit
3. If dependencies exist, returns detailed information about what needs to be reassigned
4. If no dependencies, deletes the unit
5. Returns appropriate success or error response

### Request Body/Parameters
- **Path Parameter**: `id` (number) - Unit ID to delete
- **Request Body**: None

### Response Format

**Success Response (200):**
```json
{
  "success": true,
  "message": "Unit deleted successfully"
}
```

**Error Response - Dependencies Exist (200):**
```json
{
  "success": false,
  "message": "Cannot delete unit. Please reassign dependencies first.",
  "dependencies": {
    "teams": {
      "count": 2,
      "details": [
        { "id": 1, "name": "Development Team A" },
        { "id": 2, "name": "QA Team" }
      ]
    },
    "employees": {
      "count": 3,
      "details": [
        { "id": 201, "firstName": "Mike", "lastName": "Johnson" },
        { "id": 202, "firstName": "Sarah", "lastName": "Wilson" }
      ]
    },
    "projects": {
      "count": 1,
      "details": [
        { "id": 101, "description": "E-commerce website development" }
      ]
    }
  }
}
```

**Error Responses:**

**Not Found Error (404):**
```json
{
  "statusCode": 404,
  "message": "Unit with ID 123 does not exist",
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
  "message": "User does not have the required roles. Required: dep_manager. User role: junior",
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
- Unit with provided ID must exist
- No input validation required (no request body)

### Business Logic
- **Dependency Check**: Ensures no active teams, employees, or active projects (in_progress, onhold) are associated with the unit
- **Safe Deletion**: Only deletes unit when no active dependencies exist
- **Completed Projects**: Completed projects do not block deletion but are tracked for reference
- **Detailed Feedback**: Provides specific information about what needs to be reassigned

### Database Operations

**Tables Affected:**
- `production_units` table (delete)
- `teams` table (read - for dependency check)
- `production` table (read - for dependency check)
- `projects` table (read - for dependency check)

**Database Changes:**
- **DELETE** operation on `production_units` table (only if no dependencies)

**Database Queries:**
1. **SELECT** from `production_units` table to check if unit exists
2. **SELECT** from `teams` table to check for associated teams
3. **SELECT** from `production` table to check for associated employees
4. **SELECT** from `projects` table to check for associated projects
5. **DELETE** from `production_units` table (if dependencies don't exist)

### Access Control
- **Authentication**: JWT token required
- **Roles**: `dep_manager` role required
- **Departments**: `Production` department required
- **Admin Access**: Admins (admin, supermanager) have automatic access

---

## 5. Get Single Unit Details

### Method and Endpoint
- **Method**: `GET`
- **Endpoint**: `/production/units/get/:id`

### API Description and Flow
This API retrieves detailed information about a specific production unit. The flow includes:
1. Validates that the unit exists (returns 404 if not found)
2. Fetches unit details with head information from employees table
3. Counts associated teams and employees
4. Returns comprehensive unit information with counts

### Request Body/Parameters
- **Path Parameter**: `id` (number) - Unit ID to retrieve
- **Request Body**: None

### Response Format

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Production Unit A",
    "headId": 123,
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z",
    "head": {
      "id": 123,
      "firstName": "John",
      "lastName": "Doe"
    },
    "teamsCount": 3,
    "employeesCount": 8
  },
  "message": "Unit details retrieved successfully"
}
```

**Error Responses:**

**Not Found Error (404):**
```json
{
  "success": false,
  "message": "Unit with ID 123 does not exist"
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
  "message": "User does not have the required roles. Required: dep_manager. User role: junior",
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
- Unit with provided ID must exist
- No input validation required (no request body)

### Database Operations

**Tables Affected:**
- `production_units` table (read)
- `employees` table (read - for head details)
- `teams` table (read - for count)
- `production` table (read - for count)

**Database Changes:**
- **No changes** - read-only operation

**Database Queries:**
1. **SELECT** from `production_units` table with JOIN to `employees` for head details
2. **COUNT** from `teams` table for teams count
3. **COUNT** from `production` table for employees count

### Access Control
- **Authentication**: JWT token required
- **Roles**: `dep_manager` role required
- **Departments**: `Production` department required
- **Admin Access**: Admins (admin, supermanager) have automatic access

---

## 6. Get Teams in Unit

**Note**: This functionality has been moved to the Production Teams module. Please use the Teams endpoint instead:

- **Endpoint**: `/production/teams/unit/:productionUnitId`
- **Method**: `GET`
- **Documentation**: See Production Teams API Documentation, Section 3

---

## 6. Get Employees in Unit

### Method and Endpoint
- **Method**: `GET`
- **Endpoint**: `/production/units/:id/employees`

### API Description and Flow
This API retrieves all employees associated with a specific production unit. The flow includes:
1. Validates that the unit exists (returns 404 if not found)
2. Performs security check for unit_head access (can only access their own unit)
3. Fetches all employees from production table filtered by productionUnitId
4. Includes employee details, role information, and specialization
5. Orders employees alphabetically by firstName, then lastName
6. Returns formatted response with employee data, role information, and production details

### Request Body/Parameters
- **Path Parameter**: `id` (number) - Unit ID to get employees for
- **Request Body**: None
- **Query Parameters**: None

### Response Format

**Success Response with Employees (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 201,
      "firstName": "Mike",
      "lastName": "Johnson",
      "email": "mike.johnson@company.com",
      "phone": "+1 (555) 123-4567",
      "role": {
        "id": 3,
        "name": "senior"
      },
      "specialization": "Frontend Development",
      "projectsCompleted": 15,
      "startDate": "2023-06-15T00:00:00.000Z"
    },
    {
      "id": 202,
      "firstName": "Sarah",
      "lastName": "Wilson",
      "email": "sarah.wilson@company.com",
      "phone": "+1 (555) 987-6543",
      "role": {
        "id": 4,
        "name": "junior"
      },
      "specialization": "Backend Development",
      "projectsCompleted": 8,
      "startDate": "2023-08-20T00:00:00.000Z"
    }
  ],
  "total": 2,
  "message": "Employees retrieved successfully"
}
```

**Success Response - No Employees (200):**
```json
{
  "success": true,
  "data": [],
  "total": 0,
  "message": "No employees found in this unit"
}
```

**Error Responses:**

**Not Found Error (404):**
```json
{
  "success": false,
  "message": "Unit with ID 123 does not exist"
}
```

**Access Control Error (200):**
```json
{
  "success": false,
  "message": "You can only access your own unit"
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
- Unit with provided ID must exist
- Unit head can only access their own unit (security check)
- No input validation required (no request body)

### Database Operations

**Tables Affected:**
- `production_units` table (read - for unit validation)
- `production` table (read - for employee-unit relationship)
- `employees` table (read - for employee details)
- `roles` table (read - for role information)

**Database Changes:**
- **No changes** - read-only operation

**Database Queries:**
1. **SELECT** from `production_units` table to check if unit exists
2. **SELECT** from `production` table with JOIN to `employees` and `roles` for employee details
3. **ORDER BY** firstName, lastName for alphabetical sorting

### Access Control
- **Authentication**: JWT token required
- **Roles**: `dep_manager` OR `unit_head` role required
- **Departments**: `Production` department required
- **Admin Access**: Admins (admin, supermanager) have automatic access
- **Unit Head Access**: Unit heads can only access employees in their own unit (security check implemented)

---

## 7. Get Projects in Unit

### Method and Endpoint
- **Method**: `GET`
- **Endpoint**: `/production/units/:id/projects`

### API Description and Flow
This API retrieves all projects associated with a specific production unit. The flow includes:
1. Validates that the unit exists (returns 404 if not found)
2. Performs security check for unit_head access (can only access their own unit)
3. Fetches projects through teams in the unit and projects where unit head is assigned
4. Includes team lead, unit head, and client details
5. Orders projects by createdAt (newest first)
6. Returns formatted response with complete project data and related information

### Request Body/Parameters
- **Path Parameter**: `id` (number) - Unit ID to get projects for
- **Request Body**: None
- **Query Parameters**: None

### Response Format

**Success Response with Projects (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 101,
      "crackedLeadId": 201,
      "salesRepId": 301,
      "teamLeadId": 401,
      "unitHeadId": 123,
      "clientId": 501,
      "status": "in_progress",
      "difficultyLevel": "medium",
      "paymentStage": "in_between",
      "description": "E-commerce website development",
      "deadline": "2024-03-15T00:00:00.000Z",
      "liveProgress": 65.50,
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z",
      "teamLead": {
        "id": 401,
        "firstName": "John",
        "lastName": "Doe"
      },
      "unitHead": {
        "id": 123,
        "firstName": "Mike",
        "lastName": "Johnson"
      },
      "client": {
        "id": 501,
        "companyName": "ABC Corp",
        "email": "contact@abccorp.com"
      }
    }
  ],
  "total": 1,
  "message": "Projects retrieved successfully"
}
```

**Success Response - No Projects (200):**
```json
{
  "success": true,
  "data": [],
  "total": 0,
  "message": "No projects found in this unit"
}
```

**Error Responses:**

**Not Found Error (404):**
```json
{
  "success": false,
  "message": "Unit with ID 123 does not exist"
}
```

**Access Control Error (200):**
```json
{
  "success": false,
  "message": "You can only access your own unit"
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
- Unit with provided ID must exist
- Unit head can only access their own unit (security check)
- No input validation required (no request body)

### Database Operations

**Tables Affected:**
- `production_units` table (read - for unit validation)
- `teams` table (read - for team IDs)
- `projects` table (read - for project data)
- `employees` table (read - for team lead and unit head details)
- `clients` table (read - for client details)

**Database Changes:**
- **No changes** - read-only operation

**Database Queries:**
1. **SELECT** from `production_units` table to check if unit exists
2. **SELECT** from `teams` table to get team IDs in the unit
3. **SELECT** from `projects` table with JOIN to `employees` and `clients` for project details
4. **WHERE** clause to filter by team leads or unit head
5. **ORDER BY** createdAt descending for newest first ordering

### Access Control
- **Authentication**: JWT token required
- **Roles**: `dep_manager` OR `unit_head` role required
- **Departments**: `Production` department required
- **Admin Access**: Admins (admin, supermanager) have automatic access
- **Unit Head Access**: Unit heads can only access projects in their own unit (security check implemented)

---

## 8. Get Completed Projects from Deleted Units

### Method and Endpoint
- **Method**: `GET`
- **Endpoint**: `/production/units/deleted/completed-projects`

### API Description and Flow
This API retrieves all completed projects that belonged to units that have been deleted. The flow includes:
1. Fetches all completed projects from projects table where associated teams have no unit assignment
2. Includes team details and team lead information
3. Includes client details for each project
4. Orders projects by createdAt (newest first)
5. Returns formatted response with complete project data and related information

### Request Body/Parameters
- **Path Parameter**: None
- **Request Body**: None
- **Query Parameters**: None

### Response Format

**Success Response with Completed Projects (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 101,
      "crackedLeadId": 201,
      "salesRepId": 301,
      "teamId": 401,
      "clientId": 501,
      "status": "completed",
      "difficultyLevel": "medium",
      "paymentStage": "final",
      "description": "E-commerce website development",
      "deadline": "2024-03-15T00:00:00.000Z",
      "liveProgress": 100.00,
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z",
      "teams": [
        {
          "id": 401,
          "name": "Development Team A",
          "teamLead": {
            "id": 123,
            "firstName": "John",
            "lastName": "Doe"
          }
        }
      ],
      "client": {
        "id": 501,
        "companyName": "ABC Corp",
        "email": "contact@abccorp.com"
      }
    }
  ],
  "total": 1,
  "message": "Completed projects from deleted units retrieved successfully"
}
```

**Success Response - No Completed Projects (200):**
```json
{
  "success": true,
  "data": [],
  "total": 0,
  "message": "No completed projects found from deleted units"
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
- No unit validation required (getting projects from deleted units)

### Database Operations

**Tables Affected:**
- `projects` table (read - for completed project data)
- `teams` table (read - for team details)
- `employees` table (read - for team lead details)
- `clients` table (read - for client details)

**Database Changes:**
- **No changes** - read-only operation

**Database Queries:**
1. **SELECT** from `projects` table with JOIN to `teams`, `employees`, and `clients`
2. **WHERE** status = 'completed' AND teams.productionUnitId = null
3. **ORDER BY** createdAt descending for newest first ordering

### Access Control
- **Authentication**: JWT token required
- **Roles**: `dep_manager` role required
- **Departments**: `Production` department required
- **Admin Access**: Admins (admin, supermanager) have automatic access
- **Unit Head Access**: ❌ **NOT ALLOWED** - Only admin and dep_manager can access

---
## 9. Assign/Unassign Head to Unit (via Update API) Done in Patch API

## 10. Get Available Heads

### Method and Endpoint
- **Method**: `GET`
- **Endpoint**: `/production/units/available-heads` Also has Flag of ?assigned=true|false  
              If no flag used fetches both assigned and unassigned heads of production dept
### API Description and Flow
This API retrieves available heads for Production units with flexible filtering. The flow includes:
1. Fetches employees with `unit_head` role from Production department
2. Filters based on assignment status using query parameter
3. Includes current unit assignment information
4. Orders results alphabetically by firstName, then lastName
5. Returns formatted response with head details and assignment status

### Request Body/Parameters
- **Path Parameter**: None
- **Request Body**: None
- **Query Parameters**: 
  - `assigned` (optional): 
    - `assigned=true` → Show heads assigned to Production units
    - `assigned=false` → Show heads NOT assigned to any Production unit
    - No parameter → Show ALL Production heads (both assigned and unassigned)

### Response Format

**Success Response - Unassigned Heads (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 123,
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@company.com",
      "isAssigned": false,
      "currentUnit": null
    }
  ],
  "total": 1,
  "message": "Available heads retrieved successfully"
}
```

**Success Response - Assigned Heads (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 456,
      "firstName": "Jane",
      "lastName": "Smith",
      "email": "jane.smith@company.com",
      "isAssigned": true,
      "currentUnit": {
        "id": 1,
        "name": "Production Unit A"
      }
    }
  ],
  "total": 1,
  "message": "Available heads retrieved successfully"
}
```

**Success Response - All Heads (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 123,
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@company.com",
      "isAssigned": false,
      "currentUnit": null
    },
    {
      "id": 456,
      "firstName": "Jane",
      "lastName": "Smith",
      "email": "jane.smith@company.com",
      "isAssigned": true,
      "currentUnit": {
        "id": 1,
        "name": "Production Unit A"
      }
    }
  ],
  "total": 2,
  "message": "Available heads retrieved successfully"
}
```

**Success Response - No Heads (200):**
```json
{
  "success": true,
  "data": [],
  "total": 0,
  "message": "No available heads found"
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
- Query parameter validation handled automatically
- Department-specific filtering (Production only)

### Database Operations

**Tables Affected:**
- `employees` table (read - for head details)
- `roles` table (read - for role validation)
- `departments` table (read - for department filtering)
- `production_units` table (read - for unit assignment info)

**Database Changes:**
- **No changes** - read-only operation

**Database Queries:**
1. **SELECT** from `employees` table with JOIN to `roles`, `departments`, and `production_units`
2. **WHERE** role = 'unit_head' AND department = 'Production' AND status = 'active'
3. **FILTER** by assignment status based on query parameter
4. **ORDER BY** firstName, lastName for alphabetical sorting

### Access Control
- **Authentication**: JWT token required
- **Roles**: `dep_manager` role required
- **Departments**: `Production` department required
- **Admin Access**: Admins (admin, supermanager) have automatic access
- **Unit Head Access**: ❌ **NOT ALLOWED** - Only admin and dep_manager can access

---

## Planned APIs

### Team Assignment
- Assign Team to Unit
- Unassign Team from Unit


---

*This documentation will be updated as new APIs are added to the production units module.* 