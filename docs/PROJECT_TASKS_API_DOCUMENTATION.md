# Project Tasks API Documentation

## Overview
The Project Tasks API provides comprehensive task management functionality within projects. It supports role-based access control, status transitions, and hierarchical task assignment within the Production department.

## Authentication & Authorization

### Guards
- **`JwtAuthGuard`**: Ensures user is authenticated
- **`DepartmentsGuard`**: Restricts access to Production department only
- **`RolesGuard`**: Role-based access control

### Role-Based Access Matrix

| Role | Create Tasks | Update Tasks | Complete/Cancel | View Tasks | Change Status |
|------|-------------|--------------|-----------------|------------|---------------|
| **Department Manager** | ✅ | ✅ | ✅ | All Dept Tasks | All Statuses |
| **Unit Head** | ✅ | ✅ | ✅ | All Unit Tasks | All Statuses |
| **Team Lead** | ✅ | ✅ | ✅ | Team Tasks | All Statuses |
| **Senior/Junior** | ❌ | ❌ | ❌ | Own Tasks | Limited (in_progress, review) |

## API Endpoints

### 1. Create Project Task
**`POST /projects/:projectId/tasks`**

Creates a new task within a project. Only team leads, unit heads, and department managers can create tasks.

#### Request Body
```json
{
  "title": "Implement user authentication",
  "description": "Add JWT-based authentication to the API",
  "assignedTo": 123,
  "priority": "high",
  "difficulty": "medium",
  "dueDate": "2024-02-15T00:00:00.000Z",
  "comments": "Please ensure proper error handling"
}
```

#### Required Fields
- `title`: Task title (string)
- `assignedTo`: Employee ID to assign task to (number)
- `priority`: Task priority (enum: low, medium, high, critical)
- `difficulty`: Task difficulty (enum: easy, medium, hard, difficult)
- `dueDate`: Due date (ISO string, must be in future)

#### Optional Fields
- `description`: Task description (string)
- `comments`: Initial comments (string)

#### Response
```json
{
  "success": true,
  "message": "Task created successfully",
  "data": {
    "id": 1,
    "projectId": 5,
    "title": "Implement user authentication",
    "description": "Add JWT-based authentication to the API",
    "assignedBy": 456,
    "assignedTo": 123,
    "priority": "high",
    "status": "not_started",
    "difficulty": "medium",
    "startDate": null,
    "dueDate": "2024-02-15T00:00:00.000Z",
    "completedOn": null,
    "comments": "Please ensure proper error handling",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z",
    "project": { ... },
    "assigner": { ... },
    "assignee": { ... }
  }
}
```

### 2. Get Project Tasks
**`GET /projects/:projectId/tasks`**

Retrieves all tasks for a project with role-based filtering and optional query parameters.

#### Query Parameters
- `status`: Filter by task status (enum: not_started, in_progress, review, completed, cancelled)
- `assignedTo`: Filter by assigned employee ID (number)
- `priority`: Filter by priority (enum: low, medium, high, critical)
- `sortBy`: Sort field (enum: dueDate, priority, createdAt)
- `order`: Sort order (enum: asc, desc)

#### Example Requests
```http
GET /projects/5/tasks
GET /projects/5/tasks?status=in_progress
GET /projects/5/tasks?assignedTo=123&priority=high
GET /projects/5/tasks?sortBy=dueDate&order=asc
```

#### Response
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "projectId": 5,
      "title": "Implement user authentication",
      "status": "in_progress",
      "priority": "high",
      "dueDate": "2024-02-15T00:00:00.000Z",
      "assigner": { ... },
      "assignee": { ... }
    }
  ],
  "count": 1
}
```

### 3. Get Task by ID
**`GET /projects/:projectId/tasks/:taskId`**

Retrieves a specific task by ID with full details.

#### Response
```json
{
  "success": true,
  "data": {
    "id": 1,
    "projectId": 5,
    "title": "Implement user authentication",
    "description": "Add JWT-based authentication to the API",
    "assignedBy": 456,
    "assignedTo": 123,
    "priority": "high",
    "status": "in_progress",
    "difficulty": "medium",
    "startDate": "2024-01-16T09:00:00.000Z",
    "dueDate": "2024-02-15T00:00:00.000Z",
    "completedOn": null,
    "comments": "Started working on authentication module",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-16T09:00:00.000Z",
    "project": {
      "id": 5,
      "status": "in_progress",
      "client": { ... },
      "salesRep": { ... }
    },
    "assigner": {
      "id": 456,
      "firstName": "John",
      "lastName": "Doe",
      "role": { "name": "team_lead" },
      "department": { "name": "Production" }
    },
    "assignee": {
      "id": 123,
      "firstName": "Jane",
      "lastName": "Smith",
      "role": { "name": "senior" },
      "department": { "name": "Production" }
    }
  }
}
```

### 4. Update Task Details
**`PUT /projects/:projectId/tasks/:taskId`**

Updates task details. Only the original task creator can update task details.

#### Request Body
```json
{
  "title": "Implement user authentication with OAuth",
  "description": "Add JWT-based authentication with OAuth2 support",
  "priority": "critical",
  "difficulty": "hard",
  "dueDate": "2024-02-20T00:00:00.000Z",
  "comments": "Updated requirements from client"
}
```

#### Response
```json
{
  "success": true,
  "message": "Task updated successfully",
  "data": { ... }
}
```

### 5. Update Task Status
**`PATCH /projects/:projectId/tasks/:taskId/status`**

Updates task status with role-based permissions and automatic field updates.

#### Request Body
```json
{
  "status": "in_progress",
  "comments": "Starting work on this task"
}
```

#### Status Transitions
- `not_started` → `in_progress`, `review`
- `in_progress` → `review`
- `review` → `completed`, `cancelled`

#### Automatic Field Updates
- **Status to `in_progress`**: Sets `startDate` to current date
- **Status to `completed`**: Sets `completedOn` to current date
- **Status to `cancelled`**: Formats comment with date and user ID

#### Response
```json
{
  "success": true,
  "message": "Task status updated successfully",
  "data": { ... }
}
```

## Business Logic

### Task Assignment Scope
- **Team Lead**: Can assign tasks to team members only
- **Unit Head**: Can assign tasks to employees in their unit
- **Department Manager**: Can assign tasks to any employee in Production department

### Status Change Permissions
- **Managers & Leads** (`dep_manager`, `unit_head`, `team_lead`):
  - ✅ Can update **ALL** task statuses
  - ✅ Can update any task, regardless of assignment
  - ✅ Can complete and cancel tasks
  - ✅ Must provide comment when cancelling tasks

- **Regular Employees** (`senior`, `junior`):
  - ✅ Can update status to `in_progress` and `review` **ONLY**
  - ✅ Can only update tasks assigned to them
  - ❌ Cannot complete or cancel tasks
  - ❌ Cannot update tasks assigned to others

### Comment Formatting
When a task is cancelled, the comment is automatically formatted as:
```
"2024-01-15, Changed by ID: 123, Task cancelled due to client requirements change"
```

### Validation Rules
- Due date must be in the future
- Assigned person must exist and be in Production department
- Project must exist and be active (not completed or on-hold)
- Status transitions must follow the defined flow
- Comments are required when cancelling tasks

## Error Handling

### Common Error Responses
```json
{
  "statusCode": 400,
  "message": "Due date must be in the future",
  "error": "Bad Request"
}
```

```json
{
  "statusCode": 403,
  "message": "Only team leads, unit heads, and department managers can create tasks",
  "error": "Forbidden"
}
```

```json
{
  "statusCode": 404,
  "message": "Task not found",
  "error": "Not Found"
}
```

## Usage Examples

### Creating a Task (Team Lead)
```bash
curl -X POST http://localhost:3000/projects/5/tasks \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Fix authentication bug",
    "description": "Resolve JWT token expiration issue",
    "assignedTo": 123,
    "priority": "high",
    "difficulty": "medium",
    "dueDate": "2024-02-15T00:00:00.000Z"
  }'
```

### Updating Task Status (Employee)
```bash
curl -X PATCH http://localhost:3000/projects/5/tasks/1/status \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "in_progress",
    "comments": "Started working on the authentication module"
  }'
```

### Completing a Task (Manager)
```bash
curl -X PATCH http://localhost:3000/projects/5/tasks/1/status \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "completed"
  }'
```

### Cancelling a Task (Manager)
```bash
curl -X PATCH http://localhost:3000/projects/5/tasks/1/status \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "cancelled",
    "comments": "Task cancelled due to client requirements change"
  }'
```

### Getting Tasks with Filters
```bash
curl -X GET "http://localhost:3000/projects/5/tasks?status=in_progress&priority=high&sortBy=dueDate&order=asc" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Testing Scenarios

### 1. Valid Task Creation
```json
{
  "title": "Database schema design and implementation",
  "description": "Design and implement the complete database schema with proper relationships and indexes",
  "assignedTo": 20,
  "priority": "critical",
  "difficulty": "hard",
  "dueDate": "2024-02-10T00:00:00.000Z",
  "comments": "Foundation for entire project. Must be completed first."
}
```

### 2. Employee Status Update (Valid)
```json
{
  "status": "in_progress",
  "comments": "Started working on the task"
}
```

### 3. Employee Status Update (Invalid - Cannot Complete)
```json
{
  "status": "completed",
  "comments": "This should fail - employee cannot complete tasks"
}
```

### 4. Manager Status Update (Valid)
```json
{
  "status": "completed"
}
```

### 5. Task Cancellation (Valid)
```json
{
  "status": "cancelled",
  "comments": "Task cancelled due to client requirements change"
}
```

### 6. Task Cancellation (Invalid - No Comment)
```json
{
  "status": "cancelled"
}
```

## Security Considerations

- All endpoints require JWT authentication
- Production department restriction enforced
- Role-based access control for all operations
- Task assignment scope validation
- Status transition validation
- Automatic audit trail for cancellations
- Input validation and sanitization

## Integration Notes

- Tasks are automatically linked to projects
- Full employee and project details included in responses
- Compatible with existing Prisma schema
- No database migrations required
- Integrates seamlessly with existing project management system
- URL-based project ID parameter (not in request body)
- Automatic field updates based on status changes
- Comprehensive error handling with detailed messages

## API Response Format

All API responses follow a consistent format:

### Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { ... }
}
```

### Error Response
```json
{
  "statusCode": 400,
  "message": "Error description",
  "error": "Error Type"
}
```

## Rate Limiting & Performance

- No specific rate limiting implemented
- Database queries optimized with proper indexing
- Role-based filtering reduces data transfer
- Pagination not implemented (can be added if needed)
- Sorting and filtering supported for better performance