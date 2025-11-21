# 🏭 Industry Module

## Overview
The Industry Module manages industry data used throughout the CRM system for categorizing clients and cracked leads.

## Features

### ✅ Implemented Features
- ✅ **CRUD Operations**: Create, Read, Update, Delete (soft & hard)
- ✅ **Soft Delete**: Deactivate industries while preserving data
- ✅ **Dependency Checking**: Prevents deletion if industry is in use
- ✅ **Comprehensive Filtering**: Search, filter by status, sort, paginate
- ✅ **Statistics Dashboard**: Industry analytics and top performers
- ✅ **Active Industries Endpoint**: Optimized for dropdown menus
- ✅ **Role-Based Access Control**: Sales, Marketing, Admin access
- ✅ **Unique Name Validation**: Case-insensitive uniqueness
- ✅ **Audit Trail**: Automatic timestamps (createdAt, updatedAt)

## Module Structure

```
src/modules/industry/
├── dto/
│   ├── create-industry.dto.ts      # DTO for creating industry
│   ├── update-industry.dto.ts      # DTO for updating industry
│   ├── get-industries.dto.ts       # DTO for query parameters
│   └── industry-response.dto.ts    # Response DTOs
├── industry.controller.ts          # API endpoints
├── industry.service.ts             # Business logic
├── industry.module.ts              # Module definition
└── README.md                       # This file
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/industries` | Create new industry |
| `GET` | `/industries` | Get all industries with filters |
| `GET` | `/industries/active` | Get active industries (for dropdowns) |
| `GET` | `/industries/stats` | Get industry statistics |
| `GET` | `/industries/:id` | Get single industry |
| `PUT` | `/industries/:id` | Update industry |
| `PATCH` | `/industries/:id/deactivate` | Soft delete (deactivate) |
| `PATCH` | `/industries/:id/reactivate` | Reactivate industry |
| `DELETE` | `/industries/:id` | Hard delete (with dependency check) |

## Access Control

### View Access (GET endpoints)
- All Sales roles: `dep_manager`, `unit_head`, `team_lead`, `senior`, `junior`
- `marketing_manager`
- Active industries endpoint: All authenticated users

### Manage Access (POST, PUT, DELETE)
- All Sales department users
- All Marketing department users
- All Admin department users

## Database Schema

```prisma
model Industry {
  id           Int           @id @default(autoincrement()) @map("industry_id")
  name         String        @unique @db.VarChar(150)
  description  String?
  isActive     Boolean       @default(true) @map("is_active")
  createdAt    DateTime      @default(now()) @map("created_at")
  updatedAt    DateTime      @updatedAt @map("updated_at")
  
  clients      Client[]
  crackedLeads CrackedLead[]
  
  @@map("industries")
}
```

## Usage Examples

### Create Industry
```typescript
POST /industries
{
  "name": "Technology",
  "description": "Software and IT companies"
}
```

### Get Active Industries (for dropdowns)
```typescript
GET /industries/active
```

### Search and Filter
```typescript
GET /industries?search=tech&isActive=true&page=1&limit=10
```

### Soft Delete
```typescript
PATCH /industries/1/deactivate
```

### Get Statistics
```typescript
GET /industries/stats
```

## Business Rules

1. **Unique Names**: Industry names must be unique (case-insensitive)
2. **Soft Delete Preferred**: Use deactivate instead of hard delete
3. **Dependency Protection**: Cannot hard delete if clients/leads use the industry
4. **Active by Default**: New industries are created with `isActive = true`
5. **Dropdown Optimization**: Active endpoint returns only active industries

## Error Handling

- `409 Conflict`: Industry name already exists
- `404 Not Found`: Industry not found
- `400 Bad Request`: Validation errors or business rule violations
- `403 Forbidden`: Insufficient permissions

## Testing

Run the following tests:
```bash
# Unit tests (when implemented)
npm run test -- industry.service.spec.ts

# E2E tests (when implemented)
npm run test:e2e -- industry.e2e-spec.ts
```

## Documentation

- **Full API Documentation**: `/docs/INDUSTRY_API_DOCUMENTATION.md`
- **Postman Collection**: Can be generated if needed

## Related Modules

- **Client Module**: Uses industries for client categorization
- **Leads Module**: Uses industries when creating cracked leads

## Future Enhancements

Potential features for future implementation:
- [ ] Industry hierarchy (parent-child relationships)
- [ ] Industry-specific fields customization
- [ ] Bulk import/export of industries
- [ ] Industry merge functionality
- [ ] Industry usage analytics over time
- [ ] Industry templates for common use cases

## Support

For issues or questions:
1. Check the API documentation
2. Verify user permissions and department
3. Ensure industry names are unique
4. Use soft delete for safety

---

**Last Updated**: October 2025
**Version**: 1.0

