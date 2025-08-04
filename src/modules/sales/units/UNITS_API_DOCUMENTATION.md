# Sales Units API Documentation

This document contains all the APIs for the Sales Units module.

---

## 1. Create Sales Unit

### Method and Endpoint
- **Method**: `POST`
- **Endpoint**: `/sales/units/create`

### API Description and Flow
This API creates a new sales unit in the system. The flow includes:
1. Validates all required fields using DTO validation
2. Checks if the employee (headId) exists in the database
3. Verifies that the employee has the `unit_head` role
4. Validates that email, phone, and name are unique (not already exists)
5. Creates the sales unit in the database
6. Returns success response

### Request Body
```json
{
  "name": "string (required)",
  "email": "string (required)",
  "phone": "string (required)",
  "address": "string (required)",
  "headId": "number (required)",
  "logoUrl": "string (optional)",
  "website": "string (optional)"
}
```

**Required Fields:**
- `name`: Unit name (must be unique)
- `email`: Unit email address (must be unique and valid format)
- `phone`: Unit phone number (must be unique)
- `address`: Unit physical address
- `headId`: Employee ID who will be the unit head

**Optional Fields:**
- `logoUrl`: URL to unit's logo image
- `website`: Unit's website URL

### Response Format

**Success Response (200):**
```json
{
  "success": true,
  "message": "New Unit Created Successfully"
}
```

**Error Responses:**

**Validation Errors (400):**
```json
{
  "statusCode": 400,
  "message": [
    "Unit name is required",
    "Please provide a valid email address",
    "Phone number is required",
    "Address is required",
    "Head ID must be a positive number",
    "Please provide a valid URL for logo",
    "Please provide a valid URL for website"
  ],
  "error": "Bad Request"
}
```

**Business Logic Errors (400):**
```json
{
  "statusCode": 400,
  "message": "Employee with ID 123 does not exist",
  "error": "Bad Request"
}
```

```json
{
  "statusCode": 400,
  "message": "Employee must have unit_head role to be assigned as unit head",
  "error": "Bad Request"
}
```

**Conflict Errors (409):**
```json
{
  "statusCode": 409,
  "message": "Email already exists",
  "error": "Conflict"
}
```

```json
{
  "statusCode": 409,
  "message": "Phone number already exists",
  "error": "Conflict"
}
```

```json
{
  "statusCode": 409,
  "message": "Unit name already exists",
  "error": "Conflict"
}
```

**Authentication/Authorization Errors (401/403):**
```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

```json
{
  "statusCode": 403,
  "message": "User does not have the required roles. Required: dep_manager. User role: junior",
  "error": "Forbidden"
}
```

```json
{
  "statusCode": 403,
  "message": "User does not belong to required departments. Required: Sales. User department: HR",
  "error": "Forbidden"
}
```

### Validations

**DTO Validations (class-validator):**
- `name`: Required string, not empty
- `email`: Required, valid email format
- `phone`: Required string, not empty
- `address`: Required string, not empty
- `headId`: Required positive number
- `logoUrl`: Optional, valid URL format
- `website`: Optional, valid URL format

**Business Logic Validations:**
- Employee with `headId` must exist in `employees` table
- Employee must have `unit_head` role in `roles` table
- Email must be unique across all sales units
- Phone must be unique across all sales units
- Unit name must be unique across all sales units

### Database Operations

**Tables Affected:**
- `sales_units` table

**Database Changes:**
- **INSERT** operation on `sales_units` table with the following fields:
  - `name` (from request)
  - `email` (from request)
  - `phone` (from request)
  - `address` (from request)
  - `head_id` (from request)
  - `logo_url` (from request, optional)
  - `website` (from request, optional)
  - `created_at` (automatically set by Prisma `@default(now())`)
  - `updated_at` (automatically set by Prisma `@updatedAt`)

**Database Queries:**
1. **SELECT** from `employees` table to check if employee exists and get role
2. **SELECT** from `sales_units` table to check email uniqueness
3. **SELECT** from `sales_units` table to check phone uniqueness
4. **SELECT** from `sales_units` table to check name uniqueness
5. **INSERT** into `sales_units` table to create new unit

### Access Control
- **Authentication**: JWT token required
- **Roles**: `dep_manager` role required
- **Departments**: `Sales` department required
- **Admin Access**: Admins (admin, supermanager) have automatic access

---

## 2. Get All Sales Units

### Method and Endpoint
- **Method**: `GET`
- **Endpoint**: `/sales/units`

### API Description and Flow
This API retrieves all sales units from the system. The flow includes:
1. Fetches all units from the database
2. Includes unit head details (firstName, lastName) from employees table
3. Orders units alphabetically by name
4. Returns formatted response with unit data and head information

### Request Body/Parameters
- **Request Body**: None
- **Query Parameters**: None
- **Path Parameters**: None

### Response Format

**Success Response with Units (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Sales Unit A",
      "email": "unit@example.com",
      "phone": "+1 (555) 123-4567",
      "address": "123 Business St, City, Country",
      "headId": 123,
      "logoUrl": "https://example.com/logo.png",
      "website": "https://example.com",
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z",
      "headFirstName": "John",
      "headLastName": "Doe"
    }
  ],
  "total": 1,
  "message": "Units retrieved successfully"
}
```

**Success Response - No Units (200):**
```json
{
  "success": true,
  "data": [],
  "total": 0,
  "message": "No units found"
}
```

**Error Responses:**

**Authentication/Authorization Errors (401/403):**
```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

```json
{
  "statusCode": 403,
  "message": "User does not have the required roles. Required: dep_manager. User role: junior",
  "error": "Forbidden"
}
```

```json
{
  "statusCode": 403,
  "message": "User does not belong to required departments. Required: Sales. User department: HR",
  "error": "Forbidden"
}
```

### Validations
- No input validation required (no request body)
- Business logic validation handled by access control guards

### Database Operations

**Tables Affected:**
- `sales_units` table (read)
- `employees` table (read - for head details)

**Database Changes:**
- **No changes** - read-only operation

**Database Queries:**
1. **SELECT** from `sales_units` table with JOIN to `employees` table for head details
2. **ORDER BY** name ascending for alphabetical sorting

### Access Control
- **Authentication**: JWT token required
- **Roles**: `dep_manager` role required
- **Departments**: `Sales` department required
- **Admin Access**: Admins (admin, supermanager) have automatic access

---

## 3. Update Sales Unit

### Method and Endpoint
- **Method**: `PATCH`
- **Endpoint**: `/sales/units/update/:id`

### API Description and Flow
This API updates a sales unit in the system. The flow includes:
1. Validates that the unit exists (returns 404 if not found)
2. Validates only the fields provided in the request (partial update)
3. Checks if the employee (headId) exists and has unit_head role (if headId provided)
4. Validates that email, phone, and name are unique (excluding current unit)
5. Updates only the provided fields in the database
6. Returns success response

### Request Body/Parameters
- **Path Parameter**: `id` (number) - Unit ID to update
- **Request Body**: Partial data (only fields to update)

```json
{
  "name": "string (optional)",
  "email": "string (optional)",
  "phone": "string (optional)",
  "address": "string (optional)",
  "headId": "number (optional)",
  "logoUrl": "string (optional)",
  "website": "string (optional)"
}
```

**All fields are optional** - only send the fields you want to update.

**Example Requests:**
```json
// Update only name
{
  "name": "Updated Unit Name"
}

// Update email and phone
{
  "email": "new@example.com",
  "phone": "+1 (555) 999-9999"
}

// Update multiple fields
{
  "name": "Updated Unit",
  "email": "new@example.com",
  "address": "New Address",
  "website": "https://new-website.com"
}
```

### Response Format

**Success Response (200):**
```json
{
  "success": true,
  "message": "Unit updated successfully"
}
```

**Error Responses:**

**Not Found Error (404):**
```json
{
  "statusCode": 404,
  "message": "Unit with ID 123 does not exist",
  "error": "Not Found"
}
```

**Validation Errors (400):**
```json
{
  "statusCode": 400,
  "message": [
    "Unit name must be a string",
    "Please provide a valid email address",
    "Phone number must be a string",
    "Address must be a string",
    "Head ID must be a positive number",
    "Please provide a valid URL for logo",
    "Please provide a valid URL for website"
  ],
  "error": "Bad Request"
}
```

**Business Logic Errors (400):**
```json
{
  "statusCode": 400,
  "message": "Employee with ID 123 does not exist",
  "error": "Bad Request"
}
```

```json
{
  "statusCode": 400,
  "message": "Employee must have unit_head role to be assigned as unit head",
  "error": "Bad Request"
}
```

**Conflict Errors (409):**
```json
{
  "statusCode": 409,
  "message": "Email already exists",
  "error": "Conflict"
}
```

```json
{
  "statusCode": 409,
  "message": "Phone number already exists",
  "error": "Conflict"
}
```

```json
{
  "statusCode": 409,
  "message": "Unit name already exists",
  "error": "Conflict"
}
```

**Authentication/Authorization Errors (401/403):**
```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

```json
{
  "statusCode": 403,
  "message": "User does not have the required roles. Required: dep_manager. User role: junior",
  "error": "Forbidden"
}
```

```json
{
  "statusCode": 403,
  "message": "User does not belong to required departments. Required: Sales. User department: HR",
  "error": "Forbidden"
}
```

### Validations

**DTO Validations (class-validator):**
- All fields are optional
- `name`: String format (if provided)
- `email`: Valid email format (if provided)
- `phone`: String format (if provided)
- `address`: String format (if provided)
- `headId`: Positive number (if provided)
- `logoUrl`: Valid URL format (if provided)
- `website`: Valid URL format (if provided)

**Business Logic Validations:**
- Unit with provided ID must exist
- Employee with `headId` must exist in `employees` table (if headId provided)
- Employee must have `unit_head` role in `roles` table (if headId provided)
- Email must be unique across all other sales units (if email provided)
- Phone must be unique across all other sales units (if phone provided)
- Unit name must be unique across all other sales units (if name provided)

### Database Operations

**Tables Affected:**
- `sales_units` table (update)
- `employees` table (read - for head validation, if headId provided)

**Database Changes:**
- **UPDATE** operation on `sales_units` table with only the provided fields
- `updated_at` automatically updated by Prisma `@updatedAt`

**Database Queries:**
1. **SELECT** from `sales_units` table to check if unit exists
2. **SELECT** from `employees` table to check if employee exists and get role (if headId provided)
3. **SELECT** from `sales_units` table to check email uniqueness (exclude current unit, if email provided)
4. **SELECT** from `sales_units` table to check phone uniqueness (exclude current unit, if phone provided)
5. **SELECT** from `sales_units` table to check name uniqueness (exclude current unit, if name provided)
6. **UPDATE** `sales_units` table with only provided fields

### Access Control
- **Authentication**: JWT token required
- **Roles**: `dep_manager` role required
- **Departments**: `Sales` department required
- **Admin Access**: Admins (admin, supermanager) have automatic access

---

## 4. Delete Sales Unit

### Method and Endpoint
- **Method**: `DELETE`
- **Endpoint**: `/sales/units/delete/:id`

### API Description and Flow
This API deletes a sales unit from the system. The flow includes:
1. Validates that the unit exists (returns 404 if not found)
2. Checks for dependencies: teams, leads, and sales employees associated with the unit
3. Counts archive leads associated with the unit
4. If dependencies exist, returns detailed information about what needs to be reassigned
5. If no dependencies, updates archive leads (sets unitId = null) and deletes the unit
6. Returns appropriate success or error response

### Request Body/Parameters
- **Path Parameter**: `id` (number) - Unit ID to delete
- **Request Body**: None

### Response Format

**Success Response (200):**
```json
{
  "success": true,
  "message": "Unit deleted successfully. 15 archived leads have been assigned unit ID null."
}
```

**Error Response - Dependencies Exist (200):**
```json
{
  "success": false,
  "message": "Cannot delete unit. Please reassign dependencies first.",
  "dependencies": {
    "teams": {
      "count": 2,
      "details": [
        { "id": 1, "name": "Sales Team A" },
        { "id": 2, "name": "Enterprise Team" }
      ]
    },
    "leads": {
      "count": 5,
      "details": [
        { "id": 101, "name": "John Doe", "email": "john@example.com" },
        { "id": 102, "name": "Jane Smith", "email": "jane@example.com" }
      ]
    },
    "employees": {
      "count": 3,
      "details": [
        { "id": 201, "firstName": "Mike", "lastName": "Johnson" },
        { "id": 202, "firstName": "Sarah", "lastName": "Wilson" }
      ]
    }
  },
  "archiveLeads": {
    "count": 15,
    "message": "15 archived leads will be assigned unit ID null"
  }
}
```

**Error Responses:**

**Not Found Error (404):**
```json
{
  "statusCode": 404,
  "message": "Unit with ID 123 does not exist",
  "error": "Not Found"
}
```

**Authentication/Authorization Errors (401/403):**
```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

```json
{
  "statusCode": 403,
  "message": "User does not have the required roles. Required: dep_manager. User role: junior",
  "error": "Forbidden"
}
```

```json
{
  "statusCode": 403,
  "message": "User does not belong to required departments. Required: Sales. User department: HR",
  "error": "Forbidden"
}
```

### Validations
- Unit with provided ID must exist
- No input validation required (no request body)

### Business Logic
- **Dependency Check**: Ensures no active teams, leads, or employees are associated with the unit
- **Archive Leads Handling**: Updates archive leads to set unitId = null before deletion
- **Safe Deletion**: Only deletes unit when no active dependencies exist
- **Detailed Feedback**: Provides specific information about what needs to be reassigned

### Database Operations

**Tables Affected:**
- `sales_units` table (delete)
- `teams` table (read - for dependency check)
- `leads` table (read - for dependency check)
- `sales_departments` table (read - for dependency check)
- `archive_leads` table (update - set unitId = null)

**Database Changes:**
- **UPDATE** operation on `archive_leads` table (set unitId = null)
- **DELETE** operation on `sales_units` table (only if no dependencies)

**Database Queries:**
1. **SELECT** from `sales_units` table to check if unit exists
2. **SELECT** from `teams` table to check for associated teams
3. **SELECT** from `leads` table to check for associated leads
4. **SELECT** from `sales_departments` table with JOIN to `employees` for associated employees
5. **COUNT** from `archive_leads` table for associated archive leads
6. **UPDATE** `archive_leads` table to set unitId = null (if dependencies don't exist)
7. **DELETE** from `sales_units` table (if dependencies don't exist)

### Access Control
- **Authentication**: JWT token required
- **Roles**: `dep_manager` role required
- **Departments**: `Sales` department required
- **Admin Access**: Admins (admin, supermanager) have automatic access

---

## 5. Get Single Unit Details

### Method and Endpoint
- **Method**: `GET`
- **Endpoint**: `/sales/units/get/:id`

### API Description and Flow
This API retrieves detailed information about a specific sales unit. The flow includes:
1. Validates that the unit exists (returns 404 if not found)
2. Fetches unit details with head information from employees table
3. Counts associated teams and employees
4. Returns comprehensive unit information with counts

### Request Body/Parameters
- **Path Parameter**: `id` (number) - Unit ID to retrieve
- **Request Body**: None

### Response Format

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Sales Unit A",
    "email": "unit@example.com",
    "phone": "+1 (555) 123-4567",
    "address": "123 Business St, City, Country",
    "headId": 123,
    "logoUrl": "https://example.com/logo.png",
    "website": "https://example.com",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z",
    "head": {
      "id": 123,
      "firstName": "John",
      "lastName": "Doe"
    },
    "teamsCount": 3,
    "employeesCount": 8
  },
  "message": "Unit details retrieved successfully"
}
```

**Error Responses:**

**Not Found Error (404):**
```json
{
  "success": false,
  "message": "Unit with ID 123 does not exist"
}
```

**Authentication/Authorization Errors (401/403):**
```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

```json
{
  "statusCode": 403,
  "message": "User does not have the required roles. Required: dep_manager. User role: junior",
  "error": "Forbidden"
}
```

```json
{
  "statusCode": 403,
  "message": "User does not belong to required departments. Required: Sales. User department: HR",
  "error": "Forbidden"
}
```

### Validations
- Unit with provided ID must exist
- No input validation required (no request body)

### Database Operations

**Tables Affected:**
- `sales_units` table (read)
- `employees` table (read - for head details)
- `teams` table (read - for count)
- `sales_departments` table (read - for count)

**Database Changes:**
- **No changes** - read-only operation

**Database Queries:**
1. **SELECT** from `sales_units` table with JOIN to `employees` for head details
2. **COUNT** from `teams` table for teams count
3. **COUNT** from `sales_departments` table for employees count

### Access Control
- **Authentication**: JWT token required
- **Roles**: `dep_manager` role required
- **Departments**: `Sales` department required
- **Admin Access**: Admins (admin, supermanager) have automatic access

---

## Planned APIs

### Unit Relationships
- Get Teams in Unit
- Get Employees in Unit
- Get Leads in Unit
- Get Archive Leads in Unit
- Get Archive Leads from Deleted Units

### Unit Head Management
- Assign Head to Unit
- Get Available Heads

### Team Assignment
- Assign Team to Unit
- Unassign Team from Unit

---

*This documentation will be updated as new APIs are added to the units module.* 