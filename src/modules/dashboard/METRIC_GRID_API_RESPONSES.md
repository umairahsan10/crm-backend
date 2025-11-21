# Metric Grid API - Complete Response Examples

## Overview
This document contains all possible response examples for the `/dashboard/metric-grid` API endpoint, organized by department, role, and scenario.

## Endpoint
`GET /dashboard/metric-grid`

## Authentication
Requires JWT Bearer token in Authorization header.

---

## Response Structure

```typescript
{
  department: string;
  role: string;
  cards: Array<{
    id: number;
    title: string;
    value: string;
    subtitle?: string;
    change?: string;
    changeType?: 'positive' | 'negative' | 'neutral';
  }>;
}
```

---

## 1. SALES DEPARTMENT

### 1.1 Department Manager (dep_manager)

#### Scenario 1: Positive Changes
```json
{
  "department": "Sales",
  "role": "dep_manager",
  "cards": [
    {
      "id": 1,
      "title": "Leads",
      "value": "150",
      "subtitle": "Active: 45",
      "change": "+12 from last month",
      "changeType": "positive"
    },
    {
      "id": 2,
      "title": "Conversion Rate",
      "value": "32.50%",
      "subtitle": "Cracked / Total",
      "change": "+2.5% from last month",
      "changeType": "positive"
    },
    {
      "id": 3,
      "title": "Revenue / Commission",
      "value": "$125.5K / $12.5K",
      "subtitle": "Total / Your share",
      "change": "+$15.2K from last month",
      "changeType": "positive"
    },
    {
      "id": 4,
      "title": "Won Deals",
      "value": "48",
      "subtitle": "Cracked leads",
      "change": "+5 from last month",
      "changeType": "positive"
    }
  ]
}
```

#### Scenario 2: Negative Changes
```json
{
  "department": "Sales",
  "role": "dep_manager",
  "cards": [
    {
      "id": 1,
      "title": "Leads",
      "value": "120",
      "subtitle": "Active: 35",
      "change": "-8 from last month",
      "changeType": "negative"
    },
    {
      "id": 2,
      "title": "Conversion Rate",
      "value": "28.33%",
      "subtitle": "Cracked / Total",
      "change": "-3.2% from last month",
      "changeType": "negative"
    },
    {
      "id": 3,
      "title": "Revenue / Commission",
      "value": "$98.2K / $9.8K",
      "subtitle": "Total / Your share",
      "change": "-$12.5K from last month",
      "changeType": "negative"
    },
    {
      "id": 4,
      "title": "Won Deals",
      "value": "34",
      "subtitle": "Cracked leads",
      "change": "-4 from last month",
      "changeType": "negative"
    }
  ]
}
```

#### Scenario 3: Mixed Changes
```json
{
  "department": "Sales",
  "role": "dep_manager",
  "cards": [
    {
      "id": 1,
      "title": "Leads",
      "value": "145",
      "subtitle": "Active: 42",
      "change": "+5 from last month",
      "changeType": "positive"
    },
    {
      "id": 2,
      "title": "Conversion Rate",
      "value": "30.00%",
      "subtitle": "Cracked / Total",
      "change": "-1.5% from last month",
      "changeType": "negative"
    },
    {
      "id": 3,
      "title": "Revenue / Commission",
      "value": "$110.3K / $11.0K",
      "subtitle": "Total / Your share",
      "change": "+$3.8K from last month",
      "changeType": "positive"
    },
    {
      "id": 4,
      "title": "Won Deals",
      "value": "43",
      "subtitle": "Cracked leads",
      "change": "Same as last month",
      "changeType": "neutral"
    }
  ]
}
```

#### Scenario 4: No Previous Data
```json
{
  "department": "Sales",
  "role": "dep_manager",
  "cards": [
    {
      "id": 1,
      "title": "Leads",
      "value": "25",
      "subtitle": "Active: 8",
      "change": "+25 this month",
      "changeType": "positive"
    },
    {
      "id": 2,
      "title": "Conversion Rate",
      "value": "0%",
      "subtitle": "Cracked / Total",
      "change": "Same as last month",
      "changeType": "neutral"
    },
    {
      "id": 3,
      "title": "Revenue / Commission",
      "value": "$0 / $0",
      "subtitle": "Total / Your share",
      "change": "+$0 this month",
      "changeType": "neutral"
    },
    {
      "id": 4,
      "title": "Won Deals",
      "value": "0",
      "subtitle": "Cracked leads",
      "change": "Same as last month",
      "changeType": "neutral"
    }
  ]
}
```

### 1.2 Unit Head (unit_head)

#### Scenario 1: Positive Changes
```json
{
  "department": "Sales",
  "role": "unit_head",
  "cards": [
    {
      "id": 1,
      "title": "Leads",
      "value": "75",
      "subtitle": "Active: 22",
      "change": "+8 from last month",
      "changeType": "positive"
    },
    {
      "id": 2,
      "title": "Conversion Rate",
      "value": "28.00%",
      "subtitle": "Cracked / Total",
      "change": "+1.2% from last month",
      "changeType": "positive"
    },
    {
      "id": 3,
      "title": "Revenue / Commission",
      "value": "$62.3K / $6.2K",
      "subtitle": "Total / Your share",
      "change": "+$8.5K from last month",
      "changeType": "positive"
    },
    {
      "id": 4,
      "title": "Won Deals",
      "value": "21",
      "subtitle": "Cracked leads",
      "change": "+3 from last month",
      "changeType": "positive"
    }
  ]
}
```

#### Scenario 2: Negative Changes
```json
{
  "department": "Sales",
  "role": "unit_head",
  "cards": [
    {
      "id": 1,
      "title": "Leads",
      "value": "65",
      "subtitle": "Active: 18",
      "change": "-5 from last month",
      "changeType": "negative"
    },
    {
      "id": 2,
      "title": "Conversion Rate",
      "value": "26.15%",
      "subtitle": "Cracked / Total",
      "change": "-2.1% from last month",
      "changeType": "negative"
    },
    {
      "id": 3,
      "title": "Revenue / Commission",
      "value": "$52.1K / $5.2K",
      "subtitle": "Total / Your share",
      "change": "-$6.8K from last month",
      "changeType": "negative"
    },
    {
      "id": 4,
      "title": "Won Deals",
      "value": "17",
      "subtitle": "Cracked leads",
      "change": "-2 from last month",
      "changeType": "negative"
    }
  ]
}
```

### 1.3 Team Lead (team_lead)

#### Scenario 1: Positive Changes
```json
{
  "department": "Sales",
  "role": "team_lead",
  "cards": [
    {
      "id": 1,
      "title": "Leads",
      "value": "35",
      "subtitle": "Active: 12",
      "change": "+4 from last month",
      "changeType": "positive"
    },
    {
      "id": 2,
      "title": "Conversion Rate",
      "value": "34.29%",
      "subtitle": "Cracked / Total",
      "change": "+3.1% from last month",
      "changeType": "positive"
    },
    {
      "id": 3,
      "title": "Revenue / Commission",
      "value": "$28.5K / $2.8K",
      "subtitle": "Total / Your share",
      "change": "+$4.2K from last month",
      "changeType": "positive"
    },
    {
      "id": 4,
      "title": "Won Deals",
      "value": "12",
      "subtitle": "Cracked leads",
      "change": "+2 from last month",
      "changeType": "positive"
    }
  ]
}
```

#### Scenario 2: Negative Changes
```json
{
  "department": "Sales",
  "role": "team_lead",
  "cards": [
    {
      "id": 1,
      "title": "Leads",
      "value": "28",
      "subtitle": "Active: 9",
      "change": "-3 from last month",
      "changeType": "negative"
    },
    {
      "id": 2,
      "title": "Conversion Rate",
      "value": "32.14%",
      "subtitle": "Cracked / Total",
      "change": "-2.2% from last month",
      "changeType": "negative"
    },
    {
      "id": 3,
      "title": "Revenue / Commission",
      "value": "$22.8K / $2.3K",
      "subtitle": "Total / Your share",
      "change": "-$3.5K from last month",
      "changeType": "negative"
    },
    {
      "id": 4,
      "title": "Won Deals",
      "value": "9",
      "subtitle": "Cracked leads",
      "change": "-1 from last month",
      "changeType": "negative"
    }
  ]
}
```

### 1.4 Salesperson (salesperson)

#### Scenario 1: Positive Changes
```json
{
  "department": "Sales",
  "role": "salesperson",
  "cards": [
    {
      "id": 1,
      "title": "Leads",
      "value": "15",
      "subtitle": "Active: 5",
      "change": "+2 from last month",
      "changeType": "positive"
    },
    {
      "id": 2,
      "title": "Conversion Rate",
      "value": "40.00%",
      "subtitle": "Cracked / Total",
      "change": "+5.0% from last month",
      "changeType": "positive"
    },
    {
      "id": 3,
      "title": "Revenue / Commission",
      "value": "$12.5K / $1.2K",
      "subtitle": "Total / Your share",
      "change": "+$2.1K from last month",
      "changeType": "positive"
    },
    {
      "id": 4,
      "title": "Won Deals",
      "value": "6",
      "subtitle": "Cracked leads",
      "change": "+1 from last month",
      "changeType": "positive"
    }
  ]
}
```

#### Scenario 2: Negative Changes
```json
{
  "department": "Sales",
  "role": "salesperson",
  "cards": [
    {
      "id": 1,
      "title": "Leads",
      "value": "12",
      "subtitle": "Active: 4",
      "change": "-1 from last month",
      "changeType": "negative"
    },
    {
      "id": 2,
      "title": "Conversion Rate",
      "value": "33.33%",
      "subtitle": "Cracked / Total",
      "change": "-3.5% from last month",
      "changeType": "negative"
    },
    {
      "id": 3,
      "title": "Revenue / Commission",
      "value": "$9.8K / $1.0K",
      "subtitle": "Total / Your share",
      "change": "-$1.2K from last month",
      "changeType": "negative"
    },
    {
      "id": 4,
      "title": "Won Deals",
      "value": "4",
      "subtitle": "Cracked leads",
      "change": "-1 from last month",
      "changeType": "negative"
    }
  ]
}
```

#### Scenario 3: No Data
```json
{
  "department": "Sales",
  "role": "salesperson",
  "cards": [
    {
      "id": 1,
      "title": "Leads",
      "value": "0",
      "subtitle": "Active: 0",
      "change": "Same as last month",
      "changeType": "neutral"
    },
    {
      "id": 2,
      "title": "Conversion Rate",
      "value": "0%",
      "subtitle": "Cracked / Total",
      "change": "Same as last month",
      "changeType": "neutral"
    },
    {
      "id": 3,
      "title": "Revenue / Commission",
      "value": "$0 / $0",
      "subtitle": "Total / Your share",
      "change": "Same as last month",
      "changeType": "neutral"
    },
    {
      "id": 4,
      "title": "Won Deals",
      "value": "0",
      "subtitle": "Cracked leads",
      "change": "Same as last month",
      "changeType": "neutral"
    }
  ]
}
```

---

## 2. HR DEPARTMENT

### 2.1 Any Role (hr_manager, dep_manager, etc.)

**Note:** HR cards are the same regardless of role within HR department.

#### Scenario 1: Positive Changes
```json
{
  "department": "HR",
  "role": "hr_manager",
  "cards": [
    {
      "id": 1,
      "title": "Employees",
      "value": "245",
      "subtitle": "Active employees",
      "change": "+8 from last month",
      "changeType": "positive"
    },
    {
      "id": 2,
      "title": "Attendance Rate",
      "value": "94.5%",
      "subtitle": "This month",
      "change": "+1.2% from last month",
      "changeType": "positive"
    },
    {
      "id": 3,
      "title": "Request Pending",
      "value": "12",
      "subtitle": "Assigned to you",
      "change": "-3 from last month",
      "changeType": "positive"
    },
    {
      "id": 4,
      "title": "On Leave Today",
      "value": "8",
      "subtitle": "Currently on leave",
      "change": "-2 from last month",
      "changeType": "positive"
    }
  ]
}
```

#### Scenario 2: Negative Changes
```json
{
  "department": "HR",
  "role": "hr_manager",
  "cards": [
    {
      "id": 1,
      "title": "Employees",
      "value": "238",
      "subtitle": "Active employees",
      "change": "-2 from last month",
      "changeType": "negative"
    },
    {
      "id": 2,
      "title": "Attendance Rate",
      "value": "91.2%",
      "subtitle": "This month",
      "change": "-2.8% from last month",
      "changeType": "negative"
    },
    {
      "id": 3,
      "title": "Request Pending",
      "value": "18",
      "subtitle": "Assigned to you",
      "change": "+6 from last month",
      "changeType": "negative"
    },
    {
      "id": 4,
      "title": "On Leave Today",
      "value": "15",
      "subtitle": "Currently on leave",
      "change": "+7 from last month",
      "changeType": "negative"
    }
  ]
}
```

#### Scenario 3: Mixed Changes
```json
{
  "department": "HR",
  "role": "hr_manager",
  "cards": [
    {
      "id": 1,
      "title": "Employees",
      "value": "242",
      "subtitle": "Active employees",
      "change": "+3 from last month",
      "changeType": "positive"
    },
    {
      "id": 2,
      "title": "Attendance Rate",
      "value": "93.1%",
      "subtitle": "This month",
      "change": "-0.5% from last month",
      "changeType": "negative"
    },
    {
      "id": 3,
      "title": "Request Pending",
      "value": "15",
      "subtitle": "Assigned to you",
      "change": "Same as last month",
      "changeType": "neutral"
    },
    {
      "id": 4,
      "title": "On Leave Today",
      "value": "10",
      "subtitle": "Currently on leave",
      "change": "+1 from last month",
      "changeType": "negative"
    }
  ]
}
```

#### Scenario 4: No Requests Assigned
```json
{
  "department": "HR",
  "role": "hr_manager",
  "cards": [
    {
      "id": 1,
      "title": "Employees",
      "value": "245",
      "subtitle": "Active employees",
      "change": "+8 from last month",
      "changeType": "positive"
    },
    {
      "id": 2,
      "title": "Attendance Rate",
      "value": "94.5%",
      "subtitle": "This month",
      "change": "+1.2% from last month",
      "changeType": "positive"
    },
    {
      "id": 3,
      "title": "Request Pending",
      "value": "25",
      "subtitle": "All pending",
      "change": "+5 from last month",
      "changeType": "negative"
    },
    {
      "id": 4,
      "title": "On Leave Today",
      "value": "8",
      "subtitle": "Currently on leave",
      "change": "-2 from last month",
      "changeType": "positive"
    }
  ]
}
```

---

## 3. PRODUCTION DEPARTMENT

### 3.1 Department Manager (dep_manager)

#### Scenario 1: Positive Changes
```json
{
  "department": "Production",
  "role": "dep_manager",
  "cards": [
    {
      "id": 1,
      "title": "Total Projects",
      "value": "85",
      "subtitle": "All projects",
      "change": "+10 from last month",
      "changeType": "positive"
    },
    {
      "id": 2,
      "title": "Production Units",
      "value": "5",
      "subtitle": "Total units",
      "change": "+1 from last month",
      "changeType": "positive"
    },
    {
      "id": 3,
      "title": "Active Projects",
      "value": "32",
      "subtitle": "In progress",
      "change": "+5 from last month",
      "changeType": "positive"
    },
    {
      "id": 4,
      "title": "Most Completed",
      "value": "28",
      "subtitle": "John Doe",
      "change": "Leading performer this month",
      "changeType": "neutral"
    }
  ]
}
```

#### Scenario 2: Negative Changes
```json
{
  "department": "Production",
  "role": "dep_manager",
  "cards": [
    {
      "id": 1,
      "title": "Total Projects",
      "value": "72",
      "subtitle": "All projects",
      "change": "-5 from last month",
      "changeType": "negative"
    },
    {
      "id": 2,
      "title": "Production Units",
      "value": "5",
      "subtitle": "Total units",
      "change": "Same as last month",
      "changeType": "neutral"
    },
    {
      "id": 3,
      "title": "Active Projects",
      "value": "25",
      "subtitle": "In progress",
      "change": "-3 from last month",
      "changeType": "negative"
    },
    {
      "id": 4,
      "title": "Most Completed",
      "value": "22",
      "subtitle": "Jane Smith",
      "change": "Leading performer this month",
      "changeType": "neutral"
    }
  ]
}
```

#### Scenario 3: No Data
```json
{
  "department": "Production",
  "role": "dep_manager",
  "cards": [
    {
      "id": 1,
      "title": "Total Projects",
      "value": "0",
      "subtitle": "All projects",
      "change": "Same as last month",
      "changeType": "neutral"
    },
    {
      "id": 2,
      "title": "Production Units",
      "value": "0",
      "subtitle": "Total units",
      "change": "Same as last month",
      "changeType": "neutral"
    },
    {
      "id": 3,
      "title": "Active Projects",
      "value": "0",
      "subtitle": "In progress",
      "change": "Same as last month",
      "changeType": "neutral"
    },
    {
      "id": 4,
      "title": "Most Completed",
      "value": "0",
      "subtitle": "No data",
      "change": "No performance data",
      "changeType": "neutral"
    }
  ]
}
```

### 3.2 Unit Head (unit_head)

#### Scenario 1: Positive Changes
```json
{
  "department": "Production",
  "role": "unit_head",
  "cards": [
    {
      "id": 1,
      "title": "Total Projects",
      "value": "42",
      "subtitle": "In your unit",
      "change": "+6 from last month",
      "changeType": "positive"
    },
    {
      "id": 2,
      "title": "Teams",
      "value": "8",
      "subtitle": "In your unit",
      "change": "+1 from last month",
      "changeType": "positive"
    },
    {
      "id": 3,
      "title": "Active Projects",
      "value": "18",
      "subtitle": "In progress",
      "change": "+3 from last month",
      "changeType": "positive"
    },
    {
      "id": 4,
      "title": "Most Completed",
      "value": "15",
      "subtitle": "Jane Smith",
      "change": "Leading performer this month",
      "changeType": "neutral"
    }
  ]
}
```

#### Scenario 2: Negative Changes
```json
{
  "department": "Production",
  "role": "unit_head",
  "cards": [
    {
      "id": 1,
      "title": "Total Projects",
      "value": "35",
      "subtitle": "In your unit",
      "change": "-4 from last month",
      "changeType": "negative"
    },
    {
      "id": 2,
      "title": "Teams",
      "value": "8",
      "subtitle": "In your unit",
      "change": "Same as last month",
      "changeType": "neutral"
    },
    {
      "id": 3,
      "title": "Active Projects",
      "value": "14",
      "subtitle": "In progress",
      "change": "-2 from last month",
      "changeType": "negative"
    },
    {
      "id": 4,
      "title": "Most Completed",
      "value": "12",
      "subtitle": "Mike Johnson",
      "change": "Leading performer this month",
      "changeType": "neutral"
    }
  ]
}
```

### 3.3 Team Lead (team_lead)

#### Scenario 1: Positive Changes
```json
{
  "department": "Production",
  "role": "team_lead",
  "cards": [
    {
      "id": 1,
      "title": "Total Projects",
      "value": "18",
      "subtitle": "Team projects",
      "change": "+3 from last month",
      "changeType": "positive"
    },
    {
      "id": 2,
      "title": "Team Members",
      "value": "6",
      "subtitle": "In your team",
      "change": "+1 from last month",
      "changeType": "positive"
    },
    {
      "id": 3,
      "title": "Next Deadline",
      "value": "Dec 15, 2024",
      "subtitle": "Active project",
      "change": "Deadline approaching",
      "changeType": "neutral"
    },
    {
      "id": 4,
      "title": "Progress",
      "value": "75%",
      "subtitle": "Current project",
      "change": "+5% from last month",
      "changeType": "positive"
    }
  ]
}
```

#### Scenario 2: Negative Changes
```json
{
  "department": "Production",
  "role": "team_lead",
  "cards": [
    {
      "id": 1,
      "title": "Total Projects",
      "value": "14",
      "subtitle": "Team projects",
      "change": "-2 from last month",
      "changeType": "negative"
    },
    {
      "id": 2,
      "title": "Team Members",
      "value": "6",
      "subtitle": "In your team",
      "change": "Same as last month",
      "changeType": "neutral"
    },
    {
      "id": 3,
      "title": "Next Deadline",
      "value": "Jan 10, 2025",
      "subtitle": "Active project",
      "change": "Deadline approaching",
      "changeType": "neutral"
    },
    {
      "id": 4,
      "title": "Progress",
      "value": "68%",
      "subtitle": "Current project",
      "change": "-3% from last month",
      "changeType": "negative"
    }
  ]
}
```

#### Scenario 3: No Team
```json
{
  "department": "Production",
  "role": "team_lead",
  "cards": [
    {
      "id": 1,
      "title": "Total Projects",
      "value": "0",
      "subtitle": "Team projects",
      "change": "Same as last month",
      "changeType": "neutral"
    },
    {
      "id": 2,
      "title": "Team Members",
      "value": "0",
      "subtitle": "In your team",
      "change": "Not assigned to a team",
      "changeType": "neutral"
    },
    {
      "id": 3,
      "title": "Next Deadline",
      "value": "None",
      "subtitle": "Active project",
      "change": "No deadline set",
      "changeType": "neutral"
    },
    {
      "id": 4,
      "title": "Progress",
      "value": "0%",
      "subtitle": "Current project",
      "change": "Same as last month",
      "changeType": "neutral"
    }
  ]
}
```

### 3.4 Senior Developer (senior)

#### Scenario 1: Positive Changes
```json
{
  "department": "Production",
  "role": "senior",
  "cards": [
    {
      "id": 1,
      "title": "Total Projects",
      "value": "5",
      "subtitle": "Assigned to you",
      "change": "+1 from last month",
      "changeType": "positive"
    },
    {
      "id": 2,
      "title": "Team",
      "value": "Frontend Team",
      "subtitle": "Your team",
      "change": "Team assigned",
      "changeType": "neutral"
    },
    {
      "id": 3,
      "title": "Next Deadline",
      "value": "Dec 20, 2024",
      "subtitle": "Active project",
      "change": "Deadline approaching",
      "changeType": "neutral"
    },
    {
      "id": 4,
      "title": "Progress",
      "value": "60%",
      "subtitle": "Current project",
      "change": "+10% from last month",
      "changeType": "positive"
    }
  ]
}
```

#### Scenario 2: Negative Changes
```json
{
  "department": "Production",
  "role": "senior",
  "cards": [
    {
      "id": 1,
      "title": "Total Projects",
      "value": "4",
      "subtitle": "Assigned to you",
      "change": "-1 from last month",
      "changeType": "negative"
    },
    {
      "id": 2,
      "title": "Team",
      "value": "Frontend Team",
      "subtitle": "Your team",
      "change": "Team assigned",
      "changeType": "neutral"
    },
    {
      "id": 3,
      "title": "Next Deadline",
      "value": "Jan 5, 2025",
      "subtitle": "Active project",
      "change": "Deadline approaching",
      "changeType": "neutral"
    },
    {
      "id": 4,
      "title": "Progress",
      "value": "55%",
      "subtitle": "Current project",
      "change": "-5% from last month",
      "changeType": "negative"
    }
  ]
}
```

#### Scenario 3: No Team
```json
{
  "department": "Production",
  "role": "senior",
  "cards": [
    {
      "id": 1,
      "title": "Total Projects",
      "value": "3",
      "subtitle": "Assigned to you",
      "change": "+3 this month",
      "changeType": "positive"
    },
    {
      "id": 2,
      "title": "Team",
      "value": "No Team",
      "subtitle": "Your team",
      "change": "No team assignment",
      "changeType": "neutral"
    },
    {
      "id": 3,
      "title": "Next Deadline",
      "value": "None",
      "subtitle": "Active project",
      "change": "No deadline set",
      "changeType": "neutral"
    },
    {
      "id": 4,
      "title": "Progress",
      "value": "0%",
      "subtitle": "Current project",
      "change": "Same as last month",
      "changeType": "neutral"
    }
  ]
}
```

### 3.5 Junior Developer (junior)

#### Scenario 1: Positive Changes
```json
{
  "department": "Production",
  "role": "junior",
  "cards": [
    {
      "id": 1,
      "title": "Total Projects",
      "value": "3",
      "subtitle": "Assigned to you",
      "change": "+1 from last month",
      "changeType": "positive"
    },
    {
      "id": 2,
      "title": "Team",
      "value": "Backend Team",
      "subtitle": "Your team",
      "change": "Team assigned",
      "changeType": "neutral"
    },
    {
      "id": 3,
      "title": "Next Deadline",
      "value": "Jan 5, 2025",
      "subtitle": "Active project",
      "change": "Deadline approaching",
      "changeType": "neutral"
    },
    {
      "id": 4,
      "title": "Progress",
      "value": "45%",
      "subtitle": "Current project",
      "change": "+8% from last month",
      "changeType": "positive"
    }
  ]
}
```

#### Scenario 2: Negative Changes
```json
{
  "department": "Production",
  "role": "junior",
  "cards": [
    {
      "id": 1,
      "title": "Total Projects",
      "value": "2",
      "subtitle": "Assigned to you",
      "change": "-1 from last month",
      "changeType": "negative"
    },
    {
      "id": 2,
      "title": "Team",
      "value": "Backend Team",
      "subtitle": "Your team",
      "change": "Team assigned",
      "changeType": "neutral"
    },
    {
      "id": 3,
      "title": "Next Deadline",
      "value": "Feb 1, 2025",
      "subtitle": "Active project",
      "change": "Deadline approaching",
      "changeType": "neutral"
    },
    {
      "id": 4,
      "title": "Progress",
      "value": "38%",
      "subtitle": "Current project",
      "change": "-4% from last month",
      "changeType": "negative"
    }
  ]
}
```

#### Scenario 3: No Team
```json
{
  "department": "Production",
  "role": "junior",
  "cards": [
    {
      "id": 1,
      "title": "Total Projects",
      "value": "2",
      "subtitle": "Assigned to you",
      "change": "+2 this month",
      "changeType": "positive"
    },
    {
      "id": 2,
      "title": "Team",
      "value": "No Team",
      "subtitle": "Your team",
      "change": "No team assignment",
      "changeType": "neutral"
    },
    {
      "id": 3,
      "title": "Next Deadline",
      "value": "None",
      "subtitle": "Active project",
      "change": "No deadline set",
      "changeType": "neutral"
    },
    {
      "id": 4,
      "title": "Progress",
      "value": "0%",
      "subtitle": "Current project",
      "change": "Same as last month",
      "changeType": "neutral"
    }
  ]
}
```

---

## 4. ACCOUNTS DEPARTMENT

### 4.1 Accountant

#### Scenario 1: Positive Changes
```json
{
  "department": "Accounts",
  "role": "accountant",
  "cards": [
    {
      "id": 1,
      "title": "Profit",
      "value": "$450.5K",
      "subtitle": "All time",
      "change": "+$25.3K from last month",
      "changeType": "positive"
    },
    {
      "id": 2,
      "title": "Expense",
      "value": "$85.2K",
      "subtitle": "This month",
      "change": "-$5.1K from last month",
      "changeType": "positive"
    },
    {
      "id": 3,
      "title": "Cash Flow",
      "value": "$42.8K",
      "subtitle": "This month",
      "change": "+$12.5K from last month",
      "changeType": "positive"
    },
    {
      "id": 4,
      "title": "Revenue",
      "value": "$128.0K",
      "subtitle": "This month",
      "change": "+$7.4K from last month",
      "changeType": "positive"
    }
  ]
}
```

#### Scenario 2: Negative Changes
```json
{
  "department": "Accounts",
  "role": "accountant",
  "cards": [
    {
      "id": 1,
      "title": "Profit",
      "value": "$425.2K",
      "subtitle": "All time",
      "change": "-$15.8K from last month",
      "changeType": "negative"
    },
    {
      "id": 2,
      "title": "Expense",
      "value": "$95.5K",
      "subtitle": "This month",
      "change": "+$12.3K from last month",
      "changeType": "negative"
    },
    {
      "id": 3,
      "title": "Cash Flow",
      "value": "$28.2K",
      "subtitle": "This month",
      "change": "-$8.5K from last month",
      "changeType": "negative"
    },
    {
      "id": 4,
      "title": "Revenue",
      "value": "$115.3K",
      "subtitle": "This month",
      "change": "-$5.2K from last month",
      "changeType": "negative"
    }
  ]
}
```

#### Scenario 3: Mixed Changes
```json
{
  "department": "Accounts",
  "role": "accountant",
  "cards": [
    {
      "id": 1,
      "title": "Profit",
      "value": "$438.5K",
      "subtitle": "All time",
      "change": "+$8.2K from last month",
      "changeType": "positive"
    },
    {
      "id": 2,
      "title": "Expense",
      "value": "$88.5K",
      "subtitle": "This month",
      "change": "+$2.1K from last month",
      "changeType": "negative"
    },
    {
      "id": 3,
      "title": "Cash Flow",
      "value": "$35.2K",
      "subtitle": "This month",
      "change": "Same as last month",
      "changeType": "neutral"
    },
    {
      "id": 4,
      "title": "Revenue",
      "value": "$123.7K",
      "subtitle": "This month",
      "change": "+$3.1K from last month",
      "changeType": "positive"
    }
  ]
}
```

#### Scenario 4: Large Values
```json
{
  "department": "Accounts",
  "role": "accountant",
  "cards": [
    {
      "id": 1,
      "title": "Profit",
      "value": "$2.5M",
      "subtitle": "All time",
      "change": "+$125.3K from last month",
      "changeType": "positive"
    },
    {
      "id": 2,
      "title": "Expense",
      "value": "$485.2K",
      "subtitle": "This month",
      "change": "-$25.1K from last month",
      "changeType": "positive"
    },
    {
      "id": 3,
      "title": "Cash Flow",
      "value": "$342.8K",
      "subtitle": "This month",
      "change": "+$112.5K from last month",
      "changeType": "positive"
    },
    {
      "id": 4,
      "title": "Revenue",
      "value": "$828.0K",
      "subtitle": "This month",
      "change": "+$87.4K from last month",
      "changeType": "positive"
    }
  ]
}
```

---

## Change Type Logic

### Positive ChangeType
- **Good metrics increasing**: Leads, Revenue, Projects, Attendance Rate, Profit, Cash Flow
- **Bad metrics decreasing**: Expenses, Pending Requests, On Leave

### Negative ChangeType
- **Good metrics decreasing**: Leads, Revenue, Projects, Attendance Rate, Profit, Cash Flow
- **Bad metrics increasing**: Expenses, Pending Requests, On Leave

### Neutral ChangeType
- **No change**: Current value equals previous value
- **No previous data**: Previous value is 0
- **Informational cards**: Team names, deadlines, top performers

---

## Value Formatting Rules

1. **Numbers:**
   - < 1,000: `"45"`
   - >= 1,000: `"1.5K"` or `"125.5K"`
   - >= 1,000,000: `"2.5M"`

2. **Currency:**
   - Same as numbers but with `$` prefix: `"$45"`, `"$1.5K"`, `"$2.5M"`

3. **Percentages:**
   - Always includes `%`: `"32.50%"`

4. **Dates:**
   - Format: `"Dec 15, 2024"` or `"None"` if no deadline

5. **Text:**
   - Team names, employee names, etc. as-is

---

## Summary of All Roles

### Sales Department (4 roles)
1. **dep_manager** - All leads from all units
2. **unit_head** - All leads from their unit
3. **team_lead** - Leads from their unit + team members
4. **salesperson** (or any other) - Only their assigned leads

### HR Department (Any role)
- All HR roles see the same cards (no role-based filtering)

### Production Department (5 roles)
1. **dep_manager** - All projects from all units
2. **unit_head** - All projects in their unit
3. **team_lead** - Projects assigned to their team
4. **senior** - Projects assigned to them
5. **junior** - Projects assigned to them

### Accounts Department (1 role)
1. **accountant** - All financial metrics

---

**Document Version:** 2.0  
**Last Updated:** December 2024  
**Status:** ✅ Complete with all improvements

