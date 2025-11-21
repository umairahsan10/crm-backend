# JWT Authentication Implementation Guide

## Overview
This guide explains the JWT authentication implementation for the CRM backend, including how tokens are structured, how authentication works, and how to use it in your controllers.

## JWT Token Structure

### For Admin Users:
```json
{
  "sub": 1,
  "email": "admin@company.com",
  "role": "admin",
  "type": "admin"
}
```

### For Employee Users:
```json
{
  "sub": 123,
  "email": "employee@company.com", 
  "role": 2,
  "type": "full_time",
  "departmentId": 5
}
```

## Authentication Flow

### 1. Login Process
1. **Client Request**: POST `/auth/login`
   ```json
   {
     "email": "user@company.com",
     "password": "password123"
   }
   ```

2. **Server Response**:
   ```json
   {
     "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
     "user": {
       "id": 123,
       "email": "employee@company.com",
       "role": 2,
       "type": "full_time",
       "departmentId": 5
     }
   }
   ```

### 2. Protected Route Access
1. **Client Request**: Include JWT in Authorization header
   ```
   Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

2. **Server Processing**:
   - JwtAuthGuard intercepts request
   - JwtStrategy validates token
   - User info available in `req.user`

## Usage Examples

### 1. Protecting Routes
```typescript
import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('example')
export class ExampleController {
  
  @UseGuards(JwtAuthGuard)
  @Get('protected')
  getProtectedData(@Request() req) {
    // req.user contains user information
    return {
      message: 'This is protected data',
      user: req.user
    };
  }
}
```

### 2. Role-Based Access Control
```typescript
@UseGuards(JwtAuthGuard)
@Get('admin-only')
getAdminData(@Request() req) {
  if (req.user.type !== 'admin') {
    throw new UnauthorizedException('Admin access required');
  }
  
  return { message: 'Admin data' };
}
```

### 3. Department-Specific Access
```typescript
@UseGuards(JwtAuthGuard)
@Get('department-data')
getDepartmentData(@Request() req) {
  if (req.user.type === 'admin') {
    throw new Error('Admins cannot access department-specific data');
  }
  
  const departmentId = req.user.departmentId;
  return { departmentId, data: 'Department specific data' };
}
```

## Available User Properties

After authentication, `req.user` contains:

| Property | Type | Description | Available For |
|----------|------|-------------|---------------|
| `id` | number | User ID | All users |
| `email` | string | User email | All users |
| `role` | string/number | Role ID or role name | All users |
| `type` | string | User type ('admin' or employment type) | All users |
| `departmentId` | number | Department ID | Employees only |

## Error Handling

### Common JWT Errors:
- **401 Unauthorized**: Invalid or missing token
- **401 Unauthorized**: Token expired
- **401 Unauthorized**: Invalid credentials during login

### Example Error Response:
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

## Security Best Practices

1. **Token Storage**: Store JWT tokens securely (httpOnly cookies or secure storage)
2. **Token Expiration**: Tokens expire after 7 days (configurable in auth.module.ts)
3. **HTTPS**: Always use HTTPS in production
4. **Environment Variables**: Store JWT_SECRET in environment variables

## Testing JWT Authentication

### 1. Login Test
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@company.com", "password": "password123"}'
```

### 2. Protected Route Test
```bash
curl -X GET http://localhost:3000/auth/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Configuration

JWT configuration is in `src/modules/auth/auth.module.ts`:
```typescript
JwtModule.register({
  secret: process.env.JWT_SECRET,
  signOptions: { expiresIn: '7d' },
})
```

## Troubleshooting

### Common Issues:
1. **"Invalid credentials"**: Check email/password combination
2. **"Unauthorized"**: Ensure JWT token is valid and not expired
3. **"AdminWhereUniqueInput" error**: Fixed by using `findFirst` instead of `findUnique` for admin queries

### Debug Steps:
1. Check if user exists in database
2. Verify password hashing
3. Validate JWT token format
4. Check environment variables 