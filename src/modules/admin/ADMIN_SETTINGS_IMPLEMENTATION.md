# Admin Settings Implementation Guide

## Overview
This document contains the complete specification for implementing admin settings APIs in the CRM backend. All endpoints are admin-only and require `AdminGuard` authentication.

---

## Table of Contents
1. [Admin User Management](#1-admin-user-management)
2. [Company Settings](#2-company-settings)
3. [Departments Management](#3-departments-management)
4. [Roles Management](#4-roles-management)
5. [HR Permissions Management](#5-hr-permissions-management)
6. [Accountant Permissions Management](#6-accountant-permissions-management)
7. [Folder Structure](#folder-structure)
8. [Implementation Phases](#implementation-phases)

---

## 1. Admin User Management

### Base Path: `/admin`

### Endpoints

#### GET `/admin`
- **Description**: Get all admins (simple list, paginated)
- **Method**: GET
- **Query Parameters**: 
  - `page` (optional, default: 1)
  - `limit` (optional, default: 10)
- **Response**: `AdminListResponseDto`
- **Status**: ✅ Already implemented

#### GET `/admin/:id`
- **Description**: Get admin by ID (for profile details)
- **Method**: GET
- **Path Parameters**: `id` (number)
- **Response**: `AdminResponseDto`
- **Status**: ✅ Already implemented

#### POST `/admin`
- **Description**: Create new admin user
- **Method**: POST
- **Request Body**: `CreateAdminDto`
  ```typescript
  {
    firstName: string;      // Required, min 2 chars
    lastName: string;       // Required, min 2 chars
    email: string;         // Required, valid email
    password: string;      // Required, min 6 chars
    role?: AdminRole;      // Optional, enum: 'admin' | 'super_manager'
  }
  ```
- **Response**: `AdminResponseDto`
- **Validation Rules**:
  - Email must be unique
  - Password minimum 6 characters
  - First name and last name minimum 2 characters
- **Status**: ❌ To be implemented

#### PUT `/admin/:id`
- **Description**: Update admin profile
- **Method**: PUT
- **Path Parameters**: `id` (number)
- **Request Body**: `UpdateAdminDto` (all fields optional)
- **Response**: `AdminResponseDto`
- **Status**: ✅ Already implemented

#### DELETE `/admin/:id`
- **Description**: Delete admin user
- **Method**: DELETE
- **Path Parameters**: `id` (number)
- **Response**: `{ message: string }`
- **Validation Rules**:
  - Cannot delete yourself
  - Cannot delete if it's the last admin (at least one admin must exist)
- **Status**: ❌ To be implemented

---

## 2. Company Settings

### Base Path: `/admin/settings/company`

### Business Rules
- **Only ONE company record exists** (ID = 1)
- **Cannot create** more companies (no POST endpoint)
- **Cannot delete** company (no DELETE endpoint)
- **Update supports partial updates** (can update single field or multiple fields)

### Endpoints

#### GET `/admin/settings/company`
- **Description**: Get company record (single record, ID = 1)
- **Method**: GET
- **Response**: `CompanySettingsResponseDto`
- **Status**: ❌ To be implemented

#### PUT `/admin/settings/company`
- **Description**: Update company settings (all fields or single field)
- **Method**: PUT
- **Request Body**: `UpdateCompanySettingsDto` (all fields optional)
  ```typescript
  {
    name?: string;
    address?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
    phone?: string;
    email?: string;
    website?: string;
    taxId?: string;
    status?: string;
    // Attendance Settings
    lateTime?: number;              // Minutes threshold for late
    halfTime?: number;              // Minutes threshold for half day
    absentTime?: number;            // Minutes threshold for absent
    // Leave Policies
    quarterlyLeavesDays?: number;  // Quarterly leave days allowed
    monthlyLatesDays?: number;     // Monthly late days allowed
    // Deductions
    absentDeduction?: number;        // Deduction for absent days
    lateDeduction?: number;         // Deduction for late arrivals
    halfDeduction?: number;         // Deduction for half days
  }
  ```
- **Response**: `CompanySettingsResponseDto`
- **Status**: ❌ To be implemented

---

## 3. Departments Management

### Base Path: `/admin/settings/departments`

### Endpoints

#### GET `/admin/settings/departments`
- **Description**: Get all departments
- **Method**: GET
- **Query Parameters**: 
  - `page` (optional)
  - `limit` (optional)
  - `search` (optional)
- **Response**: `DepartmentListResponseDto`
- **Status**: ❌ To be implemented

#### GET `/admin/settings/departments/:id`
- **Description**: Get department by ID
- **Method**: GET
- **Path Parameters**: `id` (number)
- **Response**: `DepartmentResponseDto`
- **Status**: ❌ To be implemented

#### POST `/admin/settings/departments`
- **Description**: Create department
- **Method**: POST
- **Request Body**: `CreateDepartmentDto`
  ```typescript
  {
    name: string;              // Required, unique
    description?: string;      // Optional
    managerId?: number;        // Optional, employee ID
  }
  ```
- **Response**: `DepartmentResponseDto`
- **Status**: ❌ To be implemented

#### PUT `/admin/settings/departments/:id`
- **Description**: Update department
- **Method**: PUT
- **Path Parameters**: `id` (number)
- **Request Body**: `UpdateDepartmentDto` (all fields optional)
- **Response**: `DepartmentResponseDto`
- **Status**: ❌ To be implemented

#### DELETE `/admin/settings/departments/:id`
- **Description**: Delete department
- **Method**: DELETE
- **Path Parameters**: `id` (number)
- **Response**: `{ message: string }`
- **Validation**: Check if department has employees before deletion
- **Status**: ❌ To be implemented

---

## 4. Roles Management

### Base Path: `/admin/settings/roles`

### Endpoints

#### GET `/admin/settings/roles`
- **Description**: Get all roles
- **Method**: GET
- **Query Parameters**: 
  - `page` (optional)
  - `limit` (optional)
  - `search` (optional)
- **Response**: `RoleListResponseDto`
- **Status**: ❌ To be implemented

#### GET `/admin/settings/roles/:id`
- **Description**: Get role by ID
- **Method**: GET
- **Path Parameters**: `id` (number)
- **Response**: `RoleResponseDto`
- **Status**: ❌ To be implemented

#### POST `/admin/settings/roles`
- **Description**: Create role
- **Method**: POST
- **Request Body**: `CreateRoleDto`
  ```typescript
  {
    name: RoleName;            // Required, enum: 'dep_manager' | 'team_lead' | 'senior' | 'junior' | 'unit_head'
    description?: string;       // Optional
  }
  ```
- **Response**: `RoleResponseDto`
- **Validation**: Role name must be unique
- **Status**: ❌ To be implemented

#### PUT `/admin/settings/roles/:id`
- **Description**: Update role
- **Method**: PUT
- **Path Parameters**: `id` (number)
- **Request Body**: `UpdateRoleDto` (all fields optional)
- **Response**: `RoleResponseDto`
- **Status**: ❌ To be implemented

#### DELETE `/admin/settings/roles/:id`
- **Description**: Delete role
- **Method**: DELETE
- **Path Parameters**: `id` (number)
- **Response**: `{ message: string }`
- **Validation**: Cannot delete if role has employees assigned
- **Status**: ❌ To be implemented

---

## 5. HR Permissions Management

### Base Path: `/admin/settings/hr-permissions`

### Business Rules
- Manages permissions for **all HR department employees**
- Employee must be in HR department
- Creates/updates HR record for employees

### Endpoints

#### GET `/admin/settings/hr-permissions`
- **Description**: Get all HR department employees with permissions
- **Method**: GET
- **Query Parameters**: 
  - `page` (optional)
  - `limit` (optional)
- **Response**: `HrPermissionsListResponseDto`
- **Status**: ❌ To be implemented

#### GET `/admin/settings/hr-permissions/:id`
- **Description**: Get HR permissions by employee ID
- **Method**: GET
- **Path Parameters**: `id` (number) - Employee ID
- **Response**: `HrPermissionsResponseDto`
- **Status**: ❌ To be implemented

#### POST `/admin/settings/hr-permissions`
- **Description**: Create HR record for employee
- **Method**: POST
- **Request Body**: `CreateHrPermissionsDto`
  ```typescript
  {
    employeeId: number;                    // Required
    attendancePermission?: boolean;
    salaryPermission?: boolean;
    commissionPermission?: boolean;
    employeeAddPermission?: boolean;
    terminationsHandle?: boolean;
    monthlyRequestApprovals?: boolean;
    targetsSet?: boolean;
    bonusesSet?: boolean;
    shiftTimingSet?: boolean;
  }
  ```
- **Response**: `HrPermissionsResponseDto`
- **Validation**: 
  - Employee must exist and be in HR department
  - Employee must not already have HR record
- **Status**: ❌ To be implemented

#### PUT `/admin/settings/hr-permissions/:id`
- **Description**: Update HR permissions for employee
- **Method**: PUT
- **Path Parameters**: `id` (number) - Employee ID
- **Request Body**: `UpdateHrPermissionsDto` (all fields optional)
- **Response**: `HrPermissionsResponseDto`
- **Status**: ❌ To be implemented

#### DELETE `/admin/settings/hr-permissions/:id`
- **Description**: Delete HR record (remove employee from HR)
- **Method**: DELETE
- **Path Parameters**: `id` (number) - Employee ID
- **Response**: `{ message: string }`
- **Status**: ❌ To be implemented

---

## 6. Accountant Permissions Management

### Base Path: `/admin/settings/accountant-permissions`

### Business Rules
- Manages permissions for **all Accounts department employees**
- Employee must be in Accounts department
- Creates/updates Accountant record for employees

### Endpoints

#### GET `/admin/settings/accountant-permissions`
- **Description**: Get all Accounts department employees with permissions
- **Method**: GET
- **Query Parameters**: 
  - `page` (optional)
  - `limit` (optional)
- **Response**: `AccountantPermissionsListResponseDto`
- **Status**: ❌ To be implemented

#### GET `/admin/settings/accountant-permissions/:id`
- **Description**: Get accountant permissions by employee ID
- **Method**: GET
- **Path Parameters**: `id` (number) - Employee ID
- **Response**: `AccountantPermissionsResponseDto`
- **Status**: ❌ To be implemented

#### POST `/admin/settings/accountant-permissions`
- **Description**: Create accountant record for employee
- **Method**: POST
- **Request Body**: `CreateAccountantPermissionsDto`
  ```typescript
  {
    employeeId: number;                    // Required
    liabilitiesPermission?: boolean;
    salaryPermission?: boolean;
    salesPermission?: boolean;
    invoicesPermission?: boolean;
    expensesPermission?: boolean;
    assetsPermission?: boolean;
    revenuesPermission?: boolean;
  }
  ```
- **Response**: `AccountantPermissionsResponseDto`
- **Validation**: 
  - Employee must exist and be in Accounts department
  - Employee must not already have Accountant record
- **Status**: ❌ To be implemented

#### PUT `/admin/settings/accountant-permissions/:id`
- **Description**: Update accountant permissions for employee
- **Method**: PUT
- **Path Parameters**: `id` (number) - Employee ID
- **Request Body**: `UpdateAccountantPermissionsDto` (all fields optional)
- **Response**: `AccountantPermissionsResponseDto`
- **Status**: ❌ To be implemented

#### DELETE `/admin/settings/accountant-permissions/:id`
- **Description**: Delete accountant record (remove employee from Accounts)
- **Method**: DELETE
- **Path Parameters**: `id` (number) - Employee ID
- **Response**: `{ message: string }`
- **Status**: ❌ To be implemented

---

## Folder Structure

```
src/modules/admin/
├── admin.controller.ts          # Main admin CRUD (existing + new POST/DELETE)
├── admin.service.ts             # Main admin service (existing + new methods)
├── admin.module.ts               # Main module (updated to import SettingsModule)
├── guards/
│   └── admin.guard.ts           # Admin guard (existing)
├── dto/
│   ├── admin-response.dto.ts    # Existing
│   ├── update-admin.dto.ts      # Existing
│   └── create-admin.dto.ts     # NEW - for POST /admin
│
└── settings/                    # NEW - Admin Settings Module
    ├── settings.module.ts       # Settings module
    │
    ├── company/                 # Company Settings
    │   ├── company-settings.module.ts
    │   ├── company-settings.controller.ts
    │   ├── company-settings.service.ts
    │   └── dto/
    │       ├── update-company-settings.dto.ts
    │       └── company-settings-response.dto.ts
    │
    ├── departments/             # Departments Management
    │   ├── departments.module.ts
    │   ├── departments.controller.ts
    │   ├── departments.service.ts
    │   └── dto/
    │       ├── create-department.dto.ts
    │       ├── update-department.dto.ts
    │       └── department-response.dto.ts
    │
    ├── roles/                   # Roles Management
    │   ├── roles.module.ts
    │   ├── roles.controller.ts
    │   ├── roles.service.ts
    │   └── dto/
    │       ├── create-role.dto.ts
    │       ├── update-role.dto.ts
    │       └── role-response.dto.ts
    │
    ├── hr-permissions/          # HR Permissions Management
    │   ├── hr-permissions.module.ts
    │   ├── hr-permissions.controller.ts
    │   ├── hr-permissions.service.ts
    │   └── dto/
    │       ├── create-hr-permissions.dto.ts
    │       ├── update-hr-permissions.dto.ts
    │       └── hr-permissions-response.dto.ts
    │
    └── accountant-permissions/   # Accountant Permissions Management
        ├── accountant-permissions.module.ts
        ├── accountant-permissions.controller.ts
        ├── accountant-permissions.service.ts
        └── dto/
            ├── create-accountant-permissions.dto.ts
            ├── update-accountant-permissions.dto.ts
            └── accountant-permissions-response.dto.ts
```

---

## Implementation Phases

### Phase 1: Admin User Management ✅
- [x] Create `dto/create-admin.dto.ts`
- [x] Add `POST /admin` endpoint in `admin.controller.ts`
- [x] Add `DELETE /admin/:id` endpoint in `admin.controller.ts`
- [x] Add `createAdmin()` method in `admin.service.ts`
- [x] Add `deleteAdmin()` method in `admin.service.ts`

### Phase 2: Settings Module Structure
- [ ] Create `settings/settings.module.ts`
- [ ] Update `admin.module.ts` to import SettingsModule

### Phase 3: Company Settings Module
- [ ] Create `settings/company/company-settings.module.ts`
- [ ] Create `settings/company/company-settings.controller.ts`
- [ ] Create `settings/company/company-settings.service.ts`
- [ ] Create `settings/company/dto/update-company-settings.dto.ts`
- [ ] Create `settings/company/dto/company-settings-response.dto.ts`

### Phase 4: Departments Module
- [ ] Create `settings/departments/departments.module.ts`
- [ ] Create `settings/departments/departments.controller.ts`
- [ ] Create `settings/departments/departments.service.ts`
- [ ] Create `settings/departments/dto/create-department.dto.ts`
- [ ] Create `settings/departments/dto/update-department.dto.ts`
- [ ] Create `settings/departments/dto/department-response.dto.ts`

### Phase 5: Roles Module
- [ ] Create `settings/roles/roles.module.ts`
- [ ] Create `settings/roles/roles.controller.ts`
- [ ] Create `settings/roles/roles.service.ts`
- [ ] Create `settings/roles/dto/create-role.dto.ts`
- [ ] Create `settings/roles/dto/update-role.dto.ts`
- [ ] Create `settings/roles/dto/role-response.dto.ts`

### Phase 6: HR Permissions Module
- [ ] Create `settings/hr-permissions/hr-permissions.module.ts`
- [ ] Create `settings/hr-permissions/hr-permissions.controller.ts`
- [ ] Create `settings/hr-permissions/hr-permissions.service.ts`
- [ ] Create `settings/hr-permissions/dto/create-hr-permissions.dto.ts`
- [ ] Create `settings/hr-permissions/dto/update-hr-permissions.dto.ts`
- [ ] Create `settings/hr-permissions/dto/hr-permissions-response.dto.ts`

### Phase 7: Accountant Permissions Module
- [ ] Create `settings/accountant-permissions/accountant-permissions.module.ts`
- [ ] Create `settings/accountant-permissions/accountant-permissions.controller.ts`
- [ ] Create `settings/accountant-permissions/accountant-permissions.service.ts`
- [ ] Create `settings/accountant-permissions/dto/create-accountant-permissions.dto.ts`
- [ ] Create `settings/accountant-permissions/dto/update-accountant-permissions.dto.ts`
- [ ] Create `settings/accountant-permissions/dto/accountant-permissions-response.dto.ts`

---

## Common Requirements

### Authentication & Authorization
- All endpoints require `JwtAuthGuard`
- All endpoints require `AdminGuard` (admin-only access)
- Use `@UseGuards(JwtAuthGuard, AdminGuard)` decorator

### Error Handling
- Use proper HTTP status codes:
  - `200` - Success
  - `201` - Created
  - `400` - Bad Request (validation errors)
  - `401` - Unauthorized
  - `403` - Forbidden
  - `404` - Not Found
  - `409` - Conflict (duplicate entries)
  - `500` - Internal Server Error

### Validation
- Use class-validator decorators in DTOs
- Validate all required fields
- Check for uniqueness where applicable
- Validate foreign key relationships

### Swagger Documentation
- Add `@ApiTags()` to controllers
- Add `@ApiOperation()` to all endpoints
- Add `@ApiResponse()` for all possible responses
- Add `@ApiBody()` for POST/PUT requests
- Add `@ApiParam()` for path parameters
- Add `@ApiQuery()` for query parameters

### Logging
- Use NestJS Logger for all operations
- Log successful operations
- Log errors with context

---

## Notes

1. **Company Settings**: Only one company record (ID = 1) exists. No create/delete operations.
2. **HR Permissions**: Employee must be in HR department. The `:id` parameter refers to employee ID, not HR record ID.
3. **Accountant Permissions**: Employee must be in Accounts department. The `:id` parameter refers to employee ID, not Accountant record ID.
4. **Departments & Roles**: Can be deleted only if no employees are assigned.
5. **Admin Deletion**: Cannot delete yourself or the last admin.

---

## Testing Checklist

For each endpoint, test:
- [ ] Successful request
- [ ] Authentication failure (no token)
- [ ] Authorization failure (non-admin user)
- [ ] Validation errors (invalid data)
- [ ] Not found errors (invalid IDs)
- [ ] Conflict errors (duplicate entries)
- [ ] Business rule violations (e.g., deleting last admin)

---

**Last Updated**: 2025-01-XX
**Status**: Phase 1 - In Progress

