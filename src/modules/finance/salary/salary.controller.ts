import { Controller, Post, Get, Param, Query, UseGuards, BadRequestException, Patch, Body } from '@nestjs/common';
import { FinanceSalaryService } from './salary.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { Permissions } from '../../../common/decorators/permissions.decorator';
import { PermissionName } from '../../../common/constants/permission.enum';
import { Departments } from '../../../common/decorators/departments.decorator';

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
  async calculateAllSalaries() {
    await this.financeSalaryService.handleMonthlySalaryCalculation();
    return { message: 'Salary calculation triggered for all employees' };
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
   * Get salary display for a specific employee with deductions subtracted
   * 
   * This endpoint retrieves the latest salary record for an employee and returns
   * the salary information formatted for frontend display, including:
   * - Net salary (base + bonus + commissions)
   * - Deductions (attendance + chargeback + refund)
   * - Final salary (net salary - deductions)
   * 
   * This is designed for frontend consumption to display salary information
   * in employee salary lists and dashboards.
   * 
   * @param employeeId - Employee ID to retrieve salary for
   * @param month - Optional month in YYYY-MM format (defaults to current month)
   * @returns Salary display information with deductions subtracted
   * 
   * Required Permissions: salary_permission
   */
  @Get('display/:employeeId')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Permissions(PermissionName.salary_permission)
  async getSalaryDisplay(@Param('employeeId') employeeId: string, @Query('month') month?: string) {
    const result = await this.financeSalaryService.getSalaryDisplay(parseInt(employeeId), month);
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
   * 
   * This is designed for frontend consumption to display complete salary information
   * in salary management dashboards and reports.
   * 
   * @param month - Optional month in YYYY-MM format (defaults to current month)
   * @returns Comprehensive salary information for all employees with detailed breakdown
   * 
   * Required Permissions: salary_permission
   */
  @Get('display-all')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Permissions(PermissionName.salary_permission)
  async getAllSalariesDisplay(@Query('month') month?: string) {
    const result = await this.financeSalaryService.getAllSalariesDisplay(month);
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
  async updateSalesEmployeeBonus(@Body() body: { employee_id: number; bonusAmount: number }) {
    const result = await this.financeSalaryService.updateSalesEmployeeBonus(body.employee_id, body.bonusAmount);
    return result;
  }
} 