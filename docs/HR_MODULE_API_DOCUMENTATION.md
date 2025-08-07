# HR Module API Documentation

## Overview
The HR module is organized into a modular structure with separate submodules for different concerns. The main HR module handles employee termination and HR logs, while the salary submodule manages all salary-related operations including deductions, updates, and payments.

---

## Module Structure

```
HR Module
├── Main HR Module (/hr/*)
│   ├── Employee Termination
│   └── HR Activity Logs
└── Salary Submodule (/hr/salary/*)
    ├── Salary Deductions
    ├── Salary Updates
    └── Salary Payments
```

---

## API Endpoints

### Main HR Module Endpoints

#### 1. Terminate Employee

**Title:** Terminate Employee and Process Final Salary  
**Endpoint:** `/hr/terminate`  
**Method:** `POST`  
**Description:** Terminates an employee, updates their status, sets termination date, automatically calculates their final salary, and creates an HR log entry for audit purposes.

#### Request Body
```json
{
  "employee_id": 15,
  "termination_date": "2025-07-31",
  "description": "Performance issues and policy violations"
}
```

#### Parameters
| Parameter | Type | Required | Description | Validation |
|-----------|------|----------|-------------|------------|
| `employee_id` | `number` | ✅ Yes | ID of the employee to terminate | Must be a valid integer |
| `termination_date` | `string` | ✅ Yes | Date of termination in YYYY-MM-DD format | Must be valid date string (YYYY-MM-DD) |
| `description` | `string` | ❌ No | Custom description for the termination | Optional string |

#### Response
**Success (200):**
```json
{
  "message": "Employee terminated and salary processed"
}
```

**Error Responses:**
- **400 Bad Request:**
  ```json
  {
    "message": "Invalid date format: 2025-07-32. Please use YYYY-MM-DD format (e.g., 2025-07-31)",
    "error": "Bad Request",
    "statusCode": 400
  }
  ```
  ```json
  {
    "message": "Employee 15 is already terminated",
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

1. **Input Validation:**
   - Validates date format (YYYY-MM-DD)
   - Checks if date is valid using `new Date()` and `isNaN()`

2. **Employee Validation:**
   - Queries `employee` table to check if employee exists
   - Verifies employee is not already terminated

3. **HR Validation:**
   - Validates that the authenticated user is a valid HR employee
   - Checks for HR record existence

4. **Database Updates:**
   ```sql
   UPDATE employee 
   SET end_date = '2025-07-31', status = 'terminated' 
   WHERE id = 15;
   ```

5. **Salary Processing:**
   - Calls finance service to calculate final salary
   - Processes any pending payments

6. **HR Log Creation:**
   - Creates an entry in `hr_logs` table
   - If description is provided, uses it; otherwise generates automatic description
   - Automatic description format: "Employee [Name] (ID: [ID]) was terminated on [Date] by HR [HR Name]"

#### 2. Get HR Logs

**Title:** Retrieve HR Activity Logs  
**Endpoint:** `/hr/logs`  
**Method:** `GET`  
**Description:** Retrieves all HR activity logs for the authenticated HR employee, including termination records and other HR actions.

#### Request Headers
```
Authorization: Bearer <jwt_token>
```

#### Response
**Success (200):**
```json
{
  "logs": [
    {
      "id": 1,
      "actionType": "employee_termination",
      "affectedEmployeeId": 15,
      "description": "Employee John Doe (ID: 15) was terminated on 2025-07-31 by HR Jane Smith",
      "createdAt": "2025-07-31T10:30:00.000Z",
      "updatedAt": "2025-07-31T10:30:00.000Z",
      "affectedEmployee": {
        "id": 15,
        "firstName": "John",
        "lastName": "Doe",
        "email": "john.doe@company.com"
      },
      "hr": {
        "id": 1,
        "employee": {
          "id": 2,
          "firstName": "Jane",
          "lastName": "Smith",
          "email": "jane.smith@company.com"
        }
      }
    }
  ]
}
```

**Error Responses:**
- **404 Not Found:**
  ```json
  {
    "message": "HR record not found for employee 2",
    "error": "Not Found",
    "statusCode": 404
  }
  ```

#### Backend Logic & Database Operations

1. **Authentication & Authorization:**
   - Validates JWT token
   - Checks HR department access
   - Verifies salary permission

2. **HR Record Validation:**
   - Queries `hr` table to find HR record for authenticated user
   - Ensures user has valid HR privileges

3. **Log Retrieval:**
   ```sql
   SELECT * FROM hr_logs 
   WHERE hr_id = [HR_ID] 
   ORDER BY created_at DESC;
   ```

4. **Related Data Inclusion:**
   - Includes affected employee details
   - Includes HR employee details
   - Orders by creation date (newest first)

---

### Salary Submodule Endpoints

#### 3. Calculate Salary Deductions

**Title:** Calculate Salary Deductions for Employees  
**Endpoint:** `/hr/salary/deductions`  
**Method:** `GET`  
**Description:** Calculates comprehensive salary deductions including attendance-based deductions (absent, late, half-day) and sales department deductions (chargeback, refund) for employees.

#### Request Headers
```
Authorization: Bearer <jwt_token>
```

#### Query Parameters
| Parameter | Type | Required | Description | Validation |
|-----------|------|----------|-------------|------------|
| `employeeId` | `number` | ❌ No | Specific employee ID to calculate for | Must be a positive integer |
| `month` | `string` | ❌ No | Month in YYYY-MM format | Must be valid YYYY-MM format |

#### Query Examples
```bash
# Calculate for specific employee and month
GET /hr/salary/deductions?employeeId=1&month=2025-01

# Calculate for specific employee, current month
GET /hr/salary/deductions?employeeId=1

# Calculate for all employees, specific month
GET /hr/salary/deductions?month=2025-01

# Calculate for all employees, current month
GET /hr/salary/deductions
```

#### Response
**Success (200):**
```json
{
  "calculations": [
    {
      "employeeId": 1,
      "employeeName": "John Doe",
      "baseSalary": 30000,
      "perDaySalary": 1000,
      "month": "2025-01",
      "totalPresent": 0,
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
      "netSalary": 30000,
      "finalSalary": 21000
    }
  ],
  "summary": {
    "totalEmployees": 1,
    "totalDeductions": 9000,
    "totalNetSalary": 21000
  }
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
  ```json
  {
    "message": "Invalid month format. Must be in YYYY-MM format (e.g., 2025-01).",
    "error": "Bad Request",
    "statusCode": 400
  }
  ```

- **404 Not Found:**
  ```json
  {
    "message": "Employee with ID 1 not found.",
    "error": "Not Found",
    "statusCode": 404
  }
  ```

#### 4. Update Employee Salary

**Title:** Update Employee Base Salary  
**Endpoint:** `/hr/salary/update`  
**Method:** `PATCH`  
**Description:** Updates an employee's base salary with proper permission checks. Admins can update any salary, while HR users have restrictions.

#### Request Body
```json
{
  "employee_id": 15,
  "amount": 35000,
  "description": "Annual salary review and performance bonus"
}
```

#### Parameters
| Parameter | Type | Required | Description | Validation |
|-----------|------|----------|-------------|------------|
| `employee_id` | `number` | ✅ Yes | ID of the employee | Must be a valid integer |
| `amount` | `number` | ✅ Yes | New salary amount | Must be >= 0 |
| `description` | `string` | ❌ No | Reason for salary update | Optional string |

#### Response
**Success (200):**
```json
{
  "status": "success",
  "message": "Salary updated successfully",
  "employee_id": 15,
  "previous_salary": 30000,
  "new_salary": 35000,
  "updated_by": 2
}
```

**Error Responses:**
- **400 Bad Request:**
  ```json
  {
    "status": "error",
    "message": "Employee does not exist",
    "error_code": "EMPLOYEE_NOT_FOUND"
  }
  ```
  ```json
  {
    "status": "error",
    "message": "HR cannot set their own salary",
    "error_code": "SELF_SALARY_RESTRICTION"
  }
  ```

#### 5. Mark Salary as Paid

**Title:** Mark Salary as Paid  
**Endpoint:** `/hr/salary/mark-paid`  
**Method:** `PATCH`  
**Description:** Marks a salary as paid, creates transaction and expense records, and resets employee bonuses to zero.

#### Request Body
```json
{
  "employee_id": 15,
  "type": "bank"
}
```

#### Parameters
| Parameter | Type | Required | Description | Validation |
|-----------|------|----------|-------------|------------|
| `employee_id` | `number` | ✅ Yes | ID of the employee | Must be a valid integer |
| `type` | `string` | ❌ No | Payment method | Must be valid PaymentWays enum |

#### Response
**Success (200):**
```json
{
  "status": "success",
  "message": "Salary marked as paid successfully",
  "data": {
    "employee_id": 15,
    "salary_log_id": 123,
    "transaction_id": 456,
    "expense_id": 789,
    "amount": 35000,
    "payment_method": "bank",
    "paid_on": "2025-01-15T10:30:00.000Z"
  }
}
```

**Error Responses:**
- **400 Bad Request:**
  ```json
  {
    "status": "error",
    "message": "No unpaid salary found for the current month",
    "error_code": "NO_UNPAID_SALARY_FOUND"
  }
  ```

---

## Backend Logic & Database Operations

### Salary Deduction Calculation

1. **Input Validation:**
   - Validates employeeId format if provided
   - Validates month format if provided
   - Checks for valid month range (01-12)
   - Checks for valid year range (2000-2100)

2. **Deduction Calculation:**
   - Uses finance service to calculate comprehensive deductions
   - Includes attendance-based deductions (absent, late, half-day)
   - Includes sales department deductions (chargeback, refund)
   - Calculates total deduction as sum of all deduction types

3. **Database Operations:**
   ```sql
   -- Get employee attendance data
   SELECT * FROM monthly_attendance_summary 
   WHERE emp_id = [EMPLOYEE_ID] AND month = '[MONTH]';
   
   -- Get sales department deductions
   SELECT chargebackDeductions, refundDeductions 
   FROM sales_departments 
   WHERE employeeId = [EMPLOYEE_ID];
   
   -- Get employee base salary
   SELECT baseSalary FROM account WHERE employeeId = [EMPLOYEE_ID];
   ```

4. **Deduction Types:**
   - **Absent Days**: `perDaySalary * 2 * absentDays`
   - **Late Days**: Progressive deduction after monthly allowance
   - **Half Days**: Progressive deduction based on attendance logs
   - **Chargeback**: Fixed amount from sales department
   - **Refund**: Fixed amount from sales department

5. **Response Formatting:**
   - Formats employee names for better display
   - Calculates summary totals for all employees
   - Provides detailed breakdown of each deduction type

### Salary Update Process

1. **Employee Validation:**
   - Checks if employee exists and is active
   - Validates account record exists

2. **Permission Checks:**
   - HR cannot update their own salary
   - HR cannot update salary of another HR with salary permission
   - Admins have no restrictions

3. **Database Updates:**
   ```sql
   UPDATE account 
   SET base_salary = [NEW_AMOUNT], updated_at = NOW() 
   WHERE employee_id = [EMPLOYEE_ID];
   ```

4. **Logging:**
   - Creates HR log entry for non-admin users
   - Records previous and new salary amounts

### Salary Payment Process

1. **Validation:**
   - Checks if employee exists and is active
   - Finds unpaid salary log for current month

2. **Database Transaction:**
   ```sql
   -- Update salary log
   UPDATE net_salary_logs 
   SET paid_on = NOW(), status = 'paid', processed_by = [USER_ID] 
   WHERE id = [SALARY_LOG_ID];
   
   -- Reset bonuses
   UPDATE employee SET bonus = 0 WHERE id = [EMPLOYEE_ID];
   UPDATE sales_departments SET bonus = 0 WHERE employee_id = [EMPLOYEE_ID];
   
   -- Create transaction record
   INSERT INTO transactions (employee_id, amount, transaction_type, ...);
   
   -- Create expense record
   INSERT INTO expenses (title, category, amount, ...);
   ```

3. **HR Logging:**
   - Creates HR log entry for non-admin users
   - Records payment details and bonus resets

---

## Database Schema

### HR Logs Table (`hr_logs`)
| Field | Type | Description |
|-------|------|-------------|
| `hr_log_id` | `SERIAL` | Primary key |
| `hr_id` | `INTEGER` | Foreign key to HR table |
| `action_type` | `VARCHAR(255)` | Type of HR action (e.g., 'employee_termination', 'salary_update', 'salary_payment') |
| `affected_employee_id` | `INTEGER` | ID of employee affected by the action |
| `description` | `TEXT` | Detailed description of the action |
| `created_at` | `TIMESTAMP` | When the log was created |
| `updated_at` | `TIMESTAMP` | When the log was last updated |

### Salary-Related Tables
| Table | Purpose |
|-------|---------|
| `net_salary_logs` | Tracks salary calculations and payments |
| `transactions` | Records salary payment transactions |
| `expenses` | Tracks salary expenses |
| `sales_departments` | Contains sales-specific deductions |

### Relationships
- `hr_logs.hr_id` → `hr.id`
- `hr_logs.affected_employee_id` → `employees.id`
- `sales_departments.employeeId` → `employees.id`
- `net_salary_logs.employee_id` → `employees.id`
- `transactions.employee_id` → `employees.id`

---

## Security & Permissions

### Required Permissions
- **Department:** HR
- **Permission:** `salary_permission`

### Authentication
- JWT token required
- User must be authenticated as HR employee

### Authorization Flow
1. JWT token validation
2. Role verification (HR department)
3. Permission check (salary permission)
4. HR record validation

### Permission Restrictions
- **HR Users:**
  - Cannot update their own salary
  - Cannot update salary of another HR with salary permission
  - Can update regular employee salaries
- **Admin Users:**
  - No restrictions on salary updates
  - Can update any employee salary

---

## Error Handling

### Common Error Scenarios
1. **Invalid Date Format:** Returns 400 with specific format guidance
2. **Employee Not Found:** Returns 404 with employee ID
3. **Already Terminated:** Returns 400 with clear message
4. **HR Record Not Found:** Returns 404 for HR logs endpoint
5. **Database Errors:** Returns 400 with error details
6. **Invalid Month Format:** Returns 400 with format guidance
7. **Missing Attendance Data:** Returns 404 with employee details
8. **Permission Violations:** Returns 400 with specific restriction message
9. **No Unpaid Salary:** Returns 400 when no salary to pay
10. **Transaction Failures:** Returns 400 with transaction error details

### Logging
- All termination actions are logged with timestamps
- All salary updates are logged with before/after amounts
- All salary payments are logged with transaction details
- Automatic descriptions generated when none provided
- Full audit trail maintained in `hr_logs` table
- Deduction calculation errors are logged for debugging

---

## Testing

### Unit Tests
- Employee termination with and without description
- Invalid date format handling
- Non-existent employee handling
- Already terminated employee handling
- HR logs retrieval
- HR record validation
- Salary deduction calculation for single employee
- Salary deduction calculation for all employees
- Invalid query parameter handling
- Salary update permission checks
- Salary payment validation
- Bonus reset functionality

### Integration Tests
- End-to-end termination flow
- Database transaction integrity
- Finance module integration
- Logging accuracy
- Deduction calculation integration
- Sales department deduction integration
- Salary update workflow
- Salary payment workflow
- Transaction and expense creation

---

## Future Enhancements

### Potential Features
1. **Bulk Termination:** Handle multiple employee terminations
2. **Termination Templates:** Predefined termination reasons
3. **Advanced Logging:** More detailed action tracking
4. **Notification System:** Automatic notifications to stakeholders
5. **Approval Workflow:** Multi-level approval for terminations
6. **Deduction Reports:** Generate detailed deduction reports
7. **Deduction History:** Track deduction changes over time
8. **Deduction Approvals:** Workflow for deduction approvals
9. **Salary History:** Track salary changes over time
10. **Payment Scheduling:** Automated salary payment scheduling
11. **Tax Calculations:** Integrate tax deduction calculations
12. **Benefits Management:** Handle benefits and allowances