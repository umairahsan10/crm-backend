import { Controller, Post, Get, Param, Query, UseGuards, Patch, Body, Request, ParseIntPipe } from '@nestjs/common';
import { FinanceSalaryService } from './salary.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { Permissions } from '../../../common/decorators/permissions.decorator';
import { PermissionName } from '../../../common/constants/permission.enum';
import { Departments } from '../../../common/decorators/departments.decorator';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { MarkSalaryPaidDto } from './dto/mark-paid.dto';

interface AuthenticatedRequest extends Request {
  user: {
    id: number;
    role: string | number;
    type: string;
    department?: string;
    permissions?: any;
  };
}

type GetAllSalariesQuery = {
  month?: string;
  page?: string;
  limit?: string;
  departments?: string;
  status?: string;
  minSalary?: string;
  maxSalary?: string;
};

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
   * Get salaries for all employees (table view).
   */
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Permissions(PermissionName.salary_permission)
  @ApiOperation({ summary: 'Get paginated salaries for all employees' })
  @ApiQuery({ name: 'month', description: 'Optional month (YYYY-MM)', required: false })
  @ApiQuery({ name: 'page', description: 'Page number (defaults to 1)', required: false, type: Number })
  @ApiQuery({ name: 'limit', description: 'Number of records per page (defaults to 20, max 100)', required: false, type: Number })
  @ApiQuery({ name: 'departments', description: 'Comma-separated department IDs (e.g., "1,2,3")', required: false })
  @ApiQuery({ name: 'status', description: 'Employee status filter (active, inactive, terminated)', required: false })
  @ApiQuery({ name: 'minSalary', description: 'Minimum final salary filter', required: false, type: Number })
  @ApiQuery({ name: 'maxSalary', description: 'Maximum final salary filter', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'All employee salaries returned successfully' })
  async getAllSalaries(@Query() query: GetAllSalariesQuery) {
    return await this.financeSalaryService.getAllSalaries(query);
  }

  /**
   * Calculate salary preview for an employee up to a given date (read-only).
   */
  @Get('calculate')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Permissions(PermissionName.salary_permission)
  @ApiOperation({ summary: 'Calculate salary preview for an employee (read-only)' })
  @ApiQuery({ name: 'employeeId', description: 'Employee ID to calculate salary for', type: Number, required: true })
  @ApiQuery({ name: 'endDate', description: 'Optional end date (YYYY-MM-DD). Defaults to current date.', required: false })
  @ApiResponse({ status: 200, description: 'Salary preview calculated successfully' })
  async calculateSalary(
    @Query('employeeId', ParseIntPipe) employeeId: number,
    @Query('endDate') endDate?: string,
  ) {
    return await this.financeSalaryService.calculateSalaryForPreview(employeeId, endDate);
  }

  /**
   * Get sales employees with sales amount greater than 3000, ordered alphabetically
   * 
   * This endpoint retrieves sales employees from the sales department who have
   * sales amount greater than 3000, ordered alphabetically by name.
   * Includes pagination and filtering support for sales amount and bonus.
   * 
   * @param page - Page number (defaults to 1)
   * @param limit - Number of records per page (defaults to 20, max 100)
   * @param minSales - Minimum sales amount filter
   * @param maxSales - Maximum sales amount filter
   * @param minBonus - Minimum bonus amount filter
   * @param maxBonus - Maximum bonus amount filter
   * @returns Paginated array of sales employees with id, name, sales amount, and bonus amount
   * 
   * Required Permissions: salary_permission
   */
  @Get('bonus-display')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Permissions(PermissionName.salary_permission)
  @ApiOperation({ summary: 'Get sales employees with sales amount > 3000 (paginated with filters)' })
  @ApiQuery({ name: 'page', description: 'Page number (defaults to 1)', required: false, type: Number })
  @ApiQuery({ name: 'limit', description: 'Number of records per page (defaults to 20, max 100)', required: false, type: Number })
  @ApiQuery({ name: 'minSales', description: 'Minimum sales amount filter', required: false, type: Number })
  @ApiQuery({ name: 'maxSales', description: 'Maximum sales amount filter', required: false, type: Number })
  @ApiQuery({ name: 'minBonus', description: 'Minimum bonus amount filter', required: false, type: Number })
  @ApiQuery({ name: 'maxBonus', description: 'Maximum bonus amount filter', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'Sales employees bonus display returned successfully',
    schema: {
      type: 'object',
      properties: {
        employees: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              name: { type: 'string' },
              salesAmount: { type: 'number' },
              bonusAmount: { type: 'number' },
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
  async getSalesEmployeesBonusDisplay(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('minSales') minSales?: string,
    @Query('maxSales') maxSales?: string,
    @Query('minBonus') minBonus?: string,
    @Query('maxBonus') maxBonus?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    const minSalesNum = minSales ? parseFloat(minSales) : undefined;
    const maxSalesNum = maxSales ? parseFloat(maxSales) : undefined;
    const minBonusNum = minBonus ? parseFloat(minBonus) : undefined;
    const maxBonusNum = maxBonus ? parseFloat(maxBonus) : undefined;
    
    const result = await this.financeSalaryService.getSalesEmployeesBonusDisplay(
      pageNum,
      limitNum,
      minSalesNum,
      maxSalesNum,
      minBonusNum,
      maxBonusNum,
    );
    return result;
  }

  /**
   * Get salary details for a specific employee (auto-fallback to previous month if current data is missing).
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Permissions(PermissionName.salary_permission)
  @ApiOperation({ summary: 'Get salary details for a specific employee' })
  @ApiParam({ name: 'id', description: 'Employee ID', type: Number })
  @ApiQuery({ name: 'month', description: 'Optional month in YYYY-MM format', required: false })
  @ApiResponse({ status: 200, description: 'Employee salary details returned successfully' })
  async getEmployeeSalary(
    @Param('id', ParseIntPipe) id: number,
    @Query('month') month?: string,
  ) {
    return await this.financeSalaryService.getEmployeeSalary(id, month);
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
   * Mark salaries as paid (supports single or bulk requests).
   */
  @Patch('mark')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Permissions(PermissionName.salary_permission)
  @ApiOperation({ summary: 'Mark salary as paid (single or bulk)' })
  @ApiBody({ type: MarkSalaryPaidDto })
  @ApiResponse({ status: 200, description: 'Salary mark operation completed' })
  async markSalary(
    @Body() dto: MarkSalaryPaidDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return await this.financeSalaryService.handleMarkSalaryPaidRequest(
      dto,
      req.user.id,
      req.user.type,
    );
  }
} 