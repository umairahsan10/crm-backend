# Production Teams API Documentation

This document contains all the APIs for the Production Teams module.

---

## 1. Create Team

### Method and Endpoint
- **Method**: `POST`
- **Endpoint**: `/production/teams/create`

### API Description and Flow
This API creates a new team in a production unit. The flow includes:
1. Validates that the production unit exists
2. Validates that team name is unique within the unit
3. Validates that team lead exists and belongs to Production department
4. Validates that team lead has the correct role (team_lead)
5. Checks if team lead is already assigned to another team
6. Creates team with team lead assigned
7. Returns success response with team details

### Request Body
```json
{
  "name": "string (required)",
  "productionUnitId": "number (required)",
  "teamLeadId": "number (required)"
}
```

**Required Fields:**
- `name`: Name of the team (must be unique within the unit)
- `productionUnitId`: ID of the production unit where team will be created
- `teamLeadId`: ID of the employee who will be the team lead

### Response Format

**Success Response (200):**
```json
{
  "success": true,
  "message": "Team \"Development Team A\" created successfully in production unit \"Development Unit\"",
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
      "name": "Development Unit"
    },
    "employeeCount": 1
  }
}
```

**Error Responses:**

**Not Found Errors (404):**
```json
{
  "statusCode": 404,
  "message": "Production unit with ID 456 does not exist",
  "error": "Not Found"
}
```

```json
{
  "statusCode": 404,
  "message": "Employee with ID 789 does not exist",
  "error": "Not Found"
}
```

**Conflict Errors (409):**
```json
{
  "statusCode": 409,
  "message": "Team name \"Development Team A\" already exists in this production unit",
  "error": "Conflict"
}
```

```json
{
  "statusCode": 409,
  "message": "Employee with ID 123 is already a team lead of team \"Another Team\"",
  "error": "Conflict"
}
```

**Bad Request Errors (400):**
```json
{
  "statusCode": 400,
  "message": "Team lead must belong to Production department. Current department: Sales",
  "error": "Bad Request"
}
```

```json
{
  "statusCode": 400,
  "message": "Only employees with team_lead role can be assigned as team leads. Current role: senior",
  "error": "Bad Request"
}
```

### Access Control
- **Authentication**: JWT token required
- **Roles**: `dep_manager` OR `unit_head` role required
- **Departments**: `Production` department required
- **Admin Access**: Admins (admin, supermanager) have automatic access

---

## 2. Replace Team Lead

### Method and Endpoint
- **Method**: `PUT`
- **Endpoint**: `/production/teams/:teamId/replace-lead`

### API Description and Flow
This API replaces the team lead of an existing team. The flow includes:
1. Validates that the team exists
2. Validates that new team lead exists and belongs to Production department
3. Validates that new team lead has the correct role (team_lead)
4. Checks if new team lead is already a team lead of another team
5. Updates team with new team lead
6. Transfers all team members to follow the new team lead
7. Returns success response with replacement details

### Request Body
```json
{
  "newTeamLeadId": "number (required)"
}
```

**Required Fields:**
- `newTeamLeadId`: ID of the new team lead

### Response Format

**Success Response (200):**
```json
{
  "success": true,
  "message": "Team lead replaced successfully. All 5 team members transferred to new team lead.",
  "data": {
    "teamId": 1,
    "teamName": "Development Team A",
    "previousTeamLead": {
      "id": 123,
      "firstName": "John",
      "lastName": "Doe"
    },
    "newTeamLead": {
      "id": 456,
      "firstName": "Jane",
      "lastName": "Smith"
    },
    "memberCount": 5
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

```json
{
  "statusCode": 404,
  "message": "Employee with ID 456 does not exist",
  "error": "Not Found"
}
```

**Conflict Error (409):**
```json
{
  "statusCode": 409,
  "message": "Employee with ID 456 is already a team lead of team \"Another Team\"",
  "error": "Conflict"
}
```

**Bad Request Error (400):**
```json
{
  "statusCode": 400,
  "message": "Team lead must belong to Production department. Current department: Sales",
  "error": "Bad Request"
}
```

```json
{
  "statusCode": 400,
  "message": "Only employees with team_lead role can be assigned as team leads. Current role: senior",
  "error": "Bad Request"
}
```

### Access Control
- **Authentication**: JWT token required
- **Roles**: `dep_manager` OR `unit_head` role required
- **Departments**: `Production` department required
- **Admin Access**: Admins (admin, supermanager) have automatic access

---

## 3. Add Employee to Team

### Method and Endpoint
- **Method**: `POST`
- **Endpoint**: `/production/teams/:teamId/add-employee`

### API Description and Flow
This API adds an employee to a team. The flow includes:
1. Validates that the team exists
2. Validates that employee exists and belongs to Production department
3. Validates that employee has senior or junior role (only these roles can be team members)
4. Checks if employee is already in another team
5. Checks if employee is the team lead (already in team)
6. Adds employee to team by setting their teamLeadId
7. Updates team employee count (includes team lead + team members)
8. Returns success response with addition details

### Request Body
```json
{
  "employeeId": "number (required)"
}
```

**Required Fields:**
- `employeeId`: ID of the employee to add to the team

### Response Format

**Success Response (200):**
```json
{
  "success": true,
  "message": "Employee \"Jane Smith\" successfully added to team \"Development Team A\"",
  "data": {
    "teamId": 1,
    "teamName": "Development Team A",
    "teamLead": {
      "id": 123,
      "firstName": "John",
      "lastName": "Doe"
    },
    "addedEmployee": {
      "id": 456,
      "firstName": "Jane",
      "lastName": "Smith"
    },
    "newEmployeeCount": 6
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

```json
{
  "statusCode": 404,
  "message": "Employee with ID 456 does not exist",
  "error": "Not Found"
}
```

**Conflict Error (409):**
```json
{
  "statusCode": 409,
  "message": "Employee with ID 456 is already a member of another team",
  "error": "Conflict"
}
```

**Bad Request Error (400):**
```json
{
  "statusCode": 400,
  "message": "Employee must belong to Production department. Current department: Sales",
  "error": "Bad Request"
}
```

```json
{
  "statusCode": 400,
  "message": "Employee with ID 123 is already the team lead of this team",
  "error": "Bad Request"
}
```

```json
{
  "statusCode": 400,
  "message": "Only employees with senior or junior role can be added to teams. Current role: unit_head",
  "error": "Bad Request"
}
```

### Access Control
- **Authentication**: JWT token required
- **Roles**: `dep_manager` OR `unit_head` role required
- **Departments**: `Production` department required
- **Admin Access**: Admins (admin, supermanager) have automatic access

---

## 4. Remove Employee from Team

### Method and Endpoint
- **Method**: `DELETE`
- **Endpoint**: `/production/teams/:teamId/remove-employee/:employeeId`

### API Description and Flow
This API removes an employee from a team. The flow includes:
1. Validates that the team exists
2. Validates that employee exists
3. Checks if employee is the team lead (cannot remove team lead)
4. Checks if employee is actually in this team
5. Checks if employee has active tasks (blocks removal if active tasks exist)
6. Removes employee from team by setting teamLeadId to null
7. Updates team employee count
8. Returns success response with removal details

### Request Body/Parameters
- **Path Parameter**: `teamId` (number) - Team ID
- **Path Parameter**: `employeeId` (number) - Employee ID to remove
- **Request Body**: None

### Response Format

**Success Response (200):**
```json
{
  "success": true,
  "message": "Employee \"Jane Smith\" successfully removed from team \"Development Team A\"",
  "data": {
    "teamId": 1,
    "teamName": "Development Team A",
    "removedEmployee": {
      "id": 456,
      "firstName": "Jane",
      "lastName": "Smith"
    },
    "newEmployeeCount": 5
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

```json
{
  "statusCode": 404,
  "message": "Employee with ID 456 does not exist",
  "error": "Not Found"
}
```

**Bad Request Error (400):**
```json
{
  "statusCode": 400,
  "message": "Cannot remove team lead from team. Use replace-lead endpoint instead.",
  "error": "Bad Request"
}
```

```json
{
  "statusCode": 400,
  "message": "Employee with ID 456 is not a member of this team",
  "error": "Bad Request"
}
```

**Conflict Error (409):**
```json
{
  "statusCode": 409,
  "message": "Cannot remove employee. 3 active task(s) are assigned to this employee. Please reassign or complete these tasks first.",
  "error": "Conflict"
}
```

### Access Control
- **Authentication**: JWT token required
- **Roles**: `dep_manager` OR `unit_head` role required
- **Departments**: `Production` department required
- **Admin Access**: Admins (admin, supermanager) have automatic access

---

## 5. Unassign All From Team

### Method and Endpoint
- **Method**: `POST`
- **Endpoint**: `/production/teams/:teamId/unassign-employees`

### API Description and Flow
This API unassigns all employees and the team lead from a team (sets their teamLeadId to null) without deleting the team. The flow includes:
1. Validates that the team exists
2. Gets all team members (excluding team lead)
3. Sets teamLeadId to null for all team members
4. Unassigns the team lead if one exists
5. Returns success response with unassignment details

### Request Body/Parameters
- **Path Parameter**: `teamId` (number) - Team ID to unassign employees from
- **Request Body**: None (no body required)

### Response Format

**Success Response (200):**
```json
{
  "success": true,
  "message": "3 employee(s) and team lead successfully unassigned from team \"Development Team A\"",
  "data": {
    "teamId": 1,
    "teamName": "Development Team A",
    "teamLead": null,
    "unassignedEmployees": [
      {
        "id": 15,
        "firstName": "Alice",
        "lastName": "Smith"
      },
      {
        "id": 16,
        "firstName": "Bob",
        "lastName": "Johnson"
      },
      {
        "id": 17,
        "firstName": "Carol",
        "lastName": "Williams"
      }
    ],
    "unassignedCount": 3,
    "teamLeadUnassigned": true,
    "totalUnassigned": 4
  }
}
```

**No Employees to Unassign (200):**
```json
{
  "success": true,
  "message": "No employees to unassign from team \"Development Team A\"",
  "data": {
    "teamId": 1,
    "teamName": "Development Team A",
    "teamLead": {
      "id": 10,
      "firstName": "John",
      "lastName": "Doe"
    },
    "unassignedEmployees": [],
    "unassignedCount": 0
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

### Access Control
- **Authentication**: JWT token required
- **Roles**: `dep_manager` OR `unit_head` role required
- **Departments**: `Production` department required
- **Admin Access**: Admins (admin, supermanager) have automatic access

---

## 6. Delete Team

### Method and Endpoint
- **Method**: `DELETE`
- **Endpoint**: `/production/teams/:teamId`

### API Description and Flow
This API deletes a team. The flow includes:
1. Validates that the team exists
2. Gets all team members and projects assigned to the team
3. If team has employees, returns detailed response with employee list (doesn't delete)
4. If team has active projects, returns detailed response with project list (doesn't delete)
5. If no blocking issues, reassigns team lead (sets their teamLeadId to null)
6. Deletes the team
7. Returns success response with deletion details

### Request Body/Parameters
- **Path Parameter**: `teamId` (number) - Team ID to delete
- **Request Body**: None

### Response Format

**Success Response (200) - When Deletion is Allowed:**
```json
{
  "success": true,
  "message": "Team \"Development Team A\" successfully deleted. Team lead has been unassigned.",
  "data": {
    "teamId": 1,
    "teamName": "Development Team A",
    "teamLead": {
      "id": 123,
      "firstName": "John",
      "lastName": "Doe"
    },
    "assignedEmployees": [],
    "assignedProjects": [],
    "canDelete": true
  }
}
```

**Blocked Response (200) - When Employees or Team Lead are Assigned:**
```json
{
  "success": false,
  "message": "Cannot delete team. 3 employee(s) and team lead are still assigned to this team. Please unassign all employees and team lead first using the unassign-employees endpoint.",
  "data": {
    "teamId": 1,
    "teamName": "Development Team A",
    "teamLead": {
      "id": 123,
      "firstName": "John",
      "lastName": "Doe"
    },
    "assignedEmployees": [
      {
        "id": 15,
        "firstName": "Alice",
        "lastName": "Smith"
      },
      {
        "id": 16,
        "firstName": "Bob",
        "lastName": "Johnson"
      },
      {
        "id": 17,
        "firstName": "Carol",
        "lastName": "Williams"
      }
    ],
    "assignedProjects": [
      {
        "id": 5,
        "description": "Website Redesign",
        "status": "completed"
      }
    ],
    "canDelete": false,
    "reason": "employees_or_team_lead_assigned",
    "suggestion": "Use POST /production/teams/:teamId/unassign-employees"
  }
}
```

**Blocked Response (200) - When Active Projects Exist:**
```json
{
  "success": false,
  "message": "Cannot delete team. 2 active project(s) are assigned to this team. Please reassign or complete these projects first.",
  "data": {
    "teamId": 1,
    "teamName": "Development Team A",
    "teamLead": {
      "id": 123,
      "firstName": "John",
      "lastName": "Doe"
    },
    "assignedEmployees": [],
    "assignedProjects": [
      {
        "id": 5,
        "description": "Website Redesign",
        "status": "completed"
      },
      {
        "id": 6,
        "description": "Mobile App Development",
        "status": "in_progress"
      },
      {
        "id": 7,
        "description": "Database Migration",
        "status": "onhold"
      }
    ],
    "activeProjects": [
      {
        "id": 6,
        "description": "Mobile App Development",
        "status": "in_progress"
      },
      {
        "id": 7,
        "description": "Database Migration",
        "status": "onhold"
      }
    ],
    "canDelete": false,
    "reason": "active_projects"
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

### Access Control
- **Authentication**: JWT token required
- **Roles**: `dep_manager` OR `unit_head` role required
- **Departments**: `Production` department required
- **Admin Access**: Admins (admin, supermanager) have automatic access

---

## 7. Get Team Details

### Method and Endpoint
- **Method**: `GET`
- **Endpoint**: `/production/teams/:teamId`

### API Description and Flow
This API retrieves detailed information about a specific team. The flow includes:
1. Validates that the team exists
2. Fetches team information including team lead and current project
3. Fetches all team members
4. Returns comprehensive team details

### Request Body/Parameters
- **Path Parameter**: `teamId` (number) - Team ID to get details for
- **Request Body**: None

### Response Format

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Development Team A",
    "teamLeadId": 123,
    "currentProjectId": 101,
    "employeeCount": 6,
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
    },
    "productionUnit": {
      "id": 1,
      "name": "Development Unit"
    },
    "teamMembers": [
      {
        "id": 123,
        "firstName": "John",
        "lastName": "Doe",
        "email": "john.doe@company.com"
      },
      {
        "id": 456,
        "firstName": "Jane",
        "lastName": "Smith",
        "email": "jane.smith@company.com"
      }
    ],
    "actualEmployeeCount": 6
  }
}
```

**Error Response:**

**Not Found Error (404):**
```json
{
  "statusCode": 404,
  "message": "Team with ID 123 does not exist",
  "error": "Not Found"
}
```

### Access Control
- **Authentication**: JWT token required
- **Roles**: `dep_manager`, `unit_head`, `team_lead`, `senior`, `junior` role required
- **Departments**: `Production` department required
- **Admin Access**: Admins (admin, supermanager) have automatic access

---

## 8. Get Employee's Team

### Method and Endpoint
- **Method**: `GET`
- **Endpoint**: `/production/teams/employee/:employeeId`

### API Description and Flow
This API retrieves information about which team an employee belongs to. The flow includes:
1. Validates that the employee exists
2. Checks if employee is assigned to any team
3. Finds the team where employee's team lead is the team lead
4. Returns employee and team information

### Request Body/Parameters
- **Path Parameter**: `employeeId` (number) - Employee ID to get team for
- **Request Body**: None

### Response Format

**Success Response with Team (200):**
```json
{
  "success": true,
  "data": {
    "employee": {
      "id": 456,
      "firstName": "Jane",
      "lastName": "Smith",
      "department": "Production"
    },
    "team": {
      "id": 1,
      "name": "Development Team A",
      "teamLeadId": 123,
      "currentProjectId": 101,
      "employeeCount": 6,
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
        "status": "in_progress"
      },
      "productionUnit": {
        "id": 1,
        "name": "Development Unit"
      }
    }
  }
}
```

**Success Response - No Team (200):**
```json
{
  "success": true,
  "data": null,
  "message": "Employee \"Jane Smith\" is not assigned to any team"
}
```

**Error Response:**

**Not Found Error (404):**
```json
{
  "statusCode": 404,
  "message": "Employee with ID 456 does not exist",
  "error": "Not Found"
}
```

### Access Control
- **Authentication**: JWT token required
- **Roles**: `dep_manager`, `unit_head`, `team_lead`, `senior`, `junior` role required
- **Departments**: `Production` department required
- **Admin Access**: Admins (admin, supermanager) have automatic access

---

## 9. Get All Prod Teams

### Method and Endpoint
- **Method**: `GET`
- **Endpoint**: `/production/teams/all`

### API Description and Flow
This API retrieves all teams in the Production department. The flow includes:
1. Fetches all teams with team lead and current project information
2. Calculates actual employee count for each team
3. Orders teams by production unit name and team name
4. Returns comprehensive list of all teams

### Request Body/Parameters
- **Path Parameter**: None
- **Request Body**: None

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
      "currentProjectId": 101,
      "employeeCount": 6,
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
        "status": "in_progress"
      },
      "productionUnit": {
        "id": 1,
        "name": "Development Unit"
      },
      "actualEmployeeCount": 6
    }
  ],
  "total": 1,
  "message": "All production teams retrieved successfully"
}
```

### Access Control
- **Authentication**: JWT token required
- **Roles**: `dep_manager` OR `unit_head` role required
- **Departments**: `Production` department required
- **Admin Access**: Admins (admin, supermanager) have automatic access

---

## 10. Assign Team to Production Unit

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

### Access Control
- **Authentication**: JWT token required
- **Roles**: `dep_manager` role required
- **Departments**: `Production` department required
- **Admin Access**: Admins (admin, supermanager) have automatic access

---

## 11. Unassign Team from Production Unit

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

### Access Control
- **Authentication**: JWT token required
- **Roles**: `dep_manager` role required
- **Departments**: `Production` department required
- **Admin Access**: Admins (admin, supermanager) have automatic access

---

## 12. Get Teams in Production Unit

### Method and Endpoint
- **Method**: `GET`
- **Endpoint**: `/production/teams/unit/:productionUnitId`

### API Description and Flow
This API retrieves all teams assigned to a specific production unit. The flow includes:
1. Validates that the production unit exists
2. Fetches all teams assigned to the unit
3. Includes team lead details and current project information
4. Calculates actual employee count for each team
5. Orders teams alphabetically by name
6. Returns formatted response with team data

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
      "employeeCount": 6,
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
      },
      "actualEmployeeCount": 6
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

**Error Response:**

**Not Found Error (404):**
```json
{
  "statusCode": 404,
  "message": "Production unit with ID 123 does not exist",
  "error": "Not Found"
}
```

### Access Control
- **Authentication**: JWT token required
- **Roles**: `dep_manager` OR `unit_head` role required
- **Departments**: `Production` department required
- **Admin Access**: Admins (admin, supermanager) have automatic access

---

## 13. Get Available Teams

### Method and Endpoint
- **Method**: `GET`
- **Endpoint**: `/production/teams/available`

### API Description and Flow
This API retrieves all teams that are available for assignment to production units. The flow includes:
1. Fetches all teams not assigned to any production unit
2. Filters teams that have a team lead assigned
3. Filters teams where team lead belongs to Production department
4. Calculates actual employee count for each team
5. Orders teams alphabetically by name
6. Returns formatted response with available team data

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
      },
      "actualEmployeeCount": 5
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

### Access Control
- **Authentication**: JWT token required
- **Roles**: `dep_manager` role required
- **Departments**: `Production` department required
- **Admin Access**: Admins (admin, supermanager) have automatic access

---

## Business Rules

### Team Creation Rules:
1. **Team Name Uniqueness**: Team names must be unique within each production unit
2. **Team Lead Required**: Every team must have a team lead assigned
3. **Production Department**: Team lead must belong to Production department
4. **Team Lead Role**: Only employees with `team_lead` role can be assigned as team leads
5. **One Team Lead Per Team**: A team lead can only lead one team at a time
6. **Unit Assignment**: Teams are created within a specific production unit

### Team Lead Management Rules:
1. **Team Lead Replacement**: Team leads can be replaced but never removed
2. **Member Transfer**: All team members automatically follow the new team lead
3. **Production Department**: New team lead must belong to Production department
4. **Team Lead Role**: Only employees with `team_lead` role can be assigned as team leads
5. **Active Projects**: Team lead can be changed even with active projects

### Employee Assignment Rules:
1. **One Team Per Employee**: An employee can only be in one team at a time
2. **Production Department**: All team members must belong to Production department
3. **Team Member Role**: Only employees with `senior` or `junior` role can be added to teams
4. **Team Lead Protection**: Team lead cannot be removed (use replace-lead instead)
5. **Active Tasks**: Employee cannot be removed if they have active tasks
6. **Auto Count Update**: Employee count is automatically updated on add/remove (includes team lead + team members)

### Team Deletion Rules:
1. **Employee Check**: Team cannot be deleted if it has employees (must remove first)
2. **Active Project Check**: Team cannot be deleted if it has active projects (must reassign first)
3. **Completed Projects**: Completed projects don't block team deletion
4. **Team Lead**: Team lead is automatically removed when team is deleted

### Unit Assignment Rules:
1. **One Unit Per Team**: A team can only be assigned to one production unit at a time
2. **Team Lead Required**: Team must have a team lead before unit assignment
3. **Active Projects**: Team cannot be unassigned if it has active projects
4. **No Duplicate Assignment**: Team cannot be assigned to the same unit twice

### Validation Hierarchy:
1. **Existence Check**: Team, unit, and employee must exist
2. **Department Validation**: All team members must belong to Production department
3. **Assignment Status**: Check current assignment status
4. **Business Logic**: Apply department and role restrictions
5. **Data Integrity**: Ensure no orphaned relationships

---

## Access Control Matrix

| Action | dep_manager | unit_head | team_lead | senior/junior |
|--------|-------------|-----------|-----------|---------------|
| Create Team | ✅ | ✅ | ❌ | ❌ |
| Replace Team Lead | ✅ | ✅ | ❌ | ❌ |
| Add Team Member | ✅ | ✅ | ❌ | ❌ |
| Remove Team Member | ✅ | ✅ | ❌ | ❌ |
| Delete Team | ✅ | ✅ | ❌ | ❌ |
| Assign Team to Unit | ✅ | ❌ | ❌ | ❌ |
| Unassign Team from Unit | ✅ | ❌ | ❌ | ❌ |
| View Teams in Unit | ✅ | ✅ | ✅ | ✅ |
| View Available Teams | ✅ | ❌ | ❌ | ❌ |
| View Team Details | ✅ | ✅ | ✅ | ✅ |
| View Employee's Team | ✅ | ✅ | ✅ | ✅ |
| View All Teams | ✅ | ✅ | ❌ | ❌ |

---

## Database Operations

### Tables Affected:
- `teams` table (create, read, update, delete)
- `employees` table (read, update - for team membership)
- `departments` table (read - for department validation)
- `production_units` table (read - for unit validation)
- `projects` table (read - for project validation)
- `project_tasks` table (read - for task validation)

### Key Relationships:
- **Team Lead**: `Team.teamLeadId` → `Employee.id`
- **Team Membership**: `Employee.teamLeadId` → `Team.teamLeadId`
- **Unit Assignment**: `Team.productionUnitId` → `ProductionUnit.id`
- **Project Assignment**: `Project.teamId` → `Team.id`

### Database Queries:
1. **Team Creation**: INSERT into teams table
2. **Team Lead Replacement**: UPDATE teams and employees tables
3. **Employee Assignment**: UPDATE employees table
4. **Team Deletion**: DELETE from teams table
5. **Team Queries**: SELECT with JOINs for comprehensive data

---

*This documentation covers all team management APIs implemented using the existing schema structure without any database changes.* 