# 🏭 Industry Management API Documentation

## Overview
Complete API documentation for the Industry Management System. This system handles industry data used across the CRM for clients and cracked leads, with soft delete capabilities and comprehensive filtering.

---

## 🔐 Authentication & Authorization

### Guards
- **`JwtAuthGuard`**: Ensures user is authenticated
- **`RolesGuard`**: Enforces role-based access control
- **`DepartmentsGuard`**: Restricts access by department
- **`BlockProductionGuard`**: Blocks production department from accessing

### Access Control Matrix

| User Type | View Industries | Create Industry | Update Industry | Delete/Deactivate |
|-----------|----------------|-----------------|-----------------|-------------------|
| **Sales (All Roles)** | ✅ YES | ✅ YES | ✅ YES | ✅ YES |
| **Marketing Manager** | ✅ YES | ✅ YES | ✅ YES | ✅ YES |
| **Admin** | ✅ YES | ✅ YES | ✅ YES | ✅ YES |
| **HR** | ❌ NO | ❌ NO | ❌ NO | ❌ NO |
| **Production** | ❌ NO | ❌ NO | ❌ NO | ❌ NO |
| **Finance** | ❌ NO | ❌ NO | ❌ NO | ❌ NO |

### Sales Roles with Access
- `dep_manager` - Department Manager
- `unit_head` - Unit Head
- `team_lead` - Team Lead
- `senior` - Senior Sales Representative
- `junior` - Junior Sales Representative
- `marketing_manager` - Marketing Manager

---

## 📋 API Endpoints

### 1. Create Industry
**`POST /industries`**

Creates a new industry. Industry names must be unique (case-insensitive).

#### Access Control
- **Authentication**: JWT token required
- **Departments**: Sales, Marketing, Admin
- **Roles**: All sales roles + marketing_manager

#### Request Body
```json
{
  "name": "Technology",
  "description": "Software, IT, and technology companies"
}
```

#### Required Fields
- `name`: Industry name (3-150 characters, must be unique)

#### Optional Fields
- `description`: Industry description (max 500 characters)

#### Response
```json
{
  "status": "success",
  "message": "Industry created successfully",
  "data": {
    "industry": {
      "id": 1,
      "name": "Technology",
      "description": "Software, IT, and technology companies",
      "isActive": true,
      "createdAt": "2025-10-01T10:00:00.000Z",
      "updatedAt": "2025-10-01T10:00:00.000Z"
    }
  }
}
```

#### Error Responses
- `409 Conflict`: Industry with the same name already exists
- `400 Bad Request`: Validation errors (name too short/long, etc.)
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: Insufficient permissions

---

### 2. Get All Industries
**`GET /industries`**

Retrieves all industries with comprehensive filtering, search, sorting, and pagination.

#### Access Control
- **Authentication**: JWT token required
- **Roles**: All sales roles + marketing_manager
- **Guard**: BlockProductionGuard (blocks production department)

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `search` | string | No | - | Search by name or description (case-insensitive) |
| `isActive` | boolean | No | - | Filter by active/inactive status |
| `sortBy` | string | No | `name` | Sort field: name, createdAt, updatedAt, id |
| `sortOrder` | string | No | `asc` | Sort direction: asc or desc |
| `page` | number | No | `1` | Page number (min: 1) |
| `limit` | number | No | `20` | Items per page (min: 1) |

#### Example Requests
```bash
# Get all active industries
GET /industries?isActive=true

# Search for "tech" in names/descriptions
GET /industries?search=tech

# Get inactive industries, sorted by creation date
GET /industries?isActive=false&sortBy=createdAt&sortOrder=desc

# Paginated results
GET /industries?page=2&limit=10

# Combined filters
GET /industries?search=health&isActive=true&sortBy=name&page=1&limit=20
```

#### Response
```json
{
  "status": "success",
  "message": "Industries retrieved successfully",
  "data": {
    "industries": [
      {
        "id": 1,
        "name": "Technology",
        "description": "Software, IT, and technology companies",
        "isActive": true,
        "createdAt": "2025-10-01T10:00:00.000Z",
        "updatedAt": "2025-10-01T10:00:00.000Z",
        "clientsCount": 45,
        "crackedLeadsCount": 23
      },
      {
        "id": 2,
        "name": "Healthcare",
        "description": "Medical and healthcare services",
        "isActive": true,
        "createdAt": "2025-10-01T11:00:00.000Z",
        "updatedAt": "2025-10-01T11:00:00.000Z",
        "clientsCount": 32,
        "crackedLeadsCount": 18
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 2,
      "totalPages": 1
    }
  }
}
```

---

### 3. Get Active Industries (For Dropdowns)
**`GET /industries/active`**

Retrieves only active industries, optimized for dropdown menus. Accessible by all authenticated users.

#### Access Control
- **Authentication**: JWT token required
- **No role restrictions** - all authenticated users can access

#### Response
```json
{
  "status": "success",
  "message": "Active industries retrieved successfully",
  "data": {
    "industries": [
      {
        "id": 1,
        "name": "Technology",
        "description": "Software, IT, and technology companies",
        "isActive": true,
        "createdAt": "2025-10-01T10:00:00.000Z",
        "updatedAt": "2025-10-01T10:00:00.000Z"
      },
      {
        "id": 2,
        "name": "Healthcare",
        "description": "Medical and healthcare services",
        "isActive": true,
        "createdAt": "2025-10-01T11:00:00.000Z",
        "updatedAt": "2025-10-01T11:00:00.000Z"
      }
    ]
  }
}
```

---

### 4. Get Industry Statistics
**`GET /industries/stats`**

Returns comprehensive industry statistics including counts and top performing industries.

#### Access Control
- **Authentication**: JWT token required
- **Roles**: dep_manager, unit_head, team_lead, marketing_manager
- **Guard**: BlockProductionGuard

#### Response
```json
{
  "status": "success",
  "message": "Industry statistics retrieved successfully",
  "data": {
    "totalIndustries": 15,
    "activeIndustries": 12,
    "inactiveIndustries": 3,
    "totalClients": 145,
    "totalCrackedLeads": 89,
    "topIndustries": [
      {
        "id": 1,
        "name": "Technology",
        "clientsCount": 45,
        "crackedLeadsCount": 23
      },
      {
        "id": 2,
        "name": "Healthcare",
        "clientsCount": 32,
        "crackedLeadsCount": 18
      },
      {
        "id": 3,
        "name": "Finance",
        "clientsCount": 28,
        "crackedLeadsCount": 15
      },
      {
        "id": 4,
        "name": "Retail",
        "clientsCount": 20,
        "crackedLeadsCount": 12
      },
      {
        "id": 5,
        "name": "Manufacturing",
        "clientsCount": 15,
        "crackedLeadsCount": 10
      }
    ]
  }
}
```

#### Response Fields
- **totalIndustries**: Total number of industries (active + inactive)
- **activeIndustries**: Number of active industries
- **inactiveIndustries**: Number of inactive industries
- **totalClients**: Total clients across all industries
- **totalCrackedLeads**: Total cracked leads across all industries
- **topIndustries**: Top 5 industries by total clients and cracked leads

---

### 5. Get Single Industry
**`GET /industries/:id`**

Retrieves a specific industry by ID with detailed statistics.

#### Access Control
- **Authentication**: JWT token required
- **Roles**: All sales roles + marketing_manager
- **Guard**: BlockProductionGuard

#### Response
```json
{
  "status": "success",
  "message": "Industry retrieved successfully",
  "data": {
    "industry": {
      "id": 1,
      "name": "Technology",
      "description": "Software, IT, and technology companies",
      "isActive": true,
      "createdAt": "2025-10-01T10:00:00.000Z",
      "updatedAt": "2025-10-01T10:00:00.000Z",
      "clientsCount": 45,
      "crackedLeadsCount": 23
    }
  }
}
```

#### Error Responses
- `404 Not Found`: Industry with specified ID does not exist

---

### 6. Update Industry
**`PUT /industries/:id`**

Updates an existing industry. All fields are optional (partial update).

#### Access Control
- **Authentication**: JWT token required
- **Departments**: Sales, Marketing, Admin
- **Roles**: All sales roles + marketing_manager

#### Request Body (All Optional)
```json
{
  "name": "Information Technology",
  "description": "Updated description for IT industry",
  "isActive": true
}
```

#### Optional Fields
- `name`: Updated industry name (must remain unique)
- `description`: Updated description
- `isActive`: Active status (true/false)

#### Response
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
      "createdAt": "2025-10-01T10:00:00.000Z",
      "updatedAt": "2025-10-01T14:00:00.000Z"
    }
  }
}
```

#### Error Responses
- `404 Not Found`: Industry with specified ID does not exist
- `409 Conflict`: Updated name conflicts with existing industry

---

### 7. Deactivate Industry (Soft Delete)
**`PATCH /industries/:id/deactivate`**

Soft deletes an industry by setting `isActive = false`. This is the preferred method for removing industries as it preserves historical data.

#### Access Control
- **Authentication**: JWT token required
- **Departments**: Sales, Marketing, Admin
- **Roles**: All sales roles + marketing_manager

#### Response
```json
{
  "status": "success",
  "message": "Industry \"Technology\" has been deactivated successfully"
}
```

#### Error Responses
- `404 Not Found`: Industry with specified ID does not exist
- `400 Bad Request`: Industry is already inactive

---

### 8. Reactivate Industry
**`PATCH /industries/:id/reactivate`**

Reactivates a previously deactivated industry by setting `isActive = true`.

#### Access Control
- **Authentication**: JWT token required
- **Departments**: Sales, Marketing, Admin
- **Roles**: All sales roles + marketing_manager

#### Response
```json
{
  "status": "success",
  "message": "Industry reactivated successfully",
  "data": {
    "industry": {
      "id": 1,
      "name": "Technology",
      "description": "Software, IT, and technology companies",
      "isActive": true,
      "createdAt": "2025-10-01T10:00:00.000Z",
      "updatedAt": "2025-10-01T15:00:00.000Z"
    }
  }
}
```

#### Error Responses
- `404 Not Found`: Industry with specified ID does not exist
- `400 Bad Request`: Industry is already active

---

### 9. Delete Industry (Hard Delete)
**`DELETE /industries/:id`**

Permanently deletes an industry from the database. **This endpoint checks for dependencies and will prevent deletion if clients or cracked leads are using this industry.**

#### Access Control
- **Authentication**: JWT token required
- **Departments**: Sales, Marketing, Admin
- **Roles**: All sales roles + marketing_manager

#### Success Response (No Dependencies)
```json
{
  "status": "success",
  "message": "Industry \"Technology\" has been deleted successfully"
}
```

#### Error Response (Has Dependencies)
```json
{
  "status": "error",
  "message": "Cannot delete industry. Dependencies exist. Please reassign or remove dependencies first.",
  "dependencies": {
    "clients": {
      "count": 45
    },
    "crackedLeads": {
      "count": 23
    }
  }
}
```

#### Error Responses
- `404 Not Found`: Industry with specified ID does not exist

#### Important Notes
- **Recommended**: Use soft delete (deactivate) instead of hard delete
- **Dependencies Check**: System prevents deletion if industry is in use
- **Data Integrity**: Deleting will fail if any client or cracked lead references this industry

---

## 🔄 Business Workflows

### 1. Industry Creation Workflow
```
Create Industry → Used in Client/Lead Forms → Industry appears in dropdowns
```

### 2. Industry Deactivation Workflow
```
Deactivate Industry → Industry hidden from dropdowns → Historical data preserved → Can be reactivated later
```

### 3. Industry Update Workflow
```
Update Industry Name/Description → All clients/leads show updated info automatically
```

### 4. Industry Deletion Workflow (With Dependencies)
```
Attempt Delete → Check Dependencies → If exists, return error with counts → User must reassign first
```

### 5. Industry Deletion Workflow (No Dependencies)
```
Attempt Delete → No dependencies found → Industry permanently deleted → Success
```

---

## 📊 Database Tables Affected

### Primary Table
- **`industries`**: Main industry records

### Related Tables
- **`clients`**: Has `industryId` foreign key
- **`cracked_leads`**: Has `industryId` foreign key

---

## ⚠️ Important Notes

### 1. Unique Name Constraint
- **Field**: `name` in `industries` table
- **Type**: `VARCHAR(150)` with UNIQUE constraint
- **Validation**: Case-insensitive uniqueness check
- **Example**: "Technology" and "technology" are considered duplicates

### 2. Soft Delete vs Hard Delete
- **Soft Delete (Recommended)**: Sets `isActive = false`, preserves all data
- **Hard Delete**: Permanently removes from database, only allowed if no dependencies
- **Best Practice**: Always use soft delete for industries in production

### 3. Dependencies
- **Clients**: Can be associated with an industry
- **Cracked Leads**: Must have an industry when created
- **Deletion**: Blocked if any dependencies exist

### 4. Active Industries
- **Default**: New industries are created with `isActive = true`
- **Dropdowns**: Only active industries appear in frontend dropdowns
- **Filtering**: Both active and inactive can be viewed with filters

### 5. Pagination
- **Default Limit**: 20 items per page
- **Maximum**: No hard limit, but recommended to keep under 100
- **Performance**: Queries are optimized with proper indexing

---

## 🧪 Testing Examples

### Test Industry CRUD Operations
```bash
# Create industry
POST /industries
{
  "name": "Technology",
  "description": "Tech companies"
}

# Get all industries
GET /industries

# Get active industries only
GET /industries?isActive=true

# Search industries
GET /industries?search=tech

# Update industry
PUT /industries/1
{
  "description": "Updated description"
}

# Deactivate industry
PATCH /industries/1/deactivate

# Reactivate industry
PATCH /industries/1/reactivate

# Try to delete with dependencies (should fail)
DELETE /industries/1

# Get industry stats
GET /industries/stats
```

### Test Role-Based Access
```bash
# Sales user - should work for all endpoints
# Marketing Manager - should work for all endpoints
# Admin - should work for all endpoints
# HR user - should be denied for all endpoints
# Production user - should be blocked by guard
```

---

## 📞 Support

For API issues or questions:
- Check authentication token validity
- Verify user department and role assignments
- Ensure industry names are unique
- Use soft delete instead of hard delete for safety
- Check dependencies before attempting hard delete

---

## 📋 Complete API Endpoint List

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| `POST` | `/industries` | Create industry | Sales, Marketing, Admin |
| `GET` | `/industries` | Get all industries (with filters) | Sales roles, Marketing Manager |
| `GET` | `/industries/active` | Get active industries only | All authenticated users |
| `GET` | `/industries/stats` | Get industry statistics | Managers, Marketing Manager |
| `GET` | `/industries/:id` | Get single industry | Sales roles, Marketing Manager |
| `PUT` | `/industries/:id` | Update industry | Sales, Marketing, Admin |
| `PATCH` | `/industries/:id/deactivate` | Soft delete industry | Sales, Marketing, Admin |
| `PATCH` | `/industries/:id/reactivate` | Reactivate industry | Sales, Marketing, Admin |
| `DELETE` | `/industries/:id` | Hard delete industry | Sales, Marketing, Admin |

---

## 🎯 Usage Examples

### For Frontend Developers

#### Populate Industry Dropdown
```javascript
// Get active industries for dropdown
const response = await fetch('/industries/active', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
const { data } = await response.json();
const industries = data.industries;

// Use in dropdown
<select>
  {industries.map(industry => (
    <option key={industry.id} value={industry.id}>
      {industry.name}
    </option>
  ))}
</select>
```

#### Search and Filter Industries
```javascript
// Search industries with filters
const params = new URLSearchParams({
  search: 'tech',
  isActive: 'true',
  page: '1',
  limit: '10'
});

const response = await fetch(`/industries?${params}`, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

#### Display Industry Statistics Dashboard
```javascript
// Get stats for dashboard
const response = await fetch('/industries/stats', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
const { data } = await response.json();

console.log(`Total Industries: ${data.totalIndustries}`);
console.log(`Active: ${data.activeIndustries}`);
console.log(`Top Industries:`, data.topIndustries);
```

---

*Last Updated: October 2025*
*Version: 1.0*

