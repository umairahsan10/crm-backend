# HR Logs Stats Frontend Integration Example

## API Endpoint
```typescript
GET /hr/logs/stats
```

## Frontend Implementation

### 1. TypeScript Interface
```typescript
export interface HrLogsStatsResponseDto {
  totalLogs: number;
  todayLogs: number;
  thisWeekLogs: number;
  thisMonthLogs: number;
}
```

### 2. API Function
```typescript
import { apiGetJson } from '../utils/apiClient';

export const getHrLogsStatsApi = async (): Promise<HrLogsStatsResponseDto> => {
  try {
    const response = await apiGetJson<HrLogsStatsResponseDto>('/hr/logs/stats');
    return response;
  } catch (error: any) {
    console.error('Get HR logs stats API error:', error);
    throw new Error('Failed to fetch HR logs statistics');
  }
};
```

### 3. React Component Example
```typescript
import React, { useState, useEffect } from 'react';
import { getHrLogsStatsApi, HrLogsStatsResponseDto } from '../api/hr-logs-stats';

const HrLogsStatsCard: React.FC = () => {
  const [stats, setStats] = useState<HrLogsStatsResponseDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const data = await getHrLogsStatsApi();
        setStats(data);
        setError(null);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return <div className="flex justify-center p-4">Loading stats...</div>;
  }

  if (error) {
    return <div className="text-red-500 p-4">Error: {error}</div>;
  }

  if (!stats) {
    return <div className="p-4">No stats available</div>;
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-700">Total Logs</h3>
        <p className="text-3xl font-bold text-blue-600">{stats.totalLogs}</p>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-700">Today</h3>
        <p className="text-3xl font-bold text-green-600">{stats.todayLogs}</p>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-700">This Week</h3>
        <p className="text-3xl font-bold text-yellow-600">{stats.thisWeekLogs}</p>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-700">This Month</h3>
        <p className="text-3xl font-bold text-purple-600">{stats.thisMonthLogs}</p>
      </div>
    </div>
  );
};

export default HrLogsStatsCard;
```

### 4. Usage in Dashboard
```typescript
import HrLogsStatsCard from './components/HrLogsStatsCard';

const HrDashboard: React.FC = () => {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">HR Dashboard</h1>
      
      {/* HR Logs Statistics */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">HR Activity Statistics</h2>
        <HrLogsStatsCard />
      </div>
      
      {/* Other dashboard components */}
    </div>
  );
};
```

## Sample Response
```json
{
  "totalLogs": 23,
  "todayLogs": 1,
  "thisWeekLogs": 5,
  "thisMonthLogs": 12
}
```

## Error Handling
- **401 Unauthorized**: User not authenticated
- **403 Forbidden**: User doesn't have manager role or HR department access
- **500 Internal Server Error**: Server error

## Notes
- Statistics are calculated in real-time
- All time calculations use UTC timezone
- Requires manager-level permissions
- Perfect for dashboard widgets and activity monitoring
