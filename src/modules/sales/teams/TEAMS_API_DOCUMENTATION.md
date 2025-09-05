# Sales Teams API Documentation

This document contains all the APIs for the Sales Teams module.


## 1. Create Team

### Method and Endpoint
- **Method**: `POST`
- **Endpoint**: `/sales/teams/create`

### API Description and Flow
This API creates a new team in a sales unit. The flow includes:
1. Validates that the sales unit exists
2. Validates that team name is unique within the unit
3. Validates that team lead exists and belongs to Sales department
4. Validates that team lead has the correct role (team_lead)
5. Checks if team lead is already assigned to another team
6. Creates team with team lead assigned in the specified sales unit
7. Returns success response with team details

### Request Body
```json
{
  "name": "string (required)",
  "salesUnitId": "number (required)",
  "teamLeadId": "number (required)"
}
```

**Required Fields:**
- `name`: Name of the team (must be unique within the unit)
- `salesUnitId`: ID of the sales unit where team will be created
- `teamLeadId`: ID of the employee who will be the team lead

### Response Format

**Success Response (200):**
```json
{
  "success": true,
  "message": "Team \"Sales Team A\" created successfully in sales unit \"Sales Unit A\"",
  "data": {
    "teamId": 1,
    "teamName": "Sales Team A",
    "teamLead": {
      "id": 123,
      "firstName": "John",
      "lastName": "Doe"
    },
    "salesUnit": {
      "id": 1,
      "name": "Sales Unit A"
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
  "message": "Sales unit with ID 456 does not exist",
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
  "message": "Team name \"Sales Team A\" already exists in this sales unit",
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
  "message": "Team lead must belong to Sales department. Current department: Production",
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
- **Departments**: `Sales` department required
- **Admin Access**: Admins (admin, supermanager) have automatic access

---

## 2. Replace Team Lead

### Method and Endpoint
- **Method**: `PUT`
- **Endpoint**: `/sales/teams/:teamId/replace-lead`

### API Description and Flow
This API replaces the team lead of an existing team. The flow includes:
1. Validates that the team exists
2. Validates that new team lead exists and belongs to Sales department
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
    "teamName": "Sales Team A",
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
  "message": "Team lead must belong to Sales department. Current department: Production",
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
- **Departments**: `Sales` department required
- **Admin Access**: Admins (admin, supermanager) have automatic access

---

## 3. Add Employee to Team

**Endpoint**: `POST /sales/teams/:teamId/add-employee`

**Description**: Adds an employee to a sales team. This API has two modes:
1. **Assign Team Lead**: If the team has no team lead and the employee has `team_lead` role, they are automatically assigned as team lead
2. **Add Team Member**: If the team already has a team lead, the employee is added as a regular team member

**Request Body**:
```json
{
  "employeeId": "number (required)"
}
```

**Required Fields**:
- `employeeId`: ID of the employee to add to the team

**API Description and Flow**:
1. **Team Validation**: Ensures the team exists and is assigned to a Sales unit
2. **Employee Validation**: Verifies employee exists and belongs to Sales department
3. **Team Lead Assignment Mode**: 
   - If team has no team lead AND employee has `team_lead` role → Employee becomes team lead
   - Checks that employee isn't already leading another team
4. **Team Member Mode**: 
   - If team already has team lead → Employee is added as regular member
   - Requires employee to have `senior` or `junior` role
5. **Team Membership Check**: Ensures employee isn't already in another team
6. **Database Update**: Updates employee's `teamLeadId` and team's employee count
7. **Response**: Returns success message with team details and action performed

**Business Rules**:
- **Team Lead Assignment**: If team has no team lead, only employees with `team_lead` role can be added
- **Team Member Addition**: If team has team lead, only `senior` or `junior` employees can be added
- **One Team Per Employee**: Employee cannot be in multiple teams simultaneously
- **Sales Department**: All employees must belong to Sales department
- **Team Lead Uniqueness**: A team lead can only lead one team at a time

**Success Response**:
```json
{
  "success": true,
  "message": "Employee 'John Doe' successfully assigned as team lead to team 'Alpha Team'",
  "data": {
    "teamId": 8,
    "teamName": "Alpha Team",
    "teamLead": {
      "id": 15,
      "firstName": "John",
      "lastName": "Doe"
    },
    "assignedEmployee": {
      "id": 15,
      "firstName": "John",
      "lastName": "Doe",
      "role": "team_lead"
    },
    "newEmployeeCount": 1,
    "action": "assigned_as_team_lead"
  }
}
```

**Error Responses**:
- `400 Bad Request`: Team not assigned to Sales unit, employee wrong department/role, team lead already exists
- `404 Not Found`: Team or employee not found
- `409 Conflict`: Employee already in another team, team lead already leads another team

### Access Control
- **Authentication**: JWT token required
- **Roles**: `dep_manager` OR `unit_head` role required
- **Departments**: `Sales` department required
- **Admin Access**: Admins (admin, supermanager) have automatic access

---

## 4. Remove Employee from Team

### Method and Endpoint
- **Method**: `DELETE`
- **Endpoint**: `/sales/teams/:teamId/remove-employee/:employeeId`

### API Description and Flow
This API removes an employee from a team. The flow includes:
1. Validates that the team exists
2. Validates that employee exists
3. Checks if employee is the team lead (cannot remove team lead)
4. Checks if employee is actually in this team
5. Checks if employee has completed leads (blocks removal if completed leads exist)
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
  "message": "Employee \"Jane Smith\" successfully removed from team \"Sales Team A\"",
  "data": {
    "teamId": 1,
    "teamName": "Sales Team A",
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
  "message": "Cannot remove employee. 3 completed lead(s) are assigned to this employee. Please reassign these leads first.",
  "error": "Conflict"
}
```

### Access Control
- **Authentication**: JWT token required
- **Roles**: `dep_manager` OR `unit_head` role required
- **Departments**: `Sales` department required
- **Admin Access**: Admins (admin, supermanager) have automatic access

---

## 5. Unassign All From Team

### Method and Endpoint
- **Method**: `POST`
- **Endpoint**: `/sales/teams/:teamId/unassign-employees`

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
  "message": "2 employee(s) and team lead successfully unassigned from team \"Sales Test Team\"",
  "data": {
    "teamId": 8,
    "teamName": "Sales Test Team",
    "teamLead": null,
    "unassignedTeamLead": {
      "id": 11,
      "firstName": "Mellie",
      "lastName": "Nolan",
      "department": "Sales"
    },
    "unassignedEmployees": [
      {
        "id": 15,
        "firstName": "Shaniya",
        "lastName": "MacGyver"
      },
      {
        "id": 4,
        "firstName": "Joan",
        "lastName": "Dibbert"
      }
    ],
    "unassignedCount": 2,
    "teamLeadUnassigned": true,
    "totalUnassigned": 3
  }
}
```

**No Employees to Unassign (200):**
```json
{
  "success": true,
  "message": "No employees to unassign from team \"Sales Team A\"",
  "data": {
    "teamId": 1,
    "teamName": "Sales Team A",
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
- **Departments**: `Sales` department required
- **Admin Access**: Admins (admin, supermanager) have automatic access

---

## 6. Delete Team

### Method and Endpoint
- **Method**: `DELETE`
- **Endpoint**: `/sales/teams/:teamId`

### API Description and Flow
This API deletes a team. The flow includes:
1. Validates that the team exists
2. Checks if team has employees or team lead assigned
3. If team has employees/team lead, returns detailed response with assignment info (doesn't delete)
4. If no blocking issues, deletes the team
5. Returns success response with deletion details

### Request Body/Parameters
- **Path Parameter**: `teamId` (number) - Team ID to delete
- **Request Body**: None

### Response Format

**Success Response (200) - When Deletion is Allowed:**
```json
{
  "success": true,
  "message": "Team \"Sales Team A\" successfully deleted.",
  "data": {
    "teamId": 1,
    "teamName": "Sales Team A",
    "teamLead": null,
    "assignedEmployees": 0,
    "hasTeamLead": false,
    "totalAssigned": 0,
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
    "teamName": "Sales Team A",
    "teamLead": {
      "id": 123,
      "firstName": "John",
      "lastName": "Doe"
    },
    "assignedEmployees": 2,
    "hasTeamLead": true,
    "totalAssigned": 3,
    "canDelete": false,
    "reason": "employees_or_team_lead_assigned",
    "suggestion": "Use POST /sales/teams/:teamId/unassign-employees"
  }
}
```

### Access Control
- **Authentication**: JWT token required
- **Roles**: `dep_manager` role required
- **Departments**: `Sales` department required
- **Admin Access**: Admins (admin, supermanager) have automatic access

---

## 7. Get Team Details

### Method and Endpoint
- **Method**: `GET`
- **Endpoint**: `/sales/teams/:teamId`

### API Description and Flow
**API Description and Flow**:
1. **Team Validation**: Ensures the team exists and is assigned to a Sales unit
2. **Team Lead Validation**: Verifies team has a team lead assigned
3. **Team Members Retrieval**: Gets all employees who follow the team lead
4. **Completed Leads Retrieval**: Gets the completed leads count from the team's database field
5. **Employee Count Calculation**: Calculates actual team size (team lead + members)
6. **Response**: Returns comprehensive team details with performance metrics

**Business Rules**:
- **Sales Unit Required**: Team must be assigned to a sales unit
- **Team Lead Required**: Team must have a team lead assigned
- **Completed Leads Metric**: Returns the completed leads count stored in the team's database field
- **Performance Measurement**: Team success is measured by the completed leads counter

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
    "name": "Sales Team A",
    "teamLeadId": 123,
    "employeeCount": 6,
    "salesUnitId": 1,
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z",
    "teamLead": {
      "id": 123,
      "firstName": "John",
      "lastName": "Doe"
    },
    "completedLeads": {
      "count": 45,
      "status": "completed"
    },
    "salesUnit": {
      "id": 1,
      "name": "Sales Unit A"
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
- **Departments**: `Sales` department required
- **Admin Access**: Admins (admin, supermanager) have automatic access

---

## 8. Get Employee's Team

### Method and Endpoint
- **Method**: `GET`
- **Endpoint**: `/sales/teams/employee/:employeeId`

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
      "department": "Sales"
    },
    "team": {
      "id": 1,
      "name": "Sales Team A",
      "teamLeadId": 123,
      "employeeCount": 6,
      "salesUnitId": 1,
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z",
      "teamLead": {
        "id": 123,
        "firstName": "John",
        "lastName": "Doe"
      },
      "completedLeads": {
        "count": 45,
        "status": "completed"
      },
      "salesUnit": {
        "id": 1,
        "name": "Sales Unit A"
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
- **Departments**: `Sales` department required
- **Admin Access**: Admins (admin, supermanager) have automatic access

---

## 9. Get All Sales Teams

### Method and Endpoint
- **Method**: `GET`
- **Endpoint**: `/sales/teams/all`

GET /sales/teams/all - Get all sales teams across all units
GET /sales/teams/all?salesUnitId=1 - Get teams from specific unit

### API Description and Flow
This API retrieves all teams in the Sales department with optional unit filtering. The flow includes:
1. Fetches all teams with team lead and sales unit information
2. Optionally filters by sales unit ID if provided
3. Calculates actual employee count for each team
4. Orders teams by sales unit name and team name
5. Returns comprehensive list of all teams

### Request Body/Parameters
- **Query Parameter**: `salesUnitId` (optional, number) - Sales Unit ID to filter teams
- **Request Body**: None

### Response Format

**Success Response (200) - All Teams:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Sales Team A",
      "teamLeadId": 123,
      "employeeCount": 6,
      "salesUnitId": 1,
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z",
      "teamLead": {
        "id": 123,
        "firstName": "John",
        "lastName": "Doe"
      },
      "salesUnit": {
        "id": 1,
        "name": "Sales Unit A"
      },
      "actualEmployeeCount": 6
    }
  ],
  "total": 1,
  "message": "All sales teams retrieved successfully"
}
```

**Success Response (200) - Filtered by Unit:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Sales Team A",
      "teamLeadId": 123,
      "employeeCount": 6,
      "salesUnitId": 1,
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:00:00Z",
      "teamLead": {
        "id": 123,
        "firstName": "John",
        "lastName": "Doe"
      },
      "salesUnit": {
        "id": 1,
        "name": "Sales Unit A"
      },
      "actualEmployeeCount": 6
    }
  ],
  "total": 1,
  "message": "Sales teams in unit retrieved successfully"
}
```

### Access Control
- **Authentication**: JWT token required
- **Roles**: `dep_manager` OR `unit_head` role required
- **Departments**: `Sales` department required
- **Admin Access**: Admins (admin, supermanager) have automatic access

---

## 10. Assign Team to New Sales Unit

### Method and Endpoint
- **Method**: `POST`
- **Endpoint**: `/sales/teams/assign`

### API Description and Flow
This API assigns a team to a sales unit. The flow includes:
1. Validates that the team exists
2. Validates that the sales unit exists
3. Checks if team is already assigned to this unit
4. Checks if team is assigned to another sales unit
5. Validates that team has a team lead assigned
6. Validates that team lead belongs to Sales department
7. Assigns team to the sales unit
8. Returns success response with assignment details

### Request Body
```json
{
  "teamId": "number (required)",
  "salesUnitId": "number (required)"
}
```

**Required Fields:**
- `teamId`: ID of the team to assign
- `salesUnitId`: ID of the sales unit to assign the team to

### Response Format

**Success Response (200):**
```json
{
  "success": true,
  "message": "Team \"Sales Team A\" successfully assigned to sales unit \"Sales Unit A\"",
  "data": {
    "teamId": 1,
    "teamName": "Sales Team A",
    "teamLead": {
      "id": 123,
      "firstName": "John",
      "lastName": "Doe"
    },
    "salesUnit": {
      "id": 1,
      "name": "Sales Unit A"
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
  "message": "Sales unit with ID 456 does not exist",
  "error": "Not Found"
}
```

**Conflict Errors (409):**
```json
{
  "statusCode": 409,
  "message": "Team is already assigned to this sales unit",
  "error": "Conflict"
}
```

```json
{
  "statusCode": 409,
  "message": "Team is already assigned to sales unit ID 2. Please unassign first.",
  "error": "Conflict"
}
```

**Bad Request Errors (400):**
```json
{
  "statusCode": 400,
  "message": "Team must have a team lead assigned before it can be assigned to a sales unit",
  "error": "Bad Request"
}
```

```json
{
  "statusCode": 400,
  "message": "Team lead must belong to Sales department. Current department: Production",
  "error": "Bad Request"
}
```

### Access Control
- **Authentication**: JWT token required
- **Roles**: `dep_manager` role required
- **Departments**: `Sales` department required
- **Admin Access**: Admins (admin, supermanager) have automatic access

---

## 11. Unassign Team from Previous Sales Unit

### Method and Endpoint
- **Method**: `DELETE`
- **Endpoint**: `/sales/teams/unassign/:teamId`

### API Description and Flow
This API unassigns a team from its current sales unit. The flow includes:
1. Validates that the team exists
2. Checks if team is assigned to any sales unit
3. Unassigns team from the sales unit (no restrictions)
4. Returns success response with unassignment details

### Request Body/Parameters
- **Path Parameter**: `teamId` (number) - Team ID to unassign
- **Request Body**: None

### Response Format

**Success Response (200):**
```json
{
  "success": true,
  "message": "Team \"Sales Team A\" successfully unassigned from sales unit \"Sales Unit A\"",
  "data": {
    "teamId": 1,
    "teamName": "Sales Team A",
    "teamLead": {
      "id": 123,
      "firstName": "John",
      "lastName": "Doe"
    },
    "previousUnit": {
      "id": 1,
      "name": "Sales Unit A"
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
  "message": "Team is not assigned to any sales unit",
  "error": "Bad Request"
}
```

### Access Control
- **Authentication**: JWT token required
- **Roles**: `dep_manager` role required
- **Departments**: `Sales` department required
- **Admin Access**: Admins (admin, supermanager) have automatic access

---

## 12. Get Teams in Sales Unit

### Method and Endpoint
- **Method**: `GET`
- **Endpoint**: `/sales/teams/unit/:id`

### API Description and Flow
This API retrieves all teams assigned to a specific sales unit. The flow includes:
1. Validates that the sales unit exists
2. Checks user permissions (unit_head can only access their own unit)
3. Fetches all teams assigned to the unit
4. Includes team lead details
5. Calculates actual employee count for each team
6. Orders teams alphabetically by name
7. Returns formatted response with team data

### Path Parameters
- `id` (required, number): Sales Unit ID

### Response Format

**Success Response with Teams (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Sales Team A",
      "teamLead": {
        "id": 123,
        "firstName": "John",
        "lastName": "Doe"
      },
      "employeeCount": 6,
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z",
      "actualEmployeeCount": 6
    }
  ],
  "total": 1,
  "message": "Teams retrieved successfully"
}
```

**Success Response - No Teams (200):**
```json
{
  "success": true,
  "data": [],
  "total": 0,
  "message": "No teams found in this unit"
}
```

**Error Responses:**

**Unit Not Found (200):**
```json
{
  "success": false,
  "message": "Unit with ID 999 does not exist"
}
```

**Access Denied (200):**
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
  "message": "User does not belong to required departments. Required: Sales. User department: HR",
  "error": "Forbidden"
}
```

### Access Control
- **Authentication**: JWT token required
- **Roles**: `dep_manager` OR `unit_head` role required
- **Departments**: `Sales` department required
- **Admin Access**: Admins (admin, supermanager) have automatic access
- **Unit Head Access**: ✅ **ALLOWED** - Can access their own unit only

---

## 13. Get Available Teams No Unit 

### Method and Endpoint
- **Method**: `GET`
- **Endpoint**: `/sales/teams/available`

### API Description and Flow
This API retrieves all teams that are available for assignment to sales units. The flow includes:
1. Fetches all teams not assigned to any sales unit
2. Filters teams that have a team lead assigned
3. Filters teams where team lead belongs to Sales department
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
      "employeeCount": 5,
      "salesUnitId": null,
      "createdAt": "2024-01-20T14:30:00Z",
      "updatedAt": "2024-01-20T14:30:00Z",
      "teamLead": {
        "id": 456,
        "firstName": "Jane",
        "lastName": "Smith",
        "department": {
          "name": "Sales"
        }
      },
      "actualEmployeeCount": 5
    }
  ],
  "total": 1,
  "message": "Available sales teams retrieved successfully"
}
```

**Success Response - No Available Teams (200):**
```json
{
  "success": true,
  "data": [],
  "total": 0,
  "message": "No available sales teams found"
}
```

### Access Control
- **Authentication**: JWT token required
- **Roles**: `dep_manager` role required
- **Departments**: `Sales` department required
- **Admin Access**: Admins (admin, supermanager) have automatic access

---



---

## Business Rules

### Team Creation Rules:
1. **Team Name Uniqueness**: Team names must be unique within each sales unit
2. **Team Lead Required**: Every team must have a team lead assigned
3. **Sales Department**: Team lead must belong to Sales department
4. **Team Lead Role**: Only employees with `team_lead` role can be assigned as team leads
5. **One Team Lead Per Team**: A team lead can only lead one team at a time
6. **Unit Assignment**: Teams must be created within a specific sales unit

### Team Lead Management Rules:
1. **Team Lead Replacement**: Team leads can be replaced but never removed
2. **Member Transfer**: All team members automatically follow the new team lead
3. **Sales Department**: New team lead must belong to Sales department
4. **Team Lead Role**: Only employees with `team_lead` role can be assigned as team leads

### Employee Assignment Rules:
1. **One Team Per Employee**: An employee can only be in one team at a time
2. **Sales Department**: All team members must belong to Sales department
3. **Team Member Role**: Only employees with `senior` or `junior` role can be added to teams
4. **Team Lead Protection**: Team lead cannot be removed (use replace-lead instead)
5. **Completed Leads Check**: Employee cannot be removed if they have completed leads
6. **Auto Count Update**: Employee count is automatically updated on add/remove (includes team lead + team members)

### **CRITICAL SECURITY RULES:**
1. **Sales Team Validation**: ALL team operations (add, remove, replace lead, unassign, view details) ONLY work with teams that:
   - Have `salesUnitId` set (assigned to a Sales unit)
   - Have a team lead assigned
   - Team lead belongs to Sales department
2. **Cross-Department Protection**: Sales Teams API CANNOT access, modify, or view Production teams
3. **Unit Isolation**: Each API call validates that the target team is a legitimate Sales team
4. **Department Boundary**: All operations are strictly limited to Sales department data

### Team Success Metrics:
1. **Completed Leads**: Team performance is measured by the completed leads count stored in the database
2. **Performance Tracking**: The completed leads field is maintained separately and displayed in team details
3. **Team Evaluation**: Teams are evaluated based on their completed leads counter

### Unit Assignment Rules:
1. **One Unit Per Team**: A team can only be assigned to one sales unit at a time
2. **Team Lead Required**: Team must have a team lead before unit assignment
3. **No Duplicate Assignment**: Team cannot be assigned to the same unit twice

### Validation Hierarchy:
1. **Existence Check**: Team, unit, and employee must exist
2. **Security Validation**: Ensure team is a Sales team (salesUnitId + Sales department team lead)
3. **Department Validation**: All team members must belong to Sales department
4. **Assignment Status**: Check current assignment status
5. **Business Logic**: Apply department and role restrictions
6. **Data Integrity**: Ensure no orphaned relationships

---

## Access Control Matrix

| Action | dep_manager | unit_head | team_lead | senior/junior |
|--------|-------------|-----------|-----------|---------------|
| Create Team | ✅ | ✅ | ❌ | ❌ |
| Replace Team Lead | ✅ | ✅ | ❌ | ❌ |
| Add Team Member | ✅ | ✅ | ❌ | ❌ |
| Remove Team Member | ✅ | ✅ | ❌ | ❌ |
| Unassign All From Team | ✅ | ✅ | ❌ | ❌ |
| Delete Team | ✅ | ❌ | ❌ | ❌ |
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
- `sales_units` table (read - for unit validation)
- `leads` table (read - for lead validation and success metrics)

### Key Relationships:
- **Team Lead**: `Team.teamLeadId` → `Employee.id`
- **Team Membership**: `Employee.teamLeadId` → `Team.teamLeadId`
- **Unit Assignment**: `Team.salesUnitId` → `SalesUnit.id`
- **Lead Assignment**: `Lead.assignedToId` → `Employee.id`

### Database Queries:
1. **Team Creation**: INSERT into teams table
2. **Team Lead Replacement**: UPDATE teams and employees tables
3. **Employee Assignment**: UPDATE employees table
4. **Team Queries**: SELECT with JOINs for comprehensive data
5. **Completed Leads**: READ from team's completedLeads field for performance metrics

---

## Redundancy Reduction

### Combined APIs:
- **"Get All Sales Teams" + "Get Teams in Unit"**: Combined into one API with optional `salesUnitId` query parameter for filtering
- **Benefits**: Reduces API endpoints while maintaining functionality
- **Usage**: 
  - `/sales/teams/all` - Gets all teams
  - `/sales/teams/all?salesUnitId=1` - Gets teams in specific unit

### Separate APIs (as requested):
- **"Get Team Details" + "Get Employee's Team"**: Kept separate as requested by user
- **Reasoning**: Different use cases and data requirements

---

*This documentation covers all implemented team management APIs for the Sales Teams module, following the same pattern as Production Teams but adapted for sales-specific business logic.* 

### Employee Count Logic:
1. **Team Lead Assignment**: When assigning a team lead to a team with no team lead, employee count = 1 (team lead only)
2. **Team Member Addition**: When adding team members, employee count = team lead (1) + team members count
3. **Team Member Removal**: When removing team members, employee count = team lead (1) + remaining team members count
4. **Team Lead Replacement**: Employee count remains the same (team lead + team members)
5. **Unassign All**: Employee count = 0 (no team lead, no members)

**Note**: Employee count always includes the team lead (counts as 1) plus any team members who follow that team lead. 