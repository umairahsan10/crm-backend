# Comprehensive HR and Finance API Documentation

This document provides a complete overview of all APIs in the HR and Finance modules, including detailed information on endpoints, request/response structures, validations, database access controls, and affected tables.

## Table of Contents
1. [HR Module APIs](#hr-module-apis)
2. [Finance Module APIs](#finance-module-apis)
   - [Salary Management](#salary-management)
   - [Commission Management](#commission-management)
   - [Accountant Management](#accountant-management)
   - [Vendor Management](#vendor-management)
   - [Profit & Loss (P&L) Management](#profit--loss-pl-management)
3. [Database Schema Overview](#database-schema-overview)
4. [Authentication & Authorization](#authentication--authorization)
5. [Error Handling](#error-handling)

---

## HR Module APIs

The HR module handles employee management, termination, salary calculations, and HR-specific operations.

### 1. Terminate Employee

**Title:** Terminate Employee and Process Final Salary

**Methods and Endpoints:** 
- `POST /hr/terminate`

**Description and Flow:** 
This endpoint allows HR personnel to terminate an employee by:
1. Validating the employee exists and is not already terminated
2. Updating employee status to 'terminated' and setting end date
3. Calculating final salary using smart period determination
4. Creating HR log entry for audit trail
5. Processing final salary calculation

**JSON Body:**
```json
{
  "employee_id": 1,
  "termination_date": "2025-01-31",
  "description": "Voluntary resignation"
}
```

**Required and Optional Fields:**
- `employee_id` (number, required): ID of employee to terminate
- `termination_date` (string, required): Date of termination in YYYY-MM-DD format
- `description` (string, optional): Reason for termination

**Validations:**
- Employee ID must be a valid positive integer
- Termination date must be in YYYY-MM-DD format
- Employee must exist and not be already terminated
- HR employee must have valid HR record

**Sample Responses:**

Success (200):
```json
{
  "message": "Employee terminated and salary processed"
}
```

Error (400):
```json
{
  "statusCode": 400,
  "message": "Invalid date format: 2025-13-31. Please use YYYY-MM-DD format (e.g., 2025-07-31)",
  "error": "Bad Request"
}
```

Error (404):
```json
{
  "statusCode": 404,
  "message": "Employee with ID 999 not found",
  "error": "Not Found"
}
```

**DB Access Controls:** 
- JWT Authentication required
- HR department access required
- `salary_permission` required

**Tables Affected:**
- `employees`: Update status to 'terminated', set endDate
- `net_salary_logs`: Create final salary record via FinanceService
- `hr_logs`: Create termination log entry

---

### 2. Calculate Salary Deductions

**Title:** Calculate Attendance-Based Salary Deductions

**Methods and Endpoints:** 
- `GET /hr/salary/deductions`

**Description and Flow:** 
Calculates attendance-based deductions for employees including:
1. Absent days: 2x per-day salary per absent day
2. Late days: Progressive deduction after monthly allowance
3. Half days: Progressive deduction based on attendance logs
4. Chargeback and refund deductions from sales department

**Query Parameters:**
- `employeeId` (optional): Specific employee ID to calculate for
- `month` (optional): Month in YYYY-MM format (defaults to current month)

**Required and Optional Fields:**
- `employeeId` (number, optional): Specific employee ID
- `month` (string, optional): Month in YYYY-MM format

**Validations:**
- employeeId must be a positive number if provided
- month must be in YYYY-MM format if provided
- month must be between 01-12
- year must be between 2000-2100

**Sample Responses:**

Success (200):
```json
{
  "calculations": [
    {
      "employeeId": 1,
      "employeeName": "John Doe",
      "baseSalary": 30000,
      "perDaySalary": 1000,
      "month": "2025-01",
      "totalPresent": 22,
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
      "netSalary": 21000
    }
  ],
  "summary": {
    "totalEmployees": 1,
    "totalDeductions": 9000,
    "totalNetSalary": 21000
  }
}
```

Error (400):
```json
{
  "statusCode": 400,
  "message": "Invalid employeeId. Must be a positive number.",
  "error": "Bad Request"
}
```

**DB Access Controls:** 
- JWT Authentication required
- HR department access required
- `salary_permission` required

**Tables Affected:**
- `employees`: Read employee data
- `accounts`: Read baseSalary
- `monthly_attendance_summary`: Read attendance data
- `attendance_logs`: Read half-day records
- `companies`: Read monthly_lates_days
- `sales_departments`: Read chargeback/refund deductions

---

### 3. Update Employee Salary

**Title:** Update Employee Base Salary

**Methods and Endpoints:** 
- `PATCH /hr/salary/update`

**Description and Flow:** 
Updates an employee's base salary with restrictions:
1. HR users cannot update their own salary
2. HR users cannot update salary of another HR with salary permission
3. Admins have no restrictions
4. Creates HR log entry for audit

**JSON Body:**
```json
{
  "employee_id": 1,
  "amount": 35000,
  "description": "Annual raise"
}
```

**Required and Optional Fields:**
- `employee_id` (number, required): Employee ID to update
- `amount` (number, required): New base salary amount (minimum 0)
- `description` (string, optional): Reason for salary update

**Validations:**
- employee_id must be a positive integer
- amount must be a positive number
- HR users cannot update their own salary
- HR users cannot update another HR's salary with salary permission

**Sample Responses:**

Success (200):
```json
{
  "message": "Salary updated successfully",
  "newSalary": 35000
}
```

Error (403):
```json
{
  "statusCode": 403,
  "message": "Cannot update own salary",
  "error": "Forbidden"
}
```

**DB Access Controls:** 
- JWT Authentication required
- HR department access required
- `salary_permission` required

**Tables Affected:**
- `accounts`: Update baseSalary
- `hr_logs`: Create update log entry

---

### 4. Mark Salary as Paid

**Title:** Mark Salary as Paid and Create Transactions

**Methods and Endpoints:** 
- `PATCH /hr/salary/mark-paid`

**Description and Flow:** 
Marks salary as paid and performs related operations:
1. Updates salary log status to 'paid'
2. Creates transaction record
3. Creates expense record
4. Resets employee and sales bonuses to zero
5. Creates HR log entry

**JSON Body:**
```json
{
  "employee_id": 1,
  "type": "bank"
}
```

**Required and Optional Fields:**
- `employee_id` (number, required): Employee ID
- `type` (PaymentWays enum, optional): Payment method (bank, credit_card, online, cashapp, cash)

**Validations:**
- employee_id must be a positive integer
- Salary must not already be paid
- Salary record must exist

**Sample Responses:**

Success (200):
```json
{
  "message": "Salary marked as paid"
}
```

Error (400):
```json
{
  "statusCode": 400,
  "message": "Salary already paid",
  "error": "Bad Request"
}
```

**DB Access Controls:** 
- JWT Authentication required
- HR department access required
- `salary_permission` required

**Tables Affected:**
- `net_salary_logs`: Update status to 'paid', set paidOn
- `transactions`: Create salary transaction record
- `expenses`: Create salary expense record
- `employees`: Reset bonus to 0
- `sales_departments`: Reset bonus to 0
- `hr_logs`: Create payment log entry

---

## Finance Module APIs

The Finance module handles salary calculations, commissions, vendor management, P&L automation, and financial operations.

### Salary Management

The salary management APIs handle salary calculations, previews, and payments.

### 1. Auto Calculate All Salaries

**Title:** Trigger Salary Calculation for All Active Employees

**Methods and Endpoints:** 
- `POST /salary/auto`
- `POST /finance/salary/calculate-all`

**Description and Flow:** 
Manually triggers salary calculation for all active employees:
1. Retrieves all active employees
2. Calculates salary for each employee (base + bonus + commissions)
3. Calculates deductions (attendance-based)
4. Stores results in net_salary_logs

**JSON Body:** None

**Required and Optional Fields:** None

**Sample Responses:**

Success (200):
```json
{
  "message": "Salary calculation triggered for all employees"
}
```

**DB Access Controls:** 
- `POST /salary/auto`: No authentication (cron job compatibility)
- `POST /finance/salary/calculate-all`: JWT + `salary_permission` required

**Tables Affected:**
- `employees`: Read active employees
- `accounts`: Read baseSalary
- `sales_departments`: Read commission, bonus
- `net_salary_logs`: Create/update salary records
- Attendance tables for deduction calculations

---

### 2. Salary Preview

**Title:** Read-Only Salary Calculation Preview

**Methods and Endpoints:** 
- `GET /salary/calculate/:employeeId`
- `GET /finance/salary/preview/:employeeId`

**Description and Flow:** 
Calculates salary preview without database updates:
1. Smart period determination (1st of month to current date for old employees, start date to current for new employees)
2. Calculates prorated base salary
3. Calculates bonuses and commissions
4. Calculates deductions
5. Returns detailed breakdown

**Path Parameters:**
- `employeeId` (required): Employee ID

**Query Parameters:**
- `endDate` (optional): End date in YYYY-MM-DD format

**Required and Optional Fields:**
- `employeeId` (path, required): Employee ID
- `endDate` (query, optional): End date for calculation

**Validations:**
- employeeId must be a positive integer
- endDate must be in YYYY-MM-DD format if provided

**Sample Responses:**

Success (200):
```json
{
  "employee": {
    "id": 1,
    "firstName": "John",
    "lastName": "Doe",
    "department": "Sales"
  },
  "calculationPeriod": {
    "startDate": "2025-01-01",
    "endDate": "2025-01-31"
  },
  "salaryBreakdown": {
    "baseSalary": 30000,
    "bonus": 5000,
    "commission": 2000,
    "deductions": 3000,
    "netSalary": 34000
  }
}
```

Error (400):
```json
{
  "statusCode": 400,
  "message": "Invalid employee ID provided",
  "error": "Bad Request"
}
```

**DB Access Controls:** 
- JWT Authentication required
- HR or Accounts department required
- `salary_permission` required

**Tables Affected:** Read-only access to:
- `employees`: Employee data
- `accounts`: Base salary
- `sales_departments`: Bonuses and commissions
- Attendance tables for deductions

---

### 3. Display Employee Salary

**Title:** Get Salary Display for Employee

**Methods and Endpoints:** 
- `GET /salary/display/:employeeId`
- `GET /finance/salary/display/:employeeId`

**Description and Flow:** 
Retrieves formatted salary information with deductions subtracted:
1. Fetches salary record from net_salary_logs
2. Calculates final salary (net salary - deductions)
3. Returns formatted display data

**Path Parameters:**
- `employeeId` (required): Employee ID

**Query Parameters:**
- `month` (optional): Month in YYYY-MM format

**Required and Optional Fields:**
- `employeeId` (path, required): Employee ID
- `month` (query, optional): Month for salary display

**Sample Responses:**

Success (200):
```json
{
  "employee": {
    "id": 1,
    "name": "John Doe",
    "department": "Sales"
  },
  "salary": {
    "netSalary": 35000,
    "deductions": 3000,
    "finalSalary": 32000,
    "status": "paid",
    "paidOn": "2025-01-31"
  }
}
```

Error (404):
```json
{
  "statusCode": 404,
  "message": "No salary record found",
  "error": "Not Found"
}
```

**DB Access Controls:** 
- JWT Authentication required
- HR or Accounts department required
- `salary_permission` required

**Tables Affected:**
- `net_salary_logs`: Read salary records
- `employees`: Read employee data

---

### 4. Display All Salaries

**Title:** Get Salary Display for All Employees

**Methods and Endpoints:** 
- `GET /salary/display`
- `GET /finance/salary/display-all`

**Description and Flow:** 
Retrieves comprehensive salary information for all active employees:
1. Fetches salary records for all employees
2. Calculates summaries and totals
3. Returns formatted data for frontend display

**Query Parameters:**
- `month` (optional): Month in YYYY-MM format

**Required and Optional Fields:**
- `month` (query, optional): Month for salary display

**Sample Responses:**

Success (200):
```json
{
  "salaries": [
    {
      "employeeId": 1,
      "employeeName": "John Doe",
      "department": "Sales",
      "baseSalary": 30000,
      "bonus": 5000,
      "commission": 2000,
      "deductions": 3000,
      "finalSalary": 34000,
      "status": "paid"
    }
  ],
  "summary": {
    "totalEmployees": 1,
    "totalBaseSalary": 30000,
    "totalBonus": 5000,
    "totalCommission": 2000,
    "totalDeductions": 3000,
    "totalFinalSalary": 34000
  }
}
```

**DB Access Controls:** 
- JWT Authentication required
- HR or Accounts department required
- `salary_permission` required

**Tables Affected:**
- `net_salary_logs`: Read salary records
- `employees`: Read employee data
- `departments`: Read department information

---

### 5. Detailed Salary Breakdown

**Title:** Get Detailed Salary Breakdown

**Methods and Endpoints:** 
- `GET /salary/display/:employeeId/detailed`
- `GET /finance/salary/breakdown/:employeeId`

**Description and Flow:** 
Provides comprehensive salary breakdown for specific employee:
1. Employee details and department information
2. Detailed salary breakdown (base, commission, bonus, deductions)
3. Commission breakdown by projects
4. Detailed deduction breakdown
5. Complete audit trail

**Path Parameters:**
- `employeeId` (required): Employee ID

**Query Parameters:**
- `month` (optional): Month in YYYY-MM format

**Required and Optional Fields:**
- `employeeId` (path, required): Employee ID
- `month` (query, optional): Month for breakdown

**Sample Responses:**

Success (200):
```json
{
  "employee": {
    "id": 1,
    "firstName": "John",
    "lastName": "Doe",
    "department": "Sales"
  },
  "salary": {
    "baseSalary": 30000,
    "bonus": 5000,
    "commission": 2000,
    "deductions": 3000,
    "finalSalary": 34000
  },
  "commissionBreakdown": [
    {
      "projectId": 123,
      "projectName": "Website Redesign",
      "amount": 1500,
      "commissionRate": 5.0
    }
  ],
  "deductionBreakdown": {
    "absent": 2000,
    "late": 800,
    "halfDay": 200,
    "total": 3000
  }
}
```

**DB Access Controls:** 
- JWT Authentication required
- HR or Accounts department required
- `salary_permission` required

**Tables Affected:**
- `net_salary_logs`: Read salary records
- `employees`: Read employee data
- `projects`: Read project commission data
- `cracked_leads`: Read lead commission data
- Attendance tables for deduction details

---

### 6. Sales Employees Bonus Display

**Title:** Get Sales Employees with High Sales Amount

**Methods and Endpoints:** 
- `GET /finance/salary/bonus-display`

**Description and Flow:** 
Retrieves sales employees with sales amount greater than or equal to 3000:
1. Fetches sales employees from sales_departments table
2. Filters by salesAmount >= 3000
3. Orders alphabetically by employee name (ascending)
4. Returns employee ID, name, sales amount, and bonus amount

**Query Parameters:** None

**Required and Optional Fields:** None

**Validations:**
- Only returns employees with salesAmount >= 3000
- Only includes employees with non-null salesAmount
- Orders by firstName alphabetically (ascending)

**Sample Responses:**

Success (200):
```json
[
  {
    "id": 1,
    "name": "John Doe",
    "salesAmount": 5000.00,
    "bonusAmount": 500.00
  },
  {
    "id": 3,
    "name": "Jane Smith",
    "salesAmount": 4500.00,
    "bonusAmount": 300.00
  }
]
```

Empty Response (200):
```json
[]
```

**DB Access Controls:** 
- JWT Authentication required
- `salary_permission` required

**Tables Affected:**
- `sales_departments`: Read salesAmount, salesBonus
- `employees`: Read firstName, lastName (via join)

---

### 7. Update Sales Employee Bonus

**Title:** Update Bonus Amount for High-Performing Sales Employees

**Methods and Endpoints:** 
- `PATCH /finance/salary/update-sales-bonus`

**Description and Flow:** 
Allows admins to update bonus amounts for sales employees with sales amount >= 3000:
1. Validates employee exists and meets criteria (salesAmount >= 3000)
2. Updates salesBonus field in sales_departments table
3. Returns updated employee data with success message
4. Only accessible by admin users (bypass mechanism)

**JSON Body:**
```json
{
  "employee_id": 123,
  "bonusAmount": 1000.00
}
```

**Required and Optional Fields:**
- `employee_id` (number, required): Employee ID to update bonus for
- `bonusAmount` (number, required): New bonus amount to set

**Validations:**
- employee_id must be a positive integer
- bonusAmount cannot be negative
- Employee must exist and have salesAmount >= 3000
- Only admin users can access (department bypass)

**Sample Responses:**

Success (200):
```json
{
  "id": 123,
  "name": "John Doe",
  "salesAmount": 5000.00,
  "bonusAmount": 1000.00,
  "message": "Bonus updated successfully for John Doe"
}
```

Error (400):
```json
{
  "statusCode": 400,
  "message": "Invalid employeeId. Must be a positive number.",
  "error": "Bad Request"
}
```

Error (404) - Employee not found:
```json
{
  "statusCode": 404,
  "message": "Employee with ID 999 not found.",
  "error": "Not Found"
}
```

Error (404) - Not a sales employee:
```json
{
  "statusCode": 404,
  "message": "Employee John Doe (ID: 123) is not a sales department employee. Only sales employees can have their bonus updated.",
  "error": "Not Found"
}
```

Error (404) - Insufficient sales amount:
```json
{
  "statusCode": 404,
  "message": "Employee Jane Smith (ID: 456) does not meet the minimum sales criteria. Current sales amount: 2500, Required: >= 3000.",
  "error": "Not Found"
}
```

**DB Access Controls:** 
- JWT Authentication required
- Admin access only (using non-existent department bypass)
- `salary_permission` required

**Tables Affected:**
- `sales_departments`: Update salesBonus field
- `employees`: Read employee data (via join)

---

### Commission Management

The commission management APIs handle commission assignments, transfers, and withholdings.

### 8. Assign Commission

**Title:** Assign Commission to Sales Employee

**Methods and Endpoints:** 
- `POST /salary/commission/assign`

**Description and Flow:** 
Assigns commission based on completed project:
1. Validates project is completed
2. Calculates commission from lead amount and rate
3. Adds to commissionAmount or withholdCommission based on flag
4. Updates sales department record

**JSON Body:**
```json
{
  "project_id": 123
}
```

**Required and Optional Fields:**
- `project_id` (number, required): Project ID to assign commission for

**Validations:**
- project_id must be a positive integer
- Project must exist and be completed
- Associated lead must exist

**Sample Responses:**

Success (200):
```json
{
  "status": "success",
  "message": "Commission assigned",
  "employee_id": 15,
  "commission_amount": 1500.00,
  "withheld": false
}
```

Error (404):
```json
{
  "statusCode": 404,
  "message": "Project not found",
  "error": "Not Found"
}
```

**DB Access Controls:** 
- Currently open (commented permissions)
- Should require Sales department + commission_permission

**Tables Affected:**
- `projects`: Read project data
- `cracked_leads`: Read lead data
- `sales_departments`: Update commission amounts

---

### 9. Update Withhold Flag

**Title:** Update Commission Withhold Flag

**Methods and Endpoints:** 
- `POST /salary/commission/withhold-flag`

**Description and Flow:** 
Sets flag to withhold future commissions:
1. Validates employee exists
2. Updates withholdFlag in sales_departments
3. Only updates if flag value is different

**JSON Body:**
```json
{
  "employee_id": 123,
  "flag": true
}
```

**Required and Optional Fields:**
- `employee_id` (number, required): Employee ID
- `flag` (boolean, required): Withhold flag value

**Validations:**
- employee_id must be a positive integer
- flag must be a boolean value

**Sample Responses:**

Success (200):
```json
{
  "status": "success",
  "message": "Withhold flag updated",
  "employee_id": 123,
  "new_flag": true
}
```

Error (400):
```json
{
  "statusCode": 400,
  "message": "Flag already set to true",
  "error": "Bad Request"
}
```

**DB Access Controls:** 
- JWT Authentication required
- Sales department required
- `dep_manager` role required

**Tables Affected:**
- `sales_departments`: Update withholdFlag

---

### 10. Transfer Commission

**Title:** Transfer Commission Between Accounts

**Methods and Endpoints:** 
- `POST /salary/commission/transfer`

**Description and Flow:** 
Transfers commission between commission_amount and withhold_commission:
1. Validates sufficient funds for transfer
2. Updates commission balances
3. Supports full transfer (amount = 0) or partial transfer

**JSON Body:**
```json
{
  "employee_id": 123,
  "amount": 1000.00,
  "direction": "release"
}
```

**Required and Optional Fields:**
- `employee_id` (number, required): Employee ID
- `amount` (number, required): Amount to transfer (0 for full transfer)
- `direction` (string, required): "release" or "withhold"

**Validations:**
- employee_id must be a positive integer
- amount must be >= 0
- direction must be "release" or "withhold"
- Sufficient funds must be available for transfer

**Sample Responses:**

Success (200):
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

Error (400):
```json
{
  "statusCode": 400,
  "message": "Insufficient funds in withhold_commission",
  "error": "Bad Request"
}
```

**DB Access Controls:** 
- JWT Authentication required
- HR department required
- `dep_manager` role required

**Tables Affected:**
- `sales_departments`: Update commission amounts

---

### Accountant Management

The accountant management APIs handle accountant permissions and access control.

### 9. Update Accountant Permissions

**Title:** Update Permissions for Accountant

**Methods and Endpoints:** 
- `PATCH /accountant/permissions`

**Description and Flow:** 
This endpoint allows admins or account managers to update permissions for accountants:
1. Validates that the target employee exists and is active
2. Ensures the employee is in the Accounts department
3. Verifies the accountant record exists
4. Applies permission restrictions (admin bypass, account manager restrictions)
5. Updates all specified permission flags
6. Creates audit log entry for tracking

**JSON Body:**
```json
{
  "employee_id": 123,
  "permissions": {
    "liabilities_permission": true,
    "salary_permission": false,
    "sales_permission": true,
    "invoices_permission": false,
    "expenses_permission": true,
    "assets_permission": false,
    "revenues_permission": true
  }
}
```

**Required and Optional Fields:**
- `employee_id` (number, required): ID of the accountant employee
- `permissions` (object, required): Object containing permission flags
  - `liabilities_permission` (boolean, optional): Liabilities management permission
  - `salary_permission` (boolean, optional): Salary management permission
  - `sales_permission` (boolean, optional): Sales management permission
  - `invoices_permission` (boolean, optional): Invoice management permission
  - `expenses_permission` (boolean, optional): Expense management permission
  - `assets_permission` (boolean, optional): Asset management permission
  - `revenues_permission` (boolean, optional): Revenue management permission

**Validations:**
- employee_id must be a positive integer
- Employee must exist and be active
- Employee must be in the Accounts department
- Accountant record must exist
- Admin users can update any accountant permissions
- Account managers have restricted update capabilities

**Sample Responses:**

Success (200):
```json
{
  "status": "success",
  "message": "Permissions updated successfully for John Doe (ID: 123)",
  "employee_id": 123,
  "updated_permissions": {
    "liabilities_permission": true,
    "salary_permission": false,
    "sales_permission": true,
    "invoices_permission": false,
    "expenses_permission": true,
    "assets_permission": false,
    "revenues_permission": true
  },
  "previous_permissions": {
    "liabilities_permission": false,
    "salary_permission": true,
    "sales_permission": false,
    "invoices_permission": true,
    "expenses_permission": false,
    "assets_permission": true,
    "revenues_permission": false
  }
}
```

Error (400):
```json
{
  "status": "error",
  "message": "Employee with ID 999 does not exist or is not active",
  "error_code": "EMPLOYEE_NOT_FOUND"
}
```

Error (403):
```json
{
  "status": "error",
  "message": "Access denied: You (Jane Smith) are not authorized to update permissions for this accountant. Only admins can update permissions for senior accountants.",
  "error_code": "INSUFFICIENT_PERMISSIONS"
}
```

**DB Access Controls:** 
- JWT Authentication required
- Accounts department access required
- `salary_permission` required (for validation)
- Admin bypass available for all permissions

**Tables Affected:**
- `employees`: Read employee data for validation
- `accountants`: Update permission flags
- `hr_logs`: Create audit log entry

---

### Vendor Management

The vendor management APIs handle vendor record creation and retrieval for financial transactions.

### 11. Create Vendor

**Title:** Add New Vendor Record

**Methods and Endpoints:** 
- `POST /accountant/vendor/create`

**Description and Flow:** 
This endpoint allows accountants to add new vendor records:
1. Validates that the current user exists and is active
2. Ensures the user is in the Accounts department
3. Verifies the user is an accountant
4. Validates that at least one identifying field is provided
5. Creates the vendor record with all provided information
6. Returns the created vendor data with success confirmation

**JSON Body:**
```json
{
  "name": "ABC Company",
  "contact_person": "John Doe",
  "email": "john@abc.com",
  "phone": "+1234567890",
  "address": "123 Business Street",
  "city": "New York",
  "country": "USA",
  "bank_account": "1234567890",
  "status": "active",
  "notes": "Primary supplier for office supplies"
}
```

**Required and Optional Fields:**
- `name` (string, optional): Vendor company name (max 255 chars)
- `contact_person` (string, optional): Contact person name (max 255 chars)
- `email` (string, optional): Valid email address (max 255 chars)
- `phone` (string, optional): Phone number with optional + prefix (max 50 chars)
- `address` (string, optional): Vendor address
- `city` (string, optional): City name (max 100 chars)
- `country` (string, optional): Country name (max 100 chars)
- `bank_account` (string, optional): Bank account number (max 255 chars)
- `status` (string, optional): Vendor status (max 50 chars)
- `notes` (string, optional): Additional notes about the vendor

**Validations:**
- At least one identifying field must be provided (name, contact_person, email, or phone)
- Email must be in valid format if provided
- Phone number can only contain digits, spaces, hyphens, parentheses, and optionally a plus sign
- All string fields have maximum length restrictions
- User must be an active accountant in Accounts department

**Sample Responses:**

Success (200):
```json
{
  "status": "success",
  "message": "Vendor \"ABC Company\" has been successfully created with ID 123. The vendor record is now available for use in financial transactions.",
  "vendor_id": 123,
  "vendor_data": {
    "id": 123,
    "name": "ABC Company",
    "contact_person": "John Doe",
    "email": "john@abc.com",
    "phone": "+1234567890",
    "address": "123 Business Street",
    "city": "New York",
    "country": "USA",
    "bank_account": "1234567890",
    "status": "active",
    "created_by": 456,
    "notes": "Primary supplier for office supplies",
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
}
```

Error (400) - Validation Error:
```json
{
  "status": "error",
  "message": "Validation error: Please provide at least one identifying field (name, contact person, email, or phone number) to create a vendor record.",
  "error_code": "INSUFFICIENT_VENDOR_DATA"
}
```

Error (403) - Permission Denied:
```json
{
  "status": "error",
  "message": "Access denied: You (John Doe) are not authorized as an accountant. Only accountants can add vendor records. Please contact your department manager to request accountant privileges.",
  "error_code": "NOT_ACCOUNTANT"
}
```

**DB Access Controls:** 
- JWT Authentication required
- Accounts department required
- `expenses_permission` required
- User must be an accountant

**Tables Affected:**
- `vendors`: Create new vendor record
- `employees`: Read user information for validation

---

### 12. Get All Vendors

**Title:** Retrieve All Vendor Records

**Methods and Endpoints:** 
- `GET /accountant/vendors/display`

**Description and Flow:** 
This endpoint allows accountants to retrieve all vendor records:
1. Validates that the current user exists and is active
2. Ensures the user is in the Accounts department
3. Verifies the user is an accountant
4. Retrieves all vendor records ordered alphabetically by name
5. Returns the vendor list with metadata including total count

**JSON Body:** None

**Required and Optional Fields:** None

**Query Parameters:** None

**Validations:**
- User must be an active accountant in Accounts department
- No additional validation required for retrieval

**Sample Responses:**

Success (200):
```json
{
  "status": "success",
  "message": "Successfully retrieved 5 vendor records.",
  "vendors": [
    {
      "id": 123,
      "name": "ABC Company",
      "contact_person": "John Doe",
      "email": "john@abc.com",
      "phone": "+1234567890",
      "address": "123 Business Street",
      "city": "New York",
      "country": "USA",
      "bank_account": "1234567890",
      "status": "active",
      "created_by": 456,
      "notes": "Primary supplier for office supplies",
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z"
    },
    {
      "id": 124,
      "name": "Best Suppliers Ltd",
      "contact_person": "Jane Smith",
      "email": "jane@bestsuppliers.com",
      "phone": "+0987654321",
      "address": "456 Supplier Avenue",
      "city": "Los Angeles",
      "country": "USA",
      "bank_account": "0987654321",
      "status": "active",
      "created_by": 456,
      "notes": "IT equipment supplier",
      "created_at": "2024-01-02T00:00:00.000Z",
      "updated_at": "2024-01-02T00:00:00.000Z"
    }
  ],
  "metadata": {
    "total_count": 5
  }
}
```

Error (403) - Permission Denied:
```json
{
  "status": "error",
  "message": "Permission denied: You (John Doe) are in the Sales department. Only members of the Accounts department can view vendor records.",
  "error_code": "NOT_ACCOUNTS_DEPARTMENT"
}
```

Error (500) - Database Connection Error:
```json
{
  "status": "error",
  "message": "System error: Unable to connect to the database. Please try again in a few moments or contact technical support if the problem persists.",
  "error_code": "DATABASE_CONNECTION_ERROR"
}
```

**DB Access Controls:** 
- JWT Authentication required
- Accounts department required
- `expenses_permission` required
- User must be an accountant

**Tables Affected:**
- `vendors`: Read all vendor records
- `employees`: Read user information for validation
- `accountants`: Read accountant record for validation

---

### Profit & Loss (P&L) Management

The P&L management APIs handle automatic calculation and storage of monthly profit and loss statements, including revenue, expenses, and net profit calculations.

### 13. Auto Calculate P&L

**Title:** Trigger Automatic P&L Calculation and Storage

**Methods and Endpoints:** 
- `POST /accountant/pnl/auto`

**Description and Flow:** 
This endpoint manually triggers the same process that runs automatically via cron job on the 1st of every month:
1. Calculates total revenue for the specified month from `revenues` table (based on `received_on` date)
2. Calculates total expenses for the specified month from `expenses` table (based on `paid_on` date)
3. Computes net profit (total income - total expenses)
4. Stores results in `profit_loss` table
5. Skips calculation if record already exists for that month/year

**JSON Body:**
```json
{
  "month": "01",
  "year": "2024"
}
```

**Required and Optional Fields:**
- `month` (string, optional): Month in numeric format (01-12). If not provided, calculates for previous month
- `year` (string, optional): Year in YYYY format. If not provided, calculates for previous month

**Validations:**
- Month must be in numeric format (01-12)
- Year must be between 2000-2100
- If both month and year are omitted, automatically calculates for previous month

**Sample Responses:**

Success (200) - New Record Created:
```json
{
  "status": "success",
  "message": "P&L calculation completed and saved for 01/2024",
  "data": {
    "month": "01",
    "year": "2024",
    "totalIncome": 150000.00,
    "totalExpenses": 85000.00,
    "netProfit": 65000.00,
    "calculationDate": "2024-01-01T00:00:00.000Z"
  }
}
```

Success (200) - Record Already Exists:
```json
{
  "status": "success",
  "message": "P&L record already exists for 01/2024",
  "data": {
    "month": "01",
    "year": "2024",
    "totalIncome": 150000.00,
    "totalExpenses": 85000.00,
    "netProfit": 65000.00,
    "calculationDate": "2024-01-01T00:00:00.000Z"
  }
}
```

Error (400) - Invalid Format:
```json
{
  "status": "error",
  "message": "Invalid month or year format. Month should be 01-12, year should be 2000-2100",
  "error_code": "INVALID_DATE_FORMAT"
}
```

**DB Access Controls:** 
- No authentication required (cron job compatibility)
- Can be called manually for testing purposes

**Tables Affected:**
- `revenues`: Read revenue records for specified month
- `expenses`: Read expense records for specified month
- `profit_loss`: Create new P&L record

**Cron Job Schedule:**
- Runs automatically on 1st of every month at 12:00 AM PKT
- Cron expression: `'0 0 1 * *'` with timezone `'Asia/Karachi'`

---

### 14. P&L Preview Calculation

**Title:** Read-Only P&L Calculation Preview

**Methods and Endpoints:** 
- `GET /accountant/pnl/calculate/:month/:year`

**Description and Flow:** 
This endpoint calculates P&L for a specific month but does NOT update the database:
1. Validates month and year parameters
2. Calculates total revenue for the specified month from `revenues` table
3. Calculates total expenses for the specified month from `expenses` table
4. Computes net profit (total income - total expenses)
5. Returns detailed breakdown without saving to database

**Path Parameters:**
- `month` (required): Month in numeric format (01-12)
- `year` (required): Year in YYYY format

**Required and Optional Fields:**
- `month` (path, required): Month in numeric format (01-12)
- `year` (path, required): Year in YYYY format

**Validations:**
- Month must be in numeric format (01-12)
- Year must be between 2000-2100
- Both parameters are required

**Sample Responses:**

Success (200):
```json
{
  "status": "success",
  "message": "P&L calculation preview for 01/2024",
  "data": {
    "month": "01",
    "year": "2024",
    "totalIncome": 150000.00,
    "totalExpenses": 85000.00,
    "netProfit": 65000.00,
    "calculationDate": "2024-01-01T00:00:00.000Z"
  }
}
```

Error (400) - Invalid Parameters:
```json
{
  "statusCode": 400,
  "message": "Month and year parameters are required",
  "error": "Bad Request"
}
```

Error (400) - Invalid Format:
```json
{
  "status": "error",
  "message": "Invalid month or year format. Month should be 01-12, year should be 2000-2100",
  "error_code": "INVALID_DATE_FORMAT"
}
```

**DB Access Controls:** 
- JWT Authentication required
- Accounts department access required
- `revenues_permission` required

**Tables Affected:**
- `revenues`: Read revenue records for specified month
- `expenses`: Read expense records for specified month
- No database writes (read-only operation)

**Use Cases:**
- Real-time P&L preview and analysis
- Testing calculations before running auto process
- Financial reporting and analysis
- Frontend dashboard displays

---

### 15. P&L Category Breakdown

**Title:** P&L Calculation with Category Breakdown

**Methods and Endpoints:** 
- `GET /accountant/pnl/categories/:month/:year`

**Description and Flow:** 
This endpoint calculates P&L with detailed breakdown by category for a specific month:
1. Validates month and year parameters
2. Calculates total revenue for the specified month from `revenues` table
3. Groups revenue by category with totals and counts
4. Calculates total expenses for the specified month from `expenses` table
5. Groups expenses by category with totals and counts
6. Computes net profit (total income - total expenses)
7. Returns detailed breakdown without saving to database

**Path Parameters:**
- `month` (required): Month in numeric format (01-12)
- `year` (required): Year in YYYY format

**Required and Optional Fields:**
- `month` (path, required): Month in numeric format (01-12)
- `year` (path, required): Year in YYYY format

**Validations:**
- Month must be in numeric format (01-12)
- Year must be between 2000-2100
- Both parameters are required

**Sample Responses:**

Success (200):
```json
{
  "status": "success",
  "message": "P&L category breakdown for 01/2024",
  "data": {
    "month": "01",
    "year": "2024",
    "totalIncome": 150000.00,
    "totalExpenses": 85000.00,
    "netProfit": 65000.00,
    "revenueBreakdown": [
      {
        "category": "Software Development",
        "totalAmount": 100000.00,
        "count": 5
      },
      {
        "category": "Consulting",
        "totalAmount": 35000.00,
        "count": 3
      },
      {
        "category": "Training",
        "totalAmount": 15000.00,
        "count": 2
      }
    ],
    "expenseBreakdown": [
      {
        "category": "Salaries",
        "totalAmount": 60000.00,
        "count": 15
      },
      {
        "category": "Office Rent",
        "totalAmount": 15000.00,
        "count": 1
      },
      {
        "category": "Utilities",
        "totalAmount": 5000.00,
        "count": 3
      },
      {
        "category": "Marketing",
        "totalAmount": 5000.00,
        "count": 2
      }
    ],
    "calculationDate": "2024-01-01T00:00:00.000Z"
  }
}
```

Error (400) - Invalid Parameters:
```json
{
  "statusCode": 400,
  "message": "Month and year parameters are required",
  "error": "Bad Request"
}
```

Error (400) - Invalid Format:
```json
{
  "status": "error",
  "message": "Invalid month or year format. Month should be 01-12, year should be 2000-2100",
  "error_code": "INVALID_DATE_FORMAT"
}
```

**DB Access Controls:** 
- JWT Authentication required
- Accounts department access required
- `revenues_permission` required

**Tables Affected:**
- `revenues`: Read revenue records grouped by category for specified month
- `expenses`: Read expense records grouped by category for specified month
- No database writes (read-only operation)

**Use Cases:**
- Detailed financial analysis and reporting
- Category-wise expense tracking
- Revenue source analysis
- Budget planning and forecasting
- Financial dashboard with category breakdowns
- Management reporting with granular details

---

## Database Schema Overview

### Key Tables for HR and Finance Operations

#### Employee Management
- **`employees`**: Core employee data (status, start/end dates, department, role)
- **`departments`**: Department information
- **`roles`**: Employee roles and permissions

#### Salary Management
- **`accounts`**: Base salary information
- **`net_salary_logs`**: Calculated salary records with status
- **`transactions`**: Payment transactions
- **`expenses`**: Salary expense records

#### Commission Management
- **`sales_departments`**: Commission, bonus, and withhold information
- **`cracked_leads`**: Completed leads with commission data
- **`projects`**: Project information linked to leads

#### Attendance and Deductions
- **`monthly_attendance_summary`**: Monthly attendance totals
- **`attendance_logs`**: Daily attendance records
- **`late_logs`**: Late arrival records
- **`half_day_logs`**: Half-day attendance records

#### HR Operations
- **`hr`**: HR employee permissions and settings
- **`hr_logs`**: HR activity audit trail
- **`companies`**: Company settings (monthly late allowances)

#### Financial Operations
- **`refunds`**: Refund records affecting deductions
- **`chargebacks`**: Chargeback records affecting deductions

#### Vendor Management
- **`vendors`**: Vendor records for financial transactions
- **`accountants`**: Accountant permissions and settings

#### Profit & Loss Management
- **`profit_loss`**: Monthly P&L records with income, expenses, and net profit
- **`revenues`**: Revenue records with received_on dates
- **`expenses`**: Expense records with paid_on dates

---

## Authentication & Authorization

### JWT Authentication
All endpoints require valid JWT token in Authorization header:
```
Authorization: Bearer <jwt_token>
```

### Department-Based Access Control
- **HR Department**: Access to employee termination, salary updates, deductions
- **Sales Department**: Access to commission management
- **Accounts Department**: Access to salary calculations, displays, and vendor management

### Permission-Based Access Control
- **`salary_permission`**: Required for salary-related operations
- **`commission_permission`**: Required for commission operations (currently commented)
- **`expenses_permission`**: Required for vendor management operations
- **`revenues_permission`**: Required for P&L preview calculations
- **`dep_manager`**: Required for certain commission operations

### Role-Based Access Control
- **Admin**: Full access to all operations
- **HR Manager**: Restricted salary update permissions
- **Sales Manager**: Commission management permissions

---

## Error Handling

### Common Error Responses

#### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": "Validation error description",
  "error": "Bad Request"
}
```

#### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

#### 403 Forbidden
```json
{
  "statusCode": 403,
  "message": "Insufficient permissions",
  "error": "Forbidden"
}
```

#### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "Resource not found",
  "error": "Not Found"
}
```

#### 500 Internal Server Error
```json
{
  "statusCode": 500,
  "message": "Internal server error",
  "error": "Internal Server Error"
}
```

### Validation Errors
- Date format validation (YYYY-MM-DD)
- Numeric value validation (positive integers, decimals)
- Enum value validation (PaymentWays, TransferDirection)
- Business rule validation (salary restrictions, fund availability)

### Database Constraints
- Foreign key constraints ensure data integrity
- Unique constraints prevent duplicate records
- Check constraints validate data ranges

---

## Additional Notes

### API Versioning
- Current version: v1 (no explicit versioning in URLs)
- Backward compatibility maintained within major versions

### Rate Limiting
- No explicit rate limiting implemented
- Consider implementing for production use

### Logging
- All operations logged to HR logs for audit trail
- Error logging implemented in services
- Transaction logging for financial operations

### Data Privacy
- Employee data access restricted by department
- Salary information protected by permissions
- Audit trails maintained for compliance

### Performance Considerations
- Database indexes on frequently queried fields
- Pagination not implemented (consider for large datasets)
- Caching not implemented (consider for read-heavy operations)

### Security Considerations
- JWT token validation on all endpoints
- Department and permission-based access control
- Input validation and sanitization
- SQL injection prevention via Prisma ORM
- Audit trails for sensitive operations 