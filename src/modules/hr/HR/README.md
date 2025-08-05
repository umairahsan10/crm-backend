# HR Management Department API Documentation

## Overview
The HR Management Department System provides comprehensive APIs for managing HR department records, including employee HR data, permission management, and access control. All endpoints require JWT authentication and appropriate permissions.

---

## Authentication & Authorization
- **Authentication**: JWT Bearer Token required for all endpoints
- **Authorization**: HR department access with `employee_add_permission`
- **Database Access**: All operations use Prisma ORM with PostgreSQL

---

## Core HR Management APIs

### 1. Get All HR Records
**Endpoint**: `GET /hr/management`  
**Method**: GET  
**Access**: HR (requires `employee_add_permission`)

#### Description
Retrieve all HR department records with related employee information. Results are ordered by creation date (newest first).

#### Query Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `employeeId` | integer | No | Filter by specific employee ID |

#### Sample Request
```bash
GET /hr/management
Authorization: Bearer <jwt-token>
```

#### Sample Response
```json
{
  "hrRecords": [
    {
      "id": 1,
      "employeeId": 123,
      "attendancePermission": true,
      "salaryPermission": true,
      "commissionPermission": false,
      "employeeAddPermission": true,
      "terminationsHandle": true,
      "monthlyLeaveRequest": true,
      "targetsSet": false,
      "bonusesSet": true,
      "shiftTimingSet": true,
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
- **Read**: `hr`, `employees`

#### Error Responses
- `401`: Unauthorized access
- `403`: Insufficient permissions
- `500`: Internal server error

---

### 2. Get HR Record by ID
**Endpoint**: `GET /hr/management/:id`  
**Method**: GET  
**Access**: HR (requires `employee_add_permission`)

#### Description
Retrieve a specific HR department record by its ID with related employee information.

#### Path Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | HR record ID |

#### Sample Request
```bash
GET /hr/management/1
Authorization: Bearer <jwt-token>
```

#### Sample Response
```json
{
  "id": 1,
  "employeeId": 123,
  "attendancePermission": true,
  "salaryPermission": true,
  "commissionPermission": false,
  "employeeAddPermission": true,
  "terminationsHandle": true,
  "monthlyLeaveRequest": true,
  "targetsSet": false,
  "bonusesSet": true,
  "shiftTimingSet": true,
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
- `404`: HR record not found
- `401`: Unauthorized access
- `403`: Insufficient permissions
- `500`: Internal server error

---

### 3. Create HR Record
**Endpoint**: `POST /hr/management`  
**Method**: POST  
**Access**: HR (requires `employee_add_permission`)

#### Description
Create a new HR department record for an existing employee. Validates employee existence and prevents duplicate records.

#### Request Body
```json
{
  "employeeId": 123,
  "attendancePermission": true,
  "salaryPermission": true,
  "commissionPermission": false,
  "employeeAddPermission": true,
  "terminationsHandle": true,
  "monthlyLeaveRequest": true,
  "targetsSet": false,
  "bonusesSet": true,
  "shiftTimingSet": true
}
```

#### Required Fields
- `employeeId` (integer): Employee ID (must exist)

#### Optional Fields
- `attendancePermission` (boolean): Permission to manage attendance
- `salaryPermission` (boolean): Permission to manage salary
- `commissionPermission` (boolean): Permission to manage commissions
- `employeeAddPermission` (boolean): Permission to add employees
- `terminationsHandle` (boolean): Permission to handle terminations
- `monthlyLeaveRequest` (boolean): Permission to manage leave requests
- `targetsSet` (boolean): Permission to set targets
- `bonusesSet` (boolean): Permission to manage bonuses
- `shiftTimingSet` (boolean): Permission to set shift timings

#### Validation Rules
- `employeeId`: Must reference an existing employee

#### Sample Response
```json
{
  "id": 1,
  "employeeId": 123,
  "attendancePermission": true,
  "salaryPermission": true,
  "commissionPermission": false,
  "employeeAddPermission": true,
  "terminationsHandle": true,
  "monthlyLeaveRequest": true,
  "targetsSet": false,
  "bonusesSet": true,
  "shiftTimingSet": true,
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
- **Create**: `hr`
- **Read**: `employees`

#### Error Responses
- `400`: Employee doesn't exist, duplicate record, validation errors
- `401`: Unauthorized access
- `403`: Insufficient permissions
- `500`: Internal server error

---

### 4. Update HR Record
**Endpoint**: `PUT /hr/management/:id`  
**Method**: PUT  
**Access**: HR (requires `employee_add_permission`)

#### Description
Update an existing HR department record. All fields are optional for partial updates.

#### Path Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | HR record ID |

#### Request Body
```json
{
  "salaryPermission": false,
  "bonusesSet": false
}
```

#### Optional Fields
All fields from the create endpoint are optional for updates.

#### Sample Response
```json
{
  "id": 1,
  "employeeId": 123,
  "attendancePermission": true,
  "salaryPermission": false,
  "commissionPermission": false,
  "employeeAddPermission": true,
  "terminationsHandle": true,
  "monthlyLeaveRequest": true,
  "targetsSet": false,
  "bonusesSet": false,
  "shiftTimingSet": true,
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
- **Update**: `hr`
- **Read**: `employees`

#### Error Responses
- `404`: HR record not found
- `400`: Validation errors
- `401`: Unauthorized access
- `403`: Insufficient permissions
- `500`: Internal server error

---

### 5. Delete HR Record
**Endpoint**: `DELETE /hr/management/:id`  
**Method**: DELETE  
**Access**: HR (requires `employee_add_permission`)

#### Description
Delete an HR department record for an employee.

#### Path Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | HR record ID |

#### Sample Request
```bash
DELETE /hr/management/1
Authorization: Bearer <jwt-token>
```

#### Sample Response
```json
{
  "message": "Employee John Doe removed from HR department successfully"
}
```

#### Tables Affected
- **Delete**: `hr`
- **Read**: `employees`

#### Error Responses
- `404`: HR record not found
- `401`: Unauthorized access
- `403`: Insufficient permissions
- `500`: Internal server error

---

## Data Models

### HR
```typescript
interface HR {
  id: number;
  employeeId: number;
  attendancePermission?: boolean;
  salaryPermission?: boolean;
  commissionPermission?: boolean;
  employeeAddPermission?: boolean;
  terminationsHandle?: boolean;
  monthlyLeaveRequest?: boolean;
  targetsSet?: boolean;
  bonusesSet?: boolean;
  shiftTimingSet?: boolean;
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
- HR records can only be created for existing employees
- Updates and deletions validate that the associated employee still exists
- Prevents orphaned records in the database

### Duplicate Prevention
- Only one HR record per employee
- Attempting to create a duplicate record returns an error

### Permission Management
- All permission fields are boolean values
- Permissions control access to various HR functions
- Flexible permission assignment for different HR roles

---

## Error Handling

### Common Error Codes
- `400 Bad Request`: Validation errors, employee doesn't exist, duplicate records
- `401 Unauthorized`: Missing or invalid JWT token
- `403 Forbidden`: Insufficient permissions or wrong department
- `404 Not Found`: HR record not found
- `500 Internal Server Error`: Database or server errors

### Error Response Format
```json
{
  "statusCode": 400,
  "message": "Employee 123 is already in HR department",
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
src/modules/hr/HR/
├── controllers/
│   └── hr-management.controller.ts  # API endpoints
├── services/
│   └── hr-management.service.ts     # Business logic
├── dto/
│   └── hr-management.dto.ts         # Data transfer objects
├── hr.module.ts                     # Module configuration
└── README.md                        # This documentation
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
1. Update DTOs in `dto/hr-management.dto.ts`
2. Add service methods in `services/hr-management.service.ts`
3. Add controller endpoints in `controllers/hr-management.controller.ts`
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