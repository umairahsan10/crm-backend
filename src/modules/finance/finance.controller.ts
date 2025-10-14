import { Body, Controller, Post, UseGuards, Get, Param, Query, BadRequestException } from '@nestjs/common';
import { FinanceService } from './finance.service';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PermissionName } from '../../common/constants/permission.enum';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { DepartmentsGuard } from '../../common/guards/departments.guard';
import { Departments } from '../../common/decorators/departments.decorator';
import { AssignCommissionDto } from './dto/assign-commission.dto';
import { UpdateWithholdFlagDto } from './dto/update-withhold-flag.dto';
import { TransferCommissionDto } from './dto/transfer-commission.dto';
import { RoleName } from '@prisma/client';
import { Roles } from 'src/common/decorators/roles.decorator';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';

@ApiTags('Salary')


@Controller('salary')
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  /**
   * Trigger automatic salary calculation for all active employees
   * 
   * This endpoint manually triggers the same process that runs automatically
   * via cron job on the 4th of every month. It calculates salary (base + bonus + commissions)
   * and deductions for all active employees and stores the results in net_salary_logs.
   * 
   * This is useful for:
   * - Manual salary processing outside the scheduled time
   * - Testing the salary calculation system
   * - Processing salaries for specific scenarios
   * 
   * @returns Success message confirming salary calculation completion
   * 
   * Note: No authentication required for this endpoint (cron job compatibility)
   */
  @Post('auto')
  @ApiOperation({ summary: 'Trigger automatic salary calculation for all employees' })
  @ApiResponse({
    status: 200,
    description: 'Salary calculation triggered successfully',
    schema: { example: { message: 'Salary calculation triggered for all employees' } },
  })
  async calculateAll() {
    await this.financeService.calculateAllEmployees();
    return { message: 'Salary calculation triggered for all employees' };
  }



  /**
   * Read-only salary calculation for current period (up to current date)
   * 
   * This endpoint calculates salary (base + bonus + commissions) and deductions
   * for a specific employee but does NOT update the database. It's used for
   * real-time salary preview and analysis.
   * 
   * Smart Calculation automatically determines the calculation period:
   * - For old employees: 1st of current month to current date
   * - For new employees: start date to current date
   * - For terminated employees: 1st/start date to termination date
   * 
   * @param employeeId - Employee ID to calculate salary for
   * @param endDate - Optional end date (defaults to current date)
   * @returns Detailed salary calculation with employee info, salary breakdown, and calculation period
   * 
   * Required Permissions: salary_permission
   * Required Department: HR or Accounts
   */
  @Get('calculate/:employeeId')
  @UseGuards(JwtAuthGuard, RolesGuard, DepartmentsGuard, PermissionsGuard)
  @Departments('HR', 'Accounts')
  @Permissions(PermissionName.salary_permission)
  @ApiOperation({ summary: 'Read-only salary calculation preview for a specific employee' })
  @ApiParam({ name: 'employeeId', description: 'ID of the employee', type: Number, example: 123 })
  @ApiQuery({ name: 'endDate', description: 'Optional end date (YYYY-MM-DD)', required: false, example: '2025-10-14' })
  @ApiResponse({
    status: 200,
    description: 'Salary preview for a specific employee including all components',
    schema: {
      example: {
        employee: {
          id: 123,
          firstName: 'John',
          lastName: 'Doe',
          department: 'Sales',
          status: 'active',
          startDate: '2023-01-01',
          email: 'john@example.com',
        },
        period: { start: '2025-10-01', end: '2025-10-14' },
        salaryComponents: {
          baseSalary: 50000,
          commission: 2500,
          bonus: 1000,
          totalEarnings: 53500,
          deductions: {
            attendance: 300,
            chargeback: 200,
            refund: 100,
            lateDays: 2,
            halfDays: 1,
            total: 600,
          },
          finalSalary: 52900,
        },
        commissionBreakdown: [
          { projectId: 1, projectName: 'Project Alpha', clientName: 'ABC Corp', projectValue: 50000, commissionRate: 5, commissionAmount: 2500, completedAt: '2025-10-10', status: 'completed' }
        ],
        deductionBreakdown: {
          absentDetails: [],
          lateDetails: [{ day: 2, deduction: 100, reason: 'Late (excess)' }],
          halfDayDetails: [{ day: 3, deduction: 50, reason: 'Half day' }],
          chargebackDeduction: 200,
          refundDeduction: 100,
          totalDeduction: 600,
        },
      },
    },
  })
  async calculate(@Param('employeeId') employeeId: string, @Query('endDate') endDate?: string) {
    console.log('Finance controller - calculate preview endpoint called for employee:', employeeId, 'endDate:', endDate);

    // Validate employeeId
    if (!employeeId || isNaN(parseInt(employeeId))) {
      throw new BadRequestException('Invalid employee ID provided');
    }

    const employeeIdNum = parseInt(employeeId);
    console.log('Parsed employee ID:', employeeIdNum);

    try {
      const result = await this.financeService.calculateSalaryPreview(employeeIdNum, endDate);
      return result;
    } catch (error) {
      console.error('Error in finance controller calculate preview:', error);
      throw error;
    }
  }

  /**
   * Get salary display for a specific employee with deductions subtracted
   * 
   * This endpoint retrieves the latest salary record for an employee and returns
   * the salary information formatted for frontend display, including:
   * - Net salary (base + bonus + commissions)
   * - Deductions amount
   * - Final salary (net salary - deductions)
   * - Payment status and dates
   * 
   * This is designed for frontend consumption to display salary information
   * to employees or HR personnel with deductions already subtracted.
   * 
   * @param employeeId - Employee ID to retrieve salary for
   * @param month - Optional month in YYYY-MM format (defaults to current month)
   * @returns Salary display information with deductions subtracted
   * 
   * Required Permissions: salary_permission
   * Required Department: HR or Accounts
   */
  @Get('display/:employeeId')
  @UseGuards(JwtAuthGuard, RolesGuard, DepartmentsGuard, PermissionsGuard)
  @Departments('HR', 'Accounts')
  @Permissions(PermissionName.salary_permission)
  @ApiOperation({ summary: 'Get salary display for a specific employee with deductions applied' })
  @ApiParam({ name: 'employeeId', description: 'ID of the employee', type: Number, example: 123 })
  @ApiQuery({ name: 'month', description: 'Month in YYYY-MM format', required: false, example: '2025-10' })
  @ApiResponse({
    status: 200,
    description: 'Salary display with all deductions subtracted',
    schema: {
      example: {
        employeeId: 123,
        employeeName: 'John Doe',
        month: '2025-10',
        netSalary: 55000,
        deductions: {
          attendance: 300,
          chargeback: 200,
          refund: 100,
          lateDays: 2,
          halfDays: 1,
          total: 600,
        },
        finalSalary: 54400,
        status: 'paid',
        paidOn: '2025-10-05',
      },
    },
  })
  async getSalaryDisplay(@Param('employeeId') employeeId: string, @Query('month') month?: string) {
    const result = await this.financeService.getSalaryDisplay(parseInt(employeeId), month);
    return result;
  }

  /**
   * Get comprehensive salary display for all employees with detailed breakdown
   * 
   * This endpoint retrieves comprehensive salary information for all active employees
   * for a specific month, including:
   * - Employee details (ID, name, department)
   * - Salary components (base salary, commission, bonus, deductions)
   * - Final salary calculation using formula: Base Salary + Bonus + Commission - Deductions
   * - Summary totals for all salary components
   * 
   * This is designed for frontend consumption to display complete salary information
   * for payroll processing, HR review, and financial reporting.
   * 
   * @param month - Optional month in YYYY-MM format (defaults to current month)
   * @returns Comprehensive salary information for all employees with detailed breakdown
   * 
   * Required Permissions: salary_permission
   * Required Department: HR or Accounts
   */
  @Get('display')
  @UseGuards(JwtAuthGuard, RolesGuard, DepartmentsGuard, PermissionsGuard)
  @Departments('HR', 'Accounts')
  @Permissions(PermissionName.salary_permission)
  @ApiOperation({ summary: 'Get comprehensive salary display for all employees' })
  @ApiQuery({ name: 'month', description: 'Month in YYYY-MM format', required: false, example: '2025-10' })
  @ApiResponse({
    status: 200,
    description: 'All employees salaries with full breakdown',
    schema: {
      example: {
        month: '2025-10',
        totalEmployees: 5,
        totalBaseSalary: 250000,
        totalCommission: 12000,
        totalBonus: 8000,
        totalDeductions: 15000,
        totalFinalSalary: 255000,
        results: [
          {
            employeeId: 123,
            firstName: 'John',
            lastName: 'Doe',
            department: 'Sales',
            baseSalary: 50000,
            commission: 2500,
            bonus: 1000,
            deductions: 600,
            finalSalary: 52900,
            status: 'paid',
          },
        ],
      },
    },
  })
  async getAllSalariesDisplay(@Query('month') month?: string) {
    const result = await this.financeService.getAllSalariesDisplay(month);
    return result;
  }

  /**
   * Get detailed salary breakdown for a specific employee
   * 
   * This endpoint provides comprehensive salary information for a specific employee,
   * including:
   * - Complete employee details and department information
   * - Detailed salary breakdown (base, commission, bonus, deductions, final salary)
   * - Commission breakdown by projects (which projects contributed and how much)
   * - Detailed deduction breakdown (absent, late, half-day with progressive calculations)
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
   * Required Department: HR or Accounts
   */
  @Get('display/:employeeId/detailed')
  @UseGuards(JwtAuthGuard, RolesGuard, DepartmentsGuard, PermissionsGuard)
  @Departments('HR', 'Accounts')
  @Permissions(PermissionName.salary_permission)
  @ApiOperation({ summary: 'Get detailed salary breakdown for a specific employee' })
  @ApiParam({ name: 'employeeId', description: 'ID of the employee', type: Number, example: 123 })
  @ApiQuery({ name: 'month', description: 'Month in YYYY-MM format', required: false, example: '2025-10' })
  @ApiResponse({
    status: 200,
    description: 'Detailed salary breakdown including all components, commissions and deductions',
    schema: {
      example: {
        employee: { id: 123, firstName: 'John', lastName: 'Doe', departmentName: 'Sales', email: 'john@example.com', status: 'active', startDate: '2023-01-01' },
        salary: {
          month: '2025-10',
          baseSalary: 50000,
          commission: 2500,
          bonus: 1000,
          totalEarnings: 53500,
          deductions: {
            attendance: 300,
            lateDays: 2,
            halfDays: 1,
            chargeback: 200,
            refund: 100,
            total: 600,
          },
          finalSalary: 52900,
          status: 'paid',
          paidOn: '2025-10-05',
        },
        commissionBreakdown: [
          { projectId: 1, projectName: 'Project Alpha', clientName: 'ABC Corp', projectValue: 50000, commissionRate: 5, commissionAmount: 2500, completedAt: '2025-10-10', status: 'completed' }
        ],
        deductionBreakdown: {
          absentDetails: [],
          lateDetails: [{ day: 2, deduction: 100, reason: 'Late (excess)' }],
          halfDayDetails: [{ day: 3, deduction: 50, reason: 'Half day' }],
          chargebackDeduction: 200,
          refundDeduction: 100,
          totalDeduction: 600,
        },
      },
    },
  })
  async getDetailedSalaryBreakdown(
    @Param('employeeId') employeeId: string, 
    @Query('month') month?: string
  ) {
    const result = await this.financeService.getDetailedSalaryBreakdown(parseInt(employeeId), month);
    return result;
  }


  @Post('commission/assign')
  // @Permissions(PermissionName.commission_permission)
  @ApiOperation({ summary: 'Assign commission to employee for a completed project' })
  @ApiBody({ schema: { example: { project_id: 101 } } })
  @ApiResponse({
    status: 200,
    description: 'Commission assigned successfully',
    schema: {
      example: { status: 'success', message: 'Commission assigned', employee_id: 123, commission_amount: 2500, withheld: false },
    },
  })
  async assignCommission(@Body() dto: AssignCommissionDto) {
    return await this.financeService.assignCommission(dto.project_id);
  }


  @Post('commission/withhold-flag')
  @UseGuards(JwtAuthGuard, RolesGuard, DepartmentsGuard, PermissionsGuard)
  @Departments('Sales')
  @Roles(RoleName.dep_manager)
  @ApiOperation({ summary: 'Update withhold flag for a sales employee' })
  @ApiBody({ schema: { example: { employee_id: 123, flag: true } } })
  @ApiResponse({
    status: 200,
    description: 'Withhold flag updated successfully',
    schema: { example: { status: 'success', message: 'Withhold flag updated', employee_id: 123, new_flag: true } },
  })
  async updateWithholdFlag(@Body() dto: UpdateWithholdFlagDto) {
    return await this.financeService.updateWithholdFlag(dto.employee_id, dto.flag);
  }

  @Post('commission/transfer')
  @UseGuards(JwtAuthGuard, RolesGuard, DepartmentsGuard, PermissionsGuard)
  @Departments('HR')
  @Roles(RoleName.dep_manager)
  // @Permissions(PermissionName.commission_permission)
  @ApiOperation({ summary: 'Transfer commission between withheld and available amount' })
  @ApiBody({ schema: { example: { employee_id: 123, amount: 1000, direction: 'release' } } })
  @ApiResponse({
    status: 200,
    description: 'Commission transferred successfully',
    schema: {
      example: {
        status: 'success',
        message: 'Commission released',
        employee_id: 123,
        transferred_amount: 1000,
        from: 'withhold_commission',
        to: 'commission_amount',
        new_balances: { commission_amount: 3500, withhold_commission: 0 },
      },
    },
  })
  async transferCommission(@Body() dto: TransferCommissionDto) {
    return await this.financeService.transferCommission(dto.employee_id, dto.amount, dto.direction);
  }

}
