# Projects Module - Complete Documentation for Backend Developers

## Table of Contents
1. [Overview](#overview)
2. [Project Lifecycle](#project-lifecycle)
3. [Project Creation Flow](#project-creation-flow)
4. [Project Completion Flow](#project-completion-flow)
5. [Access Control System](#access-control-system)
6. [API Endpoints](#api-endpoints)
7. [Response Structure](#response-structure)
8. [Guard Implementations](#guard-implementations)
9. [Database Schema](#database-schema)
10. [Integration Points](#integration-points)
11. [Code Examples](#code-examples)
12. [Status Transitions](#status-transitions)
13. [Error Handling](#error-handling)
14. [Troubleshooting](#troubleshooting)

---

## Overview

The Projects module manages the complete lifecycle of projects from creation (when first payment is received) to completion. It implements a hierarchical access control system where projects flow through: **Manager → Unit Head → Team → Team Members**.

### Key Features
- **Automatic Project Creation**: Projects are created automatically when first phase payment is completed
- **Hierarchical Assignment**: Manager assigns Unit Head, Unit Head assigns Team
- **Role-Based Access Control**: Multi-layered guards ensure proper access
- **Status Management**: Enforced status transitions with validation
- **Automatic Updates**: Completion triggers automatic field updates
- **Project Chat Integration**: Automatic chat creation with managers

---

## Project Lifecycle

### Complete Flow Diagram
```
┌─────────────────────────────────────────────────────────────┐
│ STAGE 1: Payment Completion                                │
│ - First phase payment completed                            │
│ - PaymentService.handlePaymentCompletion() triggered        │
│ - Auto-creates project with status: null                   │
└──────────────────┬──────────────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────────────────┐
│ STAGE 2: Project Created (pending_assignment)              │
│ - status: null (pending_assignment)                         │
│ - paymentStage: 'initial'                                  │
│ - liveProgress: 0                                          │
│ - Project chat created (HR, Production, Sales managers)    │
└──────────────────┬──────────────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────────────────┐
│ STAGE 3: Unit Head Assignment (Manager)                    │
│ PUT /projects/:id/assign-unit-head                          │
│ - status: 'in_progress'                                    │
│ - unitHeadId: assigned                                    │
│ - Unit head added to project chat                           │
└──────────────────┬──────────────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────────────────┐
│ STAGE 4: Team Assignment (Unit Head)                       │
│ PUT /projects/:id (with teamId, deadline, difficulty)      │
│ - teamId: assigned                                         │
│ - deadline: set                                            │
│ - difficulty: set                                          │
│ - All team members added to chat & logs                    │
└──────────────────┬──────────────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────────────────┐
│ STAGE 5: Work in Progress                                   │
│ - Team Lead updates liveProgress                           │
│ - Tasks are created and managed                            │
│ - Payment stages progress: initial → in_between → final   │
└──────────────────┬──────────────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────────────────┐
│ STAGE 6: Completion                                        │
│ PUT /projects/:id { status: "completed" }                   │
│ - Validates: paymentStage === 'final'                      │
│ - Auto-updates: paymentStage = 'approved'                  │
│ - Auto-updates: liveProgress = 100                        │
│ - Status: 'completed' (TERMINAL STATE)                     │
└─────────────────────────────────────────────────────────────┘
```

---

## Project Creation Flow

### 1. Automatic Creation (Payment Integration)

**Location**: `src/modules/sales/leads/payments/payments.service.ts`

**Trigger**: When first phase payment (`currentPhase === 1`) is completed

**Code Flow**:
```typescript
// In PaymentsService.handlePaymentCompletion()
if (crackedLead && crackedLead.currentPhase === 1) {
  // First phase payment - create project automatically
  const projectResult = await this.projectsService.createFromPayment({
    crackedLeadId: crackedLead.id,
    clientId: transaction.clientId,
    salesRepId: transaction.employeeId,
    amount: amount
  }, null); // null indicates internal call (bypasses user validation)
}
```

**What Happens**:
1. Validates cracked lead exists
2. Validates client exists
3. Validates sales rep exists
4. Checks if project already exists for this cracked lead
5. Creates project with:
   - `status: null` (pending_assignment)
   - `paymentStage: 'initial'`
   - `liveProgress: 0`
   - `description: "Project created from cracked lead {id}"`
6. Automatically creates project chat with:
   - HR Manager (owner)
   - Production Manager (owner)
   - Sales Manager (owner)
   - Sales Representative (participant)

### 2. Manual Creation (API Call)

**Endpoint**: `POST /projects/create-from-payment`

**Access Control**:
- **Guards**: `JwtAuthGuard`, `DepartmentsGuard`, `RolesGuard`
- **Required Department**: `Production`
- **Required Roles**: `dep_manager` OR `unit_head`
- **Location**: `src/modules/projects/projects.controller.ts:38-45`

**Request Body** (`CreateProjectFromPaymentDto`):
```typescript
{
  crackedLeadId: number;  // Required, must be positive
  clientId: number;       // Required, must be positive
  salesRepId: number;    // Required, must be positive
  amount: number;         // Required, must be positive
}
```

**Service Method**: `ProjectsService.createFromPayment()`
**Location**: `src/modules/projects/projects.service.ts:41-127`

**Validations**:
- User must be Manager or Unit Head
- Cracked lead must exist
- Client must exist
- Sales rep must exist
- Project must not already exist for this cracked lead

**Response**:
```json
{
  "success": true,
  "message": "Project created successfully",
  "data": {
    "id": 1,
    "status": null,
    "difficultyLevel": null,
    "paymentStage": "initial",
    "deadline": null,
    "liveProgress": 0,
    "description": "Project created from cracked lead 123",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z",
    "salesRep": {
      "id": 789,
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@company.com"
    },
    "unitHead": null,
    "team": null
  }
}
```

**Note**: Response includes only minimal essential fields (core project data + basic employee info). Client and cracked lead details are not included.

---

## Project Completion Flow

### Prerequisites for Completion

1. **Payment Stage Must Be `'final'`**
   - Project cannot be marked complete if `paymentStage !== 'final'`
   - Validation happens in `ProjectsService.updateProject()`:389-393

2. **Valid Status Transition**
   - Can only transition from: `'in_progress'` OR `'onhold'`
   - Cannot transition from: `'pending_assignment'` or `'completed'`
   - Validation: `ProjectsService.validateStatusTransition()`:800-812

### Step-by-Step Completion Process

#### Step 1: Verify Payment Stage
```typescript
// In ProjectsService.updateProject()
if (dto.status === 'completed') {
  if (project.paymentStage !== 'final') {
    throw new BadRequestException(
      'Project can only be marked as completed when payment stage is final'
    );
  }
}
```

#### Step 2: Validate Status Transition
```typescript
const isValidTransition = this.validateStatusTransition(
  project.status, 
  dto.status
);

if (!isValidTransition) {
  throw new BadRequestException(
    `Invalid status transition from ${project.status || 'pending_assignment'} to ${dto.status}`
  );
}
```

#### Step 3: Auto-Update Fields
When status is set to `'completed'`, these fields are automatically updated:
```typescript
if (dto.status === 'completed') {
  updateData.paymentStage = 'approved';  // Auto-update
  updateData.liveProgress = 100;         // Auto-update
}
```

#### Step 4: Save Changes
```typescript
const updatedProject = await this.prisma.project.update({
  where: { id },
  data: updateData,
  select: {
    // Core project fields only
    id: true,
    status: true,
    difficultyLevel: true,
    paymentStage: true,
    deadline: true,
    liveProgress: true,
    description: true,
    createdAt: true,
    updatedAt: true,
    // Minimal related data
    salesRep: {
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true
      }
    },
    unitHead: {
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true
      }
    },
    team: {
      select: {
        id: true,
        name: true,
        teamLead: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    }
  }
});
```

**Note**: The response structure has been optimized to return only minimal essential fields (core project data + basic employee info). Client, cracked lead, chat, payment, and task details are not included in responses.

### API Call for Completion

**Endpoint**: `PUT /projects/:id`

**Request Body**:
```json
{
  "status": "completed"
}
```

**Minimum Required**: Only `status` field is required. All other fields are optional.

**Access Control**:
- **Guards**: `JwtAuthGuard`, `DepartmentsGuard`, `ProjectAccessGuard`
- **Required Department**: `Production`
- **Allowed Roles**: 
  - `dep_manager` (Manager) - can complete any project
  - `unit_head` - can complete assigned projects only
- **Location**: `src/modules/projects/projects.controller.ts:78-87`

**Complete Example**:
```bash
PUT /projects/123
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "status": "completed"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Project marked as completed - payment stage set to approved and live progress set to 100%",
  "data": {
    "id": 123,
    "status": "completed",
    "difficultyLevel": "medium",
    "paymentStage": "approved",
    "deadline": "2024-12-31T00:00:00.000Z",
    "liveProgress": 100,
    "description": "Project description",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-20T09:15:00.000Z",
    "salesRep": {
      "id": 789,
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@company.com"
    },
    "unitHead": {
      "id": 101,
      "firstName": "Mike",
      "lastName": "Johnson",
      "email": "mike.johnson@company.com"
    },
    "team": {
      "id": 5,
      "name": "Development Team Alpha",
      "teamLead": {
        "id": 102,
        "firstName": "Sarah",
        "lastName": "Williams",
        "email": "sarah.williams@company.com"
      }
    }
  }
}
```

**Note**: Response includes only minimal essential fields. Client, cracked lead, chat, and payment details are not included.

---

## Access Control System

### Hierarchy Structure
```
Manager (dep_manager)
    ↓ assigns
Unit Head (unit_head)
    ↓ assigns
Team (team_lead + team members)
```

### Complete Permission Matrix

| Operation | Manager | Unit Head | Team Lead | Senior/Junior |
|-----------|---------|-----------|-----------|---------------|
| **Create Project** | ✅ (Auto/Manual) | ✅ (Manual only) | ❌ | ❌ |
| **View All Projects** | ✅ | ❌ | ❌ | ❌ |
| **View Assigned Projects** | ✅ | ✅ | ❌ | ❌ |
| **View Team Projects** | ✅ | ✅ | ✅ | ✅ (Read-only) |
| **Assign Unit Head** | ✅ | ❌ | ❌ | ❌ |
| **Assign Team** | ❌ | ✅ (Assigned only) | ❌ | ❌ |
| **Update Project** | ✅ (All fields) | ✅ (Limited fields) | ✅ (liveProgress only) | ❌ |
| **Mark Complete** | ✅ (Any project) | ✅ (Assigned only) | ❌ | ❌ |

### Field-Level Update Permissions

#### Manager (`dep_manager`)
**Can Update**: ALL fields
- `description` ✅
- `difficulty` ✅
- `paymentStage` ✅
- `liveProgress` ✅
- `deadline` ✅
- `status` ✅
- `teamId` ✅

**Code Location**: `ProjectsService.checkUnifiedUpdatePermission()`:816-818

#### Unit Head (`unit_head`)
**Can Update**: Limited fields
- `status` ✅
- `difficulty` ✅
- `deadline` ✅
- `liveProgress` ✅
- `teamId` ✅

**Cannot Update**: Restricted fields
- `description` ❌
- `paymentStage` ❌

**Code Location**: `ProjectsService.checkUnifiedUpdatePermission()`:821-835

**Additional Restriction**: Can only update projects where `project.unitHeadId === user.id`

#### Team Lead (`team_lead`)
**Can Update**: Only one field
- `liveProgress` ✅

**Cannot Update**: All other fields
- `description` ❌
- `difficulty` ❌
- `paymentStage` ❌
- `deadline` ❌
- `status` ❌
- `teamId` ❌

**Code Location**: `ProjectsService.checkUnifiedUpdatePermission()`:838-861

**Additional Restrictions**:
- Project must have `teamId` assigned
- User must be the team lead of the assigned team (`team.teamLeadId === user.id`)

#### Senior/Junior
**Can Update**: Nothing (Read-only access)
- All fields ❌

**Can View**: Only team projects where user is a team member

---

## API Endpoints

### 1. Create Project from Payment
```
POST /projects/create-from-payment
```

**Guards**: `JwtAuthGuard`, `DepartmentsGuard`, `RolesGuard`
**Department**: `Production`
**Roles**: `dep_manager`, `unit_head`

**Request**:
```json
{
  "crackedLeadId": 123,
  "clientId": 456,
  "salesRepId": 789,
  "amount": 50000
}
```

**Controller**: `ProjectsController.createFromPayment()`:43
**Service**: `ProjectsService.createFromPayment()`:41

---

### 2. Get All Projects (With Filtering)
```
GET /projects?filterBy=all&status=in_progress&difficulty=medium&page=1&limit=10
```

**Query Parameters**:
- `filterBy`: `'all'` | `'team'` | `'employee'` | `'status'` (optional)
- `status`: `ProjectStatus` (optional)
- `difficulty`: `DifficultyLevel` (optional)
- `teamId`: `number` (optional)
- `unitHeadId`: `number` (optional)
- `employeeId`: `number` (optional)
- `page`: `number` (optional, default: 1)
- `limit`: `number` (optional, default: 10)
- `sortBy`: `'createdAt'` | `'updatedAt'` | `'deadline'` | `'liveProgress'` | `'status'` (optional)
- `sortOrder`: `'asc'` | `'desc'` (optional, default: 'desc')

**Guards**: `JwtAuthGuard`, `DepartmentsGuard`, `RolesGuard`
**Department**: `Production`
**Roles**: `dep_manager`, `unit_head`, `team_lead`, `senior`, `junior`

**Role-Based Filtering**:
- **Manager**: Gets all projects (no filter)
- **Unit Head**: Gets only assigned projects (`unitHeadId = user.id`)
- **Team Lead/Employee**: Gets only team projects

**Response Structure**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "status": "in_progress",
      "difficultyLevel": "medium",
      "paymentStage": "in_between",
      "deadline": "2024-12-31T00:00:00.000Z",
      "liveProgress": 50.00,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-20T09:15:00.000Z",
      "salesRep": {
        "id": 789,
        "firstName": "John",
        "lastName": "Doe"
      },
      "unitHead": {
        "id": 101,
        "firstName": "Mike",
        "lastName": "Johnson"
      },
      "team": {
        "id": 5,
        "name": "Development Team Alpha",
        "teamLead": {
          "id": 102,
          "firstName": "Sarah",
          "lastName": "Williams"
        }
      },
      "tasksCount": 5,
      "logsCount": 12,
      "chatParticipantsCount": 8,
      "teamMembersCount": 6
    }
  ],
  "total": 25,
  "pagination": {
    "page": 1,
    "limit": 10,
    "totalPages": 3
  },
  "message": "Projects retrieved successfully"
}
```

**Note**: Response includes only minimal essential fields. Client and cracked lead details are not included. Counts are calculated for each project.

**Controller**: `ProjectsController.getProjects()`:52
**Service**: `ProjectsService.getProjects()`:130

---

### 3. Get Project by ID
```
GET /projects/:id
```

**Guards**: `JwtAuthGuard`, `DepartmentsGuard`, `ProjectAccessGuard`
**Department**: `Production`

**Access Control**:
- Manager: Can access any project
- Unit Head: Can access only assigned projects
- Team Lead/Employee: Can access only team projects

**Response Structure**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "status": "in_progress",
    "difficultyLevel": "medium",
    "paymentStage": "in_between",
    "deadline": "2024-12-31T00:00:00.000Z",
    "liveProgress": 50.00,
    "description": "Project description",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-20T09:15:00.000Z",
    "salesRep": {
      "id": 789,
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@company.com"
    },
    "unitHead": {
      "id": 101,
      "firstName": "Mike",
      "lastName": "Johnson",
      "email": "mike.johnson@company.com"
    },
    "team": {
      "id": 5,
      "name": "Development Team Alpha",
      "teamLead": {
        "id": 102,
        "firstName": "Sarah",
        "lastName": "Williams",
        "email": "sarah.williams@company.com"
      },
      "productionUnit": {
        "id": 1,
        "name": "Frontend Development Unit"
      }
    },
    "relatedEmployees": [
      {
        "id": 789,
        "firstName": "John",
        "lastName": "Doe",
        "email": "john.doe@company.com",
        "role": { "id": 1, "name": "dep_manager" },
        "department": { "id": 1, "name": "Sales" }
      }
    ],
    "tasksCount": 5,
    "logsCount": 12,
    "chatParticipantsCount": 8,
    "teamMembersCount": 6
  }
}
```

**Note**: Response includes only minimal essential fields. Client, cracked lead, chat details (except minimal), payment details, and task details are not included. `relatedEmployees` contains all unique employees related to the project.

**Controller**: `ProjectsController.getProjectById()`:60
**Service**: `ProjectsService.getProjectById()`:345
**Guard**: `ProjectAccessGuard.canActivate()`:8

---

### 4. Assign Unit Head
```
PUT /projects/:id/assign-unit-head
```

**Guards**: `JwtAuthGuard`, `DepartmentsGuard`, `RolesGuard`, `ProjectAssignmentGuard`
**Department**: `Production`
**Roles**: `dep_manager` (Manager only)

**Request**:
```json
{
  "unitHeadId": 101
}
```

**What Happens**:
1. Validates user is manager
2. Validates project exists
3. Validates unit head exists and has `unit_head` role
4. Updates project:
   - `unitHeadId`: assigned
   - `status`: `'in_progress'`
5. Adds unit head to project chat as owner
6. Adds unit head to project logs

**Response Structure**:
```json
{
  "success": true,
  "message": "Unit head assigned successfully",
  "data": {
    "id": 1,
    "status": "in_progress",
    "difficultyLevel": null,
    "paymentStage": "initial",
    "deadline": null,
    "liveProgress": 0,
    "description": "Project description",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z",
    "salesRep": {
      "id": 789,
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@company.com"
    },
    "unitHead": {
      "id": 101,
      "firstName": "Mike",
      "lastName": "Johnson",
      "email": "mike.johnson@company.com"
    },
    "team": null
  }
}
```

**Note**: Response includes only minimal essential fields. Client and cracked lead details are not included.

**Controller**: `ProjectsController.assignUnitHead()`:69
**Service**: `ProjectsService.assignUnitHead()`:543

---

### 5. Update Project (Unified)
```
PUT /projects/:id
```

**Guards**: `JwtAuthGuard`, `DepartmentsGuard`, `ProjectAccessGuard`
**Department**: `Production`

**Request Body** (`UnifiedUpdateProjectDto`):
```json
{
  "description": "Updated description",
  "difficulty": "medium",
  "paymentStage": "in_between",
  "liveProgress": 50,
  "deadline": "2024-12-31T00:00:00.000Z",
  "status": "in_progress",
  "teamId": 5
}
```

**All fields are optional**. Send only the fields you want to update.

**Special Behavior**:
- If `status: "completed"`:
  - Validates `paymentStage === 'final'`
  - Auto-updates `paymentStage` to `'approved'`
  - Auto-updates `liveProgress` to `100`

- If `teamId` is provided:
  - Requires `deadline` and `difficulty` (if not already set)
  - Validates team exists
  - Updates team's `currentProjectId`
  - Adds all team members to project chat
  - Adds all team members to project logs

**Response Structure**:
```json
{
  "success": true,
  "message": "Project updated successfully",
  "data": {
    "id": 1,
    "status": "in_progress",
    "difficultyLevel": "medium",
    "paymentStage": "in_between",
    "deadline": "2024-12-31T00:00:00.000Z",
    "liveProgress": 50.00,
    "description": "Updated description",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-20T09:15:00.000Z",
    "salesRep": {
      "id": 789,
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@company.com"
    },
    "unitHead": {
      "id": 101,
      "firstName": "Mike",
      "lastName": "Johnson",
      "email": "mike.johnson@company.com"
    },
    "team": {
      "id": 5,
      "name": "Development Team Alpha",
      "teamLead": {
        "id": 102,
        "firstName": "Sarah",
        "lastName": "Williams",
        "email": "sarah.williams@company.com"
      }
    }
  }
}
```

**Note**: Response includes only minimal essential fields. Client and cracked lead details are not included.

**Controller**: `ProjectsController.updateProject()`:81
**Service**: `ProjectsService.updateProject()`:611

---

## Response Structure

### Overview

All project APIs now return a **minimal, consistent response structure** that includes only essential fields. This design ensures:
- **Better Performance**: Reduced data transfer and faster queries
- **Consistency**: Aligned with Production Units and Teams APIs
- **Clarity**: Focus on essential information only

### Included Fields

**Core Project Fields** (All APIs):
- `id`, `status`, `difficultyLevel`, `paymentStage`
- `deadline`, `liveProgress`, `description`
- `createdAt`, `updatedAt`

**Minimal Relations** (All APIs):
- `salesRep`: `id`, `firstName`, `lastName`, `email`
- `unitHead`: `id`, `firstName`, `lastName`, `email`
- `team`: 
  - `id`, `name`
  - `teamLead`: `id`, `firstName`, `lastName`, `email`
  - `productionUnit`: `id`, `name` (GET by ID only)

**Additional Fields** (GET endpoints only):
- `relatedEmployees`: Array of all unique employees related to project (GET by ID)
- Calculated counts: `tasksCount`, `logsCount`, `chatParticipantsCount`, `teamMembersCount`

### Excluded Fields

**Removed from All APIs**:
- ❌ Client details (`client` object)
- ❌ Cracked lead details (`crackedLead` object)
- ❌ Full role/department objects (only basic employee info)
- ❌ Chat details (except minimal `id` in GET by ID)
- ❌ Payment details (except in GET by ID)
- ❌ Task details (only counts, not full arrays)
- ❌ Meeting details

### Comparison with Other Modules

| Feature | Projects | Production Units | Production Teams |
|---------|----------|------------------|------------------|
| **Pagination** | ✅ | ✅ | ✅ |
| **Message Field** | ✅ | ✅ | ✅ |
| **Total Count** | ✅ | ✅ | ✅ |
| **Calculated Counts** | ✅ (4 counts) | ✅ (3 counts) | ✅ (2 counts) |
| **Minimal Relations** | ✅ | ✅ | ✅ |
| **List vs Detail View** | ✅ | ✅ | ✅ |

**Projects-specific counts**:
- `tasksCount` - Total project tasks
- `logsCount` - Total project logs
- `chatParticipantsCount` - Chat participants
- `teamMembersCount` - Team members

---

## Guard Implementations

### 1. ProjectAccessGuard

**Location**: `src/modules/projects/guards/project-access.guard.ts`

**Purpose**: Validates user has access to a specific project

**How It Works**:
```typescript
async canActivate(context: ExecutionContext): Promise<boolean> {
  // 1. Extract user and projectId from request
  const { user } = request;
  const projectId = parseInt(request.params.id);
  
  // 2. Fetch project with relations
  const project = await this.prisma.project.findUnique({
    where: { id: projectId },
    include: { unitHead: true, team: true }
  });
  
  // 3. Check access based on role
  const hasAccess = await this.checkProjectAccess(user, project);
  
  // 4. Attach project to request for controller use
  request.project = project;
  
  return hasAccess;
}
```

**Access Rules**:
- **Manager**: Always has access ✅
- **Unit Head**: Access if `project.unitHeadId === user.id` ✅
- **Team Lead**: Access if `project.team.teamLeadId === user.id` ✅
- **Employee**: Access if user's team matches project's team ✅

**Used On**:
- `GET /projects/:id` (line 58)
- `PUT /projects/:id` (line 79)

---

### 2. ProjectAssignmentGuard

**Location**: `src/modules/projects/guards/project-assignment.guard.ts`

**Purpose**: Validates user can assign projects (unit heads or teams)

**How It Works**:
```typescript
async canActivate(context: ExecutionContext): Promise<boolean> {
  // 1. Extract user and projectId
  const { user } = request;
  const projectId = parseInt(request.params.id);
  
  // 2. Fetch project
  const project = await this.prisma.project.findUnique({
    where: { id: projectId },
    include: { unitHead: true, team: true }
  });
  
  // 3. Check assignment permission
  const canAssign = await this.checkAssignmentPermission(user, project);
  
  // 4. Attach project to request
  request.project = project;
  
  return canAssign;
}
```

**Assignment Rules**:
- **Manager**: Can assign unit heads ✅
- **Unit Head**: Can assign teams to assigned projects only ✅
  - Must satisfy: `project.unitHeadId === user.id`

**Used On**:
- `PUT /projects/:id/assign-unit-head` (line 66)

---

### 3. RolesGuard

**Location**: `src/common/guards/roles.guard.ts`

**Purpose**: Validates user has required role

**Usage in Projects**:
```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('dep_manager', 'unit_head')
```

**Used On**:
- `POST /projects/create-from-payment` - Requires `dep_manager` OR `unit_head`
- `GET /projects` - Requires `dep_manager`, `unit_head`, `team_lead`, `senior`, or `junior`
- `PUT /projects/:id/assign-unit-head` - Requires `dep_manager` only

---

### 4. DepartmentsGuard

**Location**: `src/common/guards/departments.guard.ts`

**Purpose**: Validates user belongs to required department

**Usage in Projects**:
```typescript
@UseGuards(JwtAuthGuard, DepartmentsGuard)
@Departments('Production')
```

**Applied To**: All project endpoints (Production department only)

---

## Database Schema

### Project Model (Prisma)

```prisma
model Project {
  id              Int             @id @default(autoincrement())
  crackedLeadId   Int?            @map("cracked_lead_id")
  salesRepId      Int?            @map("sales_rep_id")
  clientId        Int?            @map("client_id")
  unitHeadId      Int?            @map("unit_head_id")
  status          ProjectStatus?  // null = pending_assignment
  difficultyLevel DifficultyLevel? @map("difficulty_level")
  paymentStage    PaymentStage?   @map("payment_stage")
  description     String?
  deadline        DateTime?        @db.Date
  liveProgress    Decimal?         @map("live_progress") @db.Decimal(5, 2)
  createdAt       DateTime         @default(now()) @map("created_at")
  updatedAt       DateTime         @updatedAt @map("updated_at")
  teamId          Int?            @map("team_id")
  
  // Relations
  crackedLead     CrackedLead?
  client          Client?
  salesRep        Employee?       @relation("ProjectSalesRep")
  unitHead        Employee?       @relation("ProjectUnitHead")
  team            Team?           @relation("ProjectTeam")
  projectChats    ProjectChat[]
  projectLogs    ProjectLog[]
  projectTasks    ProjectTask[]
}
```

### Status Enum

```prisma
enum ProjectStatus {
  in_progress
  onhold
  completed
}
```

**Note**: `null` status represents `pending_assignment` (not in enum)

### PaymentStage Enum

```prisma
enum PaymentStage {
  initial
  in_between
  final
  approved
}
```

**Flow**: `initial` → `in_between` → `final` → `approved` (on completion)

### DifficultyLevel Enum

```prisma
enum DifficultyLevel {
  very_easy
  easy
  medium
  hard
  difficult
}
```

---

## Status Transitions

### Valid Transitions

| From Status | To Status | Valid? | Notes |
|-------------|-----------|--------|-------|
| `null` (pending_assignment) | `in_progress` | ✅ | When unit head assigned |
| `in_progress` | `onhold` | ✅ | Can pause project |
| `in_progress` | `completed` | ✅ | When work is done |
| `onhold` | `in_progress` | ✅ | Resume work |
| `onhold` | `completed` | ✅ | Complete from hold |
| `completed` | Any | ❌ | Terminal state |

**Code Location**: `ProjectsService.validateStatusTransition()`:800-812

### Invalid Transitions

These will throw `BadRequestException`:
- `pending_assignment` → `onhold` ❌
- `pending_assignment` → `completed` ❌
- `completed` → Any status ❌

---

## Integration Points

### 1. Payment System Integration

**File**: `src/modules/sales/leads/payments/payments.service.ts`

**Integration Point**: `handlePaymentCompletion()` method

**Flow**:
```typescript
// After transaction is marked as completed
if (transaction.invoice?.leadId) {
  const crackedLead = await this.prisma.crackedLead.findFirst({
    where: { leadId: transaction.invoice.leadId }
  });
  
  if (crackedLead && crackedLead.currentPhase === 1) {
    // First phase payment - create project
    await this.projectsService.createFromPayment({
      crackedLeadId: crackedLead.id,
      clientId: transaction.clientId,
      salesRepId: transaction.employeeId,
      amount: amount
    }, null); // Internal call
  }
}
```

### 2. Project Chat Integration

**Automatic Actions**:
1. **On Project Creation**:
   - Creates `ProjectChat` record
   - Adds HR Manager, Production Manager, Sales Manager as owners
   - Adds Sales Representative as participant

2. **On Unit Head Assignment**:
   - Adds unit head to chat as owner
   - Updates participant count

3. **On Team Assignment**:
   - Adds all team members to chat as participants
   - Updates participant count

**Code Locations**:
- `ProjectsService.createProjectChatWithDefaultOwners()`:971
- `ProjectsService.addUnitHeadToProjectChat()`:1068
- `ProjectsService.addTeamMembersToProjectChat()`:1167

### 3. Project Logs Integration

**Automatic Actions**:
1. **On Unit Head Assignment**:
   - Adds unit head to project logs via `AutoLogService.addEmployeeToProject()`

2. **On Team Assignment**:
   - Adds all team members (including team lead) to project logs

**Code Locations**:
- `ProjectsService.assignUnitHead()`:347
- `ProjectsService.addTeamMembersToProjectLogs()`:1122

---

## Code Examples

### Example 1: Creating a Project (Service Call)

```typescript
// From PaymentsService
const projectResult = await this.projectsService.createFromPayment({
  crackedLeadId: 123,
  clientId: 456,
  salesRepId: 789,
  amount: 50000
}, null); // null = internal call

if (projectResult.success) {
  console.log(`Project ${projectResult.data.id} created successfully`);
}
```

### Example 2: Assigning Unit Head (Service Call)

```typescript
// From controller or another service
const result = await this.projectsService.assignUnitHead(
  projectId,
  {
    unitHeadId: 101
  },
  user // Current authenticated user
);

// Result contains updated project with unitHead relation
```

### Example 3: Updating Project Progress (Team Lead)

```typescript
// Team Lead updating live progress
const result = await this.projectsService.updateProject(
  projectId,
  {
    liveProgress: 75  // Update progress
  },
  user // Team Lead user
);
```

### Example 4: Completing a Project (Unit Head)

```typescript
// Unit Head marking project as complete
const result = await this.projectsService.updateProject(
  projectId,
  {
    status: 'completed'
    // paymentStage and liveProgress auto-updated
  },
  user // Unit Head user
);

// Result message:
// "Project marked as completed - payment stage set to approved and live progress set to 100%"
```

### Example 5: Checking Project Access (Guard)

```typescript
// In ProjectAccessGuard
const hasAccess = await this.checkProjectAccess(user, project);

// For Manager
if (user.role === 'dep_manager') {
  return true; // Always has access
}

// For Unit Head
if (user.role === 'unit_head') {
  return project.unitHeadId === user.id;
}

// For Team Lead
if (user.role === 'team_lead') {
  return project.team?.teamLeadId === user.id;
}
```

---

## Error Handling

### Common Exceptions

#### 1. NotFoundException
**When Thrown**:
- Project not found
- Cracked lead not found
- Client not found
- Sales rep not found
- Unit head not found
- Team not found

**Example**:
```typescript
throw new NotFoundException('Project not found');
```

#### 2. BadRequestException
**When Thrown**:
- Project already exists for cracked lead
- Invalid status transition
- Payment stage not `final` when trying to complete
- Team assignment without deadline/difficulty
- Invalid request data

**Examples**:
```typescript
throw new BadRequestException('Project already exists for this cracked lead');
throw new BadRequestException('Project can only be marked as completed when payment stage is final');
throw new BadRequestException('Invalid status transition from pending_assignment to completed');
```

#### 3. ForbiddenException
**When Thrown**:
- User doesn't have required role
- User doesn't have access to project
- User cannot assign (not manager or assigned unit head)
- User cannot update (insufficient permissions)

**Examples**:
```typescript
throw new ForbiddenException('Only managers can assign unit heads');
throw new ForbiddenException('Access denied to this project');
throw new ForbiddenException('Only assigned unit head can update this project');
```

### Error Response Format

```json
{
  "statusCode": 400,
  "message": "Project can only be marked as completed when payment stage is final",
  "error": "Bad Request"
}
```

---

## Troubleshooting

### Issue 1: Cannot Create Project
**Symptoms**: `ForbiddenException` when calling `POST /projects/create-from-payment`

**Possible Causes**:
1. User is not Manager or Unit Head
2. User is not in Production department
3. JWT token is missing or invalid

**Solution**:
- Check user role in JWT payload: `user.role` must be `'dep_manager'` or `'unit_head'`
- Check user department: `user.department` must be `'Production'`
- Verify JWT token is valid and not expired

---

### Issue 2: Cannot Mark Project as Complete
**Symptoms**: `BadRequestException: "Project can only be marked as completed when payment stage is final"`

**Possible Causes**:
1. Payment stage is not `'final'`
2. Payment stages not progressed correctly

**Solution**:
- Check current payment stage: `project.paymentStage`
- Ensure payment has progressed: `initial` → `in_between` → `final`
- Only then can project be marked as `completed`

---

### Issue 3: Cannot Update Project (Team Lead)
**Symptoms**: `ForbiddenException: "Team leads can only update liveProgress"`

**Possible Causes**:
1. Trying to update restricted field
2. User is not team lead of assigned team
3. Project has no team assigned

**Solution**:
- Team leads can ONLY update `liveProgress`
- Verify `project.team.teamLeadId === user.id`
- Ensure project has `teamId` assigned

---

### Issue 4: Cannot Access Project
**Symptoms**: `ForbiddenException: "Access denied to this project"`

**Possible Causes**:
1. User is not assigned to project (Unit Head case)
2. User is not in project's team (Team Lead/Employee case)
3. Project has no team assigned (for Team Lead/Employee)

**Solution**:
- **Manager**: Should have access to all projects
- **Unit Head**: Check `project.unitHeadId === user.id`
- **Team Lead**: Check `project.team.teamLeadId === user.id`
- **Employee**: Check user's team matches project's team

---

### Issue 5: Invalid Status Transition
**Symptoms**: `BadRequestException: "Invalid status transition from X to Y"`

**Possible Causes**:
1. Trying invalid transition (e.g., `pending_assignment` → `completed`)
2. Status already `completed` (terminal state)

**Solution**:
- Follow valid transitions only:
  - `pending_assignment` → `in_progress` ✅
  - `in_progress` → `onhold` or `completed` ✅
  - `onhold` → `in_progress` or `completed` ✅
- Cannot transition from `completed` (terminal state)

---

### Issue 6: Project Chat Not Created
**Symptoms**: Project created but no chat exists

**Possible Causes**:
1. HR/Production/Sales managers not found in database
2. Sales representative not found
3. Exception caught and logged but not thrown

**Solution**:
- Ensure at least one employee with `dep_manager` role exists in:
  - HR department
  - Production department
  - Sales department
- Ensure sales representative exists for project
- Check server logs for chat creation errors

---

## Best Practices

### 1. Status Management
- Always validate status transitions before updating
- Use `validateStatusTransition()` method
- Handle `null` status as `pending_assignment`

### 2. Access Control
- Always check permissions in service layer, not just guards
- Use `checkUnifiedUpdatePermission()` for updates
- Use `checkProjectAccess()` for read operations

### 3. Field Updates
- Send only fields you want to update in `PUT /projects/:id`
- All fields in `UnifiedUpdateProjectDto` are optional
- Don't send fields you don't have permission to update

### 4. Error Handling
- Always check if project exists before operations
- Provide clear error messages
- Use appropriate exception types (NotFoundException, BadRequestException, ForbiddenException)

### 5. Database Queries
- Always include relations when needed (`include` in Prisma)
- Use transactions for multi-step operations
- Handle null values properly (status can be null)

---

## Related Documentation

- **Project Tasks**: `docs/PROJECT_TASKS_API_DOCUMENTATION.md`
- **Project Chat**: `docs/CHAT_APIS_DOCUMENTATION.md`
- **Project Logs**: `src/modules/projects/Projects-Logs/AUTO_LOG_DOCUMENTATION.md`
- **Module README**: `src/modules/projects/README.md`

---

## Summary

This documentation provides complete information about:
- ✅ Project creation (automatic and manual)
- ✅ Project completion (step-by-step with validations)
- ✅ Complete access control system (role-based, field-level)
- ✅ Guard implementations (how they work)
- ✅ API endpoints (with examples)
- ✅ Database schema (Prisma models)
- ✅ Integration points (payments, chat, logs)
- ✅ Code examples (practical usage)
- ✅ Error handling (common exceptions)
- ✅ Troubleshooting (common issues)

**Key Takeaways**:
1. Projects are automatically created on first phase payment
2. Completion requires `paymentStage === 'final'`
3. Completion auto-updates `paymentStage` to `'approved'` and `liveProgress` to `100`
4. Access control is multi-layered (department → role → project assignment)
5. Field-level permissions restrict what each role can update
6. **All APIs return minimal essential fields** (core project data + basic employee info only)
7. Client, cracked lead, chat, payment, and task details are excluded from responses
8. Pagination and sorting support added to GET /projects endpoint
9. Response structure aligned with Production Units and Teams APIs for consistency

---

**Response Structure Note**:
All project APIs (create, get, update) return a minimal response structure that includes:
- Core project fields (id, status, difficulty, payment stage, deadline, progress, timestamps)
- Essential relations: `salesRep`, `unitHead`, `team` (with minimal employee info only)
- Calculated counts (in GET endpoints): `tasksCount`, `logsCount`, `chatParticipantsCount`, `teamMembersCount`

**Excluded from responses**:
- Client details
- Cracked lead details
- Full role/department objects (only basic employee info)
- Chat details (except minimal in GET by ID)
- Payment details (except in GET by ID)
- Task details (only counts, not full arrays)

This minimal structure ensures better performance, consistency across APIs, and aligns with the structure used in Production Units and Teams modules.

---

**Last Updated**: Based on codebase as of current date
**Maintained By**: Backend Development Team

