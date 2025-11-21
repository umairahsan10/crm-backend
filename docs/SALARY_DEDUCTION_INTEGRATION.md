# Salary Deduction Integration System

## Overview

The Salary Deduction Integration System automatically calculates and stores attendance-based deductions alongside every salary calculation. This ensures that all salary records include deduction information for accurate payroll processing.

## Key Features

- **Automatic Deduction Calculation**: Deductions are calculated automatically before every salary calculation
- **Progressive Penalty System**: Late and half-day deductions follow a progressive penalty structure
- **Prorated Deductions**: Deductions are prorated for partial month calculations (new employees, terminations)
- **Frontend Display Endpoints**: New endpoints for displaying salary with deductions subtracted
- **Complete Audit Trail**: All salary logs include deduction amounts for transparency

## Architecture

### Database Schema

The `net_salary_logs` table already includes a `deductions` field that stores the total deduction amount for each salary record.

```sql
-- Existing field in net_salary_logs table
deductions  Int?  -- Total deductions amount (not subtracted from netSalary)
```

### Service Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   HR Controller │    │   HR Service     │    │ Finance Service │
│                 │    │                  │    │                 │
│ GET /hr/        │───▶│ calculateSalary  │───▶│ calculateSalary │
│ salary-deductions│   │ Deductions()     │    │ (with deductions)│
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │                        │
                                │                        │
                                ▼                        ▼
                       ┌──────────────────┐    ┌─────────────────┐
                       │   Employee DB    │    │ Attendance DB   │
                       │   (names, etc.)  │    │ (attendance,    │
                       └──────────────────┘    │  salary data)   │
                                               └─────────────────┘
```

## Salary Calculation Logic

### Base Salary Calculation
- **Full Base Salary**: The exact base salary amount from the employee's account
- **Prorated Base Salary**: For partial months, base salary is prorated by days worked
- **Formula**: `Prorated Base Salary = Full Base Salary × (daysWorked / 30)`

### Bonus Structure
- **Employee Bonus**: Bonus amount from the `Employee` table (`employee.bonus`)
- **Sales Bonus**: Bonus amount from the `SalesDepartment` table (`salesDepartment.bonus`)
- **Total Bonus**: Sum of both bonuses (`employeeBonus + salesBonus`)
- **Full Amount**: Both bonuses are added as full amounts (not prorated)

### Commission Calculation
- **Source**: Commission amount from the `SalesDepartment` table (`salesDepartment.commissionAmount`)
- **Full Amount**: Commission is added as full amount (not prorated)

### Net Salary Formula
```
Net Salary = Prorated Base Salary + Employee Bonus + Sales Bonus + Commission
Final Salary = Net Salary - Deductions
```

## Deduction Calculation Logic

### 1. Absent Days
- **Formula**: `perDaySalary * 2 * absentDays`
- **Example**: If per-day salary is 1000 and employee was absent for 2 days
- **Deduction**: 1000 × 2 × 2 = 4000

### 2. Late Days (Progressive)
- **Monthly Allowance**: Uses `monthly_lates_days` from companies table
- **Excess Days**: Only days beyond the allowance are penalized
- **Progressive Formula**: 
  - 1st excess day: `perDaySalary * 0.5`
  - 2nd excess day: `perDaySalary * 1.0`
  - 3rd excess day: `perDaySalary * 1.5`
  - And so on...

**Example**: If monthly allowance is 3 days, employee was late 6 days, per-day salary is 1000
- Excess days: 6 - 3 = 3 days
- Deduction: (1000 × 0.5) + (1000 × 1.0) + (1000 × 1.5) = 3000

### 3. Half Days (Progressive)
- **Source**: Counted from `attendance_logs` table with status 'half_day'
- **Progressive Formula**: Same as late days
  - 1st half day: `perDaySalary * 0.5`
  - 2nd half day: `perDaySalary * 1.0`
  - 3rd half day: `perDaySalary * 1.5`

### 4. Chargeback Deductions
- **Source**: `chargebackDeductions` field from `sales_departments` table
- **Formula**: Fixed amount (not prorated)
- **Scope**: Only applies to sales department employees
- **Example**: If employee has 1000 in chargeback deductions, this amount is deducted from salary

### 5. Refund Deductions
- **Source**: `refundDeductions` field from `sales_departments` table
- **Formula**: Fixed amount (not prorated)
- **Scope**: Only applies to sales department employees
- **Example**: If employee has 500 in refund deductions, this amount is deducted from salary

### Total Deduction Formula
```
Total Deduction = Absent Deduction + Late Deduction + Half Day Deduction + Chargeback Deduction + Refund Deduction
```

## Integration Points

### 1. Auto-Calculate Salary (Monthly Cron)
- **Schedule**: 4th of every month at 5:00 PM PKT
- **Process**: 
  1. Calculate base salary + bonus + commissions
  2. Calculate deductions for the same period
  3. Store both in `net_salary_logs`

### 2. HR Termination Process
- **Trigger**: When HR terminates an employee
- **Process**:
  1. Calculate final salary (existing logic)
  2. Calculate deductions for termination period
  3. Store both in `net_salary_logs`

### 3. Manual Salary Calculation
- **Trigger**: HR/Finance manually triggers salary calculation
- **Process**:
  1. Calculate salary for specified period
  2. Calculate deductions for the same period
  3. Store both in `net_salary_logs`

## API Endpoints

### Salary Calculation Endpoints (Existing - Now with Deductions)

#### 1. Read-Only Salary Calculation for Employee (Current Period)
```bash
GET /salary/calculate/1?endDate=2025-01-15
Headers: Authorization: Bearer <token>

Query Parameters:
- employeeId (path parameter): Employee ID to calculate salary for
- endDate (query parameter, optional): End date for calculation (defaults to current date)

Examples:
# Calculate for current period (up to current date)
GET /salary/calculate/1

# Calculate for specific end date
GET /salary/calculate/1?endDate=2025-01-15
```

**Response**:
```json
{
  "employee": {
    "id": 1,
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@company.com",
    "status": "active",
    "department": "Sales",
    "startDate": "2024-01-15T00:00:00.000Z",
    "endDate": null
  },
  "salary": {
    "fullBaseSalary": 30000,
    "proratedBaseSalary": 15000,
    "employeeBonus": 2000,
    "salesBonus": 3000,
    "totalBonus": 5000,
    "commission": 4000,
    "netSalary": 24000,
    "deductions": 2000,
    "finalSalary": 22000
  },
  "calculationPeriod": {
    "startDay": 1,
    "endDay": 15,
    "daysWorked": 15,
    "year": 2025,
    "month": 0
  },
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
      },
      {
        "day": 2,
        "deduction": 2000,
        "reason": "Absent"
      }
    ],
    "lateDetails": [
      {
        "day": 1,
        "deduction": 1000,
        "reason": "Late (excess)"
      },
      {
        "day": 2,
        "deduction": 1500,
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

**Important Notes**:
- This endpoint is **read-only** and does NOT update the database
- It calculates salary and deductions for the current period up to the specified end date
- **Base Salary**: Only base salary is prorated for partial months; bonuses and commission are added as full amounts
- **Bonus Structure**: Shows both employee bonus and sales bonus separately
- **Detailed Deduction Breakdown**: Includes complete deduction details with day-by-day breakdown
- Smart calculation automatically determines the period based on employee type:
  - **Old employees**: 1st of current month to current date
  - **New employees**: Start date to current date
  - **Terminated employees**: 1st/start date to termination date
- Perfect for real-time salary preview and analysis

#### 2. Auto-Calculate All Employees
```bash
POST /salary/auto
Headers: Authorization: Bearer <token>
Body: {}
```

### Deduction-Specific Endpoints

#### 3. HR Deduction Calculation
```bash
GET /hr/salary-deductions?employeeId=1&month=2025-01
Headers: 
  Authorization: Bearer <your_jwt_token>

Query Parameters:
# For specific employee and month
?employeeId=1&month=2025-01

# For specific employee, current month
?employeeId=1

# For all employees, specific month
?month=2025-01

# For all employees, current month
# No query parameters needed

Expected Response:
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

### Frontend Display Endpoints (New)

**Important Update**: The HR Deduction Calculation endpoint (`GET /hr/salary-deductions`) now includes a `finalSalary` field that shows the salary after deductions are subtracted (baseSalary - totalDeduction). The `netSalary` field represents the base salary before deductions.

#### 5. Get Salary Display for Employee
```bash
GET /salary/display/1?month=2025-01
Headers: Authorization: Bearer <token>
```

**Response**:
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

#### 6. Get All Salaries Display
```bash
GET /salary/display?month=2025-01
Headers: Authorization: Bearer <token>
```

**Response**:
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

**Formula**: `Final Salary = Base Salary + Employee Bonus + Sales Bonus + Commission - Deductions`

#### 7. Get Detailed Salary Breakdown for Employee
```bash
GET /salary/display/1/detailed?month=2025-01
Headers: Authorization: Bearer <token>
```

**Response**:
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
      },
      {
        "day": 2,
        "deduction": 2000,
        "reason": "Absent"
      }
    ],
    "lateDetails": [
      {
        "day": 1,
        "deduction": 1000,
        "reason": "Late (excess)"
      },
      {
        "day": 2,
        "deduction": 1500,
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

## Database Records

### Net Salary Logs Structure
```sql
-- Example record in net_salary_logs table
{
  "id": 1,
  "employee_id": 1,
  "month": "2025-01",
  "net_salary": 30000,        -- Base + Bonus + Commissions (unchanged)
  "deductions": 6000,         -- Total deductions (new)
  "status": "unpaid",
  "created_at": "2025-01-15T10:30:00Z"
}
```

### Key Points
- **Net Salary**: Remains unchanged (Base + Bonus + Commissions)
- **Deductions**: Stored separately, not subtracted
- **Final Salary**: Calculated in frontend (Net Salary - Deductions)
- **No Backend Subtraction**: Backend only stores, frontend displays final amount

## Implementation Details

### Modified Methods

#### 1. `calculateSalary()` - Finance Service
- **Before**: Calculated salary only
- **After**: Calculates salary + deductions + stores both

#### 2. `calculateSalaryManual()` - Finance Service
- **Before**: Smart salary calculation only
- **After**: Smart salary calculation + deductions + stores both

#### 3. `calculateAllEmployees()` - Finance Service
- **Before**: Auto-calculated salary for all employees
- **After**: Auto-calculates salary + deductions for all employees

### New Methods

#### 1. `calculateDeductionsForPeriod()` - Finance Service
- Calculates deductions for a specific period
- Handles proration for partial months
- Returns total deduction amount

#### 2. `createSalaryLog()` - Finance Service
- Creates salary log with deductions
- Ensures both salary and deductions are stored

#### 3. `getSalaryDisplay()` - Finance Service
- Returns salary display with deductions subtracted
- For frontend consumption

#### 4. `getAllSalariesDisplay()` - Finance Service
- Returns all salaries with deductions subtracted
- Includes summary calculations

## Testing

### Complete API Testing Guide

#### 1. Read-Only Salary Calculation for Employee (Current Period)
```bash
GET /salary/calculate/1?endDate=2025-01-15
Headers: 
  Authorization: Bearer <your_jwt_token>

Query Parameters:
# For current period (up to current date)
GET /salary/calculate/1

# For specific end date
GET /salary/calculate/1?endDate=2025-01-15

Expected Response:
{
  "employee": {
    "id": 1,
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@company.com",
    "status": "active",
    "department": "Sales",
    "startDate": "2024-01-15T00:00:00.000Z",
    "endDate": null
  },
  "salary": {
    "fullBaseSalary": 30000,
    "proratedBaseSalary": 15000,
    "employeeBonus": 2000,
    "salesBonus": 3000,
    "totalBonus": 5000,
    "commission": 4000,
    "netSalary": 24000,
    "deductions": 2000,
    "finalSalary": 22000
  },
  "calculationPeriod": {
    "startDay": 1,
    "endDay": 15,
    "daysWorked": 15,
    "year": 2025,
    "month": 0
  },
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
      },
      {
        "day": 2,
        "deduction": 2000,
        "reason": "Absent"
      }
    ],
    "lateDetails": [
      {
        "day": 1,
        "deduction": 1000,
        "reason": "Late (excess)"
      },
      {
        "day": 2,
        "deduction": 1500,
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

**Important**: This endpoint is read-only and does NOT update the database. It's for real-time salary preview and analysis with complete deduction breakdown.

#### 2. Auto-Calculate All Employees (with Deductions)
```bash
POST /salary/auto
Headers: 
  Authorization: Bearer <your_jwt_token>
  Content-Type: application/json

Body Parameters:
# No body required - triggers calculation for all active employees
{}

Expected Response:
{
  "message": "Salary calculation triggered for all employees"
}
```



#### 3. HR Deduction Calculation
```bash
GET /hr/salary-deductions?employeeId=1&month=2025-01
Headers: 
  Authorization: Bearer <your_jwt_token>

Query Parameters:
# For specific employee and month
?employeeId=1&month=2025-01

# For specific employee, current month
?employeeId=1

# For all employees, specific month
?month=2025-01

# For all employees, current month
# No query parameters needed

Expected Response:
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

#### 5. Get Salary Display for Employee
```bash
GET /salary/display/1?month=2025-01
Headers: 
  Authorization: Bearer <your_jwt_token>

Query Parameters:
# For specific month
month=2025-01

# For current month (default)
# No query parameter needed

Expected Response:
{
  "employeeId": 1,
  "employeeName": "John Doe",
  "month": "2025-01",
  "netSalary": 30000,
  "deductions": 6000,
  "finalSalary": 24000,
  "status": "unpaid",
  "paidOn": null,
  "createdAt": "2025-01-15T10:30:00Z"
}
```

#### 6. Get All Salaries Display
```bash
GET /salary/display?month=2025-01
Headers: 
  Authorization: Bearer <your_jwt_token>

Query Parameters:
# For specific month
month=2025-01

# For current month (default)
# No query parameter needed

Expected Response:
{
  "month": "2025-01",
  "totalEmployees": 5,
  "totalBaseSalary": 150000,
  "totalCommission": 25000,
  "totalEmployeeBonus": 10000,
  "totalSalesBonus": 15000,
  "totalBonus": 25000,
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
      "deductions": 4000,
      "finalSalary": 34000,
      "status": "unpaid",
      "paidOn": null,
      "createdAt": "2025-01-15T10:30:00Z"
    }
  ]
}
```

### Complete Testing Sequence

#### Step 1: Test Salary Calculation with Deductions
```bash
POST /salary/calculate
{
  "employee_id": 1,
  "start_date": "2025-01-01",
  "end_date": "2025-01-31"
}
```

#### Step 2: Test Frontend Display
```bash
GET /salary/display/1?month=2025-01
```

#### Step 3: Test HR Deduction Endpoint
```bash
GET /hr/salary-deductions?employeeId=1&month=2025-01
```

#### Step 4: Test All Salaries Display
```bash
GET /salary/display?month=2025-01
```

#### Step 5: Test Detailed Employee Breakdown
```bash
GET /salary/display/1/detailed?month=2025-01
```

### cURL Testing Examples

```bash
# Test salary calculation
curl -X POST http://localhost:3000/salary/calculate \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"employee_id": 1, "start_date": "2025-01-01", "end_date": "2025-01-31"}'

# Test display endpoint
curl -X GET "http://localhost:3000/salary/display/1?month=2025-01" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Test HR deduction endpoint
curl -X GET "http://localhost:3000/hr/salary-deductions?employeeId=1&month=2025-01" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Authentication Requirements

All endpoints require:
- **JWT Token**: Valid token from HR/Accounts employee
- **Permissions**: `salary_permission`
- **Departments**: HR or Accounts

### Important Testing Notes

1. **Employee ID**: Replace `1` with actual employee IDs from your database
2. **Month Format**: Use `YYYY-MM` format (e.g., "2025-01")
3. **Date Format**: Use `YYYY-MM-DD` format for start/end dates
4. **Prerequisites**: Ensure you have:
   - Employee with base salary in `accounts` table
   - Attendance data in `monthly_attendance_summary` table
   - Company settings with `monthly_lates_days` value
   - Half-day records in `attendance_logs` table (if testing half-day deductions)

### Error Handling and Validation

The API now provides clear, user-friendly error messages for common issues:

#### Invalid Parameters
```json
// Invalid employeeId
{
  "statusCode": 400,
  "message": "Invalid employeeId. Must be a positive number.",
  "error": "Bad Request"
}

// Invalid month format
{
  "statusCode": 400,
  "message": "Invalid month format. Must be in YYYY-MM format (e.g., 2025-01).",
  "error": "Bad Request"
}

// Invalid month range
{
  "statusCode": 400,
  "message": "Invalid month. Month must be between 01 and 12.",
  "error": "Bad Request"
}
```

#### Missing Data
```json
// Employee not found
{
  "statusCode": 404,
  "message": "Employee with ID 999 not found.",
  "error": "Not Found"
}

// No attendance data
{
  "statusCode": 404,
  "message": "No attendance data found for employee John Doe (ID: 1) for month 2025-01. Please ensure attendance data is available.",
  "error": "Not Found"
}

// No base salary
{
  "statusCode": 404,
  "message": "No base salary found for employee John Doe (ID: 1). Please set the base salary in the employee account.",
  "error": "Not Found"
}

// No salary record
{
  "statusCode": 404,
  "message": "No salary record found for employee John Doe (ID: 1) for month 2025-01. Please calculate salary first.",
  "error": "Not Found"
}

// Company settings missing
{
  "statusCode": 404,
  "message": "Company settings not found. Please configure company settings first.",
  "error": "Not Found"
}
```

#### Employee Status Issues
```json
// Inactive employee
{
  "statusCode": 400,
  "message": "Employee John Doe is not active. Current status: terminated",
  "error": "Bad Request"
}
```

### Prerequisites for Testing

1. **Database Setup**:
   ```sql
   -- Company settings
   INSERT INTO companies (monthly_lates_days) VALUES (3);
   
   -- Employee with base salary
   INSERT INTO employees (id, first_name, last_name, email, password_hash) 
   VALUES (1, 'John', 'Doe', 'john@example.com', 'hashed_password');
   
   INSERT INTO accounts (employee_id, base_salary) 
   VALUES (1, 30000);
   
   -- Attendance summary
   INSERT INTO monthly_attendance_summary (emp_id, month, total_present, total_absent, total_late_days) 
   VALUES (1, '2025-01', 22, 2, 5);
   
   -- Half-day attendance logs
   INSERT INTO attendance_logs (employee_id, date, status) 
   VALUES (1, '2025-01-15', 'half_day');
   ```

2. **Authentication**: Valid JWT token from HR/Accounts employee

## Benefits

### 1. Complete Integration
- All salary calculations automatically include deductions
- No manual intervention required
- Consistent deduction calculation across all scenarios

### 2. Audit Trail
- Complete record of salary and deductions
- Transparent payroll processing
- Easy to track deduction history

### 3. Frontend Flexibility
- Frontend can display salary with or without deductions
- Multiple display options available
- Real-time calculation of final salary

### 4. Backward Compatibility
- Existing salary calculation logic unchanged
- All existing endpoints continue to work
- No breaking changes to existing functionality

## Error Handling

### Deduction Calculation Failures
- If deduction calculation fails, salary calculation continues
- Deductions are set to 0 if calculation fails
- Errors are logged but don't break salary processing

### Missing Data Handling
- Missing attendance data: Deductions = 0
- Missing company settings: Uses default values
- Missing employee data: Throws appropriate error

## Monitoring and Logging

### Key Log Messages
```
🔄 Auto calculation: Processing salary for X active employees only
✅ Deductions calculated for employee X: Y total deduction
📝 Salary log created for employee X - Net Salary: Y, Deductions: Z
📊 Deduction calculation summary: X employees processed, Y total deductions
```

### Performance Considerations
- Deduction calculations are optimized for batch processing
- Database queries are minimized through efficient joins
- Progressive calculations are cached where possible

## Future Enhancements

### Potential Improvements
1. **Detailed Deduction Breakdown**: Store individual deduction types separately
2. **Deduction History**: Track deduction changes over time
3. **Deduction Reports**: Generate detailed deduction reports
4. **Deduction Rules**: Configurable deduction rules per company
5. **Deduction Approvals**: Workflow for deduction approvals

### Configuration Options
1. **Deduction Thresholds**: Configurable thresholds for different deduction types
2. **Deduction Caps**: Maximum deduction limits
3. **Deduction Exemptions**: Employee-specific deduction exemptions
4. **Deduction Periods**: Flexible deduction calculation periods

## Recent Updates

### Timezone Consistency (Latest)
- **All timestamps now use PKT (Pakistan Standard Time, UTC+5)**
- **Database records**: `createdAt` and `updatedAt` fields use PKT timezone
- **Salary calculations**: All date operations use PKT timezone
- **Helper methods**: `getCurrentDateInPKT()` and `getDateInPKT()` ensure consistency

### API Endpoint Updates (Latest)
- **`POST /salary/calculate` → `GET /salary/calculate/:employeeId`**: Changed to read-only calculation
- **Read-only calculation**: No database updates, perfect for real-time preview
- **Smart period detection**: Automatically determines calculation period based on employee type
- **Enhanced validation**: Better error handling and parameter validation

### Bonus Structure Updates (Latest)
- **Dual Bonus System**: Now shows both employee bonus and sales bonus separately
- **Full Amount Bonuses**: Both bonuses are added as full amounts (not prorated)
- **Full Amount Commission**: Commission is also added as full amount (not prorated)
- **Base Salary Transparency**: Shows both full base salary and prorated amount used in calculations

### Key Benefits of Updates
- **Real-time preview**: Calculate salary without affecting stored data
- **Timezone accuracy**: All timestamps show correct local time
- **Better UX**: Clear error messages and validation
- **Flexible periods**: Support for custom end dates
- **Transparent bonuses**: Clear separation of different bonus types
- **Accurate calculations**: Full amounts for bonuses and commission, prorated base salary

## Chargeback and Refund Deductions (Latest Update)

### Overview
The system now includes **chargeback and refund deductions** from the sales department, providing a complete view of all deduction types for accurate salary calculations.

### New Deduction Types

#### Chargeback Deductions
- **Source**: `chargebackDeductions` field in `sales_departments` table
- **Scope**: Only applies to sales department employees
- **Calculation**: Fixed amount (not prorated for partial periods)
- **Purpose**: Deducts amounts for chargebacks processed against sales transactions

#### Refund Deductions
- **Source**: `refundDeductions` field in `sales_departments` table
- **Scope**: Only applies to sales department employees
- **Calculation**: Fixed amount (not prorated for partial periods)
- **Purpose**: Deducts amounts for refunds processed against sales transactions

### Updated Total Deduction Formula
```
Total Deduction = Absent Deduction + Late Deduction + Half Day Deduction + Chargeback Deduction + Refund Deduction
```

### API Response Updates

#### HR Salary Deduction Endpoint (`GET /hr/salary-deductions`)
**New Fields Added:**
- `chargebackDeduction`: Amount deducted for chargebacks
- `refundDeduction`: Amount deducted for refunds

**Example Response:**
```json
{
  "calculations": [
    {
      "employeeId": 1,
      "employeeName": "John Doe",
      "baseSalary": 30000,
      "perDaySalary": 1000,
      "month": "2025-01",
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
  ]
}
```

#### Salary Display Endpoints
**New Fields Added:**
- `attendanceDeductions`: Original attendance-based deductions
- `chargebackDeduction`: Chargeback deduction amount
- `refundDeduction`: Refund deduction amount
- `deductions`: Total deductions (attendance + chargeback + refund)

**Updated Summary Fields:**
- `totalAttendanceDeductions`: Sum of all attendance-based deductions
- `totalChargebackDeductions`: Sum of all chargeback deductions
- `totalRefundDeductions`: Sum of all refund deductions
- `totalDeductions`: Sum of all deduction types

### Database Integration
- **Automatic Fetching**: Chargeback and refund amounts are automatically fetched from `sales_departments` table
- **Zero Values**: Non-sales employees automatically have 0 values for these fields
- **No Manual Updates**: Amounts are managed through the sales department system

### Benefits
- **Complete Deduction View**: All deduction types are now included in salary calculations
- **Sales Department Integration**: Seamless integration with existing sales department data
- **Transparent Breakdown**: Clear separation between attendance and sales-related deductions
- **Automatic Calculation**: No manual intervention required for chargeback/refund deductions

## Conclusion

The Salary Deduction Integration System provides a comprehensive solution for automatically calculating and storing attendance-based deductions alongside salary calculations. The system maintains backward compatibility while adding powerful new features for accurate payroll processing and transparent salary management.

All existing salary calculation workflows now automatically include deduction calculations, ensuring that every salary record contains complete information for accurate payroll processing and frontend display.

The recent updates enhance the system with timezone consistency and a new read-only calculation endpoint for real-time salary analysis without database modifications. 