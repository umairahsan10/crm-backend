# Project Management System

This module implements a complete project management system for the CRM backend, following the specifications outlined in the API documentation.

## Overview

The project management system automatically creates projects when first phase payments are completed and manages project assignments through a hierarchical structure:

```
Manager (Role 1) → Unit Head (Role 2) → Team → All Team Employees
```

## Features

### 1. Automatic Project Creation
- Projects are automatically created when the first phase payment is completed
- Status starts as `null` (represents pending_assignment)
- Auto-filled fields: `crackedLeadId`, `salesRepId`, `clientId`, `description`, `liveProgress = 0`

### 2. Role-Based Access Control
- **Manager (Role 1)**: Full access to all projects, can assign unit heads
- **Unit Head (Role 2)**: Access to assigned projects, can assign teams and update details
- **Team Lead (Role 3)**: Access to team projects (read-only)
- **Employee (Role 4)**: Access to team projects (read-only)

### 3. Project Status Flow
```
null (pending_assignment) → in_progress → onhold ↔ completed
```

**Special Rules:**
- Projects can only be marked as `completed` when `paymentStage` is `final`
- When status is set to `completed`, automatically:
  - Sets `paymentStage` to `approved`
  - Sets `liveProgress` to `100`

## API Endpoints

### Project Management APIs (4 Total)

#### 1. Create Project from Payment (Internal & External)
```
POST /projects/create-from-payment
```
- **Access**: Manager (Role 1) and Unit Head (Role 2) only
- **Body**: `CreateProjectFromPaymentDto`
- **Response**: Created project with status `null` (pending_assignment)
- **Note**: Also called internally by payment system

#### 2. Get Projects (Unified with Multiple Filtering Options)
```
GET /projects?filterBy=&status=&difficulty=&teamId=&unitHeadId=&employeeId=
```
- **Access**: Role-based filtering with multiple filter types
- **Query Parameters**: 
  - `filterBy`: 'all' | 'team' | 'employee' | 'status' (optional)
  - `status`: ProjectStatus (optional)
  - `difficulty`: DifficultyLevel (optional)
  - `teamId`: number (optional)
  - `unitHeadId`: number (optional)
  - `employeeId`: number (optional)
- **Response**: Filtered projects based on filter type and user role

#### 3. Get Project Details
```
GET /projects/:id
```
- **Access**: Only if user is assigned to project
- **Response**: Full project details with team and assignment info

### Project Assignment APIs

#### 4. Assign Unit Head (Manager Only)
```
PUT /projects/:id/assign-unit-head
```
- **Access**: Manager only (Role 1)
- **Body**: `AssignUnitHeadDto`
- **Updates**: `unitHeadId`, `deadline`, `status = "in_progress"`

#### 5. Update Project Details (including status)
```
PUT /projects/:id/update-details
```
- **Access**: Unit Head or Manager assigned to project
- **Body**: `UpdateProjectDetailsDto`
- **Updates**: `description`, `difficulty`, `paymentStage`, `liveProgress`, `deadline`, `status`

#### 6. Assign Team (Unit Head Only)
```
PUT /projects/:id/assign-team
```
- **Access**: Unit Head only (Role 2)
- **Body**: `AssignTeamDto`
- **Updates**: `teamId`, grants access to all team members

## Permission Matrix

| Role | Create | Assign Unit Head | Update Details | Assign Team | View |
|------|--------|------------------|----------------|-------------|------|
| Manager (1) | ✅ (Auto) | ✅ | ✅ | ❌ | All |
| Unit Head (2) | ❌ | ❌ | ✅ (Assigned) | ✅ | Assigned Only |
| Team Lead (3) | ❌ | ❌ | ❌ | ❌ | Team Projects |
| Employee | ❌ | ❌ | ❌ | ❌ | Team Projects |

## Database Integration

The system integrates with the existing Prisma schema:

- **Project Model**: Uses existing `Project` table with all required fields
- **Employee Relations**: Links to `Employee` table for role-based access
- **Team Relations**: Links to `Team` table for team assignments
- **Client Relations**: Links to `Client` table for project clients

## Guards

### 1. RoleGuard
- Validates user roles for specific operations
- Uses `@Roles()` decorator for role-based access control

### 2. ProjectAccessGuard
- Validates user access to specific projects
- Checks role-based permissions and project assignments

### 3. ProjectAssignmentGuard
- Validates permissions for project assignment operations
- Ensures only authorized users can assign projects

## Integration with Payment System

The system automatically integrates with the payment completion flow:

1. When a payment is completed in `PaymentsService.handlePaymentCompletion()`
2. If it's the first phase payment (`currentPhase === 1`)
3. A project is automatically created with `pending_assignment` status
4. The project creation is logged in the payment completion response

## Error Handling

- Comprehensive validation for all role-based operations
- Clear error messages for permission denials
- Validation for project state transitions
- Team assignment validation

## Security Considerations

- Role-based access control
- Project assignment validation
- Team membership verification
- Status transition validation
- JWT authentication required for all endpoints

## Usage Examples

### Creating a Project (Internal)
```typescript
const project = await projectsService.createFromPayment({
  crackedLeadId: 123,
  clientId: 456,
  salesRepId: 789,
  amount: 10000
});
```

### Getting Projects (Unified API)
```typescript
// Get all projects (role-based filtering)
GET /projects

// Get projects by team
GET /projects?filterBy=team&teamId=123

// Get projects by employee
GET /projects?filterBy=employee&employeeId=456

// Get projects by status
GET /projects?filterBy=status&status=in_progress

// Get projects with additional filters
GET /projects?filterBy=all&status=completed&difficulty=hard&unitHeadId=789
```

### Assigning Unit Head (Manager)
```typescript
const result = await projectsService.assignUnitHead(projectId, {
  unitHeadId: 101,
  deadline: '2024-01-15T00:00:00.000Z'
}, user);
```

### Updating Project Details (Unit Head)
```typescript
const result = await projectsService.updateProjectDetails(projectId, {
  description: 'Updated project description',
  difficulty: 'medium',
  liveProgress: 25,
  status: 'in_progress'
}, user);
```

## Future Enhancements

- Project chat integration
- Notification system
- Project logging system
- Advanced filtering and search
- Project analytics and reporting
- Task management within projects
