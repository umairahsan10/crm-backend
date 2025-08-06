# HR and Finance APIs Showcase

This document provides a comprehensive overview of all APIs in the HR and Finance modules, compiled from codebase analysis and existing documentation. It includes details on methods, endpoints, descriptions, flows, request bodies, required/optional fields, sample responses, errors, database access controls, and affected tables.

## HR Module APIs

The HR module handles employee management, including termination and salary-related operations. Base path: `/hr`

### 1. Terminate Employee

**Title:** Terminate Employee and Process Final Salary

**Methods and Endpoints:** POST /hr/terminate

**Description and Flow:** 
- Allows HR to terminate an employee by updating status to 'terminated', setting end date, calculating final salary (including deductions), and creating an HR log entry.
- Flow: 
  1. Validate permissions and input.
  2. Retrieve employee data.
  3. Calculate final salary using smart period determination.
  4. Update employee record.
  5. Create salary log and HR log.

**JSON Body:**
```json
{
  \"employee_id\": 1,
  \"termination_date\": \"2025-01-31\",
  \"description\": \"Voluntary resignation\"
}
```

**Required and Optional Fields:**
- `employee_id` (number, required): ID of employee to terminate.
- `termination_date` (string, required): Date of termination in YYYY-MM-DD format.
- `description` (string, optional): Reason for termination.

**Sample Responses:**
- Success (200):
```json
{
  \"message\": \"Employee terminated and salary processed\"
}
```

**Errors:**
- 400 Bad Request: Invalid input (e.g., \"Invalid employee ID\").
- 404 Not Found: \"Employee not found\".
- 403 Forbidden: Insufficient permissions.

**DB Access Controls:** Requires JWT authentication, HR department, salary_permission.

**Tables Affected:**
- `employee`: Update status, endDate.
- `net_salary_logs`: Create final salary record.
- `hr_logs`: Create termination log.

### 2. Calculate Salary Deductions

**Title:** Calculate Attendance-Based Salary Deductions

**Methods and Endpoints:** GET /hr/salary/deductions

**Description and Flow:** 
- Calculates deductions based on attendance (absent, late, half-day) for one or all employees in a specified or current month.
- Flow:
  1. Validate query parameters.
  2. Retrieve attendance data.
  3. Calculate progressive deductions.
  4. Compute totals and summaries.

**JSON Body:** None (query parameters used)

**Required and Optional Fields (Query Params):**
- `employeeId` (number, optional): Specific employee ID.
- `month` (string, optional): Month in YYYY-MM format.

**Sample Responses:**
- Success (200):
```json
{
  \"calculations\": [
    {
      \"employeeId\": 1,
      \"employeeName\": \"John Doe\",
      \"baseSalary\": 30000,
      \"perDaySalary\": 1000,
      \"month\": \"2025-01\",
      \"totalPresent\": 22,
      \"totalAbsent\": 2,
      \"totalLateDays\": 5,
      \"totalHalfDays\": 1,
      \"monthlyLatesDays\": 3,
      \"absentDeduction\": 4000,
      \"lateDeduction\": 3000,
      \"halfDayDeduction\": 500,
      \"chargebackDeduction\": 1000,
      \"refundDeduction\": 500,
      \"totalDeduction\": 9000,
      \"netSalary\": 21000
    }
  ],
  \"summary\": {
    \"totalEmployees\": 1,
    \"totalDeductions\": 9000,
    \"totalNetSalary\": 21000
  }
}
```

**Errors:**
- 400 Bad Request: \"Invalid employeeId. Must be a positive number.\" or invalid month format.
- 404 Not Found: \"No attendance data found\" or \"Employee not found\".

**DB Access Controls:** JWT, HR department, salary_permission.

**Tables Affected:**
- `employee`: Read.
- `accounts`: Read baseSalary.
- `monthly_attendance_summary`: Read attendance data.
- `attendance_logs`: Read half-day records.
- `companies`: Read monthly_lates_days.
- `sales_departments`: Read chargeback/refund deductions.

### 3. Update Employee Salary

**Title:** Update Employee Base Salary

**Methods and Endpoints:** PATCH /hr/salary/update

**Description and Flow:** 
- Updates an employee's base salary with restrictions for HR users.
- Flow:
  1. Validate permissions and restrictions.
  2. Update account record.
  3. Create HR log.

**JSON Body:**
```json
{
  \"employee_id\": 1,
  \"amount\": 35000,
  \"description\": \"Annual raise\"
}
```

**Required and Optional Fields:**
- `employee_id` (number, required).
- `amount` (number, required): New base salary.
- `description` (string, optional).

**Sample Responses:**
- Success (200):
```json
{
  \"message\": \"Salary updated successfully\",
  \"newSalary\": 35000
}
```

**Errors:**
- 400 Bad Request: Invalid input.
- 403 Forbidden: \"Cannot update own salary\" or insufficient permissions.

**DB Access Controls:** JWT, HR department, salary_permission.

**Tables Affected:**
- `accounts`: Update baseSalary.
- `hr_logs`: Create update log.

### 4. Mark Salary as Paid

**Title:** Mark Salary as Paid and Create Transactions

**Methods and Endpoints:** PATCH /hr/salary/mark-paid

**Description and Flow:** 
- Marks salary as paid, creates transaction/expense records, resets bonuses.
- Flow:
  1. Validate salary record.
  2. Update status.
  3. Create transaction and expense.
  4. Reset bonuses.
  5. Create HR log.

**JSON Body:**
```json
{
  \"employee_id\": 1
}
```

**Required and Optional Fields:**
- `employee_id` (number, required).

**Sample Responses:**
- Success (200):
```json
{
  \"message\": \"Salary marked as paid\"
}
```

**Errors:**
- 400 Bad Request: \"Salary already paid\".
- 404 Not Found: \"Salary record not found\".

**DB Access Controls:** JWT, HR department, salary_permission.

**Tables Affected:**
- `net_salary_logs`: Update status, paidOn.
- `transactions`: Create record.
- `expenses`: Create record.
- `employee` and `sales_departments`: Reset bonuses.
- `hr_logs`: Create log.

## Finance Module APIs

The Finance module handles salary calculations, commissions, and displays. Base paths: `/salary` and `/finance/salary`

### 1. Auto Calculate All Salaries

**Title:** Trigger Salary Calculation for All Active Employees

**Methods and Endpoints:** POST /salary/auto, POST /finance/salary/calculate-all

**Description and Flow:** 
- Triggers salary calculation for all active employees, similar to monthly cron.
- Flow:
  1. Retrieve active employees.
  2. For each: Calculate salary, deductions, store in logs.

**JSON Body:** None

**Required and Optional Fields:** None

**Sample Responses:**
- Success (200):
```json
{
  \"message\": \"Salary calculation triggered for all employees\"
}
```

**Errors:**
- 500 Internal Server Error: Calculation failures (continues for others).

**DB Access Controls:** JWT, salary_permission (for manual trigger).

**Tables Affected:**
- `employee`: Read active.
- `accounts`: Read baseSalary.
- `sales_departments`: Read commission, bonus.
- `net_salary_logs`: Create/update records.
- Attendance tables for deductions.

### 2. Salary Preview

**Title:** Read-Only Salary Calculation Preview

**Methods and Endpoints:** GET /salary/calculate/:employeeId (?endDate), GET /finance/salary/preview/:employeeId (?endDate)

**Description and Flow:** 
- Calculates salary preview without DB update.
- Flow:
  1. Determine period smartly.
  2. Calculate prorated base, bonuses, commissions, deductions.

**JSON Body:** None

**Required and Optional Fields:**
- `employeeId` (path, required).
- `endDate` (query, optional): YYYY-MM-DD.

**Sample Responses:**
- Success (200): Detailed breakdown as in docs.

**Errors:**
- 400 Bad Request: Invalid employeeId or endDate.
- 404 Not Found: Employee not found, no base salary.

**DB Access Controls:** JWT, salary_permission, HR/Accounts.

**Tables Affected:** Read-only: `employee`, `accounts`, `sales_departments`, attendance tables.

### 3. Display Employee Salary

**Title:** Get Salary Display for Employee

**Methods and Endpoints:** GET /salary/display/:employeeId (?month), GET /finance/salary/display/:employeeId (?month)

**Description and Flow:** 
- Retrieves formatted salary with deductions subtracted.
- Flow: Fetch from net_salary_logs, calculate final salary.

**JSON Body:** None

**Required and Optional Fields:**
- `employeeId` (path, required).
- `month` (query, optional).

**Sample Responses:**
- Success (200): As in docs, with finalSalary.

**Errors:**
- 404 Not Found: No salary record.

**DB Access Controls:** JWT, salary_permission, HR/Accounts.

**Tables Affected:** Read `net_salary_logs`, `employee`.

### 4. Display All Salaries

**Title:** Get Salary Display for All Employees

**Methods and Endpoints:** GET /salary/display (?month), GET /finance/salary/display-all (?month)

**Description and Flow:** 
- Comprehensive salary info for all active employees.
- Flow: Fetch records, calculate summaries.

**JSON Body:** None

**Required and Optional Fields:**
- `month` (query, optional).

**Sample Responses:**
- Success (200): Array of salaries with totals.

**Errors:**
- 400 Bad Request: Invalid month.

**DB Access Controls:** JWT, salary_permission, HR/Accounts.

**Tables Affected:** Read `net_salary_logs`, `employee`, `departments`.

### 5. Detailed Salary Breakdown

**Title:** Get Detailed Salary Breakdown

**Methods and Endpoints:** GET /salary/display/:employeeId/detailed (?month), GET /finance/salary/breakdown/:employeeId (?month)

**Description and Flow:** 
- Detailed breakdown including commissions and deductions.
- Flow: Fetch salary, commissions from projects, detailed deductions.

**JSON Body:** None

**Required and Optional Fields:**
- `employeeId` (path, required).
- `month` (query, optional).

**Sample Responses:**
- Success (200): Employee, salary, commissionBreakdown, deductionBreakdown.

**Errors:**
- 404 Not Found: No record.

**DB Access Controls:** JWT, salary_permission, HR/Accounts.

**Tables Affected:** Read `net_salary_logs`, `employee`, `projects`, `cracked_leads`, attendance tables.

### 6. Assign Commission

**Title:** Assign Commission to Sales Employee

**Methods and Endpoints:** POST /salary/commission/assign

**Description and Flow:** 
- Assigns commission based on completed project.
- Flow:
  1. Validate project completed.
  2. Calculate commission from lead amount and rate.
  3. Add to commissionAmount or withholdCommission based on flag.

**JSON Body:**
```json
{
  \"project_id\": 123
}
```

**Required and Optional Fields:**
- `project_id` (number, required).

**Sample Responses:**
- Success (200):
```json
{
  \"status\": \"success\",
  \"message\": \"Commission assigned\",
  \"employee_id\": 15,
  \"commission_amount\": 1500.00,
  \"withheld\": false
}
```

**Errors:**
- 404 Not Found: Project not found.
- 502 Bad Gateway: Project not completed.

**DB Access Controls:** Open (commented permissions).

**Tables Affected:**
- `project`: Read.
- `cracked_leads`: Read.
- `sales_departments`: Update commission.

### 7. Update Withhold Flag

**Title:** Update Commission Withhold Flag

**Methods and Endpoints:** POST /salary/commission/withhold-flag

**Description and Flow:** 
- Sets flag to withhold future commissions.
- Flow: Update flag in sales_departments if changed.

**JSON Body:**
```json
{
  \"employee_id\": 123,
  \"flag\": true
}
```

**Required and Optional Fields:**
- `employee_id` (number, required).
- `flag` (boolean, required).

**Sample Responses:**
- Success (200):
```json
{
  \"status\": \"success\",
  \"message\": \"Withhold flag updated\",
  \"employee_id\": 123,
  \"new_flag\": true
}
```

**Errors:**
- 400 Bad Request: Flag already set.

**DB Access Controls:** JWT, Sales department, dep_manager role.

**Tables Affected:**
- `sales_departments`: Update withholdFlag.

### 8. Transfer Commission

**Title:** Transfer Commission Between Accounts

**Methods and Endpoints:** POST /salary/commission/transfer

**Description and Flow:** 
- Transfers between commission_amount and withhold_commission.
- Flow: Validate funds, update balances.

**JSON Body:**
```json
{
  \"employee_id\": 123,
  \"amount\": 1000.00,
  \"direction\": \"release\"
}
```

**Required and Optional Fields:**
- `employee_id` (number, required).
- `amount` (number, required, 0 for full).
- `direction` (string, required: \"release\" or \"withhold\").

**Sample Responses:**
- Success (200):
```json
{
  \"status\": \"success\",
  \"message\": \"Commission released\",
  \"employee_id\": 123,
  \"transferred_amount\": 1000.00,
  \"from\": \"withhold_commission\",
  \"to\": \"commission_amount\",
  \"new_balances\": {
    \"commission_amount\": 2500.00,
    \"withhold_commission\": 500.00
  }
}
```

**Errors:**
- 400 Bad Request: Insufficient funds.

**DB Access Controls:** JWT, HR department, dep_manager role.

**Tables Affected:**
- `sales_departments`: Update commission amounts.

## Additional Notes
- Overlapping endpoints between /salary and /finance/salary may indicate migration; use the appropriate base path based on current implementation.
- All endpoints require JWT authentication unless noted.
- Database uses Prisma with tables like employee, accounts, net_salary_logs, sales_departments, etc.
- For full flows and queries, refer to service implementations." 