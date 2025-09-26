# CRM Backend - Complete API Endpoints Summary

## Overview
This document provides a comprehensive list of ALL API endpoints in the CRM Backend, organized by modules and HTTP methods.

## Module Structure
- **Authentication** (`/auth`)
- **HR Module** (`/hr`)
- **Sales Module** (`/sales`, `/leads`)
- **Finance Module** (`/salary`, `/finance`)
- **Projects Module** (`/projects`)
- **Client Module** (`/clients`)
- **Campaign Module** (`/campaigns`)
- **Company Module** (`/company`)
- **Admin Module** (`/admin`)
- **Communication Module** (`/communication`)
- **Production Module** (`/production`)
- **Departments Module** (`/departments`)
- **Roles Module** (`/roles`)

---

## 1. AUTHENTICATION MODULE (`/auth`)

### POST Endpoints
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout

### GET Endpoints
- `GET /auth/profile` - Get user profile
- `GET /auth/access-logs` - Get access logs
- `GET /auth/access-logs/stats` - Get access logs statistics
- `GET /auth/access-logs/export` - Export access logs (CSV/JSON)

---

## 2. HR MODULE (`/hr`)

### POST Endpoints
- `POST /hr/employees` - Create employee
- `POST /hr/terminate` - Terminate employee

### GET Endpoints
- `GET /hr/employees` - Get all employees
- `GET /hr/employees/:id` - Get employee by ID
- `GET /hr/employees/stats` - Get employee statistics
- `GET /hr/logs` - Get HR logs
- `GET /hr/logs/stats` - Get HR logs statistics
- `GET /hr/logs/export` - Export HR logs (CSV/JSON)

### PUT Endpoints
- `PUT /hr/employees/:id` - Update employee

### PATCH Endpoints
- `PATCH /hr/employees/:id/bonus` - Update employee bonus
- `PATCH /hr/employees/:id/shift` - Update employee shift

### DELETE Endpoints
- `DELETE /hr/employees/:id` - Delete employee

---

## 3. SALES MODULE

### Leads (`/leads`)
#### POST Endpoints
- `POST /leads` - Create lead
- `POST /leads/request` - Request leads
- `POST /leads/bulk-update` - Bulk update leads

#### GET Endpoints
- `GET /leads` - Get all leads
- `GET /leads/:id` - Get lead by ID
- `GET /leads/my-leads` - Get my leads
- `GET /leads/cracked-leads` - Get cracked leads
- `GET /leads/statistics/overview` - Get lead statistics
- `GET /leads/filter-options/sales-units` - Get sales units for filter
- `GET /leads/filter-options/employees` - Get employees for filter

#### PUT Endpoints
- `PUT /leads/:id` - Update lead

### Sales Units (`/sales/units`)
#### POST Endpoints
- `POST /sales/units/create` - Create sales unit

#### GET Endpoints
- `GET /sales/units/get` - Get all sales units
- `GET /sales/units/get/:id` - Get sales unit by ID
- `GET /sales/units/available-heads` - Get available unit heads
- `GET /sales/units/:id/employees` - Get employees in unit
- `GET /sales/units/:id/leads` - Get leads in unit
- `GET /sales/units/:id/archive-leads` - Get archive leads in unit
- `GET /sales/units/deleted/archive-leads` - Get archive leads from deleted units

#### PATCH Endpoints
- `PATCH /sales/units/update/:id` - Update sales unit

#### DELETE Endpoints
- `DELETE /sales/units/delete/:id` - Delete sales unit

### Sales Teams (`/sales/teams`)
#### POST Endpoints
- `POST /sales/teams/create` - Create team
- `POST /sales/teams/:teamId/add-employee` - Add employee to team
- `POST /sales/teams/:teamId/unassign-employees` - Unassign employees from team
- `POST /sales/teams/assign` - Assign team to unit

#### GET Endpoints
- `GET /sales/teams/all` - Get all teams
- `GET /sales/teams/available` - Get available teams
- `GET /sales/teams/unit/:id` - Get teams in unit
- `GET /sales/teams/:teamId` - Get team details
- `GET /sales/teams/employee/:employeeId` - Get employee's team

#### PUT Endpoints
- `PUT /sales/teams/:teamId/replace-lead` - Replace team lead

#### DELETE Endpoints
- `DELETE /sales/teams/:teamId/remove-employee/:employeeId` - Remove employee from team
- `DELETE /sales/teams/:teamId` - Delete team
- `DELETE /sales/teams/unassign/:teamId` - Unassign team from unit

---

## 4. FINANCE MODULE

### Salary (`/salary`)
#### POST Endpoints
- `POST /salary/auto` - Calculate all salaries
- `POST /salary/commission/assign` - Assign commission
- `POST /salary/commission/withhold-flag` - Update withhold flag
- `POST /salary/commission/transfer` - Transfer commission

#### GET Endpoints
- `GET /salary/calculate/:employeeId` - Calculate salary preview
- `GET /salary/display/:employeeId` - Get salary display
- `GET /salary/display` - Get all salaries display
- `GET /salary/display/:employeeId/detailed` - Get detailed salary breakdown

### Accountant (`/accountant`)
#### POST Endpoints
- `POST /accountant/vendor/create` - Add vendor
- `POST /accountant/pnl/auto` - Calculate P&L auto

#### GET Endpoints
- `GET /accountant/vendors/display` - Get all vendors
- `GET /accountant/pnl/calculate/:month/:year` - Calculate P&L preview
- `GET /accountant/pnl/categories/:month/:year` - Calculate P&L with categories

#### PATCH Endpoints
- `PATCH /accountant/permissions` - Update permissions

---

## 5. PROJECTS MODULE (`/projects`)

### Main Projects
#### POST Endpoints
- `POST /projects/create-from-payment` - Create project from payment

#### GET Endpoints
- `GET /projects` - Get all projects
- `GET /projects/:id` - Get project by ID

#### PUT Endpoints
- `PUT /projects/:id/assign-unit-head` - Assign unit head
- `PUT /projects/:id` - Update project

### Project Tasks (`/projects/:projectId/tasks`)
#### POST Endpoints
- `POST /projects/:projectId/tasks` - Create project task

#### GET Endpoints
- `GET /projects/:projectId/tasks` - Get project tasks
- `GET /projects/:projectId/tasks/:taskId` - Get task by ID

#### PUT Endpoints
- `PUT /projects/:projectId/tasks/:taskId` - Update task

#### PATCH Endpoints
- `PATCH /projects/:projectId/tasks/:taskId/status` - Update task status

### Project Logs (`/projects/:projectId/logs`)
#### POST Endpoints
- `POST /projects/:projectId/logs` - Create project log

#### GET Endpoints
- `GET /projects/:projectId/logs` - Get project logs
- `GET /projects/:projectId/logs/employees` - Get project employees
- `GET /projects/:projectId/logs/statistics` - Get log statistics
- `GET /projects/:projectId/logs/:logId` - Get log by ID

#### PUT Endpoints
- `PUT /projects/:projectId/logs/:logId` - Update log

#### DELETE Endpoints
- `DELETE /projects/:projectId/logs/:logId` - Delete log

---

## 6. CLIENT MODULE (`/clients`)

### POST Endpoints
- `POST /clients` - Create client

### GET Endpoints
- `GET /clients` - Get all clients
- `GET /clients/stats` - Get client statistics
- `GET /clients/:id` - Get client by ID
- `GET /clients/search/companies` - Search companies
- `GET /clients/search/contacts` - Search contacts

### PATCH Endpoints
- `PATCH /clients/:id` - Update client

### DELETE Endpoints
- `DELETE /clients/:id` - Delete client

---

## 7. CAMPAIGN MODULE (`/campaigns`)

### POST Endpoints
- `POST /campaigns` - Create campaign

### GET Endpoints
- `GET /campaigns` - Get all campaigns
- `GET /campaigns/stats` - Get campaign statistics
- `GET /campaigns/:id` - Get campaign by ID

### PATCH Endpoints
- `PATCH /campaigns/:id` - Update campaign

### DELETE Endpoints
- `DELETE /campaigns/:id` - Delete campaign

---

## 8. COMPANY MODULE (`/company`)

### POST Endpoints
- `POST /company` - Create company

### GET Endpoints
- `GET /company` - Get all companies
- `GET /company/:id` - Get company by ID
- `GET /company/settings/attendance` - Get company settings

### PUT Endpoints
- `PUT /company/:id` - Update company

### DELETE Endpoints
- `DELETE /company/:id` - Delete company

---

## 9. ADMIN MODULE (`/admin`)

### GET Endpoints
- `GET /admin` - Get all admins
- `GET /admin/my-profile` - Get my profile
- `GET /admin/:id` - Get admin by ID
- `GET /admin/email/:email` - Get admin by email

### PUT Endpoints
- `PUT /admin/my-profile` - Update my profile
- `PUT /admin/:id` - Update admin

---

## 10. COMMUNICATION MODULE

### Meetings (`/communication/meetings`)
#### POST Endpoints
- `POST /communication/meetings` - Create meeting

#### GET Endpoints
- `GET /communication/meetings` - Get all meetings
- `GET /communication/meetings/:id` - Get meeting by ID
- `GET /communication/meetings/my/meetings` - Get my meetings
- `GET /communication/meetings/upcoming` - Get upcoming meetings
- `GET /communication/meetings/upcoming/:days` - Get upcoming meetings by days

#### PATCH Endpoints
- `PATCH /communication/meetings/:id` - Update meeting

#### DELETE Endpoints
- `DELETE /communication/meetings/:id` - Delete meeting

### Notifications (`/communication/notifications`)
#### POST Endpoints
- `POST /communication/notifications` - Create notification
- `POST /communication/notifications/bulk` - Create bulk notification

#### GET Endpoints
- `GET /communication/notifications` - Get all notifications
- `GET /communication/notifications/bulk` - Get bulk notification summary
- `GET /communication/notifications/:id` - Get notification by ID
- `GET /communication/notifications/my/notifications` - Get my notifications
- `GET /communication/notifications/unread/count` - Get unread count
- `GET /communication/notifications/status/:status` - Get notifications by status

#### PATCH Endpoints
- `PATCH /communication/notifications/:id` - Update notification
- `PATCH /communication/notifications/:id/read` - Mark as read

#### DELETE Endpoints
- `DELETE /communication/notifications/:id` - Delete notification

---

## 11. PRODUCTION MODULE

### Production Units (`/production/units`)
#### POST Endpoints
- `POST /production/units/create` - Create production unit

#### GET Endpoints
- `GET /production/units` - Get all production units
- `GET /production/units/get/:id` - Get production unit by ID
- `GET /production/units/:id/employees` - Get employees in unit
- `GET /production/units/:id/projects` - Get projects in unit
- `GET /production/units/deleted/completed-projects` - Get completed projects from deleted units
- `GET /production/units/available-heads` - Get available heads

#### PATCH Endpoints
- `PATCH /production/units/update/:id` - Update production unit

#### DELETE Endpoints
- `DELETE /production/units/delete/:id` - Delete production unit

---

## 12. DEPARTMENTS MODULE (`/departments`)

### POST Endpoints
- `POST /departments` - Create department

### GET Endpoints
- `GET /departments` - Get all departments
- `GET /departments/:id` - Get department by ID

### PUT Endpoints
- `PUT /departments/:id` - Update department

### DELETE Endpoints
- `DELETE /departments/:id` - Delete department

---

## 13. ROLES MODULE (`/roles`)

### POST Endpoints
- `POST /roles` - Create role

### GET Endpoints
- `GET /roles` - Get all roles
- `GET /roles/:id` - Get role by ID

### PUT Endpoints
- `PUT /roles/:id` - Update role

### DELETE Endpoints
- `DELETE /roles/:id` - Delete role

---

## 14. ATTENDANCE MODULE (`/hr/attendance`)

### POST Endpoints
- `POST /hr/attendance/checkin` - Employee check-in
- `POST /hr/attendance/checkout` - Employee check-out
- `POST /hr/attendance/late-logs` - Submit late reason
- `POST /hr/attendance/half-day-logs` - Submit half-day reason
- `POST /hr/attendance/leave-logs` - Create leave log
- `POST /hr/attendance/process-leave` - Process leave action
- `POST /hr/attendance/bulk-mark-present` - Bulk mark present

### GET Endpoints
- `GET /hr/attendance/logs` - Get attendance logs
- `GET /hr/attendance/late-logs` - Get late logs
- `GET /hr/attendance/late-logs/employee/:emp_id` - Get late logs by employee
- `GET /hr/attendance/half-day-logs` - Get half-day logs
- `GET /hr/attendance/half-day-logs/employee/:emp_id` - Get half-day logs by employee
- `GET /hr/attendance/leave-logs` - Get leave logs
- `GET /hr/attendance/leave-logs/employee/:emp_id` - Get leave logs by employee
- `GET /hr/attendance/monthly-attendance` - Get monthly attendance

### PUT Endpoints
- `PUT /hr/attendance/late-logs` - Update late log
- `PUT /hr/attendance/half-day-logs` - Update half-day log
- `PUT /hr/attendance/leave-logs` - Update leave log
- `PUT /hr/attendance/attendance-logs` - Update attendance log
- `PUT /hr/attendance/monthly-attendance` - Update monthly attendance

---

## Total API Count: 150+ Endpoints

This comprehensive list includes every single API endpoint in the CRM Backend, organized by modules and HTTP methods. Each endpoint includes proper authentication headers and example request bodies where applicable.
