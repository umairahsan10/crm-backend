import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RoleName } from '@prisma/client';
import { DepartmentsGuard } from '../../common/guards/departments.guard';
import { Departments } from '../../common/decorators/departments.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PermissionName } from '../../common/constants/permission.enum';
import { EmployeeService } from './employee.service';

interface AuthenticatedRequest extends Request {
  user: {
    id: number;
    email: string;
    role: string | number;
    type: string;
    departmentId?: number;
  };
}

@Controller('employee')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EmployeeController {
  constructor(private readonly employeeService: EmployeeService) {}
  @Get('my-profile')
  async getMyProfile(@Request() req: AuthenticatedRequest) {
    // All authenticated users can access their own profile
    const profile = await this.employeeService.getMyProfile(req.user.id);
    return {
      message: 'Profile accessed successfully',
      data: profile,
    };
  }

  @Get('department-employees')
  @UseGuards(DepartmentsGuard)
  @Departments('HR')
  @Roles(RoleName.dep_manager, RoleName.unit_head)
  async getDepartmentEmployees(@Request() req: AuthenticatedRequest) {
    // Only managers, team leads, and unit heads can see department employees
    if (!req.user.departmentId) {
      throw new Error('Department ID not found in user data');
    }
    const employees = await this.employeeService.getDepartmentEmployees(req.user.departmentId);
    return {
      message: 'Department employees accessed',
      data: employees,
      departmentId: req.user.departmentId,
    };
  }

  @Get('all-employees')
  @Roles(RoleName.dep_manager, RoleName.unit_head)
  async getAllEmployees(@Request() req: AuthenticatedRequest) {
    // Only department managers and unit heads can see all employees
    const employees = await this.employeeService.getAllEmployees();
    return {
      message: 'All employees accessed',
      data: employees,
    };
  }

  @Get('senior-employees')
  @Roles( RoleName.dep_manager, RoleName.team_lead, RoleName.unit_head)
  async getSeniorEmployees(@Request() req: AuthenticatedRequest) {
    // Senior employees and above can see other senior employees
    const employees = await this.employeeService.getSeniorEmployees();
    return {
      message: 'Senior employees accessed',
      data: employees,
    };
  }

  @Get('salary-permission-test')
  @Roles(RoleName.dep_manager, RoleName.unit_head)
  @Departments('HR')
  @UseGuards(PermissionsGuard)
  @Permissions(PermissionName.salary_permission)
  testSalaryPermission() {
    return { message: 'Access granted: You have salary permission.' };
  }
}
