# Roles Guard Implementation

This document describes the complete implementation of the custom roles guard system for the CRM backend application.

## Overview

The roles guard system provides role-based access control (RBAC) for API endpoints. It consists of:

1. **Roles Decorator** - Used to specify required roles for endpoints
2. **Roles Guard** - Validates user permissions against required roles
3. **Enhanced Roles Guard** - Version that can handle role IDs from database

## Files Created

### 1. Core Components

- `src/common/decorators/roles.decorator.ts` - Custom `@Roles` decorator
- `src/common/guards/roles.guard.ts` - Basic roles guard for role names
- `src/common/guards/roles-with-service.guard.ts` - Enhanced guard for role IDs
- `src/common/guards/index.ts` - Export file for guards
- `src/common/decorators/index.ts` - Export file for decorators

### 2. Documentation

- `src/common/guards/README.md` - Usage guide and examples
- `ROLES_GUARD_IMPLEMENTATION.md` - This comprehensive guide

### 3. Example Implementation

- Enhanced `src/modules/employee/employee.controller.ts` - Real-world usage example
- `test/roles-guard.spec.ts` - Comprehensive test suite

## Available Roles

Based on the `RoleName` enum in the Prisma schema:

```typescript
enum RoleName {
  dep_manager  // Department Manager
  team_lead    // Team Lead
  senior       // Senior Employee
  junior       // Junior Employee
  unit_head    // Unit Head
}
```

## Usage Examples

### Basic Usage

```typescript
import { Controller, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RoleName } from '@prisma/client';

@Controller('employees')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EmployeeController {
  
  @Get()
  @Roles(RoleName.dep_manager, RoleName.team_lead)
  findAll() {
    // Only department managers and team leads can access
  }

  @Get('public')
  // No @Roles decorator - accessible to all authenticated users
  findPublicData() {
    // All authenticated users can access
  }
}
```

### Controller-Level Protection

```typescript
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleName.dep_manager, RoleName.unit_head)
export class AdminController {
  // All methods require dep_manager or unit_head role
}
```

### Method-Level Protection

```typescript
@Controller('employees')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EmployeeController {
  
  @Get('my-profile')
  // No @Roles - accessible to all authenticated users
  getMyProfile() {}

  @Get('department-employees')
  @Roles(RoleName.dep_manager, RoleName.team_lead)
  getDepartmentEmployees() {}

  @Get('all-employees')
  @Roles(RoleName.dep_manager, RoleName.unit_head)
  getAllEmployees() {}
}
```

## Guard Types

### 1. Basic Roles Guard (`roles.guard.ts`)

**Use when**: JWT token contains role names as strings

**Features**:
- Fast execution (no database queries)
- Works with role names directly
- Lightweight and efficient

**Limitation**: Requires JWT to contain role names, not IDs

### 2. Enhanced Roles Guard (`roles-with-service.guard.ts`)

**Use when**: JWT token contains role IDs as numbers

**Features**:
- Can handle both role names and role IDs
- Fetches role information from database when needed
- More flexible but slightly slower

**Requirement**: Needs PrismaService injection

## Integration with JWT Strategy

The roles guard works with the existing JWT strategy. Ensure your JWT payload includes the user's role:

```typescript
// In JWT strategy validate method
validate(payload: JwtPayload) {
  return {
    id: payload.sub,
    role: payload.role, // Role name or ID
    type: payload.type,
    // ... other user data
  };
}
```

## Error Handling

The guard provides clear error messages:

- **Not authenticated**: `"User not authenticated"`
- **Insufficient permissions**: `"User does not have the required roles. Required: dep_manager, team_lead. User role: junior"`

## Testing

Run the test suite to verify the guard functionality:

```bash
npm test roles-guard.spec.ts
```

The test suite covers:
- Access granted when user has required role
- Access denied when user lacks required role
- Multiple role requirements (OR logic)
- Authentication checks
- Error message validation

## Best Practices

1. **Always use JWT guard first**: `@UseGuards(JwtAuthGuard, RolesGuard)`
2. **Be specific with roles**: Only grant minimum required permissions
3. **Use method-level protection**: Apply roles at method level for fine-grained control
4. **Document role requirements**: Add comments explaining why certain roles are required
5. **Test thoroughly**: Ensure all role combinations work as expected

## Migration Guide

To add role protection to existing controllers:

1. **Import required modules**:
   ```typescript
   import { RolesGuard } from '../common/guards/roles.guard';
   import { Roles } from '../common/decorators/roles.decorator';
   import { RoleName } from '@prisma/client';
   ```

2. **Add guards to controller**:
   ```typescript
   @UseGuards(JwtAuthGuard, RolesGuard)
   ```

3. **Add role decorators to methods**:
   ```typescript
   @Roles(RoleName.dep_manager, RoleName.team_lead)
   ```

4. **Test the endpoints** with different user roles

## Security Considerations

1. **Role validation**: The guard validates roles against the `RoleName` enum
2. **Authentication first**: Always use JWT authentication before role checking
3. **Error messages**: Avoid exposing sensitive information in error messages
4. **Database queries**: The enhanced guard makes database queries - consider caching for performance
5. **Role hierarchy**: Consider implementing role hierarchy if needed (e.g., unit_head > dep_manager > team_lead)

## Future Enhancements

Potential improvements for the roles guard system:

1. **Role hierarchy**: Implement role inheritance (higher roles can access lower role endpoints)
2. **Permission-based**: Add granular permissions beyond just roles
3. **Caching**: Cache role information to reduce database queries
4. **Dynamic roles**: Support dynamic role assignment and validation
5. **Audit logging**: Log role-based access attempts for security monitoring 