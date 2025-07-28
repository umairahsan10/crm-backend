/*
  Warnings:

  - The primary key for the `access_logs` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `access_logs` table. All the data in the column will be lost.
  - The primary key for the `accountants` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `accountants` table. All the data in the column will be lost.
  - The primary key for the `accounts` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `accounts` table. All the data in the column will be lost.
  - The primary key for the `admin_requests` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `admin_requests` table. All the data in the column will be lost.
  - The primary key for the `admins` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `admins` table. All the data in the column will be lost.
  - The primary key for the `assets` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `assets` table. All the data in the column will be lost.
  - The primary key for the `attendance` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `attendance` table. All the data in the column will be lost.
  - The primary key for the `attendance_logs` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `attendance_logs` table. All the data in the column will be lost.
  - The primary key for the `chargebacks` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `chargebacks` table. All the data in the column will be lost.
  - The primary key for the `chat_messages` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `chat_messages` table. All the data in the column will be lost.
  - The primary key for the `chat_participants` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `chat_participants` table. All the data in the column will be lost.
  - The primary key for the `clients` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `clients` table. All the data in the column will be lost.
  - The primary key for the `companies` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `companies` table. All the data in the column will be lost.
  - The primary key for the `cracked_leads` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `cracked_leads` table. All the data in the column will be lost.
  - The primary key for the `departments` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `departments` table. All the data in the column will be lost.
  - The primary key for the `employees` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `employees` table. All the data in the column will be lost.
  - The primary key for the `expenses` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `expenses` table. All the data in the column will be lost.
  - The primary key for the `hr` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `hr` table. All the data in the column will be lost.
  - The primary key for the `hr_logs` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `hr_logs` table. All the data in the column will be lost.
  - The primary key for the `industries` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `industries` table. All the data in the column will be lost.
  - The primary key for the `invoices` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `invoices` table. All the data in the column will be lost.
  - The primary key for the `lead_comments` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `lead_comments` table. All the data in the column will be lost.
  - The primary key for the `lead_outcome_history` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `lead_outcome_history` table. All the data in the column will be lost.
  - The primary key for the `leads` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `leads` table. All the data in the column will be lost.
  - The primary key for the `leave_logs` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `leave_id` on the `leave_logs` table. All the data in the column will be lost.
  - The primary key for the `liabilities` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `liabilities` table. All the data in the column will be lost.
  - The primary key for the `marketing` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `marketing` table. All the data in the column will be lost.
  - The primary key for the `marketing_units` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `marketing_units` table. All the data in the column will be lost.
  - The primary key for the `meetings` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `meetings` table. All the data in the column will be lost.
  - The primary key for the `net_salary_logs` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `net_salary_logs` table. All the data in the column will be lost.
  - The primary key for the `notifications` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `notifications` table. All the data in the column will be lost.
  - The primary key for the `production` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `production` table. All the data in the column will be lost.
  - The primary key for the `production_units` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `production_units` table. All the data in the column will be lost.
  - The primary key for the `profit_loss` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `profit_loss` table. All the data in the column will be lost.
  - The primary key for the `project_chats` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `project_chats` table. All the data in the column will be lost.
  - The primary key for the `project_logs` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `project_logs` table. All the data in the column will be lost.
  - The primary key for the `projects` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `projects` table. All the data in the column will be lost.
  - The primary key for the `refunds` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `refunds` table. All the data in the column will be lost.
  - The primary key for the `revenues` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `revenues` table. All the data in the column will be lost.
  - The primary key for the `roles` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `roles` table. All the data in the column will be lost.
  - The primary key for the `sales_departments` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `sales_departments` table. All the data in the column will be lost.
  - The primary key for the `sales_units` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `sales_units` table. All the data in the column will be lost.
  - The primary key for the `teams` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `teams` table. All the data in the column will be lost.
  - The primary key for the `vendors` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `vendors` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "access_logs" DROP CONSTRAINT "access_logs_employee_id_fkey";

-- DropForeignKey
ALTER TABLE "accountants" DROP CONSTRAINT "accountants_employee_id_fkey";

-- DropForeignKey
ALTER TABLE "accounts" DROP CONSTRAINT "accounts_employee_id_fkey";

-- DropForeignKey
ALTER TABLE "admin_requests" DROP CONSTRAINT "admin_requests_hr_log_id_fkey";

-- DropForeignKey
ALTER TABLE "archive_leads" DROP CONSTRAINT "archive_leads_assigned_to_fkey";

-- DropForeignKey
ALTER TABLE "archive_leads" DROP CONSTRAINT "archive_leads_lead_id_fkey";

-- DropForeignKey
ALTER TABLE "archive_leads" DROP CONSTRAINT "archive_leads_unit_id_fkey";

-- DropForeignKey
ALTER TABLE "assets" DROP CONSTRAINT "assets_created_by_fkey";

-- DropForeignKey
ALTER TABLE "attendance" DROP CONSTRAINT "attendance_employee_id_fkey";

-- DropForeignKey
ALTER TABLE "attendance_logs" DROP CONSTRAINT "attendance_logs_employee_id_fkey";

-- DropForeignKey
ALTER TABLE "campaign_logs" DROP CONSTRAINT "campaign_logs_productionUnitId_fkey";

-- DropForeignKey
ALTER TABLE "campaign_logs" DROP CONSTRAINT "campaign_logs_unit_id_fkey";

-- DropForeignKey
ALTER TABLE "chargebacks" DROP CONSTRAINT "chargebacks_client_id_fkey";

-- DropForeignKey
ALTER TABLE "chargebacks" DROP CONSTRAINT "chargebacks_handled_by_fkey";

-- DropForeignKey
ALTER TABLE "chargebacks" DROP CONSTRAINT "chargebacks_invoice_id_fkey";

-- DropForeignKey
ALTER TABLE "chat_messages" DROP CONSTRAINT "chat_messages_chat_id_fkey";

-- DropForeignKey
ALTER TABLE "chat_messages" DROP CONSTRAINT "chat_messages_sender_id_fkey";

-- DropForeignKey
ALTER TABLE "chat_participants" DROP CONSTRAINT "chat_participants_chat_id_fkey";

-- DropForeignKey
ALTER TABLE "chat_participants" DROP CONSTRAINT "chat_participants_employee_id_fkey";

-- DropForeignKey
ALTER TABLE "client_payment" DROP CONSTRAINT "client_payment_client_id_fkey";

-- DropForeignKey
ALTER TABLE "client_payment" DROP CONSTRAINT "client_payment_invoice_id_fkey";

-- DropForeignKey
ALTER TABLE "client_payment" DROP CONSTRAINT "client_payment_payment_phase_fkey";

-- DropForeignKey
ALTER TABLE "client_payment" DROP CONSTRAINT "client_payment_project_id_fkey";

-- DropForeignKey
ALTER TABLE "clients" DROP CONSTRAINT "clients_created_by_fkey";

-- DropForeignKey
ALTER TABLE "clients" DROP CONSTRAINT "clients_industry_id_fkey";

-- DropForeignKey
ALTER TABLE "complaints" DROP CONSTRAINT "complaints_against_employee_id_fkey";

-- DropForeignKey
ALTER TABLE "complaints" DROP CONSTRAINT "complaints_assigned_to_fkey";

-- DropForeignKey
ALTER TABLE "complaints" DROP CONSTRAINT "complaints_department_id_fkey";

-- DropForeignKey
ALTER TABLE "complaints" DROP CONSTRAINT "complaints_raised_by_fkey";

-- DropForeignKey
ALTER TABLE "cracked_leads" DROP CONSTRAINT "cracked_leads_closed_by_fkey";

-- DropForeignKey
ALTER TABLE "cracked_leads" DROP CONSTRAINT "cracked_leads_lead_id_fkey";

-- DropForeignKey
ALTER TABLE "departments" DROP CONSTRAINT "departments_manager_id_fkey";

-- DropForeignKey
ALTER TABLE "employees" DROP CONSTRAINT "employees_department_id_fkey";

-- DropForeignKey
ALTER TABLE "employees" DROP CONSTRAINT "employees_manager_id_fkey";

-- DropForeignKey
ALTER TABLE "employees" DROP CONSTRAINT "employees_role_id_fkey";

-- DropForeignKey
ALTER TABLE "employees" DROP CONSTRAINT "employees_team_lead_id_fkey";

-- DropForeignKey
ALTER TABLE "expenses" DROP CONSTRAINT "expenses_created_by_fkey";

-- DropForeignKey
ALTER TABLE "hr" DROP CONSTRAINT "hr_employee_id_fkey";

-- DropForeignKey
ALTER TABLE "hr_logs" DROP CONSTRAINT "hr_logs_affected_employee_id_fkey";

-- DropForeignKey
ALTER TABLE "hr_logs" DROP CONSTRAINT "hr_logs_hr_id_fkey";

-- DropForeignKey
ALTER TABLE "hr_requested" DROP CONSTRAINT "hr_requested_assigned_to_fkey";

-- DropForeignKey
ALTER TABLE "hr_requested" DROP CONSTRAINT "hr_requested_department_id_fkey";

-- DropForeignKey
ALTER TABLE "hr_requested" DROP CONSTRAINT "hr_requested_emp_id_fkey";

-- DropForeignKey
ALTER TABLE "invoices" DROP CONSTRAINT "invoices_lead_id_fkey";

-- DropForeignKey
ALTER TABLE "late_logs" DROP CONSTRAINT "late_logs_emp_id_fkey";

-- DropForeignKey
ALTER TABLE "late_logs" DROP CONSTRAINT "late_logs_reviewed_by_fkey";

-- DropForeignKey
ALTER TABLE "lead_comments" DROP CONSTRAINT "lead_comments_comment_by_fkey";

-- DropForeignKey
ALTER TABLE "lead_comments" DROP CONSTRAINT "lead_comments_lead_id_fkey";

-- DropForeignKey
ALTER TABLE "lead_outcome_history" DROP CONSTRAINT "lead_outcome_history_changed_by_fkey";

-- DropForeignKey
ALTER TABLE "lead_outcome_history" DROP CONSTRAINT "lead_outcome_history_comment_id_fkey";

-- DropForeignKey
ALTER TABLE "lead_outcome_history" DROP CONSTRAINT "lead_outcome_history_lead_id_fkey";

-- DropForeignKey
ALTER TABLE "leads" DROP CONSTRAINT "leads_assigned_to_fkey";

-- DropForeignKey
ALTER TABLE "leads" DROP CONSTRAINT "leads_closed_by_fkey";

-- DropForeignKey
ALTER TABLE "leads" DROP CONSTRAINT "leads_cracked_by_fkey";

-- DropForeignKey
ALTER TABLE "leads" DROP CONSTRAINT "leads_sales_unit_id_fkey";

-- DropForeignKey
ALTER TABLE "leads" DROP CONSTRAINT "leads_started_by_fkey";

-- DropForeignKey
ALTER TABLE "leave_logs" DROP CONSTRAINT "leave_logs_emp_id_fkey";

-- DropForeignKey
ALTER TABLE "leave_logs" DROP CONSTRAINT "leave_logs_reviewed_by_fkey";

-- DropForeignKey
ALTER TABLE "liabilities" DROP CONSTRAINT "liabilities_created_by_fkey";

-- DropForeignKey
ALTER TABLE "liabilities" DROP CONSTRAINT "liabilities_related_vendor_id_fkey";

-- DropForeignKey
ALTER TABLE "marketing" DROP CONSTRAINT "marketing_employee_id_fkey";

-- DropForeignKey
ALTER TABLE "marketing" DROP CONSTRAINT "marketing_marketing_unit_id_fkey";

-- DropForeignKey
ALTER TABLE "marketing_units" DROP CONSTRAINT "marketing_units_head_id_fkey";

-- DropForeignKey
ALTER TABLE "meetings" DROP CONSTRAINT "meetings_client_id_fkey";

-- DropForeignKey
ALTER TABLE "meetings" DROP CONSTRAINT "meetings_employee_id_fkey";

-- DropForeignKey
ALTER TABLE "meetings" DROP CONSTRAINT "meetings_project_id_fkey";

-- DropForeignKey
ALTER TABLE "monthly_attendance_summary" DROP CONSTRAINT "monthly_attendance_summary_emp_id_fkey";

-- DropForeignKey
ALTER TABLE "net_salary_logs" DROP CONSTRAINT "net_salary_logs_employee_id_fkey";

-- DropForeignKey
ALTER TABLE "net_salary_logs" DROP CONSTRAINT "net_salary_logs_processed_by_fkey";

-- DropForeignKey
ALTER TABLE "notifications" DROP CONSTRAINT "notifications_sent_by_fkey";

-- DropForeignKey
ALTER TABLE "notifications" DROP CONSTRAINT "notifications_sent_to_fkey";

-- DropForeignKey
ALTER TABLE "production" DROP CONSTRAINT "production_employee_id_fkey";

-- DropForeignKey
ALTER TABLE "production" DROP CONSTRAINT "production_production_unit_id_fkey";

-- DropForeignKey
ALTER TABLE "production_units" DROP CONSTRAINT "production_units_head_id_fkey";

-- DropForeignKey
ALTER TABLE "project_chats" DROP CONSTRAINT "project_chats_project_id_fkey";

-- DropForeignKey
ALTER TABLE "project_chats" DROP CONSTRAINT "project_chats_transferred_from_fkey";

-- DropForeignKey
ALTER TABLE "project_chats" DROP CONSTRAINT "project_chats_transferred_to_fkey";

-- DropForeignKey
ALTER TABLE "project_logs" DROP CONSTRAINT "project_logs_developer_id_fkey";

-- DropForeignKey
ALTER TABLE "project_logs" DROP CONSTRAINT "project_logs_project_id_fkey";

-- DropForeignKey
ALTER TABLE "project_tasks" DROP CONSTRAINT "project_tasks_assigned_by_fkey";

-- DropForeignKey
ALTER TABLE "project_tasks" DROP CONSTRAINT "project_tasks_assigned_to_fkey";

-- DropForeignKey
ALTER TABLE "project_tasks" DROP CONSTRAINT "project_tasks_project_id_fkey";

-- DropForeignKey
ALTER TABLE "projects" DROP CONSTRAINT "projects_client_id_fkey";

-- DropForeignKey
ALTER TABLE "projects" DROP CONSTRAINT "projects_cracked_lead_id_fkey";

-- DropForeignKey
ALTER TABLE "projects" DROP CONSTRAINT "projects_sales_rep_id_fkey";

-- DropForeignKey
ALTER TABLE "projects" DROP CONSTRAINT "projects_team_lead_id_fkey";

-- DropForeignKey
ALTER TABLE "projects" DROP CONSTRAINT "projects_unit_head_id_fkey";

-- DropForeignKey
ALTER TABLE "refunds" DROP CONSTRAINT "refunds_client_id_fkey";

-- DropForeignKey
ALTER TABLE "refunds" DROP CONSTRAINT "refunds_invoice_id_fkey";

-- DropForeignKey
ALTER TABLE "refunds" DROP CONSTRAINT "refunds_refunded_by_fkey";

-- DropForeignKey
ALTER TABLE "reminders" DROP CONSTRAINT "reminders_emp_id_fkey";

-- DropForeignKey
ALTER TABLE "revenues" DROP CONSTRAINT "revenues_created_by_fkey";

-- DropForeignKey
ALTER TABLE "revenues" DROP CONSTRAINT "revenues_received_from_fkey";

-- DropForeignKey
ALTER TABLE "revenues" DROP CONSTRAINT "revenues_related_invoice_id_fkey";

-- DropForeignKey
ALTER TABLE "sales_departments" DROP CONSTRAINT "sales_departments_employee_id_fkey";

-- DropForeignKey
ALTER TABLE "sales_departments" DROP CONSTRAINT "sales_departments_sales_unit_id_fkey";

-- DropForeignKey
ALTER TABLE "sales_units" DROP CONSTRAINT "sales_units_head_id_fkey";

-- DropForeignKey
ALTER TABLE "teams" DROP CONSTRAINT "teams_current_project_id_fkey";

-- DropForeignKey
ALTER TABLE "teams" DROP CONSTRAINT "teams_marketing_unit_id_fkey";

-- DropForeignKey
ALTER TABLE "teams" DROP CONSTRAINT "teams_production_unit_id_fkey";

-- DropForeignKey
ALTER TABLE "teams" DROP CONSTRAINT "teams_sales_unit_id_fkey";

-- DropForeignKey
ALTER TABLE "teams" DROP CONSTRAINT "teams_team_lead_id_fkey";

-- DropForeignKey
ALTER TABLE "transactions" DROP CONSTRAINT "transactions_client_id_fkey";

-- DropForeignKey
ALTER TABLE "transactions" DROP CONSTRAINT "transactions_employee_id_fkey";

-- DropForeignKey
ALTER TABLE "transactions" DROP CONSTRAINT "transactions_invoice_id_fkey";

-- DropForeignKey
ALTER TABLE "transactions" DROP CONSTRAINT "transactions_related_chargeback_id_fkey";

-- DropForeignKey
ALTER TABLE "transactions" DROP CONSTRAINT "transactions_related_refund_id_fkey";

-- DropForeignKey
ALTER TABLE "transactions" DROP CONSTRAINT "transactions_vendor_id_fkey";

-- DropForeignKey
ALTER TABLE "vendors" DROP CONSTRAINT "vendors_created_by_fkey";

-- AlterTable
ALTER TABLE "access_logs" DROP CONSTRAINT "access_logs_pkey",
DROP COLUMN "id",
ADD COLUMN     "access_log_id" SERIAL NOT NULL,
ADD CONSTRAINT "access_logs_pkey" PRIMARY KEY ("access_log_id");

-- AlterTable
ALTER TABLE "accountants" DROP CONSTRAINT "accountants_pkey",
DROP COLUMN "id",
ADD COLUMN     "accountant_id" SERIAL NOT NULL,
ADD CONSTRAINT "accountants_pkey" PRIMARY KEY ("accountant_id");

-- AlterTable
ALTER TABLE "accounts" DROP CONSTRAINT "accounts_pkey",
DROP COLUMN "id",
ADD COLUMN     "account_id" SERIAL NOT NULL,
ADD CONSTRAINT "accounts_pkey" PRIMARY KEY ("account_id");

-- AlterTable
ALTER TABLE "admin_requests" DROP CONSTRAINT "admin_requests_pkey",
DROP COLUMN "id",
ADD COLUMN     "admin_request_id" SERIAL NOT NULL,
ADD CONSTRAINT "admin_requests_pkey" PRIMARY KEY ("admin_request_id");

-- AlterTable
ALTER TABLE "admins" DROP CONSTRAINT "admins_pkey",
DROP COLUMN "id",
ADD COLUMN     "admin_id" SERIAL NOT NULL,
ADD CONSTRAINT "admins_pkey" PRIMARY KEY ("admin_id");

-- AlterTable
ALTER TABLE "assets" DROP CONSTRAINT "assets_pkey",
DROP COLUMN "id",
ADD COLUMN     "asset_id" SERIAL NOT NULL,
ADD CONSTRAINT "assets_pkey" PRIMARY KEY ("asset_id");

-- AlterTable
ALTER TABLE "attendance" DROP CONSTRAINT "attendance_pkey",
DROP COLUMN "id",
ADD COLUMN     "attendance_id" SERIAL NOT NULL,
ADD CONSTRAINT "attendance_pkey" PRIMARY KEY ("attendance_id");

-- AlterTable
ALTER TABLE "attendance_logs" DROP CONSTRAINT "attendance_logs_pkey",
DROP COLUMN "id",
ADD COLUMN     "attendance_log_id" SERIAL NOT NULL,
ADD CONSTRAINT "attendance_logs_pkey" PRIMARY KEY ("attendance_log_id");

-- AlterTable
ALTER TABLE "chargebacks" DROP CONSTRAINT "chargebacks_pkey",
DROP COLUMN "id",
ADD COLUMN     "chargeback_id" SERIAL NOT NULL,
ADD CONSTRAINT "chargebacks_pkey" PRIMARY KEY ("chargeback_id");

-- AlterTable
ALTER TABLE "chat_messages" DROP CONSTRAINT "chat_messages_pkey",
DROP COLUMN "id",
ADD COLUMN     "chat_message_id" SERIAL NOT NULL,
ADD CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("chat_message_id");

-- AlterTable
ALTER TABLE "chat_participants" DROP CONSTRAINT "chat_participants_pkey",
DROP COLUMN "id",
ADD COLUMN     "chat_participant_id" SERIAL NOT NULL,
ADD CONSTRAINT "chat_participants_pkey" PRIMARY KEY ("chat_participant_id");

-- AlterTable
ALTER TABLE "clients" DROP CONSTRAINT "clients_pkey",
DROP COLUMN "id",
ADD COLUMN     "client_id" SERIAL NOT NULL,
ADD CONSTRAINT "clients_pkey" PRIMARY KEY ("client_id");

-- AlterTable
ALTER TABLE "companies" DROP CONSTRAINT "companies_pkey",
DROP COLUMN "id",
ADD COLUMN     "company_id" SERIAL NOT NULL,
ADD CONSTRAINT "companies_pkey" PRIMARY KEY ("company_id");

-- AlterTable
ALTER TABLE "cracked_leads" DROP CONSTRAINT "cracked_leads_pkey",
DROP COLUMN "id",
ADD COLUMN     "cracked_lead_id" SERIAL NOT NULL,
ADD CONSTRAINT "cracked_leads_pkey" PRIMARY KEY ("cracked_lead_id");

-- AlterTable
ALTER TABLE "departments" DROP CONSTRAINT "departments_pkey",
DROP COLUMN "id",
ADD COLUMN     "dept_id" SERIAL NOT NULL,
ADD CONSTRAINT "departments_pkey" PRIMARY KEY ("dept_id");

-- AlterTable
ALTER TABLE "employees" DROP CONSTRAINT "employees_pkey",
DROP COLUMN "id",
ADD COLUMN     "emp_id" SERIAL NOT NULL,
ADD CONSTRAINT "employees_pkey" PRIMARY KEY ("emp_id");

-- AlterTable
ALTER TABLE "expenses" DROP CONSTRAINT "expenses_pkey",
DROP COLUMN "id",
ADD COLUMN     "expense_id" SERIAL NOT NULL,
ADD CONSTRAINT "expenses_pkey" PRIMARY KEY ("expense_id");

-- AlterTable
ALTER TABLE "hr" DROP CONSTRAINT "hr_pkey",
DROP COLUMN "id",
ADD COLUMN     "hr_id" SERIAL NOT NULL,
ADD CONSTRAINT "hr_pkey" PRIMARY KEY ("hr_id");

-- AlterTable
ALTER TABLE "hr_logs" DROP CONSTRAINT "hr_logs_pkey",
DROP COLUMN "id",
ADD COLUMN     "hr_log_id" SERIAL NOT NULL,
ADD CONSTRAINT "hr_logs_pkey" PRIMARY KEY ("hr_log_id");

-- AlterTable
ALTER TABLE "industries" DROP CONSTRAINT "industries_pkey",
DROP COLUMN "id",
ADD COLUMN     "industry_id" SERIAL NOT NULL,
ADD CONSTRAINT "industries_pkey" PRIMARY KEY ("industry_id");

-- AlterTable
ALTER TABLE "invoices" DROP CONSTRAINT "invoices_pkey",
DROP COLUMN "id",
ADD COLUMN     "invoice_id" SERIAL NOT NULL,
ADD CONSTRAINT "invoices_pkey" PRIMARY KEY ("invoice_id");

-- AlterTable
ALTER TABLE "lead_comments" DROP CONSTRAINT "lead_comments_pkey",
DROP COLUMN "id",
ADD COLUMN     "lead_comment_id" SERIAL NOT NULL,
ADD CONSTRAINT "lead_comments_pkey" PRIMARY KEY ("lead_comment_id");

-- AlterTable
ALTER TABLE "lead_outcome_history" DROP CONSTRAINT "lead_outcome_history_pkey",
DROP COLUMN "id",
ADD COLUMN     "lead_outcome_history_id" SERIAL NOT NULL,
ADD CONSTRAINT "lead_outcome_history_pkey" PRIMARY KEY ("lead_outcome_history_id");

-- AlterTable
ALTER TABLE "leads" DROP CONSTRAINT "leads_pkey",
DROP COLUMN "id",
ADD COLUMN     "lead_id" SERIAL NOT NULL,
ADD CONSTRAINT "leads_pkey" PRIMARY KEY ("lead_id");

-- AlterTable
ALTER TABLE "leave_logs" DROP CONSTRAINT "leave_logs_pkey",
DROP COLUMN "leave_id",
ADD COLUMN     "leave_log_id" SERIAL NOT NULL,
ADD CONSTRAINT "leave_logs_pkey" PRIMARY KEY ("leave_log_id");

-- AlterTable
ALTER TABLE "liabilities" DROP CONSTRAINT "liabilities_pkey",
DROP COLUMN "id",
ADD COLUMN     "liability_id" SERIAL NOT NULL,
ADD CONSTRAINT "liabilities_pkey" PRIMARY KEY ("liability_id");

-- AlterTable
ALTER TABLE "marketing" DROP CONSTRAINT "marketing_pkey",
DROP COLUMN "id",
ADD COLUMN     "marketing_id" SERIAL NOT NULL,
ADD CONSTRAINT "marketing_pkey" PRIMARY KEY ("marketing_id");

-- AlterTable
ALTER TABLE "marketing_units" DROP CONSTRAINT "marketing_units_pkey",
DROP COLUMN "id",
ADD COLUMN     "marketing_unit_id" SERIAL NOT NULL,
ADD CONSTRAINT "marketing_units_pkey" PRIMARY KEY ("marketing_unit_id");

-- AlterTable
ALTER TABLE "meetings" DROP CONSTRAINT "meetings_pkey",
DROP COLUMN "id",
ADD COLUMN     "meeting_id" SERIAL NOT NULL,
ADD CONSTRAINT "meetings_pkey" PRIMARY KEY ("meeting_id");

-- AlterTable
ALTER TABLE "net_salary_logs" DROP CONSTRAINT "net_salary_logs_pkey",
DROP COLUMN "id",
ADD COLUMN     "net_salary_log_id" SERIAL NOT NULL,
ADD CONSTRAINT "net_salary_logs_pkey" PRIMARY KEY ("net_salary_log_id");

-- AlterTable
ALTER TABLE "notifications" DROP CONSTRAINT "notifications_pkey",
DROP COLUMN "id",
ADD COLUMN     "notification_id" SERIAL NOT NULL,
ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("notification_id");

-- AlterTable
ALTER TABLE "production" DROP CONSTRAINT "production_pkey",
DROP COLUMN "id",
ADD COLUMN     "production_id" SERIAL NOT NULL,
ADD CONSTRAINT "production_pkey" PRIMARY KEY ("production_id");

-- AlterTable
ALTER TABLE "production_units" DROP CONSTRAINT "production_units_pkey",
DROP COLUMN "id",
ADD COLUMN     "production_unit_id" SERIAL NOT NULL,
ADD CONSTRAINT "production_units_pkey" PRIMARY KEY ("production_unit_id");

-- AlterTable
ALTER TABLE "profit_loss" DROP CONSTRAINT "profit_loss_pkey",
DROP COLUMN "id",
ADD COLUMN     "profit_loss_id" SERIAL NOT NULL,
ADD CONSTRAINT "profit_loss_pkey" PRIMARY KEY ("profit_loss_id");

-- AlterTable
ALTER TABLE "project_chats" DROP CONSTRAINT "project_chats_pkey",
DROP COLUMN "id",
ADD COLUMN     "project_chat_id" SERIAL NOT NULL,
ADD CONSTRAINT "project_chats_pkey" PRIMARY KEY ("project_chat_id");

-- AlterTable
ALTER TABLE "project_logs" DROP CONSTRAINT "project_logs_pkey",
DROP COLUMN "id",
ADD COLUMN     "project_log_id" SERIAL NOT NULL,
ADD CONSTRAINT "project_logs_pkey" PRIMARY KEY ("project_log_id");

-- AlterTable
ALTER TABLE "projects" DROP CONSTRAINT "projects_pkey",
DROP COLUMN "id",
ADD COLUMN     "project_id" SERIAL NOT NULL,
ADD CONSTRAINT "projects_pkey" PRIMARY KEY ("project_id");

-- AlterTable
ALTER TABLE "refunds" DROP CONSTRAINT "refunds_pkey",
DROP COLUMN "id",
ADD COLUMN     "refund_id" SERIAL NOT NULL,
ADD CONSTRAINT "refunds_pkey" PRIMARY KEY ("refund_id");

-- AlterTable
ALTER TABLE "revenues" DROP CONSTRAINT "revenues_pkey",
DROP COLUMN "id",
ADD COLUMN     "revenue_id" SERIAL NOT NULL,
ADD CONSTRAINT "revenues_pkey" PRIMARY KEY ("revenue_id");

-- AlterTable
ALTER TABLE "roles" DROP CONSTRAINT "roles_pkey",
DROP COLUMN "id",
ADD COLUMN     "role_id" SERIAL NOT NULL,
ADD CONSTRAINT "roles_pkey" PRIMARY KEY ("role_id");

-- AlterTable
ALTER TABLE "sales_departments" DROP CONSTRAINT "sales_departments_pkey",
DROP COLUMN "id",
ADD COLUMN     "sales_department_id" SERIAL NOT NULL,
ADD CONSTRAINT "sales_departments_pkey" PRIMARY KEY ("sales_department_id");

-- AlterTable
ALTER TABLE "sales_units" DROP CONSTRAINT "sales_units_pkey",
DROP COLUMN "id",
ADD COLUMN     "sales_unit_id" SERIAL NOT NULL,
ADD CONSTRAINT "sales_units_pkey" PRIMARY KEY ("sales_unit_id");

-- AlterTable
ALTER TABLE "teams" DROP CONSTRAINT "teams_pkey",
DROP COLUMN "id",
ADD COLUMN     "team_id" SERIAL NOT NULL,
ADD CONSTRAINT "teams_pkey" PRIMARY KEY ("team_id");

-- AlterTable
ALTER TABLE "vendors" DROP CONSTRAINT "vendors_pkey",
DROP COLUMN "id",
ADD COLUMN     "vendor_id" SERIAL NOT NULL,
ADD CONSTRAINT "vendors_pkey" PRIMARY KEY ("vendor_id");

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("dept_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("role_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_manager_id_fkey" FOREIGN KEY ("manager_id") REFERENCES "employees"("emp_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_team_lead_id_fkey" FOREIGN KEY ("team_lead_id") REFERENCES "employees"("emp_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "departments" ADD CONSTRAINT "departments_manager_id_fkey" FOREIGN KEY ("manager_id") REFERENCES "employees"("emp_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing" ADD CONSTRAINT "marketing_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("emp_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing" ADD CONSTRAINT "marketing_marketing_unit_id_fkey" FOREIGN KEY ("marketing_unit_id") REFERENCES "marketing_units"("marketing_unit_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing_units" ADD CONSTRAINT "marketing_units_head_id_fkey" FOREIGN KEY ("head_id") REFERENCES "employees"("emp_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_cracked_lead_id_fkey" FOREIGN KEY ("cracked_lead_id") REFERENCES "cracked_leads"("cracked_lead_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_sales_rep_id_fkey" FOREIGN KEY ("sales_rep_id") REFERENCES "employees"("emp_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_team_lead_id_fkey" FOREIGN KEY ("team_lead_id") REFERENCES "employees"("emp_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_unit_head_id_fkey" FOREIGN KEY ("unit_head_id") REFERENCES "employees"("emp_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("client_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_logs" ADD CONSTRAINT "project_logs_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("project_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_logs" ADD CONSTRAINT "project_logs_developer_id_fkey" FOREIGN KEY ("developer_id") REFERENCES "employees"("emp_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production" ADD CONSTRAINT "production_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("emp_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production" ADD CONSTRAINT "production_production_unit_id_fkey" FOREIGN KEY ("production_unit_id") REFERENCES "production_units"("production_unit_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_units" ADD CONSTRAINT "production_units_head_id_fkey" FOREIGN KEY ("head_id") REFERENCES "employees"("emp_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teams" ADD CONSTRAINT "teams_team_lead_id_fkey" FOREIGN KEY ("team_lead_id") REFERENCES "employees"("emp_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teams" ADD CONSTRAINT "teams_current_project_id_fkey" FOREIGN KEY ("current_project_id") REFERENCES "projects"("project_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teams" ADD CONSTRAINT "teams_sales_unit_id_fkey" FOREIGN KEY ("sales_unit_id") REFERENCES "sales_units"("sales_unit_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teams" ADD CONSTRAINT "teams_production_unit_id_fkey" FOREIGN KEY ("production_unit_id") REFERENCES "production_units"("production_unit_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teams" ADD CONSTRAINT "teams_marketing_unit_id_fkey" FOREIGN KEY ("marketing_unit_id") REFERENCES "marketing_units"("marketing_unit_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_industry_id_fkey" FOREIGN KEY ("industry_id") REFERENCES "industries"("industry_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "employees"("emp_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_cracked_by_fkey" FOREIGN KEY ("cracked_by") REFERENCES "employees"("emp_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "employees"("emp_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_started_by_fkey" FOREIGN KEY ("started_by") REFERENCES "employees"("emp_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_closed_by_fkey" FOREIGN KEY ("closed_by") REFERENCES "employees"("emp_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_sales_unit_id_fkey" FOREIGN KEY ("sales_unit_id") REFERENCES "sales_units"("sales_unit_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_units" ADD CONSTRAINT "sales_units_head_id_fkey" FOREIGN KEY ("head_id") REFERENCES "employees"("emp_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_comments" ADD CONSTRAINT "lead_comments_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("lead_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_comments" ADD CONSTRAINT "lead_comments_comment_by_fkey" FOREIGN KEY ("comment_by") REFERENCES "employees"("emp_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_departments" ADD CONSTRAINT "sales_departments_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("emp_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_departments" ADD CONSTRAINT "sales_departments_sales_unit_id_fkey" FOREIGN KEY ("sales_unit_id") REFERENCES "sales_units"("sales_unit_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cracked_leads" ADD CONSTRAINT "cracked_leads_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("lead_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cracked_leads" ADD CONSTRAINT "cracked_leads_closed_by_fkey" FOREIGN KEY ("closed_by") REFERENCES "employees"("emp_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("invoice_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("client_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_refunded_by_fkey" FOREIGN KEY ("refunded_by") REFERENCES "employees"("emp_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chargebacks" ADD CONSTRAINT "chargebacks_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("invoice_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chargebacks" ADD CONSTRAINT "chargebacks_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("client_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chargebacks" ADD CONSTRAINT "chargebacks_handled_by_fkey" FOREIGN KEY ("handled_by") REFERENCES "employees"("emp_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "access_logs" ADD CONSTRAINT "access_logs_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("emp_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_outcome_history" ADD CONSTRAINT "lead_outcome_history_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("lead_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_outcome_history" ADD CONSTRAINT "lead_outcome_history_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "employees"("emp_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_outcome_history" ADD CONSTRAINT "lead_outcome_history_comment_id_fkey" FOREIGN KEY ("comment_id") REFERENCES "lead_comments"("lead_comment_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("emp_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accountants" ADD CONSTRAINT "accountants_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("emp_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assets" ADD CONSTRAINT "assets_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "employees"("emp_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "employees"("emp_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "liabilities" ADD CONSTRAINT "liabilities_related_vendor_id_fkey" FOREIGN KEY ("related_vendor_id") REFERENCES "vendors"("vendor_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "liabilities" ADD CONSTRAINT "liabilities_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "employees"("emp_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "revenues" ADD CONSTRAINT "revenues_received_from_fkey" FOREIGN KEY ("received_from") REFERENCES "leads"("lead_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "revenues" ADD CONSTRAINT "revenues_related_invoice_id_fkey" FOREIGN KEY ("related_invoice_id") REFERENCES "invoices"("invoice_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "revenues" ADD CONSTRAINT "revenues_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "employees"("emp_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("lead_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("invoice_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("vendor_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("client_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("emp_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_related_refund_id_fkey" FOREIGN KEY ("related_refund_id") REFERENCES "refunds"("refund_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_related_chargeback_id_fkey" FOREIGN KEY ("related_chargeback_id") REFERENCES "chargebacks"("chargeback_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "net_salary_logs" ADD CONSTRAINT "net_salary_logs_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("emp_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "net_salary_logs" ADD CONSTRAINT "net_salary_logs_processed_by_fkey" FOREIGN KEY ("processed_by") REFERENCES "employees"("emp_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendors" ADD CONSTRAINT "vendors_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "employees"("emp_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_requests" ADD CONSTRAINT "admin_requests_hr_log_id_fkey" FOREIGN KEY ("hr_log_id") REFERENCES "hr_logs"("hr_log_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("emp_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_logs" ADD CONSTRAINT "attendance_logs_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("emp_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr" ADD CONSTRAINT "hr_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("emp_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_logs" ADD CONSTRAINT "hr_logs_hr_id_fkey" FOREIGN KEY ("hr_id") REFERENCES "hr"("hr_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_logs" ADD CONSTRAINT "hr_logs_affected_employee_id_fkey" FOREIGN KEY ("affected_employee_id") REFERENCES "employees"("emp_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leave_logs" ADD CONSTRAINT "leave_logs_emp_id_fkey" FOREIGN KEY ("emp_id") REFERENCES "employees"("emp_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leave_logs" ADD CONSTRAINT "leave_logs_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "employees"("emp_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "late_logs" ADD CONSTRAINT "late_logs_emp_id_fkey" FOREIGN KEY ("emp_id") REFERENCES "employees"("emp_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "late_logs" ADD CONSTRAINT "late_logs_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "employees"("emp_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monthly_attendance_summary" ADD CONSTRAINT "monthly_attendance_summary_emp_id_fkey" FOREIGN KEY ("emp_id") REFERENCES "employees"("emp_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_chats" ADD CONSTRAINT "project_chats_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("project_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_chats" ADD CONSTRAINT "project_chats_transferred_from_fkey" FOREIGN KEY ("transferred_from") REFERENCES "employees"("emp_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_chats" ADD CONSTRAINT "project_chats_transferred_to_fkey" FOREIGN KEY ("transferred_to") REFERENCES "employees"("emp_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_participants" ADD CONSTRAINT "chat_participants_chat_id_fkey" FOREIGN KEY ("chat_id") REFERENCES "project_chats"("project_chat_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_participants" ADD CONSTRAINT "chat_participants_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("emp_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_chat_id_fkey" FOREIGN KEY ("chat_id") REFERENCES "project_chats"("project_chat_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "employees"("emp_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meetings" ADD CONSTRAINT "meetings_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("emp_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meetings" ADD CONSTRAINT "meetings_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("client_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meetings" ADD CONSTRAINT "meetings_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("project_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_sent_to_fkey" FOREIGN KEY ("sent_to") REFERENCES "employees"("emp_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_sent_by_fkey" FOREIGN KEY ("sent_by") REFERENCES "employees"("emp_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_requested" ADD CONSTRAINT "hr_requested_emp_id_fkey" FOREIGN KEY ("emp_id") REFERENCES "employees"("emp_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_requested" ADD CONSTRAINT "hr_requested_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("dept_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_requested" ADD CONSTRAINT "hr_requested_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "employees"("emp_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "complaints" ADD CONSTRAINT "complaints_raised_by_fkey" FOREIGN KEY ("raised_by") REFERENCES "employees"("emp_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "complaints" ADD CONSTRAINT "complaints_against_employee_id_fkey" FOREIGN KEY ("against_employee_id") REFERENCES "employees"("emp_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "complaints" ADD CONSTRAINT "complaints_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("dept_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "complaints" ADD CONSTRAINT "complaints_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "employees"("emp_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_emp_id_fkey" FOREIGN KEY ("emp_id") REFERENCES "employees"("emp_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_logs" ADD CONSTRAINT "campaign_logs_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "marketing_units"("marketing_unit_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_logs" ADD CONSTRAINT "campaign_logs_productionUnitId_fkey" FOREIGN KEY ("productionUnitId") REFERENCES "production_units"("production_unit_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_payment" ADD CONSTRAINT "client_payment_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("client_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_payment" ADD CONSTRAINT "client_payment_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("invoice_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_payment" ADD CONSTRAINT "client_payment_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("project_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_payment" ADD CONSTRAINT "client_payment_payment_phase_fkey" FOREIGN KEY ("payment_phase") REFERENCES "employees"("emp_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "archive_leads" ADD CONSTRAINT "archive_leads_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("lead_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "archive_leads" ADD CONSTRAINT "archive_leads_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "employees"("emp_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "archive_leads" ADD CONSTRAINT "archive_leads_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "sales_units"("sales_unit_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_tasks" ADD CONSTRAINT "project_tasks_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("project_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_tasks" ADD CONSTRAINT "project_tasks_assigned_by_fkey" FOREIGN KEY ("assigned_by") REFERENCES "employees"("emp_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_tasks" ADD CONSTRAINT "project_tasks_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "employees"("emp_id") ON DELETE RESTRICT ON UPDATE CASCADE;
