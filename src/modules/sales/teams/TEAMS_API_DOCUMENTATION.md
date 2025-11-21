# Sales Teams API Documentation

This document contains all the APIs for the Sales Teams module.

**Total Endpoints: 10**

## 1. Create Team

### Method and Endpoint
- **Method**: `POST`
- **Endpoint**: `/sales/teams`

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

**Success Response (201):**
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

## 2. Get All Sales Teams (Advanced Filtering)

### Method and Endpoint
- **Method**: `GET`
- **Endpoint**: `/sales/teams`

### API Description and Flow
This API retrieves all sales teams with advanced filtering, pagination, and search capabilities. The flow includes:
1. Applies role-based access control (dep_manager sees all, unit_head sees their units, team_lead/senior/junior see their teams)
2. Applies advanced filtering based on query parameters
3. Supports pagination, sorting, and search
4. Returns comprehensive team data with performance metrics

### Query Parameters (All Optional)
- `teamId`: Filter by specific team ID
- `salesUnitId`: Filter by sales unit ID
- `hasLead`: Filter teams with/without team leads
- `hasMembers`: Filter teams with/without members
- `hasLeads`: Filter teams with/without leads
- `teamName`: Search by team name (partial match)
- `leadEmail`: Search by team lead email
- `leadName`: Search by team lead name
- `unitName`: Search by unit name
- `minMembers`/`maxMembers`: Filter by member count range
- `minCompletedLeads`/`maxCompletedLeads`: Filter by completed leads range
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10, max: 100)
- `sortBy`: Sort field (name, createdAt, updatedAt, employeeCount, completedLeads)
- `sortOrder`: Sort direction (asc, desc)
- `search`: Global search across team name, lead name, unit name
- `assigned`: Filter assigned/unassigned teams
- `include`: Include related data (members, leads, unit, lead)

### Response Format

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Alpha Sales Team",
      "teamLeadId": 123,
      "salesUnitId": 1,
      "employeeCount": 5,
      "completedLeads": 15,
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z",
      "teamLead": {
        "id": 123,
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@company.com",
        "phone": "+1 (555) 123-4567",
        "role": {
          "id": 3,
          "name": "team_lead"
        }
      },
      "salesUnit": {
        "id": 1,
        "name": "North Region",
        "email": "north@company.com",
        "phone": "+1 (555) 987-6543"
      },
      "membersCount": 4,
      "leadsCount": 25,
      "completedLeadsCount": 15,
      "actualEmployeeCount": 4
    }
  ],
  "total": 5,
  "pagination": {
    "page": 1,
    "limit": 10,
    "totalPages": 1,
    "hasNext": false,
    "hasPrev": false
  },
  "message": "Teams retrieved successfully"
}
```

### Access Control
- **Authentication**: JWT token required
- **Roles**: `dep_manager`, `unit_head`, `team_lead`, `senior`, `junior` role required
- **Departments**: `Sales` department required
- **Admin Access**: Admins (admin, supermanager) have automatic access

---

## 3. Get Available Team Leads

### Method and Endpoint
- **Method**: `GET`
- **Endpoint**: `/sales/teams/available-leads`

### API Description and Flow
This API retrieves all available team leads for assignment to teams. The flow includes:
1. Fetches employees with `team_lead` role from Sales department
2. Optionally filters by assignment status (assigned/unassigned)
3. Includes current team information for assigned leads
4. Returns formatted list of available team leads

### Query Parameters (Optional)
- `assigned`: Filter by assignment status (true/false)

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
      "email": "john@company.com",
      "phone": "+1 (555) 123-4567",
      "role": {
        "id": 3,
        "name": "team_lead"
      },
      "department": {
        "id": 1,
        "name": "Sales"
      },
      "currentTeam": null,
      "isAssigned": false
    }
  ],
  "total": 5,
  "message": "Available team leads retrieved successfully"
}
```

### Access Control
- **Authentication**: JWT token required
- **Roles**: `dep_manager`, `unit_head` role required
- **Departments**: `Sales` department required
- **Admin Access**: Admins (admin, supermanager) have automatic access

---

## 4. Get Available Employees

### Method and Endpoint
- **Method**: `GET`
- **Endpoint**: `/sales/teams/available-employees`

### API Description and Flow
This API retrieves all available employees for team assignment. The flow includes:
1. Fetches employees with `senior` or `junior` role from Sales department
2. Optionally filters by assignment status (assigned/unassigned)
3. Includes current team information for assigned employees
4. Returns formatted list of available employees

### Query Parameters (Optional)
- `assigned`: Filter by assignment status (true/false)

### Response Format

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 124,
      "firstName": "Jane",
      "lastName": "Smith",
      "email": "jane@company.com",
      "phone": "+1 (555) 456-7890",
      "role": {
        "id": 4,
        "name": "senior"
      },
      "department": {
        "id": 1,
        "name": "Sales"
      },
      "currentTeam": null,
      "isAssigned": false
    }
  ],
  "total": 15,
  "message": "Available employees retrieved successfully"
}
```

### Access Control
- **Authentication**: JWT token required
- **Roles**: `dep_manager`, `unit_head`, `team_lead` role required
- **Departments**: `Sales` department required
- **Admin Access**: Admins (admin, supermanager) have automatic access

---

## 5. Get Team by ID

### Method and Endpoint
- **Method**: `GET`
- **Endpoint**: `/sales/teams/:id`

### API Description and Flow
This API retrieves detailed information about a specific team including team members, leads, and performance metrics. The flow includes:
1. Validates that the team exists and is a Sales team
2. Applies role-based access control
3. Retrieves team details, members, active leads, and completed leads
4. Returns comprehensive team information with performance data

### Response Format

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Alpha Sales Team",
    "teamLeadId": 123,
    "salesUnitId": 1,
    "employeeCount": 5,
    "completedLeads": 15,
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z",
    "teamLead": {
      "id": 123,
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@company.com",
      "phone": "+1 (555) 123-4567",
      "role": {
        "id": 3,
        "name": "team_lead"
      }
    },
    "salesUnit": {
      "id": 1,
      "name": "North Region",
      "email": "north@company.com",
      "phone": "+1 (555) 987-6543",
      "address": "123 Business St, City"
    },
    "members": [
      {
        "id": 124,
        "firstName": "Jane",
        "lastName": "Smith",
        "email": "jane@company.com",
        "phone": "+1 (555) 456-7890",
        "role": {
          "id": 4,
          "name": "senior"
        }
      }
    ],
    "leads": [
      {
        "id": 1,
        "name": "Lead Prospect",
        "email": "prospect@example.com",
        "phone": "+1 (555) 111-2222",
        "source": "PPC",
        "type": "warm",
        "status": "in_progress",
        "createdAt": "2024-01-20T10:00:00Z",
        "assignedTo": {
          "id": 124,
          "firstName": "Jane",
          "lastName": "Smith"
        }
      }
    ],
    "completedLeads": [
      {
        "id": 1,
        "crackedAt": "2024-01-20T14:30:00Z",
        "amount": 5000.00,
        "lead": {
          "id": 2,
          "name": "Converted Lead",
          "email": "converted@example.com",
          "phone": "+1 (555) 333-4444"
        },
        "employee": {
          "id": 124,
          "firstName": "Jane",
          "lastName": "Smith"
        }
      }
    ],
    "summary": {
      "membersCount": 4,
      "leadsCount": 25,
      "completedLeadsCount": 15,
      "conversionRate": 60.0
    }
  },
  "message": "Team details retrieved successfully"
}
```

### Access Control
- **Authentication**: JWT token required
- **Roles**: `dep_manager`, `unit_head`, `team_lead`, `senior`, `junior` role required
- **Departments**: `Sales` department required
- **Admin Access**: Admins (admin, supermanager) have automatic access

---

## 6. Update Team (Can also replace team lead)

### Method and Endpoint
- **Method**: `PATCH`
- **Endpoint**: `/sales/teams/:id`

### API Description and Flow
This API updates team information and can also replace the team lead. The flow includes:
1. Validates that the team exists and is a Sales team
2. Applies role-based access control
3. Updates team name (if provided) with uniqueness validation
4. Updates team lead (if provided) with member transfer
5. Updates sales unit assignment (if provided)
6. Returns success response with updated team details

### Request Body (All fields optional)
```json
{
  "name": "Enhanced Alpha Team",
  "teamLeadId": 456,
  "salesUnitId": 2
}
```

**Optional Fields:**
- `name`: New team name (must be unique within the unit)
- `teamLeadId`: New team lead ID (transfers all members to new lead)
- `salesUnitId`: New sales unit assignment

### Response Format

**Success Response (200) - Regular Update:**
```json
{
  "success": true,
  "message": "Team updated successfully",
  "data": {
    "id": 1,
    "name": "Enhanced Alpha Team",
    "teamLeadId": 456,
    "salesUnitId": 2,
    "teamLead": {
      "id": 456,
      "firstName": "Mike",
      "lastName": "Johnson",
      "email": "mike@company.com"
    },
    "salesUnit": {
      "id": 2,
      "name": "South Region"
    }
  }
}
```

**Success Response (200) - Team Lead Replacement:**
```json
{
  "success": true,
  "message": "Team updated successfully. Team lead replaced and 3 team member(s) transferred to new leader.",
  "data": {
    "id": 1,
    "name": "Enhanced Alpha Team",
    "teamLeadId": 456,
    "salesUnitId": 2,
    "teamLead": {
      "id": 456,
      "firstName": "Mike",
      "lastName": "Johnson",
      "email": "mike@company.com"
    },
    "salesUnit": {
      "id": 2,
      "name": "South Region"
    }
  }
}
```

### Access Control
- **Authentication**: JWT token required
- **Roles**: `dep_manager`, `unit_head`, `team_lead` role required
- **Departments**: `Sales` department required
- **Admin Access**: Admins (admin, supermanager) have automatic access

---

## 7. Add Members to Team (Bulk Operation)

### Method and Endpoint
- **Method**: `POST`
- **Endpoint**: `/sales/teams/:id/members`

### API Description and Flow
This API adds multiple employees to a team in a single operation. The flow includes:
1. Validates that the team exists and is a Sales team
2. Applies role-based access control
3. Processes each employee ID in the array
4. Validates each employee and adds them to the team
5. Returns detailed results showing successful and failed additions

### Request Body
```json
{
  "employeeIds": [124, 125, 126]
}
```

**Required Fields:**
- `employeeIds`: Array of employee IDs to add (1-20 employees per request)

### Response Format

**Success Response (201):**
```json
{
  "success": true,
  "message": "Added 2 members to team. 1 failed.",
  "data": {
    "successful": [
      {
        "success": true,
        "message": "Employee Jane Smith added to team successfully"
      },
      {
        "success": true,
        "message": "Employee Bob Johnson added to team successfully"
      }
    ],
    "failed": [
      {
        "employeeId": 126,
        "error": "Employee is already in another team"
      }
    ],
    "totalProcessed": 3,
    "successCount": 2,
    "failureCount": 1
  }
}
```

### Access Control
- **Authentication**: JWT token required
- **Roles**: `dep_manager`, `unit_head`, `team_lead` role required
- **Departments**: `Sales` department required
- **Admin Access**: Admins (admin, supermanager) have automatic access

---

## 8. Add Single Employee to Team

### Method and Endpoint
- **Method**: `POST`
- **Endpoint**: `/sales/teams/:teamId/add-employee`

### API Description and Flow
This API adds an employee to a sales team. The flow includes:
1. Validates that the team exists and is assigned to a Sales unit
2. Validates that employee exists and belongs to Sales department
3. Checks if team has no team lead and employee has `team_lead` role → Employee becomes team lead
4. If team already has team lead → Employee is added as regular member (requires `senior` or `junior` role)
5. Ensures employee isn't already in another team
6. Updates employee's `teamLeadId` and team's employee count
7. Returns success response with team details and action performed

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

### Access Control
- **Authentication**: JWT token required
- **Roles**: `dep_manager` OR `unit_head` role required
- **Departments**: `Sales` department required
- **Admin Access**: Admins (admin, supermanager) have automatic access

---

## 9. Remove Member from Team

### Method and Endpoint
- **Method**: `DELETE`
- **Endpoint**: `/sales/teams/:id/members/:employeeId`

### API Description and Flow
This API removes an employee from a team. The flow includes:
1. Validates that the team exists and is a Sales team
2. Applies role-based access control
3. Validates that employee exists
4. Checks if employee is the team lead (cannot remove team lead)
5. Checks if employee is actually in this team
6. Checks if employee has completed leads (blocks removal if completed leads exist)
7. Removes employee from team by setting teamLeadId to null
8. Updates team employee count and project associations
9. Returns success response with removal details

### Response Format

**Success Response (200):**
```json
{
  "success": true,
  "message": "Employee \"Jane Smith\" successfully removed from team \"Alpha Sales Team\" and all team projects",
  "data": {
    "teamId": 1,
    "teamName": "Alpha Sales Team",
    "removedEmployee": {
      "id": 124,
      "firstName": "Jane",
      "lastName": "Smith"
    },
    "newEmployeeCount": 5,
    "projectsUpdated": 3
  }
}
```

### Access Control
- **Authentication**: JWT token required
- **Roles**: `dep_manager`, `unit_head`, `team_lead` role required
- **Departments**: `Sales` department required
- **Admin Access**: Admins (admin, supermanager) have automatic access

---

## 10. Delete Team

### Method and Endpoint
- **Method**: `DELETE`
- **Endpoint**: `/sales/teams/:id`

### API Description and Flow
This API deletes a team. The flow includes:
1. Validates that the team exists
2. Checks if team has employees or team lead assigned
3. If team has employees/team lead, returns detailed response with assignment info (doesn't delete)
4. If no blocking issues, deletes the team
5. Returns success response with deletion details

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

## Removed APIs (No Longer Available)

The following APIs have been removed as they were redundant or should be handled by the Units API:

1. **❌ UNASSIGN ALL EMPLOYEES FROM TEAM** - `POST /sales/teams/:teamId/unassign-employees`
2. **❌ GET TEAMS IN SALES UNIT** - `GET /sales/teams/unit/:id`
3. **❌ GET TEAM DETAILS (Legacy)** - `GET /sales/teams/details/:teamId`
4. **❌ GET EMPLOYEE'S TEAM** - `GET /sales/teams/employee/:employeeId`
5. **❌ ASSIGN TEAM TO SALES UNIT** - `POST /sales/teams/assign`
6. **❌ UNASSIGN TEAM FROM SALES UNIT** - `DELETE /sales/teams/unassign/:teamId`
7. **❌ GET AVAILABLE TEAMS** - `GET /sales/teams/available`

**Reasoning for Removal:**
- **Bulk Unassign**: Redundant with individual member removal
- **Unit Management**: Should be handled by Units API
- **Legacy Endpoints**: Redundant with enhanced endpoints
- **Employee Team Lookup**: Not needed as specified
- **Team-Unit Assignment**: Should be managed through Units API

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
| Update Team (Replace Lead) | ✅ | ✅ | ❌ | ❌ |
| Add Team Member | ✅ | ✅ | ❌ | ❌ |
| Remove Team Member | ✅ | ✅ | ❌ | ❌ |
| Delete Team | ✅ | ❌ | ❌ | ❌ |
| View Team Details | ✅ | ✅ | ✅ | ✅ |
| View All Teams | ✅ | ✅ | ✅ | ✅ |
| Get Available Leads | ✅ | ✅ | ❌ | ❌ |
| Get Available Employees | ✅ | ✅ | ❌ | ❌ |

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

## Employee Count Logic:
1. **Team Lead Assignment**: When assigning a team lead to a team with no team lead, employee count = 1 (team lead only)
2. **Team Member Addition**: When adding team members, employee count = team lead (1) + team members count
3. **Team Member Removal**: When removing team members, employee count = team lead (1) + remaining team members count
4. **Team Lead Replacement**: Employee count remains the same (team lead + team members)
5. **Unassign All**: Employee count = 0 (no team lead, no members)

**Note**: Employee count always includes the team lead (counts as 1) plus any team members who follow that team lead.

*This documentation covers all implemented team management APIs for the Sales Teams module, following the same pattern as Production Teams but adapted for sales-specific business logic.*