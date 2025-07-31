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

*This documentation will be updated as new APIs are added to the units module.* 