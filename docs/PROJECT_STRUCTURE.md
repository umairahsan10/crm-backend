# CRM Backend Project Structure

## Overview
This CRM backend is built using NestJS with a modular architecture that separates different business concerns into dedicated modules. Each module is organized with submodules for specific functionality, following a consistent pattern across the application.

## Module Architecture

### Core Modules

```
src/modules/
├── auth/                    # Authentication & Authorization
├── company/                 # Company management
├── employee/                # Employee management
├── hr/                      # Human Resources
│   ├── dto/                 # HR DTOs (termination, logs)
│   ├── salary/              # Salary submodule
│   │   ├── dto/             # Salary-related DTOs
│   │   ├── salary.service.ts
│   │   ├── salary.controller.ts
│   │   └── salary.module.ts
│   ├── hr.service.ts        # Main HR service
│   ├── hr.controller.ts     # Main HR controller
│   └── hr.module.ts         # HR module configuration
├── finance/                 # Financial operations
│   ├── dto/                 # Finance DTOs (commission, transfer)
│   ├── salary/              # Salary submodule
│   │   ├── dto/             # Salary-related DTOs
│   │   ├── salary.service.ts
│   │   ├── salary.controller.ts
│   │   └── salary.module.ts
│   ├── finance.service.ts   # Main finance service
│   ├── finance.controller.ts # Main finance controller
│   └── finance.module.ts    # Finance module configuration
├── sales/                   # Sales management
│   ├── units/               # Sales units submodule
│   ├── commissions/         # Commissions submodule
│   ├── leads/               # Leads submodule
│   └── sales.module.ts
├── marketing/               # Marketing operations
├── production/              # Production management
├── projects/                # Project management
├── attendance/              # Attendance tracking
└── communication/           # Communication features
```

## Module Organization Pattern

### Standard Module Structure
Each module follows this consistent pattern:

```
module-name/
├── dto/                     # Data Transfer Objects
│   ├── create-entity.dto.ts
│   ├── update-entity.dto.ts
│   └── response.dto.ts
├── submodule1/              # Submodules for specific concerns
│   ├── dto/
│   ├── submodule1.service.ts
│   ├── submodule1.controller.ts
│   └── submodule1.module.ts
├── submodule2/
│   ├── dto/
│   ├── submodule2.service.ts
│   ├── submodule2.controller.ts
│   └── submodule2.module.ts
├── module-name.service.ts   # Main service (if needed)
├── module-name.controller.ts # Main controller (if needed)
└── module-name.module.ts    # Module configuration
```

## API Endpoint Structure

### HR Module Endpoints
```
Main HR Module:
├── POST   /hr/terminate     # Terminate employee
└── GET    /hr/logs          # Get HR activity logs

Salary Submodule:
├── GET    /hr/salary/deductions    # Calculate salary deductions
├── PATCH  /hr/salary/update        # Update employee salary
└── PATCH  /hr/salary/mark-paid     # Mark salary as paid
```

### Finance Module Endpoints
```
Main Finance Module:
├── POST   /finance/assign-commission    # Assign commission
├── PATCH  /finance/update-withhold      # Update withhold flag
└── POST   /finance/transfer-commission  # Transfer commission

Salary Submodule:
├── POST   /finance/salary/calculate-all      # Calculate all salaries
├── GET    /finance/salary/preview/:employeeId # Salary preview
├── GET    /finance/salary/display/:employeeId # Get salary display
├── GET    /finance/salary/display-all        # Get all salaries display
└── GET    /finance/salary/breakdown/:employeeId # Get detailed breakdown
```

### Sales Module Endpoints
```
Main Sales Module:
├── GET    /sales/...        # General sales endpoints

Units Submodule:
├── GET    /sales/units/...  # Sales units endpoints

Commissions Submodule:
├── GET    /sales/commissions/... # Commission endpoints

Leads Submodule:
├── GET    /sales/leads/...  # Lead management endpoints with hierarchical access control
├── POST   /sales/leads/...  # Lead creation and management
├── PUT    /sales/leads/...  # Lead updates with business logic
├── DELETE /sales/leads/...  # Lead deletion and archiving
├── 🔐 Hierarchical Access Control: Role-based filtering (dep_manager, unit_head, team_lead, senior, junior)
├── 🏗️ Business Logic: Lead lifecycle management, commission tracking, team statistics
├── 📊 Advanced Features: Bulk operations, statistics, cracked leads management
```

## 🔐 Advanced Features

### Hierarchical Access Control System
The CRM implements a sophisticated hierarchical access control system, particularly in the Lead Management module:

#### **Access Control Hierarchy**
1. **Admin** - Full system access
2. **Department Manager** - All sales units access
3. **Unit Head** - Single sales unit access
4. **Team Lead** - Team-based access within unit
5. **Senior** - Individual level access
6. **Junior** - Restricted individual access

#### **Implementation Details**
- **Database-Driven**: Uses `sales_department` table for unit relationships
- **Team-Based Filtering**: Team leads see their team members' leads
- **Role-Based Type Filtering**: Different roles see different lead types
- **Performance Optimized**: Single query with conditional joins
- **Comprehensive Logging**: Detailed console logs for debugging

#### **Security Features**
- **JWT Authentication**: Secure token-based authentication
- **Role-Based Guards**: Multiple guard layers for access control
- **Data Isolation**: Users only see data appropriate to their role
- **Audit Trail**: Complete history of lead changes and access

## Benefits of Modular Architecture

### 1. **Separation of Concerns**
- Each module handles a specific business domain
- Submodules further separate related functionality
- Clear boundaries between different features

### 2. **Maintainability**
- Easy to locate and modify specific functionality
- Changes in one module don't affect others
- Consistent patterns across modules

### 3. **Scalability**
- New submodules can be added without affecting existing code
- Modules can be developed independently
- Easy to add new features to existing modules

### 4. **Code Reusability**
- Shared services can be imported across modules
- Common DTOs and utilities can be shared
- Consistent validation and error handling

### 5. **Testing**
- Each module can be tested independently
- Clear unit boundaries for testing
- Easier to mock dependencies

## Module Dependencies

### HR Module Dependencies
```typescript
// hr.module.ts
@Module({
  imports: [
    FinanceModule,    // For salary calculations
    SalaryModule      // Salary submodule
  ],
  controllers: [HrController],
  providers: [HrService],
})
export class HrModule {}
```

### Salary Submodule Dependencies
```typescript
// salary.module.ts
@Module({
  imports: [FinanceModule],  // For deduction calculations
  controllers: [SalaryController],
  providers: [SalaryService],
  exports: [SalaryService],  // Export for use in main HR module
})
export class SalaryModule {}
```

### Finance Salary Submodule Dependencies
```typescript
// finance/salary/salary.module.ts
@Module({
  controllers: [FinanceSalaryController],
  providers: [FinanceSalaryService],
  exports: [FinanceSalaryService],  // Export for potential use by other modules
})
export class FinanceSalaryModule {}
```

## Common Patterns

### 1. **DTO Organization**
- Each submodule has its own `dto/` folder
- DTOs are specific to the submodule's functionality
- Consistent naming conventions across modules

### 2. **Service Layer**
- Business logic is contained in services
- Services handle database operations and external integrations
- Clear separation between controllers and business logic

### 3. **Controller Organization**
- Controllers handle HTTP requests and responses
- Route prefixes follow module structure
- Consistent error handling and validation

### 4. **Module Configuration**
- Each module exports its services for use by other modules
- Clear dependency injection configuration
- Proper import/export structure

## Development Guidelines

### Adding New Submodules
1. Create the submodule folder structure
2. Create service, controller, and module files
3. Add DTOs specific to the submodule
4. Update the parent module to import the submodule
5. Update API documentation

### Adding New Endpoints
1. Add the endpoint to the appropriate controller
2. Create/update DTOs if needed
3. Implement business logic in the service
4. Add proper validation and error handling
5. Update documentation

### Code Organization
- Keep related functionality together
- Use consistent naming conventions
- Follow the established module patterns
- Maintain clear separation of concerns

## Future Enhancements

### Potential Module Additions
- **Inventory Module**: Product and stock management
- **Customer Module**: Customer relationship management
- **Reporting Module**: Analytics and reporting features
- **Notification Module**: Email, SMS, and push notifications
- **Integration Module**: Third-party service integrations

### Module Refactoring Opportunities
- Extract common utilities into shared modules
- Create base classes for common functionality
- Implement module-specific middleware
- Add module-level caching strategies

## Documentation

### API Documentation
- Each module has its own API documentation
- Endpoints are documented with examples
- Request/response schemas are clearly defined
- Error scenarios are documented

### Code Documentation
- Services have JSDoc comments for methods
- Controllers document endpoint purposes
- DTOs include validation rules
- Complex business logic is well-commented

This modular structure provides a solid foundation for a scalable and maintainable CRM backend system. 