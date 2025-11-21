# Roles Guard System

This directory contains the custom roles guard system for the CRM backend application.

## Components

### 1. Roles Decorator (`../decorators/roles.decorator.ts`)
- **Purpose**: Decorator to specify required roles for controller methods
- **Usage**: `@Roles(RoleName.dep_manager, RoleName.team_lead)`

### 2. Roles Guard (`roles.guard.ts`)
- **Purpose**: Guard that checks if the authenticated user has the required roles
- **Features**:
  - Supports multiple required roles (OR logic)
  - Works with JWT authentication
  - Provides detailed error messages
  - Handles both role names and role IDs

## Available Roles

Based on the `RoleName` enum in the Prisma schema:
- `dep_manager` - Department Manager
- `team_lead` - Team Lead
- `senior` - Senior Employee
- `junior` - Junior Employee
- `unit_head` - Unit Head

## Usage Examples

### 1. Controller-level Role Protection

```typescript
import { Controller, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RoleName } from '@prisma/client';

@Controller('employees')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleName.dep_manager, RoleName.hr)
export class EmployeeController {
  // All methods in this controller require dep_manager or hr role
}
```

### 2. Method-level Role Protection

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
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
    // Only dep_manager or team_lead can access this endpoint
  }

  @Get('senior')
  @Roles(RoleName.senior, RoleName.dep_manager)
  findSeniorEmployees() {
    // Only senior or dep_manager can access this endpoint
  }

  @Get('public')
  // No @Roles decorator - accessible to all authenticated users
  findPublicData() {
    // All authenticated users can access this endpoint
  }
}
```

### 3. Multiple Guards

```typescript
import { Controller, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RoleName } from '@prisma/client';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard) // Order matters: JWT first, then Roles
@Roles(RoleName.dep_manager, RoleName.unit_head)
export class AdminController {
  // Admin-only endpoints
}
```

## Error Handling

The guard will throw a `ForbiddenException` with a descriptive message if:
- User is not authenticated
- User doesn't have the required roles

Example error message:
```
User does not have the required roles. Required: dep_manager, team_lead. User role: junior
```

## Best Practices

1. **Always use JWT guard first**: `@UseGuards(JwtAuthGuard, RolesGuard)`
2. **Be specific with roles**: Only grant the minimum required permissions
3. **Use method-level protection**: Apply roles at the method level for fine-grained control
4. **Document role requirements**: Add comments explaining why certain roles are required

## Integration with JWT Strategy

The roles guard works with the JWT strategy that should include the user's role in the token payload:

```typescript
// In JWT strategy validate method
validate(payload: JwtPayload) {
  return {
    id: payload.sub,
    role: payload.role, // This should be the role name or ID
    // ... other user data
  };
}
``` 

## Departments Guard

### Departments Decorator (`../decorators/departments.decorator.ts`)
- **Usage**: `@Departments(DepartmentName.hr, DepartmentName.sales)`

### Departments Guard (`departments.guard.ts`)
- **Purpose**: Restrict endpoints by user department
- **Departments**: hr, sales, production, accounts, marketing

Example:
```typescript
@Controller('finance')
@UseGuards(JwtAuthGuard, DepartmentsGuard)
@Departments(DepartmentName.accounts)
export class FinanceController {}
``` 