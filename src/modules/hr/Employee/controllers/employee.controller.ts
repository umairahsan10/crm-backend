import { Body, Controller, Post, Get, Put, Delete, Param, Query, UseGuards, Request, Req, ParseIntPipe } from '@nestjs/common';
import { EmployeeService } from '../services/employee.service';
import { TerminateEmployeeDto } from '../dto/terminate-employee.dto';
import { HrLogsResponseDto } from '../../dto/hr-log.dto';
import { CreateEmployeeDto } from '../dto/create-employee.dto';
import { UpdateEmployeeDto } from '../dto/update-employee.dto';
import { GetEmployeesDto } from '../dto/get-employees.dto';
import { EmployeeResponseDto, EmployeesListResponseDto } from '../dto/employee-response.dto';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../common/guards/roles.guard';
import { DepartmentsGuard } from '../../../../common/guards/departments.guard';
import { PermissionsGuard } from '../../../../common/guards/permissions.guard';
import { Departments } from '../../../../common/decorators/departments.decorator';
import { Permissions } from '../../../../common/decorators/permissions.decorator';
import { PermissionName } from '../../../../common/constants/permission.enum';


interface AuthenticatedRequest extends Request {
  user: {
    id: number;
    [key: string]: any;
  };
}

@Controller('hr')
export class EmployeeController {
  constructor(private readonly hrService: EmployeeService) {}

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
   * Create a new employee
   * 
   * This endpoint allows HR to create a new employee with all required information.
   * The system validates that the email is unique and that all referenced entities
   * (department, role, manager, team lead) exist.
   * 
   * @param dto - Employee creation data
   * @param req - Authenticated request containing HR employee details
   * @returns Created employee with related data
   * 
   * Required Permissions: employee_add_permission
   * Required Department: HR
   */
  @Post('employees')
  @UseGuards(JwtAuthGuard, RolesGuard, DepartmentsGuard, PermissionsGuard)
  @Departments('HR')
  @Permissions(PermissionName.employee_add_permission)
  async createEmployee(@Body() dto: CreateEmployeeDto, @Request() req: AuthenticatedRequest): Promise<EmployeeResponseDto> {
    return await this.hrService.createEmployee(dto, req.user.id);
  }

  /**
   * Get all employees with filters and pagination
   * 
   * This endpoint retrieves employees based on various filters including department,
   * role, status, employment type, mode of work, and search terms. Results are
   * paginated for better performance.
   * 
   * @param query - Filter and pagination parameters
   * @param req - Authenticated request containing HR employee details
   * @returns Paginated list of employees with related data
   * 
   * Required Permissions: employee_add_permission
   * Required Department: HR
   */
  @Get('employees')
  @UseGuards(JwtAuthGuard, RolesGuard, DepartmentsGuard, PermissionsGuard)
  @Departments('HR')
  @Permissions(PermissionName.employee_add_permission)
  async getEmployees(@Query() query: GetEmployeesDto, @Request() req: AuthenticatedRequest): Promise<EmployeesListResponseDto> {
    return await this.hrService.getEmployees(query);
  }

  /**
   * Get a specific employee by ID
   * 
   * This endpoint retrieves detailed information about a specific employee
   * including their department, role, manager, and team lead information.
   * 
   * @param id - Employee ID
   * @param req - Authenticated request containing HR employee details
   * @returns Employee details with related data
   * 
   * Required Permissions: employee_add_permission
   * Required Department: HR
   */
  @Get('employees/:id')
  @UseGuards(JwtAuthGuard, RolesGuard, DepartmentsGuard, PermissionsGuard)
  @Departments('HR')
  @Permissions(PermissionName.employee_add_permission)
  async getEmployeeById(@Param('id', ParseIntPipe) id: number, @Request() req: AuthenticatedRequest): Promise<EmployeeResponseDto> {
    return await this.hrService.getEmployeeById(id);
  }

  /**
   * Update an employee
   * 
   * This endpoint allows HR to update employee information. Only provided fields
   * are updated, and the system validates that all referenced entities exist
   * and that email uniqueness is maintained.
   * 
   * @param id - Employee ID
   * @param dto - Employee update data
   * @param req - Authenticated request containing HR employee details
   * @returns Updated employee with related data
   * 
   * Required Permissions: employee_add_permission
   * Required Department: HR
   */
  @Put('employees/:id')
  @UseGuards(JwtAuthGuard, RolesGuard, DepartmentsGuard, PermissionsGuard)
  @Departments('HR')
  @Permissions(PermissionName.employee_add_permission)
  async updateEmployee(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEmployeeDto,
    @Request() req: AuthenticatedRequest
  ): Promise<EmployeeResponseDto> {
    return await this.hrService.updateEmployee(id, dto, req.user.id);
  }

  /**
   * Delete an employee
   * 
   * This endpoint permanently deletes an employee and all related records from the database.
   * This includes attendance records, salary logs, project assignments, leads, and all other
   * related data. This action cannot be undone.
   * 
   * @param id - Employee ID
   * @param req - Authenticated request containing HR employee details
   * @returns Success message
   * 
   * Required Permissions: employee_add_permission
   * Required Department: HR
   */
  @Delete('employees/:id')
  @UseGuards(JwtAuthGuard, RolesGuard, DepartmentsGuard, PermissionsGuard)
  @Departments('HR')
  @Permissions(PermissionName.employee_add_permission)
  async deleteEmployee(@Param('id', ParseIntPipe) id: number, @Request() req: AuthenticatedRequest): Promise<{ message: string }> {
    return await this.hrService.deleteEmployee(id, req.user.id);
  }
}
