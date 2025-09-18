# 🔄 Leads PUT Endpoints Documentation

## Overview
Complete documentation for all PUT endpoints in the Leads API. These endpoints handle lead updates, status changes, and special actions with complex business logic.

---

## 🔐 Authentication & Authorization

### Required Headers
```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

### Access Control
- **Sales Team**: Full access to update their assigned leads
- **HR**: No access to PUT endpoints
- **Admin**: Full access to all PUT endpoints
- **Other Roles**: No access

---

## 📝 1. Update Lead (Main API)
**`PUT /leads/:id`**

Main API for updating leads with complex business logic. Handles all lead modifications including outcome, status, and special actions.

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | number | Yes | Lead ID to update |

### Request Body Schema

```typescript
{
  // Optional fields - send only what you want to update
  "outcome"?: LeadOutcome,           // See enum values below
  "status"?: LeadStatus,             // See enum values below  
  "type"?: LeadType,                 // See enum values below
  "comment"?: string,                // Required when updating outcome
  "action"?: "push",                 // Only accepts "push" value
  
  // Fields for cracked lead creation (when status = "cracked")
  "totalAmount"?: number,            // Required for cracked leads
  "industryId"?: number,             // Required for cracked leads
  "description"?: string,            // Optional description
  "totalPhases"?: number,            // Optional, defaults to 1
  "currentPhase"?: number            // Optional, defaults to 1
}
```

### Enum Values

#### LeadOutcome
```typescript
"voice_mail" | "interested" | "not_answered" | "busy" | "denied"
```

#### LeadStatus
```typescript
"new" | "in_progress" | "completed" | "payment_link_generated" | "failed" | "cracked"
```

#### LeadType
```typescript
"warm" | "cold" | "upsell" | "push"
```

### Business Logic Rules

#### Required Combinations
1. **When updating `outcome`**: `comment` is **REQUIRED**
2. **When setting `status` to "cracked"**: 
   - `industryId` is **REQUIRED**
   - `totalAmount` is **REQUIRED**
   - Lead must have `outcome = "interested"` first
   - Lead must be assigned to current user

#### Status Transition Rules
1. **Lead must be "in_progress"** before setting `outcome = "interested"`
2. **Lead must have "interested" outcome** before setting `status = "cracked"`
3. **Lead must be cracked** before setting `status = "completed"`
4. **Failed count tracking**: After 4 "denied" outcomes, lead is automatically archived
5. **Push action**: Sets lead type to "push", status to "new", clears assignment

---

## 📋 Request Examples

### A. Update Lead Outcome (Requires Comment)
```json
{
  "outcome": "interested",
  "comment": "Customer showed strong interest in our services. Scheduled follow-up call for next week."
}
```

### B. Update Status to "cracked" (Requires Cracked Lead Fields)
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

### C. Update Status to "completed"
```json
{
  "status": "completed",
  "comment": "Project completed successfully. All deliverables met."
}
```

### D. Push Lead (Makes it available to higher roles)
```json
{
  "action": "push",
  "comment": "Lead needs senior sales rep attention. Customer has complex requirements."
}
```

### E. Mark as "denied" (Tests failed lead logic)
```json
{
  "outcome": "denied",
  "comment": "Customer not interested. Budget constraints mentioned."
}
```

---

## 📤 Response Formats

### Successful Update Response
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
  
  // Relations
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
  },
  "comments": [
    {
      "id": 1,
      "commentText": "Customer showed strong interest",
      "createdAt": "2025-01-15T11:30:00.000Z",
      "employee": {
        "firstName": "Jane",
        "lastName": "Smith"
      }
    }
  ],
  "outcomeHistory": [
    {
      "id": 1,
      "outcome": "interested",
      "createdAt": "2025-01-15T11:30:00.000Z",
      "changedByUser": {
        "firstName": "Jane",
        "lastName": "Smith"
      },
      "comment": {
        "commentText": "Customer showed strong interest"
      }
    }
  ],
  
  // Additional data for cracked leads
  "crackedLead": {
    "id": 1,
    "amount": 50000,
    "commissionRate": 5.0,
    "industryId": 1,
    "description": "Enterprise software solution",
    "totalPhases": 3,
    "currentPhase": 1
  },
  
  "teamUpdate": null
}
```

### Special Response for Archived Leads
```json
{
  "message": "Lead moved to Archived lead",
  "leadId": 1,
  "status": "failed",
  "archived": true
}
```

---

## 🔄 2. Mark Upsell Lead
**`PUT /leads/:id/upsell`**

Separate API for marking leads as upsell. Lead must be in "completed" status.

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | number | Yes | Lead ID to mark as upsell |

### Request Body

```json
{
  "comment": "Customer interested in additional services. Upselling opportunity identified."
}
```

### Request Body Schema

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `comment` | string | Yes | Comment explaining the upsell opportunity |

### Response Format

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
    "id": 1,
    "outcome": "upsell",
    "changedBy": 1,
    "commentId": 1
  }
}
```

---

## 💰 3. Update Cracked Lead
**`PUT /leads/cracked-leads/:id`**

Updates details of a cracked lead.

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | number | Yes | Cracked lead ID to update |

### Request Body

```json
{
  "description": "Updated project description with additional requirements",
  "amount": 75000,
  "commissionRate": 8.5,
  "totalPhases": 4,
  "currentPhase": 2
}
```

### Request Body Schema

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `description` | string | No | Project description |
| `amount` | number | No | Total project amount |
| `commissionRate` | number | No | Commission rate (percentage) |
| `totalPhases` | number | No | Total number of phases |
| `currentPhase` | number | No | Current phase number |

### Response Format

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

## ❌ Error Responses

### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": "Comment is required when updating outcome",
  "error": "Bad Request"
}
```

### 403 Forbidden
```json
{
  "statusCode": 403,
  "message": "You can only update leads assigned to you",
  "error": "Forbidden"
}
```

### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "Lead not found",
  "error": "Not Found"
}
```

### 422 Unprocessable Entity
```json
{
  "statusCode": 422,
  "message": [
    "outcome must be one of the following values: voice_mail, interested, not_answered, busy, denied",
    "status must be one of the following values: new, in_progress, completed, payment_link_generated, failed, cracked"
  ],
  "error": "Unprocessable Entity"
}
```

---

## 🎯 Best Practices

### 1. Lead Updates
- **Always include comment when updating outcome**
- **Check lead status before allowing certain updates**
- **Handle the special archived response format**
- **Validate required fields for cracked leads**
- **Use proper enum values (case-sensitive)**

### 2. Business Logic
- **Follow status transition rules**
- **Validate prerequisites before status changes**
- **Handle failed lead archiving logic**
- **Track commission rates properly**

### 3. Error Handling
- **Check HTTP status codes**
- **Handle validation errors**
- **Manage permission errors**
- **Process archived lead responses**

### 4. Security
- **Include JWT token in Authorization header**
- **Verify user permissions**
- **Validate input data**
- **Check lead ownership**

---

## 🧪 Testing Examples

### Test Outcome Updates
```bash
# Test successful outcome update
PUT /leads/1
{
  "outcome": "interested",
  "comment": "Customer showed interest"
}

# Test missing comment (should fail)
PUT /leads/1
{
  "outcome": "interested"
}

# Test invalid outcome (should fail)
PUT /leads/1
{
  "outcome": "invalid_outcome",
  "comment": "Test comment"
}
```

### Test Status Updates
```bash
# Test cracked status update
PUT /leads/1
{
  "status": "cracked",
  "comment": "Lead converted",
  "totalAmount": 50000,
  "industryId": 1
}

# Test completed status update
PUT /leads/1
{
  "status": "completed",
  "comment": "Project completed"
}

# Test missing required fields (should fail)
PUT /leads/1
{
  "status": "cracked",
  "comment": "Lead converted"
}
```

### Test Push Action
```bash
# Test successful push
PUT /leads/1
{
  "action": "push",
  "comment": "Needs senior attention"
}

# Test missing comment (should fail)
PUT /leads/1
{
  "action": "push"
}
```

### Test Failed Lead Logic
```bash
# Test first denial
PUT /leads/1
{
  "outcome": "denied",
  "comment": "Not interested"
}

# Test fourth denial (should archive)
PUT /leads/1
{
  "outcome": "denied",
  "comment": "Still not interested"
}
```

---

## 🔄 Business Workflows

### 1. Lead Progression Workflow
```
Create Lead → Request Leads → Update Outcome → Mark Cracked → Complete → Upsell
```

### 2. Failed Lead Workflow
```
Update Outcome to "denied" → Increment failedCount → At threshold 4 → Archive Lead
```

### 3. Cracked Lead Workflow
```
Update Outcome to "interested" → Update Status to "cracked" → Create cracked_lead record
```

### 4. Push Lead Workflow
```
Set action to "push" → Change type to "push" → Reset status to "new" → Unassign lead
```

---

*Last Updated: January 2025*
*Version: 1.0*
