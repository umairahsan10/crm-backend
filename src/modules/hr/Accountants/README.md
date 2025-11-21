# HR Accountants Department Management API Documentation

## Overview
The HR Accountants Department Management System provides comprehensive APIs for managing accountants department records, including employee accountant data, permission management, and access control. All endpoints require JWT authentication and appropriate permissions.

---

## Authentication & Authorization
- **Authentication**: JWT Bearer Token required for all endpoints
- **Authorization**: HR department access with `employee_add_permission`
- **Database Access**: All operations use Prisma ORM with PostgreSQL

---

## Core Accountants Department APIs

### 1. Get All Accountants Records
**Endpoint**: `GET /hr/accountants`  
**Method**: GET  
**Access**: HR (requires `employee_add_permission`)

#### Description
Retrieve all accountants department records with related employee information. Results are ordered by creation date (newest first).

#### Query Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `employeeId` | integer | No | Filter by specific employee ID |

#### Sample Request
```bash
GET /hr/accountants
Authorization: Bearer <jwt-token>
```

#### Sample Response
```json
{
  "accountants": [
    {
      "id": 1,
      "employeeId": 123,
      "taxPermission": true,
      "salaryPermission": true,
      "salesPermission": false,
      "invoicesPermission": true,
      "expensesPermission": true,
      "assetsPermission": false,
      "revenuesPermission": true,
      "createdAt": "2025-01-15T10:30:00.000Z",
      "updatedAt": "2025-01-15T10:30:00.000Z",
      "employee": {
        "id": 123,
        "firstName": "John",
        "lastName": "Doe",
        "email": "john.doe@company.com"
      }
    }
  ],
  "total": 1
}
```

#### Tables Affected
- **Read**: `accountants`, `employees`

#### Error Responses
- `401`: Unauthorized access
- `403`: Insufficient permissions
- `500`: Internal server error

---

### 2. Get Accountant Record by ID
**Endpoint**: `GET /hr/accountants/:id`  
**Method**: GET  
**Access**: HR (requires `employee_add_permission`)

#### Description
Retrieve a specific accountants department record by its ID with related employee information.

#### Path Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | Accountant record ID |

#### Sample Request
```bash
GET /hr/accountants/1
Authorization: Bearer <jwt-token>
```

#### Sample Response
```json
{
  "id": 1,
  "employeeId": 123,
  "taxPermission": true,
  "salaryPermission": true,
  "salesPermission": false,
  "invoicesPermission": true,
  "expensesPermission": true,
  "assetsPermission": false,
  "revenuesPermission": true,
  "createdAt": "2025-01-15T10:30:00.000Z",
  "updatedAt": "2025-01-15T10:30:00.000Z",
  "employee": {
    "id": 123,
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@company.com"
  }
}
```

#### Error Responses
- `404`: Accountant record not found
- `401`: Unauthorized access
- `403`: Insufficient permissions
- `500`: Internal server error

---

### 3. Create Accountant Record
**Endpoint**: `POST /hr/accountants`  
**Method**: POST  
**Access**: HR (requires `employee_add_permission`)

#### Description
Create a new accountants department record for an existing employee. Validates employee existence and prevents duplicate records.

#### Request Body
```json
{
  "employeeId": 123,
  "taxPermission": true,
  "salaryPermission": true,
  "salesPermission": false,
  "invoicesPermission": true,
  "expensesPermission": true,
  "assetsPermission": false,
  "revenuesPermission": true
}
```

#### Required Fields
- `employeeId` (integer): Employee ID (must exist)

#### Optional Fields
- `taxPermission` (boolean): Permission to manage tax-related operations
- `salaryPermission` (boolean): Permission to manage salary operations
- `salesPermission` (boolean): Permission to manage sales operations
- `invoicesPermission` (boolean): Permission to manage invoices
- `expensesPermission` (boolean): Permission to manage expenses
- `assetsPermission` (boolean): Permission to manage assets
- `revenuesPermission` (boolean): Permission to manage revenues

#### Validation Rules
- `employeeId`: Must reference an existing employee

#### Sample Response
```json
{
  "id": 1,
  "employeeId": 123,
  "taxPermission": true,
  "salaryPermission": true,
  "salesPermission": false,
  "invoicesPermission": true,
  "expensesPermission": true,
  "assetsPermission": false,
  "revenuesPermission": true,
  "createdAt": "2025-01-15T10:30:00.000Z",
  "updatedAt": "2025-01-15T10:30:00.000Z",
  "employee": {
    "id": 123,
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@company.com"
  }
}
```

#### Tables Affected
- **Create**: `accountants`
- **Read**: `employees`

#### Error Responses
- `400`: Employee doesn't exist, duplicate record, validation errors
- `401`: Unauthorized access
- `403`: Insufficient permissions
- `500`: Internal server error

---

### 4. Update Accountant Record
**Endpoint**: `PUT /hr/accountants/:id`  
**Method**: PUT  
**Access**: HR (requires `employee_add_permission`)

#### Description
Update an existing accountants department record. All fields are optional for partial updates.

#### Path Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | Accountant record ID |

#### Request Body
```json
{
  "salesPermission": true,
  "assetsPermission": true
}
```

#### Optional Fields
All fields from the create endpoint are optional for updates.

#### Sample Response
```json
{
  "id": 1,
  "employeeId": 123,
  "taxPermission": true,
  "salaryPermission": true,
  "salesPermission": true,
  "invoicesPermission": true,
  "expensesPermission": true,
  "assetsPermission": true,
  "revenuesPermission": true,
  "createdAt": "2025-01-15T10:30:00.000Z",
  "updatedAt": "2025-01-15T11:45:00.000Z",
  "employee": {
    "id": 123,
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@company.com"
  }
}
```

#### Tables Affected
- **Update**: `accountants`
- **Read**: `employees`

#### Error Responses
- `404`: Accountant record not found
- `400`: Validation errors
- `401`: Unauthorized access
- `403`: Insufficient permissions
- `500`: Internal server error

---

### 5. Delete Accountant Record
**Endpoint**: `DELETE /hr/accountants/:id`  
**Method**: DELETE  
**Access**: HR (requires `employee_add_permission`)

#### Description
Delete an accountants department record for an employee.

#### Path Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | Accountant record ID |

#### Sample Request
```bash
DELETE /hr/accountants/1
Authorization: Bearer <jwt-token>
```

#### Sample Response
```json
{
  "message": "Employee John Doe removed from accountant department successfully"
}
```

#### Tables Affected
- **Delete**: `accountants`
- **Read**: `employees`

#### Error Responses
- `404`: Accountant record not found
- `401`: Unauthorized access
- `403`: Insufficient permissions
- `500`: Internal server error

---

## Data Models

### Accountant
```typescript
interface Accountant {
  id: number;
  employeeId: number;
  taxPermission?: boolean;
  salaryPermission?: boolean;
  salesPermission?: boolean;
  invoicesPermission?: boolean;
  expensesPermission?: boolean;
  assetsPermission?: boolean;
  revenuesPermission?: boolean;
  createdAt: Date;
  updatedAt: Date;
  employee: Employee;
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

---

## Business Rules

### Employee Validation
- Accountant records can only be created for existing employees
- Updates and deletions validate that the associated employee still exists
- Prevents orphaned records in the database

### Duplicate Prevention
- Only one accountant record per employee
- Attempting to create a duplicate record returns an error

### Permission Management
- All permission fields are boolean values
- Permissions control access to various accounting functions
- Flexible permission assignment for different accountant roles

---

## Error Handling

### Common Error Codes
- `400 Bad Request`: Validation errors, employee doesn't exist, duplicate records
- `401 Unauthorized`: Missing or invalid JWT token
- `403 Forbidden`: Insufficient permissions or wrong department
- `404 Not Found`: Accountant record not found
- `500 Internal Server Error`: Database or server errors

### Error Response Format
```json
{
  "statusCode": 400,
  "message": "Employee 123 is already an accountant",
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
src/modules/hr/Accountants/
├── controllers/
│   └── accountant.controller.ts    # API endpoints
├── services/
│   └── accountant.service.ts       # Business logic
├── dto/
│   └── accountant.dto.ts           # Data transfer objects
├── accountants.module.ts           # Module configuration
└── README.md                       # This documentation
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
1. Update DTOs in `dto/accountant.dto.ts`
2. Add service methods in `services/accountant.service.ts`
3. Add controller endpoints in `controllers/accountant.controller.ts`
4. Update this documentation

### Testing
- All endpoints should be tested with valid and invalid data
- Test employee existence validation
- Test duplicate record prevention
- Test permission management

### Performance Considerations
- Database queries include necessary relations
- Proper indexing on frequently queried fields
- Transaction usage for multi-table operations 