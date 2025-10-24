# Admin Requests Statistics API Documentation

## Overview

This document describes the Admin Requests Statistics API endpoint that provides comprehensive statistics and analytics for admin requests in the HR module.

## Endpoint Details

### Get Admin Request Statistics

**Endpoint:** `GET /hr/admin-requests/stats`

**Authentication:** Required (JWT Bearer Token)

**Authorization:**
- Department: HR only
- Guards: JwtAuthGuard, RolesGuard, DepartmentsGuard, PermissionsGuard

**Description:** Retrieves comprehensive statistics about all admin requests including counts, status breakdown, type distribution, approval rates, and top contributors.

---

## Request

### Headers

```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

### Query Parameters

None required.

---

## Response

### Success Response (200 OK)

```json
{
  "status": "success",
  "message": "Admin request statistics retrieved successfully",
  "data": {
    "total": 150,
    "active": 25,
    "completed": 125,
    "byStatus": {
      "pending": {
        "count": 25,
        "percentage": 16.67
      },
      "approved": {
        "count": 95,
        "percentage": 63.33
      },
      "declined": {
        "count": 30,
        "percentage": 20.00
      }
    },
    "byType": {
      "salary_increase": {
        "count": 80,
        "percentage": 53.33
      },
      "late_approval": {
        "count": 50,
        "percentage": 33.33
      },
      "others": {
        "count": 20,
        "percentage": 13.33
      }
    },
    "approvalRate": {
      "approved": 95,
      "declined": 30,
      "approvalPercentage": 76.00,
      "declinePercentage": 24.00
    },
    "thisMonth": {
      "new": 12,
      "approved": 8,
      "declined": 2,
      "pending": 2
    },
    "topContributors": [
      {
        "hrId": 5,
        "hrEmployeeId": 15,
        "requestCount": 25
      },
      {
        "hrId": 3,
        "hrEmployeeId": 10,
        "requestCount": 18
      },
      {
        "hrId": 7,
        "hrEmployeeId": 22,
        "requestCount": 15
      }
    ]
  }
}
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `status` | string | Response status ("success" or "error") |
| `message` | string | Descriptive message about the response |
| `data` | object | Container for statistics data |

#### Data Object Fields

| Field | Type | Description |
|-------|------|-------------|
| `total` | number | Total number of admin requests (all time) |
| `active` | number | Number of requests with "pending" status |
| `completed` | number | Number of requests with "approved" or "declined" status |
| `byStatus` | object | Breakdown of requests by status |
| `byType` | object | Breakdown of requests by type |
| `approvalRate` | object | Approval and decline statistics |
| `thisMonth` | object | Statistics for the current month |
| `topContributors` | array | Top 5 HR employees by number of requests |

#### byStatus Object

```json
{
  "pending": {
    "count": 25,
    "percentage": 16.67
  },
  "approved": {
    "count": 95,
    "percentage": 63.33
  },
  "declined": {
    "count": 30,
    "percentage": 20.00
  }
}
```

- **count**: Number of requests with this status
- **percentage**: Percentage of total requests (rounded to 2 decimal places)

#### byType Object

```json
{
  "salary_increase": {
    "count": 80,
    "percentage": 53.33
  },
  "late_approval": {
    "count": 50,
    "percentage": 33.33
  },
  "others": {
    "count": 20,
    "percentage": 13.33
  }
}
```

**Request Types:**
- `salary_increase`: Requests for salary increases
- `late_approval`: Requests for late attendance approvals
- `others`: Other miscellaneous requests

#### approvalRate Object

```json
{
  "approved": 95,
  "declined": 30,
  "approvalPercentage": 76.00,
  "declinePercentage": 24.00
}
```

- **approved**: Total number of approved requests
- **declined**: Total number of declined requests
- **approvalPercentage**: Percentage of approved requests among completed requests
- **declinePercentage**: Percentage of declined requests among completed requests

#### thisMonth Object

```json
{
  "new": 12,
  "approved": 8,
  "declined": 2,
  "pending": 2
}
```

- **new**: Total requests created this month
- **approved**: Requests approved this month
- **declined**: Requests declined this month
- **pending**: Requests still pending from this month

#### topContributors Array

```json
[
  {
    "hrId": 5,
    "hrEmployeeId": 15,
    "requestCount": 25
  }
]
```

Returns top 5 HR employees who have submitted the most admin requests.

- **hrId**: HR record ID
- **hrEmployeeId**: Employee ID of the HR person
- **requestCount**: Number of requests submitted

---

### Error Responses

#### 401 Unauthorized

```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

**Cause:** Invalid or missing JWT token

#### 403 Forbidden

```json
{
  "statusCode": 403,
  "message": "Forbidden resource",
  "error": "Forbidden"
}
```

**Cause:** User is not in the HR department

#### 400 Bad Request

```json
{
  "statusCode": 400,
  "message": "Failed to retrieve admin request statistics: [error details]",
  "error": "Bad Request"
}
```

**Cause:** Database or server error while retrieving statistics

---

## Usage Examples

### cURL

```bash
curl -X GET \
  'http://localhost:3000/hr/admin-requests/stats' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' \
  -H 'Content-Type: application/json'
```

### JavaScript (Fetch API)

```javascript
const getAdminRequestStats = async () => {
  try {
    const response = await fetch('http://localhost:3000/hr/admin-requests/stats', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    
    if (data.status === 'success') {
      console.log('Total Requests:', data.data.total);
      console.log('Active Requests:', data.data.active);
      console.log('Approval Rate:', data.data.approvalRate.approvalPercentage + '%');
      console.log('Top Contributors:', data.data.topContributors);
    }
  } catch (error) {
    console.error('Error fetching stats:', error);
  }
};
```

### Axios

```javascript
import axios from 'axios';

const getAdminRequestStats = async () => {
  try {
    const response = await axios.get('http://localhost:3000/hr/admin-requests/stats', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const stats = response.data.data;
    return stats;
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
    throw error;
  }
};
```

### TypeScript Example with Interface

```typescript
interface AdminRequestStats {
  total: number;
  active: number;
  completed: number;
  byStatus: {
    pending: { count: number; percentage: number };
    approved: { count: number; percentage: number };
    declined: { count: number; percentage: number };
  };
  byType: {
    salary_increase: { count: number; percentage: number };
    late_approval: { count: number; percentage: number };
    others: { count: number; percentage: number };
  };
  approvalRate: {
    approved: number;
    declined: number;
    approvalPercentage: number;
    declinePercentage: number;
  };
  thisMonth: {
    new: number;
    approved: number;
    declined: number;
    pending: number;
  };
  topContributors: Array<{
    hrId: number;
    hrEmployeeId: number;
    requestCount: number;
  }>;
}

interface ApiResponse {
  status: string;
  message: string;
  data: AdminRequestStats;
}

const fetchStats = async (): Promise<AdminRequestStats> => {
  const response = await fetch('http://localhost:3000/hr/admin-requests/stats', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  const result: ApiResponse = await response.json();
  return result.data;
};
```

---

## Frontend Integration Guide

### React Component Example

```jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AdminRequestStatsCard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const response = await axios.get(
          'http://localhost:3000/hr/admin-requests/stats',
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        
        setStats(response.data.data);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) return <div>Loading statistics...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!stats) return null;

  return (
    <div className="stats-container">
      <h2>Admin Requests Overview</h2>
      
      <div className="stat-cards">
        <div className="stat-card">
          <h3>Total Requests</h3>
          <p className="stat-value">{stats.total}</p>
        </div>
        
        <div className="stat-card">
          <h3>Active</h3>
          <p className="stat-value">{stats.active}</p>
        </div>
        
        <div className="stat-card">
          <h3>Completed</h3>
          <p className="stat-value">{stats.completed}</p>
        </div>
        
        <div className="stat-card">
          <h3>Approval Rate</h3>
          <p className="stat-value">{stats.approvalRate.approvalPercentage}%</p>
        </div>
      </div>

      <div className="charts">
        <div className="chart-section">
          <h3>Status Distribution</h3>
          <ul>
            <li>Pending: {stats.byStatus.pending.count} ({stats.byStatus.pending.percentage}%)</li>
            <li>Approved: {stats.byStatus.approved.count} ({stats.byStatus.approved.percentage}%)</li>
            <li>Declined: {stats.byStatus.declined.count} ({stats.byStatus.declined.percentage}%)</li>
          </ul>
        </div>

        <div className="chart-section">
          <h3>Request Types</h3>
          <ul>
            <li>Salary Increase: {stats.byType.salary_increase.count}</li>
            <li>Late Approval: {stats.byType.late_approval.count}</li>
            <li>Others: {stats.byType.others.count}</li>
          </ul>
        </div>
      </div>

      <div className="top-contributors">
        <h3>Top Contributors</h3>
        <table>
          <thead>
            <tr>
              <th>HR ID</th>
              <th>Employee ID</th>
              <th>Requests</th>
            </tr>
          </thead>
          <tbody>
            {stats.topContributors.map(contributor => (
              <tr key={contributor.hrId}>
                <td>{contributor.hrId}</td>
                <td>{contributor.hrEmployeeId}</td>
                <td>{contributor.requestCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="this-month">
        <h3>This Month</h3>
        <ul>
          <li>New: {stats.thisMonth.new}</li>
          <li>Approved: {stats.thisMonth.approved}</li>
          <li>Declined: {stats.thisMonth.declined}</li>
          <li>Pending: {stats.thisMonth.pending}</li>
        </ul>
      </div>
    </div>
  );
};

export default AdminRequestStatsCard;
```

---

## Notes

1. **Performance**: The endpoint calculates statistics in-memory for all requests. For large datasets (10,000+ requests), consider implementing caching or periodic pre-calculation.

2. **Permissions**: Only HR department employees can access this endpoint. Admin users need to be part of the HR department to view these statistics.

3. **Date Handling**: "This month" statistics are calculated based on server time (UTC). Ensure timezone handling if frontend displays dates in local timezone.

4. **Empty Data**: If no requests exist in the database, the endpoint returns zero values gracefully instead of errors.

5. **Percentages**: All percentages are rounded to 2 decimal places for display purposes.

6. **Top Contributors**: Limited to top 5 contributors. If fewer than 5 HR employees have submitted requests, the array will contain fewer elements.

---

## Related Endpoints

- `GET /hr/admin-requests` - Get all admin requests
- `GET /hr/admin-requests/:id` - Get specific admin request
- `POST /hr/admin-requests` - Create new admin request
- `GET /hr/admin-requests/my-requests` - Get requests by HR ID
- `GET /hr/admin-requests/status/:status` - Get requests by status

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-10-17 | Initial release of admin requests stats API |

---

## Support

For issues or questions about this API, please contact the development team or create an issue in the project repository.

