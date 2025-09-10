# Campaign Management API Documentation

## Overview
This document provides comprehensive documentation for the Campaign Management APIs. These APIs allow Marketing department users to create, read, update, and delete marketing campaigns with advanced filtering and role-based access control.

## Table of Contents
1. [Authentication & Authorization](#authentication--authorization)
2. [API Endpoints](#api-endpoints)
3. [Data Models](#data-models)
4. [Filtering & Pagination](#filtering--pagination)
5. [Error Handling](#error-handling)
6. [Examples](#examples)

## Authentication & Authorization

### Required Guards
- **JWT Authentication**: All endpoints require valid JWT token
- **Department Guard**: Only Marketing department employees can access campaign APIs

### Access Control
- **Marketing Department Only**: All campaign operations are restricted to Marketing department
- **Role-based**: Uses existing JWT authentication system

## API Endpoints

### Base URL: `/campaigns`

### 1. Create Campaign
**POST** `/campaigns`

Creates a new marketing campaign.

**Request Body:**
```json
{
  "campaignName": "Summer Sale 2024",
  "campaignType": "Digital Marketing",
  "startDate": "2024-06-01",
  "endDate": "2024-08-31",
  "status": "Planned",
  "budget": 50000.00,
  "actualCost": 0,
  "unitId": 1,
  "description": "Summer promotion campaign for increased sales",
  "productionUnitId": 2
}
```

**Response:**
```json
{
  "id": 1,
  "campaignName": "Summer Sale 2024",
  "campaignType": "Digital Marketing",
  "startDate": "2024-06-01T00:00:00.000Z",
  "endDate": "2024-08-31T00:00:00.000Z",
  "status": "Planned",
  "budget": 50000.00,
  "actualCost": 0,
  "unitId": 1,
  "description": "Summer promotion campaign for increased sales",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z",
  "productionUnitId": 2,
  "marketingUnit": {
    "id": 1,
    "name": "Digital Marketing Unit"
  },
  "productionUnit": {
    "id": 2,
    "name": "Content Production Unit"
  }
}
```

### 2. Get All Campaigns
**GET** `/campaigns`

Retrieves all campaigns with filtering, sorting, and pagination.

**Query Parameters:**
- `search` (string): Search in campaign name, type, or description
- `status` (enum): Filter by campaign status (Planned, Running, Completed, Cancelled)
- `campaignType` (string): Filter by campaign type
- `unitId` (number): Filter by marketing unit ID
- `productionUnitId` (number): Filter by production unit ID
- `startDateFrom` (date): Filter campaigns starting from this date
- `startDateTo` (date): Filter campaigns starting until this date
- `endDateFrom` (date): Filter campaigns ending from this date
- `endDateTo` (date): Filter campaigns ending until this date
- `minBudget` (number): Filter by minimum budget
- `maxBudget` (number): Filter by maximum budget
- `sortBy` (string): Sort field (campaignName, campaignType, startDate, endDate, status, budget, actualCost, createdAt, updatedAt)
- `sortOrder` (string): Sort order (asc, desc)
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10)

**Example Request:**
```
GET /campaigns?status=Running&minBudget=10000&sortBy=startDate&sortOrder=asc&page=1&limit=20
```

**Response:**
```json
{
  "campaigns": [
    {
      "id": 1,
      "campaignName": "Summer Sale 2024",
      "campaignType": "Digital Marketing",
      "startDate": "2024-06-01T00:00:00.000Z",
      "endDate": "2024-08-31T00:00:00.000Z",
      "status": "Running",
      "budget": 50000.00,
      "actualCost": 25000.00,
      "unitId": 1,
      "description": "Summer promotion campaign",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z",
      "productionUnitId": 2,
      "marketingUnit": {
        "id": 1,
        "name": "Digital Marketing Unit"
      },
      "productionUnit": {
        "id": 2,
        "name": "Content Production Unit"
      }
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 20,
  "totalPages": 1
}
```

### 3. Get Campaign by ID
**GET** `/campaigns/:id`

Retrieves a specific campaign by its ID.

**Response:**
```json
{
  "id": 1,
  "campaignName": "Summer Sale 2024",
  "campaignType": "Digital Marketing",
  "startDate": "2024-06-01T00:00:00.000Z",
  "endDate": "2024-08-31T00:00:00.000Z",
  "status": "Running",
  "budget": 50000.00,
  "actualCost": 25000.00,
  "unitId": 1,
  "description": "Summer promotion campaign",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z",
  "productionUnitId": 2,
  "marketingUnit": {
    "id": 1,
    "name": "Digital Marketing Unit"
  },
  "productionUnit": {
    "id": 2,
    "name": "Content Production Unit"
  }
}
```

### 4. Update Campaign
**PATCH** `/campaigns/:id`

Updates an existing campaign. All fields are optional.

**Request Body:**
```json
{
  "status": "Running",
  "actualCost": 30000.00,
  "description": "Updated campaign description"
}
```

**Response:**
```json
{
  "id": 1,
  "campaignName": "Summer Sale 2024",
  "campaignType": "Digital Marketing",
  "startDate": "2024-06-01T00:00:00.000Z",
  "endDate": "2024-08-31T00:00:00.000Z",
  "status": "Running",
  "budget": 50000.00,
  "actualCost": 30000.00,
  "unitId": 1,
  "description": "Updated campaign description",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T11:00:00.000Z",
  "productionUnitId": 2,
  "marketingUnit": {
    "id": 1,
    "name": "Digital Marketing Unit"
  },
  "productionUnit": {
    "id": 2,
    "name": "Content Production Unit"
  }
}
```

### 5. Delete Campaign
**DELETE** `/campaigns/:id`

Deletes a campaign permanently.

**Response:**
```json
{
  "message": "Campaign \"Summer Sale 2024\" deleted successfully"
}
```

### 6. Get Campaign Statistics
**GET** `/campaigns/stats`

Retrieves campaign statistics and analytics.

**Response:**
```json
{
  "totalCampaigns": 25,
  "activeCampaigns": 8,
  "completedCampaigns": 15,
  "totalBudget": 1250000.00,
  "totalActualCost": 850000.00,
  "campaignsByStatus": [
    {
      "status": "Planned",
      "count": 5
    },
    {
      "status": "Running",
      "count": 8
    },
    {
      "status": "Completed",
      "count": 15
    },
    {
      "status": "Cancelled",
      "count": 2
    }
  ],
  "campaignsByType": [
    {
      "type": "Digital Marketing",
      "count": 12
    },
    {
      "type": "Social Media",
      "count": 8
    },
    {
      "type": "Email Marketing",
      "count": 5
    }
  ]
}
```

## Data Models

### CampaignLog (Database Model)
```typescript
{
  id: number;
  campaignName: string;
  campaignType: string;
  startDate: Date;
  endDate: Date;
  status: CampaignStatus;
  budget: number;
  actualCost?: number;
  unitId: number;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  productionUnitId?: number;
  marketingUnit: MarketingUnit;
  ProductionUnit?: ProductionUnit;
}
```

### CampaignStatus Enum
```typescript
enum CampaignStatus {
  Planned = "Planned",
  Running = "Running",
  Completed = "Completed",
  Cancelled = "Cancelled"
}
```

## Filtering & Pagination

### Search Functionality
- **Text Search**: Searches across campaign name, type, and description
- **Case Insensitive**: Search is case-insensitive
- **Partial Matching**: Supports partial string matching

### Date Range Filtering
- **Start Date Range**: Filter campaigns by start date range
- **End Date Range**: Filter campaigns by end date range
- **Date Format**: ISO 8601 date format (YYYY-MM-DD)

### Budget Filtering
- **Minimum Budget**: Filter campaigns with budget >= specified amount
- **Maximum Budget**: Filter campaigns with budget <= specified amount
- **Range Filtering**: Combine min and max for budget range

### Sorting Options
- **Sort Fields**: campaignName, campaignType, startDate, endDate, status, budget, actualCost, createdAt, updatedAt
- **Sort Order**: asc (ascending) or desc (descending)
- **Default**: Sorted by createdAt in descending order

### Pagination
- **Page**: Page number (starts from 1)
- **Limit**: Number of items per page (default: 10)
- **Total Pages**: Calculated based on total items and limit

## Error Handling

### Common Error Responses

#### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": "End date must be after start date",
  "error": "Bad Request"
}
```

#### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

#### 403 Forbidden
```json
{
  "statusCode": 403,
  "message": "Access denied. Only Marketing department can manage campaigns.",
  "error": "Forbidden"
}
```

#### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "Campaign with ID 999 not found",
  "error": "Not Found"
}
```

#### 422 Unprocessable Entity
```json
{
  "statusCode": 422,
  "message": [
    "Campaign name must be at least 2 characters long",
    "Budget must be a positive number"
  ],
  "error": "Unprocessable Entity"
}
```

## Examples

### Example 1: Create a Digital Marketing Campaign
```bash
curl -X POST http://localhost:3000/campaigns \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "campaignName": "Black Friday 2024",
    "campaignType": "Digital Marketing",
    "startDate": "2024-11-01",
    "endDate": "2024-11-30",
    "status": "Planned",
    "budget": 75000.00,
    "unitId": 1,
    "description": "Black Friday promotional campaign"
  }'
```

### Example 2: Get Running Campaigns with Budget Filter
```bash
curl -X GET "http://localhost:3000/campaigns?status=Running&minBudget=10000&sortBy=budget&sortOrder=desc" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Example 3: Update Campaign Status
```bash
curl -X PATCH http://localhost:3000/campaigns/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "status": "Running",
    "actualCost": 15000.00
  }'
```

### Example 4: Get Campaign Statistics
```bash
curl -X GET http://localhost:3000/campaigns/stats \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Notes

1. **Department Restriction**: Only Marketing department employees can access these APIs
2. **Date Validation**: End date must be after start date
3. **Budget Validation**: Budget and actual cost must be positive numbers
4. **Unit Validation**: Marketing unit must exist, production unit is optional
5. **Soft Delete**: Currently implements hard delete - consider implementing soft delete for production
6. **Audit Trail**: All operations are logged with user information
7. **Performance**: Large datasets are handled with pagination to ensure good performance

## Database Schema

The campaign system uses the existing `CampaignLog` model in the Prisma schema:

```prisma
model CampaignLog {
  id               Int             @id @default(autoincrement()) @map("campaign_id")
  campaignName     String          @map("campaign_name") @db.VarChar(255)
  campaignType     String          @map("campaign_type") @db.VarChar(255)
  startDate        DateTime        @map("start_date") @db.Date
  endDate          DateTime        @map("end_date") @db.Date
  status           CampaignStatus  @map("status")
  budget           Decimal         @db.Decimal(12, 2)
  actualCost       Decimal?        @map("actual_cost") @db.Decimal(12, 2)
  unitId           Int             @map("unit_id")
  description      String?
  createdAt        DateTime        @default(now()) @map("created_at")
  updatedAt        DateTime        @updatedAt @map("updated_at")
  productionUnitId Int?
  ProductionUnit   ProductionUnit? @relation(fields: [productionUnitId], references: [id])
  marketingUnit    MarketingUnit   @relation(fields: [unitId], references: [id])

  @@map("campaign_logs")
}
```
