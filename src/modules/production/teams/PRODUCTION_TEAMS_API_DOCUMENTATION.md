# Production Teams API Documentation

## Overview
The Production Teams API provides comprehensive management of production teams within the CRM system. Teams are organizational units that contain employees and work on projects, managed by team leads within production units.

## Authentication & Authorization
- **Authentication**: JWT Bearer token required
- **Department**: All endpoints require Production department access
- **Roles**: Different endpoints have different role requirements

## API Endpoints

| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| POST | `/production/teams` | dep_manager, unit_head | Create a new production team |
| GET | `/production/teams` | dep_manager, unit_head, team_lead, senior, junior | Get teams with role-based filtering |
| GET | `/production/teams/:id` | dep_manager, unit_head, team_lead, senior, junior | Get specific team details |
| PATCH | `/production/teams/:id` | dep_manager, unit_head, team_lead | Update team information |
| DELETE | `/production/teams/:id` | dep_manager | Delete a team |
| GET | `/production/teams/available-leads` | dep_manager, unit_head | Get available team leads |
| GET | `/production/teams/available-employees` | dep_manager, unit_head, team_lead | Get available employees |
| POST | `/production/teams/:id/members` | dep_manager, unit_head, team_lead | Add members to team |
| DELETE | `/production/teams/:id/members/:employeeId` | dep_manager, unit_head, team_lead | Remove member from team |

## Role-Based Access Control

### Department Manager (dep_manager)
- **Teams List**: Can see all teams in the system
- **Team Details**: Can see all members and projects in any team
- **Team Management**: Can create, update, and delete any team
- **Member Management**: Can add/remove members from any team

### Unit Head (unit_head)
- **Teams List**: Can see only teams in their production unit
- **Team Details**: Can see all members and projects in teams within their unit
- **Team Management**: Can create and update teams in their unit only
- **Member Management**: Can add/remove members from teams in their unit

### Team Lead (team_lead)
- **Teams List**: Can see only teams they lead
- **Team Details**: Can see all members and projects in their team
- **Team Management**: Can update their own team only
- **Member Management**: Can add/remove members from their team

### Senior/Junior (senior, junior)
- **Teams List**: Can see only teams they belong to
- **Team Details**: Can see all members and projects in their team
- **Team Management**: No management permissions
- **Member Management**: No member management permissions

## API Endpoints Details

### 1. Create Team
**POST** `/production/teams`

Creates a new production team with team lead assignment.

**Request Body:**
```json
{
  "name": "Development Team A",
  "teamLeadId": 123,
  "productionUnitId": 1
}
```

**Response:**
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

**Validation Rules:**
- Team name must be unique
- Team lead must exist and have 'team_lead' role
- Team lead must be in Production department
- Team lead must be active
- Team lead cannot already be leading another team
- Production unit must exist

### 2. Get Teams
**GET** `/production/teams`

Retrieves teams based on user role with filtering, pagination, and sorting.

**Query Parameters:**
- `teamId` (number): Get specific team by ID
- `unitId` (number): Filter by production unit ID
- `hasLead` (boolean): Filter teams with/without leads
- `hasMembers` (boolean): Filter teams with/without members
- `hasProjects` (boolean): Filter teams with/without projects
- `teamName` (string): Filter by team name (partial match)
- `leadEmail` (string): Filter by team lead email
- `leadName` (string): Filter by team lead name
- `unitName` (string): Filter by production unit name
- `minMembers` (number): Minimum number of members
- `maxMembers` (number): Maximum number of members
- `minProjects` (number): Minimum number of projects
- `maxProjects` (number): Maximum number of projects
- `page` (number): Page number for pagination
- `limit` (number): Items per page
- `sortBy` (string): Sort field (name, createdAt, updatedAt, employeeCount)
- `sortOrder` (string): Sort order (asc, desc)

**Response:**
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
  "total": 10,
  "pagination": {
    "page": 1,
    "limit": 10,
    "totalPages": 1
  },
  "message": "Teams retrieved successfully"
}
```

### 3. Get Team Details
**GET** `/production/teams/:id`

Retrieves detailed information about a specific team including members and projects.

**Response:**
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

### 4. Update Team
**PATCH** `/production/teams/:id`

Updates team information (name and/or team lead).

**Request Body:**
```json
{
  "name": "Advanced Development Team",
  "teamLeadId": 125
}
```

**Response:**
```json
{
  "success": true,
  "message": "Team updated successfully"
}
```

**Validation Rules:**
- At least one field must be provided
- Team name must be unique (if provided)
- New team lead must exist and have 'team_lead' role
- New team lead must be in Production department
- New team lead cannot already be leading another team
- Cannot remove team lead if team has active projects

### 5. Delete Team
**DELETE** `/production/teams/:id`

Deletes a team if it has no members and no projects.

**Success Response:**
```json
{
  "success": true,
  "message": "Team deleted successfully"
}
```

**Error Response (with dependencies):**
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

### 6. Get Available Team Leads
**GET** `/production/teams/available-leads`

Retrieves employees who can be assigned as team leads.

**Query Parameters:**
- `assigned` (boolean): Filter by assignment status (true/false)

**Response:**
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
    }
  ],
  "total": 5,
  "message": "Available team leads retrieved successfully"
}
```

### 7. Get Available Employees
**GET** `/production/teams/available-employees`

Retrieves employees who can be added to teams.

**Query Parameters:**
- `assigned` (boolean): Filter by assignment status (true/false)

**Response:**
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
    }
  ],
  "total": 10,
  "message": "Available employees retrieved successfully"
}
```

### 8. Add Members to Team
**POST** `/production/teams/:id/members`

Adds multiple employees to a team and integrates them with team projects.

**Request Body:**
```json
{
  "employeeIds": [124, 125, 126]
}
```

**Response:**
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

**Integration Features:**
- Automatically adds employees to all team project chats
- Automatically adds employees to all team project logs
- Updates team employee count
- Updates project chat participant counts

### 9. Remove Member from Team
**DELETE** `/production/teams/:id/members/:employeeId`

Removes an employee from a team and all team projects.

**Response:**
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

**Integration Features:**
- Automatically removes employee from all team project chats
- Automatically removes employee from all team project logs
- Updates team employee count
- Updates project chat participant counts
- Prevents removal if employee has active tasks

## Error Handling

### Common Error Responses

**400 Bad Request:**
```json
{
  "statusCode": 400,
  "message": "Team name already exists",
  "error": "Bad Request"
}
```

**403 Forbidden:**
```json
{
  "statusCode": 403,
  "message": "You do not have access to this team. You must be a member of this team to view its details.",
  "error": "Forbidden"
}
```

**404 Not Found:**
```json
{
  "statusCode": 404,
  "message": "Team with ID 999 does not exist",
  "error": "Not Found"
}
```

**409 Conflict:**
```json
{
  "statusCode": 409,
  "message": "Employee John Doe (ID: 123) is already leading team \"Other Team\" (ID: 2). Each employee can only lead one team at a time.",
  "error": "Conflict"
}
```

## Team Member Management Logic

### Team Membership
- **Team Members**: Employees where `teamLeadId` matches the team's `teamLeadId`
- **Team Lead**: Employee assigned as `teamLeadId` in the team record
- **Member Count**: Count of employees with matching `teamLeadId`

### Project Integration
- **Adding Members**: Automatically adds to all team project chats and logs
- **Removing Members**: Automatically removes from all team project chats and logs
- **Chat Participants**: Updates `ChatParticipant` table and chat participant counts
- **Project Logs**: Updates `ProjectLog` table for team projects

### Role-Based Data Access
- **Department Manager**: Sees all teams, members, and projects
- **Unit Head**: Sees teams in their unit, all members and projects
- **Team Lead**: Sees their team, all members and projects
- **Senior/Junior**: Sees their team, all members and projects

## Frontend Integration Examples

### Team Management Dashboard
```javascript
// Get teams for current user
const teams = await fetch('/api/production/teams', {
  headers: { 'Authorization': `Bearer ${token}` }
});

// Create new team
const newTeam = await fetch('/api/production/teams', {
  method: 'POST',
  headers: { 
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'New Development Team',
    teamLeadId: 123,
    productionUnitId: 1
  })
});

// Add members to team
const addMembers = await fetch('/api/production/teams/1/members', {
  method: 'POST',
  headers: { 
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    employeeIds: [124, 125, 126]
  })
});
```

### Available Resources Dropdown
```javascript
// Get available team leads
const availableLeads = await fetch('/api/production/teams/available-leads', {
  headers: { 'Authorization': `Bearer ${token}` }
});

// Get available employees
const availableEmployees = await fetch('/api/production/teams/available-employees', {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

## Testing Examples

### Test Team Creation
```bash
curl -X POST http://localhost:3000/api/production/teams \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Development Team",
    "teamLeadId": 123,
    "productionUnitId": 1
  }'
```

### Test Team Listing with Filters
```bash
curl -X GET "http://localhost:3000/api/production/teams?hasMembers=true&page=1&limit=5" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Test Member Management
```bash
# Add members
curl -X POST http://localhost:3000/api/production/teams/1/members \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"employeeIds": [124, 125]}'

# Remove member
curl -X DELETE http://localhost:3000/api/production/teams/1/members/124 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```