# Finance Module API Documentation

## Overview
The Finance module handles salary calculations, commission management, and financial operations for employees. This module provides endpoints for calculating salaries, assigning commissions, managing withhold flags, and transferring commission amounts between different accounts.

## Base URL
```
http://localhost:3000/salary
```

---

## API Endpoints

### 1. Calculate Salary
**Title**: Calculate Employee Salary  
**Endpoint**: `/calculate`  
**Method**: `POST`  
**Description**: Calculates salary for an employee based on base salary, commission, and bonuses. Handles new-join, normal monthly, and termination scenarios.

#### Request Body
```json
{
  "employee_id": 123,
  "start_date": "2025-01-01",  // Optional
  "end_date": "2025-01-31"     // Optional
}
```

#### Request Body Constraints
- **employee_id**: Required integer - must be a valid employee ID
- **start_date**: Optional string - date in YYYY-MM-DD format
- **end_date**: Optional string - date in YYYY-MM-DD format

#### Validations
- `@IsInt()` for employee_id
- `@IsOptional()` and `@IsString()` for start_date and end_date

#### Response
```json
{
  "message": "successfully created"
}
```

#### Backend Database Operations
1. **Employee Lookup**: Fetches employee details from `employees` table
2. **Account Lookup**: Retrieves base salary from `accounts` table
3. **Sales Department Lookup**: Gets commission and bonus from `sales_departments` table
4. **Salary Calculation**: Computes net salary using base salary + commission + bonus
5. **Salary Logging**: Creates entry in `net_salary_logs` table with calculated salary

#### Error Handling
- Employee not found
- No base salary set for employee
- Invalid date formats

---

### 2. Assign Commission
**Title**: Assign Commission to Sales Employee  
**Endpoint**: `/commission/assign`  
**Method**: `POST`  
**Description**: Assigns commission to a sales employee when a project is completed. Calculates commission based on cracked lead amount and sales department commission rate.

#### Request Body
```json
{
  "project_id": 456
}
```

#### Request Body Constraints
- **project_id**: Required integer - must be a valid project ID

#### Validations
- `@IsInt()` for project_id

#### Response
```json
{
  "status": "success",
  "message": "Commission assigned",
  "employee_id": 123,
  "commission_amount": 1500.00,
  "withheld": false
}
```

#### Backend Database Operations
1. **Project Validation**: Checks if project exists and is completed
2. **Cracked Lead Lookup**: Retrieves cracked lead data for the project
3. **Sales Department Lookup**: Gets employee's sales department record
4. **Commission Calculation**: Calculates commission using lead amount × commission rate
5. **Commission Assignment**: Updates either `commission_amount` or `withhold_commission` based on withhold flag
6. **Database Update**: Updates `sales_departments` table

#### Error Handling
- Project does not exist
- Project not completed
- Cracked lead not found
- Invalid commission data
- User not found
- Commission rate not set

---

### 3. Update Withhold Flag
**Title**: Update Commission Withhold Flag  
**Endpoint**: `/commission/withhold-flag`  
**Method**: `POST`  
**Description**: Updates the withhold flag for a sales employee. Controls whether future commissions are added to regular commission amount or withheld commission.

#### Request Body
```json
{
  "employee_id": 123,
  "flag": true
}
```

#### Request Body Constraints
- **employee_id**: Required integer - must be a valid employee ID
- **flag**: Required boolean - true to withhold, false to release

#### Validations
- `@IsInt()` for employee_id
- `@IsBoolean()` for flag

#### Response
```json
{
  "status": "success",
  "message": "Withhold flag updated",
  "employee_id": 123,
  "new_flag": true
}
```

#### Backend Database Operations
1. **Employee Validation**: Checks if employee exists
2. **Sales Department Lookup**: Retrieves sales department record for employee
3. **Flag Change Validation**: Ensures flag is actually changing
4. **Database Update**: Updates `withhold_flag` in `sales_departments` table

#### Error Handling
- Employee does not exist
- Sales department record not found
- Flag already set to requested value

---

### 4. Transfer Commission
**Title**: Transfer Commission Between Accounts  
**Endpoint**: `/commission/transfer`  
**Method**: `POST`  
**Description**: Transfers commission amounts between `commission_amount` and `withhold_commission` accounts. Can transfer specific amounts or full available amounts.

#### Request Body
```json
{
  "employee_id": 123,
  "amount": 1000.00,
  "direction": "release"
}
```

#### Request Body Constraints
- **employee_id**: Required integer - must be a valid employee ID
- **amount**: Required number ≥ 0 - amount to transfer (0 = transfer full available)
- **direction**: Required enum - "release" (withhold → commission) or "withhold" (commission → withhold)

#### Validations
- `@IsInt()` for employee_id
- `@IsNumber()` and `@Min(0)` for amount
- `@IsEnum(TransferDirection)` for direction

#### Response
```json
{
  "status": "success",
  "message": "Commission released",
  "employee_id": 123,
  "transferred_amount": 1000.00,
  "from": "withhold_commission",
  "to": "commission_amount",
  "new_balances": {
    "commission_amount": 2500.00,
    "withhold_commission": 500.00
  }
}
```

#### Backend Database Operations
1. **Employee Validation**: Checks if employee exists
2. **Sales Department Lookup**: Retrieves current commission balances
3. **Transfer Calculation**: Determines source and destination fields
4. **Amount Validation**: Ensures sufficient funds available
5. **Balance Updates**: Updates both `commission_amount` and `withhold_commission` fields
6. **Database Update**: Atomically updates `sales_departments` table

#### Error Handling
- Employee does not exist
- Sales department record not found
- No funds available in source account
- Insufficient funds for requested transfer

---

## Database Schema

### Relevant Tables

#### `employees`
- `id` (Primary Key) - Employee ID
- `firstName`, `lastName` - Employee name
- `status` - Employee status (active, terminated, inactive)
- `startDate`, `endDate` - Employment dates
- `bonus` - Employee bonus amount

#### `accounts`
- `employeeId` (Foreign Key) - References employees.id
- `baseSalary` - Employee's base salary

#### `sales_departments`
- `id` (Primary Key) - Sales department record ID
- `employeeId` (Foreign Key) - References employees.id
- `commissionAmount` - Available commission amount
- `withholdCommission` - Withheld commission amount
- `withholdFlag` - Boolean flag for commission withholding
- `commissionRate` - Commission rate percentage
- `bonus` - Sales department bonus
- `salesAmount` - Total sales amount
- `leadsClosed` - Number of leads closed

#### `projects`
- `id` (Primary Key) - Project ID
- `status` - Project status (completed, in_progress, etc.)
- `crackedLeadId` (Foreign Key) - References cracked_leads.id

#### `cracked_leads`
- `id` (Primary Key) - Cracked lead ID
- `amount` - Lead amount
- `closedBy` (Foreign Key) - References employees.id
- `commissionRate` - Commission rate for this lead

#### `net_salary_logs`
- `id` (Primary Key) - Salary log ID
- `employeeId` (Foreign Key) - References employees.id
- `baseSalary` - Base salary amount
- `commission` - Commission amount
- `bonus` - Bonus amount
- `netSalary` - Final net salary
- `month` - Salary month (YYYY-MM format)
- `processedBy` (Foreign Key) - References employees.id

---

## Error Codes and Messages

| Error Type | Message | HTTP Status |
|------------|---------|-------------|
| Employee Not Found | "Employee does not exist" | 400 |
| Sales Department Not Found | "Sales department record not found for employee" | 400 |
| Project Not Found | "Project does not exist" | 400 |
| Project Not Completed | "Project must be completed first" | 400 |
| No Base Salary | "No base salary set for employee" | 400 |
| Insufficient Funds | "Insufficient funds in [account]. Available: X, Requested: Y" | 400 |
| No Funds Available | "No funds available in [account] to transfer" | 400 |
| Flag Already Set | "Withhold flag is already set to the requested value" | 400 |
| Validation Error | Various validation messages | 400 |

---

## Usage Examples

### Calculate Monthly Salary
```bash
curl -X POST http://localhost:3000/salary/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "employee_id": 123,
    "start_date": "2025-01-01",
    "end_date": "2025-01-31"
  }'
```

### Assign Commission for Completed Project
```bash
curl -X POST http://localhost:3000/salary/commission/assign \
  -H "Content-Type: application/json" \
  -d '{
    "project_id": 456
  }'
```

### Enable Commission Withholding
```bash
curl -X POST http://localhost:3000/salary/commission/withhold-flag \
  -H "Content-Type: application/json" \
  -d '{
    "employee_id": 123,
    "flag": true
  }'
```

### Release All Withheld Commission
```bash
curl -X POST http://localhost:3000/salary/commission/transfer \
  -H "Content-Type: application/json" \
  -d '{
    "employee_id": 123,
    "amount": 0,
    "direction": "release"
  }'
```

### Transfer Specific Amount to Withhold
```bash
curl -X POST http://localhost:3000/salary/commission/transfer \
  -H "Content-Type: application/json" \
  -d '{
    "employee_id": 123,
    "amount": 500.00,
    "direction": "withhold"
  }'
```

---

## Notes

1. **Validation**: All endpoints use class-validator decorators for input validation
2. **Error Handling**: Comprehensive error handling with descriptive messages
3. **Logging**: All operations are logged for debugging and audit purposes
4. **Atomic Operations**: Database updates are performed atomically to ensure data consistency
5. **Decimal Precision**: Financial calculations use Prisma Decimal for precision
6. **Permissions**: Permission decorators are commented out but ready for implementation 