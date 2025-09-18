import { Body, Controller, Post, Get, Put, Patch, Delete, Param, Query, UseGuards, Request, Req, ParseIntPipe } from '@nestjs/common';
import { EmployeeService } from '../services/employee.service';
import { TerminateEmployeeDto } from '../dto/terminate-employee.dto';
import { HrLogsResponseDto } from '../../dto/hr-log.dto';
import { CreateEmployeeDto } from '../dto/create-employee.dto';
import { UpdateEmployeeDto } from '../dto/update-employee.dto';
import { UpdateBonusDto } from '../dto/update-bonus.dto';
import { UpdateShiftDto } from '../dto/update-shift.dto';
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
   * Create a new employee
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
   */
  @Get('employees')
  @UseGuards(JwtAuthGuard, RolesGuard, DepartmentsGuard, PermissionsGuard)
  @Departments('HR')
  async getEmployees(@Query() query: GetEmployeesDto, @Request() req: AuthenticatedRequest): Promise<EmployeesListResponseDto> {
    return await this.hrService.getEmployees(query);
  }

  /**
   * Get a specific employee by ID
   */
  @Get('employees/:id')
  @UseGuards(JwtAuthGuard, RolesGuard, DepartmentsGuard, PermissionsGuard)
  @Departments('HR')
  async getEmployeeById(@Param('id', ParseIntPipe) id: number, @Request() req: AuthenticatedRequest): Promise<EmployeeResponseDto> {
    return await this.hrService.getEmployeeById(id);
  }

  /**
   * Update an employee
   */
  @Put('employees/:id')
  @UseGuards(JwtAuthGuard, RolesGuard, DepartmentsGuard, PermissionsGuard)
  @Departments('HR')
  async updateEmployee(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEmployeeDto,
    @Request() req: AuthenticatedRequest
  ): Promise<EmployeeResponseDto> {
    return await this.hrService.updateEmployee(id, dto, req.user.id);
  }

  /**
   * Update employee bonus
   */
  @Patch('employees/:id/bonus')
  @UseGuards(JwtAuthGuard, RolesGuard, DepartmentsGuard, PermissionsGuard)
  @Departments('HR')
  @Permissions(PermissionName.bonuses_set)
  async updateBonus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateBonusDto,
    @Request() req: AuthenticatedRequest
  ): Promise<EmployeeResponseDto> {
    return await this.hrService.updateBonus(id, dto.bonus, req.user.id);
  }

  /**
   * Update employee shift times
   */
  @Patch('employees/:id/shift')
  @UseGuards(JwtAuthGuard, RolesGuard, DepartmentsGuard, PermissionsGuard)
  @Departments('HR')
  @Permissions(PermissionName.shift_timing_set)
  async updateShift(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateShiftDto,
    @Request() req: AuthenticatedRequest
  ): Promise<EmployeeResponseDto> {
    return await this.hrService.updateShift(id, dto, req.user.id);
  }

  /**
   * Delete an employee
   */
  @Delete('employees/:id')
  @UseGuards(JwtAuthGuard, RolesGuard, DepartmentsGuard, PermissionsGuard)
  @Departments('HR')
  @Permissions(PermissionName.employee_add_permission)
  async deleteEmployee(@Param('id', ParseIntPipe) id: number, @Request() req: AuthenticatedRequest): Promise<{ message: string }> {
    return await this.hrService.deleteEmployee(id, req.user.id);
  }
}
