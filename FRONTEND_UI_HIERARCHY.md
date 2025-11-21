# CRM FRONTEND UI HIERARCHY - COMPLETE STRUCTURE

## 📋 OVERVIEW
This document provides a comprehensive UI hierarchy for the CRM frontend application, covering all backend API requirements. The structure is organized by:
1. **Generic Pages** (Accessible to all authenticated users)
2. **Department-Specific Pages** (HR, Sales, Marketing, Production, Finance)
3. **Role-Based Pages** (Department Manager, Unit Head, Team Lead, Senior, Junior)
4. **Admin Pages** (Admin-only access)

---

## 🌐 AUTHENTICATION & PUBLIC PAGES

### Login/Logout (No Authentication Required)
- **Login Page** (`/login`)
  - Email/Password form
  - API: `POST /auth/login`
  
- **Logout** (Button in header)
  - API: `POST /auth/logout`

---

## 📊 GENERIC PAGES (Available to ALL Authenticated Users)

These pages should be in the **main navigation bar** for every logged-in user:

### 1. Dashboard (`/dashboard`)
**For Whom:** All authenticated users
**Contains:**
- Welcome message with user name
- Quick stats overview based on department/role
- Recent notifications (unread count)
- Upcoming meetings (next 7 days)
- Quick action buttons
**APIs Used:**
- `GET /auth/profile` - Get user profile
- `GET /communication/notifications/unread/count` - Unread notifications
- `GET /communication/meetings/upcoming/7` - Upcoming meetings

### 2. My Profile (`/profile`)
**For Whom:** All authenticated users
**Contains:**
- Personal information display
- Edit profile form
- Change password option
- Department and role information
- Manager and team lead details
**APIs Used:**
- `GET /employee/my-profile` - Get my profile
- `PUT /admin/my-profile` - Update admin profile (if admin)

### 3. Notifications (`/notifications`)
**For Whom:** All authenticated users
**Contains:**
- List of all notifications (sent and received)
- Unread notifications highlight
- Mark as read functionality
- Create new notification
- Filter by status (read/unread)
**APIs Used:**
- `GET /communication/notifications/my/notifications` - My notifications
- `GET /communication/notifications/unread/count` - Unread count
- `POST /communication/notifications` - Create notification
- `PATCH /communication/notifications/:id/read` - Mark as read
- `GET /communication/notifications/status/:status` - Filter by status

### 4. Meetings (`/meetings`)
**For Whom:** All authenticated users
**Contains:**
- My meetings list
- Create meeting form
- Upcoming meetings calendar view
- Meeting details modal
- Edit/Delete meeting (only creator)
**APIs Used:**
- `GET /communication/meetings/my/meetings` - My meetings
- `GET /communication/meetings/upcoming` - Upcoming meetings
- `POST /communication/meetings` - Create meeting
- `PATCH /communication/meetings/:id` - Update meeting
- `DELETE /communication/meetings/:id` - Delete meeting
- `GET /communication/meetings/:id` - Get meeting details

### 5. Attendance (Self-Service) (`/attendance/self`)
**For Whom:** All authenticated users
**Contains:**
- Check-in button (with time)
- Check-out button (with time)
- My attendance logs
- Submit late reason
- Submit half-day reason
- Apply for leave
- View my leave balance
**APIs Used:**
- `POST /hr/attendance/checkin` - Check in
- `POST /hr/attendance/checkout` - Check out
- `PUT /hr/attendance/late-logs` - Submit late reason
- `PUT /hr/attendance/half-day-logs` - Submit half-day reason
- `POST /hr/attendance/leave-logs` - Create leave request

---

## 🏢 DEPARTMENT-SPECIFIC PAGES

### 🔹 HR DEPARTMENT PAGES (`/hr`)

**Available to:** HR Department employees only
**Main Navbar Section:** "HR Management"

#### 1. Employee Management (`/hr/employees`)
**For Whom:** HR Department (All roles)
**Required Permission:** `employee_add_permission` for create/delete
**Contains:**
- Employee list with filters (department, role, status)
- Employee search
- Create employee form
- View employee details
- Edit employee details
- Update bonus
- Update shift timings
- Delete employee
- Employee statistics dashboard
**APIs Used:**
- `GET /hr/employees` - Get all employees with filters
- `GET /hr/employees/stats` - Get employee statistics
- `GET /hr/employees/:id` - Get employee by ID
- `POST /hr/employees` - Create employee
- `PUT /hr/employees/:id` - Update employee
- `PATCH /hr/employees/:id/bonus` - Update bonus
- `PATCH /hr/employees/:id/shift` - Update shift
- `DELETE /hr/employees/:id` - Delete employee

#### 2. Attendance Management (`/hr/attendance`)
**For Whom:** HR Department with `attendance_permission`
**Contains:**
- Attendance logs list with filters
- Monthly attendance view
- Late logs management
- Half-day logs management
- Leave logs management
- Approve/Reject leave requests
- Bulk mark present
- Export attendance data (CSV/JSON)
- Attendance statistics
- Trigger automated processes (manual triggers)
**APIs Used:**
- `GET /hr/attendance/logs` - Get attendance logs
- `GET /hr/attendance/late-logs` - Get late logs
- `GET /hr/attendance/late-logs/stats` - Late logs stats
- `GET /hr/attendance/late-logs/export` - Export late logs
- `GET /hr/attendance/half-day-logs` - Get half-day logs
- `GET /hr/attendance/half-day-logs/stats` - Half-day logs stats
- `GET /hr/attendance/half-day-logs/export` - Export half-day logs
- `GET /hr/attendance/leave-logs` - Get leave logs
- `GET /hr/attendance/leave-logs/stats` - Leave logs stats
- `GET /hr/attendance/leave-logs/export` - Export leave logs
- `PUT /hr/attendance/late-logs/:id/action` - Process late action
- `PUT /hr/attendance/half-day-logs/:id/action` - Process half-day action
- `PUT /hr/attendance/leave-logs/:id/action` - Process leave action
- `POST /hr/attendance/bulk-mark-present` - Bulk mark present
- `GET /hr/attendance/month` - Monthly attendance
- `GET /hr/attendance/month/:emp_id` - Employee monthly attendance

#### 3. HR Logs (`/hr/logs`)
**For Whom:** HR Department Manager only (`dep_manager` role)
**Required Permission:** `employee_add_permission`
**Contains:**
- All HR activity logs
- Filter by action type, employee, date range
- Export logs (CSV/JSON)
- HR logs statistics dashboard
**APIs Used:**
- `GET /hr/logs` - Get HR logs
- `GET /hr/logs/stats` - Get HR logs statistics
- `GET /hr/logs/export` - Export HR logs

#### 4. Company Settings (`/hr/company`)
**For Whom:** HR Department Manager/Unit Head
**Contains:**
- Company information form
- Attendance settings (late time, half time, absent time)
- Deduction settings
- Leave policies
- Create/Edit/Delete company
**APIs Used:**
- `GET /company` - Get all companies
- `GET /company/:id` - Get company by ID
- `GET /company/settings/attendance` - Get attendance settings
- `POST /company` - Create company
- `PUT /company/:id` - Update company
- `DELETE /company/:id` - Delete company

#### 5. Departments Management (`/hr/departments`)
**For Whom:** HR Department & Admin
**Contains:**
- Departments list
- Create department form
- Edit department details
- Delete department
**APIs Used:**
- `GET /departments` - Get all departments
- `GET /departments/:id` - Get department by ID
- `POST /departments` - Create department
- `PUT /departments/:id` - Update department
- `DELETE /departments/:id` - Delete department

#### 6. Roles Management (`/hr/roles`)
**For Whom:** HR Department & Admin
**Contains:**
- Roles list
- Create role form
- Edit role details
- Delete role
**APIs Used:**
- `GET /roles` - Get all roles
- `GET /roles/:id` - Get role by ID
- `POST /roles` - Create role
- `PUT /roles/:id` - Update role
- `DELETE /roles/:id` - Delete role

#### 7. Terminations (`/hr/terminations`)
**For Whom:** HR Department with `salary_permission`
**Contains:**
- Terminate employee form
- Termination date picker
- Termination reason/description
- Final salary calculation preview
**APIs Used:**
- `POST /hr/terminate` - Terminate employee

#### 8. Access Logs (`/hr/access-logs`)
**For Whom:** HR Department (All authenticated users can view)
**Contains:**
- Employee login/logout history
- Filter by employee, success/failure
- Access logs statistics
- Export access logs (CSV/JSON)
**APIs Used:**
- `GET /auth/access-logs` - Get access logs
- `GET /auth/access-logs/stats` - Get access logs stats
- `GET /auth/access-logs/export` - Export access logs

---

### 🔹 SALES DEPARTMENT PAGES (`/sales`)

**Available to:** Sales Department employees only
**Main Navbar Section:** "Sales"

#### 1. Leads Management (`/sales/leads`)
**For Whom:** Sales Department (All roles)
**Contains:**
- Leads list with advanced filters
  - Status filter (New, Contacted, Qualified, etc.)
  - Sales unit filter
  - Employee filter
  - Date range filter
- Create lead form
- View lead details
- Update lead
- Request leads form
- Bulk update leads
- My leads view
- Lead statistics dashboard
**APIs Used:**
- `GET /leads` - Get all leads (filtered by role)
- `GET /leads/:id` - Get lead by ID
- `GET /leads/my-leads` - Get my leads
- `GET /leads/statistics/overview` - Lead statistics
- `GET /leads/filter-options/sales-units` - Sales units for filter
- `GET /leads/filter-options/employees` - Employees for filter
- `POST /leads` - Create lead
- `PUT /leads/:id` - Update lead
- `POST /leads/request` - Request leads
- `POST /leads/bulk-update` - Bulk update leads

#### 2. Cracked Leads (`/sales/cracked-leads`)
**For Whom:** Sales Department (All roles)
**Contains:**
- Cracked leads list with filters
- View cracked lead details
- Search by company, contact, status
- Export cracked leads
**APIs Used:**
- `GET /leads/cracked` - Get cracked leads
- `GET /leads/cracked/:id` - Get cracked lead by ID

#### 3. Archived Leads (`/sales/archived-leads`)
**For Whom:** Sales Department Managers/Unit Heads
**Contains:**
- Archived leads list with filters
- View archived lead details
- Reason for archiving
- Restore functionality (if needed)
**APIs Used:**
- `GET /leads/archived` - Get archived leads
- `GET /leads/archived/:id` - Get archived lead by ID

#### 4. Sales Units Management (`/sales/units`)
**For Whom:** Sales Department
- **Create/Update/Delete:** `dep_manager` only
- **View:** All Sales roles
**Contains:**
- Sales units list
- Create unit form
- Edit unit details
- Delete unit
- View unit employees
- View unit leads
- Available unit heads dropdown
- Archive leads from deleted units
**APIs Used:**
- `GET /sales/units/get` - Get all sales units
- `GET /sales/units/get/:id` - Get sales unit by ID
- `GET /sales/units/available-heads` - Get available unit heads
- `GET /sales/units/:id/employees` - Get employees in unit
- `GET /sales/units/:id/leads` - Get leads in unit
- `GET /sales/units/:id/archive-leads` - Get archive leads in unit
- `GET /sales/units/deleted/archive-leads` - Archive leads from deleted units
- `POST /sales/units/create` - Create sales unit
- `PATCH /sales/units/update/:id` - Update sales unit
- `DELETE /sales/units/delete/:id` - Delete sales unit

#### 5. Sales Teams Management (`/sales/teams`)
**For Whom:** Sales Department
- **Create/Delete:** `dep_manager` only
- **View/Manage:** Managers and Unit Heads
**Contains:**
- Teams list
- Create team form
- View team details
- Add employee to team
- Remove employee from team
- Replace team lead
- Assign team to unit
- Unassign team from unit
- Available teams list
- Employee's team view
**APIs Used:**
- `GET /sales/teams/all` - Get all teams
- `GET /sales/teams/available` - Get available teams
- `GET /sales/teams/unit/:id` - Get teams in unit
- `GET /sales/teams/:teamId` - Get team details
- `GET /sales/teams/employee/:employeeId` - Get employee's team
- `POST /sales/teams/create` - Create team
- `POST /sales/teams/:teamId/add-employee` - Add employee to team
- `POST /sales/teams/:teamId/unassign-employees` - Unassign employees
- `POST /sales/teams/assign` - Assign team to unit
- `PUT /sales/teams/:teamId/replace-lead` - Replace team lead
- `DELETE /sales/teams/:teamId/remove-employee/:employeeId` - Remove employee
- `DELETE /sales/teams/:teamId` - Delete team
- `DELETE /sales/teams/unassign/:teamId` - Unassign team from unit

#### 6. Sales Commissions (`/sales/commissions`)
**For Whom:** Sales Department (View: All, Manage: Managers)
**Contains:**
- My commissions view
- Commission history
- Commission by project
- Total commissions earned
**APIs Used:**
- `GET /sales/commissions/*` - Commission endpoints (to be used with salary display)

#### 7. Clients Management (`/sales/clients`)
**For Whom:** Sales Department (Not Production)
- **Create/Update/Delete:** `dep_manager`, `unit_head`
- **View:** All sales roles
**Contains:**
- Clients list with filters
- Search clients (companies/contacts)
- Create client form
- View client details
- Edit client details
- Delete client
- Client statistics dashboard
**APIs Used:**
- `GET /clients` - Get all clients
- `GET /clients/:id` - Get client by ID
- `GET /clients/stats` - Get client statistics
- `GET /clients/search/companies` - Search companies
- `GET /clients/search/contacts` - Search contacts
- `POST /clients` - Create client
- `PATCH /clients/:id` - Update client
- `DELETE /clients/:id` - Delete client

#### 8. Industries Management (`/sales/industries`)
**For Whom:** Sales, Marketing, Admin (View: All roles, Manage: Managers)
**Contains:**
- Industries list with filters
- Active industries dropdown (used in forms)
- Create industry form
- Edit industry
- Deactivate/Reactivate industry
- Delete industry (with dependency check)
- Industry statistics dashboard
**APIs Used:**
- `GET /industries` - Get all industries
- `GET /industries/active` - Get active industries
- `GET /industries/:id` - Get industry by ID
- `GET /industries/stats` - Get industry statistics
- `POST /industries` - Create industry
- `PUT /industries/:id` - Update industry
- `PATCH /industries/:id/deactivate` - Deactivate industry
- `PATCH /industries/:id/reactivate` - Reactivate industry
- `DELETE /industries/:id` - Delete industry

#### 9. Lead Payments (`/sales/leads/payments`)
**For Whom:** Sales Department (Managers and Unit Heads)
**Contains:**
- Payment records for leads
- Add payment to lead
- View payment history
- Payment amount and date
**APIs Used:**
- Payment endpoints within leads module

---

### 🔹 MARKETING DEPARTMENT PAGES (`/marketing`)

**Available to:** Marketing Department employees only
**Main Navbar Section:** "Marketing"

#### 1. Campaigns Management (`/marketing/campaigns`)
**For Whom:** Marketing Department only
**Contains:**
- Campaigns list with filters
- Create campaign form
- View campaign details
- Edit campaign
- Delete campaign
- Campaign statistics dashboard
**APIs Used:**
- `GET /campaigns` - Get all campaigns
- `GET /campaigns/:id` - Get campaign by ID
- `GET /campaigns/stats` - Get campaign statistics
- `POST /campaigns` - Create campaign
- `PATCH /campaigns/:id` - Update campaign
- `DELETE /campaigns/:id` - Delete campaign

#### 2. Industries Management (Shared)
**For Whom:** Marketing Department
**Contains:** Same as Sales Industries Management
**Note:** Marketing has full access to industries module

---

### 🔹 PRODUCTION DEPARTMENT PAGES (`/production`)

**Available to:** Production Department employees only
**Main Navbar Section:** "Production"

#### 1. Projects Management (`/production/projects`)
**For Whom:** Production Department
- **Create:** `dep_manager`, `unit_head`
- **View:** All production roles
- **Assign Unit Head:** `dep_manager` only
**Contains:**
- Projects list with filters (status, unit, timeline)
- Create project from payment
- View project details
- Update project details
- Assign unit head to project
- Project timeline view
**APIs Used:**
- `GET /projects` - Get all projects (filtered by role/unit)
- `GET /projects/:id` - Get project by ID
- `POST /projects/create-from-payment` - Create project from payment
- `PUT /projects/:id` - Update project
- `PUT /projects/:id/assign-unit-head` - Assign unit head

#### 2. Project Tasks (`/production/projects/:id/tasks`)
**For Whom:** Production Department (All roles)
**Contains:**
- Tasks list for project
- Create task form
- View task details
- Update task
- Update task status
- Assign task to employee
- Task timeline/Gantt chart
**APIs Used:**
- `GET /projects/:projectId/tasks` - Get project tasks
- `GET /projects/:projectId/tasks/:taskId` - Get task by ID
- `POST /projects/:projectId/tasks` - Create project task
- `PUT /projects/:projectId/tasks/:taskId` - Update task
- `PATCH /projects/:projectId/tasks/:taskId/status` - Update task status

#### 3. Project Logs (`/production/projects/:id/logs`)
**For Whom:** Production Department (All roles)
**Contains:**
- Project logs list
- Create log entry
- View log details
- Update log
- Delete log
- Logs statistics
- Filter by employee, date range
**APIs Used:**
- `GET /projects/:projectId/logs` - Get project logs
- `GET /projects/:projectId/logs/:logId` - Get log by ID
- `GET /projects/:projectId/logs/employees` - Get project employees
- `GET /projects/:projectId/logs/statistics` - Get log statistics
- `POST /projects/:projectId/logs` - Create project log
- `PUT /projects/:projectId/logs/:logId` - Update log
- `DELETE /projects/:projectId/logs/:logId` - Delete log

#### 4. Project Chat (`/production/projects/:id/chat`)
**For Whom:** Production Department (Project participants)
**Contains:**
- Real-time chat interface
- Chat messages list
- Send message
- View participants
- Add/Remove participants
**APIs Used:**
- Project chat endpoints (within projects module)

#### 5. Production Units Management (`/production/units`)
**For Whom:** Production Department
- **Create/Update/Delete:** `dep_manager` only
- **View:** `dep_manager`, `unit_head`
**Contains:**
- Production units list
- Create unit form
- Edit unit details
- Delete unit
- View unit employees
- View unit projects
- Available unit heads dropdown
- Completed projects from deleted units
**APIs Used:**
- `GET /production/units` - Get all production units
- `GET /production/units/get/:id` - Get production unit by ID
- `GET /production/units/:id/employees` - Get employees in unit
- `GET /production/units/:id/projects` - Get projects in unit
- `GET /production/units/deleted/completed-projects` - Completed projects from deleted units
- `GET /production/units/available-heads` - Get available heads
- `POST /production/units/create` - Create production unit
- `PATCH /production/units/update/:id` - Update production unit
- `DELETE /production/units/delete/:id` - Delete production unit

#### 6. Production Teams Management (`/production/teams`)
**For Whom:** Production Department (Managers)
**Contains:**
- Teams list
- Create team form
- Assign team to project
- View team members
**APIs Used:**
- Production team endpoints (within production module)

#### 7. Production Analytics (`/production/analytics`)
**For Whom:** Production Department (Managers and Unit Heads)
**Contains:**
- Projects completion rate
- Employee productivity metrics
- Timeline adherence
- Resource utilization
**APIs Used:**
- `GET /production/analytics/*` - Analytics endpoints

---

### 🔹 FINANCE/ACCOUNTS DEPARTMENT PAGES (`/finance`)

**Available to:** Accounts Department employees only
**Main Navbar Section:** "Finance"

#### 1. Salary Management (`/finance/salary`)
**For Whom:** Accounts Department with `salary_permission`
**Contains:**
- All employees salary display
- Salary breakdown by employee
- Calculate all salaries (trigger)
- Salary preview for current period
- Detailed salary breakdown (modal on click)
- Commission details
- Deduction details
- Export salary data
- Sales bonus management
**APIs Used:**
- `GET /finance/salary/display-all` - Get all salaries display
- `GET /finance/salary/display/:employeeId` - Get salary display for employee
- `GET /finance/salary/preview/:employeeId` - Calculate salary preview
- `GET /finance/salary/breakdown/:employeeId` - Get detailed salary breakdown
- `POST /finance/salary/calculate-all` - Calculate all salaries (manual trigger)
- `GET /finance/salary/bonus-display` - Get sales employees bonus display
- `PATCH /finance/salary/update-sales-bonus` - Update sales employee bonus

#### 2. Profit & Loss (P&L) Management (`/finance/pnl`)
**For Whom:** Accounts Department with `revenues_permission`
**Contains:**
- P&L calculation for specific month
- P&L with category breakdown
- Income vs Expenses chart
- Net profit/loss display
- Monthly P&L comparison
- Export P&L reports
- Trigger P&L calculation (manual)
**APIs Used:**
- `GET /accountant/pnl/calculate/:month/:year` - Calculate P&L preview
- `GET /accountant/pnl/categories/:month/:year` - P&L with categories
- `POST /accountant/pnl/auto` - Trigger P&L calculation

#### 3. Assets Management (`/finance/assets`)
**For Whom:** Accounts Department with `assets_permission`
**Contains:**
- Assets list with filters
- Create asset form
- View asset details
- Update asset
- Delete asset
- Asset depreciation tracking
- Asset categories
**APIs Used:**
- Assets endpoints within accountant module

#### 4. Liabilities Management (`/finance/liabilities`)
**For Whom:** Accounts Department with `liabilities_permission`
**Contains:**
- Liabilities list with filters
- Create liability form
- View liability details
- Update liability
- Delete liability
- Payment tracking
**APIs Used:**
- Liabilities endpoints within accountant module

#### 5. Revenue Management (`/finance/revenue`)
**For Whom:** Accounts Department with `revenues_permission`
**Contains:**
- Revenue records list
- Add revenue entry
- View revenue details
- Update revenue
- Delete revenue
- Revenue by category
- Monthly revenue chart
**APIs Used:**
- Revenue endpoints within accountant module

#### 6. Expenses Management (`/finance/expenses`)
**For Whom:** Accounts Department with `expenses_permission`
**Contains:**
- Expenses list with filters
- Create expense form
- View expense details
- Update expense
- Delete expense
- Expense categories
- Monthly expenses chart
**APIs Used:**
- Expense endpoints within accountant module

#### 7. Vendors Management (`/finance/vendors`)
**For Whom:** Accounts Department with `expenses_permission`
**Contains:**
- Vendors list
- Create vendor form
- View vendor details
- Vendor contact information
- Expenses by vendor
**APIs Used:**
- `GET /accountant/vendors/display` - Get all vendors
- `POST /accountant/vendor/create` - Add vendor

#### 8. Accountant Permissions (`/finance/permissions`)
**For Whom:** Accounts Department Managers & Admin
**Contains:**
- Accountant list with permissions
- Update accountant permissions form
- Permission checkboxes (liabilities, salary, sales, invoices, expenses, assets, revenues)
**APIs Used:**
- `PATCH /accountant/permissions` - Update permissions

---

## 👔 ROLE-BASED PAGES

### 🔸 DEPARTMENT MANAGER (`dep_manager`)

In addition to department-specific pages, Department Managers have access to:

#### 1. Department Dashboard (`/department/dashboard`)
**Contains:**
- Department-wide statistics
- Team performance metrics
- Employee overview
- Department budget (if applicable)
- Pending approvals

#### 2. Team Management (`/department/teams`)
**Contains:**
- All teams in department
- Create/Delete teams
- Assign/Unassign teams to units
- Team performance comparison

#### 3. Unit Management (`/department/units`)
**Contains:**
- All units in department
- Create/Update/Delete units
- Assign unit heads
- Unit performance metrics

#### 4. Employee Reports (`/department/reports/employees`)
**Contains:**
- Employee performance reports
- Attendance reports
- Salary reports
- Commission reports (for sales)

#### 5. Approvals Center (`/department/approvals`)
**Contains:**
- Leave requests pending approval
- Late/Half-day requests pending approval
- Other department-specific approvals

---

### 🔸 UNIT HEAD (`unit_head`)

In addition to department-specific pages, Unit Heads have access to:

#### 1. Unit Dashboard (`/unit/dashboard`)
**Contains:**
- Unit-specific statistics
- Team members overview
- Unit tasks/projects
- Performance metrics

#### 2. Unit Team Management (`/unit/team`)
**Contains:**
- View team members
- Team assignments
- Employee performance in unit

#### 3. Unit Reports (`/unit/reports`)
**Contains:**
- Unit performance reports
- Employee productivity
- Task completion rates (for production)
- Leads conversion rates (for sales)

---

### 🔸 TEAM LEAD (`team_lead`)

In addition to department-specific pages, Team Leads have access to:

#### 1. Team Dashboard (`/team/dashboard`)
**Contains:**
- Team statistics
- Team members list
- Team tasks/leads
- Performance metrics

#### 2. Team Members (`/team/members`)
**Contains:**
- View team members
- Member performance
- Assign tasks/leads

---

### 🔸 SENIOR & JUNIOR EMPLOYEES (`senior`, `junior`)

Access is primarily limited to:
- Generic pages (Dashboard, Profile, Notifications, Meetings, Self-Service Attendance)
- View-only access to department-specific pages (no create/update/delete)
- My Leads/My Tasks views
- My Commission view (for sales)

---

## 🛡️ ADMIN PAGES (`/admin`)

**Available to:** Admin users only
**Main Navbar Section:** "Admin"

### 1. Admin Dashboard (`/admin/dashboard`)
**Contains:**
- System-wide statistics
- All departments overview
- Total employees count
- System health metrics
- Recent activity across all modules

### 2. Admin Management (`/admin/admins`)
**For Whom:** Admin only
**Contains:**
- Admins list
- View admin details
- Update admin profile
- Admin roles and permissions
**APIs Used:**
- `GET /admin` - Get all admins
- `GET /admin/:id` - Get admin by ID
- `GET /admin/email/:email` - Get admin by email
- `PUT /admin/:id` - Update admin

### 3. All Employees View (`/admin/employees`)
**Contains:**
- Complete employee directory
- Filter by department, role, status
- Quick actions (edit, deactivate, etc.)

### 4. System Logs (`/admin/logs`)
**Contains:**
- Access logs from all departments
- HR logs
- System activity logs
- Export logs

### 5. Departments & Roles (`/admin/system`)
**Contains:**
- Manage all departments
- Manage all roles
- System configurations

### 6. Company Settings (`/admin/company`)
**Contains:**
- Company-wide settings
- Attendance policies
- Leave policies
- Salary configurations

### 7. Industries & Clients (`/admin/data`)
**Contains:**
- Industries management (full access)
- Clients overview (all departments)
- Data management tools

---

## 📱 NAVIGATION BAR STRUCTURE

### Main Navigation Bar (Top)

#### For ALL Users:
```
┌─────────────────────────────────────────────────────────────┐
│ [Logo]  Dashboard  Notifications  Meetings  Attendance      │
│                                          [User Menu ▼]       │
└─────────────────────────────────────────────────────────────┘
```

**User Menu Dropdown:**
- My Profile
- My Attendance
- Settings
- Logout

---

#### For HR Department Users:
```
┌─────────────────────────────────────────────────────────────┐
│ [Logo]  Dashboard  HR ▼  Notifications  Meetings  Attendance │
│                                          [User Menu ▼]       │
└─────────────────────────────────────────────────────────────┘
```

**HR Dropdown:**
- Employees
- Attendance Management
- Departments & Roles
- Company Settings
- HR Logs (Managers only)
- Terminations (With permission)
- Access Logs

---

#### For Sales Department Users:
```
┌─────────────────────────────────────────────────────────────┐
│ [Logo]  Dashboard  Sales ▼  Notifications  Meetings  Attendance │
│                                          [User Menu ▼]       │
└─────────────────────────────────────────────────────────────┘
```

**Sales Dropdown:**
- Leads
- Cracked Leads
- Archived Leads (Managers/Unit Heads)
- Clients
- Industries
- Units (View all / Manage based on role)
- Teams (View all / Manage based on role)
- Commissions

---

#### For Marketing Department Users:
```
┌─────────────────────────────────────────────────────────────┐
│ [Logo]  Dashboard  Marketing ▼  Notifications  Meetings  Attendance │
│                                          [User Menu ▼]       │
└─────────────────────────────────────────────────────────────┘
```

**Marketing Dropdown:**
- Campaigns
- Industries

---

#### For Production Department Users:
```
┌─────────────────────────────────────────────────────────────┐
│ [Logo]  Dashboard  Production ▼  Notifications  Meetings  Attendance │
│                                          [User Menu ▼]       │
└─────────────────────────────────────────────────────────────┘
```

**Production Dropdown:**
- Projects
- Units (Managers only)
- Teams (Managers only)
- Analytics (Managers/Unit Heads)

---

#### For Finance/Accounts Department Users:
```
┌─────────────────────────────────────────────────────────────┐
│ [Logo]  Dashboard  Finance ▼  Notifications  Meetings  Attendance │
│                                          [User Menu ▼]       │
└─────────────────────────────────────────────────────────────┘
```

**Finance Dropdown:**
- Salary Management
- P&L Management
- Assets
- Liabilities
- Revenue
- Expenses
- Vendors
- Permissions (Managers only)

---

#### For Admin Users:
```
┌─────────────────────────────────────────────────────────────┐
│ [Logo]  Dashboard  Admin ▼  System ▼  Notifications  Meetings  Attendance │
│                                          [User Menu ▼]       │
└─────────────────────────────────────────────────────────────┘
```

**Admin Dropdown:**
- Admins Management
- All Employees
- System Logs
- Industries & Clients

**System Dropdown:**
- Departments
- Roles
- Company Settings
- System Configuration

---

## 🎯 PAGE ACCESS MATRIX

| Page/Feature | Admin | HR Manager | HR Employee | Sales Manager | Sales Employee | Marketing | Production Manager | Production Employee | Accounts Manager | Accounts Employee |
|-------------|-------|------------|-------------|---------------|----------------|-----------|-------------------|---------------------|------------------|------------------|
| **GENERIC PAGES** |
| Dashboard | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| My Profile | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Notifications | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Meetings | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Self-Attendance | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| **HR PAGES** |
| Employee Management | ✓ | ✓ (Full) | ✓ (View) | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Attendance Management | ✓ | ✓ (With Perm) | ✓ (With Perm) | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| HR Logs | ✓ | ✓ (Manager) | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Company Settings | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Departments/Roles | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Terminations | ✓ | ✓ (With Perm) | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Access Logs | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| **SALES PAGES** |
| Leads Management | ✓ | ✗ | ✗ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Cracked Leads | ✓ | ✗ | ✗ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Archived Leads | ✓ | ✗ | ✗ | ✓ (Manager/UH) | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Sales Units | ✓ | ✗ | ✗ | ✓ | ✓ (View) | ✗ | ✗ | ✗ | ✗ | ✗ |
| Sales Teams | ✓ | ✗ | ✗ | ✓ | ✓ (View) | ✗ | ✗ | ✗ | ✗ | ✗ |
| Commissions | ✓ | ✗ | ✗ | ✓ | ✓ (My) | ✗ | ✗ | ✗ | ✗ | ✗ |
| Clients | ✓ | ✗ | ✗ | ✓ | ✓ (View) | ✗ | ✗ | ✗ | ✗ | ✗ |
| Industries | ✓ | ✗ | ✗ | ✓ | ✓ (View) | ✓ | ✗ | ✗ | ✗ | ✗ |
| **MARKETING PAGES** |
| Campaigns | ✓ | ✗ | ✗ | ✗ | ✗ | ✓ | ✗ | ✗ | ✗ | ✗ |
| **PRODUCTION PAGES** |
| Projects | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ | ✓ (View) | ✗ | ✗ |
| Project Tasks | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ | ✓ | ✗ | ✗ |
| Project Logs | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ | ✓ | ✗ | ✗ |
| Production Units | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ (Manager) | ✓ (View) | ✗ | ✗ |
| Analytics | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ (Manager/UH) | ✗ | ✗ | ✗ |
| **FINANCE PAGES** |
| Salary Management | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ (With Perm) | ✓ (With Perm) |
| P&L Management | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ (With Perm) | ✓ (With Perm) |
| Assets | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ (With Perm) | ✓ (With Perm) |
| Liabilities | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ (With Perm) | ✓ (With Perm) |
| Revenue | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ (With Perm) | ✓ (With Perm) |
| Expenses | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ (With Perm) | ✓ (With Perm) |
| Vendors | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ (With Perm) | ✓ (With Perm) |
| Permissions | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ (Manager) | ✗ |
| **ADMIN PAGES** |
| Admin Dashboard | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Admin Management | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| All Employees | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| System Logs | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |

**Legend:**
- ✓ = Full Access
- ✓ (With Perm) = Access with specific permission
- ✓ (Manager) = Only department managers
- ✓ (Manager/UH) = Managers and Unit Heads
- ✓ (View) = View-only access
- ✓ (My) = Only personal data
- ✗ = No Access

---

## 📋 SUMMARY OF API COVERAGE

### Total APIs: 150+ Endpoints
### UI Pages Required: 60+ Pages

**Module Coverage:**
1. ✅ Authentication (Login, Logout, Profile, Access Logs)
2. ✅ Admin (Admin Management, Profile)
3. ✅ HR (Employees, Attendance, Logs, Company, Departments, Roles)
4. ✅ Sales (Leads, Teams, Units, Commissions, Clients, Industries)
5. ✅ Marketing (Campaigns, Industries)
6. ✅ Production (Projects, Tasks, Logs, Units, Teams, Analytics)
7. ✅ Finance (Salary, P&L, Assets, Liabilities, Revenue, Expenses, Vendors)
8. ✅ Communication (Notifications, Meetings, Reminders, Complaints)
9. ✅ Projects (Main projects, Tasks, Logs, Chats)
10. ✅ Employee (Profile access)

---

## 🎨 UI/UX RECOMMENDATIONS

### 1. Dashboard Widgets
Each role should see relevant widgets on their dashboard:
- **HR:** Employee count, attendance summary, pending approvals
- **Sales:** Leads count, conversion rate, my leads, cracked leads
- **Marketing:** Active campaigns, campaign performance
- **Production:** Active projects, completion rate, my tasks
- **Finance:** Monthly P&L, pending salaries, expense summary

### 2. Quick Actions Bar
Floating action buttons for common tasks:
- Create Lead (Sales)
- Create Meeting (All)
- Mark Attendance (All)
- Create Notification (All)
- Create Project Task (Production)

### 3. Filters & Search
Every list page should have:
- Advanced filters sidebar
- Search bar
- Sort options
- Pagination
- Export buttons (CSV/JSON where applicable)

### 4. Real-time Updates
- Notification bell with count
- Real-time meeting reminders
- Project chat (WebSocket)
- Attendance check-in/out with live time

### 5. Responsive Design
- Mobile-first approach
- Tablet optimization
- Desktop full-feature set

### 6. Permission-based UI
- Hide buttons/sections user doesn't have access to
- Show disabled state with tooltip explaining why
- Graceful error messages

---

## 🔐 SECURITY CONSIDERATIONS

1. **JWT Token Storage:** Secure HTTP-only cookies or localStorage
2. **Role Verification:** Check role/permission on every protected route
3. **API Calls:** Include JWT token in Authorization header
4. **Logout:** Clear all auth data and redirect to login
5. **Session Timeout:** Auto-logout after inactivity
6. **Permission Checks:** Frontend should match backend permission structure

---

## 📊 RECOMMENDED TECH STACK

### Frontend
- **Framework:** React.js / Next.js / Vue.js
- **State Management:** Redux / Zustand / Context API
- **UI Library:** Material-UI / Ant Design / Tailwind CSS
- **Charts:** Chart.js / Recharts / ApexCharts
- **Date Pickers:** react-datepicker / Day.js
- **Form Handling:** React Hook Form / Formik
- **API Client:** Axios / React Query
- **Routing:** React Router / Next.js Router
- **Real-time:** Socket.io (for chat and notifications)

---

## 🚀 IMPLEMENTATION PRIORITY

### Phase 1 (Core - Week 1-2)
1. Authentication (Login/Logout)
2. Dashboard (Generic)
3. My Profile
4. Notifications
5. Meetings

### Phase 2 (HR - Week 3-4)
1. Employee Management
2. Attendance Management
3. Departments & Roles

### Phase 3 (Sales - Week 5-6)
1. Leads Management
2. Clients
3. Sales Units & Teams

### Phase 4 (Finance - Week 7-8)
1. Salary Management
2. P&L Management
3. Expenses & Revenue

### Phase 5 (Production - Week 9-10)
1. Projects Management
2. Project Tasks
3. Project Logs

### Phase 6 (Marketing & Admin - Week 11-12)
1. Campaigns
2. Admin Dashboard
3. System Logs

---

## 📝 CONCLUSION

This comprehensive UI hierarchy covers **ALL** backend APIs and provides a well-structured, role-based, department-specific frontend architecture. Each page is designed to:
- Cover specific API requirements
- Be accessible based on roles and permissions
- Provide a seamless user experience
- Maintain security and access control
- Scale with future features

**Total Pages:** 60+ pages
**Total API Endpoints Covered:** 150+ endpoints
**Departments Covered:** 6 (HR, Sales, Marketing, Production, Accounts, Admin)
**Roles Supported:** 5 (Department Manager, Unit Head, Team Lead, Senior, Junior)
**Permissions Handled:** 18 (HR: 9, Accountant: 7, Common: 1, Salary: 1)

---

**Document Version:** 1.0
**Last Updated:** October 7, 2025
**Status:** ✅ Complete and Ready for Implementation

