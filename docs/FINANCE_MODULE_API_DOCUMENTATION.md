# Finance Module API Documentation

## Overview
The Finance module handles salary calculations, commission assignments, and automated salary processing. It includes smart calculation logic that automatically determines calculation periods based on employee status and provides comprehensive error handling.

---

## API Endpoints

### 1. Calculate Salary (Manual)

**Title:** Calculate Employee Salary  
**Endpoint:** `/salary/calculate`  
**Method:** `POST`  
**Description:** Calculates salary for a specific employee with smart period determination or custom date ranges.

#### Request Body

**Option 1: Smart Calculation (Recommended)**
```json
{
  "employee_id": 15
}
```

**Option 2: Custom Date Range**
```json
{
  "employee_id": 15,
  "start_date": "2025-07-01",
  "end_date": "2025-07-31"
}
```

#### Parameters
| Parameter | Type | Required | Description | Validation |
|-----------|------|----------|-------------|------------|
| `employee_id` | `number` | ✅ Yes | ID of the employee to calculate salary for | Must be a valid integer |
| `start_date` | `string` | ❌ No | Start date for calculation in YYYY-MM-DD format | Must be valid date string (YYYY-MM-DD) |
| `end_date` | `string` | ❌ No | End date for calculation in YYYY-MM-DD format | Must be valid date string (YYYY-MM-DD) |

#### Response
**Success (200):**
```json
{
  "message": "successfully created"
}
```

**Error Responses:**
- **400 Bad Request:**
  ```json
  {
    "message": "No base salary set for employee ID 15",
    "error": "Bad Request",
    "statusCode": 400
  }
  ```

- **404 Not Found:**
  ```json
  {
    "message": "Employee with ID 15 not found",
    "error": "Not Found",
    "statusCode": 404
  }
  ```

#### Backend Logic & Database Operations

**Smart Calculation Logic (when no dates provided):**

1. **Employee Data Retrieval:**
   ```sql
   SELECT id, startDate, endDate, status, bonus 
   FROM employee 
   WHERE id = 15
   ```

2. **Salary Information Retrieval:**
   ```sql
   SELECT baseSalary FROM account WHERE employeeId = 15
   SELECT commissionAmount, bonus FROM salesDepartment WHERE employeeId = 15
   ```

3. **Calculation Period Determination:**
   - **New Employee (started this month):** Calculate from `startDate` to current date/end date
   - **Old Employee (started previous months):** Calculate from 1st of month to current date/end date
   - **Terminated Employee:** Calculate from 1st of month or start date to `endDate`

4. **Salary Calculation:**
   - Daily rate = `baseSalary / 30` (standard 30-day month)
   - Days worked = calculated based on period
   - Prorated salary = `dailyRate × daysWorked`
   - Net salary = `proratedSalary + commission + bonus`

5. **Database Operations:**
   - **Check for existing record:** Query `net_salary_logs` for employee and month
   - **Update existing:** If record exists, update salary and timestamp
   - **Create new:** If no record exists, create new entry

**Custom Date Range Logic (when dates provided):**
- Uses `calculateSalary()` method instead of `calculateSalaryManual()`
- Calculates exact period between provided dates
- Prorates salary based on actual days worked

#### Constraints & Validations

**Input Constraints:**
- `employee_id` must be a positive integer
- `start_date` and `end_date` must be in YYYY-MM-DD format
- Dates must be valid calendar dates
- `end_date` should be after `start_date` (when both provided)

**Business Logic Constraints:**
- Employee must exist in the database
- Employee must have a base salary set in `account` table
- Calculation period cannot exceed 30 days (standard month)
- Only one salary record per employee per month (updates existing)

**Database Constraints:**
- Employee record must exist in `employee` table
- Account record must exist with `baseSalary`
- `net_salary_logs` table enforces unique employee-month combinations

#### Authentication & Authorization
- **Guards:** `JwtAuthGuard`, `RolesGuard`, `DepartmentsGuard`, `PermissionsGuard`
- **Required Departments:** `HR`, `Accounts`
- **Required Permission:** `salary_permission`

---

### 2. Calculate All Employees (Auto)

**Title:** Calculate Salary for All Active Employees  
**Endpoint:** `/salary/auto`  
**Method:** `POST`  
**Description:** Triggers salary calculation for all active employees (excludes terminated employees).

#### Request Body
```json
{}
```
*No body required*

#### Response
**Success (200):**
```json
{
  "message": "Salary calculation triggered for all employees"
}
```

#### Backend Logic & Database Operations

1. **Active Employee Retrieval:**
   ```sql
   SELECT id, startDate 
   FROM employee 
   WHERE status = 'active'
   ```

2. **Per Employee Processing:**
   - For each active employee, calls `calculateSalary()` or `calculateSalaryManual()`
   - New employees: Calculate from start date
   - Regular employees: Calculate full month
   - Handles errors individually (continues processing other employees)

3. **Logging:**
   - Logs start and completion of batch process
   - Logs individual employee processing results
   - Logs any errors encountered

#### Constraints & Validations
- Only processes employees with `status = 'active'`
- Excludes terminated employees
- Continues processing even if individual employees fail
- Logs all errors for debugging

---

### 3. Assign Commission

**Title:** Assign Commission to Sales Employee  
**Endpoint:** `/salary/commission/assign`  
**Method:** `POST`  
**Description:** Assigns commission to sales employee when a project is completed.

#### Request Body
```json
{
  "project_id": 123
}
```

#### Parameters
| Parameter | Type | Required | Description | Validation |
|-----------|------|----------|-------------|------------|
| `project_id` | `number` | ✅ Yes | ID of the completed project | Must be a valid integer |

#### Response
**Success (200):**
```json
{
  "status": "success",
  "message": "Commission assigned",
  "employee_id": 15,
  "commission_amount": 1500.00,
  "withheld": false
}
```

**Error Responses:**
- **404 Not Found:**
  ```json
  {
    "message": "Project does not exist",
    "error": "Not Found",
    "statusCode": 404
  }
  ```

- **502 Bad Gateway:**
  ```json
  {
    "message": "Project must be completed first",
    "error": "Bad Gateway",
    "statusCode": 502
  }
  ```

#### Backend Logic & Database Operations

1. **Project Validation:**
   ```sql
   SELECT id, status, crackedLeadId 
   FROM project 
   WHERE id = 123
   ```

2. **Cracked Lead Retrieval:**
   ```sql
   SELECT id, amount, closedBy 
   FROM crackedLead 
   WHERE id = [crackedLeadId]
   ```

3. **Sales Department Lookup:**
   ```sql
   SELECT commissionRate, withholdFlag, commissionAmount, withholdCommission 
   FROM salesDepartment 
   WHERE employeeId = [closedBy]
   ```

4. **Commission Calculation:**
   - Commission = `crackedLead.amount × (commissionRate / 100)`
   - If `withholdFlag = true`: Add to `withholdCommission`
   - If `withholdFlag = false`: Add to `commissionAmount`

5. **Database Update:**
   ```sql
   UPDATE salesDepartment 
   SET commissionAmount = commissionAmount + calculatedCommission,
       updatedAt = NOW()
   WHERE employeeId = [closedBy]
   ```

#### Constraints & Validations

**Input Constraints:**
- `project_id` must be a positive integer
- Project must exist in database
- Project status must be 'completed'
- Project must have an associated cracked lead

**Business Logic Constraints:**
- Only completed projects can have commission assigned
- Employee must have commission rate set
- Commission calculation based on lead amount and rate

**Database Constraints:**
- Project must exist in `project` table
- Cracked lead must exist and have valid amount
- Sales department record must exist for employee

---

### 4. Transfer Commission

**Title:** Transfer Commission Between Withhold and Release  
**Endpoint:** `/salary/commission/transfer`  
**Method:** `POST`  
**Description:** Transfers commission between withhold_commission and commission_amount fields for a specific employee.

#### Request Body
```json
{
  "employee_id": 15,
  "amount": 5000,
  "direction": "release"
}
```

#### Request Body Constraints
- `employee_id`: Must be a valid employee ID
- `amount`: Must be a positive number (0 for full amount)
- `direction`: Must be either "release" or "withhold"

#### Validations
- Employee must exist and be active
- Employee must have a sales department record
- Sufficient funds must be available in source field

#### Response
**Success (200):**
```json
{
  "status": "success",
  "message": "Commission released",
  "employee_id": 15,
  "transferred_amount": 5000.00,
  "from": "withhold_commission",
  "to": "commission_amount",
  "new_balances": {
    "commission_amount": 15000.00,
    "withhold_commission": 5000.00
  }
}
```

**Error Responses:**
- **400 Bad Request:**
  ```json
  {
    "message": "Insufficient funds in withhold_commission. Available: 3000.00, Requested: 5000.00",
    "error": "Bad Request",
    "statusCode": 400
  }
  ```

#### Backend Database Operations
```sql
-- Update sales department record
UPDATE sales_departments 
SET withhold_commission = 5000.00, commission_amount = 15000.00, updated_at = NOW()
WHERE employee_id = 15;
```

#### Error Handling
- Insufficient funds in source field
- Employee not found
- Sales department record not found
- Invalid transfer direction

### 5. Get Salary Display for Employee

**Title:** Get Salary Display with Deductions  
**Endpoint:** `/salary/display/:employeeId`  
**Method:** `GET`  
**Description:** Retrieves salary display information for a specific employee including all deduction types (attendance, chargeback, refund).

#### Request Headers
```
Authorization: Bearer <jwt_token>
```

#### Path Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `employeeId` | `number` | ✅ Yes | ID of the employee |

#### Query Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `month` | `string` | ❌ No | Month in YYYY-MM format (defaults to current month) |

#### Response
**Success (200):**
```json
{
  "employeeId": 1,
  "employeeName": "John Doe",
  "month": "2025-01",
  "netSalary": 30000,
  "attendanceDeductions": 4000,
  "chargebackDeduction": 1000,
  "refundDeduction": 500,
  "deductions": 5500,
  "finalSalary": 24500,
  "status": "unpaid",
  "paidOn": null,
  "createdAt": "2025-01-15T10:30:00Z"
}
```

**Error Responses:**
- **400 Bad Request:**
  ```json
  {
    "message": "Invalid employeeId. Must be a positive number.",
    "error": "Bad Request",
    "statusCode": 400
  }
  ```

- **404 Not Found:**
  ```json
  {
    "message": "No salary record found for employee John Doe (ID: 1) for month 2025-01. Please calculate salary first.",
    "error": "Not Found",
    "statusCode": 404
  }
  ```

### 6. Get All Salaries Display

**Title:** Get All Employees Salary Display  
**Endpoint:** `/salary/display`  
**Method:** `GET`  
**Description:** Retrieves comprehensive salary information for all active employees including detailed deduction breakdown.

#### Request Headers
```
Authorization: Bearer <jwt_token>
```

#### Query Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `month` | `string` | ❌ No | Month in YYYY-MM format (defaults to current month) |

#### Response
**Success (200):**
```json
{
  "month": "2025-01",
  "totalEmployees": 5,
  "totalBaseSalary": 150000,
  "totalCommission": 25000,
  "totalEmployeeBonus": 10000,
  "totalSalesBonus": 15000,
  "totalBonus": 25000,
  "totalAttendanceDeductions": 15000,
  "totalChargebackDeductions": 3000,
  "totalRefundDeductions": 2000,
  "totalDeductions": 20000,
  "totalFinalSalary": 170000,
  "results": [
    {
      "employeeId": 1,
      "firstName": "John",
      "lastName": "Doe",
      "departmentName": "Sales",
      "fullBaseSalary": 30000,
      "baseSalary": 30000,
      "commission": 5000,
      "employeeBonus": 2000,
      "salesBonus": 3000,
      "totalBonus": 5000,
      "attendanceDeductions": 3000,
      "chargebackDeduction": 1000,
      "refundDeduction": 500,
      "deductions": 4500,
      "finalSalary": 34500,
      "status": "unpaid",
      "paidOn": null,
      "createdAt": "2025-01-15T10:30:00Z"
    }
  ]
}
```

### 7. Get Detailed Salary Breakdown

**Title:** Get Detailed Salary Breakdown for Employee  
**Endpoint:** `/salary/display/:employeeId/detailed`  
**Method:** `GET`  
**Description:** Provides comprehensive salary breakdown including commission details and detailed deduction breakdown.

#### Request Headers
```
Authorization: Bearer <jwt_token>
```

#### Path Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `employeeId` | `number` | ✅ Yes | ID of the employee |

#### Query Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `month` | `string` | ❌ No | Month in YYYY-MM format (defaults to current month) |

#### Response
**Success (200):**
```json
{
  "employee": {
    "id": 1,
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "departmentName": "Sales",
    "status": "active",
    "startDate": "2024-01-15T00:00:00.000Z"
  },
  "salary": {
    "month": "2025-01",
    "fullBaseSalary": 30000,
    "baseSalary": 30000,
    "commission": 5000,
    "employeeBonus": 2000,
    "salesBonus": 3000,
    "totalBonus": 5000,
    "attendanceDeductions": 4000,
    "chargebackDeduction": 1000,
    "refundDeduction": 500,
    "deductions": 5500,
    "finalSalary": 34500,
    "status": "unpaid",
    "paidOn": null,
    "createdAt": "2025-01-15T10:30:00Z"
  },
  "commissionBreakdown": [
    {
      "projectId": 1,
      "projectName": "Project 1",
      "clientName": "ABC Company",
      "projectValue": 50000,
      "commissionRate": 10,
      "commissionAmount": 5000,
      "completedAt": "2025-01-20T00:00:00.000Z",
      "status": "completed"
    }
  ],
  "deductionBreakdown": {
    "totalAbsent": 2,
    "totalLateDays": 5,
    "totalHalfDays": 1,
    "monthlyLatesDays": 3,
    "absentDeduction": 4000,
    "lateDeduction": 3000,
    "halfDayDeduction": 500,
    "chargebackDeduction": 1000,
    "refundDeduction": 500,
    "totalDeduction": 9000,
    "perDaySalary": 1000,
    "absentDetails": [
      {
        "day": 1,
        "deduction": 2000,
        "reason": "Absent"
      }
    ],
    "lateDetails": [
      {
        "day": 1,
        "deduction": 1000,
        "reason": "Late (excess)"
      }
    ],
    "halfDayDetails": [
      {
        "date": "2025-01-15T00:00:00.000Z",
        "day": 15,
        "reason": "Half Day",
        "deduction": 500
      }
    ]
  }
}
```

---

## Automated Processes

### Monthly Salary Calculation (Cron Job)

**Schedule:** 4th of every month at 5:00 PM PKT  
**Method:** `@Cron('0 17 4 * *', { timeZone: 'Asia/Karachi' })`  
**Description:** Automatically calculates salary for all active employees.

#### Logic
1. **Trigger:** Runs automatically on schedule
2. **Employee Processing:** Same as `/salary/auto` endpoint
3. **Error Handling:** Logs errors but doesn't stop processing
4. **Logging:** Comprehensive logging of start, progress, and completion

---

## Database Schema Impact

### Primary Tables
- **`net_salary_logs`:** Stores calculated salary records
  - `employeeId`: Reference to employee
  - `month`: Month in YYYY-MM format
  - `netSalary`: Calculated net salary
  - `deductions`: Deduction amount (default 0)
  - `processedBy`: Who processed (null for auto)
  - `paidOn`: Payment date (null initially)

### Related Tables
- **`employee`:** Employee information and status
- **`account`:** Base salary information
- **`salesDepartment`:** Commission and bonus data
- **`project`:** Project completion status
- **`crackedLead`:** Lead amount for commission calculation

---

## Error Codes Summary

| HTTP Status | Error Type | Description |
|-------------|------------|-------------|
| 400 | Bad Request | No base salary set, invalid date format, missing required fields |
| 404 | Not Found | Employee not found, project not found |
| 502 | Bad Gateway | Project not completed, business logic violations |
| 500 | Internal Server Error | Database connection issues, unexpected errors |

---

## Usage Examples

### Smart Salary Calculation
```bash
curl -X POST http://localhost:3000/salary/calculate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <jwt_token>" \
  -d '{
    "employee_id": 15
  }'
```

### Custom Date Range Calculation
```bash
curl -X POST http://localhost:3000/salary/calculate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <jwt_token>" \
  -d '{
    "employee_id": 15,
    "start_date": "2025-07-01",
    "end_date": "2025-07-25"
  }'
```

### Auto Calculate All Employees
```bash
curl -X POST http://localhost:3000/salary/auto \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <jwt_token>"
```

### Assign Commission
```bash
curl -X POST http://localhost:3000/salary/commission/assign \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <jwt_token>" \
  -d '{
    "project_id": 123
  }'
```

### Transfer Commission
```bash
curl -X POST http://localhost:3000/salary/commission/transfer \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <jwt_token>" \
  -d '{
    "employee_id": 15,
    "amount": 5000,
    "direction": "release"
  }'
```

### Get Salary Display for Employee
```bash
curl -X GET http://localhost:3000/salary/display/1 \
  -H "Authorization: Bearer <jwt_token>"
```

### Get All Salaries Display
```bash
curl -X GET http://localhost:3000/salary/display \
  -H "Authorization: Bearer <jwt_token>"
```

### Get Detailed Salary Breakdown
```bash
curl -X GET http://localhost:3000/salary/display/1/detailed \
  -H "Authorization: Bearer <jwt_token>"
```

---

## Key Features

### Smart Calculation Logic
- **New Employees:** Calculates from start date to current/end date
- **Old Employees:** Calculates from 1st of month to current/end date  
- **Terminated Employees:** Calculates from 1st of month or start date to termination date
- **Automatic Period Detection:** No need to specify dates for most cases

### Duplicate Prevention
- Only one salary record per employee per month
- Updates existing records instead of creating duplicates
- Maintains data integrity in `net_salary_logs` table

### Comprehensive Error Handling
- Proper HTTP status codes
- Descriptive error messages
- Individual error handling for batch operations
- Detailed logging for debugging

### Integration
- Seamless integration with HR module for termination processing
- Automatic salary calculation on employee termination
- Commission assignment based on project completion 




#Ghalib version
# Finance Module API Documentation

## Overview
The Finance module handles salary calculations, commission management, and financial operations for employees. This module provides endpoints for calculating salaries, assigning commissions, managing withhold flags, and transferring commission amounts between different accounts.

## Base URL
```
http://localhost:3000/salary
```

---

## API Endpoints

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

### 5. Get Salary Display for Employee
**Title**: Get Salary Display with Deductions  
**Endpoint**: `/salary/display/:employeeId`  
**Method**: `GET`  
**Description**: Retrieves salary display information for a specific employee including all deduction types (attendance, chargeback, refund).

#### Request Headers
```
Authorization: Bearer <jwt_token>
```

#### Path Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `employeeId` | `number` | ✅ Yes | ID of the employee |

#### Query Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `month` | `string` | ❌ No | Month in YYYY-MM format (defaults to current month) |

#### Response
```json
{
  "employeeId": 1,
  "employeeName": "John Doe",
  "month": "2025-01",
  "netSalary": 30000,
  "attendanceDeductions": 4000,
  "chargebackDeduction": 1000,
  "refundDeduction": 500,
  "deductions": 5500,
  "finalSalary": 24500,
  "status": "unpaid",
  "paidOn": null,
  "createdAt": "2025-01-15T10:30:00Z"
}
```

#### Error Handling
- Employee does not exist
- No salary record found for the employee
- Invalid month format

---

### 6. Get All Salaries Display
**Title**: Get All Employees Salary Display  
**Endpoint**: `/salary/display`  
**Method**: `GET`  
**Description**: Retrieves comprehensive salary information for all active employees including detailed deduction breakdown.

#### Request Headers
```
Authorization: Bearer <jwt_token>
```

#### Query Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `month` | `string` | ❌ No | Month in YYYY-MM format (defaults to current month) |

#### Response
```json
{
  "month": "2025-01",
  "totalEmployees": 5,
  "totalBaseSalary": 150000,
  "totalCommission": 25000,
  "totalEmployeeBonus": 10000,
  "totalSalesBonus": 15000,
  "totalBonus": 25000,
  "totalAttendanceDeductions": 15000,
  "totalChargebackDeductions": 3000,
  "totalRefundDeductions": 2000,
  "totalDeductions": 20000,
  "totalFinalSalary": 170000,
  "results": [
    {
      "employeeId": 1,
      "firstName": "John",
      "lastName": "Doe",
      "departmentName": "Sales",
      "fullBaseSalary": 30000,
      "baseSalary": 30000,
      "commission": 5000,
      "employeeBonus": 2000,
      "salesBonus": 3000,
      "totalBonus": 5000,
      "attendanceDeductions": 3000,
      "chargebackDeduction": 1000,
      "refundDeduction": 500,
      "deductions": 4500,
      "finalSalary": 34500,
      "status": "unpaid",
      "paidOn": null,
      "createdAt": "2025-01-15T10:30:00Z"
    }
  ]
}
```

#### Error Handling
- Invalid month format

---

### 7. Get Detailed Salary Breakdown
**Title**: Get Detailed Salary Breakdown for Employee  
**Endpoint**: `/salary/display/:employeeId/detailed`  
**Method**: `GET`  
**Description**: Provides comprehensive salary breakdown including commission details and detailed deduction breakdown.

#### Request Headers
```
Authorization: Bearer <jwt_token>
```

#### Path Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `employeeId` | `number` | ✅ Yes | ID of the employee |

#### Query Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `month` | `string` | ❌ No | Month in YYYY-MM format (defaults to current month) |

#### Response
```json
{
  "employee": {
    "id": 1,
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "departmentName": "Sales",
    "status": "active",
    "startDate": "2024-01-15T00:00:00.000Z"
  },
  "salary": {
    "month": "2025-01",
    "fullBaseSalary": 30000,
    "baseSalary": 30000,
    "commission": 5000,
    "employeeBonus": 2000,
    "salesBonus": 3000,
    "totalBonus": 5000,
    "attendanceDeductions": 4000,
    "chargebackDeduction": 1000,
    "refundDeduction": 500,
    "deductions": 5500,
    "finalSalary": 34500,
    "status": "unpaid",
    "paidOn": null,
    "createdAt": "2025-01-15T10:30:00Z"
  },
  "commissionBreakdown": [
    {
      "projectId": 1,
      "projectName": "Project 1",
      "clientName": "ABC Company",
      "projectValue": 50000,
      "commissionRate": 10,
      "commissionAmount": 5000,
      "completedAt": "2025-01-20T00:00:00.000Z",
      "status": "completed"
    }
  ],
  "deductionBreakdown": {
    "totalAbsent": 2,
    "totalLateDays": 5,
    "totalHalfDays": 1,
    "monthlyLatesDays": 3,
    "absentDeduction": 4000,
    "lateDeduction": 3000,
    "halfDayDeduction": 500,
    "chargebackDeduction": 1000,
    "refundDeduction": 500,
    "totalDeduction": 9000,
    "perDaySalary": 1000,
    "absentDetails": [
      {
        "day": 1,
        "deduction": 2000,
        "reason": "Absent"
      }
    ],
    "lateDetails": [
      {
        "day": 1,
        "deduction": 1000,
        "reason": "Late (excess)"
      }
    ],
    "halfDayDetails": [
      {
        "date": "2025-01-15T00:00:00.000Z",
        "day": 15,
        "reason": "Half Day",
        "deduction": 500
      }
    ]
  }
}
```

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
- `salesBonus` - Sales bonus
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

### Get Salary Display for Employee
```bash
curl -X GET http://localhost:3000/salary/display/1 \
  -H "Authorization: Bearer <jwt_token>"
```

### Get All Salaries Display
```bash
curl -X GET http://localhost:3000/salary/display \
  -H "Authorization: Bearer <jwt_token>"
```

### Get Detailed Salary Breakdown
```bash
curl -X GET http://localhost:3000/salary/display/1/detailed \
  -H "Authorization: Bearer <jwt_token>"
```

---

## Notes

1. **Validation**: All endpoints use class-validator decorators for input validation
2. **Error Handling**: Comprehensive error handling with descriptive messages
3. **Logging**: All operations are logged for debugging and audit purposes
4. **Atomic Operations**: Database updates are performed atomically to ensure data consistency
5. **Decimal Precision**: Financial calculations use Prisma Decimal for precision
6. **Permissions**: Permission decorators are commented out but ready for implementation
