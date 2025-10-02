# Industry Module - Complete API Reference

Base URL: `/industries`

## Authentication
All endpoints require JWT authentication via Bearer token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

---

## 1. Create Industry

**POST** `/industries`

### Access Control
- **Departments:** Sales, Marketing, Admin
- **Guards:** JwtAuthGuard, RolesGuard, DepartmentsGuard

### Request Body
```json
{
  "name": "Technology",
  "description": "Software, IT services, and technology companies"
}
```

### Request Body Schema
| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| name | string | Yes | 3-150 chars | Industry name |
| description | string | No | Max 500 chars | Industry description |

### Response (201 Created)
```json
{
  "status": "success",
  "message": "Industry created successfully",
  "data": {
    "industry": {
      "id": 1,
      "name": "Technology",
      "description": "Software, IT services, and technology companies",
      "isActive": true,
      "createdAt": "2025-10-01T12:00:00.000Z",
      "updatedAt": "2025-10-01T12:00:00.000Z"
    }
  }
}
```

### Error Responses
```json
// 409 Conflict - Duplicate name
{
  "statusCode": 409,
  "message": "Industry with name \"Technology\" already exists",
  "error": "Conflict"
}

// 400 Bad Request - Validation error
{
  "statusCode": 400,
  "message": [
    "Industry name must be at least 3 characters long",
    "name should not be empty"
  ],
  "error": "Bad Request"
}
```

---

## 2. Get All Industries (with Filters & Pagination)

**GET** `/industries`

### Access Control
- **Roles:** dep_manager, unit_head, team_lead, senior, junior
- **Guards:** JwtAuthGuard, BlockProductionGuard, RolesGuard

### Query Parameters
| Parameter | Type | Default | Description | Validation |
|-----------|------|---------|-------------|------------|
| search | string | - | Search by name | Optional |
| isActive | boolean | - | Filter by status | true/false |
| sortBy | string | "name" | Sort field | name, createdAt, updatedAt, id |
| sortOrder | string | "asc" | Sort direction | asc, desc |
| page | number | 1 | Page number | Min: 1 |
| limit | number | 20 | Items per page | Min: 1 |

### Example Request
```
GET /industries?search=tech&isActive=true&sortBy=name&sortOrder=asc&page=1&limit=10
```

### Response (200 OK)
```json
{
  "status": "success",
  "message": "Industries retrieved successfully",
  "data": {
    "industries": [
      {
        "id": 1,
        "name": "Technology",
        "description": "Software, IT services, and technology companies",
        "isActive": true,
        "createdAt": "2025-10-01T12:00:00.000Z",
        "updatedAt": "2025-10-01T12:00:00.000Z",
        "clientsCount": 15,
        "crackedLeadsCount": 8
      },
      {
        "id": 2,
        "name": "Healthcare",
        "description": "Medical and healthcare services",
        "isActive": true,
        "createdAt": "2025-10-01T13:00:00.000Z",
        "updatedAt": "2025-10-01T13:00:00.000Z",
        "clientsCount": 10,
        "crackedLeadsCount": 5
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 2,
      "totalPages": 1
    }
  }
}
```

---

## 3. Get Active Industries Only

**GET** `/industries/active`

### Access Control
- **All authenticated users**
- **Guards:** JwtAuthGuard

### Query Parameters
None

### Response (200 OK)
```json
{
  "status": "success",
  "message": "Active industries retrieved successfully",
  "data": {
    "industries": [
      {
        "id": 1,
        "name": "Technology",
        "description": "Software, IT services, and technology companies",
        "isActive": true,
        "createdAt": "2025-10-01T12:00:00.000Z",
        "updatedAt": "2025-10-01T12:00:00.000Z"
      },
      {
        "id": 2,
        "name": "Healthcare",
        "description": "Medical and healthcare services",
        "isActive": true,
        "createdAt": "2025-10-01T13:00:00.000Z",
        "updatedAt": "2025-10-01T13:00:00.000Z"
      }
    ]
  }
}
```

**Use Case:** Perfect for dropdown menus, select inputs, and forms

---

## 4. Get Industry Statistics

**GET** `/industries/stats`

### Access Control
- **Roles:** dep_manager, unit_head, team_lead
- **Guards:** JwtAuthGuard, BlockProductionGuard, RolesGuard

### Query Parameters
None

### Response (200 OK)
```json
{
  "status": "success",
  "message": "Industry statistics retrieved successfully",
  "data": {
    "totalIndustries": 10,
    "activeIndustries": 8,
    "inactiveIndustries": 2,
    "totalClients": 45,
    "totalCrackedLeads": 23,
    "topIndustries": [
      {
        "id": 1,
        "name": "Technology",
        "clientsCount": 15,
        "crackedLeadsCount": 8
      },
      {
        "id": 2,
        "name": "Healthcare",
        "clientsCount": 10,
        "crackedLeadsCount": 5
      },
      {
        "id": 3,
        "name": "Finance",
        "clientsCount": 8,
        "crackedLeadsCount": 4
      }
    ]
  }
}
```

---

## 5. Get Industry by ID

**GET** `/industries/:id`

### Access Control
- **Roles:** dep_manager, unit_head, team_lead, senior, junior
- **Guards:** JwtAuthGuard, BlockProductionGuard, RolesGuard

### Path Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| id | number | Industry ID |

### Example Request
```
GET /industries/1
```

### Response (200 OK)
```json
{
  "status": "success",
  "message": "Industry retrieved successfully",
  "data": {
    "industry": {
      "id": 1,
      "name": "Technology",
      "description": "Software, IT services, and technology companies",
      "isActive": true,
      "createdAt": "2025-10-01T12:00:00.000Z",
      "updatedAt": "2025-10-01T12:00:00.000Z",
      "clientsCount": 15,
      "crackedLeadsCount": 8
    }
  }
}
```

### Error Response
```json
// 404 Not Found
{
  "statusCode": 404,
  "message": "Industry with ID 999 not found",
  "error": "Not Found"
}
```

---

## 6. Update Industry

**PUT** `/industries/:id`

### Access Control
- **Departments:** Sales, Marketing, Admin
- **Guards:** JwtAuthGuard, RolesGuard, DepartmentsGuard

### Path Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| id | number | Industry ID |

### Request Body
```json
{
  "name": "Information Technology",
  "description": "Updated description for IT industry",
  "isActive": true
}
```

### Request Body Schema
| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| name | string | No | 3-150 chars | Industry name |
| description | string | No | Max 500 chars | Industry description |
| isActive | boolean | No | true/false | Active status |

**Note:** All fields are optional. Only send fields you want to update.

### Response (200 OK)
```json
{
  "status": "success",
  "message": "Industry updated successfully",
  "data": {
    "industry": {
      "id": 1,
      "name": "Information Technology",
      "description": "Updated description for IT industry",
      "isActive": true,
      "createdAt": "2025-10-01T12:00:00.000Z",
      "updatedAt": "2025-10-01T14:30:00.000Z"
    }
  }
}
```

### Error Responses
```json
// 404 Not Found
{
  "statusCode": 404,
  "message": "Industry with ID 999 not found",
  "error": "Not Found"
}

// 409 Conflict - Duplicate name
{
  "statusCode": 409,
  "message": "Industry with name \"Technology\" already exists",
  "error": "Conflict"
}
```

---

## 7. Deactivate Industry (Soft Delete)

**PATCH** `/industries/:id/deactivate`

### Access Control
- **Departments:** Sales, Marketing, Admin
- **Guards:** JwtAuthGuard, RolesGuard, DepartmentsGuard

### Path Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| id | number | Industry ID |

### Request Body
None

### Example Request
```
PATCH /industries/1/deactivate
```

### Response (200 OK)
```json
{
  "status": "success",
  "message": "Industry deactivated successfully"
}
```

### Error Response
```json
// 404 Not Found
{
  "statusCode": 404,
  "message": "Industry with ID 999 not found",
  "error": "Not Found"
}

// 400 Bad Request - Already inactive
{
  "statusCode": 400,
  "message": "Industry is already inactive",
  "error": "Bad Request"
}
```

---

## 8. Reactivate Industry

**PATCH** `/industries/:id/reactivate`

### Access Control
- **Departments:** Sales, Marketing, Admin
- **Guards:** JwtAuthGuard, RolesGuard, DepartmentsGuard

### Path Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| id | number | Industry ID |

### Request Body
None

### Example Request
```
PATCH /industries/1/reactivate
```

### Response (200 OK)
```json
{
  "status": "success",
  "message": "Industry reactivated successfully",
  "data": {
    "industry": {
      "id": 1,
      "name": "Technology",
      "description": "Software, IT services, and technology companies",
      "isActive": true,
      "createdAt": "2025-10-01T12:00:00.000Z",
      "updatedAt": "2025-10-01T15:00:00.000Z"
    }
  }
}
```

### Error Response
```json
// 404 Not Found
{
  "statusCode": 404,
  "message": "Industry with ID 999 not found",
  "error": "Not Found"
}

// 400 Bad Request - Already active
{
  "statusCode": 400,
  "message": "Industry is already active",
  "error": "Bad Request"
}
```

---

## 9. Delete Industry (Hard Delete)

**DELETE** `/industries/:id`

### Access Control
- **Departments:** Sales, Marketing, Admin
- **Guards:** JwtAuthGuard, RolesGuard, DepartmentsGuard

### Path Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| id | number | Industry ID |

### Request Body
None

### Example Request
```
DELETE /industries/1
```

### Response - Success (200 OK)
```json
{
  "status": "success",
  "message": "Industry deleted successfully"
}
```

### Response - Has Dependencies (200 OK)
```json
{
  "status": "error",
  "message": "Cannot delete industry. It has associated clients or cracked leads.",
  "dependencies": {
    "clientsCount": 5,
    "crackedLeadsCount": 3
  }
}
```

### Error Response
```json
// 404 Not Found
{
  "statusCode": 404,
  "message": "Industry with ID 999 not found",
  "error": "Not Found"
}
```

---

## Common Error Responses

### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

### 403 Forbidden - Insufficient Permissions
```json
{
  "statusCode": 403,
  "message": "Forbidden resource"
}
```

### 500 Internal Server Error
```json
{
  "statusCode": 500,
  "message": "Internal server error",
  "error": "Internal Server Error"
}
```

---

## Data Models

### IndustryResponseDto
```typescript
{
  id: number;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  clientsCount?: number;        // Optional, included in detail views
  crackedLeadsCount?: number;   // Optional, included in detail views
}
```

### IndustryListResponseDto
```typescript
{
  industries: IndustryResponseDto[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

### IndustryStatsDto
```typescript
{
  totalIndustries: number;
  activeIndustries: number;
  inactiveIndustries: number;
  totalClients: number;
  totalCrackedLeads: number;
  topIndustries: {
    id: number;
    name: string;
    clientsCount: number;
    crackedLeadsCount: number;
  }[];
}
```

---

## Usage Examples

### Example 1: Create an Industry
```bash
curl -X POST http://localhost:3000/industries \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Technology",
    "description": "Software and IT services"
  }'
```

### Example 2: Search and Filter Industries
```bash
curl -X GET "http://localhost:3000/industries?search=tech&isActive=true&page=1&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Example 3: Get Active Industries for Dropdown
```bash
curl -X GET http://localhost:3000/industries/active \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Example 4: Update Industry
```bash
curl -X PUT http://localhost:3000/industries/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Information Technology",
    "isActive": true
  }'
```

### Example 5: Deactivate Industry
```bash
curl -X PATCH http://localhost:3000/industries/1/deactivate \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Testing in Postman

### Setup
1. Create a new collection: "Industry APIs"
2. Add environment variables:
   - `baseUrl`: `http://localhost:3000`
   - `token`: `<your_jwt_token>`

### Collection Variables
```json
{
  "baseUrl": "http://localhost:3000",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Authorization Header (for all requests)
```
Key: Authorization
Value: Bearer {{token}}
```

---

## Quick Reference Table

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/industries` | Create industry | Sales, Marketing, Admin |
| GET | `/industries` | List all (filtered) | Sales roles (all levels) |
| GET | `/industries/active` | List active only | All authenticated |
| GET | `/industries/stats` | Get statistics | Manager, Head, Lead |
| GET | `/industries/:id` | Get by ID | Sales roles (all levels) |
| PUT | `/industries/:id` | Update industry | Sales, Marketing, Admin |
| PATCH | `/industries/:id/deactivate` | Deactivate | Sales, Marketing, Admin |
| PATCH | `/industries/:id/reactivate` | Reactivate | Sales, Marketing, Admin |
| DELETE | `/industries/:id` | Hard delete | Sales, Marketing, Admin |

---

## Notes

1. **Soft Delete vs Hard Delete:**
   - Use PATCH `/deactivate` for temporary removal (recommended)
   - Use DELETE only when sure - checks for dependencies first

2. **Active Industries Endpoint:**
   - Optimized for dropdowns and select menus
   - No pagination, returns all active industries
   - Accessible by all authenticated users

3. **Statistics Endpoint:**
   - Provides overview of all industries
   - Shows top performers by client count
   - Restricted to managers and above

4. **Search Feature:**
   - Case-insensitive search on industry name
   - Can be combined with other filters

5. **Validation:**
   - Industry names must be unique (case-insensitive)
   - All validations happen on DTO level using class-validator

