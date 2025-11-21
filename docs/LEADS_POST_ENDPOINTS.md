# 📝 Leads POST Endpoints Documentation

## Overview
Complete documentation for all POST endpoints in the Leads API. These endpoints handle lead creation, lead requests, and bulk operations.

---

## 🔐 Authentication & Authorization

### Required Headers
```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

### Access Control
- **Sales Team**: Full access to all POST endpoints
- **HR**: No access to POST endpoints
- **Admin**: Full access to all POST endpoints
- **Other Roles**: No access

---

## 🆕 1. Create Lead
**`POST /leads`**

Creates a new lead with default values. Only sales team and admin users can create leads.

### Request Body

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

### Request Body Schema

| Field | Type | Required | Description | Valid Values |
|-------|------|----------|-------------|--------------|
| `name` | string | No | Lead's full name | Any string |
| `email` | string | No | Lead's email address | Valid email format |
| `phone` | string | No | Lead's phone number | Any string |
| `source` | string | No | Lead source | "PPC", "SMM" |
| `type` | string | **Yes** | Lead type | "warm", "cold", "upsell", "push" |
| `salesUnitId` | number | **Yes** | Sales unit ID | Valid sales unit ID |

### Default Values Set Automatically
- `status`: "new"
- `outcome`: null
- `assignedToId`: null
- `startedById`: null
- `failedCount`: 0

### Example Requests

```bash
# Minimal required fields
POST /leads
{
  "type": "warm",
  "salesUnitId": 1
}

# Full lead creation
POST /leads
{
  "name": "John Doe",
  "email": "john.doe@example.com",
  "phone": "+1234567890",
  "source": "PPC",
  "type": "warm",
  "salesUnitId": 1
}
```

### Response Format

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

## 📋 2. Request Leads
**`POST /leads/request`**

Allows salespersons to request leads (get 10 total). Implements the "Getting Leads" workflow.

### Request Body

```json
{
  "employeeId": 1,
  "keptLeadIds": [1, 2, 3]
}
```

### Request Body Schema

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `employeeId` | number | **Yes** | ID of the employee requesting leads |
| `keptLeadIds` | number[] | No | Array of lead IDs to keep assigned |

### Workflow Process

1. **Validate Employee**: Ensures employee exists and is active
2. **Circulate Leads**: Non-kept leads are returned to the pool
3. **Validate Circulation**: Ensures leads to circulate have outcomes
4. **Assign New Leads**: Assigns exactly 10 new leads
5. **Update Status**: New leads get status "in_progress"

### Business Logic

- **Lead Circulation**: Only `in_progress` leads without outcomes are circulated
- **Priority Order**: Warm leads are assigned before cold leads
- **Assignment**: New leads are assigned to the requesting employee
- **Status Update**: New leads automatically get "in_progress" status

### Example Requests

```bash
# Request new leads without keeping any
POST /leads/request
{
  "employeeId": 1
}

# Request new leads while keeping some existing ones
POST /leads/request
{
  "employeeId": 1,
  "keptLeadIds": [1, 2, 3]
}
```

### Response Format

```json
{
  "assignedLeads": [
    {
      "id": 6,
      "name": "New Lead 1",
      "email": "new1@example.com",
      "phone": "+1234567890",
      "type": "warm",
      "status": "in_progress",
      "assignedTo": {
        "firstName": "Jane",
        "lastName": "Smith"
      },
      "salesUnit": {
        "name": "Sales Unit A"
      }
    },
    {
      "id": 7,
      "name": "New Lead 2",
      "email": "new2@example.com",
      "phone": "+1234567891",
      "type": "warm",
      "status": "in_progress",
      "assignedTo": {
        "firstName": "Jane",
        "lastName": "Smith"
      },
      "salesUnit": {
        "name": "Sales Unit A"
      }
    }
  ],
  "keptLeads": [
    {
      "id": 1,
      "name": "Existing Lead 1",
      "email": "existing1@example.com",
      "phone": "+1234567892",
      "type": "warm",
      "status": "in_progress",
      "assignedTo": {
        "firstName": "Jane",
        "lastName": "Smith"
      },
      "salesUnit": {
        "name": "Sales Unit A"
      }
    }
  ],
  "totalActiveLeads": 10,
  "circulatedLeads": 2
}
```

---

## 🔄 3. Bulk Update Leads
**`POST /leads/bulk-update`**

Updates multiple leads at once with batch processing and error handling.

### Request Body

```json
{
  "leadIds": [1, 2, 3, 4, 5],
  "updateData": {
    "status": "in_progress",
    "comment": "Bulk update: All leads moved to in-progress status"
  }
}
```

### Request Body Schema

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `leadIds` | number[] | **Yes** | Array of lead IDs to update |
| `updateData` | object | **Yes** | Update data (same as PUT /leads/:id) |

### Update Data Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `outcome` | string | No | Lead outcome |
| `status` | string | No | Lead status |
| `type` | string | No | Lead type |
| `comment` | string | No | Comment text |
| `action` | string | No | Action (only "push" allowed) |
| `totalAmount` | number | No | Total amount (for cracked leads) |
| `industryId` | number | No | Industry ID (for cracked leads) |
| `description` | string | No | Description (for cracked leads) |
| `totalPhases` | number | No | Total phases (for cracked leads) |
| `currentPhase` | number | No | Current phase (for cracked leads) |

### Processing Logic

- **Batch Processing**: Updates are processed in parallel using `Promise.allSettled`
- **Error Handling**: Individual failures don't stop other updates
- **Validation**: Each update follows the same validation rules as individual updates
- **Results Tracking**: Returns detailed results for each lead update attempt

### Example Requests

```bash
# Bulk status update
POST /leads/bulk-update
{
  "leadIds": [1, 2, 3],
  "updateData": {
    "status": "in_progress",
    "comment": "Moving leads to in-progress status"
  }
}

# Bulk outcome update
POST /leads/bulk-update
{
  "leadIds": [4, 5, 6],
  "updateData": {
    "outcome": "interested",
    "comment": "All leads showed interest"
  }
}

# Bulk push action
POST /leads/bulk-update
{
  "leadIds": [7, 8, 9],
  "updateData": {
    "action": "push",
    "comment": "These leads need senior attention"
  }
}
```

### Response Format

```json
{
  "total": 5,
  "successful": 4,
  "failed": 1,
  "results": [
    {
      "leadId": 1,
      "status": "fulfilled",
      "data": {
        "id": 1,
        "status": "in_progress",
        "comment": "Lead updated successfully"
      },
      "error": null
    },
    {
      "leadId": 2,
      "status": "fulfilled",
      "data": {
        "id": 2,
        "status": "in_progress",
        "comment": "Lead updated successfully"
      },
      "error": null
    },
    {
      "leadId": 3,
      "status": "rejected",
      "data": null,
      "error": "Lead not found"
    }
  ]
}
```

---

## ❌ Error Responses

### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": "Sales unit not found",
  "error": "Bad Request"
}
```

### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

### 403 Forbidden
```json
{
  "statusCode": 403,
  "message": "Access denied. Insufficient permissions.",
  "error": "Forbidden"
}
```

### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "Employee not found or inactive",
  "error": "Not Found"
}
```

### 422 Unprocessable Entity
```json
{
  "statusCode": 422,
  "message": [
    "type must be one of the following values: warm, cold, upsell, push",
    "salesUnitId must be a number"
  ],
  "error": "Unprocessable Entity"
}
```

---

## 🎯 Best Practices

### 1. Lead Creation
- **Required Fields**: Always include `type` and `salesUnitId`
- **Validation**: Ensure sales unit exists before creation
- **Default Values**: System sets appropriate defaults automatically
- **ID Assignment**: System assigns sequential IDs automatically

### 2. Lead Requests
- **Employee Validation**: Ensure employee is active and assigned to sales unit
- **Lead Circulation**: Only circulate leads that have outcomes
- **Batch Size**: System always assigns exactly 10 leads
- **Priority**: Warm leads are prioritized over cold leads

### 3. Bulk Updates
- **Batch Size**: Consider performance implications for large batches
- **Error Handling**: Always check individual results in response
- **Validation**: Each update follows individual validation rules
- **Comments**: Include meaningful comments for audit trails

### 4. Security
- **Authentication**: Always include valid JWT tokens
- **Authorization**: Verify user permissions before operations
- **Input Validation**: Validate all request data
- **Error Messages**: Don't expose sensitive information in errors

---

## 🧪 Testing Examples

### Test Lead Creation
```bash
# Test minimal creation
POST /leads
{
  "type": "warm",
  "salesUnitId": 1
}

# Test full creation
POST /leads
{
  "name": "Test Lead",
  "email": "test@example.com",
  "phone": "+1234567890",
  "source": "PPC",
  "type": "cold",
  "salesUnitId": 2
}

# Test validation
POST /leads
{
  "type": "invalid_type",
  "salesUnitId": 999
}
```

### Test Lead Requests
```bash
# Test basic request
POST /leads/request
{
  "employeeId": 1
}

# Test with kept leads
POST /leads/request
{
  "employeeId": 1,
  "keptLeadIds": [1, 2, 3]
}

# Test invalid employee
POST /leads/request
{
  "employeeId": 999
}
```

### Test Bulk Updates
```bash
# Test successful bulk update
POST /leads/bulk-update
{
  "leadIds": [1, 2, 3],
  "updateData": {
    "status": "in_progress",
    "comment": "Bulk status update"
  }
}

# Test mixed results
POST /leads/bulk-update
{
  "leadIds": [1, 999, 3],
  "updateData": {
    "outcome": "interested",
    "comment": "Bulk outcome update"
  }
}
```

---

*Last Updated: January 2025*
*Version: 1.0*
