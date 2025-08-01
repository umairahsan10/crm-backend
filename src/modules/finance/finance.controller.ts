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
  async getDetailedSalaryBreakdown(
    @Param('employeeId') employeeId: string,
    @Query('month') month?: string
  ) {
    const result = await this.financeService.getDetailedSalaryBreakdown(parseInt(employeeId), month);
    return result;
  }

  
  @Post('commission/assign')
  // @Permissions(PermissionName.commission_permission)
  async assignCommission(@Body() dto: AssignCommissionDto) {
    return await this.financeService.assignCommission(dto.project_id);
  }

  
  @Post('commission/withhold-flag')
  @UseGuards(JwtAuthGuard, RolesGuard, DepartmentsGuard, PermissionsGuard)
  @Departments('Sales')
  @Roles(RoleName.dep_manager)
  async updateWithholdFlag(@Body() dto: UpdateWithholdFlagDto) {
    return await this.financeService.updateWithholdFlag(dto.employee_id, dto.flag);
  }

  @Post('commission/transfer')
  @UseGuards(JwtAuthGuard, RolesGuard, DepartmentsGuard, PermissionsGuard)
  @Departments('HR')
  @Roles(RoleName.dep_manager)
  // @Permissions(PermissionName.commission_permission)
  async transferCommission(@Body() dto: TransferCommissionDto) {
    return await this.financeService.transferCommission(dto.employee_id, dto.amount, dto.direction);
  }

}
