# Expense Management API Documentation

## Overview
The Expense Management module provides comprehensive CRUD operations for managing company expenses with automatic transaction linking, vendor support, and detailed filtering capabilities.

## Module Structure
```
src/modules/finance/accountant/expense/
├── dto/
│   ├── create-expense.dto.ts
│   ├── update-expense.dto.ts
│   └── expense-response.dto.ts
├── expense.controller.ts
├── expense.service.ts
├── expense.module.ts
└── EXPENSE_API_DOCUMENTATION.md
```

## API Endpoints

### 1. Create Expense
**POST** `/accountant/expense`

**Purpose**: Create a new expense record with linked transaction

**Request Body**:
```json
{
  "title": "Office Supplies",
  "category": "Office Expenses",
  "amount": 250.00,
  "paidOn": "2025-08-07",
  "paymentMethod": "bank",
  "vendorId": 1,
  "notes": "Monthly office supplies purchase"
}
```

**Response**:
```json
{
  "status": "success",
  "message": "Expense created successfully",
  "data": {
    "expense": {
      "id": 1,
      "title": "Office Supplies",
      "category": "Office Expenses",
      "amount": 250.00,
      "paidOn": "2025-08-07T00:00:00.000Z",
      "paymentMethod": "bank",
      "vendorId": 1,
      "createdBy": 50,
      "transactionId": 25,
      "createdAt": "2025-08-07T10:30:00.000Z",
      "updatedAt": "2025-08-07T10:30:00.000Z",
      "transaction": { /* transaction details */ },
      "vendor": { /* vendor details */ },
      "employee": { "id": 50 }
    },
    "transaction": { /* full transaction details */ }
  }
}
```

**Access Control**:
- **Guards**: `JwtAuthGuard`, `RolesGuard`, `DepartmentsGuard`, `PermissionsGuard`
- **Department**: `Accounts`
- **Permission**: `expenses_permission`

### 2. Get All Expenses
**GET** `/accountant/expense`

**Purpose**: Retrieve all expenses with optional filtering

**Query Parameters**:
- `category` (string): Filter by expense category
- `fromDate` (string): Filter from date (YYYY-MM-DD)
- `toDate` (string): Filter to date (YYYY-MM-DD)
- `createdBy` (number): Filter by employee who created
- `minAmount` (number): Minimum amount filter
- `maxAmount` (number): Maximum amount filter
- `paymentMethod` (string): Filter by payment method
- `processedByRole` (string): Filter by processor role

**Example Request**:
```
GET /accountant/expense?category=Office&fromDate=2025-08-01&toDate=2025-08-31&minAmount=100&maxAmount=500
```

**Response**:
```json
{
  "status": "success",
  "message": "Expenses retrieved successfully",
  "data": [
    {
      "id": 1,
      "title": "Office Supplies",
      "category": "Office Expenses",
      "amount": 250.00,
      "paidOn": "2025-08-07T00:00:00.000Z",
      "paymentMethod": "bank",
      "vendorId": 1,
      "createdBy": 50,
      "transactionId": 25,
      "createdAt": "2025-08-07T10:30:00.000Z",
      "updatedAt": "2025-08-07T10:30:00.000Z",
      "transaction": { /* transaction details */ },
      "vendor": { /* vendor details */ },
      "employee": { "id": 50 }
    }
  ],
  "total": 1
}
```

### 3. Get Expense by ID
**GET** `/accountant/expense/:id`

**Purpose**: Retrieve a single expense by ID

**Response**:
```json
{
  "status": "success",
  "message": "Expense retrieved successfully",
  "data": {
    "id": 1,
    "title": "Office Supplies",
    "category": "Office Expenses",
    "amount": 250.00,
    "paidOn": "2025-08-07T00:00:00.000Z",
    "paymentMethod": "bank",
    "vendorId": 1,
    "createdBy": 50,
    "transactionId": 25,
    "createdAt": "2025-08-07T10:30:00.000Z",
    "updatedAt": "2025-08-07T10:30:00.000Z",
    "transaction": { /* transaction details */ },
    "vendor": { /* vendor details */ },
    "employee": { "id": 50 }
  }
}
```

### 4. Update Expense
**PATCH** `/accountant/expense`

**Purpose**: Update an existing expense record

**Request Body**:
```json
{
  "expense_id": 1,
  "title": "Updated Office Supplies",
  "amount": 300.00,
  "paymentMethod": "online"
}
```

**Response**:
```json
{
  "status": "success",
  "message": "Expense updated successfully",
  "data": {
    "expense": { /* updated expense details */ },
    "transaction": { /* updated transaction details */ }
  }
}
```

## Business Logic

### Transaction Linking
- Every expense automatically creates a linked transaction record
- Transaction type: `TransactionType.expense`
- Transaction status: `TransactionStatus.completed`
- Transaction amount matches expense amount
- Transaction notes include expense title and category

### Vendor Support
- Vendor ID is optional (for small daily expenses)
- If vendor is provided, it's validated before creation
- Vendor details are included in responses

### ID Handling
- Implements `MAX(id) + 1` strategy to handle manual database insertions
- Prevents unique constraint errors on transaction_id

### Error Handling
- Comprehensive error responses with specific error codes
- Handles database constraint violations gracefully
- Returns structured error messages instead of throwing exceptions

## Data Models

### CreateExpenseDto
```typescript
export class CreateExpenseDto {
  @IsString()
  title: string;

  @IsString()
  category: string;

  @IsNumber()
  @IsPositive()
  amount: number;

  @IsOptional()
  @IsDateString()
  paidOn?: string;

  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  vendorId?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
```

### UpdateExpenseDto
```typescript
export class UpdateExpenseDto {
  @IsNumber()
  @IsPositive()
  expense_id: number;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  amount?: number;

  @IsOptional()
  @IsDateString()
  paidOn?: string;

  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  vendorId?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
```

## Database Relationships

### Expense Model
- Links to `Transaction` via `transactionId`
- Links to `Vendor` via `vendorId` (optional)
- Links to `Employee` via `createdBy`

### Transaction Model
- Links to `Vendor` via `vendorId`
- Links to `Employee` via `employeeId`
- Contains expense amount and payment details

## Filtering Capabilities

### Supported Filters
1. **Category**: Exact match filtering
2. **Date Range**: From and to date filtering
3. **Amount Range**: Min and max amount filtering
4. **Created By**: Employee who created the expense
5. **Payment Method**: Payment method filtering
6. **Processed By Role**: Role-based filtering

### Filter Examples
```typescript
// Category filter
GET /accountant/expense?category=Office

// Date range filter
GET /accountant/expense?fromDate=2025-08-01&toDate=2025-08-31

// Amount range filter
GET /accountant/expense?minAmount=100&maxAmount=500

// Combined filters
GET /accountant/expense?category=Office&fromDate=2025-08-01&minAmount=100
```

## Error Codes

### Common Error Codes
- `VENDOR_NOT_FOUND`: Specified vendor doesn't exist
- `MISSING_EXPENSE_ID`: Expense ID is required for updates
- `EXPENSE_NOT_FOUND`: Expense record not found
- `P2002`: Unique constraint violation
- `P2003`: Foreign key constraint violation
- `P2025`: Record not found for update

### Error Response Format
```json
{
  "status": "error",
  "message": "Vendor not found",
  "error_code": "VENDOR_NOT_FOUND"
}
```

## Security & Permissions

### Authentication
- All endpoints require JWT authentication
- User context is extracted from JWT token

### Authorization
- Department-level access control (Accounts department only)
- Permission-based access control (expenses_permission required)
- Role-based access control

### Guards Used
1. `JwtAuthGuard`: Validates JWT token
2. `RolesGuard`: Validates user roles
3. `DepartmentsGuard`: Validates department access
4. `PermissionsGuard`: Validates specific permissions

## Testing Examples

### Create Expense Test Data
```json
{
  "title": "Server Hosting",
  "category": "IT Infrastructure",
  "amount": 1200.00,
  "paidOn": "2025-08-07",
  "paymentMethod": "online",
  "vendorId": 2,
  "notes": "Monthly AWS hosting bill"
}
```

### Update Expense Test Data
```json
{
  "expense_id": 1,
  "title": "Updated Server Hosting",
  "amount": 1500.00,
  "paymentMethod": "bank"
}
```

## Integration Points

### With Other Modules
- **Vendor Module**: Validates vendor existence
- **Employee Module**: Links to employee who created expense
- **Transaction Module**: Creates linked transaction records

### Database Tables
- `expenses`: Main expense records
- `transactions`: Linked transaction records
- `vendors`: Vendor information (optional)
- `employees`: Employee information

## Performance Considerations

### Database Optimization
- Proper indexing on frequently queried fields
- Efficient filtering with Prisma query optimization
- Pagination support for large datasets

### Caching Strategy
- Consider caching frequently accessed expense data
- Implement cache invalidation on expense updates

## Monitoring & Logging

### Logging
- Comprehensive logging for all operations
- Error logging with stack traces
- Audit trail for expense modifications

### Metrics
- Track expense creation/update frequency
- Monitor API response times
- Track error rates and types

## Future Enhancements

### Planned Features
1. **Bulk Operations**: Create/update multiple expenses
2. **File Attachments**: Support for expense receipts
3. **Approval Workflow**: Multi-level approval process
4. **Reporting**: Advanced expense analytics
5. **Export Functionality**: CSV/PDF export capabilities

### API Versioning
- Current version: v1
- Backward compatibility maintained
- Version-specific endpoints planned

## Troubleshooting

### Common Issues
1. **Unique Constraint Errors**: Handled with MAX(id) + 1 strategy
2. **Vendor Validation**: Ensure vendor exists before creating expense
3. **Date Format**: Use ISO date format (YYYY-MM-DD)
4. **Permission Errors**: Verify user has expenses_permission

### Debug Information
- Console logging for filter operations
- Detailed error messages with context
- Database query logging in development mode
