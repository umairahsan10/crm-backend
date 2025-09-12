# Client Management API Documentation

## Overview
The Client Management module provides comprehensive CRUD operations for managing clients with advanced filtering, search capabilities, and role-based access control. Only unit heads and department managers can update client information, while all authenticated users (except production department) can view client data.

## Module Structure
```
src/modules/client/
├── controllers/
│   └── client.controller.ts
├── services/
│   └── client.service.ts
├── dto/
│   ├── create-client.dto.ts
│   ├── update-client.dto.ts
│   ├── client-query.dto.ts
│   └── client-response.dto.ts
├── client.module.ts
└── CLIENT_API_DOCUMENTATION.md
```

## Authentication & Authorization

### Guards Required
- `JwtAuthGuard`: JWT token authentication
- `RolesGuard`: Role-based access control

### Role Permissions
- **Create Clients**: `dep_manager`, `unit_head`, `team_lead`
- **View Clients**: `dep_manager`, `unit_head`, `team_lead`, `senior`, `junior`
- **Update Clients**: `dep_manager`, `unit_head` (ONLY)
- **Delete Clients**: `dep_manager`, `unit_head` (ONLY)
- **View Statistics**: `dep_manager`, `unit_head`, `team_lead`

### Department Restrictions
- **Production Department**: Cannot access any client APIs
- **All Other Departments**: Can access based on role permissions

## API Endpoints

### 1. Create Client
**POST** `/clients`

**Purpose**: Create a new client record

**Access Control**: `dep_manager`, `unit_head`, `team_lead`

**Request Body**:
```json
{
  "clientType": "individual",
  "companyName": "Acme Corp",
  "clientName": "John Doe",
  "email": "john@acme.com",
  "phone": "+1234567890",
  "passwordHash": "hashedpassword123",
  "altPhone": "+1234567891",
  "address": "123 Main St",
  "city": "New York",
  "state": "NY",
  "postalCode": "10001",
  "country": "USA",
  "industryId": 1,
  "taxId": "TAX123456",
  "accountStatus": "prospect",
  "notes": "Potential high-value client"
}
```

**Response**:
```json
{
  "status": "success",
  "message": "Client created successfully",
  "data": {
    "client": {
      "id": 1,
      "clientType": "individual",
      "companyName": "Acme Corp",
      "clientName": "John Doe",
      "email": "john@acme.com",
      "phone": "+1234567890",
      "altPhone": "+1234567891",
      "address": "123 Main St",
      "city": "New York",
      "state": "NY",
      "postalCode": "10001",
      "country": "USA",
      "industryId": 1,
      "taxId": "TAX123456",
      "accountStatus": "prospect",
      "createdBy": 50,
      "notes": "Potential high-value client",
      "createdAt": "2025-01-12T10:30:00.000Z",
      "updatedAt": "2025-01-12T10:30:00.000Z",
      "industry": {
        "id": 1,
        "name": "Technology",
        "description": "Tech companies"
      },
      "employee": {
        "id": 50,
        "firstName": "Jane",
        "lastName": "Smith",
        "email": "jane@company.com"
      }
    }
  }
}
```

### 2. Get All Clients
**GET** `/clients`

**Purpose**: Retrieve clients with advanced filtering and pagination

**Access Control**: `dep_manager`, `unit_head`, `team_lead`, `senior`, `junior`

**Query Parameters**:
- `search` (string): Search across multiple fields
- `clientType` (string): Filter by client type
- `companyName` (string): Filter by company name
- `clientName` (string): Filter by client name
- `email` (string): Filter by email
- `phone` (string): Filter by phone
- `city` (string): Filter by city
- `state` (string): Filter by state
- `country` (string): Filter by country
- `industryId` (number): Filter by industry
- `accountStatus` (enum): Filter by account status (`active`, `inactive`, `suspended`, `prospect`)
- `createdBy` (number): Filter by creator
- `createdAfter` (date): Filter by creation date (after)
- `createdBefore` (date): Filter by creation date (before)
- `sortBy` (string): Sort field (default: `createdAt`)
- `sortOrder` (string): Sort order (`asc` or `desc`, default: `desc`)
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10, max: 100)

**Example Request**:
```
GET /clients?search=acme&city=New York&accountStatus=active&page=1&limit=20&sortBy=createdAt&sortOrder=desc
```

**Response**:
```json
{
  "status": "success",
  "message": "Clients retrieved successfully",
  "data": {
    "clients": [
      {
        "id": 1,
        "clientType": "individual",
        "companyName": "Acme Corp",
        "clientName": "John Doe",
        "email": "john@acme.com",
        "phone": "+1234567890",
        "city": "New York",
        "state": "NY",
        "accountStatus": "active",
        "createdAt": "2025-01-12T10:30:00.000Z",
        "updatedAt": "2025-01-12T10:30:00.000Z",
        "industry": {
          "id": 1,
          "name": "Technology"
        },
        "employee": {
          "id": 50,
          "firstName": "Jane",
          "lastName": "Smith"
        }
      }
    ],
    "total": 1,
    "page": 1,
    "limit": 20,
    "totalPages": 1
  }
}
```

### 3. Get Client by ID
**GET** `/clients/:id`

**Purpose**: Retrieve a specific client by ID

**Access Control**: `dep_manager`, `unit_head`, `team_lead`, `senior`, `junior`

**Response**: Same as create client response

### 4. Update Client
**PATCH** `/clients/:id`

**Purpose**: Update an existing client

**Access Control**: `dep_manager`, `unit_head` (ONLY)

**Request Body**: Same as create client (all fields optional)

**Response**: Same as create client response

### 5. Delete Client
**DELETE** `/clients/:id`

**Purpose**: Delete a client

**Access Control**: `dep_manager`, `unit_head` (ONLY)

**Response**:
```json
{
  "status": "success",
  "message": "Client deleted successfully"
}
```

### 6. Get Client Statistics
**GET** `/clients/stats`

**Purpose**: Get client statistics and counts

**Access Control**: `dep_manager`, `unit_head`, `team_lead`

**Response**:
```json
{
  "status": "success",
  "message": "Client statistics retrieved successfully",
  "data": {
    "total": 150,
    "active": 120,
    "inactive": 15,
    "suspended": 5,
    "prospect": 10
  }
}
```

### 7. Search Companies
**GET** `/clients/search/companies?q=searchterm`

**Purpose**: Quick search for companies

**Access Control**: `dep_manager`, `unit_head`, `team_lead`, `senior`, `junior`

**Response**:
```json
{
  "status": "success",
  "message": "Companies found successfully",
  "data": {
    "companies": [
      {
        "id": 1,
        "companyName": "Acme Corp",
        "clientName": "John Doe",
        "email": "john@acme.com",
        "city": "New York",
        "state": "NY"
      }
    ]
  }
}
```

### 8. Search Contacts
**GET** `/clients/search/contacts?q=searchterm`

**Purpose**: Quick search for contacts

**Access Control**: `dep_manager`, `unit_head`, `team_lead`, `senior`, `junior`

**Response**:
```json
{
  "status": "success",
  "message": "Contacts found successfully",
  "data": {
    "contacts": [
      {
        "id": 1,
        "clientName": "John Doe",
        "companyName": "Acme Corp",
        "email": "john@acme.com",
        "phone": "+1234567890",
        "city": "New York"
      }
    ]
  }
}
```

## Data Transfer Objects (DTOs)

### CreateClientDto
```typescript
{
  clientType?: string;           // Max 20 chars
  companyName?: string;          // Max 255 chars
  clientName?: string;           // Max 100 chars
  email?: string;                // Valid email, max 150 chars
  phone?: string;                // Max 20 chars
  passwordHash: string;          // Required, min 6, max 255 chars
  altPhone?: string;             // Max 20 chars
  address?: string;              // Max 255 chars
  city?: string;                 // Max 100 chars
  state?: string;                // Max 100 chars
  postalCode?: string;           // Max 20 chars
  country?: string;              // Max 100 chars
  industryId?: number;           // Must exist in industries table
  taxId?: string;                // Max 50 chars
  accountStatus?: accStat;       // Enum: active, inactive, suspended, prospect
  notes?: string;                // Optional notes
}
```

### UpdateClientDto
```typescript
// All fields from CreateClientDto are optional
// Extends PartialType(CreateClientDto)
```

### ClientQueryDto
```typescript
{
  search?: string;               // Search across multiple fields
  clientType?: string;           // Exact match
  companyName?: string;          // Contains (case-insensitive)
  clientName?: string;           // Contains (case-insensitive)
  email?: string;                // Contains (case-insensitive)
  phone?: string;                // Contains (case-insensitive)
  city?: string;                 // Contains (case-insensitive)
  state?: string;                // Contains (case-insensitive)
  country?: string;              // Contains (case-insensitive)
  industryId?: number;           // Exact match
  accountStatus?: accStat;       // Exact match
  createdBy?: number;            // Exact match
  createdAfter?: string;         // Date string (ISO format)
  createdBefore?: string;        // Date string (ISO format)
  sortBy?: string;               // Field to sort by
  sortOrder?: 'asc' | 'desc';    // Sort direction
  page?: number;                 // Page number (min: 1)
  limit?: number;                // Items per page (min: 1, max: 100)
}
```

## Error Handling

### Common Error Codes
- `400 Bad Request`: Validation errors, invalid data
- `401 Unauthorized`: Missing or invalid JWT token
- `403 Forbidden`: Insufficient permissions or wrong role
- `404 Not Found`: Client not found
- `409 Conflict`: Email already exists
- `500 Internal Server Error`: Database or server errors

### Error Response Format
```json
{
  "statusCode": 400,
  "message": "Client with this email already exists",
  "error": "Conflict"
}
```

## Business Rules

### Client Creation
- Email must be unique across all clients
- Industry ID must exist in the industries table
- Password hash is required and must be at least 6 characters
- Account status defaults to 'prospect' if not provided
- Created by field is automatically set to the authenticated user

### Client Updates
- Only department managers and unit heads can update clients
- Email uniqueness is checked (excluding current client)
- Industry validation is performed if industry ID is provided
- All fields are optional for updates

### Client Deletion
- Only department managers and unit heads can delete clients
- Soft delete is not implemented - clients are permanently removed
- Consider data integrity before deletion

### Search and Filtering
- Search functionality works across multiple fields simultaneously
- All text searches are case-insensitive
- Date filters support ISO format strings
- Pagination is enforced with reasonable limits

## Security Considerations

### Authentication
- All endpoints require valid JWT authentication
- Tokens must be included in Authorization header

### Authorization
- Role-based access control enforced
- Production department is completely blocked from client access
- Update and delete operations restricted to senior roles only

### Data Protection
- Input validation on all fields
- SQL injection prevention through Prisma ORM
- Proper error handling without exposing sensitive information
- Password hashing is handled by the client (service expects pre-hashed passwords)

## Performance Considerations

- Database queries include necessary relations
- Proper indexing on frequently queried fields
- Pagination limits prevent large data dumps
- Search functionality is optimized for common use cases

## Development Notes

### Adding New Features
1. Update DTOs in `dto/` directory
2. Add service methods in `services/client.service.ts`
3. Add controller endpoints in `controllers/client.controller.ts`
4. Update this documentation

### Testing
- All endpoints should be tested with valid and invalid data
- Test role-based access control
- Test email uniqueness validation
- Test industry validation
- Test pagination and filtering

### Dependencies
- `PrismaService`: Database operations
- `JwtAuthGuard`: Authentication
- `RolesGuard`: Role-based access control
- `@nestjs/common`: NestJS framework
- `class-validator`: Input validation
- `class-transformer`: Data transformation
- `@prisma/client`: Database client
