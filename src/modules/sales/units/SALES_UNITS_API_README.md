## Sales Units API — Developer Guide (Frontend + Backend)

### Overview
- Manages Sales Units, their Teams, Employees, and Leads with advanced filtering, pagination, and role-based access.
- Auth: Bearer JWT
- Department scope: Sales
- Strict rule: No query parameters on POST/PATCH/DELETE.

### Roles and Access
- dep_manager: Full access; can create/update/delete units; assign/remove teams.
- unit_head: Access to own unit; can view details; can assign/remove teams; can update own unit.
- team_lead: Access to units where they lead teams; sees their teams; read-only on unit structure.
- senior/junior: Access to units where they are members; sees own record and relevant leads; read-only.

### Response Envelope
- Success list shape:
```json
{
  "success": true,
  "data": [],
  "total": 0,
  "pagination": { "page": 1, "limit": 10, "totalPages": 0 },
  "message": "..."
}
```
- Success object shape:
```json
{ "success": true, "data": {}, "message": "..." }
```
- Standard errors:
```json
{ "statusCode": 400, "message": "Validation failed", "error": "Bad Request" }
{ "statusCode": 401, "message": "Unauthorized", "error": "Unauthorized" }
{ "statusCode": 403, "message": "Insufficient permissions", "error": "Forbidden" }
{ "statusCode": 404, "message": "Resource not found", "error": "Not Found" }
{ "statusCode": 409, "message": "Conflict occurred", "error": "Conflict" }
{ "statusCode": 500, "message": "Internal server error", "error": "Internal Server Error" }
```

## Endpoints

### Create Sales Unit
- Method/Path: POST `/sales/units`
- Roles: dep_manager
- Body:
```json
{
  "name": "North Region",
  "email": "north@sales.example",
  "phone": "+1-555-0100",
  "address": "123 Ave, City",
  "headId": 101,
  "logoUrl": null,
  "website": null
}
```
- Notes:
  - `headId` optional; if provided, must be an existing `employee` with role `unit_head` and not already heading another unit.
  - Unique constraints: `name`, `email`, `phone`.
  - No query params allowed.
- Response:
```json
{ "success": true, "message": "New Unit Created Successfully" }
```

### List Sales Units (Advanced)
- Method/Path: GET `/sales/units`
- Roles: dep_manager, unit_head, team_lead, senior, junior
- Query params:
  - Filtering: `unitId`, `hasHead`, `hasTeams`, `hasLeads`, `hasEmployees`
  - Head filters: `headEmail`, `headName`
  - Unit filter: `unitName`
  - Include: `include=employees,teams,head,leads`
  - Sorting: `sortBy` in [name,email,createdAt,updatedAt,headId], `sortOrder` in [asc,desc]
  - Pagination: `page` (>=1), `limit` (1..100)
  - Search: `search` (matches name/email/phone, case-insensitive)
- Item shape (selected fields):
```json
{
  "id": 1,
  "name": "North Region",
  "email": "north@sales.example",
  "phone": "+1-555-0100",
  "address": "123 Ave, City",
  "headId": 101,
  "logoUrl": null,
  "website": null,
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z",
  "head": { "id": 101, "firstName": "John", "lastName": "Doe" },
  "teamsCount": 2,
  "employeesCount": 8,
  "leadsCount": 25,
  "crackedLeadsCount": 5,
  "archiveLeadsCount": 4,
  "conversionRate": 20.0,

  "teams": [],            // if include=teams
  "salesEmployees": [],   // if include=employees
  "leads": []             // if include=leads
}
```
- Conversion rate (list): `crackedLeadsCount / (leadsCount + archiveLeadsCount)`, rounded to 2 decimals.

Example:
```bash
GET /sales/units?hasHead=true&include=employees,teams&search=sales&page=1&limit=10&sortBy=name&sortOrder=asc
```

### Get Sales Unit Details
- Method/Path: GET `/sales/units/:id`
- Roles: dep_manager, unit_head, team_lead, senior, junior
- Role-based visibility:
  - dep_manager: full data for any unit.
  - unit_head: full data for own unit.
  - team_lead: only teams they lead; employees/leads relevant to those teams.
  - senior/junior: all teams in the unit; only their employee record; only their related leads.
  - If user does not belong to the unit and is not dep_manager: 403.
- Response shape (selected):
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Sales Unit A",
    "email": "unit@example.com",
    "phone": "+1 (555) 123-4567",
    "address": "123 Business St",
    "headId": 123,
    "logoUrl": "https://example.com/logo.png",
    "website": "https://example.com",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z",

    "head": {
      "id": 123, "firstName": "John", "lastName": "Doe",
      "email": "john@example.com", "phone": "+1 (555) 987-6543",
      "role": { "id": 5, "name": "unit_head" }
    },

    "teams": [
      {
        "id": 1, "name": "Team Alpha",
        "teamLead": { "id": 124, "firstName": "Jane", "lastName": "Smith", "email": "jane@example.com", "role": { "id": 3, "name": "team_lead" } }
      }
    ],

    "leads": [
      { "id": 1, "name": "Active Lead", "email": "active@example.com", "phone": "+1 (555) 111-2222",
        "assignedTo": { "id": 125, "firstName": "Bob", "lastName": "Johnson" } }
    ],
    "completedLeads": [
      { "id": 2, "crackedAt": "2024-01-20T14:30:00Z",
        "lead": { "id": 2, "name": "Cracked Lead", "email": "cracked@example.com", "phone": "+1 (555) 333-4444" },
        "employee": { "id": 125, "firstName": "Bob", "lastName": "Johnson" } }
    ],

    "summary": {
      "teamsCount": 3,
      "leadsCount": { "leads": 15, "completedLeads": 5, "total": 20 },
      "conversionRate": 25.0
    }
  },
  "message": "Unit details retrieved successfully"
}
```
- Conversion rate (detail): computed from visible leads (active + completed) after role-based filtering; rounded to 2 decimals.

### Update Sales Unit
- Method/Path: PATCH `/sales/units/:id`
- Roles: dep_manager, unit_head (own unit)
- Body (partial allowed):
```json
{ "name": "North Region Plus", "email": "north.plus@example", "headId": 102, "logoUrl": "https://...", "website": "https://..." }
```
- Constraints:
  - Same head validation as create; if `headId` provided, must be `unit_head` and not head of another unit.
  - Uniqueness checks exclude the current unit.
  - No query params allowed.
- Response:
```json
{ "success": true, "message": "Unit updated successfully", "data": { "id": 1, "name": "North Region Plus", "head": { "id": 102, "firstName": "...", "lastName": "..." } } }
```

### Delete Sales Unit
- Method/Path: DELETE `/sales/units/:id`
- Roles: dep_manager
- Behavior:
  - If dependencies exist (teams, leads, employees), deletion is blocked and returns counts + details for reassignment.
  - Archive leads count is reported; when deletion proceeds, those archive leads get `unitId = null`.
  - No query params allowed.
- Responses:
  - Deleted:
```json
{ "success": true, "message": "Unit deleted successfully. 3 archived leads have been assigned unit ID null." }
```
  - Blocked:
```json
{
  "success": false,
  "message": "Cannot delete unit. Please reassign dependencies first.",
  "dependencies": {
    "teams": { "count": 2, "details": [ { "id": 1, "name": "Alpha" } ] },
    "leads": { "count": 4, "details": [ { "id": 10, "name": "Prospect X", "email": "x@x.com" } ] },
    "employees": { "count": 5, "details": [ { "id": 301, "firstName": "Bob", "lastName": "Johnson" } ] }
  },
  "archiveLeads": { "count": 3, "message": "3 archived leads will be assigned unit ID null" }
}
```

### Get Available Heads
- Method/Path: GET `/sales/units/available-heads`
- Roles: dep_manager
- Query: `assigned=true|false` (optional). If omitted, returns all active Sales `unit_head`s.
- Response:
```json
{
  "success": true,
  "message": "Unit heads retrieved successfully",
  "data": {
    "heads": [
      { "id": 101, "firstName": "John", "lastName": "Doe", "email": "john@example.com", "currentUnit": { "id": 1, "name": "North Region" } },
      { "id": 102, "firstName": "Sarah", "lastName": "Lee", "email": "sarah@example.com", "currentUnit": null }
    ]
  }
}
```

### Get Available Teams
- Method/Path: GET `/sales/units/available-teams`
- Roles: dep_manager
- Query: `assigned=true|false` (optional). `assigned=false` returns orphan teams (not assigned in sales/production/marketing).
- Response:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Team Alpha",
      "employeeCount": 5,
      "teamLead": { "id": 124, "firstName": "Jane", "lastName": "Smith", "email": "jane@example.com", "role": { "id": 3, "name": "team_lead" } },
      "isAssigned": false,
      "currentUnit": null
    }
  ],
  "total": 1,
  "message": "Available teams retrieved successfully"
}
```

### Assign Team to Unit
- Method/Path: POST `/sales/units/:id/teams`
- Roles: dep_manager, unit_head
- Body:
```json
{ "teamId": 5 }
```
- Validation: Team must exist and be orphan (not assigned to any unit across domains).
- Response:
```json
{ "success": true, "message": "Team \"Team Alpha\" successfully assigned to unit \"Sales Unit A\"" }
```

### Remove Team from Unit
- Method/Path: DELETE `/sales/units/:id/teams/:teamId`
- Roles: dep_manager, unit_head
- Validation: Team must belong to the specified unit.
- Response:
```json
{ "success": true, "message": "Team \"Team Alpha\" successfully removed from unit \"Sales Unit A\"" }
```

### Completed Leads from Deleted Units
- Method/Path: GET `/sales/units/deleted/completed-leads`
- Roles: dep_manager
- Returns cracked (completed) leads whose original unit has been deleted (`lead.salesUnitId = null`).
- Response:
```json
{
  "success": true,
  "data": [
    {
      "id": 2001,
      "crackedAt": "2024-01-20T14:30:00.000Z",
      "lead": { "id": 1002, "name": "Prospect B", "email": "b@example.com", "phone": "+1-555-4100", "createdAt": "2024-01-10T09:00:00.000Z" },
      "closedBy": { "id": 301, "firstName": "Bob", "lastName": "Johnson" }
    }
  ],
  "total": 1,
  "message": "Completed leads from deleted units retrieved successfully"
}
```

## Include Semantics (List endpoint)
- `employees`: returns `salesEmployees` with nested `employee` and `role`.
- `teams`: returns `teams` with nested `teamLead`.
- `leads`: returns `leads` with `assignedTo` and `crackedBy`.
- `head`: the list includes a minimal `head` (id, firstName, lastName); the detail endpoint returns full head with contact + role.

## Sorting, Pagination, Search
- Sorting fields: `name`, `email`, `createdAt`, `updatedAt`, `headId` (default: `name asc`).
- Pagination: `page` (default 1), `limit` (default 10, max 100). Response includes `totalPages`.
- Search: `search` matches name/email/phone case-insensitively.

## Example Requests (cURL)

```bash
curl -H "Authorization: Bearer <JWT>" \
  "/sales/units?hasHead=true&include=employees,teams&search=sales&page=1&limit=10&sortBy=name&sortOrder=asc"

curl -H "Authorization: Bearer <JWT>" "/sales/units/1"

curl -X POST -H "Authorization: Bearer <JWT>" -H "Content-Type: application/json" \
  -d '{ "name":"North", "email":"north@sales.example", "phone":"+1-555-0100", "address":"123 Ave", "headId":101 }' \
  "/sales/units"

curl -X PATCH -H "Authorization: Bearer <JWT>" -H "Content-Type: application/json" \
  -d '{ "name":"North Region Plus", "headId":102 }' \
  "/sales/units/1"

curl -X DELETE -H "Authorization: Bearer <JWT>" "/sales/units/1"

curl -H "Authorization: Bearer <JWT>" "/sales/units/available-heads?assigned=false"

curl -H "Authorization: Bearer <JWT>" "/sales/units/available-teams?assigned=false"

curl -X POST -H "Authorization: Bearer <JWT>" -H "Content-Type: application/json" \
  -d '{ "teamId": 7 }' \
  "/sales/units/1/teams"

curl -X DELETE -H "Authorization: Bearer <JWT>" "/sales/units/1/teams/7"

curl -H "Authorization: Bearer <JWT>" "/sales/units/deleted/completed-leads"
```

## Frontend Notes
- Respect role-based visibility; fields may be omitted based on role.
- Use `pagination.totalPages` to build pagers; prefer server pagination.
- Use `include` to fetch only the necessary related data.
- Handle 403 by routing to an appropriate "no access" state when a user doesn’t belong to a unit.

## Backend Notes
- Guards: `JwtAuthGuard`, `RolesWithServiceGuard`, `DepartmentsGuard` on controller.
- DTOs: `SalesUnitsQueryDto`, `AddTeamDto` handle validation and Swagger metadata.
- Enforce no-query on POST/PATCH/DELETE (controller already throws 400 if present).
- Counts and conversion rates are computed server-side; do not rely on client computation.
- Deletion returns dependency details to orchestrate reassignment flows safely.


