# Production Teams API Documentation

This document contains all the APIs for the Production Teams module with comprehensive filtering, member management, and role-based access control.

---

## 🔐 Authentication & Authorization
- **Authentication**: JWT Bearer Token required
- **Guards**: `JwtAuthGuard`, `RolesWithServiceGuard`, `DepartmentsGuard`
- **Department**: Production department access required

---

## 📋 API Endpoints Overview

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| `POST` | `/production/teams` | Create production team | `dep_manager`, `unit_head` |
| `GET` | `/production/teams` | Get all teams with filters | `dep_manager`, `unit_head`, `team_lead`, `senior`, `junior` |
| `GET` | `/production/teams/:id` | Get team by ID with full details | `dep_manager`, `unit_head`, `team_lead`, `senior`, `junior` |
| `PATCH` | `/production/teams/:id` | Update production team | `dep_manager`, `unit_head`, `team_lead` |
| `DELETE` | `/production/teams/:id` | Delete production team | `dep_manager` |
| `GET` | `/production/teams/available-leads` | Get available team leads | `dep_manager`, `unit_head` |
| `GET` | `/production/teams/available-employees` | Get available employees to assign | `dep_manager`, `unit_head`, `team_lead` |
| `POST` | `/production/teams/:id/members` | Add members to team | `dep_manager`, `unit_head`, `team_lead` |
| `DELETE` | `/production/teams/:id/members/:employeeId` | Remove member from team | `dep_manager`, `unit_head`, `team_lead` |

---

## 1. Create Production Team

### Method and Endpoint
- **Method**: `POST`
- **Endpoint**: `/production/teams`

### API Description and Flow
This API creates a new production team in the system. The flow includes:
1. Validates all required fields using DTO validation
2. Checks if the team name is unique (not already exists)
3. Validates that the team lead exists and has the `team_lead` role
4. Verifies that the team lead belongs to Production department
5. Ensures the team lead is active
6. Checks if the team lead is already leading another team
7. Validates that the production unit exists
8. Creates the team and assigns the team lead
9. Returns success response with team details

### Request Body
```json
{
  "name": "string (required)",
  "teamLeadId": "number (required)",
  "productionUnitId": "number (required)"
}
```

**Required Fields:**
- `name`: Team name (must be unique)
- `teamLeadId`: Employee ID who will be the team lead
- `productionUnitId`: Production unit ID where team belongs

### Response Format

**Success Response (201):**
```json
{
  "success": true,
  "message": "Team \"Development Team A\" created successfully",
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
      "name": "Frontend Development Unit"
    },
    "employeeCount": 1
  }
}
```

**Error Responses:**

**Validation Errors (400):**
```json
{
  "statusCode": 400,
  "message": [
    "Team name is required",
    "Team lead ID must be a positive number",
    "Production unit ID must be a positive number"
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
  "message": "Employee must have team_lead role to be assigned as team lead",
  "error": "Bad Request"
}
```

```json
{
  "statusCode": 400,
  "message": "Employee must belong to Production department",
  "error": "Bad Request"
}
```

**Conflict Errors (409):**
```json
{
  "statusCode": 409,
  "message": "Team name already exists",
  "error": "Conflict"
}
```

```json
{
  "statusCode": 409,
  "message": "Employee John Doe (ID: 123) is already leading team \"Other Team\" (ID: 2). Each employee can only lead one team at a time.",
  "error": "Conflict"
}
```

### Validations
- `name`: Required string, not empty, must be unique
- `teamLeadId`: Required positive number
- `productionUnitId`: Required positive number
- Employee with `teamLeadId` must exist and have `team_lead` role
- Employee must belong to Production department
- Employee must be active
- Employee cannot be leading another team
- Production unit must exist

### Access Control
- **Authentication**: JWT token required
- **Roles**: `dep_manager`, `unit_head` role required
- **Departments**: `Production` department required

---

## 2. Get All Production Teams

### Method and Endpoint
- **Method**: `GET`
- **Endpoint**: `/production/teams`

### API Description and Flow
This API retrieves all production teams with comprehensive filtering and role-based access. The flow includes:
1. Applies role-based filtering (users see only teams they have access to)
2. Applies all query filters (name, lead, unit, members, projects)
3. Fetches teams with lead information and counts
4. Returns paginated results with comprehensive data

### Query Parameters

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `teamId` | number | Get specific team by ID | `?teamId=1` |
| `unitId` | number | Filter by production unit ID | `?unitId=1` |
| `hasLead` | boolean | Filter teams that have leads assigned | `?hasLead=true` |
| `hasMembers` | boolean | Filter teams that have members | `?hasMembers=true` |
| `hasProjects` | boolean | Filter teams that have projects | `?hasProjects=true` |
| `page` | number | Page number for pagination | `?page=1` |
| `limit` | number | Number of items per page | `?limit=10` |
| `sortBy` | string | Sort by field (name, createdAt, updatedAt, employeeCount) | `?sortBy=name` |
| `sortOrder` | string | Sort order (asc, desc) | `?sortOrder=asc` |
| `leadEmail` | string | Filter by team lead email | `?leadEmail=john@company.com` |
| `leadName` | string | Filter by team lead name (firstName or lastName) | `?leadName=John` |
| `teamName` | string | Filter by team name (partial match) | `?teamName=Development` |
| `unitName` | string | Filter by production unit name | `?unitName=Frontend` |
| `minMembers` | number | Minimum number of members | `?minMembers=2` |
| `maxMembers` | number | Maximum number of members | `?maxMembers=5` |
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
      "name": "Development Team A",
      "teamLeadId": 123,
      "productionUnitId": 1,
      "employeeCount": 5,
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z",
      "teamLead": {
        "id": 123,
        "firstName": "John",
        "lastName": "Doe",
        "email": "john.doe@company.com",
        "role": {
          "id": 3,
          "name": "team_lead"
        }
      },
      "productionUnit": {
        "id": 1,
        "name": "Frontend Development Unit"
      },
      "membersCount": 5,
      "projectsCount": 3
    }
  ],
  "total": 1,
  "pagination": {
    "page": 1,
    "limit": 10,
    "totalPages": 1
  },
  "message": "Teams retrieved successfully"
}
```

### Role-Based Access Control
- **`dep_manager`**: Can see all teams in Production department (teams with production units)
- **`unit_head`**: Can only see teams in their production unit (using productionUnitId)
- **`team_lead`**: Can only see teams they lead (team.teamLeadId = user.id)
- **`senior`/`junior`**: Can only see teams they belong to (team.teamLeadId = user.teamLeadId)

### Access Control
- **Authentication**: JWT token required
- **Roles**: `dep_manager`, `unit_head`, `team_lead`, `senior`, `junior`
- **Departments**: `Production` department required

---

## 3. Get Team by ID

### Method and Endpoint
- **Method**: `GET`
- **Endpoint**: `/production/teams/:id`

### API Description and Flow
This API retrieves detailed information about a specific production team with role-based filtering and team membership validation:
- **`dep_manager`**: Can access any team (no membership check required)
- **`unit_head`**: Can only access teams in their production unit
- **`team_lead`**: Can only access teams they lead
- **`senior`** and **`junior`**: Can only access teams they belong to

**Security Check**: All users (except `dep_manager`) must be members of the requested team to access its details.

### Path Parameters
- `id` (number): Team ID to retrieve

### Response Format

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Development Team A",
    "teamLeadId": 123,
    "productionUnitId": 1,
    "employeeCount": 5,
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z",
    "teamLead": {
      "id": 123,
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@company.com",
      "phone": "+1234567890",
      "role": {
        "id": 3,
        "name": "team_lead"
      }
    },
    "productionUnit": {
      "id": 1,
      "name": "Frontend Development Unit",
      "head": {
        "id": 456,
        "firstName": "Alice",
        "lastName": "Smith"
      }
    },
    "membersCount": 5,
    "projectsCount": 3,
    "members": [
      {
        "id": 124,
        "firstName": "Jane",
        "lastName": "Wilson",
        "email": "jane.wilson@company.com",
        "role": {
          "id": 4,
          "name": "senior"
        }
      }
    ],
    "projects": [
      {
        "id": 789,
        "description": "E-commerce website development",
        "status": "in_progress",
        "liveProgress": 65.50,
        "deadline": "2024-03-15T00:00:00.000Z",
        "client": {
          "id": 101,
          "companyName": "Tech Corp",
          "clientName": "Bob Johnson",
          "email": "bob@techcorp.com",
          "phone": "+1234567890"
        },
        "salesRep": {
          "id": 202,
          "firstName": "Sarah",
          "lastName": "Davis",
          "email": "sarah.davis@company.com"
        }
      }
    ]
  },
  "message": "Team details retrieved successfully"
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

**Forbidden Error (403) - Team Membership:**
```json
{
  "statusCode": 403,
  "message": "You do not have access to this team. You must be a member of this team to view its details.",
  "error": "Forbidden"
}
```

### Access Control
- **Authentication**: JWT token required
- **Roles**: `dep_manager`, `unit_head`, `team_lead`, `senior`, `junior`
- **Departments**: `Production` department required

---

## 4. Update Production Team

### Method and Endpoint
- **Method**: `PATCH`
- **Endpoint**: `/production/teams/:id`

### API Description and Flow
This API updates a production team. Team leads can only update their own team.

### Path Parameters
- `id` (number): Team ID to update

### Request Body
```json
{
  "name": "string (optional)",
  "teamLeadId": "number (optional)"
}
```

**Required Fields:**
- At least one field must be provided for update

### Response Format

**Success Response (200):**
```json
{
  "success": true,
  "message": "Team updated successfully"
}
```

**Error Responses:**

**Validation Errors (400):**
```json
{
  "statusCode": 400,
  "message": "At least one field must be provided for update",
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
  "message": "Employee John Doe (ID: 123) is already leading team \"Other Team\" (ID: 2). Each employee can only lead one team at a time.",
  "error": "Conflict"
}
```

### Validations
- At least one field must be provided
- Team name must be unique (if provided)
- New team lead must exist and have `team_lead` role
- New team lead must belong to Production department
- New team lead cannot be leading another team
- Team lead can only update their own team

### Access Control
- **Authentication**: JWT token required
- **Roles**: `dep_manager`, `unit_head`, `team_lead`
- **Departments**: `Production` department required
- **Team Lead Access**: Team leads can only update their own team

---

## 5. Delete Production Team

### Method and Endpoint
- **Method**: `DELETE`
- **Endpoint**: `/production/teams/:id`

### API Description and Flow
This API deletes a production team. **Team can only be deleted if it has NO members and NO projects.** If the team has any members or projects, deletion will be blocked.

### Path Parameters
- `id` (number): Team ID to delete

### Response Format

**Success Response (200):**
```json
{
  "success": true,
  "message": "Team deleted successfully"
}
```

**Error Response - Team Has Dependencies (200):**
```json
{
  "success": false,
  "message": "Cannot delete team \"Development Team A\". Team has 3 member(s) and 2 project(s). Please remove all members and projects first.",
  "teamInfo": {
    "id": 1,
    "name": "Development Team A",
    "teamLeadId": 123
  },
  "dependencies": {
    "members": {
      "count": 3,
      "details": [
        {
          "id": 124,
          "employeeId": 124,
          "employeeName": "Jane Wilson",
          "email": "jane.wilson@company.com"
        }
      ]
    },
    "projects": {
      "count": 2,
      "details": [
        {
          "id": 789,
          "description": "E-commerce website development",
          "status": "in_progress",
          "deadline": "2024-03-15T00:00:00.000Z"
        }
      ]
    },
    "summary": {
      "totalMembers": 3,
      "totalProjects": 2,
      "hasMembers": true,
      "hasProjects": true
    }
  },
  "instructions": [
    "To delete this team, you must first:",
    "1. Remove all members from this team using DELETE /production/teams/:id/members/:employeeId",
    "2. Complete or reassign all projects",
    "3. Once all members and projects are removed, the team can be deleted"
  ]
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

### Business Logic
- **Team can only be deleted if it has NO members and NO projects**
- Members and projects must be removed before team can be deleted
- Clear error message shows which dependencies need to be removed

### Access Control
- **Authentication**: JWT token required
- **Roles**: `dep_manager` role required
- **Departments**: `Production` department required

---

## 6. Get Available Team Leads

### Method and Endpoint
- **Method**: `GET`
- **Endpoint**: `/production/teams/available-leads`

### API Description and Flow
This API retrieves available employees to assign as team leads. **By default, only returns leads who are NOT currently assigned to any team** (available for assignment).

### Query Parameters
- `assigned` (string, optional): Filter by assignment status
  - `assigned=true` → Show leads assigned to teams
  - `assigned=false` → Show leads NOT assigned to any team
  - **No parameter (default)** → Show only leads NOT assigned to any team (available for assignment)

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
      "currentTeam": null
    },
    {
      "id": 456,
      "firstName": "Jane",
      "lastName": "Smith",
      "email": "jane.smith@company.com",
      "isAssigned": true,
      "currentTeam": {
        "id": 1,
        "name": "Development Team A"
      }
    }
  ],
  "total": 2,
  "message": "Available team leads retrieved successfully"
}
```

### Access Control
- **Authentication**: JWT token required
- **Roles**: `dep_manager`, `unit_head` role required
- **Departments**: `Production` department required

---

## 7. Get Available Employees

### Method and Endpoint
- **Method**: `GET`
- **Endpoint**: `/production/teams/available-employees`

### API Description and Flow
This API retrieves available employees to assign to teams with flexible filtering.

### Query Parameters
- `assigned` (string, optional): Filter by assignment status
  - `assigned=true` → Show employees assigned to teams
  - `assigned=false` → Show employees NOT assigned to any team
  - No parameter → Show ALL employees (both assigned and unassigned)

### Response Format

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 124,
      "firstName": "Jane",
      "lastName": "Wilson",
      "email": "jane.wilson@company.com",
      "role": "senior",
      "isAssigned": false,
      "currentTeamLead": null
    },
    {
      "id": 125,
      "firstName": "Bob",
      "lastName": "Johnson",
      "email": "bob.johnson@company.com",
      "role": "junior",
      "isAssigned": true,
      "currentTeamLead": {
        "id": 123,
        "firstName": "John",
        "lastName": "Doe"
      }
    }
  ],
  "total": 2,
  "message": "Available employees retrieved successfully"
}
```

### Access Control
- **Authentication**: JWT token required
- **Roles**: `dep_manager`, `unit_head`, `team_lead`
- **Departments**: `Production` department required

---

## 8. Add Members to Team

### Method and Endpoint
- **Method**: `POST`
- **Endpoint**: `/production/teams/:id/members`

### API Description and Flow
This API adds multiple employees to a team and integrates them with team projects. The flow includes:
1. Validates team exists
2. Validates all employees exist and are active
3. Checks if employees are already team members
4. Adds employees to the team
5. Automatically adds employees to all team project chats
6. Automatically adds employees to all team project logs
7. Updates team employee count
8. Returns success response with details

### Path Parameters
- `id` (number): Team ID

### Request Body
```json
{
  "employeeIds": "array of numbers (required)"
}
```

**Required Fields:**
- `employeeIds`: Array of employee IDs to add to the team

### Response Format

**Success Response (201):**
```json
{
  "success": true,
  "message": "Successfully added 3 member(s) to team \"Development Team A\" and all team projects",
  "data": {
    "teamId": 1,
    "teamName": "Development Team A",
    "addedEmployees": [
      {
        "id": 124,
        "firstName": "Jane",
        "lastName": "Wilson"
      }
    ],
    "newEmployeeCount": 8,
    "projectsUpdated": 3
  }
}
```

**Error Responses:**

**Validation Errors (400):**
```json
{
  "statusCode": 400,
  "message": "Employee IDs must be provided as an array",
  "error": "Bad Request"
}
```

**Business Logic Errors (400):**
```json
{
  "statusCode": 400,
  "message": "Employee with ID 999 does not exist",
  "error": "Bad Request"
}
```

```json
{
  "statusCode": 400,
  "message": "Employee Jane Wilson (ID: 124) is already a member of team \"Development Team A\"",
  "error": "Bad Request"
}
```

**Not Found Errors (404):**
```json
{
  "statusCode": 404,
  "message": "Team with ID 123 does not exist",
  "error": "Not Found"
}
```

### Validations
- Team must exist
- All employees must exist and be active
- Employees cannot already be team members
- Employee IDs must be provided as array

### Access Control
- **Authentication**: JWT token required
- **Roles**: `dep_manager`, `unit_head`, `team_lead`
- **Departments**: `Production` department required

---

## 9. Remove Member from Team

### Method and Endpoint
- **Method**: `DELETE`
- **Endpoint**: `/production/teams/:id/members/:employeeId`

### API Description and Flow
This API removes an employee from a team and all team projects. The flow includes:
1. Validates team exists
2. Validates employee exists
3. Checks if employee is a team member
4. Removes employee from the team
5. Automatically removes employee from all team project chats
6. Automatically removes employee from all team project logs
7. Updates team employee count
8. Returns success response with details

### Path Parameters
- `id` (number): Team ID
- `employeeId` (number): Employee ID to remove

### Response Format

**Success Response (200):**
```json
{
  "success": true,
  "message": "Employee Jane Wilson successfully removed from team \"Development Team A\" and all team projects",
  "data": {
    "teamId": 1,
    "teamName": "Development Team A",
    "removedEmployee": {
      "id": 124,
      "firstName": "Jane",
      "lastName": "Wilson"
    },
    "newEmployeeCount": 7,
    "projectsUpdated": 3
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
  "message": "Employee with ID 999 does not exist",
  "error": "Not Found"
}
```

**Business Logic Errors (400):**
```json
{
  "statusCode": 400,
  "message": "Employee Jane Wilson (ID: 124) is not a member of team \"Development Team A\"",
  "error": "Bad Request"
}
```

### Validations
- Team must exist
- Employee must exist
- Employee must be a team member
- Cannot remove team lead from their own team

### Access Control
- **Authentication**: JWT token required
- **Roles**: `dep_manager`, `unit_head`, `team_lead`
- **Departments**: `Production` department required

---

## 🔒 Role-Based Access Control Summary

### **Department Manager (`dep_manager`)**
- ✅ Create teams
- ✅ View all teams
- ✅ Update any team
- ✅ Delete teams
- ✅ Get available leads and employees
- ✅ Add/remove members from any team

### **Unit Head (`unit_head`)**
- ✅ Create teams in their unit
- ✅ View teams in their unit
- ✅ Update teams in their unit
- ✅ Add/remove members from teams in their unit
- ✅ Get available leads and employees

### **Team Lead (`team_lead`)**
- ✅ View only teams they lead
- ✅ Update only their own team
- ✅ Add/remove members from their team
- ✅ Get available employees

### **Senior/Junior (`senior`, `junior`)**
- ✅ View only teams they belong to
- ❌ No management permissions

---

## 📊 Response Data Structures

### **Team Object**
```json
{
  "id": 1,
  "name": "Team Name",
  "teamLeadId": 5,
  "productionUnitId": 1,
  "employeeCount": 8,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z",
  "teamLead": {
    "id": 5,
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@company.com"
  },
  "productionUnit": {
    "id": 1,
    "name": "Frontend Development Unit"
  },
  "membersCount": 8,
  "projectsCount": 5
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
  "message": "Teams retrieved successfully"
}
```

### **Team Member Object**
```json
{
  "id": 124,
  "firstName": "Jane",
  "lastName": "Wilson",
  "email": "jane.wilson@company.com",
  "role": {
    "id": 4,
    "name": "senior"
  }
}
```

### **Project Object (in team details)**
```json
{
  "id": 789,
  "description": "E-commerce website development",
  "status": "in_progress",
  "liveProgress": 65.50,
  "deadline": "2024-03-15T00:00:00.000Z",
  "client": {
    "id": 101,
    "companyName": "Tech Corp",
    "clientName": "Bob Johnson",
    "email": "bob@techcorp.com",
    "phone": "+1234567890"
  },
  "salesRep": {
    "id": 202,
    "firstName": "Sarah",
    "lastName": "Davis",
    "email": "sarah.davis@company.com"
  }
}
```

---

## 🚀 Key Features

### **Comprehensive Filtering**
- Filter by team name, lead name, unit name
- Filter by minimum/maximum number of members and projects
- Case-insensitive partial matching for text filters

### **Member Management**
- Add multiple members to teams
- Remove members from teams
- Automatic project integration (chats and logs)
- Real-time team member count updates

### **Role-Based Security**
- Different access levels based on user roles
- Team leads can only manage their own teams
- Unit heads see teams in their unit
- Senior/junior employees see teams they belong to

### **Data Integrity**
- Proper validation for all operations
- Prevents duplicate assignments
- Safe deletion with dependency checks
- Comprehensive error handling

### **Project Integration**
- Automatic member addition to team project chats
- Automatic member addition to team project logs
- Automatic member removal from team projects
- Real-time project participant count updates

### **Team Lead Management**
- One team lead per team rule
- Available team leads filtering
- Team lead assignment validation
- Production department requirement

---

*This documentation covers all Production Teams API endpoints with comprehensive examples and validation rules.*