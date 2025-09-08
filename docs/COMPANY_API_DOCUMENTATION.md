# Company API Documentation

## Overview

The Company module manages the main company information and settings for the CRM system. It handles company details, contact information, and attendance-related configurations like late time thresholds and deduction policies.

### Key Features
- **Single Company System**: Only one company can exist in the system
- **Attendance Settings**: Configurable time thresholds for late, half-day, and absent
- **Deduction Policies**: Configurable deduction amounts for various attendance scenarios
- **Company Information**: Complete company profile management
- **Default Values**: Automatic defaults for time configurations
- **Role-Based Access Control**: Restricted to Admin, HR department, and department managers only

### Business Rules
- **Single Company Limit**: Only one company can be created per system
- **Default Time Values**: 
  - `lateTime`: 30 minutes (if not provided)
  - `halfTime`: 90 minutes (if not provided)
  - `absentTime`: 180 minutes (if not provided)
- **Required Fields**: Company name is mandatory
- **Optional Fields**: All other fields are optional
- **Access Control**: Only Admin, HR department employees, and department managers can access/modify

---

## API Endpoints

### Base URL
```
/company
```

### Authentication & Authorization
All endpoints require:
1. **JWT Authentication** via `Authorization: Bearer <token>` header
2. **Role Authorization**: User must have `dep_manager` or `unit_head` role
3. **Department Authorization**: User must belong to `HR` department
4. **Admin Bypass**: Admin users (type: 'admin') can access all endpoints

**Required Permissions:**
- **Role**: `dep_manager` (Department Manager) OR `unit_head` (Unit Head)
- **Department**: `HR` (Human Resources)
- **Admin Access**: Full access for admin users

---

## 1. Create Company

Creates a new company. Only one company can exist in the system.

**Endpoint:** `POST /company`

**Permissions:** Admin, HR department employees with `dep_manager` or `unit_head` role

**Request Body:**
```json
{
  "name": "Tech Solutions Inc.",
  "address": "123 Business Street",
  "city": "New York",
  "state": "NY",
  "zip": "10001",
  "country": "USA",
  "phone": "+1-555-0123",
  "email": "info@techsolutions.com",
  "website": "https://techsolutions.com",
  "quarterlyLeavesDays": 20,
  "monthlyLatesDays": 3,
  "absentDeduction": 1000,
  "lateDeduction": 500,
  "halfDeduction": 750,
  "taxId": "TAX123456789",
  "lateTime": 30,
  "halfTime": 90,
  "absentTime": 180
}
```

**Field Descriptions:**
- `name` (required): Company name
- `address` (optional): Company address
- `city` (optional): City
- `state` (optional): State/Province
- `zip` (optional): ZIP/Postal code
- `country` (optional): Country
- `phone` (optional): Phone number
- `email` (optional): Company email (must be valid email format)
- `website` (optional): Company website (must be valid URL format)
- `quarterlyLeavesDays` (optional): Number of quarterly leave days allowed
- `monthlyLatesDays` (optional): Number of monthly late days allowed
- `absentDeduction` (optional): Deduction amount for absent days
- `lateDeduction` (optional): Deduction amount for late arrivals
- `halfDeduction` (optional): Deduction amount for half days
- `taxId` (optional): Tax identification number
- `lateTime` (optional): Minutes threshold for late arrival (default: 30)
- `halfTime` (optional): Minutes threshold for half day (default: 90)
- `absentTime` (optional): Minutes threshold for absent (default: 180)

**Response:**
```json
{
  "id": 1,
  "name": "Tech Solutions Inc.",
  "address": "123 Business Street",
  "city": "New York",
  "state": "NY",
  "zip": "10001",
  "country": "USA",
  "phone": "+1-555-0123",
  "email": "info@techsolutions.com",
  "website": "https://techsolutions.com",
  "createdAt": "2024-01-01T10:00:00Z",
  "updatedAt": "2024-01-01T10:00:00Z",
  "quarterlyLeavesDays": 20,
  "monthlyLatesDays": 3,
  "absentDeduction": 1000,
  "lateDeduction": 500,
  "halfDeduction": 750,
  "taxId": "TAX123456789",
  "lateTime": 30,
  "halfTime": 90,
  "absentTime": 180
}
```

**Error Responses:**
- `400 Bad Request`: Invalid data format
- `401 Unauthorized`: Missing or invalid JWT token
- `403 Forbidden`: Insufficient permissions (wrong role or department)
- `409 Conflict`: Company already exists
- `500 Internal Server Error`: Database or server error

---

## 2. Get All Companies

Retrieves all companies (usually only one).

**Endpoint:** `GET /company`

**Permissions:** Admin, HR department employees with `dep_manager` or `unit_head` role

**Response:**
```json
[
  {
    "id": 1,
    "name": "Tech Solutions Inc.",
    "address": "123 Business Street",
    "city": "New York",
    "state": "NY",
    "zip": "10001",
    "country": "USA",
    "phone": "+1-555-0123",
    "email": "info@techsolutions.com",
    "website": "https://techsolutions.com",
    "createdAt": "2024-01-01T10:00:00Z",
    "updatedAt": "2024-01-01T10:00:00Z",
    "quarterlyLeavesDays": 20,
    "monthlyLatesDays": 3,
    "absentDeduction": 1000,
    "lateDeduction": 500,
    "halfDeduction": 750,
    "taxId": "TAX123456789",
    "lateTime": 30,
    "halfTime": 90,
    "absentTime": 180
  }
]
```

**Error Responses:**
- `401 Unauthorized`: Missing or invalid JWT token
- `403 Forbidden`: Insufficient permissions (wrong role or department)
- `500 Internal Server Error`: Database or server error

---

## 3. Get Main Company

Retrieves the main company (first company found).

**Endpoint:** `GET /company/main`

**Permissions:** Admin, HR department employees with `dep_manager` or `unit_head` role

**Response:**
```json
{
  "id": 1,
  "name": "Tech Solutions Inc.",
  "address": "123 Business Street",
  "city": "New York",
  "state": "NY",
  "zip": "10001",
  "country": "USA",
  "phone": "+1-555-0123",
  "email": "info@techsolutions.com",
  "website": "https://techsolutions.com",
  "createdAt": "2024-01-01T10:00:00Z",
  "updatedAt": "2024-01-01T10:00:00Z",
  "quarterlyLeavesDays": 20,
  "monthlyLatesDays": 3,
  "absentDeduction": 1000,
  "lateDeduction": 500,
  "halfDeduction": 750,
  "taxId": "TAX123456789",
  "lateTime": 30,
  "halfTime": 90,
  "absentTime": 180
}
```

**Error Responses:**
- `401 Unauthorized`: Missing or invalid JWT token
- `403 Forbidden`: Insufficient permissions (wrong role or department)
- `404 Not Found`: No company found
- `500 Internal Server Error`: Database or server error

---

## 4. Get Company by ID

Retrieves a specific company by ID.

**Endpoint:** `GET /company/:id`

**Permissions:** Admin, HR department employees with `dep_manager` or `unit_head` role

**Parameters:**
- `id` (path): Company ID

**Response:**
```json
{
  "id": 1,
  "name": "Tech Solutions Inc.",
  "address": "123 Business Street",
  "city": "New York",
  "state": "NY",
  "zip": "10001",
  "country": "USA",
  "phone": "+1-555-0123",
  "email": "info@techsolutions.com",
  "website": "https://techsolutions.com",
  "createdAt": "2024-01-01T10:00:00Z",
  "updatedAt": "2024-01-01T10:00:00Z",
  "quarterlyLeavesDays": 20,
  "monthlyLatesDays": 3,
  "absentDeduction": 1000,
  "lateDeduction": 500,
  "halfDeduction": 750,
  "taxId": "TAX123456789",
  "lateTime": 30,
  "halfTime": 90,
  "absentTime": 180
}
```

**Error Responses:**
- `401 Unauthorized`: Missing or invalid JWT token
- `403 Forbidden`: Insufficient permissions (wrong role or department)
- `404 Not Found`: Company not found
- `500 Internal Server Error`: Database or server error

---

## 5. Update Company

Updates an existing company.

**Endpoint:** `PUT /company/:id`

**Permissions:** Admin, HR department employees with `dep_manager` or `unit_head` role

**Parameters:**
- `id` (path): Company ID

**Request Body:**
```json
{
  "name": "Tech Solutions International Inc.",
  "city": "Los Angeles",
  "state": "CA",
  "lateTime": 45,
  "halfTime": 120,
  "absentTime": 240
}
```

**Field Descriptions:**
All fields are optional. Only provided fields will be updated.

**Response:**
```json
{
  "id": 1,
  "name": "Tech Solutions International Inc.",
  "address": "123 Business Street",
  "city": "Los Angeles",
  "state": "CA",
  "zip": "10001",
  "country": "USA",
  "phone": "+1-555-0123",
  "email": "info@techsolutions.com",
  "website": "https://techsolutions.com",
  "createdAt": "2024-01-01T10:00:00Z",
  "updatedAt": "2024-01-01T11:00:00Z",
  "quarterlyLeavesDays": 20,
  "monthlyLatesDays": 3,
  "absentDeduction": 1000,
  "lateDeduction": 500,
  "halfDeduction": 750,
  "taxId": "TAX123456789",
  "lateTime": 45,
  "halfTime": 120,
  "absentTime": 240
}
```

**Error Responses:**
- `400 Bad Request`: Invalid data format
- `401 Unauthorized`: Missing or invalid JWT token
- `403 Forbidden`: Insufficient permissions (wrong role or department)
- `404 Not Found`: Company not found
- `500 Internal Server Error`: Database or server error

---

## 6. Delete Company

Deletes a company.

**Endpoint:** `DELETE /company/:id`

**Permissions:** Admin, HR department employees with `dep_manager` or `unit_head` role

**Parameters:**
- `id` (path): Company ID

**Response:**
```json
{
  "message": "Company deleted successfully"
}
```

**Error Responses:**
- `401 Unauthorized`: Missing or invalid JWT token
- `403 Forbidden`: Insufficient permissions (wrong role or department)
- `404 Not Found`: Company not found
- `500 Internal Server Error`: Database or server error

---

## 7. Get Company Attendance Settings

Retrieves company attendance-related settings and deductions.

**Endpoint:** `GET /company/settings/attendance`

**Permissions:** Admin, HR department employees with `dep_manager` or `unit_head` role

**Response:**
```json
{
  "lateTime": 30,
  "halfTime": 90,
  "absentTime": 180,
  "quarterlyLeavesDays": 20,
  "monthlyLatesDays": 3,
  "absentDeduction": 1000,
  "lateDeduction": 500,
  "halfDeduction": 750
}
```

**Field Descriptions:**
- `lateTime`: Minutes threshold for late arrival
- `halfTime`: Minutes threshold for half day
- `absentTime`: Minutes threshold for absent
- `quarterlyLeavesDays`: Number of quarterly leave days allowed
- `monthlyLatesDays`: Number of monthly late days allowed
- `absentDeduction`: Deduction amount for absent days
- `lateDeduction`: Deduction amount for late arrivals
- `halfDeduction`: Deduction amount for half days

**Error Responses:**
- `401 Unauthorized`: Missing or invalid JWT token
- `403 Forbidden`: Insufficient permissions (wrong role or department)
- `404 Not Found`: No company found
- `500 Internal Server Error`: Database or server error

---

## Data Models

### CreateCompanyDto
```typescript
export class CreateCompanyDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  zip?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsUrl()
  website?: string;

  @IsOptional()
  @IsNumber()
  quarterlyLeavesDays?: number;

  @IsOptional()
  @IsNumber()
  monthlyLatesDays?: number;

  @IsOptional()
  @IsNumber()
  absentDeduction?: number;

  @IsOptional()
  @IsNumber()
  lateDeduction?: number;

  @IsOptional()
  @IsNumber()
  halfDeduction?: number;

  @IsOptional()
  @IsString()
  taxId?: string;

  @IsOptional()
  @IsNumber()
  lateTime?: number;

  @IsOptional()
  @IsNumber()
  halfTime?: number;

  @IsOptional()
  @IsNumber()
  absentTime?: number;
}
```

### UpdateCompanyDto
```typescript
export class UpdateCompanyDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  zip?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsUrl()
  website?: string;

  @IsOptional()
  @IsNumber()
  quarterlyLeavesDays?: number;

  @IsOptional()
  @IsNumber()
  monthlyLatesDays?: number;

  @IsOptional()
  @IsNumber()
  absentDeduction?: number;

  @IsOptional()
  @IsNumber()
  lateDeduction?: number;

  @IsOptional()
  @IsNumber()
  halfDeduction?: number;

  @IsOptional()
  @IsString()
  taxId?: string;

  @IsOptional()
  @IsNumber()
  lateTime?: number;

  @IsOptional()
  @IsNumber()
  halfTime?: number;

  @IsOptional()
  @IsNumber()
  absentTime?: number;
}
```

### CompanyResponseDto
```typescript
export class CompanyResponseDto {
  id: number;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  phone?: string;
  email?: string;
  website?: string;
  createdAt: Date;
  updatedAt: Date;
  quarterlyLeavesDays: number;
  monthlyLatesDays: number;
  absentDeduction: number;
  lateDeduction: number;
  halfDeduction: number;
  taxId?: string;
  lateTime: number;
  halfTime: number;
  absentTime: number;
}
```

---

## Database Schema

### Company Table
```sql
CREATE TABLE companies (
  company_id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  address VARCHAR(255),
  city VARCHAR(100),
  state VARCHAR(100),
  zip VARCHAR(20),
  country VARCHAR(100),
  phone VARCHAR(20),
  email VARCHAR(255),
  website VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  quarterly_leaves_days INTEGER DEFAULT 0,
  monthly_lates_days INTEGER DEFAULT 0,
  absent_deduction INTEGER DEFAULT 0,
  late_deduction INTEGER DEFAULT 0,
  half_deduction INTEGER DEFAULT 0,
  tax_id VARCHAR(100),
  late_time INTEGER DEFAULT 0,
  half_time INTEGER DEFAULT 0,
  absent_time INTEGER DEFAULT 0
);
```

---

## Business Rules

### 1. Single Company System
- **Only one company** can exist in the system
- **Conflict error** if attempting to create a second company
- **First company created** becomes the main company

### 2. Default Time Values
- **lateTime**: Defaults to 30 minutes if not provided
- **halfTime**: Defaults to 90 minutes if not provided
- **absentTime**: Defaults to 180 minutes if not provided

### 3. Field Validation
- **Required**: Company name
- **Optional**: All other fields
- **Email validation**: Must be valid email format
- **URL validation**: Website must be valid URL format
- **Number validation**: Numeric fields must be valid numbers

### 4. Permission System
- **Create/Update/Delete**: Admin, HR department employees with `dep_manager` or `unit_head` role
- **Read**: Admin, HR department employees with `dep_manager` or `unit_head` role
- **Settings access**: Admin, HR department employees with `dep_manager` or `unit_head` role
- **Admin bypass**: Admin users (type: 'admin') have full access regardless of role/department

### 5. Role Requirements
- **dep_manager**: Department Manager role
- **unit_head**: Unit Head role
- **HR Department**: User must belong to Human Resources department

---

## Time Configuration Logic

### Attendance Thresholds
The company module manages three critical time thresholds for attendance management:

#### 1. Late Time (lateTime)
- **Default**: 30 minutes
- **Purpose**: Determines when an employee is considered late
- **Usage**: If employee arrives after shift start + lateTime, mark as late

#### 2. Half Day Time (halfTime)
- **Default**: 90 minutes
- **Purpose**: Determines when to mark as half day vs late
- **Usage**: If employee arrives after shift start + halfTime, mark as half day

#### 3. Absent Time (absentTime)
- **Default**: 180 minutes
- **Purpose**: Determines when to mark as absent
- **Usage**: If employee arrives after shift start + absentTime, mark as absent

### Example Scenarios
```
Shift Start: 9:00 AM
Late Time: 30 minutes → Late threshold: 9:30 AM
Half Time: 90 minutes → Half day threshold: 10:30 AM
Absent Time: 180 minutes → Absent threshold: 12:00 PM

Employee arrives at:
- 9:15 AM → On time
- 9:45 AM → Late
- 10:45 AM → Half day
- 12:30 PM → Absent
```

---

## Error Handling

### Common Error Codes
- **400 Bad Request**: Invalid input data or validation failure
- **401 Unauthorized**: Missing or invalid authentication
- **403 Forbidden**: Insufficient permissions (wrong role or department)
- **404 Not Found**: Company not found
- **409 Conflict**: Company already exists
- **500 Internal Server Error**: Server or database error

### Error Response Format
```json
{
  "message": "Error description",
  "error": "Error type",
  "statusCode": 400
}
```

---

## Testing Examples

### cURL Commands

#### Create Company
```bash
curl -X POST http://localhost:3000/company \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Company",
    "address": "123 Test Street",
    "city": "Test City",
    "state": "TS",
    "zip": "12345",
    "country": "Test Country",
    "phone": "+1-555-0123",
    "email": "info@testcompany.com",
    "website": "https://testcompany.com",
    "quarterlyLeavesDays": 20,
    "monthlyLatesDays": 3,
    "absentDeduction": 1000,
    "lateDeduction": 500,
    "halfDeduction": 750,
    "taxId": "TAX123456789",
    "lateTime": 30,
    "halfTime": 90,
    "absentTime": 180
  }'
```

#### Update Company
```bash
curl -X PUT http://localhost:3000/company/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Company Name",
    "lateTime": 45,
    "halfTime": 120,
    "absentTime": 240
  }'
```

#### Get Company
```bash
curl -X GET http://localhost:3000/company/main \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Get Attendance Settings
```bash
curl -X GET http://localhost:3000/company/settings/attendance \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Delete Company
```bash
curl -X DELETE http://localhost:3000/company/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Test Scenarios

#### Scenario 1: Create Company with Defaults
1. Login as HR department manager (`dep_manager` role)
2. Create company with only name
3. Verify default values are set:
   - lateTime = 30
   - halfTime = 90
   - absentTime = 180

#### Scenario 2: Create Company with Custom Values
1. Login as HR department manager (`dep_manager` role)
2. Create company with custom time values
3. Verify custom values are saved
4. Verify other defaults are applied

#### Scenario 3: Duplicate Company Prevention
1. Create first company as HR manager
2. Try to create second company
3. Verify conflict error is returned

#### Scenario 4: Update Company Settings
1. Login as HR unit head (`unit_head` role)
2. Update time thresholds
3. Verify changes are saved
4. Verify other fields remain unchanged

#### Scenario 5: Access Control Testing
1. Try to access company endpoints with different roles:
   - `junior` role → Should fail (403 Forbidden)
   - `senior` role → Should fail (403 Forbidden)
   - `team_lead` role → Should fail (403 Forbidden)
   - `dep_manager` role + HR department → Should succeed
   - `unit_head` role + HR department → Should succeed
   - Admin user → Should succeed (bypass)

#### Scenario 6: Department Restriction Testing
1. Try to access company endpoints with correct role but wrong department:
   - `dep_manager` role + Sales department → Should fail (403 Forbidden)
   - `unit_head` role + Production department → Should fail (403 Forbidden)

---

## Notes

### 1. Single Company Design
- **Rationale**: Most CRM systems serve one company
- **Benefit**: Simplified configuration and management
- **Consideration**: Multiple companies would require tenant architecture

### 2. Time Configuration
- **Minutes-based**: All time values are in minutes
- **Business logic**: Used by attendance module for calculations
- **Flexibility**: Can be updated without code changes

### 3. Deduction System
- **Monetary values**: Deduction amounts in base currency
- **Configurable**: Can be adjusted per company policy
- **Integration**: Used by payroll and attendance modules

### 4. Performance Considerations
- **Single record**: Company table will always have minimal records
- **Caching**: Company settings can be cached for performance
- **Updates**: Infrequent updates, good for caching

### 5. Security Features
- **JWT validation**: All endpoints require valid authentication
- **Role-based access**: Restricted to specific roles (`dep_manager`, `unit_head`)
- **Department restriction**: Limited to HR department only
- **Admin bypass**: Admin users have full access
- **Input sanitization**: All user inputs are validated and sanitized

### 6. Access Control Matrix
| User Type | Role | Department | Access Level |
|------------|------|------------|--------------|
| Admin | Any | Any | Full Access |
| Employee | `dep_manager` | HR | Full Access |
| Employee | `unit_head` | HR | Full Access |
| Employee | `dep_manager` | Sales | No Access |
| Employee | `unit_head` | Production | No Access |
| Employee | `team_lead` | HR | No Access |
| Employee | `senior` | HR | No Access |
| Employee | `junior` | HR | No Access |

---

## Future Enhancements

### 1. Multi-Company Support
- **Tenant architecture**: Support for multiple companies
- **Company isolation**: Separate data per company
- **Shared resources**: Common modules across companies

### 2. Advanced Settings
- **Working hours**: Company-wide working hour configurations
- **Holiday calendar**: Company holiday management
- **Leave policies**: Advanced leave policy configurations

### 3. Integration Features
- **HR system**: Integration with external HR systems
- **Payroll system**: Direct payroll system integration
- **Time tracking**: Advanced time tracking features

### 4. Reporting and Analytics
- **Company metrics**: Company-wide performance metrics
- **Attendance reports**: Comprehensive attendance reporting
- **Financial reports**: Company financial summaries

---

## Support

For technical support or questions about the Company API, please contact the development team or refer to the internal documentation.

---

*Last updated: January 2024*
*Version: 1.0*
