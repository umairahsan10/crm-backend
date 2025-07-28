-- CreateEnum
CREATE TYPE "EmployeeStatus" AS ENUM ('active', 'terminated', 'inactive');

-- CreateEnum
CREATE TYPE "WorkMode" AS ENUM ('hybrid', 'on_site', 'remote');

-- CreateEnum
CREATE TYPE "genderOpt" AS ENUM ('male', 'female', 'others');

-- CreateEnum
CREATE TYPE "EmploymentType" AS ENUM ('full_time', 'part_time');

-- CreateEnum
CREATE TYPE "PeriodType" AS ENUM ('probation', 'permanent', 'notice');

-- CreateEnum
CREATE TYPE "RoleName" AS ENUM ('dep_manager', 'team_lead', 'senior', 'junior', 'unit_head');

-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('in_progress', 'onhold', 'completed');

-- CreateEnum
CREATE TYPE "DifficultyLevel" AS ENUM ('very_easy', 'easy', 'medium', 'hard', 'difficult');

-- CreateEnum
CREATE TYPE "PaymentStage" AS ENUM ('initial', 'in_between', 'final', 'approved');

-- CreateEnum
CREATE TYPE "accStat" AS ENUM ('active', 'inactive', 'suspended', 'prospect');

-- CreateEnum
CREATE TYPE "LeadSource" AS ENUM ('PPC', 'SMM');

-- CreateEnum
CREATE TYPE "LeadType" AS ENUM ('warm', 'cold', 'upsell', 'push');

-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('in_progress', 'new', 'completed', 'payment_link_generated', 'failed', 'cracked');

-- CreateEnum
CREATE TYPE "LeadOutcome" AS ENUM ('voice_mail', 'interested', 'not_answered', 'busy', 'denied');

-- CreateEnum
CREATE TYPE "QualityRating" AS ENUM ('excellent', 'very_good', 'good', 'bad', 'useless');

-- CreateEnum
CREATE TYPE "RefundStatus" AS ENUM ('initiated', 'processing', 'completed', 'rejected');

-- CreateEnum
CREATE TYPE "ChargebackStatus" AS ENUM ('pending', 'underreview', 'won', 'lost', 'resolved');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('cash', 'bank', 'online');

-- CreateEnum
CREATE TYPE "PaymentWays" AS ENUM ('bank', 'credit_card', 'online', 'cashapp', 'cash');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('unpaid', 'paid');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('payment', 'refund', 'chargeback', 'salary', 'expense');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('pending', 'completed', 'failed', 'disputed');

-- CreateEnum
CREATE TYPE "SalaryStatus" AS ENUM ('paid', 'unpaid');

-- CreateEnum
CREATE TYPE "AdminRole" AS ENUM ('admin', 'super_admin');

-- CreateEnum
CREATE TYPE "RequestType" AS ENUM ('salary_increase', 'late_approval', 'others');

-- CreateEnum
CREATE TYPE "AdminRequestStatus" AS ENUM ('approved', 'declined', 'pending');

-- CreateEnum
CREATE TYPE "WorkingMode" AS ENUM ('onsite', 'remote');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('present', 'absent', 'late', 'half_day', 'leave');

-- CreateEnum
CREATE TYPE "LeaveStatus" AS ENUM ('Pending', 'Approved', 'Rejected');

-- CreateEnum
CREATE TYPE "LateAction" AS ENUM ('Approved', 'Pending', 'Rejected');

-- CreateEnum
CREATE TYPE "ConfirmationAction" AS ENUM ('rejected', 'approved');

-- CreateEnum
CREATE TYPE "chPart" AS ENUM ('owner', 'participant');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('read', 'unread');

-- CreateEnum
CREATE TYPE "MeetingStatus" AS ENUM ('scheduled', 'completed', 'missed', 'declined', 'delayed');

-- CreateEnum
CREATE TYPE "RequestPriority" AS ENUM ('Low', 'Medium', 'High', 'Urgent');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('Pending', 'In_Progress', 'Resolved', 'Rejected', 'Cancelled');

-- CreateEnum
CREATE TYPE "ComplaintStatus" AS ENUM ('Open', 'In_Progress', 'Resolved', 'Dismissed');

-- CreateEnum
CREATE TYPE "ComplaintPriority" AS ENUM ('Low', 'Medium', 'High', 'Critical');

-- CreateEnum
CREATE TYPE "RecurrencePattern" AS ENUM ('Daily', 'Weekly', 'Monthly');

-- CreateEnum
CREATE TYPE "ReminderStatus" AS ENUM ('Pending', 'Completed', 'Overdue');

-- CreateEnum
CREATE TYPE "CampaignStatus" AS ENUM ('Planned', 'Running', 'Completed', 'Cancelled');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('pending', 'completed', 'failed', 'refunded');

-- CreateEnum
CREATE TYPE "ArchiveLeadSource" AS ENUM ('PPC', 'SMM');

-- CreateEnum
CREATE TYPE "ArchiveLeadOutcome" AS ENUM ('voice_mail', 'interested', 'not_answered', 'busy', 'denied');

-- CreateEnum
CREATE TYPE "ArchiveLeadQualityRating" AS ENUM ('excellent', 'very_good', 'good', 'bad', 'useless');

-- CreateEnum
CREATE TYPE "ProjectTaskPriority" AS ENUM ('low', 'medium', 'high', 'critical');

-- CreateEnum
CREATE TYPE "ProjectTaskStatus" AS ENUM ('not_started', 'in_progress', 'review', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "ProjectTaskDifficulty" AS ENUM ('easy', 'medium', 'hard', 'difficult');

-- CreateTable
CREATE TABLE "employees" (
    "id" SERIAL NOT NULL,
    "first_name" VARCHAR(255) NOT NULL,
    "last_name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(20),
    "gender" "genderOpt" NOT NULL,
    "cnic" VARCHAR(50),
    "department_id" INTEGER NOT NULL,
    "role_id" INTEGER NOT NULL,
    "manager_id" INTEGER,
    "team_lead_id" INTEGER,
    "address" TEXT,
    "marital_status" BOOLEAN,
    "status" "EmployeeStatus" NOT NULL DEFAULT 'active',
    "start_date" DATE,
    "end_date" DATE,
    "mode_of_work" "WorkMode",
    "remote_days_allowed" INTEGER,
    "dob" DATE,
    "emergency_contact" VARCHAR(255),
    "shift_start" VARCHAR(10),
    "shift_end" VARCHAR(10),
    "employment_type" "EmploymentType",
    "date_of_confirmation" DATE,
    "period_type" "PeriodType",
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "bonus" INTEGER,

    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "departments" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "manager_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" SERIAL NOT NULL,
    "name" "RoleName" NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketing" (
    "id" SERIAL NOT NULL,
    "employee_id" INTEGER NOT NULL,
    "marketing_unit_id" INTEGER,
    "total_campaigns_run" INTEGER,
    "platform_focus" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketing_units" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "head_id" INTEGER,
    "lead_quality_score" DECIMAL(5,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketing_units_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" SERIAL NOT NULL,
    "cracked_lead_id" INTEGER,
    "sales_rep_id" INTEGER,
    "team_lead_id" INTEGER,
    "unit_head_id" INTEGER,
    "client_id" INTEGER,
    "status" "ProjectStatus",
    "difficulty_level" "DifficultyLevel",
    "payment_stage" "PaymentStage",
    "description" TEXT,
    "deadline" DATE,
    "live_progress" DECIMAL(5,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_logs" (
    "id" SERIAL NOT NULL,
    "project_id" INTEGER NOT NULL,
    "developer_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "production" (
    "id" SERIAL NOT NULL,
    "employee_id" INTEGER NOT NULL,
    "specialization" VARCHAR(255),
    "production_unit_id" INTEGER,
    "projects_completed" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "production_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "production_units" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "head_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "production_units_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teams" (
    "id" SERIAL NOT NULL,
    "team_lead_id" INTEGER,
    "name" VARCHAR(255),
    "current_project_id" INTEGER,
    "employee_count" INTEGER,
    "sales_unit_id" INTEGER,
    "production_unit_id" INTEGER,
    "marketing_unit_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "industries" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "industries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clients" (
    "id" SERIAL NOT NULL,
    "client_type" VARCHAR(20),
    "company_name" VARCHAR(255),
    "client_name" VARCHAR(100),
    "email" VARCHAR(150),
    "phone" VARCHAR(20),
    "password_hash" VARCHAR(255) NOT NULL,
    "alt_phone" VARCHAR(20),
    "address" VARCHAR(255),
    "city" VARCHAR(100),
    "state" VARCHAR(100),
    "postal_code" VARCHAR(20),
    "country" VARCHAR(100),
    "industry_id" INTEGER,
    "tax_id" VARCHAR(50),
    "account_status" "accStat" NOT NULL,
    "created_by" INTEGER,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leads" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255),
    "email" VARCHAR(255),
    "phone" VARCHAR(20),
    "source" "LeadSource",
    "type" "LeadType",
    "status" "LeadStatus",
    "failed_count" INTEGER,
    "cracked_by" INTEGER,
    "assigned_to" INTEGER,
    "started_by" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "outcome" "LeadOutcome",
    "sales_unit_id" INTEGER,
    "closed_at" DATE,
    "closed_by" INTEGER,
    "quality_rating" "QualityRating",

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_units" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255),
    "phone" VARCHAR(20),
    "address" VARCHAR(255),
    "head_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "logo_url" VARCHAR(255),
    "website" VARCHAR(255),

    CONSTRAINT "sales_units_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead_comments" (
    "id" SERIAL NOT NULL,
    "lead_id" INTEGER NOT NULL,
    "comment_by" INTEGER NOT NULL,
    "comment_text" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lead_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_departments" (
    "id" SERIAL NOT NULL,
    "employee_id" INTEGER NOT NULL,
    "leads_closed" INTEGER,
    "sales_amount" DECIMAL(12,2),
    "sales_unit_id" INTEGER,
    "commission_rate" DECIMAL(5,2),
    "commission_amount" DECIMAL(12,2),
    "bonus" DECIMAL(12,2),
    "withhold_commission" DECIMAL(12,2) NOT NULL,
    "withhold_flag" BOOLEAN NOT NULL,
    "target_amount" DECIMAL(12,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sales_departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cracked_leads" (
    "id" SERIAL NOT NULL,
    "lead_id" INTEGER NOT NULL,
    "closed_by" INTEGER NOT NULL,
    "category" VARCHAR(255),
    "description" TEXT,
    "cracked_at" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "amount" DECIMAL(12,2),
    "commission_rate" DECIMAL(5,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "total_phases" INTEGER,
    "current_phase" INTEGER,

    CONSTRAINT "cracked_leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refunds" (
    "id" SERIAL NOT NULL,
    "invoice_id" INTEGER,
    "client_id" INTEGER,
    "amount" DECIMAL(12,2),
    "reason" TEXT,
    "refunded_by" INTEGER,
    "refund_method" VARCHAR(50),
    "status" "RefundStatus" NOT NULL,
    "processed_on" DATE,
    "comments" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "refunds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chargebacks" (
    "id" SERIAL NOT NULL,
    "transaction_id" VARCHAR(100),
    "invoice_id" INTEGER,
    "client_id" INTEGER,
    "amount" DECIMAL(12,2),
    "reason_code" VARCHAR(100),
    "bank_reference" VARCHAR(100),
    "status" "ChargebackStatus",
    "opened_at" DATE,
    "resolved_at" DATE,
    "handled_by" INTEGER,
    "comments" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chargebacks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "access_logs" (
    "id" SERIAL NOT NULL,
    "employee_id" INTEGER NOT NULL,
    "ip_address" VARCHAR(45),
    "login_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "logout_time" TIMESTAMP(3),
    "success" BOOLEAN NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "access_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead_outcome_history" (
    "id" SERIAL NOT NULL,
    "lead_id" INTEGER NOT NULL,
    "outcome" VARCHAR(50) NOT NULL,
    "changed_by" INTEGER,
    "comment_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lead_outcome_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" SERIAL NOT NULL,
    "employee_id" INTEGER NOT NULL,
    "account_title" VARCHAR(255),
    "bank_name" VARCHAR(255),
    "iban_number" VARCHAR(50),
    "base_salary" DECIMAL(12,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accountants" (
    "id" SERIAL NOT NULL,
    "employee_id" INTEGER NOT NULL,
    "tax_permission" BOOLEAN,
    "salary_permission" BOOLEAN,
    "sales_permission" BOOLEAN,
    "invoices_permission" BOOLEAN,
    "expenses_permission" BOOLEAN,
    "assets_permission" BOOLEAN,
    "revenues_permission" BOOLEAN,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accountants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assets" (
    "id" SERIAL NOT NULL,
    "title" VARCHAR(255),
    "category" VARCHAR(100),
    "purchase_date" DATE,
    "purchase_value" DECIMAL(12,2),
    "depreciation_rate" DECIMAL(5,2),
    "current_value" DECIMAL(12,2),
    "created_by" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expenses" (
    "id" SERIAL NOT NULL,
    "title" VARCHAR(255),
    "category" VARCHAR(100),
    "amount" DECIMAL(12,2),
    "created_by" INTEGER,
    "paid_on" DATE,
    "notes" TEXT,
    "transaction_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "payment_method" "PaymentMethod",

    CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "liabilities" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255),
    "category" VARCHAR(100),
    "amount" DECIMAL(12,2),
    "due_date" DATE,
    "is_paid" BOOLEAN,
    "paid_on" DATE,
    "related_vendor_id" INTEGER,
    "created_by" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "liabilities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "revenues" (
    "id" SERIAL NOT NULL,
    "source" VARCHAR(255),
    "category" VARCHAR(100),
    "amount" DECIMAL(12,2),
    "received_from" INTEGER,
    "received_on" DATE,
    "payment_method" "PaymentMethod" NOT NULL,
    "related_invoice_id" INTEGER,
    "created_by" INTEGER,
    "transaction_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "revenues_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" SERIAL NOT NULL,
    "lead_id" INTEGER,
    "issue_date" DATE NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "transaction_id" SERIAL NOT NULL,
    "invoice_id" INTEGER,
    "vendor_id" INTEGER,
    "client_id" INTEGER,
    "employee_id" INTEGER,
    "amount" DECIMAL(12,2) NOT NULL,
    "transactionType" "TransactionType" NOT NULL,
    "payment_method" "PaymentWays" NOT NULL,
    "transaction_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "TransactionStatus" NOT NULL,
    "related_refund_id" INTEGER,
    "related_chargeback_id" INTEGER,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("transaction_id")
);

-- CreateTable
CREATE TABLE "net_salary_logs" (
    "id" SERIAL NOT NULL,
    "employee_id" INTEGER NOT NULL,
    "month" VARCHAR(7),
    "net_salary" DECIMAL(12,2),
    "paid_on" DATE,
    "processed_by" INTEGER,
    "deductions" INTEGER,
    "status" "SalaryStatus",
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "net_salary_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendors" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255),
    "contact_person" VARCHAR(255),
    "email" VARCHAR(255),
    "phone" VARCHAR(50),
    "address" TEXT,
    "city" VARCHAR(100),
    "country" VARCHAR(100),
    "bank_account" VARCHAR(255),
    "status" VARCHAR(50),
    "created_by" INTEGER,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vendors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profit_loss" (
    "id" SERIAL NOT NULL,
    "month" VARCHAR(2),
    "year" VARCHAR(4),
    "total_income" DECIMAL(12,2),
    "total_expenses" DECIMAL(12,2),
    "salaries_paid" DECIMAL(12,2),
    "net_profit" DECIMAL(12,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profit_loss_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admins" (
    "id" SERIAL NOT NULL,
    "first_name" VARCHAR(255),
    "last_name" VARCHAR(255),
    "email" VARCHAR(255),
    "password" VARCHAR(255),
    "role" "AdminRole",
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_requests" (
    "id" SERIAL NOT NULL,
    "hr_log_id" INTEGER,
    "description" TEXT,
    "type" "RequestType",
    "status" "AdminRequestStatus",
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendance" (
    "id" SERIAL NOT NULL,
    "employee_id" INTEGER NOT NULL,
    "present_days" INTEGER,
    "absent_days" INTEGER,
    "late_days" INTEGER,
    "leave_days" INTEGER,
    "remote_days" INTEGER,
    "quarterly_leaves" INTEGER,
    "monthly_lates" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendance_logs" (
    "id" SERIAL NOT NULL,
    "employee_id" INTEGER NOT NULL,
    "date" DATE,
    "checkin" TIMESTAMP(3),
    "checkout" TIMESTAMP(3),
    "mode" "WorkingMode",
    "status" "AttendanceStatus",
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attendance_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr" (
    "id" SERIAL NOT NULL,
    "employee_id" INTEGER NOT NULL,
    "attendance_permission" BOOLEAN,
    "salary_permission" BOOLEAN,
    "commission_permission" BOOLEAN,
    "employee_add_permission" BOOLEAN,
    "terminations_handle" BOOLEAN,
    "monthly_leave_request" BOOLEAN,
    "targets_set" BOOLEAN,
    "bonuses_set" BOOLEAN,
    "shift_timing_set" BOOLEAN,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hr_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_logs" (
    "id" SERIAL NOT NULL,
    "hr_id" INTEGER NOT NULL,
    "action_type" VARCHAR(255),
    "affected_employee_id" INTEGER,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hr_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leave_logs" (
    "leave_id" SERIAL NOT NULL,
    "emp_id" INTEGER NOT NULL,
    "leave_type" VARCHAR(255),
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "reason" TEXT,
    "status" "LeaveStatus" DEFAULT 'Pending',
    "applied_on" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewed_by" INTEGER,
    "reviewed_on" TIMESTAMP(3),
    "confirmation_reason" TEXT,
    "is_half_day" BOOLEAN,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leave_logs_pkey" PRIMARY KEY ("leave_id")
);

-- CreateTable
CREATE TABLE "late_logs" (
    "late_log_id" SERIAL NOT NULL,
    "emp_id" INTEGER NOT NULL,
    "date" DATE NOT NULL,
    "scheduled_time_in" VARCHAR(10) NOT NULL,
    "actual_time_in" VARCHAR(10) NOT NULL,
    "minutes_late" INTEGER NOT NULL,
    "reason" TEXT,
    "justified" BOOLEAN DEFAULT false,
    "action_taken" "LateAction" NOT NULL DEFAULT 'Pending',
    "confirmation_reason" "ConfirmationAction" NOT NULL,
    "reviewed_by" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "late_logs_pkey" PRIMARY KEY ("late_log_id")
);

-- CreateTable
CREATE TABLE "monthly_attendance_summary" (
    "summary_id" SERIAL NOT NULL,
    "emp_id" INTEGER NOT NULL,
    "month" VARCHAR(7) NOT NULL,
    "total_present" INTEGER NOT NULL,
    "total_absent" INTEGER NOT NULL,
    "total_leave_days" INTEGER NOT NULL,
    "total_late_days" INTEGER NOT NULL,
    "total_remote_days" INTEGER NOT NULL,
    "generated_on" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "monthly_attendance_summary_pkey" PRIMARY KEY ("summary_id")
);

-- CreateTable
CREATE TABLE "project_chats" (
    "id" SERIAL NOT NULL,
    "project_id" INTEGER,
    "participants" JSONB,
    "transferred_from" INTEGER,
    "transferred_to" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_chats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_participants" (
    "id" SERIAL NOT NULL,
    "chat_id" INTEGER NOT NULL,
    "employee_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "member_type" "chPart" NOT NULL,

    CONSTRAINT "chat_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_messages" (
    "id" SERIAL NOT NULL,
    "chat_id" INTEGER NOT NULL,
    "sender_id" INTEGER NOT NULL,
    "message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meetings" (
    "id" SERIAL NOT NULL,
    "employee_id" INTEGER,
    "client_id" INTEGER,
    "project_id" INTEGER,
    "topic" TEXT,
    "date_time" TIMESTAMP(3),
    "status" "MeetingStatus",
    "auto_reminder" BOOLEAN NOT NULL DEFAULT true,
    "meetingLink" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "meetings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" SERIAL NOT NULL,
    "status" "NotificationStatus" DEFAULT 'unread',
    "sent_to" INTEGER,
    "sent_by" INTEGER,
    "heading" VARCHAR(255),
    "content" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_requested" (
    "request_id" SERIAL NOT NULL,
    "emp_id" INTEGER NOT NULL,
    "department_id" INTEGER,
    "request_type" VARCHAR(255),
    "subject" VARCHAR(255),
    "description" TEXT,
    "priority" "RequestPriority" DEFAULT 'Low',
    "status" "RequestStatus" DEFAULT 'Pending',
    "assigned_to" INTEGER,
    "response_notes" TEXT,
    "requested_on" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_on" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hr_requested_pkey" PRIMARY KEY ("request_id")
);

-- CreateTable
CREATE TABLE "companies" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "address" VARCHAR(255),
    "city" VARCHAR(100),
    "state" VARCHAR(100),
    "zip" VARCHAR(20),
    "country" VARCHAR(100),
    "phone" VARCHAR(20),
    "email" VARCHAR(255),
    "website" VARCHAR(255),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "quarterly_leaves_days" INTEGER NOT NULL,
    "monthly_lates_days" INTEGER NOT NULL,
    "absent_deduction" INTEGER NOT NULL,
    "late_deduction" INTEGER NOT NULL,
    "taxId" VARCHAR(100),
    "late_time" INTEGER NOT NULL,
    "half_time" INTEGER NOT NULL,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "complaints" (
    "complaint_id" SERIAL NOT NULL,
    "raised_by" INTEGER NOT NULL,
    "against_employee_id" INTEGER,
    "department_id" INTEGER,
    "complaint_type" VARCHAR(255),
    "subject" VARCHAR(255),
    "description" TEXT,
    "status" "ComplaintStatus" DEFAULT 'Open',
    "priority" "ComplaintPriority" DEFAULT 'Low',
    "assigned_to" INTEGER,
    "resolution_notes" TEXT,
    "resolution_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "complaints_pkey" PRIMARY KEY ("complaint_id")
);

-- CreateTable
CREATE TABLE "reminders" (
    "reminder_id" SERIAL NOT NULL,
    "emp_id" INTEGER NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "reminder_date" DATE NOT NULL,
    "reminder_time" VARCHAR(10) NOT NULL,
    "is_recurring" BOOLEAN NOT NULL,
    "recurrence_pattern" "RecurrencePattern",
    "status" "ReminderStatus" NOT NULL DEFAULT 'Pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reminders_pkey" PRIMARY KEY ("reminder_id")
);

-- CreateTable
CREATE TABLE "campaign_logs" (
    "campaign_id" SERIAL NOT NULL,
    "campaign_name" VARCHAR(255) NOT NULL,
    "campaign_type" VARCHAR(255) NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "status" "CampaignStatus" NOT NULL,
    "budget" DECIMAL(12,2) NOT NULL,
    "actual_cost" DECIMAL(12,2),
    "unit_id" INTEGER NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "productionUnitId" INTEGER,

    CONSTRAINT "campaign_logs_pkey" PRIMARY KEY ("campaign_id")
);

-- CreateTable
CREATE TABLE "client_payment" (
    "payment_id" SERIAL NOT NULL,
    "client_id" INTEGER NOT NULL,
    "invoice_id" INTEGER,
    "project_id" INTEGER,
    "payment_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "amount_paid" DECIMAL(12,2) NOT NULL,
    "payment_method" VARCHAR(50) NOT NULL,
    "transaction_id" VARCHAR(255),
    "payment_status" "PaymentStatus" NOT NULL,
    "notes" TEXT,
    "payment_phase" INTEGER NOT NULL,
    "receipt_url" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "client_payment_pkey" PRIMARY KEY ("payment_id")
);

-- CreateTable
CREATE TABLE "archive_leads" (
    "archive_id" SERIAL NOT NULL,
    "lead_id" INTEGER NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(20) NOT NULL,
    "source" "ArchiveLeadSource" NOT NULL,
    "assigned_to" INTEGER NOT NULL,
    "unit_id" INTEGER NOT NULL,
    "outcome" "ArchiveLeadOutcome" NOT NULL,
    "quality_rating" "ArchiveLeadQualityRating" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,
    "archived_on" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "archive_leads_pkey" PRIMARY KEY ("archive_id")
);

-- CreateTable
CREATE TABLE "project_tasks" (
    "task_id" SERIAL NOT NULL,
    "project_id" INTEGER NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "assigned_by" INTEGER NOT NULL,
    "assigned_to" INTEGER NOT NULL,
    "priority" "ProjectTaskPriority" NOT NULL,
    "status" "ProjectTaskStatus" NOT NULL,
    "difficulty" "ProjectTaskDifficulty",
    "start_date" DATE,
    "due_date" DATE,
    "completed_on" DATE,
    "comments" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_tasks_pkey" PRIMARY KEY ("task_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "employees_email_key" ON "employees"("email");

-- CreateIndex
CREATE UNIQUE INDEX "departments_name_key" ON "departments"("name");

-- CreateIndex
CREATE UNIQUE INDEX "departments_manager_id_key" ON "departments"("manager_id");

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "marketing_units_name_key" ON "marketing_units"("name");

-- CreateIndex
CREATE UNIQUE INDEX "production_units_name_key" ON "production_units"("name");

-- CreateIndex
CREATE UNIQUE INDEX "industries_name_key" ON "industries"("name");

-- CreateIndex
CREATE UNIQUE INDEX "sales_units_name_key" ON "sales_units"("name");

-- CreateIndex
CREATE UNIQUE INDEX "sales_units_email_key" ON "sales_units"("email");

-- CreateIndex
CREATE UNIQUE INDEX "sales_units_phone_key" ON "sales_units"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "accountants_employee_id_key" ON "accountants"("employee_id");

-- CreateIndex
CREATE UNIQUE INDEX "hr_employee_id_key" ON "hr"("employee_id");

-- CreateIndex
CREATE UNIQUE INDEX "archive_leads_lead_id_key" ON "archive_leads"("lead_id");

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_manager_id_fkey" FOREIGN KEY ("manager_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_team_lead_id_fkey" FOREIGN KEY ("team_lead_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "departments" ADD CONSTRAINT "departments_manager_id_fkey" FOREIGN KEY ("manager_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing" ADD CONSTRAINT "marketing_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing" ADD CONSTRAINT "marketing_marketing_unit_id_fkey" FOREIGN KEY ("marketing_unit_id") REFERENCES "marketing_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing_units" ADD CONSTRAINT "marketing_units_head_id_fkey" FOREIGN KEY ("head_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_cracked_lead_id_fkey" FOREIGN KEY ("cracked_lead_id") REFERENCES "cracked_leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_sales_rep_id_fkey" FOREIGN KEY ("sales_rep_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_team_lead_id_fkey" FOREIGN KEY ("team_lead_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_unit_head_id_fkey" FOREIGN KEY ("unit_head_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_logs" ADD CONSTRAINT "project_logs_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_logs" ADD CONSTRAINT "project_logs_developer_id_fkey" FOREIGN KEY ("developer_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production" ADD CONSTRAINT "production_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production" ADD CONSTRAINT "production_production_unit_id_fkey" FOREIGN KEY ("production_unit_id") REFERENCES "production_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_units" ADD CONSTRAINT "production_units_head_id_fkey" FOREIGN KEY ("head_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teams" ADD CONSTRAINT "teams_team_lead_id_fkey" FOREIGN KEY ("team_lead_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teams" ADD CONSTRAINT "teams_current_project_id_fkey" FOREIGN KEY ("current_project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teams" ADD CONSTRAINT "teams_sales_unit_id_fkey" FOREIGN KEY ("sales_unit_id") REFERENCES "sales_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teams" ADD CONSTRAINT "teams_production_unit_id_fkey" FOREIGN KEY ("production_unit_id") REFERENCES "production_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teams" ADD CONSTRAINT "teams_marketing_unit_id_fkey" FOREIGN KEY ("marketing_unit_id") REFERENCES "marketing_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_industry_id_fkey" FOREIGN KEY ("industry_id") REFERENCES "industries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_cracked_by_fkey" FOREIGN KEY ("cracked_by") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_started_by_fkey" FOREIGN KEY ("started_by") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_closed_by_fkey" FOREIGN KEY ("closed_by") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_sales_unit_id_fkey" FOREIGN KEY ("sales_unit_id") REFERENCES "sales_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_units" ADD CONSTRAINT "sales_units_head_id_fkey" FOREIGN KEY ("head_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_comments" ADD CONSTRAINT "lead_comments_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_comments" ADD CONSTRAINT "lead_comments_comment_by_fkey" FOREIGN KEY ("comment_by") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_departments" ADD CONSTRAINT "sales_departments_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_departments" ADD CONSTRAINT "sales_departments_sales_unit_id_fkey" FOREIGN KEY ("sales_unit_id") REFERENCES "sales_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cracked_leads" ADD CONSTRAINT "cracked_leads_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cracked_leads" ADD CONSTRAINT "cracked_leads_closed_by_fkey" FOREIGN KEY ("closed_by") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_refunded_by_fkey" FOREIGN KEY ("refunded_by") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chargebacks" ADD CONSTRAINT "chargebacks_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chargebacks" ADD CONSTRAINT "chargebacks_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chargebacks" ADD CONSTRAINT "chargebacks_handled_by_fkey" FOREIGN KEY ("handled_by") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "access_logs" ADD CONSTRAINT "access_logs_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_outcome_history" ADD CONSTRAINT "lead_outcome_history_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_outcome_history" ADD CONSTRAINT "lead_outcome_history_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_outcome_history" ADD CONSTRAINT "lead_outcome_history_comment_id_fkey" FOREIGN KEY ("comment_id") REFERENCES "lead_comments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accountants" ADD CONSTRAINT "accountants_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assets" ADD CONSTRAINT "assets_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "transactions"("transaction_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "liabilities" ADD CONSTRAINT "liabilities_related_vendor_id_fkey" FOREIGN KEY ("related_vendor_id") REFERENCES "vendors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "liabilities" ADD CONSTRAINT "liabilities_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "revenues" ADD CONSTRAINT "revenues_received_from_fkey" FOREIGN KEY ("received_from") REFERENCES "leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "revenues" ADD CONSTRAINT "revenues_related_invoice_id_fkey" FOREIGN KEY ("related_invoice_id") REFERENCES "invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "revenues" ADD CONSTRAINT "revenues_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "revenues" ADD CONSTRAINT "revenues_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "transactions"("transaction_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_related_refund_id_fkey" FOREIGN KEY ("related_refund_id") REFERENCES "refunds"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_related_chargeback_id_fkey" FOREIGN KEY ("related_chargeback_id") REFERENCES "chargebacks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "net_salary_logs" ADD CONSTRAINT "net_salary_logs_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "net_salary_logs" ADD CONSTRAINT "net_salary_logs_processed_by_fkey" FOREIGN KEY ("processed_by") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendors" ADD CONSTRAINT "vendors_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_requests" ADD CONSTRAINT "admin_requests_hr_log_id_fkey" FOREIGN KEY ("hr_log_id") REFERENCES "hr_logs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_logs" ADD CONSTRAINT "attendance_logs_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr" ADD CONSTRAINT "hr_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_logs" ADD CONSTRAINT "hr_logs_hr_id_fkey" FOREIGN KEY ("hr_id") REFERENCES "hr"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_logs" ADD CONSTRAINT "hr_logs_affected_employee_id_fkey" FOREIGN KEY ("affected_employee_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leave_logs" ADD CONSTRAINT "leave_logs_emp_id_fkey" FOREIGN KEY ("emp_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leave_logs" ADD CONSTRAINT "leave_logs_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "late_logs" ADD CONSTRAINT "late_logs_emp_id_fkey" FOREIGN KEY ("emp_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "late_logs" ADD CONSTRAINT "late_logs_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monthly_attendance_summary" ADD CONSTRAINT "monthly_attendance_summary_emp_id_fkey" FOREIGN KEY ("emp_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_chats" ADD CONSTRAINT "project_chats_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_chats" ADD CONSTRAINT "project_chats_transferred_from_fkey" FOREIGN KEY ("transferred_from") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_chats" ADD CONSTRAINT "project_chats_transferred_to_fkey" FOREIGN KEY ("transferred_to") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_participants" ADD CONSTRAINT "chat_participants_chat_id_fkey" FOREIGN KEY ("chat_id") REFERENCES "project_chats"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_participants" ADD CONSTRAINT "chat_participants_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_chat_id_fkey" FOREIGN KEY ("chat_id") REFERENCES "project_chats"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meetings" ADD CONSTRAINT "meetings_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meetings" ADD CONSTRAINT "meetings_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meetings" ADD CONSTRAINT "meetings_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_sent_to_fkey" FOREIGN KEY ("sent_to") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_sent_by_fkey" FOREIGN KEY ("sent_by") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_requested" ADD CONSTRAINT "hr_requested_emp_id_fkey" FOREIGN KEY ("emp_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_requested" ADD CONSTRAINT "hr_requested_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_requested" ADD CONSTRAINT "hr_requested_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "complaints" ADD CONSTRAINT "complaints_raised_by_fkey" FOREIGN KEY ("raised_by") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "complaints" ADD CONSTRAINT "complaints_against_employee_id_fkey" FOREIGN KEY ("against_employee_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "complaints" ADD CONSTRAINT "complaints_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "complaints" ADD CONSTRAINT "complaints_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_emp_id_fkey" FOREIGN KEY ("emp_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_logs" ADD CONSTRAINT "campaign_logs_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "marketing_units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_logs" ADD CONSTRAINT "campaign_logs_productionUnitId_fkey" FOREIGN KEY ("productionUnitId") REFERENCES "production_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_payment" ADD CONSTRAINT "client_payment_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_payment" ADD CONSTRAINT "client_payment_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_payment" ADD CONSTRAINT "client_payment_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_payment" ADD CONSTRAINT "client_payment_payment_phase_fkey" FOREIGN KEY ("payment_phase") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "archive_leads" ADD CONSTRAINT "archive_leads_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "archive_leads" ADD CONSTRAINT "archive_leads_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "archive_leads" ADD CONSTRAINT "archive_leads_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "sales_units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_tasks" ADD CONSTRAINT "project_tasks_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_tasks" ADD CONSTRAINT "project_tasks_assigned_by_fkey" FOREIGN KEY ("assigned_by") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_tasks" ADD CONSTRAINT "project_tasks_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
