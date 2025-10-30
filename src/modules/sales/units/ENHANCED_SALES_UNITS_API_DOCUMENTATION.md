# Sales Units API Testing Guide

This guide mirrors the Production Units testing document style and provides complete, ready-to-use testing bodies for all Sales Units endpoints.

---

## Authentication Setup
1. Login with a user who has Sales department access.
2. Copy the JWT token from the response.
3. In Swagger UI, click Authorize and enter: `Bearer <your_jwt_token>`.

---

## 1. Create Sales Unit

Endpoint: `POST /sales/units`

Required Role: `dep_manager`

Test Body 1: Create Unit with Head
```json
{
  "name": "North Region",
  "email": "north@sales.example",
  "phone": "+1-555-0100",
  "address": "123 Ave, City",
  "headId": 101
}
```

Test Body 2: Create Unit without Head
```json
{
  "name": "South Region",
  "email": "south@sales.example",
  "phone": "+1-555-0200",
  "address": "456 Blvd, City"
}
```

Expected Response:
```json
{
  "success": true,
  "message": "New Unit Created Successfully"
}
```

Note: Query parameters are not allowed on POST. Use body only.

---

## 2. Get All Sales Units (Basic)

Endpoint: `GET /sales/units`

Required Role: `dep_manager`, `unit_head`, `team_lead`, `senior`, `junior`

Test Cases:

Test 1: Get All Units (No Parameters)
```
GET /sales/units
```

Test 2: Get Specific Unit via unitId
```
GET /sales/units?unitId=1
```

Test 3: Get Units with Employees
```
GET /sales/units?include=employees
```

Test 4: Get Units with Teams
```
GET /sales/units?include=teams
```

Test 5: Get Units with Leads
```
GET /sales/units?include=leads
```

Test 6: Get Units with Head, Teams, Employees, Leads
```
GET /sales/units?include=employees,teams,head,leads
```

Expected Response (shape):
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "North Region",
      "email": "north@sales.example",
      "phone": "+1-555-0100",
      "address": "123 Ave, City",
      "headId": 101,
      "head": { "id": 101, "firstName": "John", "lastName": "Doe" },
      "teamsCount": 2,
      "employeesCount": 8,
      "leadsCount": 25,
      "crackedLeadsCount": 5,
      "archiveLeadsCount": 4,
      "conversionRate": 20.0,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "total": 1,
  "pagination": { "page": 1, "limit": 10, "totalPages": 1 },
  "message": "Units retrieved successfully"
}
```

---

## 3. Advanced Filtering (Same Endpoint)

Endpoint: `GET /sales/units` (with query parameters)

Required Role: `dep_manager`, `unit_head`, `team_lead`, `senior`, `junior`

Available Query Parameters:

| Parameter     | Type     | Description                                      | Example                          |
|---------------|----------|--------------------------------------------------|----------------------------------|
| unitId        | number   | Get specific unit by ID                          | ?unitId=1                        |
| include       | string   | employees,teams,head,leads (comma-separated)     | ?include=employees,teams,head    |
| hasHead       | boolean  | Filter units with/without heads                  | ?hasHead=true                    |
| hasTeams      | boolean  | Filter units with/without teams                  | ?hasTeams=true                   |
| hasLeads      | boolean  | Filter units with/without leads                  | ?hasLeads=true                   |
| hasEmployees  | boolean  | Filter units with/without employees              | ?hasEmployees=true               |
| headEmail     | string   | Filter by unit head email (partial, ci)          | ?headEmail=john@                 |
| headName      | string   | Filter by head first/last name (partial, ci)     | ?headName=john                   |
| unitName      | string   | Filter by unit name (partial, ci)                | ?unitName=north                  |
| minTeams      | number   | Minimum number of teams                          | ?minTeams=1                      |
| maxTeams      | number   | Maximum number of teams                          | ?maxTeams=10                     |
| minLeads      | number   | Minimum number of leads                          | ?minLeads=5                      |
| maxLeads      | number   | Maximum number of leads                          | ?maxLeads=100                    |
| page          | number   | Page number for pagination                        | ?page=1                          |
| limit         | number   | Items per page (1..100)                           | ?limit=10                        |
| sortBy        | string   | name,email,createdAt,updatedAt,headId            | ?sortBy=name                     |
| sortOrder     | string   | asc, desc                                        | ?sortOrder=desc                  |
| search        | string   | Search in name/email/phone                       | ?search=sales                    |

Test Cases:

Test 1: Basic Query
```
GET /sales/units?include=employees,teams
```

Test 2: Filter Units with Heads
```
GET /sales/units?hasHead=true
```

Test 3: Filter Units by Head Name
```
GET /sales/units?headName=john
```

Test 4: Filter Units with Leads Count Range
```
GET /sales/units?minLeads=10&maxLeads=100
```

Test 5: Pagination Test
```
GET /sales/units?page=1&limit=5
```

Test 6: Sorting Test
```
GET /sales/units?sortBy=name&sortOrder=desc
```

Test 7: Complex Filter
```
GET /sales/units?hasHead=true&hasTeams=true&include=employees,teams,head&sortBy=createdAt&sortOrder=desc
```


## 3.a. Get Available Heads

Endpoint: `GET /sales/units/available-heads`

Required Role: `dep_manager`

Test 1: Get All Available Heads
```
GET /sales/units/available-heads
```

Test 2: Get Only Assigned Heads
```
GET /sales/units/available-heads?assigned=true
```

Test 3: Get Only Unassigned Heads
```
GET /sales/units/available-heads?assigned=false
```

Expected Response:
```json
{
  "success": true,
  "data": {
    "heads": [
      {
        "id": 101,
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@example.com",
        "currentUnit": { "id": 1, "name": "North Region" }
      },
      {
        "id": 102,
        "firstName": "Sarah",
        "lastName": "Lee",
        "email": "sarah@example.com",
        "currentUnit": null
      }
    ]
  },
  "message": "Unit heads retrieved successfully"
}
```


### 1. **Enhanced Get All Units** (Now with Advanced Filtering)

**Endpoint:** `GET /sales/units`

**Access Control:**
- **Roles:** `dep_manager`, `unit_head`, `team_lead`, `senior`, `junior`
- **Department:** `Sales`

**Query Parameters:**
```typescript
{
  unitId?: number;           // Filter by specific unit ID
  hasHead?: boolean;         // Filter units with/without heads
  hasTeams?: boolean;        // Filter units with/without teams
  hasLeads?: boolean;        // Filter units with/without leads
  hasEmployees?: boolean;    // Filter units with/without employees
  include?: string;          // Include related data (employees,teams,leads)
  sortBy?: string;           // Sort field (name,email,createdAt,updatedAt,headId)
  sortOrder?: 'asc'|'desc';  // Sort order
  page?: number;             // Page number (min: 1)
  limit?: number;            // Items per page (min: 1, max: 100)
  search?: string;           // Search by name, email, or phone
}
```

**Example Request:**
```bash
GET /sales/units?hasHead=true&hasTeams=true&page=1&limit=10&sortBy=name&sortOrder=asc&include=employees,teams&search=sales
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Sales Unit A",
      "email": "unit@example.com",
      "phone": "+1 (555) 123-4567",
      "address": "123 Business St, City, Country",
      "headId": 123,
      "logoUrl": "https://example.com/logo.png",
      "website": "https://example.com",
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z",
      "head": {
        "id": 123,
        "firstName": "John",
        "lastName": "Doe"
      },
      "teamsCount": 3,
      "employeesCount": 8,
      "leadsCount": 25,
      "archiveLeadsCount": 12,
      "teams": [...], // Included if requested
      "salesEmployees": [...], // Included if requested
      "leads": [...] // Included if requested
    }
  ],
  "total": 5,
  "pagination": {
    "page": 1,
    "limit": 10,
    "totalPages": 1
  },
  "message": "Units retrieved successfully"
}
```

### 2. **Enhanced Get Unit Details** (Now with Role-Based Filtering)

**Endpoint:** `GET /sales/units/:id`

**Access Control:**
- **Roles:** `dep_manager`, `unit_head`, `team_lead`, `senior`, `junior`
- **Department:** `Sales`

**Role-Based Data Access:**
- **dep_manager**: Sees all data
- **unit_head**: Sees all data for their unit only
- **team_lead**: Sees teams they lead and related data
- **senior/junior**: Sees only their own data and teams they belong to

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Sales Unit A",
    "email": "unit@example.com",
    "phone": "+1 (555) 123-4567",
    "address": "123 Business St, City, Country",
    "headId": 123,
    "logoUrl": "https://example.com/logo.png",
    "website": "https://example.com",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z",
    "head": {
      "id": 123,
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "phone": "+1 (555) 987-6543",
      "role": {
        "id": 5,
        "name": "unit_head"
      }
    },
    "teams": [
      {
        "id": 1,
        "name": "Team Alpha",
        "teamLead": {
          "id": 124,
          "firstName": "Jane",
          "lastName": "Smith",
          "email": "jane@example.com",
          "role": {
            "id": 3,
            "name": "team_lead"
          }
        }
      }
    ],
    "employees": [
      {
        "id": 1,
        "employee": {
          "id": 125,
          "firstName": "Bob",
          "lastName": "Johnson",
          "email": "bob@example.com",
          "phone": "+1 (555) 456-7890",
          "role": {
            "id": 4,
            "name": "senior"
          }
        }
      }
    ],
    "leads": {
      "active": [
        {
          "id": 1,
          "name": "Active Lead",
          "email": "active@example.com",
          "phone": "+1 (555) 111-2222",
          "source": "PPC",
          "type": "warm",
          "status": "in_progress",
          "assignedTo": {
            "id": 125,
            "firstName": "Bob",
            "lastName": "Johnson"
          }
        }
      ],
      "cracked": [
        {
          "id": 2,
          "lead": {
            "id": 2,
            "name": "Cracked Lead",
            "email": "cracked@example.com",
            "phone": "+1 (555) 333-4444"
          },
          "employee": {
            "id": 125,
            "firstName": "Bob",
            "lastName": "Johnson"
          },
          "crackedAt": "2024-01-20T14:30:00Z"
        }
      ],
      "archived": [
        {
          "id": 3,
          "name": "Archived Lead",
          "email": "archived@example.com",
          "phone": "+1 (555) 555-6666",
          "source": "Referral",
          "outcome": "No Response",
          "employee": {
            "id": 125,
            "firstName": "Bob",
            "lastName": "Johnson"
          },
          "archivedOn": "2024-01-18T10:15:00Z"
        }
      ]
    },
    "summary": {
      "teamsCount": 3,
      "employeesCount": 8,
      "leadsCount": {
        "active": 15,
        "cracked": 5,
        "archived": 5,
        "total": 25
      },
      "conversionRate": 20.0
    }
  },
  "message": "Unit details retrieved successfully"
}
```

### 3. **Team Management Endpoints**

#### **Get Available Teams**
**Endpoint:** `GET /sales/units/available-teams`

**Query Parameters:**
- `assigned` (optional): `true`/`false` - Filter by assignment status

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Team Alpha",
      "employeeCount": 5,
      "teamLead": {
        "id": 124,
        "firstName": "Jane",
        "lastName": "Smith",
        "email": "jane@example.com",
        "role": {
          "id": 3,
          "name": "team_lead"
        }
      },
      "isAssigned": false,
      "currentUnit": null
    }
  ],
  "total": 1,
  "message": "Available teams retrieved successfully"
}
```

#### **Add Team to Unit**
**Endpoint:** `POST /sales/units/:id/teams`

**Body:**
```json
{ "teamId": 5 }
```

**Response:**
```json
{
  "success": true,
  "message": "Team \"Team Alpha\" successfully assigned to unit \"Sales Unit A\""
}
```

#### **Remove Team from Unit**
**Endpoint:** `DELETE /sales/units/:id/teams/:teamId`

**Response:**
```json
{
  "success": true,
  "message": "Team \"Team Alpha\" successfully removed from unit \"Sales Unit A\""
}
```

---

## 🔐 Role-Based Access Control Details

### **Hierarchical Access Levels**

1. **Department Manager (`dep_manager`)**
   - ✅ Full access to all sales units
   - ✅ Can see all teams, employees, leads
   - ✅ Can manage all units (create, update, delete)
   - ✅ Can assign/remove teams

2. **Unit Head (`unit_head`)**
   - ✅ Access only to their assigned unit
   - ✅ Can see all teams, employees, leads in their unit
   - ✅ Can view unit details and manage employees
   - ❌ Cannot create/delete units

3. **Team Lead (`team_lead`)**
   - ✅ Access to units where they lead teams
   - ✅ Can see teams they lead and related data
   - ✅ Can view team members and leads
   - ❌ Cannot manage unit structure

4. **Senior/Junior (`senior`/`junior`)**
   - ✅ Access to units where they are sales employees
   - ✅ Can see their own data and team information
   - ✅ Can view leads assigned to their unit
   - ❌ Cannot see other employees' data

### **Data Filtering Examples**

**For a `team_lead` user:**
```json
{
  "teams": [
    // Only teams they lead
    {
      "id": 1,
      "name": "Team Alpha",
      "teamLeadId": 124 // This user's ID
    }
  ],
  "salesEmployees": [
    // All employees in the unit (they can see team members)
  ],
  "leads": [
    // All leads in the unit
  ]
}
```

**For a `senior` user:**
```json
{
  "teams": [
    // All teams in the unit (they work in the unit)
  ],
  "salesEmployees": [
    // Only their own record
    {
      "id": 1,
      "employee": {
        "id": 125, // This user's ID
        "firstName": "Bob",
        "lastName": "Johnson"
      }
    }
  ],
  "leads": [
    // All leads in the unit
  ]
}
```

---

## 🎯 Key Improvements Over Previous Version

### **1. Advanced Query Capabilities**
- ✅ **Pagination** - Handle large datasets efficiently
- ✅ **Filtering** - Multiple filter options for precise data retrieval
- ✅ **Search** - Full-text search across name, email, phone
- ✅ **Sorting** - Flexible sorting by any field
- ✅ **Include Parameters** - Dynamic data inclusion

### **2. Enhanced Security**
- ✅ **Hierarchical Access Control** - Role-based data filtering
- ✅ **Unit Membership Validation** - Users can only access their units
- ✅ **Data Privacy** - Users see only authorized data

### **3. Team Management**
- ✅ **Team Assignment** - Assign orphan teams to units
- ✅ **Team Removal** - Remove teams from units
- ✅ **Available Teams** - List teams available for assignment

### **4. Performance Optimizations**
- ✅ **Efficient Queries** - Optimized database queries
- ✅ **Pagination Support** - Handle large datasets
- ✅ **Selective Data Loading** - Load only requested data

### **5. Comprehensive Data**
- ✅ **Enhanced Counts** - Teams, employees, leads, archive leads
- ✅ **Detailed Information** - Full employee and team details
- ✅ **Lead Integration** - Direct lead management

---

## 📊 Comparison with Production Units API

| Feature | Sales Units (Enhanced) | Production Units | Status |
|---------|----------------------|------------------|--------|
| **Pagination** | ✅ Full Support | ✅ Full Support | **Equal** |
| **Advanced Filtering** | ✅ Full Support | ✅ Full Support | **Equal** |
| **Role-based Access** | ✅ Hierarchical | ✅ Hierarchical | **Equal** |
| **Team Management** | ✅ Full CRUD | ✅ Full CRUD | **Equal** |
| **Query Parameters** | ✅ Multiple | ✅ Multiple | **Equal** |
| **Search Functionality** | ✅ Full-text | ❌ None | **Sales Better** |
| **Lead Management** | ✅ Advanced | ❌ None | **Sales Better** |
| **Archive System** | ✅ Advanced | ❌ None | **Sales Better** |
| **Contact Information** | ✅ Full | ❌ None | **Sales Better** |

---

## 🚀 Usage Examples

### **Get Units with Pagination and Filtering**
```bash
GET /sales/units?page=1&limit=5&hasHead=true&hasTeams=true&sortBy=name&sortOrder=asc
```

### **Search Units**
```bash
GET /sales/units?search=sales&page=1&limit=10
```

### **Get Unit with All Related Data**
```bash
GET /sales/units/1
```

### **Get Available Teams for Assignment**
```bash
GET /sales/units/available-teams?assigned=false
```

### **Assign Team to Unit**
```bash
POST /sales/units/1/teams
{ "teamId": 5 }
```

---

## 🎉 Summary

The **Enhanced Sales Units API** now provides:

1. **🚀 Production-Level Features** - All Production Units capabilities
2. **🔍 Advanced Query System** - Pagination, filtering, search, sorting
3. **🔐 Hierarchical Security** - Role-based access control
4. **👥 Team Management** - Full team assignment capabilities
5. **📊 Rich Data** - Comprehensive counts and related data
6. **⚡ Performance** - Optimized queries and pagination
7. **🎯 Sales-Specific Features** - Lead management, archive system, contact info

**The Sales Units API now matches and exceeds Production Units API capabilities while maintaining its unique sales-specific features!**

---

# Complete Endpoint Reference (Parity + Sales Semantics)

This section enumerates every endpoint with roles, parameters, bodies, responses, and errors to aid testing.

Global
- Auth: Bearer JWT
- Department: Sales
- No query params allowed on POST/PATCH/DELETE (400 if present)

1) POST /sales/units (Create)
- Roles: dep_manager
- Body:
```json
{ "name": "North Region", "email": "north@sales.example", "phone": "+1-555-0100", "address": "123 Ave", "headId": 101, "logoUrl": null, "website": null }
```
- 201:
```json
{ "success": true, "message": "New Unit Created Successfully" }
```
- Errors: 400 invalid head/head role; 409 duplicate name/email/phone

2) GET /sales/units (List)
- Roles: dep_manager, unit_head, team_lead, senior, junior
- Query:
  - unitId, hasHead, hasTeams, hasLeads, hasEmployees
  - headEmail, headName, unitName
  - minTeams, maxTeams, minLeads, maxLeads
  - include=employees,teams,head,leads
  - page, limit, sortBy=name|email|createdAt|updatedAt|headId, sortOrder
  - search
- 200 example (truncated):
```json
{ "success": true, "data": [{ "id": 1, "name": "North Region", "teamsCount": 2, "employeesCount": 8, "leadsCount": 25, "crackedLeadsCount": 5, "archiveLeadsCount": 4, "conversionRate": 20.0 }], "total": 1, "pagination": { "page": 1, "limit": 10, "totalPages": 1 }, "message": "Units retrieved successfully" }
```

3) GET /sales/units/:id (Detail)
- Roles: dep_manager, unit_head, team_lead, senior, junior
- 200 example (truncated):
```json
{ "success": true, "data": { "id": 1, "name": "North Region", "head": { "id": 101 }, "teams": [ { "id": 7, "name": "Alpha", "teamLead": { "id": 201, "firstName": "Jane", "lastName": "Smith" } } ], "leads": [ { "id": 1001, "name": "Prospect A", "email": "a@example.com", "phone": "+1-555-4000", "assignedTo": { "id": 301, "firstName": "Bob", "lastName": "Johnson" } } ], "completedLeads": [ { "id": 2001, "crackedAt": "2024-01-20T14:30:00.000Z", "lead": { "id": 1002, "name": "Prospect B", "email": "b@example.com", "phone": "+1-555-4100" }, "employee": { "id": 301, "firstName": "Bob", "lastName": "Johnson" } } ], "summary": { "teamsCount": 2, "leadsCount": { "leads": 16, "completedLeads": 5, "total": 21 }, "conversionRate": 19.05 } }, "message": "Unit details retrieved successfully" }
```
- Errors: 404 not found, 403 forbidden by scope

4) PATCH /sales/units/:id (Update)
- Roles: dep_manager, unit_head (own unit)
- Body (any subset):
```json
{ "name": "North Region Plus", "email": "north.plus@example", "headId": 102 }
```
- 200:
```json
{ "success": true, "message": "Unit updated successfully", "data": { "id": 1, "name": "North Region Plus", "head": { "id": 102, "firstName": "...", "lastName": "..." } } }
```
- Errors: 404 unit; 400 invalid head; 409 duplicate name/email/phone

5) DELETE /sales/units/:id (Delete)
- Roles: dep_manager
- 200 (deleted):
```json
{ "success": true, "message": "Unit deleted successfully. 0 archived leads have been assigned unit ID null." }
```
- 200 (blocked):
```json
{ "success": false, "message": "Cannot delete unit. Please reassign dependencies first.", "dependencies": { "teams": { "count": 2, "details": [] }, "leads": { "count": 4, "details": [] }, "employees": { "count": 5, "details": [] } }, "archiveLeads": { "count": 3, "message": "3 archived leads will be assigned unit ID null" } }
```
- Errors: 404 unit

6) GET /sales/units/available-heads
- Roles: dep_manager
- Query: assigned=true|false (optional)
- 200:
```json
{ "success": true, "message": "Unit heads retrieved successfully", "data": { "heads": [{ "id": 101, "firstName": "John", "lastName": "Doe", "email": "john@example.com", "currentUnit": { "id": 1, "name": "North Region" } }] } }
```

7) GET /sales/units/available-teams
- Roles: dep_manager, unit_head
- Query: assigned=true|false (optional)
- 200:
```json
{ "success": true, "data": [{ "id": 7, "name": "Alpha", "employeeCount": 5, "teamLead": { "id": 201, "firstName": "Jane", "lastName": "Smith", "email": "jane@example.com", "role": { "id": 4, "name": "team_lead" } }, "isAssigned": false, "currentUnit": null }], "total": 1, "message": "Available teams retrieved successfully" }
```

8) POST /sales/units/:id/teams (Assign team)
- Roles: dep_manager, unit_head
- Body:
```json
{ "teamId": 7 }
```
- 200:
```json
{ "success": true, "message": "Team \"Alpha\" successfully assigned to unit \"North Region\"" }
```
- Errors: 404 unit/team; 400 team already assigned

9) DELETE /sales/units/:id/teams/:teamId (Unassign team)
- Roles: dep_manager, unit_head
- 200:
```json
{ "success": true, "message": "Team \"Alpha\" successfully removed from unit \"North Region\"" }
```
- Errors: 404 unit/team; 400 team does not belong to unit

10) GET /sales/units/deleted/completed-leads
- Roles: dep_manager
- 200:
```json
{ "success": true, "data": [{ "id": 2001, "crackedAt": "2024-01-20T14:30:00.000Z", "lead": { "id": 1002, "name": "Prospect B", "email": "b@example.com", "phone": "+1-555-4100", "createdAt": "2024-01-10T09:00:00.000Z" }, "closedBy": { "id": 301, "firstName": "Bob", "lastName": "Johnson" } }], "total": 1, "message": "Completed leads from deleted units retrieved successfully" }
```

Standard Errors
```json
{ "statusCode": 400, "message": "Validation failed", "error": "Bad Request" }
{ "statusCode": 401, "message": "Unauthorized", "error": "Unauthorized" }
{ "statusCode": 403, "message": "Insufficient permissions", "error": "Forbidden" }
{ "statusCode": 404, "message": "Resource not found", "error": "Not Found" }
{ "statusCode": 409, "message": "Conflict occurred", "error": "Conflict" }
{ "statusCode": 500, "message": "Internal server error", "error": "Internal Server Error" }
```
