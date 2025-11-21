# 📋 Leads GET Endpoints Documentation

## Overview
Complete documentation for all GET endpoints in the Leads API. These endpoints provide read-only access to lead data with role-based filtering, search functionality, and flexible sorting.

---

## 🔐 Authentication & Authorization

### Required Headers
```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

### Access Control
- **Sales Team**: Full access to all endpoints
- **HR**: Read-only access to all endpoints  
- **Admin**: Full access to all endpoints
- **Other Roles**: No access

---

## 📊 1. Get All Leads
**`GET /leads`**

Retrieves all leads with role-based filtering, search, sorting, and pagination.

### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `status` | string | No | - | Filter by lead status |
| `type` | string | No | - | Filter by lead type |
| `salesUnitId` | number | No | - | Filter by sales unit ID |
| `assignedTo` | number | No | - | Filter by assigned employee ID |
| `search` | string | No | - | Search by name, email, or phone |
| `sortBy` | string | No | "createdAt" | Sort field |
| `sortOrder` | string | No | "desc" | Sort direction (asc/desc) |
| `page` | number | No | 1 | Page number |
| `limit` | number | No | 20 | Items per page |

### Role-Based Type Filtering

| User Role | Visible Lead Types |
|-----------|-------------------|
| **junior** | warm, cold |
| **senior** | warm, cold, push |
| **dep_manager** | warm, cold, push, upsell |
| **team_lead** | warm, cold, push, upsell |
| **unit_head** | warm, cold, push, upsell |
| **admin** | warm, cold, push, upsell |

### Valid Sort Fields
- `id`, `name`, `email`, `phone`, `status`, `outcome`, `type`, `createdAt`, `updatedAt`

### Example Requests

```bash
# Basic request
GET /leads

# Search for leads containing "john"
GET /leads?search=john

# Filter by status and sort by name
GET /leads?status=new&sortBy=name&sortOrder=asc

# Complex query with pagination
GET /leads?search=company&status=in_progress&type=warm&sortBy=updatedAt&sortOrder=desc&page=2&limit=10
```

### Response Format (Lightweight List)

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

---

## 👤 2. Get My Leads
**`GET /leads/my-leads`**

Retrieves leads assigned to the current authenticated user.

### Query Parameters
Same as GET /leads, but automatically filters by `assignedToId = current_user_id`

### Example Requests

```bash
# Get my leads
GET /leads/my-leads

# Search my leads
GET /leads/my-leads?search=urgent

# Filter my leads by status
GET /leads/my-leads?status=in_progress&sortBy=createdAt&sortOrder=desc
```

### Response Format
Same lightweight format as GET /leads

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
      "updatedAt": "2025-01-15T11:30:00.000Z",
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

## 🔍 3. Get Single Lead
**`GET /leads/:id`**

Retrieves a specific lead by ID with comprehensive details.

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | number | Yes | Lead ID |

### Example Request

```bash
GET /leads/123
```

### Response Format (Comprehensive Detail)

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

## 💰 4. Get Cracked Leads
**`GET /leads/cracked-leads`**

Retrieves all cracked leads with filtering and pagination.

### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `amount` | number | No | - | Filter by minimum amount |
| `employeeId` | number | No | - | Filter by employee who closed the lead |
| `page` | number | No | 1 | Page number |
| `limit` | number | No | 20 | Items per page |

### Example Requests

```bash
# Get all cracked leads
GET /leads/cracked-leads

# Filter by minimum amount
GET /leads/cracked-leads?amount=10000

# Filter by employee
GET /leads/cracked-leads?employeeId=123&page=2&limit=10
```

### Response Format

```json
{
  "crackedLeads": [
    {
      "id": 1,
      "amount": 50000,
      "commissionRate": 5.0,
      "description": "Enterprise software solution",
      "crackedAt": "2025-01-15T11:30:00.000Z",
      "totalPhases": 3,
      "currentPhase": 1,
      "remainingAmount": 50000,
      "industryId": 1,
      "leadId": 1,
      "closedBy": 2,
      "lead": {
        "id": 1,
        "name": "John Doe",
        "email": "john.doe@example.com",
        "phone": "+1234567890",
        "assignedTo": {
          "firstName": "Jane",
          "lastName": "Smith"
        },
        "salesUnit": {
          "name": "Sales Unit A"
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

## 📈 5. Lead Statistics
**`GET /leads/statistics/overview`**

Returns comprehensive lead analytics with role-based filtering.

### Query Parameters
None (automatically filters by user role and unit)

### Example Request

```bash
GET /leads/statistics/overview
```

### Response Format

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

## ❌ Error Responses

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
  "message": "Lead not found",
  "error": "Not Found"
}
```

### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": "Invalid query parameters",
  "error": "Bad Request"
}
```

---

## 🎯 Best Practices

### 1. Performance Optimization
- **List Views**: Use GET /leads or GET /leads/my-leads for fast loading
- **Detail Views**: Use GET /leads/:id for comprehensive information
- **Pagination**: Always implement pagination for large datasets
- **Search**: Use search parameter for filtering large lists

### 2. Query Optimization
- **Combine Filters**: Use multiple query parameters for precise filtering
- **Sorting**: Use sortBy and sortOrder for consistent data ordering
- **Limit Results**: Use limit parameter to control response size

### 3. Error Handling
- **Check Status Codes**: Always handle different HTTP status codes
- **Validate Responses**: Ensure response structure matches expectations
- **Handle Empty Results**: Account for empty arrays in responses

### 4. Security
- **JWT Tokens**: Always include valid JWT tokens in requests
- **Role Validation**: Verify user roles before making requests
- **Input Validation**: Validate all query parameters

---

## 🧪 Testing Examples

### Test Search Functionality
```bash
# Search by name
GET /leads?search=john

# Search by email
GET /leads?search=@company.com

# Search by phone
GET /leads?search=123-456
```

### Test Sorting
```bash
# Sort by name ascending
GET /leads?sortBy=name&sortOrder=asc

# Sort by creation date descending
GET /leads?sortBy=createdAt&sortOrder=desc

# Sort by status
GET /leads?sortBy=status&sortOrder=asc
```

### Test Filtering
```bash
# Filter by status
GET /leads?status=in_progress

# Filter by type
GET /leads?type=warm

# Combine filters
GET /leads?status=new&type=warm&salesUnitId=1
```

---

*Last Updated: January 2025*
*Version: 1.0*
