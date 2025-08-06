# Sales Teams API Documentation

This document contains all the APIs for the Sales Teams module.

---

## 1. Get Teams in Unit

### Method and Endpoint
- **Method**: `GET`
- **Endpoint**: `/sales/teams/unit/:id`

### API Description and Flow
This API retrieves all teams associated with a specific sales unit. The flow includes:
1. Validates that the unit exists
2. Checks user permissions (unit_head can only access their own unit)
3. Retrieves teams associated with the unit
4. Returns formatted team data with team lead and current project information

### Path Parameters
- `id` (required, number): Unit ID

### Response Format

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Team Alpha",
      "teamLead": {
        "id": 123,
        "firstName": "John",
        "lastName": "Doe"
      },
      "currentProject": {
        "id": 456,
        "description": "Website Development",
        "liveProgress": 75.5,
        "deadline": "2024-12-31T00:00:00.000Z"
      },
      "employeeCount": 5,
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z"
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

### Validations
- **Unit Validation**: Unit must exist in the database
- **Access Control**: Unit heads can only access their own unit
- **No request body validation required**

### Business Logic
1. **Unit Existence Check**: Validates that the unit exists
2. **Access Control**: 
   - `dep_manager` can access any unit
   - `unit_head` can only access their own unit (where they are the head)
3. **Data Retrieval**: Gets teams with team lead and current project details
4. **Data Formatting**: Returns formatted team information

### Database Operations

**Tables Accessed:**
- `sales_units` table (read - for unit validation)
- `teams` table (read - for team data)
- `employees` table (read - for team lead details)
- `projects` table (read - for current project details)

**Database Changes:**
- **No changes** - read-only operation

**Database Queries:**
1. **SELECT** from `sales_units` for unit validation
2. **SELECT** from `teams` with JOINs to `employees` and `projects`
3. **WHERE** salesUnitId = provided unit ID
4. **ORDER BY** name ascending

### Access Control
- **Authentication**: JWT token required
- **Roles**: `dep_manager` or `unit_head` role required
- **Departments**: `Sales` department required
- **Admin Access**: Admins (admin, supermanager) have automatic access
- **Unit Head Access**: ✅ **ALLOWED** - Can access their own unit only

---

## Planned APIs

### Core Team CRUD Operations
- Create Team
- Get All Teams
- Get Team by ID
- Update Team
- Delete Team

### Team-Unit Assignment Operations
- Assign Team to Unit
- Unassign Team from Unit

### Team Member Management
- Add Employee to Team
- Remove Employee from Team
- Get Team Members
- Update Team Lead

### Team Project Management
- Assign Project to Team
- Unassign Project from Team
- Get Team Projects

### Team Analytics/Reports
- Get Team Performance
- Get Team Statistics

---

*This documentation will be updated as new APIs are added to the teams module.* 