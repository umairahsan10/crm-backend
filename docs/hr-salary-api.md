# HR Salary Payment API

## Endpoint: PATCH /api/hr/salary/mark-paid

Marks an employee's salary as paid and creates corresponding transaction and expense records.

### Authentication & Authorization
- **JWT Authentication Required**: Yes
- **Permissions Required**: `salary_permission`
- **Department Required**: HR

### Request Body
```json
{
  "employee_id": 123,
  "type": "bank"  // Optional: "cash", "bank", "credit_card", "online", "cashapp"
}
```

### Request Parameters
- `employee_id` (number, required): The ID of the employee whose salary is being marked as paid
- `type` (string, optional): Payment method type. Defaults to "cash" if not provided

### Response Format

#### Success Response (200)
```json
{
  "status": "success",
  "message": "Salary marked as paid successfully",
  "data": {
    "employee_id": 123,
    "salary_log_id": 456,
    "transaction_id": 789,
    "expense_id": 101,
    "amount": 5000.00,
    "payment_method": "bank",
    "paid_on": "2025-01-15T10:30:00.000Z"
  }
}
```

#### Error Response (400/500)
```json
{
  "status": "error",
  "message": "Employee not found",
  "error_code": "EMPLOYEE_NOT_FOUND"
}
```

### Error Codes
- `EMPLOYEE_NOT_FOUND`: Employee with the specified ID does not exist
- `EMPLOYEE_INACTIVE`: Employee is not in active status
- `NO_UNPAID_SALARY_FOUND`: No unpaid salary found for the current month
- `INVALID_SALARY_AMOUNT`: Salary amount is invalid or missing

### Business Logic
1. **Validation**: Checks if employee exists and is active
2. **Salary Log**: Finds the latest unpaid salary log for the current month
3. **Database Transaction**: All operations are wrapped in a database transaction
4. **Updates**: 
   - Updates `net_salary_logs` with `paid_on`, `processed_by`, and `status`
   - Resets employee bonus to zero
   - Resets sales department bonus to zero (if employee is in sales)
   - Creates HR log entry (only for HR users, not admins)
   - Creates a new `transactions` record
   - Creates a new `expenses` record
5. **Admin vs HR Handling**:
   - For HR users: `processed_by` is set to HR user ID, `created_by` in expense is set to HR user ID, `processed_by_role` is set to "Employee", HR log is created
   - For Admin users: `processed_by` is set to admin ID, `created_by` in expense is set to admin ID, `processed_by_role` is set to "Admin", no HR log is created
6. **Rollback**: If any step fails, all changes are rolled back

### Database Changes
- **net_salary_logs**: Updates `paid_on`, `processed_by`, `processed_by_role`, `status`
- **employees**: Resets `bonus` to zero
- **sales_departments**: Resets `bonus` to zero (if employee is in sales)
- **hr_logs**: Creates new log entry (only for HR users)
- **transactions**: Creates new record with salary payment details
- **expenses**: Creates new record with salary expense details and `processed_by_role`

### Notes
- Payment method defaults to "cash" if not specified
- All timestamps are set to the current date/time
- Comprehensive notes are added to both transaction and expense records mentioning bonus reset
- HR logs are only created for HR users, not for admin users
- For admin actions, `processed_by` field in salary logs and `created_by` field in expenses are set to admin ID
- `processed_by_role` field is set to "Admin" for admin users and "Employee" for HR users
- The API ensures data consistency through database transactions 