import { Body, Controller, Post, Get, Put, Patch, Delete, Param, Query, UseGuards, Request, Req, ParseIntPipe, Res } from '@nestjs/common';
import { Response } from 'express';
import { EmployeeService } from '../services/employee.service';
import { TerminateEmployeeDto } from '../dto/terminate-employee.dto';
import { HrLogResponseDto, HrLogsListResponseDto, GetHrLogsDto, ExportHrLogsDto } from '../../dto/hr-log.dto';
import { HrLogsStatsResponseDto } from '../../dto/hr-logs-stats.dto';
import { CreateEmployeeDto } from '../dto/create-employee.dto';
import { CreateCompleteEmployeeDto } from '../dto/create-complete-employee.dto';
import { UpdateEmployeeDto } from '../dto/update-employee.dto';
import { UpdateBonusDto } from '../dto/update-bonus.dto';
import { UpdateShiftDto } from '../dto/update-shift.dto';
import { GetEmployeesDto } from '../dto/get-employees.dto';
import { EmployeeResponseDto, EmployeesListResponseDto } from '../dto/employee-response.dto';
import { EmployeeStatisticsResponseDto } from '../dto/employee-statistics.dto';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../common/guards/roles.guard';
import { DepartmentsGuard } from '../../../../common/guards/departments.guard';
import { PermissionsGuard } from '../../../../common/guards/permissions.guard';
import { Departments } from '../../../../common/decorators/departments.decorator';
import { Permissions } from '../../../../common/decorators/permissions.decorator';
import { Roles } from '../../../../common/decorators/roles.decorator';
import { PermissionName } from '../../../../common/constants/permission.enum';
import { RoleName } from '@prisma/client';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam, ApiBody, ApiBearerAuth } from '@nestjs/swagger';


interface AuthenticatedRequest extends Request {
  user: {
    id: number;
    [key: string]: any;
  };
}

@ApiTags('Employees')
@ApiBearerAuth()
@Controller('hr')
export class EmployeeController {
  constructor(private readonly hrService: EmployeeService) {}

  /**
   * Terminate an employee and process their final salary
   */
  @Post('terminate')
  @UseGuards(JwtAuthGuard, RolesGuard, DepartmentsGuard, PermissionsGuard)
  @Departments('HR')
  @Permissions(PermissionName.terminations_handle, PermissionName.salary_permission)
  @ApiOperation({ summary: 'Terminate an employee and process final salary' })
  @ApiBody({ type: TerminateEmployeeDto })
  @ApiResponse({ status: 201, description: 'Employee terminated successfully' })
  async terminate(@Body() dto: TerminateEmployeeDto, @Request() req: AuthenticatedRequest) {
    const isAdmin = req.user?.type === 'admin' || req.user?.role === 'admin';
    await this.hrService.terminateEmployee(
      dto.employee_id,
      dto.termination_date,
      req.user.id,
      dto.description,
      isAdmin
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
  @ApiOperation({ summary: 'Create a new employee' })
  @ApiBody({ type: CreateEmployeeDto })
  @ApiResponse({ status: 201, description: 'Employee created', type: EmployeeResponseDto })
  async createEmployee(@Body() dto: CreateEmployeeDto, @Request() req: AuthenticatedRequest): Promise<EmployeeResponseDto> {
    return await this.hrService.createEmployee(dto, req.user.id);
  }

  /**
   * Create a complete employee with department-specific data and bank account in a single transaction
   * This endpoint handles:
   * 1. Employee record creation
   * 2. Department-specific record (HR/Sales/Marketing/Production/Accountant)
   * 3. Bank account record (optional)
   * All operations are wrapped in a transaction - either all succeed or all fail
   */
  @Post('employees/complete')
  @UseGuards(JwtAuthGuard, RolesGuard, DepartmentsGuard, PermissionsGuard)
  @Departments('HR')
  @Permissions(PermissionName.employee_add_permission)
  @ApiOperation({ summary: 'Create a complete employee record including department-specific data and bank account' })
  @ApiBody({ type: CreateCompleteEmployeeDto })
  @ApiResponse({ status: 201, description: 'Complete employee created successfully' })
  async createCompleteEmployee(
    @Body() dto: CreateCompleteEmployeeDto, 
    @Request() req: AuthenticatedRequest
  ) {
    return await this.hrService.createCompleteEmployee(dto, req.user.id);
  }

  /**
   * Get all employees with filters and pagination
   */
  @Get('employees')
  @UseGuards(JwtAuthGuard, RolesGuard, DepartmentsGuard, PermissionsGuard)
  @Departments('HR')
  @ApiOperation({ summary: 'Get all employees with optional filters and pagination' })
  @ApiQuery({ name: 'departmentId', required: false, type: Number })
  @ApiQuery({ name: 'roleId', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: ['active', 'terminated', 'inactive'] })
  @ApiQuery({ name: 'employmentType', required: false, enum: ['full_time', 'part_time'] })
  @ApiQuery({ name: 'modeOfWork', required: false, enum: ['hybrid', 'on_site', 'remote'] })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Employees list retrieved', type: EmployeesListResponseDto })
  async getEmployees(@Query() query: GetEmployeesDto, @Request() req: AuthenticatedRequest): Promise<EmployeesListResponseDto> {
    return await this.hrService.getEmployees(query);
  }

  /**
   * Get comprehensive employee statistics
   */
  @Get('employees/stats')
  @UseGuards(JwtAuthGuard, RolesGuard, DepartmentsGuard, PermissionsGuard)
  @Departments('HR')
  @ApiOperation({ summary: 'Get comprehensive employee statistics' })
  @ApiResponse({ status: 200, description: 'Employee statistics retrieved', type: EmployeeStatisticsResponseDto })
  async getEmployeeStatistics(@Request() req: AuthenticatedRequest): Promise<EmployeeStatisticsResponseDto> {
    const statistics = await this.hrService.getEmployeeStatistics();
    return { statistics };
  }

  /**
   * Get a specific employee by ID
   */
  @Get('employees/:id')
  @UseGuards(JwtAuthGuard, RolesGuard, DepartmentsGuard, PermissionsGuard)
  @Departments('HR')
  @ApiOperation({ summary: 'Get employee by ID' })
  @ApiParam({ name: 'id', description: 'Employee ID', type: Number })
  @ApiResponse({ status: 200, description: 'Employee retrieved', type: EmployeeResponseDto })
  async getEmployeeById(@Param('id', ParseIntPipe) id: number, @Request() req: AuthenticatedRequest): Promise<EmployeeResponseDto> {
    return await this.hrService.getEmployeeById(id);
  }

  /**
   * Update an employee
   */
  @Put('employees/:id')
  @UseGuards(JwtAuthGuard, RolesGuard, DepartmentsGuard, PermissionsGuard)
  @Departments('HR')
  @ApiOperation({ summary: 'Update an employee record' })
  @ApiParam({ name: 'id', description: 'Employee ID', type: Number })
  @ApiBody({ type: UpdateEmployeeDto })
  @ApiResponse({ status: 200, description: 'Employee updated', type: EmployeeResponseDto })
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
  @ApiOperation({ summary: 'Update employee bonus' })
  @ApiParam({ name: 'id', description: 'Employee ID', type: Number })
  @ApiBody({ type: UpdateBonusDto })
  @ApiResponse({ status: 200, description: 'Bonus updated', type: EmployeeResponseDto })
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
  @ApiOperation({ summary: 'Update employee shift timings' })
  @ApiParam({ name: 'id', description: 'Employee ID', type: Number })
  @ApiBody({ type: UpdateShiftDto })
  @ApiResponse({ status: 200, description: 'Shift updated', type: EmployeeResponseDto })
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
  @ApiOperation({ summary: 'Delete an employee' })
  @ApiParam({ name: 'id', description: 'Employee ID', type: Number })
  @ApiResponse({ status: 200, description: 'Employee deleted successfully' })
  async deleteEmployee(@Param('id', ParseIntPipe) id: number, @Request() req: AuthenticatedRequest): Promise<{ message: string }> {
    return await this.hrService.deleteEmployee(id, req.user.id);
  }

  /**
   * Get HR logs - Manager only access
   */
  @Get('logs')
  @UseGuards(JwtAuthGuard, RolesGuard, DepartmentsGuard, PermissionsGuard)
  @Departments('HR')
  @Roles(RoleName.dep_manager)
  @Permissions(PermissionName.employee_add_permission)
  @ApiOperation({ summary: 'Get HR logs (Manager only)' })
  @ApiQuery({ type: GetHrLogsDto })
  @ApiResponse({ status: 200, description: 'HR logs retrieved', type: HrLogsListResponseDto })
  async getHrLogs(@Query() query: GetHrLogsDto, @Request() req: AuthenticatedRequest): Promise<HrLogsListResponseDto> {
    return await this.hrService.getHrLogs(query);
  }

  /**
   * Get HR logs statistics - Manager only access
   */
  @Get('logs/stats')
  @UseGuards(JwtAuthGuard, RolesGuard, DepartmentsGuard, PermissionsGuard)
  @Departments('HR')
  @Roles(RoleName.dep_manager)
  @Permissions(PermissionName.employee_add_permission)
  @ApiOperation({ summary: 'Get HR logs statistics (Manager only)' })
  @ApiResponse({ status: 200, description: 'HR logs stats retrieved', type: HrLogsStatsResponseDto })
  async getHrLogsStats(@Request() req: AuthenticatedRequest): Promise<HrLogsStatsResponseDto> {
    return await this.hrService.getHrLogsStats();
  }

  /**
   * Export HR logs - Manager only access
   */
  @Get('logs/export')
  @UseGuards(JwtAuthGuard, RolesGuard, DepartmentsGuard, PermissionsGuard)
  @Departments('HR')
  @Roles(RoleName.dep_manager)
  @Permissions(PermissionName.employee_add_permission)
  @ApiOperation({ summary: 'Export HR logs in CSV or JSON (Manager only)' })
  async exportHrLogs(
    @Res() res: Response,
    @Query() query: ExportHrLogsDto,
  ) {
    const { format = 'csv', ...filterQuery } = query;
    const data = await this.hrService.getHrLogsForExport(filterQuery);
    const filename = `hr-logs-${new Date().toISOString().split('T')[0]}.${format}`;

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(this.hrService.convertHrLogsToCSV(data));
    } else if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.json(data);
    } else {
      res.status(400).json({ message: 'Unsupported format. Use csv or json.' });
    }
  }
}
