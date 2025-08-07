import { Body, Controller, Post, Get, UseGuards, Request, Req } from '@nestjs/common';
import { HrService } from './hr.service';
import { TerminateEmployeeDto } from './dto/terminate-employee.dto';
import { HrLogsResponseDto } from './dto/hr-log.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { DepartmentsGuard } from '../../common/guards/departments.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Departments } from '../../common/decorators/departments.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PermissionName } from '../../common/constants/permission.enum';

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
  @Permissions(PermissionName.terminations_handle)
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




}
