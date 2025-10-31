import { Controller, Post, Get, Param, Query, UseGuards, BadRequestException, Patch, Body, Request } from '@nestjs/common';
import { FinanceSalaryService } from './salary.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { Permissions } from '../../../common/decorators/permissions.decorator';
import { PermissionName } from '../../../common/constants/permission.enum';
import { Departments } from '../../../common/decorators/departments.decorator';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { MarkPaidBulkDto } from './dto/mark-paid.dto';

interface AuthenticatedRequest extends Request {
  user: {
    id: number;
    role: string | number;
    type: string;
    department?: string;
    permissions?: any;
  };
}

@ApiTags('Finance Salary')
@ApiBearerAuth()
@Controller('finance/salary')
export class FinanceSalaryController {
  constructor(private readonly financeSalaryService: FinanceSalaryService) {}

  /**
   * Trigger automatic salary calculation for all active employees
   * 
   * This endpoint manually triggers the salary calculation process that normally runs
   * via cron job on the 4th of every month. It calculates salary (base + bonus + commissions)
   * and deductions for all active employees and stores the results in net_salary_logs.
   * 
   * Use cases:
   * - Manual salary processing outside the scheduled time
   * - Testing the salary calculation system
   * 
   * @returns Success message confirming salary calculation completion
   * 
   * Required Permissions: salary_permission
   */
  @Post('calculate-all')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Permissions(PermissionName.salary_permission)
  @ApiOperation({ summary: 'Trigger salary calculation for all active employees' })
  @ApiResponse({ 
    status: 200, 
    description: 'Salary calculation triggered for all employees',
    schema: {
      type: 'object',
      properties: {
        totalEmployees: { type: 'number' },
        successful: { type: 'number' },
        failed: { type: 'number' },
        results: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              employeeId: { type: 'number' },
              employeeName: { type: 'string' },
              status: { type: 'string' },
              logId: { type: 'number', nullable: true },
              error: { type: 'string', nullable: true }
            }
          }
        }
      }
    }
  })
  async calculateAllSalaries() {
    const data = await this.financeSalaryService.handleMonthlySalaryCalculation();
    return data;
  }

  /**
   * Read-only salary calculation for current period (up to current date)
   * 
   * This endpoint calculates salary (base + bonus + commissions) and deductions
   * for the current period but does NOT update the database. It's used for
   * real-time salary preview and analysis.
   * 
   * - For old employees: 1st of current month to current date
   * - For new employees: start date to current date
   * - For terminated employees: 1st/start date to termination date
   * 
   * @param employeeId - Employee ID to calculate salary for
   * @param endDate - Optional end date (defaults to current date)
   * @returns Detailed salary calculation with employee info, salary breakdown, and calculation period
   * 
   * Required Permissions: salary_permission
   */
  @Get('preview/:employeeId')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Permissions(PermissionName.salary_permission)
  @ApiOperation({ summary: 'Read-only salary preview for an employee' })
  @ApiParam({ name: 'employeeId', description: 'Employee ID to calculate salary for', type: Number })
  @ApiQuery({ name: 'endDate', description: 'Optional end date (YYYY-MM-DD)', required: false })
  @ApiResponse({ status: 200, description: 'Salary preview calculated successfully' })
  async calculateSalaryPreview(
    @Param('employeeId') employeeId: string,
    @Query('endDate') endDate?: string
  ) {
    const employeeIdNum = parseInt(employeeId);
    if (isNaN(employeeIdNum) || employeeIdNum <= 0) {
      throw new BadRequestException('Invalid employeeId. Must be a positive number.');
    }

    const result = await this.financeSalaryService.calculateSalaryPreview(employeeIdNum, endDate);
    return result;
  }

  /**
   * Get comprehensive salary display for all employees with detailed breakdown
   * 
   * This endpoint retrieves comprehensive salary information for all active employees
   * including:
   * - Salary components (base salary, commission, bonus, deductions)
   * - Final salary calculation using formula: Base Salary + Bonus + Commission - Deductions
   * - Summary totals for all salary components
   * - Pagination support for efficient data retrieval
   * 
   * This is designed for frontend consumption to display complete salary information
   * in salary management dashboards and reports.
   * 
   * @param month - Optional month in YYYY-MM format (defaults to current month)
   * @param page - Page number (defaults to 1)
   * @param limit - Number of records per page (defaults to 20, max 100)
   * @returns Comprehensive salary information for all employees with detailed breakdown and pagination
   * 
   * Required Permissions: salary_permission
   */
  @Get('display-all')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Permissions(PermissionName.salary_permission)
  @ApiOperation({ summary: 'Get comprehensive salary display for all employees with pagination' })
  @ApiQuery({ name: 'month', description: 'Optional month (YYYY-MM)', required: false })
  @ApiQuery({ name: 'page', description: 'Page number (defaults to 1)', required: false, type: Number })
  @ApiQuery({ name: 'limit', description: 'Number of records per page (defaults to 20, max 100)', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'All salaries display returned successfully',
    schema: {
      type: 'object',
      properties: {
        month: { type: 'string' },
        summary: {
          type: 'object',
          properties: {
            totalEmployees: { type: 'number' },
            totalBaseSalary: { type: 'number' },
            totalCommission: { type: 'number' },
            totalBonus: { type: 'number' },
            totalNetSalary: { type: 'number' },
            totalDeductions: { type: 'number' },
            totalFinalSalary: { type: 'number' },
          },
        },
        employees: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              employeeId: { type: 'number' },
              employeeName: { type: 'string' },
              department: { type: 'string' },
              month: { type: 'string' },
              baseSalary: { type: 'number' },
              commission: { type: 'number' },
              bonus: { type: 'number' },
              netSalary: { type: 'number' },
              attendanceDeductions: { type: 'number' },
              chargebackDeduction: { type: 'number' },
              refundDeduction: { type: 'number' },
              deductions: { type: 'number' },
              finalSalary: { type: 'number' },
              status: { type: 'string', enum: ['paid', 'unpaid'] },
              paidOn: { type: 'string', format: 'date-time', nullable: true },
              createdAt: { type: 'string', format: 'date-time' },
            },
          },
        },
        pagination: {
          type: 'object',
          properties: {
            page: { type: 'number' },
            limit: { type: 'number' },
            total: { type: 'number' },
            totalPages: { type: 'number' },
            retrieved: { type: 'number' },
          },
        },
      },
    },
  })
  async getAllSalariesDisplay(
    @Query('month') month?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    const result = await this.financeSalaryService.getAllSalariesDisplay(month, pageNum, limitNum);
    return result;
  }

  /**
   * Get detailed salary breakdown for a specific employee
   * 
   * This endpoint provides comprehensive salary information for a specific employee,
   * including:
   * - Detailed salary breakdown (base, commission, bonus, deductions, final salary)
   * - Commission breakdown by project
   * - Deduction breakdown by type
   * - Complete audit trail of salary components
   * 
   * This is designed for detailed employee salary analysis and frontend modal/detail views
   * when an employee row is clicked in the salary display.
   * 
   * @param employeeId - Employee ID to get detailed breakdown for
   * @param month - Optional month in YYYY-MM format (defaults to current month)
   * @returns Comprehensive salary breakdown with all details for the specific employee
   * 
   * Required Permissions: salary_permission
   */
  @Get('breakdown/:employeeId')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Permissions(PermissionName.salary_permission)
  @ApiOperation({ summary: 'Get detailed salary breakdown for a specific employee' })
  @ApiParam({ name: 'employeeId', description: 'Employee ID to get detailed breakdown for', type: Number })
  @ApiQuery({ name: 'month', description: 'Optional month (YYYY-MM)', required: false })
  @ApiResponse({ status: 200, description: 'Detailed salary breakdown returned successfully' })
  async getDetailedSalaryBreakdown(
    @Param('employeeId') employeeId: string,
    @Query('month') month?: string
  ) {
    const result = await this.financeSalaryService.getDetailedSalaryBreakdown(parseInt(employeeId), month);
    return result;
  }

  /**
   * Get sales employees with sales amount greater than 3000, ordered alphabetically
   * 
   * This endpoint retrieves sales employees from the sales department who have
   * sales amount greater than 3000, ordered alphabetically by name.
   * 
   * @returns Array of sales employees with id, name, and sales amount
   * 
   * Required Permissions: salary_permission
   */
  @Get('bonus-display')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Permissions(PermissionName.salary_permission)
  @ApiOperation({ summary: 'Get sales employees with sales amount > 3000' })
  @ApiResponse({ status: 200, description: 'Sales employees bonus display returned successfully' })
  async getSalesEmployeesBonusDisplay() {
    const result = await this.financeSalaryService.getSalesEmployeesBonusDisplay();
    return result;
  }

  /**
   * Update bonus amount for sales employees with sales amount >= 3000
   * 
   * This endpoint allows admins to update the bonus amount for sales employees
   * who have sales amount greater than or equal to 3000.
   * 
   * @param employeeId - Employee ID to update bonus for
   * @param bonusAmount - New bonus amount to set
   * @returns Updated employee data with success message
   * 
   * Required Permissions: Admin access (bypass using non-existent department)
   */
  @Patch('update-sales-bonus')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Departments('Admin', 'NonExistentDepartment')
  @Permissions(PermissionName.salary_permission)
  @ApiOperation({ summary: 'Update bonus amount for sales employees with sales >= 3000' })
  @ApiBody({ description: 'Employee ID and bonus amount', schema: { example: { employee_id: 1, bonusAmount: 5000 } } })
  @ApiResponse({ status: 200, description: 'Sales employee bonus updated successfully' })
  async updateSalesEmployeeBonus(@Body() body: { employee_id: number; bonusAmount: number }) {
    const result = await this.financeSalaryService.updateSalesEmployeeBonus(body.employee_id, body.bonusAmount);
    return result;
  }

  /**
   * Mark salary as paid for a single employee
   * 
   * This endpoint marks a specific employee's salary as paid for a given month.
   * It updates the status to 'paid' and sets the paidOn timestamp.
   * 
   * @param employeeId - Employee ID to mark as paid
   * @param month - Optional month in YYYY-MM format (defaults to current month)
   * @param req - Authenticated request containing user information
   * @returns Updated salary log information with payment details
   * 
   * Required Permissions: salary_permission
   */
  @Patch('mark-paid/:employeeId')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Permissions(PermissionName.salary_permission)
  @ApiOperation({ summary: 'Mark salary as paid for a single employee' })
  @ApiParam({ name: 'employeeId', description: 'Employee ID to mark as paid', type: Number })
  @ApiQuery({ name: 'month', description: 'Optional month (YYYY-MM)', required: false })
  @ApiResponse({
    status: 200,
    description: 'Salary marked as paid successfully',
    schema: {
      type: 'object',
      properties: {
        employeeId: { type: 'number' },
        employeeName: { type: 'string' },
        month: { type: 'string' },
        status: { type: 'string', enum: ['paid'] },
        paidOn: { type: 'string', format: 'date-time' },
        processedBy: { type: 'number' },
        processedByRole: { type: 'string', enum: ['Employee', 'Admin'] },
        message: { type: 'string' },
      },
    },
  })
  async markSalaryAsPaid(
    @Param('employeeId') employeeId: string,
    @Query('month') month: string | undefined,
    @Request() req: AuthenticatedRequest,
  ) {
    const employeeIdNum = parseInt(employeeId);
    if (isNaN(employeeIdNum) || employeeIdNum <= 0) {
      throw new BadRequestException('Invalid employeeId. Must be a positive number.');
    }

    if (!req.user || !req.user.id) {
      throw new BadRequestException('User information not found in request.');
    }

    const processedByRole = req.user.type === 'admin' ? 'Admin' : 'Employee';
    const result = await this.financeSalaryService.markSalaryAsPaid(
      employeeIdNum,
      month,
      req.user.id,
      processedByRole,
    );
    return result;
  }

  /**
   * Mark salaries as paid for multiple employees in bulk
   * 
   * This endpoint marks salaries as paid for multiple employees in a single operation.
   * It updates the status to 'paid' and sets the paidOn timestamp for all specified employees.
   * 
   * @param body - Request body containing employeeIds array and optional month
   * @param req - Authenticated request containing user information
   * @returns Summary of bulk operation with results for each employee
   * 
   * Required Permissions: salary_permission
   */
  @Patch('mark-paid-bulk')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Permissions(PermissionName.salary_permission)
  @ApiOperation({ summary: 'Mark salaries as paid for multiple employees in bulk' })
  @ApiBody({ type: MarkPaidBulkDto })
  @ApiResponse({
    status: 200,
    description: 'Bulk mark as paid operation completed',
    schema: {
      type: 'object',
      properties: {
        month: { type: 'string' },
        totalEmployees: { type: 'number' },
        successful: { type: 'number' },
        alreadyPaid: { type: 'number' },
        failed: { type: 'number' },
        results: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              employeeId: { type: 'number' },
              employeeName: { type: 'string' },
              status: { type: 'string', enum: ['success', 'error', 'skipped'] },
              message: { type: 'string' },
              month: { type: 'string', nullable: true },
              paidOn: { type: 'string', format: 'date-time', nullable: true },
            },
          },
        },
      },
    },
  })
  async markSalariesAsPaidBulk(
    @Body() body: MarkPaidBulkDto,
    @Request() req: AuthenticatedRequest,
  ) {
    if (!req.user || !req.user.id) {
      throw new BadRequestException('User information not found in request.');
    }

    const processedByRole = req.user.type === 'admin' ? 'Admin' : 'Employee';
    const result = await this.financeSalaryService.markSalariesAsPaidBulk(
      body.employeeIds,
      body.month,
      req.user.id,
      processedByRole,
    );
    return result;
  }
} 