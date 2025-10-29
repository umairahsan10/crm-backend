# 🗑️ **REMOVED SALES UNITS ENDPOINTS DOCUMENTATION**

## **📋 Overview**

This document lists the Sales Units API endpoints that have been **REMOVED** as part of the alignment with Production Units structure. These endpoints were redundant and their functionality has been consolidated into the main `GET /sales/units/:id` endpoint.

---

## **🚫 REMOVED ENDPOINTS**

### **1. Get Employees in Unit**
- **Endpoint:** `GET /sales/units/:id/employees`
- **Purpose:** Get all employees in a specific sales unit
- **Access:** `dep_manager`, `unit_head`
- **Status:** ❌ **REMOVED**

**Reason for Removal:**
- Functionality consolidated into main `GET /sales/units/:id` endpoint
- Employee data now included in comprehensive unit details
- Reduces API complexity and improves performance

**Alternative:**
Use `GET /sales/units/:id` with role-based filtering to get employee data.

---

### **2. Get Leads in Unit**
- **Endpoint:** `GET /sales/units/:id/leads`
- **Purpose:** Get all leads in a specific sales unit
- **Access:** `dep_manager`, `unit_head`
- **Status:** ❌ **REMOVED**

**Reason for Removal:**
- Functionality consolidated into main `GET /sales/units/:id` endpoint
- Lead data now organized by status (active, cracked, archived) in comprehensive response
- Better data organization and role-based access control

**Alternative:**
Use `GET /sales/units/:id` to get leads organized by status with role-based filtering.

---

### **3. Get Archived Leads in Unit**
- **Endpoint:** `GET /sales/units/:id/archive-leads`
- **Purpose:** Get all archived leads in a specific sales unit
- **Access:** `dep_manager`, `unit_head`
- **Status:** ❌ **REMOVED**

**Reason for Removal:**
- Functionality consolidated into main `GET /sales/units/:id` endpoint
- Archived leads now included in comprehensive leads response
- Better data organization with all lead types in one response

**Alternative:**
Use `GET /sales/units/:id` to get archived leads as part of the comprehensive leads data.

---

## **✅ RETAINED ENDPOINTS**

### **1. Get Archived Leads from Deleted Units**
- **Endpoint:** `GET /sales/units/deleted/archive-leads`
- **Purpose:** Get archived leads from units that have been deleted
- **Access:** `dep_manager` only
- **Status:** ✅ **RETAINED**

**Reason for Retention:**
- Unique functionality not covered by main unit endpoint
- Important for data recovery and audit purposes
- Specific use case for deleted units

---

## **🔄 MIGRATION GUIDE**

### **For Frontend Applications:**

#### **Before (Old Endpoints):**
```javascript
// Get employees
const employees = await fetch('/sales/units/1/employees');

// Get leads
const leads = await fetch('/sales/units/1/leads');

// Get archived leads
const archivedLeads = await fetch('/sales/units/1/archive-leads');
```

#### **After (New Consolidated Endpoint):**
```javascript
// Get comprehensive unit data (includes employees, leads, archived leads)
const unitData = await fetch('/sales/units/1');

// Access specific data from response
const employees = unitData.data.employees;
const leads = unitData.data.leads.active;        // Active leads
const crackedLeads = unitData.data.leads.cracked; // Cracked leads
const archivedLeads = unitData.data.leads.archived; // Archived leads
```

### **Response Structure Changes:**

#### **Old Structure:**
```json
{
  "success": true,
  "data": [...], // Array of employees/leads
  "total": 10,
  "message": "Data retrieved successfully"
}
```

#### **New Structure:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Sales Unit 1",
    "head": {...},
    "teams": [...],
    "employees": [...], // All employees
    "leads": {
      "active": [...],    // Active leads
      "cracked": [...],   // Cracked leads
      "archived": [...]   // Archived leads
    },
    "summary": {
      "teamsCount": 3,
      "employeesCount": 15,
      "leadsCount": {
        "active": 25,
        "cracked": 10,
        "archived": 5,
        "total": 40
      },
      "conversionRate": 25.0
    }
  },
  "message": "Unit details retrieved successfully"
}
```

---

## **🎯 BENEFITS OF CONSOLIDATION**

### **1. Performance Improvements**
- **Single API Call:** Reduces multiple API calls to one comprehensive call
- **Reduced Network Overhead:** Less data transfer and connection overhead
- **Better Caching:** Single endpoint is easier to cache and manage

### **2. Enhanced Data Organization**
- **Structured Response:** Leads organized by status (active, cracked, archived)
- **Comprehensive Summary:** All counts and metrics in one place
- **Better UX:** Frontend gets all needed data in one request

### **3. Improved Role-Based Access**
- **Granular Control:** Different data visibility based on user role
- **Security:** Better access control with role-based filtering
- **Consistency:** Uniform access control across all data types

### **4. Simplified API Management**
- **Fewer Endpoints:** Reduced API surface area
- **Easier Maintenance:** Less code to maintain and test
- **Better Documentation:** Simpler API documentation

---

## **🔧 IMPLEMENTATION NOTES**

### **Role-Based Data Access:**

#### **Department Manager (`dep_manager`):**
- ✅ **Full Access:** Can see all data for all units
- ✅ **All Employees:** Complete employee list
- ✅ **All Leads:** Active, cracked, and archived leads
- ✅ **All Teams:** Complete team information

#### **Unit Head (`unit_head`):**
- ✅ **Unit Access:** Can see all data for their assigned unit only
- ✅ **All Employees:** Complete employee list for their unit
- ✅ **All Leads:** Active, cracked, and archived leads for their unit
- ✅ **All Teams:** Complete team information for their unit

#### **Team Lead (`team_lead`):**
- ✅ **Team Access:** Can see data for teams they lead
- ✅ **Team Employees:** Employees in their teams
- ✅ **Team Leads:** Leads assigned to their team members
- ❌ **Other Teams:** Cannot see other teams' data

#### **Senior/Junior (`senior`, `junior`):**
- ✅ **Personal Access:** Can see their own data only
- ✅ **Personal Leads:** Leads assigned to them
- ✅ **Unit Teams:** Can see all teams in their unit (for context)
- ❌ **Other Employees:** Cannot see other employees' data
- ❌ **Other Leads:** Cannot see leads assigned to others

---

## **📊 IMPACT ASSESSMENT**

### **Breaking Changes:**
- ❌ **High Impact:** Existing frontend code using removed endpoints will break
- ❌ **API Changes:** Response structure has changed significantly
- ❌ **Access Changes:** Some data access patterns have changed

### **Migration Effort:**
- 🔄 **Medium Effort:** Frontend applications need to be updated
- 🔄 **Testing Required:** All affected functionality needs testing
- 🔄 **Documentation Update:** API documentation needs updating

### **Benefits:**
- ✅ **Better Performance:** Single API call instead of multiple calls
- ✅ **Enhanced Security:** Better role-based access control
- ✅ **Improved UX:** More comprehensive and organized data
- ✅ **Easier Maintenance:** Fewer endpoints to maintain

---

## **📞 SUPPORT**

If you encounter any issues with the migration or need assistance with updating your frontend code, please contact the development team.

**Migration Deadline:** Please update your applications to use the new consolidated endpoint structure as soon as possible to avoid service disruptions.

---

*This documentation was created as part of the Sales Units API alignment with Production Units structure.*
