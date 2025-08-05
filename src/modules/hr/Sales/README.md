# HR Sales Department Management API Documentation

## Overview
The HR Sales Department Management System provides comprehensive APIs for managing sales department records, including employee sales data, commission tracking, and sales unit assignments. All endpoints require JWT authentication and appropriate permissions.

---

## Authentication & Authorization
- **Authentication**: JWT Bearer Token required for all endpoints
- **Authorization**: HR department access with `employee_add_permission`
- **Database Access**: All operations use Prisma ORM with PostgreSQL

---

## Core Sales Department APIs

### 1. Get All Sales Departments
**Endpoint**: `GET /hr/sales`  
**Method**: GET  
**Access**: HR (requires `employee_add_permission`)

#### Description
Retrieve all sales department records with related employee and sales unit information. Results are ordered by creation date (newest first).

#### Sample Request
```bash
GET /hr/sales
Authorization: Bearer <jwt-token>
```

#### Sample Response
```json
[
  {
    "id": 1,
    "employeeId": 123,
    "leadsClosed": 15,
    "salesAmount": 75000.00,
    "salesUnitId": 1,
    "commissionRate": 5.5,
    "commissionAmount": 4125.00,
    "salesBonus": 1000.00,
    "withholdCommission": 500.00,
    "withholdFlag": false,
    "targetAmount": 100000.00,
    "chargebackDeductions": 0.00,
    "refundDeductions": 0.00,
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
        "id": 1,
        "name": "Sales"
      },
      "role": {
        "id": 2,
        "name": "Sales Representative"
      }
    },
    "salesUnit": {
      "id": 1,
      "name": "North Region",
      "email": "north@company.com",
      "phone": "+1234567891",
      "address": "123 North St, City",
      "logoUrl": "https://example.com/logo.png",
      "website": "https://north.company.com"
    }
  }
]
```

#### Tables Affected
- **Read**: `sales_departments`, `employees`, `departments`, `roles`, `sales_units`

#### Error Responses
- `401`: Unauthorized access
- `403`: Insufficient permissions
- `500`: Internal server error

---

### 2. Get Sales Department by ID
**Endpoint**: `GET /hr/sales/:id`  
**Method**: GET  
**Access**: HR (requires `employee_add_permission`)

#### Description
Retrieve a specific sales department record by its ID with related employee and sales unit information.

#### Path Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | Sales department ID |

#### Sample Request
```bash
GET /hr/sales/1
Authorization: Bearer <jwt-token>
```

#### Sample Response
```json
{
  "id": 1,
  "employeeId": 123,
  "leadsClosed": 15,
  "salesAmount": 75000.00,
  "salesUnitId": 1,
  "commissionRate": 5.5,
  "commissionAmount": 4125.00,
  "salesBonus": 1000.00,
  "withholdCommission": 500.00,
  "withholdFlag": false,
  "targetAmount": 100000.00,
  "chargebackDeductions": 0.00,
  "refundDeductions": 0.00,
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
      "id": 1,
      "name": "Sales"
    },
    "role": {
      "id": 2,
      "name": "Sales Representative"
    }
  },
  "salesUnit": {
    "id": 1,
    "name": "North Region",
    "email": "north@company.com",
    "phone": "+1234567891",
    "address": "123 North St, City",
    "logoUrl": "https://example.com/logo.png",
    "website": "https://north.company.com"
  }
}
```

#### Error Responses
- `404`: Sales department not found
- `401`: Unauthorized access
- `403`: Insufficient permissions
- `500`: Internal server error

---

### 3. Create Sales Department Record
**Endpoint**: `POST /hr/sales`  
**Method**: POST  
**Access**: HR (requires `employee_add_permission`)

#### Description
Create a new sales department record for an existing employee. Validates employee existence and prevents duplicate records.

#### Request Body
```json
{
  "employeeId": 123,
  "leadsClosed": 10,
  "salesAmount": 50000.00,
  "salesUnitId": 1,
  "commissionRate": 5.5,
  "commissionAmount": 2750.00,
  "salesBonus": 1000.00,
  "withholdCommission": 500.00,
  "withholdFlag": false,
  "targetAmount": 100000.00,
  "chargebackDeductions": 0.00,
  "refundDeductions": 0.00
}
```

#### Required Fields
- `employeeId` (integer): Employee ID (must exist)
- `withholdCommission` (number): Commission amount to withhold
- `withholdFlag` (boolean): Whether to withhold commission

#### Optional Fields
- `leadsClosed` (integer): Number of leads closed
- `salesAmount` (number): Total sales amount
- `salesUnitId` (integer): Associated sales unit ID
- `commissionRate` (number): Commission rate (0-100%)
- `commissionAmount` (number): Calculated commission amount
- `salesBonus` (number): Sales bonus amount
- `targetAmount` (number): Sales target amount
- `chargebackDeductions` (number): Chargeback deductions
- `refundDeductions` (number): Refund deductions

#### Validation Rules
- `employeeId`: Must reference an existing employee
- `commissionRate`: Must be between 0 and 100
- `leadsClosed`: Must be non-negative
- All monetary amounts: Must be non-negative

#### Sample Response
```json
{
  "id": 1,
  "employeeId": 123,
  "leadsClosed": 10,
  "salesAmount": 50000.00,
  "salesUnitId": 1,
  "commissionRate": 5.5,
  "commissionAmount": 2750.00,
  "salesBonus": 1000.00,
  "withholdCommission": 500.00,
  "withholdFlag": false,
  "targetAmount": 100000.00,
  "chargebackDeductions": 0.00,
  "refundDeductions": 0.00,
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
      "id": 1,
      "name": "Sales"
    },
    "role": {
      "id": 2,
      "name": "Sales Representative"
    }
  },
  "salesUnit": {
    "id": 1,
    "name": "North Region",
    "email": "north@company.com",
    "phone": "+1234567891",
    "address": "123 North St, City",
    "logoUrl": "https://example.com/logo.png",
    "website": "https://north.company.com"
  }
}
```

#### Tables Affected
- **Create**: `sales_departments`
- **Read**: `employees`, `sales_units`

#### Error Responses
- `400`: Employee doesn't exist, duplicate record, validation errors
- `401`: Unauthorized access
- `403`: Insufficient permissions
- `500`: Internal server error

---

### 4. Update Sales Department Record
**Endpoint**: `PUT /hr/sales/:id`  
**Method**: PUT  
**Access**: HR (requires `employee_add_permission`)

#### Description
Update an existing sales department record. All fields are optional for partial updates.

#### Path Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | Sales department ID |

#### Request Body
```json
{
  "leadsClosed": 15,
  "salesAmount": 75000.00,
  "commissionRate": 6.0,
  "salesBonus": 1500.00
}
```

#### Optional Fields
All fields from the create endpoint are optional for updates.

#### Sample Response
```json
{
  "id": 1,
  "employeeId": 123,
  "leadsClosed": 15,
  "salesAmount": 75000.00,
  "salesUnitId": 1,
  "commissionRate": 6.0,
  "commissionAmount": 4500.00,
  "salesBonus": 1500.00,
  "withholdCommission": 500.00,
  "withholdFlag": false,
  "targetAmount": 100000.00,
  "chargebackDeductions": 0.00,
  "refundDeductions": 0.00,
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
      "id": 1,
      "name": "Sales"
    },
    "role": {
      "id": 2,
      "name": "Sales Representative"
    }
  },
  "salesUnit": {
    "id": 1,
    "name": "North Region",
    "email": "north@company.com",
    "phone": "+1234567891",
    "address": "123 North St, City",
    "logoUrl": "https://example.com/logo.png",
    "website": "https://north.company.com"
  }
}
```

#### Tables Affected
- **Update**: `sales_departments`
- **Read**: `employees`, `sales_units`

#### Error Responses
- `404`: Sales department not found
- `400`: Employee no longer exists, validation errors
- `401`: Unauthorized access
- `403`: Insufficient permissions
- `500`: Internal server error

---

### 5. Delete Sales Department Record
**Endpoint**: `DELETE /hr/sales/:id`  
**Method**: DELETE  
**Access**: HR (requires `employee_add_permission`)

#### Description
Delete a sales department record and perform cascading updates to related tables. Sets `headId` in sales units and `team_lead_id` in teams to null if the employee was a head or team lead.

#### Path Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | Sales department ID |

#### Sample Request
```bash
DELETE /hr/sales/1
Authorization: Bearer <jwt-token>
```

#### Sample Response
```json
{
  "message": "Sales department record for employee John Doe (ID: 123) has been successfully deleted.",
  "deletedRecord": {
    "id": 1,
    "employeeId": 123,
    "employeeName": "John Doe",
    "employeeEmail": "john.doe@company.com"
  }
}
```

#### Tables Affected
- **Delete**: `sales_departments`
- **Update**: `sales_units` (headId → null), `teams` (team_lead_id → null)
- **Read**: `employees`

#### Error Responses
- `404`: Sales department not found
- `400`: Employee no longer exists
- `401`: Unauthorized access
- `403`: Insufficient permissions
- `500`: Internal server error

---

### 6. Update Commission Rate
**Endpoint**: `PATCH /hr/sales/:id/commission-rate`  
**Method**: PATCH  
**Access**: HR (requires `commission_permission`)

#### Description
Update the commission rate for a specific sales department record. This endpoint requires commission permission and logs the change for audit purposes.

#### Path Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | Sales department ID |

#### Request Body
```json
{
  "commissionRate": 7.5
}
```

#### Required Fields
- `commissionRate` (number): New commission rate (0-100%)

#### Validation Rules
- `commissionRate`: Must be between 0 and 100 percent

#### Sample Response
```json
{
  "id": 1,
  "employeeId": 123,
  "leadsClosed": 15,
  "salesAmount": 75000.00,
  "salesUnitId": 1,
  "commissionRate": 7.5,
  "commissionAmount": 5625.00,
  "salesBonus": 1000.00,
  "withholdCommission": 500.00,
  "withholdFlag": false,
  "targetAmount": 100000.00,
  "chargebackDeductions": 0.00,
  "refundDeductions": 0.00,
  "createdAt": "2025-01-15T10:30:00.000Z",
  "updatedAt": "2025-01-15T12:00:00.000Z",
  "employee": {
    "id": 123,
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@company.com",
    "phone": "+1234567890",
    "status": "active",
    "department": {
      "id": 1,
      "name": "Sales"
    },
    "role": {
      "id": 2,
      "name": "Sales Representative"
    }
  },
  "salesUnit": {
    "id": 1,
    "name": "North Region",
    "email": "north@company.com",
    "phone": "+1234567891",
    "address": "123 North St, City",
    "logoUrl": "https://example.com/logo.png",
    "website": "https://north.company.com"
  }
}
```

#### Tables Affected
- **Update**: `sales_departments`
- **Create**: `hr_logs` (audit trail)
- **Read**: `employees`, `sales_units`

#### Error Responses
- `404`: Sales department not found
- `400`: Validation errors (invalid commission rate)
- `401`: Unauthorized access
- `403`: Insufficient permissions (commission_permission required)
- `500`: Internal server error

---

### 7. Update Target Amount
**Endpoint**: `PATCH /hr/sales/:id/target-amount`  
**Method**: PATCH  
**Access**: HR (requires `targets_set` permission)

#### Description
Update the target amount for a specific sales department record. This endpoint requires targets set permission and logs the change for audit purposes.

#### Path Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | Sales department ID |

#### Request Body
```json
{
  "targetAmount": 125000.00
}
```

#### Required Fields
- `targetAmount` (number): New target amount

#### Validation Rules
- `targetAmount`: Must be non-negative

#### Sample Response
```json
{
  "id": 1,
  "employeeId": 123,
  "leadsClosed": 15,
  "salesAmount": 75000.00,
  "salesUnitId": 1,
  "commissionRate": 5.5,
  "commissionAmount": 4125.00,
  "salesBonus": 1000.00,
  "withholdCommission": 500.00,
  "withholdFlag": false,
  "targetAmount": 125000.00,
  "chargebackDeductions": 0.00,
  "refundDeductions": 0.00,
  "createdAt": "2025-01-15T10:30:00.000Z",
  "updatedAt": "2025-01-15T12:15:00.000Z",
  "employee": {
    "id": 123,
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@company.com",
    "phone": "+1234567890",
    "status": "active",
    "department": {
      "id": 1,
      "name": "Sales"
    },
    "role": {
      "id": 2,
      "name": "Sales Representative"
    }
  },
  "salesUnit": {
    "id": 1,
    "name": "North Region",
    "email": "north@company.com",
    "phone": "+1234567891",
    "address": "123 North St, City",
    "logoUrl": "https://example.com/logo.png",
    "website": "https://north.company.com"
  }
}
```

#### Tables Affected
- **Update**: `sales_departments`
- **Create**: `hr_logs` (audit trail)
- **Read**: `employees`, `sales_units`

#### Error Responses
- `404`: Sales department not found
- `400`: Validation errors (invalid target amount)
- `401`: Unauthorized access
- `403`: Insufficient permissions (targets_set permission required)
- `500`: Internal server error

---

## Data Models

### Sales Department
```typescript
interface SalesDepartment {
  id: number;
  employeeId: number;
  leadsClosed?: number;
  salesAmount?: number;
  salesUnitId?: number;
  commissionRate?: number;
  commissionAmount?: number;
  salesBonus?: number;
  withholdCommission: number;
  withholdFlag: boolean;
  targetAmount?: number;
  chargebackDeductions?: number;
  refundDeductions?: number;
  createdAt: Date;
  updatedAt: Date;
  employee: Employee;
  salesUnit?: SalesUnit;
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

### Sales Unit (Related)
```typescript
interface SalesUnit {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  logoUrl?: string;
  website?: string;
}
```

---

## Business Rules

### Employee Validation
- Sales department records can only be created for existing employees
- Updates and deletions validate that the associated employee still exists
- Prevents orphaned records in the database

### Duplicate Prevention
- Only one sales department record per employee
- Attempting to create a duplicate record returns an error

### Cascading Updates
- When deleting a sales department record:
  - Sets `headId` to null in `sales_units` table if employee was a head
  - Sets `team_lead_id` to null in `teams` table if employee was a team lead

### Data Integrity
- All monetary amounts must be non-negative
- Commission rates must be between 0 and 100 percent
- Foreign key relationships are maintained

---

## Error Handling

### Common Error Codes
- `400 Bad Request`: Validation errors, employee doesn't exist, duplicate records
- `401 Unauthorized`: Missing or invalid JWT token
- `403 Forbidden`: Insufficient permissions or wrong department
- `404 Not Found`: Sales department record not found
- `500 Internal Server Error`: Database or server errors

### Error Response Format
```json
{
  "statusCode": 400,
  "message": "Employee with ID 999 does not exist. Sales department records can only be created for existing employees.",
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
src/modules/hr/Sales/
├── controllers/
│   └── sales.controller.ts      # API endpoints
├── services/
│   └── sales.service.ts         # Business logic
├── dto/
│   └── sales.dto.ts             # Data transfer objects
├── sales.module.ts              # Module configuration
└── README.md                    # This documentation
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
1. Update DTOs in `dto/sales.dto.ts`
2. Add service methods in `services/sales.service.ts`
3. Add controller endpoints in `controllers/sales.controller.ts`
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