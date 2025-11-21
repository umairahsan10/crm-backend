# 🚀 **ENHANCED SALES TEAMS API DOCUMENTATION**

This document contains the **COMPLETELY ENHANCED** Sales Teams API that now matches and exceeds Production Teams API capabilities while preserving Sales Teams' unique features.

---

## 🎯 **ENHANCEMENT OVERVIEW**

### ✅ **NEW FEATURES ADDED**
- **RESTful Endpoint Structure** - Aligned with Production Teams
- **Advanced Query System** - 15+ query parameters for filtering
- **Pagination Support** - Page-based navigation with configurable limits
- **Role-Based Data Filtering** - Users see only authorized data
- **Bulk Operations** - Add multiple members at once
- **Enhanced Search** - Search by team name, lead name, unit name
- **Comprehensive Sorting** - Sort by multiple fields
- **Dynamic Include Parameters** - Include related data on demand

### 🏆 **PRESERVED SALES TEAMS FEATURES**
- **Team Name Uniqueness Within Unit** - Better than global uniqueness
- **Replace Team Lead** - Dedicated endpoint for team lead replacement
- **Unassign All Employees** - Bulk unassignment functionality
- **Get Employee's Team** - Direct employee-to-team lookup
- **Assign/Unassign Team to Unit** - Unit management operations
- **Completed Leads Tracking** - Sales-specific performance metrics
- **Enhanced Security** - Cross-department protection and unit isolation

---

## 🔐 **AUTHENTICATION & AUTHORIZATION**

- **Authentication**: JWT Bearer Token required
- **Guards**: `JwtAuthGuard`, `RolesWithServiceGuard`, `DepartmentsGuard`
- **Department**: Sales department access required

---

## 📋 **API ENDPOINTS OVERVIEW**

| Method | Endpoint | Description | Roles | Status |
|--------|----------|-------------|-------|--------|
| `POST` | `/sales/teams` | Create sales team | `dep_manager`, `unit_head` | ✅ **ENHANCED** |
| `GET` | `/sales/teams` | Get all teams with advanced filtering | `dep_manager`, `unit_head`, `team_lead`, `senior`, `junior` | ✅ **NEW** |
| `GET` | `/sales/teams/:id` | Get team by ID with full details | `dep_manager`, `unit_head`, `team_lead`, `senior`, `junior` | ✅ **ENHANCED** |
| `PATCH` | `/sales/teams/:id` | Update sales team | `dep_manager`, `unit_head`, `team_lead` | ✅ **NEW** |
| `DELETE` | `/sales/teams/:id` | Delete sales team | `dep_manager` | ✅ **ENHANCED** |
| `GET` | `/sales/teams/available-leads` | Get available team leads | `dep_manager`, `unit_head` | ✅ **NEW** |
| `GET` | `/sales/teams/available-employees` | Get available employees | `dep_manager`, `unit_head`, `team_lead` | ✅ **NEW** |
| `POST` | `/sales/teams/:id/members` | Add members to team (bulk) | `dep_manager`, `unit_head`, `team_lead` | ✅ **NEW** |
| `DELETE` | `/sales/teams/:id/members/:employeeId` | Remove member from team | `dep_manager`, `unit_head`, `team_lead` | ✅ **NEW** |
| `PUT` | `/sales/teams/:teamId/replace-lead` | Replace team lead | `dep_manager`, `unit_head` | ✅ **PRESERVED** |
| `POST` | `/sales/teams/:teamId/add-employee` | Add single employee | `dep_manager`, `unit_head` | ✅ **PRESERVED** |
| `DELETE` | `/sales/teams/:teamId/remove-employee/:employeeId` | Remove single employee | `dep_manager`, `unit_head` | ✅ **PRESERVED** |
| `POST` | `/sales/teams/:teamId/unassign-employees` | Unassign all employees | `dep_manager`, `unit_head` | ✅ **PRESERVED** |
| `GET` | `/sales/teams/unit/:id` | Get teams in sales unit | `dep_manager`, `unit_head` | ✅ **PRESERVED** |
| `GET` | `/sales/teams/details/:teamId` | Get team details | `dep_manager`, `unit_head`, `team_lead`, `senior`, `junior` | ✅ **PRESERVED** |
| `GET` | `/sales/teams/employee/:employeeId` | Get employee's team | `dep_manager`, `unit_head`, `team_lead`, `senior`, `junior` | ✅ **PRESERVED** |
| `POST` | `/sales/teams/assign` | Assign team to unit | `dep_manager` | ✅ **PRESERVED** |
| `DELETE` | `/sales/teams/unassign/:teamId` | Unassign team from unit | `dep_manager` | ✅ **PRESERVED** |
| `GET` | `/sales/teams/available` | Get available teams | `dep_manager` | ✅ **PRESERVED** |

---

## 🚀 **ENHANCED ENDPOINTS DETAILS**

### **1. Create Sales Team (Enhanced)**

**Endpoint:** `POST /sales/teams`

**Access Control:**
- **Roles:** `dep_manager`, `unit_head`
- **Department:** `Sales`

**Request Body:**
```json
{
  "name": "Sales Team Alpha",
  "salesUnitId": 1,
  "teamLeadId": 123
}
```

**Enhanced Features:**
- ✅ **User Context** - Passes user information for audit trails
- ✅ **Query Validation** - Prevents query parameters in POST requests
- ✅ **Enhanced Error Handling** - Better error messages and validation

**Response:**
```json
{
  "success": true,
  "message": "Team \"Sales Team Alpha\" created successfully in sales unit \"North Region\"",
  "data": {
    "teamId": 1,
    "teamName": "Sales Team Alpha",
    "teamLead": {
      "id": 123,
      "firstName": "John",
      "lastName": "Doe"
    },
    "salesUnit": {
      "id": 1,
      "name": "North Region"
    },
    "employeeCount": 1
  }
}
```

---

### **2. Get All Sales Teams (NEW - Advanced Filtering)**

**Endpoint:** `GET /sales/teams`

**Access Control:**
- **Roles:** `dep_manager`, `unit_head`, `team_lead`, `senior`, `junior`
- **Department:** `Sales`

**Query Parameters:**

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `teamId` | number | Get specific team by ID | `?teamId=1` |
| `salesUnitId` | number | Filter by sales unit ID | `?salesUnitId=1` |
| `hasLead` | boolean | Filter teams that have leads assigned | `?hasLead=true` |
| `hasMembers` | boolean | Filter teams that have members | `?hasMembers=true` |
| `hasLeads` | boolean | Filter teams that have leads | `?hasLeads=true` |
| `teamName` | string | Filter by team name (partial match) | `?teamName=Alpha` |
| `leadEmail` | string | Filter by team lead email | `?leadEmail=john@company.com` |
| `leadName` | string | Filter by team lead name | `?leadName=John` |
| `unitName` | string | Filter by sales unit name | `?unitName=North` |
| `minMembers` | number | Minimum number of members | `?minMembers=2` |
| `maxMembers` | number | Maximum number of members | `?maxMembers=10` |
| `minCompletedLeads` | number | Minimum completed leads | `?minCompletedLeads=5` |
| `maxCompletedLeads` | number | Maximum completed leads | `?maxCompletedLeads=50` |
| `page` | number | Page number for pagination | `?page=1` |
| `limit` | number | Number of items per page | `?limit=10` |
| `sortBy` | string | Sort by field | `?sortBy=name` |
| `sortOrder` | string | Sort order (asc, desc) | `?sortOrder=asc` |
| `search` | string | Search by team/lead/unit name | `?search=sales` |
| `assigned` | boolean | Filter by assignment status | `?assigned=true` |
| `include` | string | Include related data | `?include=members,leads` |

**Example Request:**
```bash
GET /sales/teams?hasLead=true&hasMembers=true&page=1&limit=10&sortBy=name&sortOrder=asc&include=members,leads&search=sales&minMembers=2
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Sales Team Alpha",
      "teamLeadId": 123,
      "salesUnitId": 1,
      "employeeCount": 5,
      "completedLeads": 15,
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z",
      "teamLead": {
        "id": 123,
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@company.com",
        "phone": "+1 (555) 123-4567",
        "role": {
          "id": 3,
          "name": "team_lead"
        }
      },
      "salesUnit": {
        "id": 1,
        "name": "North Region",
        "email": "north@company.com",
        "phone": "+1 (555) 987-6543"
      },
      "membersCount": 4,
      "leadsCount": 25,
      "completedLeadsCount": 15,
      "actualEmployeeCount": 4
    }
  ],
  "total": 5,
  "pagination": {
    "page": 1,
    "limit": 10,
    "totalPages": 1,
    "hasNext": false,
    "hasPrev": false
  },
  "message": "Teams retrieved successfully"
}
```

---

### **3. Get Team by ID (Enhanced)**

**Endpoint:** `GET /sales/teams/:id`

**Access Control:**
- **Roles:** `dep_manager`, `unit_head`, `team_lead`, `senior`, `junior`
- **Department:** `Sales`

**Role-Based Data Access:**
- **dep_manager**: Sees all team data
- **unit_head**: Sees teams in their units only
- **team_lead**: Sees teams they lead only
- **senior/junior**: Sees teams they belong to only

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Sales Team Alpha",
    "teamLeadId": 123,
    "salesUnitId": 1,
    "employeeCount": 5,
    "completedLeads": 15,
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z",
    "teamLead": {
      "id": 123,
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@company.com",
      "phone": "+1 (555) 123-4567",
      "role": {
        "id": 3,
        "name": "team_lead"
      }
    },
    "salesUnit": {
      "id": 1,
      "name": "North Region",
      "email": "north@company.com",
      "phone": "+1 (555) 987-6543",
      "address": "123 Business St, City"
    },
    "members": [
      {
        "id": 124,
        "firstName": "Jane",
        "lastName": "Smith",
        "email": "jane@company.com",
        "phone": "+1 (555) 456-7890",
        "role": {
          "id": 4,
          "name": "senior"
        }
      }
    ],
    "leads": [
      {
        "id": 1,
        "name": "Lead Prospect",
        "email": "prospect@example.com",
        "phone": "+1 (555) 111-2222",
        "source": "PPC",
        "type": "warm",
        "status": "in_progress",
        "assignedTo": {
          "id": 124,
          "firstName": "Jane",
          "lastName": "Smith"
        }
      }
    ],
    "completedLeads": [
      {
        "id": 1,
        "lead": {
          "id": 2,
          "name": "Converted Lead",
          "email": "converted@example.com",
          "phone": "+1 (555) 333-4444"
        },
        "employee": {
          "id": 124,
          "firstName": "Jane",
          "lastName": "Smith"
        },
        "crackedAt": "2024-01-20T14:30:00Z"
      }
    ],
    "summary": {
      "membersCount": 4,
      "leadsCount": 25,
      "completedLeadsCount": 15,
      "conversionRate": 60.0
    }
  },
  "message": "Team details retrieved successfully"
}
```

---

### **4. Update Team (NEW)**

**Endpoint:** `PATCH /sales/teams/:id`

**Access Control:**
- **Roles:** `dep_manager`, `unit_head`, `team_lead`
- **Department:** `Sales`

**Request Body:**
```json
{
  "name": "Enhanced Sales Team Alpha",
  "teamLeadId": 456,
  "salesUnitId": 2
}
```

**Response:**
```json
{
  "success": true,
  "message": "Team updated successfully",
  "data": {
    "id": 1,
    "name": "Enhanced Sales Team Alpha",
    "teamLeadId": 456,
    "salesUnitId": 2,
    "teamLead": {
      "id": 456,
      "firstName": "Mike",
      "lastName": "Johnson",
      "email": "mike@company.com"
    },
    "salesUnit": {
      "id": 2,
      "name": "South Region"
    }
  }
}
```

---

### **5. Add Members to Team (NEW - Bulk Operation)**

**Endpoint:** `POST /sales/teams/:id/members`

**Access Control:**
- **Roles:** `dep_manager`, `unit_head`, `team_lead`
- **Department:** `Sales`

**Request Body:**
```json
{
  "employeeIds": [123, 456, 789]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Added 2 members to team. 1 failed.",
  "data": {
    "successful": [
      {
        "success": true,
        "message": "Employee John Doe added to team successfully"
      }
    ],
    "failed": [
      {
        "employeeId": 789,
        "error": "Employee is already in another team"
      }
    ],
    "totalProcessed": 3,
    "successCount": 2,
    "failureCount": 1
  }
}
```

---

### **6. Get Available Team Leads (NEW)**

**Endpoint:** `GET /sales/teams/available-leads`

**Access Control:**
- **Roles:** `dep_manager`, `unit_head`
- **Department:** `Sales`

**Query Parameters:**
- `assigned` (optional): `true`/`false` - Filter by assignment status

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 123,
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@company.com",
      "phone": "+1 (555) 123-4567",
      "role": {
        "id": 3,
        "name": "team_lead"
      },
      "department": {
        "id": 1,
        "name": "Sales"
      },
      "currentTeam": {
        "id": 1,
        "name": "Sales Team Alpha",
        "salesUnit": {
          "id": 1,
          "name": "North Region"
        }
      },
      "isAssigned": true
    }
  ],
  "total": 5,
  "message": "Available team leads retrieved successfully"
}
```

---

### **7. Get Available Employees (NEW)**

**Endpoint:** `GET /sales/teams/available-employees`

**Access Control:**
- **Roles:** `dep_manager`, `unit_head`, `team_lead`
- **Department:** `Sales`

**Query Parameters:**
- `assigned` (optional): `true`/`false` - Filter by assignment status

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 124,
      "firstName": "Jane",
      "lastName": "Smith",
      "email": "jane@company.com",
      "phone": "+1 (555) 456-7890",
      "role": {
        "id": 4,
        "name": "senior"
      },
      "department": {
        "id": 1,
        "name": "Sales"
      },
      "currentTeam": {
        "id": 1,
        "name": "Sales Team Alpha",
        "salesUnit": {
          "id": 1,
          "name": "North Region"
        }
      },
      "isAssigned": true
    }
  ],
  "total": 15,
  "message": "Available employees retrieved successfully"
}
```

---

## 🔒 **ROLE-BASED ACCESS CONTROL**

### **Hierarchical Access Levels**

#### **1. Department Manager (`dep_manager`)**
- ✅ **Full Access**: Can see and manage all sales teams
- ✅ **All Operations**: Create, update, delete, assign teams
- ✅ **All Data**: Complete team information, members, leads
- ✅ **Bulk Operations**: Add multiple members, unassign all

#### **2. Unit Head (`unit_head`)**
- ✅ **Unit Access**: Can see and manage teams in their units
- ✅ **Team Management**: Create, update teams in their units
- ✅ **Member Management**: Add/remove members from their teams
- ✅ **Team Lead Management**: Replace team leads in their units
- ❌ **Cross-Unit Access**: Cannot access teams in other units

#### **3. Team Lead (`team_lead`)**
- ✅ **Team Access**: Can see and manage their own team
- ✅ **Member Management**: Add/remove members from their team
- ✅ **Team Updates**: Update team information
- ✅ **Lead Management**: View team leads and performance
- ❌ **Other Teams**: Cannot access other teams

#### **4. Senior/Junior (`senior`/`junior`)**
- ✅ **Team View**: Can see their own team details
- ✅ **Member View**: Can see team members
- ✅ **Lead View**: Can see team leads and performance
- ❌ **Management**: Cannot modify team structure
- ❌ **Other Teams**: Cannot access other teams

---

## 🎯 **PRESERVED SALES TEAMS FEATURES**

### **1. Replace Team Lead**
**Endpoint:** `PUT /sales/teams/:teamId/replace-lead`

**Unique Features:**
- ✅ **Dedicated Endpoint**: Specialized for team lead replacement
- ✅ **Member Transfer**: All team members automatically follow new lead
- ✅ **Validation**: Ensures new lead meets all requirements
- ✅ **Audit Trail**: Tracks lead replacement history

### **2. Unassign All Employees**
**Endpoint:** `POST /sales/teams/:teamId/unassign-employees`

**Unique Features:**
- ✅ **Bulk Unassignment**: Removes all employees from team at once
- ✅ **Team Lead Protection**: Team lead remains assigned
- ✅ **Cleanup Operation**: Useful for team restructuring

### **3. Get Employee's Team**
**Endpoint:** `GET /sales/teams/employee/:employeeId`

**Unique Features:**
- ✅ **Direct Lookup**: Find team by employee ID
- ✅ **Employee Context**: Shows team from employee perspective
- ✅ **Quick Access**: Efficient for employee-centric operations

### **4. Team-Unit Assignment**
**Endpoints:** `POST /sales/teams/assign`, `DELETE /sales/teams/unassign/:teamId`

**Unique Features:**
- ✅ **Unit Management**: Assign/unassign teams to sales units
- ✅ **Flexible Structure**: Teams can be moved between units
- ✅ **Orphan Management**: Handle teams without units

### **5. Enhanced Security Features**
- ✅ **Cross-Department Protection**: Strict Sales department validation
- ✅ **Unit Isolation**: Teams are isolated within sales units
- ✅ **Department Boundary**: All operations limited to Sales department
- ✅ **Lead Assignment Validation**: Prevents removal of employees with completed leads

---

## 📊 **PERFORMANCE METRICS**

### **Sales-Specific Metrics**
- ✅ **Completed Leads Tracking**: Performance measurement
- ✅ **Conversion Rate Calculation**: Automatic calculation
- ✅ **Team Performance**: Lead completion rates
- ✅ **Member Productivity**: Individual performance tracking

### **Enhanced Analytics**
- ✅ **Real-time Counts**: Members, leads, completed leads
- ✅ **Performance Trends**: Historical performance data
- ✅ **Team Comparison**: Compare team performance
- ✅ **Unit Analytics**: Unit-level performance metrics

---

## 🚀 **USAGE EXAMPLES**

### **Get Teams with Advanced Filtering**
```bash
GET /sales/teams?hasLead=true&hasMembers=true&page=1&limit=10&sortBy=name&sortOrder=asc&include=members,leads&search=sales&minMembers=2
```

### **Search Teams**
```bash
GET /sales/teams?search=alpha&page=1&limit=10
```

### **Get Team with All Related Data**
```bash
GET /sales/teams/1
```

### **Get Available Team Leads**
```bash
GET /sales/teams/available-leads?assigned=false
```

### **Add Multiple Members**
```bash
POST /sales/teams/1/members
{
  "employeeIds": [123, 456, 789]
}
```

### **Update Team**
```bash
PATCH /sales/teams/1
{
  "name": "Enhanced Sales Team",
  "teamLeadId": 456
}
```

---

## 🔄 **MIGRATION GUIDE**

### **Breaking Changes**
- ❌ **Endpoint Changes**: Some endpoints have changed structure
- ❌ **Response Format**: Enhanced response format with more data
- ❌ **Query Parameters**: New query parameter structure

### **Backward Compatibility**
- ✅ **Preserved Endpoints**: All original Sales Teams endpoints preserved
- ✅ **Enhanced Responses**: Original responses enhanced with additional data
- ✅ **Gradual Migration**: Can migrate incrementally

### **Migration Steps**
1. **Update Frontend**: Use new RESTful endpoints
2. **Implement Pagination**: Add pagination support
3. **Add Advanced Filtering**: Implement new query parameters
4. **Update Error Handling**: Handle new error responses
5. **Test Role-Based Access**: Verify access control

---

## 🎉 **BENEFITS OF ENHANCEMENT**

### **🚀 Performance Improvements**
- **Single API Call**: Reduced multiple calls to one comprehensive call
- **Reduced Network Overhead**: Less data transfer and connection overhead
- **Better Caching**: Single endpoint is easier to cache and manage
- **Optimized Queries**: Efficient database queries with proper indexing

### **🔒 Enhanced Security**
- **Role-Based Access**: Granular access control based on user roles
- **Data Filtering**: Users see only authorized data
- **Audit Trails**: Better tracking of team operations
- **Validation**: Enhanced input validation and error handling

### **📊 Better Analytics**
- **Real-time Metrics**: Live performance data
- **Comprehensive Reporting**: Detailed team and unit analytics
- **Performance Tracking**: Individual and team performance metrics
- **Trend Analysis**: Historical performance data

### **🎯 Improved Developer Experience**
- **RESTful Design**: Standard REST API conventions
- **Consistent Responses**: Standardized response format
- **Better Documentation**: Comprehensive API documentation
- **Error Handling**: Detailed error messages and codes

---

## 📞 **SUPPORT**

For questions about the enhanced Sales Teams API or migration assistance, please contact the development team.

**Migration Deadline**: Please update your applications to use the new enhanced endpoints for better performance and features.

---

*This documentation covers the enhanced Sales Teams API that now matches and exceeds Production Teams capabilities while preserving Sales Teams' unique features.*
