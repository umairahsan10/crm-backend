# Metric Grid API - Example Responses

## Endpoint
`GET /dashboard/metric-grid`

## Authentication
Requires JWT Bearer token in Authorization header.

---

## 1. Sales Department

### Sales - Department Manager (dep_manager)
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

### Sales - Unit Head (unit_head)
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

### Sales - Team Lead (team_lead)
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

### Sales - Salesperson (salesperson)
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

---

## 2. HR Department

### HR - Any Role
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

---

## 3. Production Department

### Production - Department Manager (dep_manager)
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
      "change": "Total units",
      "changeType": "neutral"
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
      "change": "Top performer",
      "changeType": "neutral"
    }
  ]
}
```

### Production - Unit Head (unit_head)
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
      "change": "Team count",
      "changeType": "neutral"
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
      "change": "Top performer",
      "changeType": "neutral"
    }
  ]
}
```

### Production - Team Lead (team_lead)
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
      "change": "6 members",
      "changeType": "neutral"
    },
    {
      "id": 3,
      "title": "Next Deadline",
      "value": "Dec 15, 2024",
      "subtitle": "Active project",
      "change": "Upcoming",
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

### Production - Senior/Junior Developer (senior/junior)
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
      "change": "Assigned",
      "changeType": "neutral"
    },
    {
      "id": 3,
      "title": "Next Deadline",
      "value": "Dec 20, 2024",
      "subtitle": "Active project",
      "change": "Upcoming",
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

---

## 4. Accounts Department

### Accountant
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

---

## Notes

1. **Change Field**: Shows the difference from the previous month. Format varies:
   - Numbers: `"+5 from last month"` or `"-3 from last month"`
   - Percentages: `"+2.5% from last month"`
   - Currency: `"+$15.2K from last month"` or `"-$5.1K from last month"`
   - Special cases: `"No change"`, `"Upcoming"`, `"Top performer"`, etc.

2. **ChangeType Field**: 
   - `"positive"`: Good change (increase in good metrics, decrease in bad metrics)
   - `"negative"`: Bad change (decrease in good metrics, increase in bad metrics)
   - `"neutral"`: No meaningful change or informational only

3. **Value Formatting**:
   - Large numbers use K (thousands) or M (millions)
   - Currency values are prefixed with `$`
   - Percentages include `%` symbol
   - Dates are formatted as "MMM DD, YYYY"

4. **Subtitle**: Provides context about what the value represents

5. **All cards include change and changeType fields** for consistent UI rendering

