# Updated NestJS Project Structure for CRM System with Prisma

```
/crm-backend
  /src
    /common
      /decorators  # Custom decorators (e.g., @Roles for RBAC)
      /dto         # Shared DTOs for API validation
      /filters     # Custom exception filters
      /guards      # Authentication and authorization guards
      /interceptors # Logging, response transformation
      /middleware  # Global middleware (e.g., request logging)
      /pipes       # Custom validation/transformation pipes (e.g., ClientIdValidationPipe)
      /utils       # Shared utilities (e.g., JWT, validation helpers)
    /modules
      /company
        /dto
        company.controller.ts
        company.module.ts
        company.service.ts
      /employee
        /dto
        employee.controller.ts
        employee.module.ts
        employee.service.ts
      /hr
        /dto
        hr.controller.ts
        hr.module.ts
        hr.service.ts
      /attendance
        /dto
        attendance.controller.ts
        attendance.module.ts
        attendance.service.ts
      /sales
        /leads
          /dto
            create-lead.dto.ts
            update-lead.dto.ts
          leads.controller.ts
          leads.service.ts
          leads.module.ts
        /units
          /dto
            create-unit.dto.ts
            update-unit.dto.ts
          units.controller.ts
          units.service.ts
          units.module.ts
        /commissions
          /dto
            create-commission.dto.ts
            update-commission.dto.ts
          commissions.controller.ts
          commissions.service.ts
          commissions.module.ts
        sales.module.ts
      /projects
        /dto
        projects.controller.ts
        projects.module.ts
        projects.service.ts
      /finance
        /dto
        finance.controller.ts
        finance.module.ts
        finance.service.ts
      /marketing
        /dto
        marketing.controller.ts
        marketing.module.ts
        marketing.service.ts
      /communication
        /dto
        communication.controller.ts
        communication.module.ts
        communication.service.ts
    /prisma
      schema.prisma      # Prisma schema defining all models
      prisma.service.ts  # Prisma client with middleware
    app.module.ts
    main.ts
  /test
    /company
    /employee
    /hr
    /attendance
    /sales
      /leads
      /units
      /commissions
    /projects
    /finance
    /marketing
    /communication
  /docs
  .env
  package.json
  tsconfig.json
  nest-cli.json
```

## Structure Changes
- **Removed `/entities` Folders**: Prisma defines models in `schema.prisma`, so per-module `/entities` folders are unnecessary.
- **Added `/prisma` Directory**: Contains `schema.prisma` (all models) and `prisma.service.ts` (Prisma client with middleware for `created_at`/`updated_at`).
- **Added `/common/pipes`**: For custom validation (e.g., `ClientIdValidationPipe`), as recommended.
- **Deferred `/config`**: Configuration remains in `app.module.ts` and `main.ts`, with `@nestjs/config` for `.env` loading.
- **No `base.entity.ts`**: Replaced by Prisma middleware in `prisma.service.ts`.