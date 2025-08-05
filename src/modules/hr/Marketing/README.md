# HR Marketing Department Management API Documentation

## Overview
The HR Marketing Department Management System provides comprehensive APIs for managing marketing records, including employee marketing data, campaign tracking, and marketing unit assignments. All endpoints require JWT authentication and appropriate permissions.

---

## Authentication & Authorization
- **Authentication**: JWT Bearer Token required for all endpoints
- **Authorization**: HR department access with `employee_add_permission`
- **Database Access**: All operations use Prisma ORM with PostgreSQL

---

## Core Marketing Department APIs

### 1. Get All Marketing Records
**Endpoint**: `GET /hr/marketing`  
**Method**: GET  
**Access**: HR (requires `employee_add_permission`)

#### Description
Retrieve all marketing records with related employee and marketing unit information. Results are ordered by creation date (newest first).

#### Sample Request
```bash
GET /hr/marketing
Authorization: Bearer <jwt-token>
```

#### Sample Response
```json
[
  {
    "id": 1,
    "employeeId": 123,
    "marketingUnitId": 1,
    "totalCampaignsRun": 25,
    "platformFocus": "Social Media",
    "createdAt": "2025-01-15T10:30:00.000Z",
    "updatedAt": "2025-01-15T10:30:00.000Z",
    "employee": {
      "id": 123,
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@company.com",
      "phone": "+1234567890",
      "status": "active",
      "department": {
        "id": 2,
        "name": "Marketing"
      },
      "role": {
        "id": 3,
        "name": "Marketing Specialist"
      }
    },
    "marketingUnit": {
      "id": 1,
      "name": "Digital Marketing",
      "leadQualityScore": 85.50,
      "head": {
        "id": 456,
        "firstName": "Jane",
        "lastName": "Smith",
        "email": "jane.smith@company.com"
      }
    }
  }
]
```

#### Tables Affected
- **Read**: `marketing`, `employees`, `departments`, `roles`, `marketing_units`

#### Error Responses
- `401`: Unauthorized access
- `403`: Insufficient permissions
- `500`: Internal server error

---

### 2. Get Marketing Record by ID
**Endpoint**: `GET /hr/marketing/:id`  
**Method**: GET  
**Access**: HR (requires `employee_add_permission`)

#### Description
Retrieve a specific marketing record by its ID with related employee and marketing unit information.

#### Path Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | Marketing record ID |

#### Sample Request
```bash
GET /hr/marketing/1
Authorization: Bearer <jwt-token>
```

#### Sample Response
```json
{
  "id": 1,
  "employeeId": 123,
  "marketingUnitId": 1,
  "totalCampaignsRun": 25,
  "platformFocus": "Social Media",
  "createdAt": "2025-01-15T10:30:00.000Z",
  "updatedAt": "2025-01-15T10:30:00.000Z",
  "employee": {
    "id": 123,
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@company.com",
    "phone": "+1234567890",
    "status": "active",
    "department": {
      "id": 2,
      "name": "Marketing"
    },
    "role": {
      "id": 3,
      "name": "Marketing Specialist"
    }
  },
  "marketingUnit": {
    "id": 1,
    "name": "Digital Marketing",
    "leadQualityScore": 85.50,
    "head": {
      "id": 456,
      "firstName": "Jane",
      "lastName": "Smith",
      "email": "jane.smith@company.com"
    }
  }
}
```

#### Error Responses
- `404`: Marketing record not found
- `401`: Unauthorized access
- `403`: Insufficient permissions
- `500`: Internal server error

---

### 3. Create Marketing Record
**Endpoint**: `POST /hr/marketing`  
**Method**: POST  
**Access**: HR (requires `employee_add_permission`)

#### Description
Create a new marketing record for an existing employee. Validates employee existence and prevents duplicate records.

#### Request Body
```json
{
  "employeeId": 123,
  "marketingUnitId": 1,
  "totalCampaignsRun": 25,
  "platformFocus": "Social Media"
}
```

#### Required Fields
- `employeeId` (integer): Employee ID (must exist)

#### Optional Fields
- `marketingUnitId` (integer): Associated marketing unit ID
- `totalCampaignsRun` (integer): Number of campaigns run
- `platformFocus` (string): Primary marketing platform focus

#### Validation Rules
- `employeeId`: Must reference an existing employee
- `totalCampaignsRun`: Must be non-negative
- `marketingUnitId`: Must reference an existing marketing unit (if provided)

#### Sample Response
```json
{
  "id": 1,
  "employeeId": 123,
  "marketingUnitId": 1,
  "totalCampaignsRun": 25,
  "platformFocus": "Social Media",
  "createdAt": "2025-01-15T10:30:00.000Z",
  "updatedAt": "2025-01-15T10:30:00.000Z",
  "employee": {
    "id": 123,
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@company.com",
    "phone": "+1234567890",
    "status": "active",
    "department": {
      "id": 2,
      "name": "Marketing"
    },
    "role": {
      "id": 3,
      "name": "Marketing Specialist"
    }
  },
  "marketingUnit": {
    "id": 1,
    "name": "Digital Marketing",
    "leadQualityScore": 85.50,
    "head": {
      "id": 456,
      "firstName": "Jane",
      "lastName": "Smith",
      "email": "jane.smith@company.com"
    }
  }
}
```

#### Tables Affected
- **Create**: `marketing`
- **Read**: `employees`, `marketing_units`

#### Error Responses
- `400`: Employee doesn't exist, duplicate record, validation errors
- `401`: Unauthorized access
- `403`: Insufficient permissions
- `500`: Internal server error

---

### 4. Update Marketing Record
**Endpoint**: `PUT /hr/marketing/:id`  
**Method**: PUT  
**Access**: HR (requires `employee_add_permission`)

#### Description
Update an existing marketing record. All fields are optional for partial updates.

#### Path Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | Marketing record ID |

#### Request Body
```json
{
  "totalCampaignsRun": 30,
  "platformFocus": "Content Marketing"
}
```

#### Optional Fields
All fields from the create endpoint are optional for updates.

#### Sample Response
```json
{
  "id": 1,
  "employeeId": 123,
  "marketingUnitId": 1,
  "totalCampaignsRun": 30,
  "platformFocus": "Content Marketing",
  "createdAt": "2025-01-15T10:30:00.000Z",
  "updatedAt": "2025-01-15T11:45:00.000Z",
  "employee": {
    "id": 123,
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@company.com",
    "phone": "+1234567890",
    "status": "active",
    "department": {
      "id": 2,
      "name": "Marketing"
    },
    "role": {
      "id": 3,
      "name": "Marketing Specialist"
    }
  },
  "marketingUnit": {
    "id": 1,
    "name": "Digital Marketing",
    "leadQualityScore": 85.50,
    "head": {
      "id": 456,
      "firstName": "Jane",
      "lastName": "Smith",
      "email": "jane.smith@company.com"
    }
  }
}
```

#### Tables Affected
- **Update**: `marketing`
- **Read**: `employees`, `marketing_units`

#### Error Responses
- `404`: Marketing record not found
- `400`: Employee no longer exists, validation errors
- `401`: Unauthorized access
- `403`: Insufficient permissions
- `500`: Internal server error

---

### 5. Delete Marketing Record
**Endpoint**: `DELETE /hr/marketing/:id`  
**Method**: DELETE  
**Access**: HR (requires `employee_add_permission`)

#### Description
Delete a marketing record and perform cascading updates to related tables. Sets `headId` in marketing units and `team_lead_id` in teams to null if the employee was a head or team lead.

#### Path Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | Marketing record ID |

#### Sample Request
```bash
DELETE /hr/marketing/1
Authorization: Bearer <jwt-token>
```

#### Sample Response
```json
{
  "message": "Marketing record for employee John Doe (ID: 123) has been successfully deleted.",
  "deletedRecord": {
    "id": 1,
    "employeeId": 123,
    "employeeName": "John Doe",
    "employeeEmail": "john.doe@company.com"
  }
}
```

#### Tables Affected
- **Delete**: `marketing`
- **Update**: `marketing_units` (headId → null), `teams` (team_lead_id → null)
- **Read**: `employees`

#### Error Responses
- `404`: Marketing record not found
- `400`: Employee no longer exists
- `401`: Unauthorized access
- `403`: Insufficient permissions
- `500`: Internal server error

---

## Data Models

### Marketing Record
```typescript
interface Marketing {
  id: number;
  employeeId: number;
  marketingUnitId?: number;
  totalCampaignsRun?: number;
  platformFocus?: string;
  createdAt: Date;
  updatedAt: Date;
  employee: Employee;
  marketingUnit?: MarketingUnit;
}
```

### Employee (Related)
```typescript
interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  status: string;
  department: Department;
  role: Role;
}
```

### Marketing Unit (Related)
```typescript
interface MarketingUnit {
  id: number;
  name: string;
  leadQualityScore?: number;
  head?: Employee;
}
```

---

## Business Rules

### Employee Validation
- Marketing records can only be created for existing employees
- Updates and deletions validate that the associated employee still exists
- Prevents orphaned records in the database

### Duplicate Prevention
- Only one marketing record per employee
- Attempting to create a duplicate record returns an error

### Cascading Updates
- When deleting a marketing record:
  - Sets `headId` to null in `marketing_units` table if employee was a head
  - Sets `team_lead_id` to null in `teams` table if employee was a team lead

### Data Integrity
- All numeric values must be non-negative
- Foreign key relationships are maintained
- Marketing unit references are validated

---

## Error Handling

### Common Error Codes
- `400 Bad Request`: Validation errors, employee doesn't exist, duplicate records
- `401 Unauthorized`: Missing or invalid JWT token
- `403 Forbidden`: Insufficient permissions or wrong department
- `404 Not Found`: Marketing record not found
- `500 Internal Server Error`: Database or server errors

### Error Response Format
```json
{
  "statusCode": 400,
  "message": "Employee with ID 999 does not exist. Marketing records can only be created for existing employees.",
  "error": "Bad Request"
}
```

---

## Security Considerations

### Authentication
- All endpoints require valid JWT authentication
- Tokens must be included in Authorization header

### Authorization
- HR department access required
- `employee_add_permission` required for all operations
- Role-based access control enforced

### Data Protection
- Input validation on all fields
- SQL injection prevention through Prisma ORM
- Proper error handling without exposing sensitive information

---

## Module Structure

```
src/modules/hr/Marketing/
├── controllers/
│   └── marketing.controller.ts    # API endpoints
├── services/
│   └── marketing.service.ts       # Business logic
├── dto/
│   └── marketing.dto.ts           # Data transfer objects
├── marketing.module.ts            # Module configuration
└── README.md                      # This documentation
```

---

## Dependencies

### Internal Dependencies
- `PrismaService`: Database operations
- `JwtAuthGuard`: Authentication
- `RolesGuard`: Role-based access control
- `DepartmentsGuard`: Department-based access control
- `PermissionsGuard`: Permission-based access control

### External Dependencies
- `@nestjs/common`: NestJS framework
- `class-validator`: Input validation
- `class-transformer`: Data transformation
- `@prisma/client`: Database client

---

## Development Notes

### Adding New Features
1. Update DTOs in `dto/marketing.dto.ts`
2. Add service methods in `services/marketing.service.ts`
3. Add controller endpoints in `controllers/marketing.controller.ts`
4. Update this documentation

### Testing
- All endpoints should be tested with valid and invalid data
- Test employee existence validation
- Test duplicate record prevention
- Test cascading updates on deletion

### Performance Considerations
- Database queries include necessary relations
- Proper indexing on frequently queried fields
- Transaction usage for multi-table operations

---

## Marketing-Specific Features

### Campaign Tracking
- Track total campaigns run by each marketing employee
- Monitor campaign performance and effectiveness
- Link campaigns to specific marketing units

### Platform Focus
- Record primary marketing platforms for each employee
- Examples: Social Media, Content Marketing, Email Marketing, PPC
- Helps in resource allocation and skill development

### Marketing Unit Management
- Associate employees with specific marketing units
- Track lead quality scores for marketing units
- Manage unit heads and team structures

### Lead Quality Scoring
- Marketing units have lead quality scores
- Helps in performance evaluation and optimization
- Supports data-driven marketing decisions 