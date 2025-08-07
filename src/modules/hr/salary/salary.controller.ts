import { Body, Controller, Get, Post, Patch, UseGuards, Request, Query, BadRequestException, Req } from '@nestjs/common';
import { SalaryService } from './salary.service';
import { SalaryDeductionDto, SalaryDeductionResponseDto } from './dto/salary-deduction.dto';
import { UpdateSalaryDto } from './dto/update-salary.dto';
import { MarkSalaryPaidDto } from './dto/mark-salary-paid.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { DepartmentsGuard } from '../../../common/guards/departments.guard';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { Departments } from '../../../common/decorators/departments.decorator';
import { Permissions } from '../../../common/decorators/permissions.decorator';
import { PermissionName } from '../../../common/constants/permission.enum';

interface AuthenticatedRequest extends Request {
  user: {
    id: number;
    [key: string]: any;
  };
}

@Controller('hr/salary')
export class SalaryController {
  constructor(private readonly salaryService: SalaryService) {}

  /**
   * Calculate salary deductions for employees based on attendance data
   * 
   * This endpoint calculates attendance-based deductions (absent, late, half-day) for:
   * - A specific employee (if employeeId provided)
   * - All active employees (if no employeeId provided)
   * - A specific month (if month provided) or current month (default)
   * 
   * The calculation includes:
   * - Absent days: 2x per-day salary per absent day
   * - Late days: Progressive deduction after monthly allowance
   * - Half days: Progressive deduction based on attendance logs
   * 
   * @param req - Authenticated request
   * @param employeeId - Optional: Specific employee ID to calculate for
   * @param month - Optional: Month in YYYY-MM format (defaults to current month)
   * @returns Detailed deduction calculations and summary
   * 
   * Query Parameters:
   * - employeeId=1&month=2025-01 (specific employee and month)
   * - employeeId=1 (specific employee, current month)
   * - month=2025-01 (all employees, specific month)
   * - No parameters (all employees, current month)
   * 
   * Required Permissions: salary_permission
   * Required Department: HR
   */
  @Get('deductions')
  @UseGuards(JwtAuthGuard, RolesGuard, DepartmentsGuard, PermissionsGuard)
  @Departments('HR')
  @Permissions(PermissionName.salary_permission)
  async calculateSalaryDeductions(
    @Request() req: AuthenticatedRequest,
    @Query('employeeId') employeeId?: string,
    @Query('month') month?: string
  ): Promise<SalaryDeductionResponseDto> {
    // Validate employeeId if provided
    if (employeeId) {
      const parsedEmployeeId = parseInt(employeeId);
      if (isNaN(parsedEmployeeId) || parsedEmployeeId <= 0) {
        throw new BadRequestException('Invalid employeeId. Must be a positive number.');
      }
    }

    // Validate month format if provided
    if (month) {
      const monthRegex = /^\d{4}-\d{2}$/;
      if (!monthRegex.test(month)) {
        throw new BadRequestException('Invalid month format. Must be in YYYY-MM format (e.g., 2025-01).');
      }
      
      // Additional validation for valid month range
      const [year, monthNum] = month.split('-').map(Number);
      if (monthNum < 1 || monthNum > 12) {
        throw new BadRequestException('Invalid month. Month must be between 01 and 12.');
      }
      
      if (year < 2000 || year > 2100) {
        throw new BadRequestException('Invalid year. Year must be between 2000 and 2100.');
      }
    }

    const dto: SalaryDeductionDto = {
      employeeId: employeeId ? parseInt(employeeId) : undefined,
      month: month
    };
    return await this.salaryService.calculateSalaryDeductions(dto);
  }

  /**
   * Update employee base salary
   * 
   * This endpoint allows HR or admin users to update an employee's base salary.
   * Admins can update any salary, while HR users have restrictions:
   * - Cannot update their own salary
   * - Cannot update salary of another HR with salary permission
   * 
   * @param dto - Contains employee_id, amount, and optional description
   * @param req - Authenticated request containing user details
   * @returns Success or error response with salary details
   * 
   * Required Permissions: salary_permission
   * Required Department: HR
   */
  @Patch('update')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard, DepartmentsGuard)
  @Permissions(PermissionName.salary_permission)
  @Departments('HR')
  async updateSalary(@Body() dto: UpdateSalaryDto, @Req() req: any) {
    const currentUserId = req.user.id;
    const isAdmin = req.user.type === 'admin';
    
    const result = await this.salaryService.updateSalary(
      dto.employee_id,
      dto.amount,
      currentUserId,
      isAdmin,
      dto.description
    );

    // Return the result directly (success or error response)
    return result;
  }

  /**
   * Mark salary as paid for an employee
   * 
   * This endpoint marks a salary as paid and:
   * - Updates the salary log status
   * - Creates a transaction record
   * - Creates an expense record
   * - Resets employee and sales bonuses to zero
   * - Creates HR log entry (for HR users only)
   * 
   * @param dto - Contains employee_id and optional payment type
   * @param req - Authenticated request containing user details
   * @returns Success or error response with payment details
   * 
   * Required Permissions: salary_permission
   * Required Department: HR
   */
  @Patch('mark-paid')
  @UseGuards(JwtAuthGuard, PermissionsGuard, DepartmentsGuard)
  @Permissions(PermissionName.salary_permission)
  @Departments('HR')
  async markSalaryPaid(@Body() dto: MarkSalaryPaidDto, @Req() req: any) {
    const currentUserId = req.user.id;
    const isAdmin = req.user.type === 'admin';
    return await this.salaryService.markSalaryPaid(dto, currentUserId, isAdmin);
  }
} 