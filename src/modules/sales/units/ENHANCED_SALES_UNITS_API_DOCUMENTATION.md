# Enhanced Sales Units API Documentation

This document contains the **COMPLETELY ENHANCED** Sales Units API that now matches and exceeds Production Units API capabilities.

---

## 🚀 New Features Overview

### ✅ **Advanced Query Capabilities**
- **Pagination Support** - Page-based navigation with configurable limits
- **Advanced Filtering** - Filter by head assignment, teams, leads, employees
- **Search Functionality** - Search by name, email, or phone
- **Sorting Options** - Sort by any field with asc/desc order
- **Include Parameters** - Include related data (employees, teams, leads)

### ✅ **Hierarchical Role-Based Access Control**
- **dep_manager** - Full access to all units
- **unit_head** - Access to own unit only
- **team_lead** - Access to units where they lead teams
- **senior/junior** - Access to units where they are sales employees

### ✅ **Team Management**
- **Add Teams** - Assign orphan teams to sales units
- **Remove Teams** - Remove teams from sales units
- **Available Teams** - List teams available for assignment

### ✅ **Enhanced Data Filtering**
- **Role-based Data Filtering** - Users see only data they're authorized to access
- **Dynamic Include Clauses** - Include related data based on query parameters
- **Comprehensive Counts** - Teams, employees, leads, and archive leads counts

---

## 📋 API Endpoints

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
**Endpoint:** `POST /sales/units/:id/teams/:teamId`

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
POST /sales/units/1/teams/5
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
