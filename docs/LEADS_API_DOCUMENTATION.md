# 🎯 Lead Management API Documentation

## Overview
Complete API documentation for the Lead Management System. This system handles the entire lead lifecycle from creation to completion, including role-based access control, business logic automation, and comprehensive audit trails.

---

## 🔐 Authentication & Authorization

### Guards
- **`JwtAuthGuard`**: Ensures user is authenticated
- **`LeadsAccessGuard`**: Restricts access to Sales, HR, and Admin users only
- **`LeadCreationGuard`**: Restricts lead creation to Sales team and Admin users only

### Role-Based Access Matrix

| User Type | Create Leads | Access Leads | Lead Types Visible | Scope of Access |
|-----------|--------------|--------------|-------------------|-----------------|
| **Sales Team** | ✅ YES | ✅ YES | All types | Based on role hierarchy |
| **HR** | ❌ NO | ✅ YES | All types | Read-only access |
| **Admin** | ✅ YES | ✅ YES | All types | All units, all leads |
| **Marketing** | ❌ NO | ❌ NO | None | No access |
| **Production** | ❌ NO | ❌ NO | None | No access |
| **Finance** | ❌ NO | ❌ NO | None | No access |

### 🏗️ Hierarchical Lead Access Control

The system implements a sophisticated hierarchical access control system based on sales department structure:

#### **Department Manager (dep_manager)**
- **Scope**: All leads from all sales units
- **Lead Types**: warm, cold, push, upsell
- **Restrictions**: None - full access

#### **Unit Head (unit_head)**
- **Scope**: All leads from their sales unit only
- **Lead Types**: warm, cold, push, upsell
- **Restrictions**: Cannot see leads from other units

#### **Team Lead (team_lead)**
- **Scope**: All leads from their sales unit + leads assigned to their team members
- **Lead Types**: warm, cold, push, upsell
- **Restrictions**: Cannot see leads from other units or other teams
- **Special**: Includes leads assigned to themselves

#### **Senior (senior)**
- **Scope**: Only leads assigned to them from their sales unit
- **Lead Types**: warm, cold, push
- **Restrictions**: Cannot see leads assigned to others

#### **Junior (junior)**
- **Scope**: Only leads assigned to them from their sales unit
- **Lead Types**: warm, cold
- **Restrictions**: Cannot see leads assigned to others, no push/upsell access

#### **Admin**
- **Scope**: All leads from all sales units
- **Lead Types**: warm, cold, push, upsell
- **Restrictions**: None - full access

---

## 🔧 Technical Implementation Details

### Database Relationships
The hierarchical access control system uses the following database relationships:

- **`employees`** table: Contains user information and `team_lead_id` field
- **`sales_department`** table: Links employees to sales units
- **`sales_units`** table: Contains unit information and `head_id` field
- **`teams`** table: Contains team information and `team_lead_id` field

### Access Control Logic
1. **User Authentication**: JWT token contains user ID and role
2. **Sales Department Lookup**: System queries `sales_department` table to get user's sales unit
3. **Hierarchical Filtering**: Based on role, applies appropriate WHERE clauses:
   - **Team Lead**: Queries team members via `team_lead_id` relationship
   - **Unit Head**: Filters by `sales_unit_id`
   - **Senior/Junior**: Filters by `assigned_to_id = user_id`
4. **Type Filtering**: Additional filtering based on role permissions
5. **Database Query**: Single optimized query with conditional joins

### Performance Optimizations
- **Single Query**: All filtering done in one database query
- **Conditional Joins**: Only joins necessary tables based on role
- **Indexed Fields**: All filter fields are properly indexed
- **Pagination**: Built-in pagination to handle large datasets

### Debugging & Monitoring
The system includes comprehensive console logging for debugging access control issues:

#### Console Log Examples
```
🔍 ===== FIND ALL LEADS START =====
🔍 User ID: 5 | Role: team_lead
 Query params: {}
🔍 Getting sales department info for user ID: 5
🔍 Found sales department record:
   Sales Unit ID: 1
🔍   Sales Unit Name: 1
🔍   Unit Head ID: 10
   Teams in unit: 2
🔍     Team 1: ID=1, Lead=5
🔍     Team 2: ID=2, Lead=6
🔍 ===== HIERARCHICAL FILTERING =====
🔍 ✅ team_lead - TEAM RESTRICTION
🔍   → Can see leads from unit ID: 1
🔍   → Can see leads assigned to team members of user ID: 5
🔍   → Querying team members for team lead ID: 5
🔍   → Found team members: 3
🔍   → Team member details: ["1: John Doe", "2: Jane Smith", "3: Bob Johnson"]
🔍   → Team member IDs for filtering: [1, 2, 3]
🔍   → Final member IDs (including team lead): [1, 2, 3, 5]
🔍 Final WHERE clause after hierarchical filtering: {
  "salesUnitId": 1,
  "assignedToId": { "in": [1, 2, 3, 5] }
}
🔍 ===== QUERY RESULTS =====
🔍 Total leads found: 15
🔍 Leads returned: 15
```

This logging helps developers understand exactly what data each role can access and troubleshoot any access control issues.

---

## 🔧 Filter Options APIs

### Get Sales Units for Filtering
**`GET /leads/filter-options/sales-units`**

Retrieves all sales units for use in filter dropdowns. Accessible by sales employees and marketing managers.

#### Access Control
- **Authentication**: JWT token required
- **Department**: Sales, Marketing departments
- **Roles**: All sales roles (junior, senior, team_lead, unit_head, dep_manager) + marketing_manager
- **Admin**: Full access

#### Response Format
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "North Region",
      "email": "north@company.com"
    },
    {
      "id": 2,
      "name": "South Region", 
      "email": "south@company.com"
    }
  ],
  "total": 2
}
```

---

### Get Employees for Filtering
**`GET /leads/filter-options/employees`**

Retrieves active employees for use in filter dropdowns. Shows sales employees for sales users, and sales + marketing employees for marketing managers.

#### Query Parameters
- `salesUnitId` (optional): Filter employees by specific sales unit (only for sales employees)

#### Access Control
- **Authentication**: JWT token required
- **Department**: Sales, Marketing departments
- **Roles**: All sales roles (junior, senior, team_lead, unit_head, dep_manager) + marketing_manager
- **Admin**: Full access

#### Role-Based Data Access
- **Sales Employees**: See only Sales department employees
- **Marketing Managers**: See both Sales and Marketing department employees
- **Sales Unit Filtering**: Only applies to sales employees (marketing managers see all employees)

#### Response Format
```json
{
  "success": true,
  "data": [
    {
      "id": 123,
      "firstName": "John",
      "lastName": "Doe",
      "fullName": "John Doe",
      "email": "john.doe@company.com",
      "department": "Sales",
      "salesUnit": {
        "id": 1,
        "name": "North Region"
      }
    },
    {
      "id": 456,
      "firstName": "Jane",
      "lastName": "Smith",
      "fullName": "Jane Smith",
      "email": "jane.smith@company.com",
      "department": "Marketing",
      "salesUnit": null
    }
  ],
  "total": 2
}
```

#### Example Requests
```bash
# Get all sales employees
GET /leads/filter-options/employees

# Get employees from specific sales unit
GET /leads/filter-options/employees?salesUnitId=1
```

---

## 📋 API Endpoints

### 1. Create Lead
**`POST /leads`**

Creates a new lead with default values. Only sales team and admin users can create leads.

#### Request Body
```json
{
  "name": "John Doe",
  "email": "john.doe@example.com",
  "phone": "+1234567890",
  "source": "PPC",
  "type": "warm",
  "salesUnitId": 1
}
```

#### Required Fields
- `type`: Lead type (warm, cold, upsell, push)
- `salesUnitId`: ID of the sales unit

#### Optional Fields
- `name`: Lead's name
- `email`: Lead's email
- `phone`: Lead's phone number
- `source`: Lead source (PPC, SMM)

#### Default Values Set
- `status`: "new"
- `outcome`: null
- `assignedToId`: null
- `startedById`: null
- `failedCount`: 0

#### Response
```json
{
  "id": 1,
  "name": "John Doe",
  "email": "john.doe@example.com",
  "phone": "+1234567890",
  "source": "PPC",
  "type": "warm",
  "status": "new",
  "outcome": null,
  "assignedToId": null,
  "startedById": null,
  "failedCount": 0,
  "salesUnitId": 1,
  "createdAt": "2025-01-15T10:00:00.000Z",
  "updatedAt": "2025-01-15T10:00:00.000Z"
}
```

---

### 2. Get All Leads
**`GET /leads`**

Retrieves leads with hierarchical role-based filtering and pagination. Access restricted to Sales, HR, and Admin users.

#### 🔐 Hierarchical Access Control
The system automatically applies hierarchical filtering based on the user's role and sales department structure:

- **Department Manager**: Sees all leads from all units
- **Unit Head**: Sees all leads from their unit only
- **Team Lead**: Sees leads from their unit + their team members' leads
- **Senior**: Sees only leads assigned to them from their unit
- **Junior**: Sees only leads assigned to them from their unit
- **Admin**: Sees all leads from all units

#### Query Parameters
- `status`: Filter by lead status (new, in_progress, completed, failed, cracked)
- `type`: Filter by lead type (warm, cold, push, upsell)
- `salesUnitId`: Filter by sales unit (automatically restricted by role)
- `assignedTo`: Filter by assigned employee
- `search`: Search by name, email, or phone (case-insensitive)
- `sortBy`: Sort field (default: "createdAt")
- `sortOrder`: Sort direction - "asc" or "desc" (default: "desc")
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)

#### Role-Based Type Filtering
- **Junior**: Only sees `warm` and `cold` leads
- **Senior**: Sees `warm`, `cold`, and `push` leads
- **Team Lead**: Sees all types including `upsell`
- **Unit Head**: Sees all types including `upsell`
- **Department Manager**: Sees all types including `upsell`
- **Admin**: Sees all types including `upsell`

#### Response (Lightweight List Format)
```json
{
  "leads": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john.doe@example.com",
      "phone": "+1234567890",
      "status": "new",
      "outcome": null,
      "type": "warm",
      "createdAt": "2025-01-15T10:00:00.000Z",
      "updatedAt": "2025-01-15T10:00:00.000Z",
      "assignedTo": {
        "firstName": "Jane",
        "lastName": "Smith"
      },
      "startedBy": {
        "firstName": "Jane",
        "lastName": "Smith"
      },
      "salesUnit": {
        "name": "Sales Unit A"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

#### Example Queries
```bash
# Search for leads containing "john"
GET /leads?search=john

# Sort by name ascending
GET /leads?sortBy=name&sortOrder=asc

# Search and filter with pagination
GET /leads?search=company&status=new&sortBy=createdAt&sortOrder=desc&page=1&limit=10
```

---

### 3. Get My Leads
**`GET /leads/my-leads`**

Retrieves leads assigned to the current user with role-based filtering and pagination.

#### Query Parameters
- `status`: Filter by lead status
- `type`: Filter by lead type
- `salesUnitId`: Filter by sales unit
- `search`: Search by name, email, or phone (case-insensitive)
- `sortBy`: Sort field (default: "createdAt")
- `sortOrder`: Sort direction - "asc" or "desc" (default: "desc")
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)

#### Response (Same lightweight format as GET /leads)
```json
{
  "leads": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john.doe@example.com",
      "phone": "+1234567890",
      "status": "in_progress",
      "outcome": "interested",
      "type": "warm",
      "createdAt": "2025-01-15T10:00:00.000Z",
      "updatedAt": "2025-01-15T10:00:00.000Z",
      "assignedTo": {
        "firstName": "Jane",
        "lastName": "Smith"
      },
      "salesUnit": {
        "name": "Sales Unit A"
      }
    }
  ],
  "total": 25,
  "page": 1,
  "limit": 20,
  "totalPages": 2
}
```

---

### 4. Get Single Lead
**`GET /leads/:id`**

Retrieves a specific lead by ID with full details including comments and history.

#### Response (Comprehensive Detail Format)
```json
{
  "id": 1,
  "name": "John Doe",
  "email": "john.doe@example.com",
  "phone": "+1234567890",
  "source": "PPC",
  "type": "warm",
  "status": "cracked",
  "outcome": "interested",
  "failedCount": 0,
  "assignedToId": 2,
  "startedById": 2,
  "crackedById": 2,
  "closedById": null,
  "salesUnitId": 1,
  "createdAt": "2025-01-15T10:00:00.000Z",
  "updatedAt": "2025-01-15T11:30:00.000Z",
  "closedAt": null,
  
  // Employee Details
  "assignedTo": {
    "id": 2,
    "firstName": "Jane",
    "lastName": "Smith",
    "email": "jane.smith@company.com",
    "phone": "+1234567891"
  },
  "startedBy": {
    "id": 2,
    "firstName": "Jane",
    "lastName": "Smith",
    "email": "jane.smith@company.com",
    "phone": "+1234567891"
  },
  "crackedBy": {
    "id": 2,
    "firstName": "Jane",
    "lastName": "Smith",
    "email": "jane.smith@company.com",
    "phone": "+1234567891"
  },
  "closedBy": null,
  
  // Sales Unit Details
  "salesUnit": {
    "id": 1,
    "name": "Sales Unit A"
  },
  
  // Comments with Employee Details
  "comments": [
    {
      "id": 1,
      "commentText": "Initial contact made. Customer very interested in our services.",
      "createdAt": "2025-01-15T10:00:00.000Z",
      "employee": {
        "id": 2,
        "firstName": "Jane",
        "lastName": "Smith",
        "email": "jane.smith@company.com"
      }
    }
  ],
  
  // Outcome History with Full Details
  "outcomeHistory": [
    {
      "id": 1,
      "outcome": "interested",
      "createdAt": "2025-01-15T11:30:00.000Z",
      "changedByUser": {
        "id": 2,
        "firstName": "Jane",
        "lastName": "Smith",
        "email": "jane.smith@company.com"
      },
      "comment": {
        "id": 1,
        "commentText": "Customer showed interest",
        "createdAt": "2025-01-15T10:00:00.000Z"
      }
    }
  ],
  
  // Cracked Lead Details (if applicable)
  "crackedLeads": [
    {
      "id": 1,
      "amount": 50000,
      "commissionRate": 5.0,
      "industryId": 1,
      "description": "Enterprise software solution",
      "totalPhases": 3,
      "currentPhase": 1,
      "industry": {
        "id": 1,
        "name": "Technology"
      },
      "employee": {
        "id": 2,
        "firstName": "Jane",
        "lastName": "Smith",
        "email": "jane.smith@company.com"
      }
    }
  ]
}
```

---

### 5. Request Leads (Get 10 Leads)
**`POST /leads/request`**

Allows salespersons to request leads (get 10 total). Implements the "Getting Leads" workflow.

#### Request Body
```json
{
  "employeeId": 1,
  "keptLeadIds": [1, 2, 3],
  "circulateLeadIds": [4, 5]
}
```

#### Workflow
1. **Circulate Leads**: Non-kept leads are returned to the pool
2. **Count Current**: Counts currently assigned leads
3. **Calculate Need**: Determines how many new leads needed
4. **Assign New**: Assigns new leads prioritizing warm over cold
5. **Update Status**: New leads get status "in_progress"

#### Response
```json
{
  "assignedLeads": [
    {
      "id": 6,
      "name": "New Lead",
      "type": "warm",
      "status": "in_progress",
      "assignedTo": {
        "firstName": "Jane",
        "lastName": "Smith"
      }
    }
  ],
  "keptLeads": [
    {
      "id": 1,
      "name": "Existing Lead",
      "type": "warm",
      "status": "in_progress"
    }
  ],
  "totalActiveLeads": 10
}
```

---

### 6. Update Lead (Main API)
**`PUT /leads/:id`**

Main API for updating leads with complex business logic. Handles all lead modifications including outcome, status, and special actions.

#### Request Body Examples

##### A. Update Outcome (Requires Comment)
```json
{
  "outcome": "interested",
  "comment": "Customer showed strong interest in our services. Scheduled follow-up call for next week."
}
```

##### B. Update Status to "cracked" (Requires Cracked Lead Fields)
```json
{
  "status": "cracked",
  "comment": "Lead successfully converted! Customer signed contract.",
  "totalAmount": 50000,
  "commission": 5.0,
  "industryId": 1,
  "description": "Enterprise software solution for manufacturing",
  "totalPhases": 3,
  "currentPhase": 1
}
```

**Important**: `commission` should be a percentage (5.0 = 5%), not an absolute amount.

##### C. Update Status to "completed"
```json
{
  "status": "completed",
  "comment": "Project completed successfully. All deliverables met."
}
```

##### D. Push Lead (Makes it available to higher roles)
```json
{
  "action": "push",
  "comment": "Lead needs senior sales rep attention. Customer has complex requirements."
}
```

##### E. Mark as "denied" (Tests failed lead logic)
```json
{
  "outcome": "denied",
  "comment": "Customer not interested. Budget constraints mentioned."
}
```

#### Business Logic Implemented

##### Outcome Updates
- **Comment Required**: Comment is mandatory when updating outcome
- **History Created**: Creates record in `lead_outcome_history`
- **Failed Lead Handling**: Increments `failedCount` on "denied" outcome
- **Archiving**: At 4 failed attempts, lead is moved to `archive_leads`

##### Status Updates
- **History Created**: Creates record in `lead_outcome_history`
- **Cracked Lead Creation**: When status = "cracked" AND outcome = "interested"
- **Auto-Upsell**: When status = "completed", type becomes "upsell"
- **Commission Update**: Updates commission rate from sales department
- **Team Statistics**: Updates team's completed leads count

##### Push Action
- **Type Change**: Changes type to "push"
- **Status Reset**: Resets status to "new"
- **Unassign**: Removes assignment
- **History**: Creates audit trail

#### Response
```json
{
  "id": 1,
  "name": "John Doe",
  "outcome": "interested",
  "status": "cracked",
  "type": "warm",
  "crackedLead": {
    "id": 1,
    "amount": 50000,
    "commissionRate": 5.0,
    "description": "Enterprise software solution"
  },
  "teamUpdate": {
    "completedLeads": 15
  }
}
```

---

### 7. Mark Upsell Lead
**`PUT /leads/:id/upsell`**

Separate API for marking leads as upsell. Lead must be in "completed" status.

#### Request Body
```json
{
  "comment": "Customer interested in additional services. Upselling opportunity identified."
}
```

#### Response
```json
{
  "id": 1,
  "type": "upsell",
  "comment": {
    "id": 1,
    "commentText": "Customer interested in additional services",
    "commentBy": 1
  },
  "outcomeHistory": {
    "outcome": "upsell",
    "changedBy": 1,
    "commentId": 1
  }
}
```

---

### 8. Get Cracked Leads
**`GET /leads/cracked-leads`**

Retrieves all cracked leads with filtering and pagination.

#### Query Parameters
- `amount`: Filter by minimum amount
- `employeeId`: Filter by employee who closed the lead
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)

#### Response
```json
{
  "crackedLeads": [
    {
      "id": 1,
      "amount": 50000,
      "commissionRate": 5.0,
      "description": "Enterprise software solution",
      "lead": {
        "name": "John Doe",
        "assignedTo": {
          "firstName": "Jane",
          "lastName": "Smith"
        }
      },
      "employee": {
        "firstName": "Jane",
        "lastName": "Smith"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "totalPages": 3
  }
}
```

---

### 9. Update Cracked Lead
**`PUT /leads/cracked-leads/:id`**

Updates details of a cracked lead.

#### Request Body
```json
{
  "description": "Updated project description with additional requirements",
  "amount": 75000,
  "commissionRate": 8.5,
  "totalPhases": 4,
  "currentPhase": 2
}
```

#### Response
```json
{
  "id": 1,
  "amount": 75000,
  "commissionRate": 8.5,
  "description": "Updated project description",
  "totalPhases": 4,
  "currentPhase": 2
}
```

---

### 10. Bulk Update Leads
**`POST /leads/bulk-update`**

Updates multiple leads at once with batch processing and error handling.

#### Request Body
```json
{
  "leadIds": [1, 2, 3, 4, 5],
  "updateData": {
    "status": "in_progress",
    "comment": "Bulk update: All leads moved to in-progress status"
  }
}
```

#### Response
```json
{
  "total": 5,
  "successful": 4,
  "failed": 1,
  "results": [
    {
      "leadId": 1,
      "status": "fulfilled",
      "data": { "id": 1, "status": "in_progress" },
      "error": null
    },
    {
      "leadId": 2,
      "status": "rejected",
      "data": null,
      "error": "Lead not found"
    }
  ]
}
```

---

### 11. Lead Statistics
**`GET /leads/statistics/overview`**

Returns essential lead analytics with role-based filtering.

#### Response
```json
{
  "totalLeads": 150,
  "activeLeads": 105,
  "completedLeads": 35,
  "failedLeads": 10,
  "conversionRate": "23.33%",
  "completionRate": "23.33%",
  "byStatus": {
    "new": 45,
    "inProgress": 60,
    "completed": 35,
    "failed": 10
  },
  "byType": {
    "warm": 80,
    "cold": 50,
    "push": 15,
    "upsell": 5
  },
  "today": {
    "new": 3,
    "completed": 2,
    "inProgress": 5
  }
}
```

#### Response Fields
- **totalLeads**: Total number of leads
- **activeLeads**: Leads currently being worked on (new + in_progress)
- **completedLeads**: Successfully completed leads
- **failedLeads**: Leads marked as failed
- **conversionRate**: Percentage of leads converted to completed
- **completionRate**: Same as conversion rate for clarity
- **byStatus**: Breakdown by lead status
- **byType**: Breakdown by lead type (warm, cold, push, upsell)
- **today**: Today's activity (new leads created, completed, and in progress)

---

## 🚫 DELETE Endpoints

**Note**: There are no DELETE endpoints for leads in this API. Leads are managed through status updates and archiving:

- **Failed Leads**: Automatically archived after 4 "denied" outcomes
- **Completed Leads**: Status changes to "completed" and type becomes "upsell"
- **Lead Management**: Use PUT endpoints to update status, not DELETE

---

## 🔄 Business Workflows

### 1. Lead Creation Workflow
```
Create Lead → Request Leads → Update Status → Complete → Upsell
```

### 2. Failed Lead Workflow
```
Update Outcome to "denied" → Increment failedCount → At threshold 4 → Archive Lead
```

### 3. Cracked Lead Workflow
```
Update Outcome to "interested" → Update Status to "cracked" → Create cracked_lead record
```

### 4. Completed Lead Workflow
```
Update Status to "completed" → Auto-change type to "upsell" → Update commission → Update team stats
```

### 5. Push Lead Workflow
```
Set action to "push" → Change type to "push" → Reset status to "new" → Unassign lead
```

---

## 📊 Database Tables Affected

### Primary Tables
- **`leads`**: Main lead records
- **`lead_comments`**: Lead comments and notes
- **`lead_outcome_history`**: Audit trail for all changes
- **`cracked_leads`**: Converted leads with project details

### Related Tables
- **`sales_departments`**: Commission rates and sales data
- **`teams`**: Team statistics updates
- **`archive_leads`**: Failed leads moved to archive

---

## ⚠️ Important Notes

### 1. Commission Rate
- **Field**: `commission_rate` in `cracked_leads`
- **Type**: `DECIMAL(5,2)` - Max value: 999.99
- **Usage**: Stores percentage (5.0 = 5%), not absolute amount
- **Calculation**: `commission_amount = total_amount × (commission_rate ÷ 100)`

### 2. Required Fields
- **Outcome Updates**: Comment is mandatory
- **Cracked Lead Creation**: `totalAmount`, `commission`, `industryId` required
- **Push Action**: Comment is mandatory

### 3. Role-Based Restrictions
- **Lead Creation**: Only Sales team + Admin
- **Lead Access**: Sales + HR + Admin
- **Type Visibility**: Based on user role hierarchy

### 4. Audit Trail
- **All Changes**: Tracked in `lead_outcome_history`
- **Comments**: Linked to history records
- **Timestamps**: All operations include proper timestamps

---

## 🧪 Testing Examples

### Test User Roles
```bash
# Sales user - should work for all endpoints
# HR user - should work for all except POST /leads
# Marketing user - should be denied for all endpoints
# Admin user - should work for all endpoints
```

### Test Business Logic
```bash
# Create lead → Request leads → Update outcome → Complete → Upsell
# Test failed lead logic (4 denied attempts → archived)
# Test cracked lead creation with required fields
# Test push action and role restrictions
```

---

## 🚀 Getting Started

1. **Ensure Authentication**: Include JWT token in Authorization header
2. **Check User Role**: Verify user has appropriate permissions
3. **Follow Workflow**: Use APIs in the correct sequence
4. **Monitor Logs**: Check console for debugging information
5. **Validate Data**: Ensure required fields are provided

---

## 📞 Support

For API issues or questions:
- Check console logs for debugging information
- Verify user permissions and role assignments
- Ensure database schema matches expectations
- Review business logic implementation

---

*Last Updated: January 2025*
*Version: 1.0*

