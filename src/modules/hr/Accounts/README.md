# ACCOUNTS MODULE API DOCUMENTATION

## Overview
The Accounts module provides comprehensive CRUD operations for managing employee account information within the HR system. This module handles employee banking details, salary information, and account management for the Accounts department.

## Base URL
```
/hr/accounts
```

## Authentication & Authorization
All endpoints require:
- **JWT Authentication** (`JwtAuthGuard`)
- **Role-based Access** (`RolesGuard`)
- **Department Access** (`DepartmentsGuard`) - HR department only
- **Permission-based Access** (`PermissionsGuard`) - `employee_add_permission`

## API Endpoints

### 1. Get All Account Records
**GET** `/hr/accounts`

Retrieves all account records with employee details.

#### Response
```json
[
  {
    "id": 1,
    "employeeId": 101,
    "accountTitle": "John Doe Account",
    "bankName": "Chase Bank",
    "ibanNumber": "US12345678901234567890",
    "baseSalary": 50000.00,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z",
    "employee": {
      "id": 101,
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@company.com",
      "phone": "+1234567890",
      "status": "ACTIVE",
      "department": {
        "id": 1,
        "name": "Accounts"
      },
      "role": {
        "id": 1,
        "name": "Accountant"
      }
    }
  }
]
```

### 2. Get Account Record by ID
**GET** `/hr/accounts/:id`

Retrieves a specific account record by its ID.

#### Parameters
- `id` (number, required): The unique identifier of the account record

#### Response
```json
{
  "id": 1,
  "employeeId": 101,
  "accountTitle": "John Doe Account",
  "bankName": "Chase Bank",
  "ibanNumber": "US12345678901234567890",
  "baseSalary": 50000.00,
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z",
  "employee": {
    "id": 101,
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@company.com",
    "phone": "+1234567890",
    "status": "ACTIVE",
    "department": {
      "id": 1,
      "name": "Accounts"
    },
    "role": {
      "id": 1,
      "name": "Accountant"
    }
  }
}
```

#### Error Responses
- `404 Not Found`: Account record with specified ID not found

### 3. Create Account Record
**POST** `/hr/accounts`

Creates a new account record for an existing employee.

#### Request Body
```json
{
  "employeeId": 101,
  "accountTitle": "John Doe Account",
  "bankName": "Chase Bank",
  "ibanNumber": "US12345678901234567890",
  "baseSalary": 50000.00
}
```

#### Validation Rules
- `employeeId` (number, required): Must reference an existing employee
- `accountTitle` (string, optional): Account title/name
- `bankName` (string, optional): Name of the bank
- `ibanNumber` (string, optional): IBAN number for the account
- `baseSalary` (decimal, optional, min: 0): Base salary amount

#### Business Rules
- Employee must exist in the system
- Only one account record per employee is allowed
- If account record already exists for the employee, returns error

#### Response
```json
{
  "id": 1,
  "employeeId": 101,
  "accountTitle": "John Doe Account",
  "bankName": "Chase Bank",
  "ibanNumber": "US12345678901234567890",
  "baseSalary": 50000.00,
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z",
  "employee": {
    "id": 101,
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@company.com",
    "phone": "+1234567890",
    "status": "ACTIVE",
    "department": {
      "id": 1,
      "name": "Accounts"
    },
    "role": {
      "id": 1,
      "name": "Accountant"
    }
  }
}
```

#### Error Responses
- `400 Bad Request`: Employee does not exist
- `400 Bad Request`: Account record already exists for employee
- `400 Bad Request`: Validation errors

### 4. Update Account Record
**PUT** `/hr/accounts/:id`

Updates an existing account record.

#### Parameters
- `id` (number, required): The unique identifier of the account record

#### Request Body
```json
{
  "accountTitle": "John Doe Updated Account",
  "bankName": "Wells Fargo",
  "ibanNumber": "US98765432109876543210",
  "baseSalary": 55000.00
}
```

#### Validation Rules
- All fields are optional for updates
- `baseSalary` (decimal, min: 0): Must be non-negative

#### Business Rules
- Account record must exist
- Associated employee must still exist in the system

#### Response
```json
{
  "id": 1,
  "employeeId": 101,
  "accountTitle": "John Doe Updated Account",
  "bankName": "Wells Fargo",
  "ibanNumber": "US98765432109876543210",
  "baseSalary": 55000.00,
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T11:45:00.000Z",
  "employee": {
    "id": 101,
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@company.com",
    "phone": "+1234567890",
    "status": "ACTIVE",
    "department": {
      "id": 1,
      "name": "Accounts"
    },
    "role": {
      "id": 1,
      "name": "Accountant"
    }
  }
}
```

#### Error Responses
- `404 Not Found`: Account record not found
- `400 Bad Request`: Associated employee no longer exists
- `400 Bad Request`: Validation errors

### 5. Delete Account Record
**DELETE** `/hr/accounts/:id`

Deletes an account record.

#### Parameters
- `id` (number, required): The unique identifier of the account record

#### Business Rules
- Account record must exist
- Associated employee must still exist in the system
- Deletion is independent (no cascading updates to other tables)

#### Response
```json
{
  "message": "Account record for employee John Doe (ID: 101) has been successfully deleted.",
  "deletedRecord": {
    "id": 1,
    "employeeId": 101,
    "employeeName": "John Doe",
    "employeeEmail": "john.doe@company.com"
  }
}
```

#### Error Responses
- `404 Not Found`: Account record not found
- `400 Bad Request`: Associated employee no longer exists

## HR Logging

All account management operations are logged in the HR logs table for audit purposes:

### Action Types:
- `account_created` - When a new account record is created
- `account_updated` - When account information is updated (includes list of changed fields)
- `account_deleted` - When an account record is deleted

### Log Details:
Each log entry includes:
- **HR Employee ID** - Who performed the action
- **Action Type** - What operation was performed
- **Affected Employee ID** - Which employee was affected
- **Description** - Detailed description of the action
- **Timestamp** - When the action was performed

### Example Log Entries:
```
account_created: "Account record created for employee John Doe (ID: 101, Email: john.doe@company.com)"
account_updated: "Account record updated for employee John Doe (ID: 101) - Fields changed: accountTitle, bankName, baseSalary"
account_deleted: "Account record deleted for employee John Doe (ID: 101, Email: john.doe@company.com)"
```

## Data Models

### Account Model
```typescript
interface Account {
  id: number;
  employeeId: number;
  accountTitle?: string;
  bankName?: string;
  ibanNumber?: string;
  baseSalary?: number;
  createdAt: Date;
  updatedAt: Date;
  employee: Employee;
}
```

### CreateAccountDto
```typescript
interface CreateAccountDto {
  employeeId: number;
  accountTitle?: string;
  bankName?: string;
  ibanNumber?: string;
  baseSalary?: number;
}
```

### UpdateAccountDto
```typescript
interface UpdateAccountDto {
  accountTitle?: string;
  bankName?: string;
  ibanNumber?: string;
  baseSalary?: number;
}
```

## Business Rules

### Employee Validation
- All account records must be associated with existing employees
- Employee existence is validated before any CRUD operation
- If employee is deleted, account operations will fail

### Uniqueness Constraints
- Only one account record per employee is allowed
- Attempting to create duplicate records will result in an error

### Data Integrity
- Account records are independent of other HR modules
- Deletion does not affect other tables (no cascading updates)
- All monetary values must be non-negative

### Audit Trail
- All operations are logged for audit purposes
- Timestamps are automatically managed for creation and updates
- HR logging tracks who performed what action on which employee

## Security Features

### Authentication
- JWT token required for all endpoints
- Token must be valid and not expired

### Authorization
- Role-based access control
- Department-specific access (HR department only)
- Permission-based access control

### Data Protection
- Input validation and sanitization
- SQL injection prevention through Prisma ORM
- Sensitive financial data handling

## Module Structure

```
Accounts/
├── controllers/
│   └── accounts.controller.ts
├── services/
│   └── accounts.service.ts
├── dto/
│   └── accounts.dto.ts
├── accounts.module.ts
└── README.md
```

## Dependencies

### Internal Dependencies
- `PrismaService`: Database operations
- `Logger`: Logging functionality
- `JwtAuthGuard`: Authentication
- `RolesGuard`: Role-based authorization
- `DepartmentsGuard`: Department-based authorization
- `PermissionsGuard`: Permission-based authorization

### External Dependencies
- `@nestjs/common`: Core NestJS functionality
- `class-validator`: DTO validation
- `class-transformer`: Data transformation

## Error Handling

### Standard Error Responses
- `400 Bad Request`: Validation errors, business rule violations
- `404 Not Found`: Resource not found
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Insufficient permissions
- `500 Internal Server Error`: Server-side errors

### Error Response Format
```json
{
  "statusCode": 400,
  "message": "Error description",
  "error": "Bad Request"
}
```

## Logging

### Log Levels
- **INFO**: Successful operations (create, read, update, delete)
- **ERROR**: Failed operations and exceptions
- **DEBUG**: Detailed operation information

### Log Information
- Operation type and target record ID
- Employee information for context
- Error details for troubleshooting
- Performance metrics

## Performance Considerations

### Database Optimization
- Indexed queries on primary keys
- Efficient joins with employee data
- Pagination support for large datasets

### Caching Strategy
- Employee data caching for repeated lookups
- Account record caching for frequently accessed data

## Testing

### Unit Tests
- Service method testing
- DTO validation testing
- Error handling testing

### Integration Tests
- API endpoint testing
- Database operation testing
- Authentication and authorization testing

## Future Enhancements

### Planned Features
- Bulk account operations
- Account history tracking
- Advanced filtering and search
- Export functionality
- Account status management

### Integration Opportunities
- Payroll system integration
- Banking API integration
- Financial reporting integration 