# 🏗️ Lead Management Hierarchical Access Control

## Overview
This document explains the sophisticated hierarchical access control system implemented in the Lead Management API. The system ensures that users can only access leads appropriate to their role and organizational position.

---

## 🔐 Access Control Matrix

### Role Hierarchy (Top to Bottom)
1. **Admin** - Full system access
2. **Department Manager** - All sales units
3. **Unit Head** - Single sales unit
4. **Team Lead** - Team within a sales unit
5. **Senior** - Individual level
6. **Junior** - Individual level

---

## 📊 Detailed Role Permissions

### 🔴 Admin
- **Scope**: All leads from all sales units
- **Lead Types**: warm, cold, push, upsell
- **Restrictions**: None
- **Database Filter**: No WHERE clause restrictions

### 🟠 Department Manager (dep_manager)
- **Scope**: All leads from all sales units
- **Lead Types**: warm, cold, push, upsell
- **Restrictions**: None
- **Database Filter**: No WHERE clause restrictions

### 🟡 Unit Head (unit_head)
- **Scope**: All leads from their sales unit only
- **Lead Types**: warm, cold, push, upsell
- **Restrictions**: Cannot see leads from other units
- **Database Filter**: `WHERE salesUnitId = userSalesUnitId`

### 🟢 Team Lead (team_lead)
- **Scope**: All leads from their sales unit + leads assigned to their team members
- **Lead Types**: warm, cold, push, upsell
- **Restrictions**: Cannot see leads from other units or other teams
- **Special**: Includes leads assigned to themselves
- **Database Filter**: 
  ```sql
  WHERE salesUnitId = userSalesUnitId 
  AND assignedToId IN (teamMemberIds + userId)
  ```

### 🔵 Senior (senior)
- **Scope**: Only leads assigned to them from their sales unit
- **Lead Types**: warm, cold, push
- **Restrictions**: Cannot see leads assigned to others
- **Database Filter**: 
  ```sql
  WHERE salesUnitId = userSalesUnitId 
  AND assignedToId = userId
  ```

### 🟣 Junior (junior)
- **Scope**: Only leads assigned to them from their sales unit
- **Lead Types**: warm, cold
- **Restrictions**: Cannot see leads assigned to others, no push/upsell access
- **Database Filter**: 
  ```sql
  WHERE salesUnitId = userSalesUnitId 
  AND assignedToId = userId
  ```

---

## 🗄️ Database Schema Relationships

### Key Tables
```sql
-- Employee table with team lead relationship
employees (
  id,
  team_lead_id,  -- Points to team lead's employee ID
  ...
)

-- Sales department linking employees to units
sales_department (
  employee_id,
  sales_unit_id,
  ...
)

-- Sales units with head information
sales_units (
  id,
  head_id,  -- Points to unit head's employee ID
  ...
)

-- Teams table
teams (
  id,
  team_lead_id,  -- Points to team lead's employee ID
  sales_unit_id,
  ...
)
```

### Relationship Flow
```
Employee → SalesDepartment → SalesUnit
    ↓
TeamLead → TeamMembers (via team_lead_id)
    ↓
UnitHead → AllUnitMembers (via sales_unit_id)
```

---

## 🔧 Implementation Details

### 1. User Authentication Flow
```typescript
// JWT token contains:
{
  id: number,        // Employee ID
  role: string,      // Role name
  // Note: No salesUnitId in JWT - fetched from database
}
```

### 2. Sales Department Lookup
```typescript
const userSalesDept = await prisma.salesDepartment.findFirst({
  where: { employeeId: userId },
  include: { 
    salesUnit: { 
      select: { 
        id: true, 
        headId: true,
        teams: { 
          select: { 
            id: true, 
            teamLeadId: true 
          } 
        }
      }
    }
  }
});
```

### 3. Hierarchical Filtering Logic
```typescript
switch(userRole) {
  case 'dep_manager':
    return {}; // No restrictions
    
  case 'unit_head':
    return { salesUnitId }; // Only their unit
    
  case 'team_lead':
    // Get team members
    const teamMembers = await prisma.employee.findMany({
      where: { teamLeadId: userId },
      select: { id: true }
    });
    const teamMemberIds = teamMembers.map(member => member.id);
    return { 
      salesUnitId,
      assignedToId: { in: [...teamMemberIds, userId] }
    };
    
  case 'senior':
  case 'junior':
    return { 
      salesUnitId,
      assignedToId: userId 
    };
}
```

### 4. Type Filtering
```typescript
const roleAccessMap = {
  'junior': ['warm', 'cold'],
  'senior': ['warm', 'cold', 'push'],
  'team_lead': ['warm', 'cold', 'push', 'upsell'],
  'unit_head': ['warm', 'cold', 'push', 'upsell'],
  'dep_manager': ['warm', 'cold', 'push', 'upsell'],
  'admin': ['warm', 'cold', 'push', 'upsell']
};
```

---

## 🐛 Debugging & Troubleshooting

### Console Logging
The system provides comprehensive logging to help debug access control issues:

#### Example Log Output
```
🔍 ===== FIND ALL LEADS START =====
🔍 User ID: 5 | Role: team_lead
🔍 Getting sales department info for user ID: 5
🔍 Found sales department record:
  Sales Unit ID: 1
  Unit Head ID: 10
  Teams in unit: 2
    Team 1: ID=1, Lead=5
    Team 2: ID=2, Lead=6

🔍 ===== HIERARCHICAL FILTERING =====
🔍 ✅ team_lead - TEAM RESTRICTION
  → Can see leads from unit ID: 1
  → Querying team members for team lead ID: 5
  → Found team members: 3
  → Team member details: ["1: John Doe", "2: Jane Smith", "3: Bob Johnson"]
  → Team member IDs for filtering: [1, 2, 3]
  → Final member IDs (including team lead): [1, 2, 3, 5]

🔍 Final WHERE clause: {
  "salesUnitId": 1,
  "assignedToId": { "in": [1, 2, 3, 5] },
  "type": { "in": ["warm", "cold", "push", "upsell"] }
}

🔍 ===== QUERY RESULTS =====
🔍 Total leads found: 15
🔍 Leads returned: 15
```

### Common Issues & Solutions

#### Issue: Team Lead sees zero leads
**Possible Causes:**
1. No team members assigned to the team lead
2. Team members have no leads assigned
3. Team lead not properly linked in sales_department table

**Debug Steps:**
1. Check console logs for team member count
2. Verify sales_department table has correct employee_id
3. Check if team members have team_lead_id set correctly

#### Issue: Unit Head sees leads from other units
**Possible Causes:**
1. sales_department table has incorrect sales_unit_id
2. User role is not 'unit_head'

**Debug Steps:**
1. Check console logs for sales unit ID
2. Verify user role in JWT token
3. Check sales_department table data

#### Issue: Senior/Junior sees leads assigned to others
**Possible Causes:**
1. assignedToId filter not working correctly
2. User role is not 'senior' or 'junior'

**Debug Steps:**
1. Check console logs for final WHERE clause
2. Verify assignedToId filter is applied
3. Check user role in JWT token

---

## 📈 Performance Considerations

### Optimization Strategies
1. **Single Query**: All filtering done in one database query
2. **Conditional Joins**: Only join necessary tables based on role
3. **Indexed Fields**: All filter fields are properly indexed
4. **Pagination**: Built-in pagination to handle large datasets

### Database Indexes
Ensure these indexes exist for optimal performance:
```sql
-- Sales department table
CREATE INDEX idx_sales_department_employee_id ON sales_department(employee_id);
CREATE INDEX idx_sales_department_sales_unit_id ON sales_department(sales_unit_id);

-- Employee table
CREATE INDEX idx_employees_team_lead_id ON employees(team_lead_id);

-- Leads table
CREATE INDEX idx_leads_sales_unit_id ON leads(sales_unit_id);
CREATE INDEX idx_leads_assigned_to_id ON leads(assigned_to_id);
CREATE INDEX idx_leads_type ON leads(type);
CREATE INDEX idx_leads_status ON leads(status);
```

---

## 🧪 Testing Scenarios

### Test Cases
1. **Department Manager**: Should see all leads from all units
2. **Unit Head**: Should see only leads from their unit
3. **Team Lead**: Should see leads from their unit + team members' leads
4. **Senior**: Should see only leads assigned to them
5. **Junior**: Should see only leads assigned to them (warm/cold only)

### Test Data Setup
```sql
-- Create test sales units
INSERT INTO sales_units (id, name, head_id) VALUES 
(1, 'North Region', 10),
(2, 'South Region', 20);

-- Create test teams
INSERT INTO teams (id, name, team_lead_id, sales_unit_id) VALUES 
(1, 'Team A', 5, 1),
(2, 'Team B', 6, 1);

-- Create test employees
INSERT INTO employees (id, first_name, last_name, team_lead_id) VALUES 
(1, 'John', 'Doe', 5),      -- Team member
(2, 'Jane', 'Smith', 5),    -- Team member
(3, 'Bob', 'Johnson', 5),   -- Team member
(5, 'Alice', 'TeamLead', NULL), -- Team lead
(6, 'Charlie', 'TeamLead2', NULL), -- Team lead 2
(10, 'David', 'UnitHead', NULL);   -- Unit head

-- Create test sales department records
INSERT INTO sales_department (employee_id, sales_unit_id) VALUES 
(1, 1), (2, 1), (3, 1), (5, 1), (6, 1), (10, 1);

-- Create test leads
INSERT INTO leads (id, name, type, sales_unit_id, assigned_to_id) VALUES 
(1, 'Lead 1', 'warm', 1, 1),
(2, 'Lead 2', 'cold', 1, 2),
(3, 'Lead 3', 'push', 1, 5),
(4, 'Lead 4', 'upsell', 2, 6);
```

---

## 🔄 Migration Notes

### Changes Made
1. **Removed JWT salesUnitId**: Now fetched from database
2. **Added hierarchical filtering**: Role-based access control
3. **Added team member lookup**: For team lead filtering
4. **Added comprehensive logging**: For debugging access issues

### Backward Compatibility
- All existing API endpoints remain the same
- Response format unchanged
- Only internal filtering logic updated

### Database Requirements
- No schema changes required
- Existing relationships used
- Proper indexes recommended for performance
