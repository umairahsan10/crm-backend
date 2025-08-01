import { Body, Controller, Post, Get, UseGuards, Request, Query, BadRequestException, Req, Patch } from '@nestjs/common';
import { HrService } from './hr.service';
import { TerminateEmployeeDto } from './dto/terminate-employee.dto';
import { HrLogsResponseDto } from './dto/hr-log.dto';
import { SalaryDeductionDto, SalaryDeductionResponseDto } from './dto/salary-deduction.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { DepartmentsGuard } from '../../common/guards/departments.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Departments } from '../../common/decorators/departments.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PermissionName } from '../../common/constants/permission.enum';
import { UpdateSalaryDto } from './dto/update-salary.dto';
import { MarkSalaryPaidDto } from './dto/mark-salary-paid.dto';

interface AuthenticatedRequest extends Request {
  user: {
    id: number;
    [key: string]: any;
  };
}

@Controller('hr')
export class HrController {
  constructor(private readonly hrService: HrService) {}

  /**
   * Terminate an employee and process their final salary
   * 
   * This endpoint allows HR to terminate an employee by:
   * 1. Updating the employee's status to 'terminated'
   * 2. Setting their end date
   * 3. Calculating their final salary (including deductions)
   * 4. Creating an HR log entry for audit purposes
   * 
   * @param dto - Contains employee_id, termination_date, and optional description
   * @param req - Authenticated request containing HR employee details
   * @returns Success message confirming termination and salary processing
   * 
   * Required Permissions: salary_permission
   * Required Department: HR
   */
  @Post('terminate')
  @UseGuards(JwtAuthGuard, RolesGuard, DepartmentsGuard, PermissionsGuard)
  @Departments('HR')
  @Permissions(PermissionName.salary_permission)
  async terminate(@Body() dto: TerminateEmployeeDto, @Request() req: AuthenticatedRequest) {
    await this.hrService.terminateEmployee(
      dto.employee_id,
      dto.termination_date,
      req.user.id,
      dto.description
    );
    return { message: 'Employee terminated and salary processed' };
  }

  /**
   * Get HR activity logs for the authenticated HR employee
   * 
   * This endpoint retrieves all HR activity logs created by the authenticated HR employee,
   * including employee terminations and other HR actions. The logs are ordered by
   * creation date (newest first) and include details about affected employees.
   * 
   * @param req - Authenticated request containing HR employee details
   * @returns Array of HR logs with related employee information
   * 
   * Required Permissions: salary_permission
   * Required Department: HR
   */
  // @Get('logs')
  // @UseGuards(JwtAuthGuard, RolesGuard, DepartmentsGuard, PermissionsGuard)
  // @Departments('HR')
  // @Permissions(PermissionName.salary_permission)
  // async getLogs(@Request() req: AuthenticatedRequest): Promise<HrLogsResponseDto> {
  //   const logs = await this.hrService.getHrLogs(req.user.id);
  //   return { logs };
  // }

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
  @Get('salary-deductions')
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
    return await this.hrService.calculateSalaryDeductions(dto);
  }

  @Patch('update-salary')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard, DepartmentsGuard)
  @Permissions(PermissionName.salary_permission)
  @Departments('HR')
  async setSalary(@Body() dto: UpdateSalaryDto, @Req() req: any) {
    const currentUserId = req.user.id;
    const isAdmin = req.user.type === 'admin';
    
    const result = await this.hrService.updateSalary(
      dto.employee_id,
      dto.amount,
      currentUserId,
      isAdmin,
      dto.description
    );

    // Return the result directly (success or error response)
    return result;
  }

  @Patch('salary/mark-paid')
  @UseGuards(JwtAuthGuard, PermissionsGuard, DepartmentsGuard)
  @Permissions(PermissionName.salary_permission)
  @Departments('HR')
  async markSalaryPaid(@Body() dto: MarkSalaryPaidDto, @Req() req: any) {
    const currentUserId = req.user.id;
    const isAdmin = req.user.type === 'admin';
    return await this.hrService.markSalaryPaid(dto, currentUserId, isAdmin);
  }


}
