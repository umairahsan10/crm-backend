# Production Units API Documentation

This document contains all the APIs for the Production Units module with comprehensive filtering, team management, and role-based access control.

---

## 🔐 Authentication & Authorization
- **Authentication**: JWT Bearer Token required
- **Guards**: `JwtAuthGuard`, `RolesWithServiceGuard`, `DepartmentsGuard`
- **Department**: Production department access required

---

## 📋 API Endpoints Overview

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| `POST` | `/production/units` | Create production unit | `dep_manager` |
| `GET` | `/production/units` | Get all units with filters | `dep_manager`, `unit_head`, `team_lead`, `senior`, `junior` |
| `GET` | `/production/units/:id` | Get unit by ID with full details | `dep_manager`, `unit_head`, `team_lead`, `senior`, `junior` |
| `PATCH` | `/production/units/:id` | Update production unit | `dep_manager`, `unit_head` |
| `DELETE` | `/production/units/:id` | Delete production unit | `dep_manager` |
| `GET` | `/production/units/available-heads` | Get available unit heads | `dep_manager` |
| `GET` | `/production/units/available-teams` | Get available teams to assign | `dep_manager`, `unit_head` |
| `POST` | `/production/units/:id/teams` | Add team to unit | `dep_manager`, `unit_head` |
| `DELETE` | `/production/units/:id/teams/:teamId` | Remove team from unit | `dep_manager`, `unit_head` |

---

## 1. Create Production Unit

### Method and Endpoint
- **Method**: `POST`
- **Endpoint**: `/production/units`

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
  "headId": "number (optional)"
}
```

**Required Fields:**
- `name`: Unit name (must be unique)
- `headId`: Employee ID who will be the unit head (optional)

### Response Format

**Success Response (201):**
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

```json
{
  "statusCode": 409,
  "message": "Employee John Doe (ID: 123) is already the head of production unit \"Unit B\" (ID: 2). Each employee can only be the head of one production unit at a time. Please remove this employee from their current unit first or choose a different employee.",
  "error": "Conflict"
}
```

### Validations
- `name`: Required string, not empty
- `headId`: Optional positive number
- Employee with `headId` must exist and have `unit_head` role
- **Employee cannot be head of multiple units** (one head per unit rule)
- Unit name must be unique across all production units

### Access Control
- **Authentication**: JWT token required
- **Roles**: `dep_manager` role required
- **Departments**: `Production` department required

---

## 2. Get All Production Units

### Method and Endpoint
- **Method**: `GET`
- **Endpoint**: `/production/units`

### API Description and Flow
This API retrieves all production units with comprehensive filtering and role-based access. The flow includes:
1. Applies role-based filtering (users see only units they have access to)
2. Applies all query filters (email, name, min/max teams/projects)
3. Fetches units with head information and counts
4. Returns paginated results with comprehensive data

### Query Parameters

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `unitId` | number | Get specific unit by ID | `?unitId=1` |
| `include` | string | Include related data (comma-separated: employees,projects,teams,head) | `?include=employees,projects` |
| `hasHead` | boolean | Filter units that have heads assigned | `?hasHead=true` |
| `hasTeams` | boolean | Filter units that have teams assigned | `?hasTeams=true` |
| `hasProjects` | boolean | Filter units that have projects | `?hasProjects=true` |
| `page` | number | Page number for pagination | `?page=1` |
| `limit` | number | Number of items per page | `?limit=10` |
| `sortBy` | string | Sort by field (name, createdAt, updatedAt) | `?sortBy=name` |
| `sortOrder` | string | Sort order (asc, desc) | `?sortOrder=asc` |
| `headEmail` | string | Filter by unit head email | `?headEmail=john@company.com` |
| `headName` | string | Filter by unit head name (firstName or lastName) | `?headName=John` |
| `unitName` | string | Filter by unit name (partial match) | `?unitName=Marketing` |
| `minTeams` | number | Minimum number of teams | `?minTeams=2` |
| `maxTeams` | number | Maximum number of teams | `?maxTeams=5` |
| `minProjects` | number | Minimum number of projects | `?minProjects=1` |
| `maxProjects` | number | Maximum number of projects | `?maxProjects=10` |

### Response Format

**Success Response (200):**
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
      "employeesCount": 8,
      "projectsCount": 5
    }
  ],
  "total": 1,
  "pagination": {
    "page": 1,
    "limit": 10,
    "totalPages": 1
  },
  "message": "Units retrieved successfully"
}
```

### Role-Based Access Control
- **`dep_manager`**: Can see all units
- **`unit_head`**: Can only see their own unit
- **`team_lead`**: Can see units where they lead teams
- **`senior`/`junior`**: Can see units where they are production employees

### Access Control
- **Authentication**: JWT token required
- **Roles**: `dep_manager`, `unit_head`, `team_lead`, `senior`, `junior`
- **Departments**: `Production` department required

---

## 3. Get Unit by ID

### Method and Endpoint
- **Method**: `GET`
- **Endpoint**: `/production/units/:id`

### API Description and Flow
This API retrieves detailed information about a specific production unit with role-based filtering and unit membership validation:
- **`dep_manager`**: Can access any unit (no membership check required)
- **`unit_head`**: Can only access units they head
- **`team_lead`**: Can only access units where they lead teams
- **`senior`** and **`junior`**: Can only access units where they are production employees

**Security Check**: All users (except `dep_manager`) must be members of the requested unit to access its details.

### Path Parameters
- `id` (number): Unit ID to retrieve

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
      "lastName": "Doe",
      "email": "john.doe@company.com",
      "phone": "+1 (555) 123-4567",
      "role": {
        "id": 1,
        "name": "unit_head"
      }
    },
    "teams": [
      {
        "id": 1,
        "name": "Development Team A",
        "employeeCount": 5,
        "teamLeadId": 456,
        "teamLead": {
          "id": 456,
          "firstName": "Jane",
          "lastName": "Smith",
          "email": "jane.smith@company.com",
          "role": {
            "id": 2,
            "name": "team_lead"
          }
        }
      }
    ],
    "teamsCount": 1,
    "employeesCount": 5,
    "projectsCount": 2,
    "allProjects": [
      {
        "id": 101,
        "description": "E-commerce website",
        "status": "in_progress",
        "difficultyLevel": "medium",
        "paymentStage": "in_between",
        "deadline": "2024-03-15T00:00:00.000Z",
        "liveProgress": "65.50",
        "teamId": 1,
        "client": {
          "id": 501,
          "companyName": "ABC Corp",
          "clientName": "John Client",
          "email": "contact@abccorp.com",
          "phone": "+1 (555) 987-6543"
        },
        "team": {
          "id": 1,
          "name": "Development Team A",
          "teamLead": {
            "id": 456,
            "firstName": "Jane",
            "lastName": "Smith"
          }
        },
        "salesRep": {
          "id": 789,
          "firstName": "Mike",
          "lastName": "Johnson",
          "email": "mike.johnson@company.com"
        }
      }
    ],
    "productionEmployees": [
      {
        "id": 1,
        "employeeId": 201,
        "specialization": "Frontend Development",
        "projectsCompleted": 15,
        "employee": {
          "id": 201,
          "firstName": "Alice",
          "lastName": "Brown",
          "email": "alice.brown@company.com",
          "phone": "+1 (555) 111-2222",
          "role": {
            "id": 3,
            "name": "senior"
          }
        }
      }
    ]
  },
  "message": "Unit details retrieved successfully"
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

**Forbidden Error (403) - Unit Membership:**
```json
{
  "statusCode": 403,
  "message": "You do not have access to this unit. You must be a member of this unit to view its details.",
  "error": "Forbidden"
}
```

### Access Control
- **Authentication**: JWT token required
- **Roles**: `dep_manager`, `unit_head`, `team_lead`, `senior`, `junior`
- **Departments**: `Production` department required

---

## 4. Update Production Unit

### Method and Endpoint
- **Method**: `PATCH`
- **Endpoint**: `/production/units/:id`

### API Description and Flow
This API updates a production unit. The headId is required and cannot be null.

### Path Parameters
- `id` (number): Unit ID to update

### Request Body
```json
{
  "name": "string (optional)",
  "headId": "number (required)"
}
```

**Required Fields:**
- `headId`: Employee ID of the unit head (required)

### Response Format

**Success Response (200):**
```json
{
  "success": true,
  "message": "Unit updated successfully"
}
```

**Error Responses:**

**Validation Errors (400):**
```json
{
  "statusCode": 400,
  "message": "Head ID must be a positive number",
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

**Conflict Errors (409):**
```json
{
  "statusCode": 409,
  "message": "Employee John Doe (ID: 123) is already the head of production unit \"Unit B\" (ID: 2). Each employee can only be the head of one production unit at a time. Please remove this employee from their current unit first or choose a different employee.",
  "error": "Conflict"
}
```

### Validations
- `headId`: Required positive number
- Employee with `headId` must exist and have `unit_head` role
- **Employee cannot be head of multiple units** (one head per unit rule)
- Unit name must be unique (if provided)

### Access Control
- **Authentication**: JWT token required
- **Roles**: `dep_manager`, `unit_head`
- **Departments**: `Production` department required
- **Unit Head Access**: Unit heads can only update their own unit

---

## 5. Delete Production Unit

### Method and Endpoint
- **Method**: `DELETE`
- **Endpoint**: `/production/units/:id`

### API Description and Flow
This API deletes a production unit. **Unit can only be deleted if it has NO teams.** If the unit has any teams, deletion will be blocked.

### Path Parameters
- `id` (number): Unit ID to delete

### Response Format

**Success Response (200):**
```json
{
  "success": true,
  "message": "Unit deleted successfully"
}
```

**Error Response - Unit Has Teams (200):**
```json
{
  "success": false,
  "message": "Cannot delete unit \"Production Unit A\". Unit has 2 team(s) and 5 project(s). Please remove all teams first.",
  "unitInfo": {
    "id": 1,
    "name": "Production Unit A",
    "headId": 123
  },
  "dependencies": {
    "teams": {
      "count": 2,
      "details": [
        {
          "id": 1,
          "name": "Development Team A",
          "employeeCount": 5,
          "teamLead": {
            "id": 456,
            "name": "Jane Smith",
            "email": "jane.smith@company.com"
          },
          "projectsCount": 3,
          "projects": [
            {
              "id": 101,
              "description": "E-commerce website",
              "status": "in_progress",
              "deadline": "2024-03-15T00:00:00.000Z"
            },
            {
              "id": 102,
              "description": "Mobile app",
              "status": "completed",
              "deadline": "2024-02-28T00:00:00.000Z"
            }
          ]
        },
        {
          "id": 2,
          "name": "QA Team",
          "employeeCount": 3,
          "teamLead": {
            "id": 789,
            "name": "Bob Wilson",
            "email": "bob.wilson@company.com"
          },
          "projectsCount": 2,
          "projects": [
            {
              "id": 103,
              "description": "Testing framework",
              "status": "in_progress",
              "deadline": "2024-04-01T00:00:00.000Z"
            }
          ]
        }
      ]
    },
    "summary": {
      "totalTeams": 2,
      "totalProjects": 5,
      "teamsWithProjects": 2,
      "teamsWithoutProjects": 0
    }
  },
  "instructions": [
    "To delete this unit, you must first:",
    "1. Remove all teams from this unit using DELETE /production/units/:id/teams/:teamId",
    "2. Or reassign teams to other units",
    "3. Once all teams are removed, the unit can be deleted"
  ]
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

### Business Logic
- **Unit can only be deleted if it has NO teams**
- Teams must be removed before unit can be deleted
- Projects and employees are not blocking factors (only teams matter)
- Clear error message shows which teams need to be removed

### Access Control
- **Authentication**: JWT token required
- **Roles**: `dep_manager` role required
- **Departments**: `Production` department required

---

## 6. Get Available Heads

### Method and Endpoint
- **Method**: `GET`
- **Endpoint**: `/production/units/available-heads`

### API Description and Flow
This API retrieves available employees to assign as unit heads. **By default, only returns heads who are NOT currently assigned to any unit** (available for assignment).

### Query Parameters
- `assigned` (string, optional): Filter by assignment status
  - `assigned=true` → Show heads assigned to Production units
  - `assigned=false` → Show heads NOT assigned to any Production unit
  - **No parameter (default)** → Show only heads NOT assigned to any unit (available for assignment)

### Response Format

**Success Response (200):**
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

### Access Control
- **Authentication**: JWT token required
- **Roles**: `dep_manager` role required
- **Departments**: `Production` department required

---

## 7. Get Available Teams

### Method and Endpoint
- **Method**: `GET`
- **Endpoint**: `/production/units/available-teams`

### API Description and Flow
This API retrieves available teams to assign to production units with flexible filtering.

### Query Parameters
- `assigned` (string, optional): Filter by assignment status
  - `assigned=true` → Show teams assigned to Production units
  - `assigned=false` → Show orphan teams (not assigned to any unit)
  - No parameter → Show ALL teams (both assigned and unassigned)

### Response Format

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Development Team A",
      "employeeCount": 5,
      "teamLead": {
        "id": 456,
        "firstName": "Jane",
        "lastName": "Smith",
        "email": "jane.smith@company.com",
        "role": {
          "id": 2,
          "name": "team_lead"
        }
      },
      "isAssigned": true,
      "currentUnit": {
        "id": 1,
        "name": "Production Unit A"
      },
      "projectsCount": 3,
      "projects": [
        {
          "id": 101,
          "description": "E-commerce website",
          "status": "in_progress"
        },
        {
          "id": 102,
          "description": "Mobile app",
          "status": "completed"
        }
      ]
    },
    {
      "id": 2,
      "name": "QA Team",
      "employeeCount": 3,
      "teamLead": {
        "id": 789,
        "firstName": "Bob",
        "lastName": "Wilson",
        "email": "bob.wilson@company.com",
        "role": {
          "id": 2,
          "name": "team_lead"
        }
      },
      "isAssigned": false,
      "currentUnit": null,
      "projectsCount": 0,
      "projects": []
    }
  ],
  "total": 2,
  "message": "Available teams retrieved successfully"
}
```

### Access Control
- **Authentication**: JWT token required
- **Roles**: `dep_manager`, `unit_head`
- **Departments**: `Production` department required

---

## 8. Add Team to Unit

### Method and Endpoint
- **Method**: `POST`
- **Endpoint**: `/production/units/:id/teams`

### API Description and Flow
This API adds a team to a production unit. Only orphan teams (not assigned to any unit) can be assigned.

### Path Parameters
- `id` (number): Unit ID

### Request Body
```json
{
  "teamId": "number (required)"
}
```

### Response Format

**Success Response (201):**
```json
{
  "success": true,
  "message": "Team \"Development Team A\" successfully assigned to unit \"Production Unit A\""
}
```

**Error Responses:**

**Validation Errors (400):**
```json
{
  "statusCode": 400,
  "message": "Team ID must be a positive number",
  "error": "Bad Request"
}
```

**Business Logic Errors (400):**
```json
{
  "statusCode": 400,
  "message": "Team \"Development Team A\" (ID: 1) is already assigned to a unit. Only orphan teams (not assigned to any unit) can be assigned to a production unit.",
  "error": "Bad Request"
}
```

**Not Found Errors (404):**
```json
{
  "statusCode": 404,
  "message": "Unit with ID 123 does not exist",
  "error": "Not Found"
}
```

```json
{
  "statusCode": 404,
  "message": "Team with ID 456 does not exist",
  "error": "Not Found"
}
```

### Validations
- Unit must exist
- Team must exist
- Team must be orphan (not assigned to any unit)
- Team cannot be assigned to multiple units

### Access Control
- **Authentication**: JWT token required
- **Roles**: `dep_manager`, `unit_head`
- **Departments**: `Production` department required

---

## 9. Remove Team from Unit

### Method and Endpoint
- **Method**: `DELETE`
- **Endpoint**: `/production/units/:id/teams/:teamId`

### API Description and Flow
This API removes a team from a production unit. Projects remain linked to the team.

### Path Parameters
- `id` (number): Unit ID
- `teamId` (number): Team ID to remove

### Response Format

**Success Response (200):**
```json
{
  "success": true,
  "message": "Team \"Development Team A\" successfully removed from unit \"Production Unit A\""
}
```

**Error Responses:**

**Not Found Errors (404):**
```json
{
  "statusCode": 404,
  "message": "Unit with ID 123 does not exist",
  "error": "Not Found"
}
```

```json
{
  "statusCode": 404,
  "message": "Team with ID 456 does not exist",
  "error": "Not Found"
}
```

**Business Logic Errors (400):**
```json
{
  "statusCode": 400,
  "message": "Team \"Development Team A\" (ID: 456) does not belong to unit \"Production Unit A\" (ID: 123)",
  "error": "Bad Request"
}
```

### Validations
- Unit must exist
- Team must exist
- Team must belong to the specified unit
- No project validation needed (projects remain linked to team)

### Access Control
- **Authentication**: JWT token required
- **Roles**: `dep_manager`, `unit_head`
- **Departments**: `Production` department required

---

## 🔒 Role-Based Access Control Summary

### **Department Manager (`dep_manager`)**
- ✅ Create units
- ✅ View all units
- ✅ Update any unit
- ✅ Delete units
- ✅ Get available heads
- ✅ Add/remove teams from any unit

### **Unit Head (`unit_head`)**
- ✅ View all units (role-based filtering)
- ✅ Update only their own unit
- ✅ Add/remove teams from any unit

### **Team Lead (`team_lead`)**
- ✅ View units where they lead teams

### **Senior/Junior (`senior`, `junior`)**
- ✅ View units where they are production employees

---

## 📊 Response Data Structures

### **Unit Object**
```json
{
  "id": 1,
  "name": "Unit Name",
  "headId": 5,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z",
  "head": {
    "id": 5,
      "firstName": "John",
      "lastName": "Doe",
    "email": "john.doe@company.com"
  },
  "teamsCount": 3,
  "employeesCount": 15,
  "projectsCount": 8
}
```

### **Pagination Response**
```json
{
  "success": true,
  "data": [...],
  "total": 10,
  "pagination": {
    "page": 1,
    "limit": 10,
    "totalPages": 1
  },
  "message": "Units retrieved successfully"
}
```

### **Team Object (in unit details)**
```json
{
  "id": 1,
  "name": "Development Team A",
  "employeeCount": 5,
  "teamLeadId": 456,
  "teamLead": {
    "id": 456,
    "firstName": "Jane",
    "lastName": "Smith",
    "email": "jane.smith@company.com",
    "role": {
      "id": 2,
      "name": "team_lead"
    }
  }
}
```

### **Project Object (in unit details)**
```json
{
  "id": 101,
  "description": "E-commerce website",
  "status": "in_progress",
  "difficultyLevel": "medium",
  "paymentStage": "in_between",
  "deadline": "2024-03-15T00:00:00.000Z",
  "liveProgress": "65.50",
  "teamId": 1,
  "client": {
    "id": 501,
    "companyName": "ABC Corp",
    "clientName": "John Client",
    "email": "contact@abccorp.com",
    "phone": "+1 (555) 987-6543"
  },
  "team": {
    "id": 1,
    "name": "Development Team A",
    "teamLead": {
      "id": 456,
      "firstName": "Jane",
      "lastName": "Smith"
    }
  },
  "salesRep": {
    "id": 789,
    "firstName": "Mike",
    "lastName": "Johnson",
    "email": "mike.johnson@company.com"
  }
}
```

### **Production Employee Object**
```json
{
  "id": 1,
  "employeeId": 201,
  "specialization": "Frontend Development",
  "projectsCompleted": 15,
  "employee": {
    "id": 201,
    "firstName": "Alice",
    "lastName": "Brown",
    "email": "alice.brown@company.com",
    "phone": "+1 (555) 111-2222",
    "role": {
      "id": 3,
      "name": "senior"
    }
  }
}
```

---

## 🚀 Key Features

### **Comprehensive Filtering**
- Filter by unit head email, name, and unit name
- Filter by minimum/maximum number of teams and projects
- Case-insensitive partial matching for text filters

### **Team Management**
- Add teams to units (only orphan teams)
- Remove teams from units
- Projects remain linked to teams after removal

### **Role-Based Security**
- Different access levels based on user roles
- Unit heads can only access their own units
- Team leads see units where they lead teams
- Senior/junior employees see units where they work

### **Data Integrity**
- Proper validation for all operations
- Prevents duplicate assignments
- Safe deletion with dependency checks
- Comprehensive error handling

### **Query Parameter Validation**
- POST, PATCH, and DELETE endpoints reject query parameters
- Clear error messages for incorrect URL usage
- Prevents silent parameter ignoring

### **Project Counting Methodology**
- Projects are counted directly from the `projects` table
- Count includes all projects where `team.productionUnitId = unitId`
- Consistent counting across all endpoints
- Teams show only team information (no project details)
- Projects are displayed separately in `allProjects` section

---

*This documentation covers all Production Units API endpoints with comprehensive examples and validation rules.*