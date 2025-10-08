# Complete Employee Creation API - Single Endpoint

## Overview
This API endpoint creates a complete employee record with all related department-specific and bank account data in a **single atomic transaction**. Either all records are created successfully, or none are created (rollback on any failure).

## Endpoint
```
POST /hr/employees/complete
```

## Authentication & Permissions
- **Required:** JWT Authentication
- **Department:** HR
- **Permission:** `employee_add_permission`

## Key Features
✅ **Atomic Transaction** - All-or-nothing operation  
✅ **Automatic Password Hashing** - Passwords are hashed with bcrypt  
✅ **Comprehensive Validation** - All foreign keys validated before creation  
✅ **Department-Specific Records** - Automatically creates based on department  
✅ **Automatic HR Logging** - Creates audit trail  
✅ **Complete Response** - Returns all created records with relations  

---

## Request Body Structure

### Complete Request Example (Sales Employee)
```json
{
  "employee": {
    // REQUIRED FIELDS
    "firstName": "Ali",
    "lastName": "Khan",
    "email": "ali.khan@company.com",
    "gender": "male",
    "departmentId": 2,
    "roleId": 5,
    "passwordHash": "Ali@123",
    
    // OPTIONAL FIELDS
    "phone": "+923001234567",
    "cnic": "12345-1234567-1",
    "managerId": 10,
    "teamLeadId": 15,
    "address": "123 Street, Karachi",
    "maritalStatus": false,
    "status": "active",
    "startDate": "2025-10-01",
    "endDate": null,
    "modeOfWork": "hybrid",
    "remoteDaysAllowed": 2,
    "dob": "1995-06-15",
    "emergencyContact": "+923009876543",
    "shiftStart": "09:00",
    "shiftEnd": "18:00",
    "employmentType": "full_time",
    "dateOfConfirmation": "2026-01-01",
    "periodType": "probation",
    "bonus": 5000
  },
  
  "departmentData": {
    "sales": {
      // REQUIRED for Sales
      "withholdCommission": 0.00,
      "withholdFlag": false,
      
      // OPTIONAL
      "salesUnitId": 3,
      "commissionRate": 5.00,
      "targetAmount": 100000.00,
      "leadsClosed": 0,
      "salesAmount": 0.00,
      "commissionAmount": 0.00,
      "chargebackDeductions": 0.00,
      "refundDeductions": 0.00,
      "salesBonus": 0.00
    }
  },
  
  "bankAccount": {
    "accountTitle": "Ali Khan",
    "bankName": "HBL",
    "ibanNumber": "PK36HABB0000000000000",
    "baseSalary": 45000.00
  }
}
```

---

## Department-Specific Data

### 1. HR Department
```json
"departmentData": {
  "hr": {
    "attendancePermission": true,
    "salaryPermission": false,
    "commissionPermission": false,
    "employeeAddPermission": true,
    "terminationsHandle": false,
    "monthlyRequestApprovals": true,
    "targetsSet": false,
    "bonusesSet": true,
    "shiftTimingSet": true
  }
}
```
**All fields are optional** - Default: `null`

---

### 2. Sales Department
```json
"departmentData": {
  "sales": {
    "withholdCommission": 0.00,        // ✅ REQUIRED
    "withholdFlag": false,             // ✅ REQUIRED
    "salesUnitId": 3,                  // Optional
    "commissionRate": 5.00,            // Optional (0-100%)
    "targetAmount": 50000.00,          // Optional
    "leadsClosed": 0,                  // Optional
    "salesAmount": 0.00,               // Optional
    "commissionAmount": 0.00,          // Optional
    "chargebackDeductions": 0.00,      // Optional
    "refundDeductions": 0.00,          // Optional
    "salesBonus": 0.00                 // Optional
  }
}
```
**Required:** `withholdCommission`, `withholdFlag`  
**Validated:** `salesUnitId` (must exist if provided)

---

### 3. Marketing Department
```json
"departmentData": {
  "marketing": {
    "marketingUnitId": 2,              // Optional
    "totalCampaignsRun": 0,            // Optional
    "platformFocus": "Social Media"    // Optional
  }
}
```
**All fields are optional**  
**Validated:** `marketingUnitId` (must exist if provided)

---

### 4. Production Department
```json
"departmentData": {
  "production": {
    "productionUnitId": 1,             // Optional
    "specialization": "Full Stack",    // Optional
    "projectsCompleted": 0             // Optional
  }
}
```
**All fields are optional**  
**Validated:** `productionUnitId` (must exist if provided)

---

### 5. Accounts Department (Accountant)
```json
"departmentData": {
  "accountant": {
    "liabilitiesPermission": true,
    "salaryPermission": true,
    "salesPermission": false,
    "invoicesPermission": true,
    "expensesPermission": true,
    "assetsPermission": false,
    "revenuesPermission": true
  }
}
```
**All fields are optional** - Default: `null`

---

### 6. Bank Account (Optional for ALL departments)
```json
"bankAccount": {
  "accountTitle": "Employee Name",   // Optional
  "bankName": "HBL",                 // Optional
  "ibanNumber": "PK36...",           // Optional
  "baseSalary": 50000.00             // Optional
}
```
**All fields are optional** - Can be omitted entirely

---

## Success Response

```json
{
  "status": "success",
  "message": "Employee created successfully with all related records",
  "data": {
    "employee": {
      "id": 25,
      "firstName": "Ali",
      "lastName": "Khan",
      "email": "ali.khan@company.com",
      "departmentId": 2,
      "roleId": 5,
      "status": "active",
      "department": {
        "id": 2,
        "name": "Sales"
      },
      "role": {
        "id": 5,
        "name": "junior"
      },
      "manager": {
        "id": 10,
        "firstName": "Ahmed",
        "lastName": "Ali",
        "email": "ahmed.ali@company.com"
      },
      "salesDepartment": {
        "id": 15,
        "employeeId": 25,
        "salesUnitId": 3,
        "commissionRate": 5.00,
        "targetAmount": 100000.00,
        "withholdCommission": 0.00,
        "withholdFlag": false
      },
      "account": {
        "id": 8,
        "employeeId": 25,
        "accountTitle": "Ali Khan",
        "bankName": "HBL",
        "ibanNumber": "PK36HABB0000000000000",
        "baseSalary": 45000.00
      }
      // ... all other employee fields
    },
    "departmentRecord": {
      // Department-specific record data
    },
    "bankAccountRecord": {
      // Bank account record data (if created)
    }
  }
}
```

---

## Error Responses

### 1. Email Already Exists
```json
{
  "statusCode": 400,
  "message": "Employee with email ali.khan@company.com already exists"
}
```

### 2. Department Not Found
```json
{
  "statusCode": 404,
  "message": "Department with ID 999 not found"
}
```

### 3. Role Not Found
```json
{
  "statusCode": 404,
  "message": "Role with ID 999 not found"
}
```

### 4. Manager Not Found
```json
{
  "statusCode": 404,
  "message": "Manager with ID 999 not found"
}
```

### 5. Sales Unit Not Found
```json
{
  "statusCode": 404,
  "message": "Sales Unit with ID 999 not found"
}
```

### 6. Missing Required Sales Fields
```json
{
  "statusCode": 400,
  "message": "withholdCommission is required for Sales department"
}
```

### 7. Multiple Department Data Provided
```json
{
  "statusCode": 400,
  "message": "Only one department data should be provided. Found: sales, hr"
}
```

### 8. Department Data Mismatch
```json
{
  "statusCode": 400,
  "message": "Department data mismatch. Selected department is 'Sales' but provided data for 'hr'. Please provide 'sales' data for Sales department."
}
```

### 9. Sales Department Data Missing
```json
{
  "statusCode": 400,
  "message": "Sales department data is required when creating a Sales employee"
}
```

### 10. Transaction Failure (Any Step)
```json
{
  "statusCode": 400,
  "message": "Failed to create employee: [specific error message]"
}
```
**Note:** All created records are automatically rolled back on any error.

---

## Validation Rules

### Employee Data Validation
| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `firstName` | string | ✅ Yes | Not empty |
| `lastName` | string | ✅ Yes | Not empty |
| `email` | string | ✅ Yes | Valid email format, unique |
| `gender` | enum | ✅ Yes | "male", "female", "others" |
| `departmentId` | number | ✅ Yes | Must exist in database |
| `roleId` | number | ✅ Yes | Must exist in database |
| `passwordHash` | string | ✅ Yes | Plain text (auto-hashed) |
| `managerId` | number | ❌ No | Must exist if provided |
| `teamLeadId` | number | ❌ No | Must exist if provided |
| `status` | enum | ❌ No | "active", "terminated", "inactive" |

### Department-Specific Validation
- **Sales:** `withholdCommission` and `withholdFlag` are required
- **All Units:** Unit IDs are validated against database
- **Permissions:** All permission fields are optional booleans

### 🔒 CRITICAL VALIDATIONS (Security)

#### 1. Single Department Data Only
**❌ REJECTED:**
```json
{
  "employee": { "departmentId": 2 },  // Sales selected
  "departmentData": {
    "sales": { ... },
    "hr": { ... }  // ❌ Multiple department data not allowed
  }
}
```
**Error:** `"Only one department data should be provided. Found: sales, hr"`

#### 2. Department Data Must Match Selected Department
**❌ REJECTED:**
```json
{
  "employee": { "departmentId": 2 },  // Sales selected (ID 2)
  "departmentData": {
    "hr": { ... }  // ❌ HR data for Sales employee
  }
}
```
**Error:** `"Department data mismatch. Selected department is 'Sales' but provided data for 'hr'. Please provide 'sales' data for Sales department."`

#### 3. Sales Department Data is Mandatory
**❌ REJECTED:**
```json
{
  "employee": { "departmentId": 2 },  // Sales selected
  "departmentData": {}  // ❌ No sales data
}
```
**Error:** `"Sales department data is required when creating a Sales employee"`

#### 4. All Foreign Keys Validated Before Creation
The following are checked to exist before ANY record is created:
- ✅ Department ID exists
- ✅ Role ID exists
- ✅ Manager ID exists (if provided)
- ✅ Team Lead ID exists (if provided)
- ✅ Sales Unit ID exists (if provided)
- ✅ Marketing Unit ID exists (if provided)
- ✅ Production Unit ID exists (if provided)

---

## Transaction Flow

```
1. PRE-VALIDATION (Before Transaction)
   ├─ Email uniqueness check
   ├─ Department exists check
   ├─ Role exists check
   ├─ Manager exists check (if provided)
   ├─ Team Lead exists check (if provided)
   ├─ 🔒 CRITICAL: Only ONE department data validation
   ├─ 🔒 CRITICAL: Department data matches selected department
   ├─ 🔒 CRITICAL: Sales department data is provided (for Sales)
   ├─ Sales-specific validation (withholdCommission, withholdFlag)
   └─ Unit existence checks (Sales/Marketing/Production Units)

2. START TRANSACTION
   
3. CREATE EMPLOYEE RECORD
   ├─ Hash password with bcrypt
   └─ Insert into employees table
   
4. CREATE DEPARTMENT RECORD (Conditional)
   ├─ If HR → Create HR record
   ├─ If Sales → Create Sales Department record
   ├─ If Marketing → Create Marketing record
   ├─ If Production → Create Production record
   └─ If Accounts → Create Accountant record
   
5. CREATE BANK ACCOUNT (Optional)
   └─ If bankAccount provided → Create Account record
   
6. CREATE HR LOG
   └─ Audit trail for employee creation
   
7. FETCH COMPLETE DATA
   └─ Retrieve employee with all relations
   
8. COMMIT TRANSACTION
   
9. RETURN SUCCESS RESPONSE

❌ ON ANY FAILURE → ROLLBACK ALL CHANGES
```

---

## Examples by Department

### Example 1: Create HR Employee
```json
{
  "employee": {
    "firstName": "Sara",
    "lastName": "Ahmed",
    "email": "sara@company.com",
    "gender": "female",
    "departmentId": 1,
    "roleId": 3,
    "passwordHash": "Sara@123",
    "shiftStart": "09:00",
    "shiftEnd": "18:00"
  },
  "departmentData": {
    "hr": {
      "attendancePermission": true,
      "salaryPermission": true,
      "employeeAddPermission": true
    }
  },
  "bankAccount": {
    "accountTitle": "Sara Ahmed",
    "bankName": "Meezan Bank",
    "baseSalary": 60000.00
  }
}
```

### Example 2: Create Marketing Employee
```json
{
  "employee": {
    "firstName": "Fatima",
    "lastName": "Malik",
    "email": "fatima@company.com",
    "gender": "female",
    "departmentId": 3,
    "roleId": 4,
    "passwordHash": "Fatima@123"
  },
  "departmentData": {
    "marketing": {
      "marketingUnitId": 2,
      "platformFocus": "Social Media"
    }
  }
}
```

### Example 3: Create Production Employee
```json
{
  "employee": {
    "firstName": "Hassan",
    "lastName": "Raza",
    "email": "hassan@company.com",
    "gender": "male",
    "departmentId": 4,
    "roleId": 5,
    "passwordHash": "Hassan@123",
    "modeOfWork": "hybrid",
    "remoteDaysAllowed": 3
  },
  "departmentData": {
    "production": {
      "productionUnitId": 1,
      "specialization": "Full Stack Developer"
    }
  },
  "bankAccount": {
    "accountTitle": "Hassan Raza",
    "baseSalary": 80000.00
  }
}
```

---

## Best Practices

### 1. Frontend Multi-Step Form
```
Step 1: Employee Basic Info
  ↓
Step 2: Department-Specific Data (show based on selected department)
  ↓
Step 3: Unit/Team Assignment (if applicable)
  ↓
Step 4: Bank Account Details (optional)
  ↓
Submit → POST /hr/employees/complete
```

### 2. Error Handling
```javascript
try {
  const response = await axios.post('/hr/employees/complete', data);
  // Success - all records created
  console.log('Employee created:', response.data);
} catch (error) {
  // All records rolled back
  console.error('Creation failed:', error.response.data.message);
}
```

### 3. Conditional Department Data
```javascript
const requestBody = {
  employee: employeeFormData,
  departmentData: {},
  bankAccount: bankAccountData // optional
};

// Add department-specific data based on selected department
switch(selectedDepartment.name) {
  case 'HR':
    requestBody.departmentData.hr = hrPermissionsData;
    break;
  case 'Sales':
    requestBody.departmentData.sales = salesData;
    break;
  case 'Marketing':
    requestBody.departmentData.marketing = marketingData;
    break;
  case 'Production':
    requestBody.departmentData.production = productionData;
    break;
  case 'Accounts':
    requestBody.departmentData.accountant = accountantData;
    break;
}

await createEmployee(requestBody);
```

---

## Comparison: Old vs New Approach

### Old Approach (Multiple APIs)
```javascript
// Step 1: Create employee
const employee = await POST('/hr/employees', employeeData);

// Step 2: Create department record
await POST('/hr/sales', { 
  employeeId: employee.id, 
  ...salesData 
});

// Step 3: Create bank account
await POST('/hr/accounts', { 
  employeeId: employee.id, 
  ...bankData 
});

// ❌ Problem: If step 2 or 3 fails, orphaned employee record
```

### New Approach (Single API)
```javascript
// All in one transaction
const result = await POST('/hr/employees/complete', {
  employee: employeeData,
  departmentData: { sales: salesData },
  bankAccount: bankData
});

// ✅ Either all succeed or all rollback
```

---

## Notes

1. **Password Security:** Passwords are sent as plain text but immediately hashed with bcrypt (10 salt rounds) before storage
2. **Transaction Safety:** Uses Prisma transactions with automatic rollback on any failure
3. **HR Logging:** Automatically creates audit log entry for employee creation
4. **Backward Compatibility:** Original `/hr/employees` endpoint still works
5. **Optional Bank Account:** Can be omitted entirely if not needed
6. **Department Detection:** Automatically detects department by name and creates appropriate record

---

## Support

For issues or questions, contact the development team.

**Created:** October 2025  
**Version:** 1.0  
**Status:** ✅ Production Ready

