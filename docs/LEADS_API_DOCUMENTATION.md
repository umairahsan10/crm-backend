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

| User Type | Create Leads | Access Leads | Lead Types Visible |
|-----------|--------------|--------------|-------------------|
| **Sales Team** | ✅ YES | ✅ YES | All types |
| **HR** | ❌ NO | ✅ YES | All types |
| **Admin** | ✅ YES | ✅ YES | All types |
| **Marketing** | ❌ NO | ❌ NO | None |
| **Production** | ❌ NO | ❌ NO | None |
| **Finance** | ❌ NO | ❌ NO | None |

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

Retrieves leads with role-based filtering and pagination. Access restricted to Sales, HR, and Admin users.

#### Query Parameters
- `status`: Filter by lead status
- `type`: Filter by lead type
- `salesUnitId`: Filter by sales unit
- `assignedTo`: Filter by assigned employee
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)

#### Role-Based Type Filtering
- **Junior**: Only sees `warm` and `cold` leads
- **Senior**: Sees `warm`, `cold`, and `push` leads
- **dep_manager, team_lead, unit_head, admin**: See all types including `upsell`

#### Response
```json
{
  "leads": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john.doe@example.com",
      "type": "warm",
      "status": "new",
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

---

### 3. Get Single Lead
**`GET /leads/:id`**

Retrieves a specific lead by ID with full details including comments and history.

#### Response
```json
{
  "id": 1,
  "name": "John Doe",
  "email": "john.doe@example.com",
  "type": "warm",
  "status": "new",
  "assignedTo": {
    "firstName": "Jane",
    "lastName": "Smith"
  },
  "comments": [
    {
      "id": 1,
      "commentText": "Initial contact made",
      "employee": {
        "firstName": "Jane",
        "lastName": "Smith"
      },
      "createdAt": "2025-01-15T10:00:00.000Z"
    }
  ],
  "outcomeHistory": [
    {
      "id": 1,
      "outcome": "interested",
      "changedByUser": {
        "firstName": "Jane",
        "lastName": "Smith"
      },
      "comment": {
        "commentText": "Customer showed interest"
      },
      "createdAt": "2025-01-15T10:00:00.000Z"
    }
  ]
}
```

---

### 4. Request Leads (Get 10 Leads)
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

### 5. Update Lead (Main API)
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

### 6. Mark Upsell Lead
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

### 7. Get Cracked Leads
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

### 8. Update Cracked Lead
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

### 9. Bulk Update Leads
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

### 10. Lead Statistics
**`GET /leads/statistics/overview`**

Returns comprehensive lead analytics with role-based filtering.

#### Response
```json
{
  "totalLeads": 150,
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
  "conversionRate": "23.33"
}
```

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
