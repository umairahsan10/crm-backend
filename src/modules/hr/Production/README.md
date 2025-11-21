# HR Production Department Management API Documentation

## Overview
The HR Production Department Management System provides comprehensive APIs for managing production department records, including employee production data, specialization tracking, and production unit assignments. All endpoints require JWT authentication and appropriate permissions.

---

## Authentication & Authorization
- **Authentication**: JWT Bearer Token required for all endpoints
- **Authorization**: HR department access with `employee_add_permission`
- **Database Access**: All operations use Prisma ORM with PostgreSQL

---

## Core Production Department APIs

### 1. Get All Production Records
**Endpoint**: `GET /hr/production`  
**Method**: GET  
**Access**: HR (requires `employee_add_permission`)

#### Description
Retrieve all production department records with related employee and production unit information. Results are ordered by creation date (newest first).

#### Query Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `employeeId` | integer | No | Filter by specific employee ID |

#### Sample Request
```bash
GET /hr/production
Authorization: Bearer <jwt-token>
```

#### Sample Response
```json
{
  "productions": [
    {
      "id": 1,
      "employeeId": 123,
      "specialization": "Web Development",
      "productionUnitId": 1,
      "projectsCompleted": 15,
      "createdAt": "2025-01-15T10:30:00.000Z",
      "updatedAt": "2025-01-15T10:30:00.000Z",
      "employee": {
        "id": 123,
        "firstName": "John",
        "lastName": "Doe",
        "email": "john.doe@company.com"
      },
      "productionUnit": {
        "id": 1,
        "name": "Web Development Unit"
      }
    }
  ],
  "total": 1
}
```

#### Tables Affected
- **Read**: `production`, `employees`, `production_units`

#### Error Responses
- `401`: Unauthorized access
- `403`: Insufficient permissions
- `500`: Internal server error

---

### 2. Get Production Record by ID
**Endpoint**: `GET /hr/production/:id`  
**Method**: GET  
**Access**: HR (requires `employee_add_permission`)

#### Description
Retrieve a specific production department record by its ID with related employee and production unit information.

#### Path Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | Production record ID |

#### Sample Request
```bash
GET /hr/production/1
Authorization: Bearer <jwt-token>
```

#### Sample Response
```json
{
  "id": 1,
  "employeeId": 123,
  "specialization": "Web Development",
  "productionUnitId": 1,
  "projectsCompleted": 15,
  "createdAt": "2025-01-15T10:30:00.000Z",
  "updatedAt": "2025-01-15T10:30:00.000Z",
  "employee": {
    "id": 123,
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@company.com"
  },
  "productionUnit": {
    "id": 1,
    "name": "Web Development Unit"
  }
}
```

#### Error Responses
- `404`: Production record not found
- `401`: Unauthorized access
- `403`: Insufficient permissions
- `500`: Internal server error

---

### 3. Create Production Record
**Endpoint**: `POST /hr/production`  
**Method**: POST  
**Access**: HR (requires `employee_add_permission`)

#### Description
Create a new production department record for an existing employee. Validates employee existence and prevents duplicate records.

#### Request Body
```json
{
  "employeeId": 123,
  "specialization": "Web Development",
  "productionUnitId": 1,
  "projectsCompleted": 10
}
```

#### Required Fields
- `employeeId` (integer): Employee ID (must exist)

#### Optional Fields
- `specialization` (string): Employee's specialization area
- `productionUnitId` (integer): Associated production unit ID
- `projectsCompleted` (number): Number of projects completed

#### Validation Rules
- `employeeId`: Must reference an existing employee
- `productionUnitId`: Must reference an existing production unit (if provided)
- `projectsCompleted`: Must be non-negative

#### Sample Response
```json
{
  "id": 1,
  "employeeId": 123,
  "specialization": "Web Development",
  "productionUnitId": 1,
  "projectsCompleted": 10,
  "createdAt": "2025-01-15T10:30:00.000Z",
  "updatedAt": "2025-01-15T10:30:00.000Z",
  "employee": {
    "id": 123,
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@company.com"
  },
  "productionUnit": {
    "id": 1,
    "name": "Web Development Unit"
  }
}
```

#### Tables Affected
- **Create**: `production`
- **Read**: `employees`, `production_units`

#### Error Responses
- `400`: Employee doesn't exist, duplicate record, validation errors
- `401`: Unauthorized access
- `403`: Insufficient permissions
- `500`: Internal server error

---

### 4. Update Production Record
**Endpoint**: `PUT /hr/production/:id`  
**Method**: PUT  
**Access**: HR (requires `employee_add_permission`)

#### Description
Update an existing production department record. All fields are optional for partial updates.

#### Path Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | Production record ID |

#### Request Body
```json
{
  "specialization": "Mobile Development",
  "projectsCompleted": 15
}
```

#### Optional Fields
All fields from the create endpoint are optional for updates.

#### Sample Response
```json
{
  "id": 1,
  "employeeId": 123,
  "specialization": "Mobile Development",
  "productionUnitId": 1,
  "projectsCompleted": 15,
  "createdAt": "2025-01-15T10:30:00.000Z",
  "updatedAt": "2025-01-15T11:45:00.000Z",
  "employee": {
    "id": 123,
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@company.com"
  },
  "productionUnit": {
    "id": 1,
    "name": "Web Development Unit"
  }
}
```

#### Tables Affected
- **Update**: `production`
- **Read**: `employees`, `production_units`

#### Error Responses
- `404`: Production record not found
- `400`: Validation errors
- `401`: Unauthorized access
- `403`: Insufficient permissions
- `500`: Internal server error

---

### 5. Delete Production Record
**Endpoint**: `DELETE /hr/production/:id`  
**Method**: DELETE  
**Access**: HR (requires `employee_add_permission`)

#### Description
Delete a production department record for an employee.

#### Path Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | Production record ID |

#### Sample Request
```bash
DELETE /hr/production/1
Authorization: Bearer <jwt-token>
```

#### Sample Response
```json
{
  "message": "Employee John Doe removed from production department successfully"
}
```

#### Tables Affected
- **Delete**: `production`
- **Read**: `employees`

#### Error Responses
- `404`: Production record not found
- `401`: Unauthorized access
- `403`: Insufficient permissions
- `500`: Internal server error

---

## Data Models

### Production
```typescript
interface Production {
  id: number;
  employeeId: number;
  specialization?: string;
  productionUnitId?: number;
  projectsCompleted?: number;
  createdAt: Date;
  updatedAt: Date;
  employee: Employee;
  productionUnit?: ProductionUnit;
}
```

### Employee (Related)
```typescript
interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
}
```

### Production Unit (Related)
```typescript
interface ProductionUnit {
  id: number;
  name: string;
}
```

---

## Business Rules

### Employee Validation
- Production records can only be created for existing employees
- Updates and deletions validate that the associated employee still exists
- Prevents orphaned records in the database

### Duplicate Prevention
- Only one production record per employee
- Attempting to create a duplicate record returns an error

### Data Integrity
- All project counts must be non-negative
- Foreign key relationships are maintained
- Production unit references are validated

---

## Error Handling

### Common Error Codes
- `400 Bad Request`: Validation errors, employee doesn't exist, duplicate records
- `401 Unauthorized`: Missing or invalid JWT token
- `403 Forbidden`: Insufficient permissions or wrong department
- `404 Not Found`: Production record not found
- `500 Internal Server Error`: Database or server errors

### Error Response Format
```json
{
  "statusCode": 400,
  "message": "Employee 123 is already in production department",
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
src/modules/hr/Production/
├── controllers/
│   └── production.controller.ts  # API endpoints
├── services/
│   └── production.service.ts     # Business logic
├── dto/
│   └── production.dto.ts         # Data transfer objects
├── production.module.ts          # Module configuration
└── README.md                     # This documentation
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
1. Update DTOs in `dto/production.dto.ts`
2. Add service methods in `services/production.service.ts`
3. Add controller endpoints in `controllers/production.controller.ts`
4. Update this documentation

### Testing
- All endpoints should be tested with valid and invalid data
- Test employee existence validation
- Test duplicate record prevention
- Test production unit validation

### Performance Considerations
- Database queries include necessary relations
- Proper indexing on frequently queried fields
- Transaction usage for multi-table operations 