# Production Units API Testing Guide for Swagger

This guide provides comprehensive testing bodies and examples for all Production Units endpoints that you can use in Swagger UI.

## 🔐 **Authentication Setup**

Before testing, ensure you have a valid JWT token:
1. Login with a user who has Production department access
2. Copy the JWT token from the response
3. Click "Authorize" in Swagger UI
4. Enter: `Bearer <your_jwt_token>`

---

## 📋 **1. Create Production Unit**

**Endpoint**: `POST /production/units`

**Required Role**: `dep_manager`

### Test Body 1: Create Unit with Head
```json
{
  "name": "Frontend Development Unit",
  "headId": 5
}
```

### Test Body 2: Create Unit without Head
```json
{
  "name": "Backend Development Unit"
}
```

### Test Body 3: Create Another Unit
```json
{
  "name": "Mobile Development Unit",
  "headId": 7
}
```

**Expected Response**:
```json
{
  "success": true,
  "message": "New Production Unit Created Successfully"
}
```

---

## 📊 **2. Get All Production Units (Basic)**

**Endpoint**: `GET /production/units`

**Required Role**: `dep_manager`, `unit_head`, `team_lead`, `senior`, `junior`

### Test Cases:

#### Test 1: Get All Units (No Parameters)
```
GET /production/units
```

#### Test 2: Get Specific Unit
```
GET /production/units?unitId=1
```

#### Test 3: Get Units with Employees
```
GET /production/units?include=employees
```

#### Test 4: Get Units with Projects
```
GET /production/units?include=projects
```

#### Test 5: Get Units with Teams
```
GET /production/units?include=teams
```

#### Test 6: Get Units with All Related Data
```
GET /production/units?include=employees,projects,teams,head
```

#### Test 7: Get Specific Unit with All Data
```
GET /production/units?unitId=1&include=employees,projects,teams,head
```

**Expected Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Frontend Development Unit",
      "headId": 5,
      "head": {
        "id": 5,
        "firstName": "John",
        "lastName": "Doe"
      },
      "teamsCount": 2,
      "employeesCount": 8,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "total": 1,
  "message": "Units retrieved successfully"
}
```

---

## 🔍 **3. Advanced Filtering (Same Endpoint)**

**Endpoint**: `GET /production/units` (with query parameters)

**Required Role**: `dep_manager`, `unit_head`, `team_lead`, `senior`, `junior`

### Available Query Parameters:

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `unitId` | number | Get specific unit by ID | `?unitId=1` |
| `include` | string | Include related data (comma-separated) | `?include=employees,projects` |
| `hasHead` | boolean | Filter units with/without heads | `?hasHead=true` |
| `hasTeams` | boolean | Filter units with/without teams | `?hasTeams=true` |
| `hasProjects` | boolean | Filter units with/without projects | `?hasProjects=true` |
| `page` | number | Page number for pagination | `?page=1` |
| `limit` | number | Number of items per page | `?limit=10` |
| `sortBy` | string | Sort by field (name, createdAt, updatedAt) | `?sortBy=name` |
| `sortOrder` | string | Sort order (asc, desc) | `?sortOrder=desc` |

### Test Cases:

#### Test 1: Basic Query
```
GET /production/units?include=employees,projects
```

#### Test 2: Filter Units with Heads
```
GET /production/units?hasHead=true
```

#### Test 3: Filter Units without Heads
```
GET /production/units?hasHead=false
```

#### Test 4: Filter Units with Teams
```
GET /production/units?hasTeams=true&include=teams
```

#### Test 5: Filter Units with Projects
```
GET /production/units?hasProjects=true&include=projects
```

#### Test 6: Pagination Test
```
GET /production/units?page=1&limit=5&include=employees
```

#### Test 7: Sorting Test
```
GET /production/units?sortBy=name&sortOrder=desc
```

#### Test 8: Complex Filter
```
GET /production/units?hasHead=true&hasTeams=true&include=employees,projects&sortBy=createdAt&sortOrder=desc
```

#### Test 9: Get Specific Unit
```
GET /production/units?unitId=1&include=employees,projects,teams,head
```

**Expected Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Frontend Development Unit",
      "headId": 5,
      "head": {
        "id": 5,
        "firstName": "John",
        "lastName": "Doe"
      },
      "teamsCount": 2,
      "employeesCount": 8,
      "teams": [
        {
          "id": 1,
          "name": "React Team",
          "teamLead": {
            "id": 6,
            "firstName": "Jane",
            "lastName": "Smith"
          },
          "projects": [
            {
              "id": 1,
              "description": "E-commerce Website",
              "client": {
                "id": 1,
                "companyName": "Tech Corp",
                "email": "contact@techcorp.com"
              }
            }
          ]
        }
      ],
      "productionEmployees": [
        {
          "id": 1,
          "firstName": "Alice",
          "lastName": "Johnson",
          "email": "alice@company.com",
          "role": {
            "id": 3,
            "name": "senior"
          },
          "specialization": "React Development",
          "projectsCompleted": 5
        }
      ],
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "total": 1,
  "pagination": {
    "page": 1,
    "limit": 10,
    "totalPages": 1
  },
  "message": "Units retrieved successfully"
}
```

---

## ✏️ **4. Update Production Unit**

**Endpoint**: `PATCH /production/units/:id`

**Required Role**: `dep_manager`, `unit_head` (own unit only)

### Test Cases:

#### Test 1: Update Unit Name (Manager)
```
PATCH /production/units/1
```
**Body**:
```json
{
  "name": "Advanced Frontend Development Unit"
}
```

#### Test 2: Update Unit Head (Manager)
```
PATCH /production/units/date/1
```
**Body**:
```json
{
  "headId": 8
}
```

#### Test 3: Update Both Name and Head (Manager)
```
PATCH /production/units/1
```
**Body**:
```json
{
  "name": "Full Stack Development Unit",
  "headId": 9
}
```

#### Test 4: Remove Unit Head (Manager)
```
PATCH /production/units/1
```
**Body**:
```json
{
  "headId": null
}
```

#### Test 5: Unit Head Updates Own Unit
```
PATCH /production/units/1
```
**Body**:
```json
{
  "name": "My Updated Unit Name"
}
```

**Expected Response**:
```json
{
  "success": true,
  "message": "Unit updated successfully"
}
```

---

## 🗑️ **5. Delete Production Unit**

**Endpoint**: `DELETE /production/units/:id`

**Required Role**: `dep_manager`

### Test Cases:

#### Test 1: Delete Unit with No Dependencies
```
DELETE /production/units/3
```

#### Test 2: Try to Delete Unit with Dependencies
```
DELETE /production/units/1
```

**Expected Response (Success)**:
```json
{
  "success": true,
  "message": "Unit deleted successfully"
}
```

**Expected Response (Blocked)**:
```json
{
  "success": false,
  "message": "Cannot delete unit. Please reassign dependencies first.",
  "dependencies": {
    "teams": {
      "count": 2,
      "details": [
        {
          "id": 1,
          "name": "React Team"
        },
        {
          "id": 2,
          "name": "Vue Team"
        }
      ]
    },
    "projects": {
      "count": 3,
      "details": [
        {
          "id": 1,
          "description": "E-commerce Website",
          "status": "in_progress"
        }
      ]
    },
    "employees": {
      "count": 5,
      "details": [
        {
          "id": 10,
          "firstName": "Alice",
          "lastName": "Johnson"
        }
      ]
    }
  }
}
```

---

## 👤 **6. Get Available Heads**

**Endpoint**: `GET /production/units/available-heads`

**Required Role**: `dep_manager`

### Test Cases:

#### Test 1: Get All Available Heads
```
GET /production/units/available-heads
```

#### Test 2: Get Only Assigned Heads
```
GET /production/units/available-heads?assigned=true
```

#### Test 3: Get Only Unassigned Heads
```
GET /production/units/available-heads?assigned=false
```

**Expected Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 5,
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@company.com",
      "isAssigned": true,
      "currentUnit": {
        "id": 1,
        "name": "Frontend Development Unit"
      }
    },
    {
      "id": 8,
      "firstName": "Sarah",
      "lastName": "Wilson",
      "email": "sarah.wilson@company.com",
      "isAssigned": false,
      "currentUnit": null
    }
  ],
  "total": 2,
  "message": "Available heads retrieved successfully"
}
```

---

## 🧪 **Role-Based Testing Scenarios**

### **Scenario 1: Department Manager Testing**
1. **Login** as a user with `dep_manager` role
2. **Test all endpoints** - Should have full access
3. **Create units** - Should work
4. **View all units** - Should see all units
5. **Update any unit** - Should work
6. **Delete units** - Should work

### **Scenario 2: Unit Head Testing**
1. **Login** as a user with `unit_head` role
2. **View units** - Should only see their own unit
3. **Update their unit** - Should work
4. **Try to update other units** - Should fail with 403
5. **Try to create units** - Should fail with 403
6. **Try to delete units** - Should fail with 403

### **Scenario 3: Team Lead Testing**
1. **Login** as a user with `team_lead` role
2. **View units** - Should only see units where they lead teams
3. **Try to update units** - Should fail with 403
4. **Try to create units** - Should fail with 403

### **Scenario 4: Senior/Junior Testing**
1. **Login** as a user with `senior` or `junior` role
2. **View units** - Should only see units where they are team members
3. **Try to update units** - Should fail with 403
4. **Try to create units** - Should fail with 403

---

## 🔍 **Error Testing Scenarios**

### **Test 1: Invalid Unit ID**
```
GET /production/units/advanced?unitId=999
```
**Expected**: Empty data array

### **Test 2: Invalid Head ID**
```
POST /production/units/create
```
**Body**:
```json
{
  "name": "Test Unit",
  "headId": 999
}
```
**Expected**: 400 Bad Request - "Employee with ID 999 does not exist"

### **Test 3: Duplicate Unit Name**
```
POST /production/units/create
```
**Body**:
```json
{
  "name": "Frontend Development Unit",
  "headId": 5
}
```
**Expected**: 409 Conflict - "Unit name already exists"

### **Test 4: Unauthorized Access**
1. **Login** as `junior` role
2. **Try to create unit** - Should get 403 Forbidden

### **Test 5: Invalid Query Parameters**
```
GET /production/units/advanced?sortBy=invalidField&sortOrder=invalidOrder
```
**Expected**: Should still work but with default sorting

---

## 📝 **Testing Checklist**

### **Basic Functionality**
- [ ] Create unit with head
- [ ] Create unit without head
- [ ] Get all units
- [ ] Get specific unit
- [ ] Update unit name
- [ ] Update unit head
- [ ] Delete unit
- [ ] Get available heads

### **Advanced Features**
- [ ] Filter by unit ID
- [ ] Include employees data
- [ ] Include projects data
- [ ] Include teams data
- [ ] Filter by has head
- [ ] Filter by has teams
- [ ] Filter by has projects
- [ ] Pagination
- [ ] Sorting

### **Role-Based Access**
- [ ] Manager can do everything
- [ ] Unit head can only access own unit
- [ ] Team lead can only see assigned units
- [ ] Senior/junior can only see assigned units

### **Error Handling**
- [ ] Invalid unit ID
- [ ] Invalid head ID
- [ ] Duplicate unit name
- [ ] Unauthorized access
- [ ] Missing required fields

---

## 🚀 **Quick Test Sequence**

1. **Create 3 units** with different configurations
2. **Get all units** to verify creation
3. **Get specific unit** with all related data
4. **Update unit** name and head
5. **Test advanced filtering** with various parameters
6. **Test pagination** and sorting
7. **Test role-based access** with different user roles
8. **Test error scenarios** for proper error handling

This comprehensive testing guide will help you verify all functionality of the optimized Production Units APIs! 🎯
