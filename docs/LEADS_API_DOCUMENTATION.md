# 🎯 Lead Management API Documentation

## Overview
Complete API documentation for the Lead Management System. This system handles the entire lead lifecycle from creation to completion, including role-based access control, business logic automation, and comprehensive audit trails.

---

## 🔐 Authentication & Authorization

### Guards
- **`JwtAuthGuard`**: Ensures user is authenticated
- **`LeadsAccessGuard`**: Restricts access to Sales, HR, Admin, and Marketing users only
- **`LeadCreationGuard`**: Restricts lead creation to Sales team and Admin users only
- **`ArchivedLeadsAccessGuard`**: Restricts archived leads access to authorized users

### Role-Based Access Matrix

| User Type | Create Leads | Access Leads | Lead Types Visible | Scope of Access |
|-----------|--------------|--------------|-------------------|-----------------|
| **Sales Team** | ✅ YES | ✅ YES | All types | Based on role hierarchy |
| **HR**         | ❌ NO  | ✅ YES | All types | Read-only access     |
| **Admin**      | ✅ YES | ✅ YES | All types | All units, all leads |
| **Marketing**  | ❌ NO  | ✅ YES | All types | Limited access       |
| **Production** | ❌ NO  | ❌ NO  | None      | No access            |
| **Finance**    | ❌ NO  | ❌ NO  | None      | No access            |

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

### Update Permissions
- **Assignment-Based**: Users can only update leads **assigned to them**
- **No Hierarchical Override**: Even managers/team leads cannot update subordinates' leads
- **Exception**: System-level operations (archiving, auto-upsell) bypass this restriction

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

Retrieves leads with hierarchical role-based filtering and pagination. Access restricted to Sales, HR, Admin, and Marketing users.

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

### 5. Request Leads (Get Leads)
**`POST /leads/request`**

Allows salespersons to request leads. Implements the "Getting Leads" workflow with support for keeping existing leads and including push leads.

#### Request Body
```json
{
  "keptLeadIds": [1, 2, 3],
  "includePushLeads": true
}
```

#### Request Fields
- `keptLeadIds` (optional): Array of lead IDs to keep from existing assigned leads
- `includePushLeads` (optional): Boolean to include push leads in assignment (default: false)

#### Workflow
1. **Validate User**: Checks user has sales department record
2. **Circulate Leads**: Non-kept leads are returned to the pool (status = "new", assignedTo = null)
3. **Count Current**: Counts currently kept leads
4. **Calculate Need**: Determines how many new leads needed (total 10)
5. **Assign New**: Assigns new leads based on `includePushLeads` flag:
   - If `true`: Gets 8 warm/cold + 2 push leads
   - If `false`: Gets 10 warm/cold leads only
6. **Update Status**: New leads get status "in_progress"

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
      },
      "salesUnit": {
        "name": "North Region"
      }
    }
  ],
  "keptLeads": [
    {
      "id": 1,
      "name": "Existing Lead",
      "type": "warm",
      "status": "in_progress",
      "assignedTo": {
        "firstName": "Jane",
        "lastName": "Smith"
      },
      "salesUnit": {
        "name": "North Region"
      }
    }
  ],
  "totalActiveLeads": 10,
  "circulatedLeads": 2,
  "leadBreakdown": {
    "warmColdLeads": 8,
    "pushLeads": 2,
    "totalAssigned": 7
  },
  "includePushLeads": true
}
```

---

### 6. Update Lead (Main API)
**`PUT /leads/:id`**

Main API for updating leads with complex business logic. Handles all lead modifications including outcome, status, and special actions.

**⚠️ IMPORTANT**: Users can only update leads **assigned to them**. Even managers/team leads cannot update subordinates' leads.

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
  "industryId": 1,
  "description": "Enterprise software solution for manufacturing",
  "totalPhases": 3,
  "currentPhase": 1
}
```

**⚠️ IMPORTANT**: 
- **DO NOT** send `commission` field - it is auto-calculated from sales department
- Commission rate is automatically fetched from the user's `sales_department` record

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
  - Validates: `industryId` is required
  - Validates: `totalAmount` is required
  - Auto-fetches: Commission rate from sales department
  - Creates: `cracked_lead` record
  - Resets: `failedCount` to 0
- **Auto-Upsell**: When status = "completed", type becomes "upsell"
- **Commission Update**: Updates commission rate from sales department
- **Team Statistics**: Updates team's completed leads count

##### Push Action
- **Type Change**: Changes type to "push"
- **Status Reset**: Resets status to "new"
- **Unassign**: Removes assignment (assignedToId = null)
- **Outcome Clear**: Clears outcome (outcome = null)
- **History**: Creates audit trail

#### Response
```json
{
  "id": 1,
  "name": "John Doe",
  "outcome": "interested",
  "status": "cracked",
  "type": "warm",
  "assignedTo": {
    "firstName": "Jane",
    "lastName": "Smith"
  },
  "salesUnit": {
    "name": "Sales Unit A"
  },
  "comments": [...],
  "outcomeHistory": [...],
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

### 7. Bulk Update Leads
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

### 8. Get Cracked Leads
**`GET /leads/cracked`**

Retrieves all cracked leads with filtering and pagination. Access is role-based.

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
      "remainingAmount": 50000,
      "totalPhases": 3,
      "currentPhase": 1,
      "lead": {
        "id": 1,
        "name": "John Doe",
        "email": "john.doe@example.com",
        "assignedTo": {
          "firstName": "Jane",
          "lastName": "Smith"
        }
      },
      "employee": {
        "id": 2,
        "firstName": "Jane",
        "lastName": "Smith"
      },
      "industry": {
        "id": 1,
        "name": "Technology"
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

### 9. Lead Statistics
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

### 10. Get Archived Leads
**`GET /leads/archived`**

Retrieves archived leads (leads that failed 4+ times). Requires special `ArchivedLeadsAccessGuard`.

#### Query Parameters
- `search`: Search by name, email, or phone (case-insensitive)
- `salesUnitId`: Filter by sales unit
- `source`: Filter by lead source (PPC, SMM)
- `outcome`: Filter by outcome
- `qualityRating`: Filter by quality rating
- `sortBy`: Sort field (default: "archivedAt")
- `sortOrder`: Sort direction - "asc" or "desc" (default: "desc")
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)

#### Response
```json
{
  "archivedLeads": [
    {
      "id": 1,
      "name": "Failed Lead",
      "email": "failed@example.com",
      "phone": "+1234567890",
      "source": "PPC",
      "outcome": "denied",
      "qualityRating": "low",
      "salesUnitId": 1,
      "archivedAt": "2025-01-15T10:00:00.000Z",
      "salesUnit": {
        "name": "North Region"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 15,
    "totalPages": 1
  }
}
```

---

### 11. Get Single Archived Lead
**`GET /leads/archived/:id`**

Retrieves a specific archived lead by ID with full details.

#### Response
```json
{
  "id": 1,
  "name": "Failed Lead",
  "email": "failed@example.com",
  "phone": "+1234567890",
  "source": "PPC",
  "outcome": "denied",
  "qualityRating": "low",
  "notes": "Customer not interested after 4 attempts",
  "salesUnitId": 1,
  "archivedAt": "2025-01-15T10:00:00.000Z",
  "salesUnit": {
    "id": 1,
    "name": "North Region"
  }
}
```

---

## 💳 Payment Link APIs

These APIs handle payment link generation and management for cracked leads.

### 12. Generate Payment Link
**`POST /leads/payment-link-generate`**

Generates a payment link for a cracked lead. Creates a transaction, invoice, and optionally a new client.

#### Request Body

##### Option A: Using Existing Client
```json
{
  "leadId": 1,
  "clientId": 5,
  "amount": 50000,
  "type": "payment",
  "method": "bank"
}
```

##### Option B: Creating New Client
```json
{
  "leadId": 1,
  "clientName": "John Doe",
  "companyName": "ABC Corp",
  "email": "john@abccorp.com",
  "phone": "+1234567890",
  "country": "USA",
  "state": "California",
  "postalCode": "90001",
  "amount": 50000,
  "type": "payment",
  "method": "bank"
}
```

#### Required Fields
- `leadId`: ID of the cracked lead
- `amount`: Payment amount

**Either:**
- `clientId`: Existing client ID

**Or (all required if no clientId):**
- `clientName`: Client's name
- `email`: Client's email
- `phone`: Client's phone
- `country`: Client's country
- `state`: Client's state
- `postalCode`: Client's postal code

#### Optional Fields
- `companyName`: Client's company name
- `type`: Transaction type (default: "payment")
- `method`: Payment method (default: "bank")

#### Response
```json
{
  "success": true,
  "message": "Payment link generated successfully",
  "data": {
    "transactionId": 123,
    "invoiceId": 456,
    "clientId": 5,
    "amount": 50000,
    "status": "pending",
    "paymentLink": "https://payment.example.com/invoice/456"
  }
}
```

---

### 13. Get Payment Details
**`GET /leads/transaction/:id`**

Retrieves payment/transaction details for a specific transaction.

#### Response
```json
{
  "id": 123,
  "amount": 50000,
  "transactionType": "payment",
  "paymentMethod": "bank",
  "status": "pending",
  "clientId": 5,
  "employeeId": 2,
  "client": {
    "id": 5,
    "clientName": "John Doe",
    "companyName": "ABC Corp",
    "email": "john@abccorp.com",
    "phone": "+1234567890"
  },
  "invoice": {
    "id": 456,
    "leadId": 1,
    "invoiceNumber": "INV-2025-001"
  },
  "createdAt": "2025-01-15T10:00:00.000Z"
}
```

---

### 14. Update Payment Link Details
**`PATCH /leads/payment-link-generate/:id`**

Updates payment link details (client info or transaction details). Only the creator can update.

#### Request Body (All fields optional)
```json
{
  "clientName": "John Smith",
  "companyName": "XYZ Corp",
  "email": "john@xyzcorp.com",
  "phone": "+1234567891",
  "country": "USA",
  "state": "New York",
  "postalCode": "10001",
  "amount": 60000,
  "type": "payment",
  "method": "bank"
}
```

#### Validation
- Amount cannot exceed remaining amount in cracked lead
- Only creator (employeeId) can update the payment link

#### Response
```json
{
  "success": true,
  "message": "Payment link updated successfully",
  "transaction": {
    "id": 123,
    "amount": 60000,
    "transactionType": "payment",
    "paymentMethod": "bank"
  },
  "client": {
    "id": 5,
    "clientName": "John Smith",
    "companyName": "XYZ Corp",
    "email": "john@xyzcorp.com"
  }
}
```

---

### 15. Complete Payment
**`POST /leads/payment-link-complete/:id`**

Marks a payment as completed. Triggers multiple automated workflows.

#### Request Body (Optional)
```json
{
  "paymentMethod": "bank",
  "category": "sales"
}
```

#### Automated Workflows Triggered

1. **Updates Transaction Status** to "completed"
2. **Creates Revenue Record** in finance module
3. **Creates Client Payment Record** 
4. **Updates Cracked Lead**:
   - Decrements remaining amount
   - Increments current phase if needed
5. **Creates/Updates Project** (if first phase payment)
6. **Updates Lead Status**:
   - If all phases paid → Status becomes "completed", type becomes "upsell"
   - Otherwise → Status remains "cracked"

#### Response
```json
{
  "success": true,
  "message": "Payment completed successfully",
  "transaction": {
    "id": 123,
    "status": "completed",
    "amount": 50000
  },
  "revenue": {
    "id": 789,
    "amount": 50000,
    "source": "cracked_lead"
  },
  "crackedLead": {
    "id": 1,
    "remainingAmount": 0,
    "currentPhase": 3,
    "totalPhases": 3
  },
  "lead": {
    "id": 1,
    "status": "completed",
    "type": "upsell"
  },
  "project": {
    "id": 10,
    "name": "Project for John Doe",
    "status": "active"
  }
}
```

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
→ Generate Payment Link → Complete Payment → Update Phase/Status
```

### 4. Completed Lead Workflow
```
Update Status to "completed" → Auto-change type to "upsell" → Update commission → Update team stats
```

### 5. Push Lead Workflow
```
Set action to "push" → Change type to "push" → Reset status to "new" → Unassign lead
```

### 6. Payment & Project Workflow
```
Generate Payment Link → Customer Pays → Complete Payment → Create Revenue
→ Update Cracked Lead → Create Project (if first phase) → Update Lead Status
```

---

## 📊 Database Tables Affected

### Primary Tables
- **`leads`**: Main lead records
- **`lead_comments`**: Lead comments and notes
- **`lead_outcome_history`**: Audit trail for all changes
- **`cracked_leads`**: Converted leads with project details
- **`archive_leads`**: Failed leads moved to archive

### Related Tables
- **`sales_departments`**: Commission rates and sales data
- **`teams`**: Team statistics updates
- **`transactions`**: Payment transactions
- **`invoices`**: Payment invoices
- **`clients`**: Client information
- **`revenues`**: Revenue records
- **`projects`**: Project creation from payments

---

## ⚠️ Important Notes

### 1. Commission Rate
- **Field**: `commission_rate` in `cracked_leads`
- **Type**: `DECIMAL(5,2)` - Max value: 999.99
- **Usage**: Stores percentage (5.0 = 5%), not absolute amount
- **Calculation**: `commission_amount = total_amount × (commission_rate ÷ 100)`
- **⚠️ CRITICAL**: Commission is **NOT** a field in `UpdateLeadDto` - it's auto-fetched from sales department

### 2. Required Fields

#### For Cracking Lead:
- `status`: Must be "cracked"
- `comment`: Required
- `totalAmount`: Required
- `industryId`: Required
- **❌ DO NOT SEND `commission`** - it's auto-calculated

#### For Other Updates:
- **Outcome Updates**: Comment is mandatory
- **Push Action**: Comment is mandatory

### 3. Update Permissions
- **Users can ONLY update leads assigned to them**
- **Team Leads CANNOT update their team members' leads**
- **Managers CANNOT update subordinates' leads**
- **Only Admin has full access, but same assignment rule applies**

### 4. Role-Based Restrictions
- **Lead Creation**: Only Sales team + Admin
- **Lead Access**: Sales + HR + Admin + Marketing (limited)
- **Type Visibility**: Based on user role hierarchy
- **Archived Leads**: Requires special guard

### 5. Audit Trail
- **All Changes**: Tracked in `lead_outcome_history`
- **Comments**: Linked to history records
- **Timestamps**: All operations include proper timestamps

### 6. Payment Link Validation
- Amount cannot exceed cracked lead's remaining amount
- Only creator can update payment link
- Payment completion triggers multiple automated workflows

---

## 🧪 Testing Examples

### Test User Roles
```bash
# Sales user - should work for all endpoints
# HR user - should work for GET endpoints only
# Marketing user - should have limited access
# Admin user - should work for all endpoints
```

### Test Business Logic
```bash
# Create lead → Request leads → Update outcome → Complete → Upsell
# Test failed lead logic (4 denied attempts → archived)
# Test cracked lead creation with auto-commission
# Test push action and role restrictions
# Test payment link generation and completion
```

---

## 🚀 Getting Started

1. **Ensure Authentication**: Include JWT token in Authorization header
2. **Check User Role**: Verify user has appropriate permissions
3. **Follow Workflow**: Use APIs in the correct sequence
4. **Monitor Logs**: Check console for debugging information
5. **Validate Data**: Ensure required fields are provided
6. **Assignment Rule**: Remember you can only update your own assigned leads

---

## 📞 Support

For API issues or questions:
- Check console logs for debugging information
- Verify user permissions and role assignments
- Ensure database schema matches expectations
- Review business logic implementation
- Check if leads are assigned to you before updating

---

## 📋 Complete API Endpoint List

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| `POST` | `/leads` | Create lead | Sales, Admin |
| `GET` | `/leads` | Get all leads (hierarchical) | Sales, HR, Admin, Marketing |
| `GET` | `/leads/my-leads` | Get my assigned leads | Sales, HR, Admin, Marketing |
| `GET` | `/leads/:id` | Get single lead details | Sales, HR, Admin, Marketing |
| `POST` | `/leads/request` | Request leads (get 10) | Sales, Admin |
| `PUT` | `/leads/:id` | Update lead | Sales, Admin (own leads only) |
| `POST` | `/leads/bulk-update` | Bulk update leads | Sales, Admin |
| `GET` | `/leads/cracked` | Get cracked leads | Sales, HR, Admin |
| `GET` | `/leads/statistics/overview` | Get lead statistics | Sales, HR, Admin |
| `GET` | `/leads/filter-options/sales-units` | Get sales units | Sales, Marketing, Admin |
| `GET` | `/leads/filter-options/employees` | Get employees | Sales, Marketing, Admin |
| `GET` | `/leads/archived` | Get archived leads | Special Guard Required |
| `GET` | `/leads/archived/:id` | Get single archived lead | Special Guard Required |
| `POST` | `/leads/payment-link-generate` | Generate payment link | Sales, Admin |
| `GET` | `/leads/transaction/:id` | Get payment details | Sales, Admin |
| `PATCH` | `/leads/payment-link-generate/:id` | Update payment link | Sales, Admin (creator only) |
| `POST` | `/leads/payment-link-complete/:id` | Complete payment | Sales, Admin |

---

*Last Updated: October 2025*
*Version: 2.0 - Completely rewritten to match actual implementation*
