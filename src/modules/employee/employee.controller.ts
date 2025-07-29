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
  @Get('my-profile')
  getMyProfile(@Request() req: AuthenticatedRequest) {
    // All authenticated users can access their own profile
    return {
      message: 'Profile accessed successfully',
      user: req.user,
    };
  }

  @Get('department-employees')
  @UseGuards(DepartmentsGuard)
  @Departments('HR')
  @Roles(RoleName.dep_manager, RoleName.team_lead, RoleName.unit_head)
  getDepartmentEmployees(@Request() req: AuthenticatedRequest) {
    // Only managers, team leads, and unit heads can see department employees
    return {
      message: 'Department employees accessed',
      departmentId: req.user.departmentId,
      userType: req.user.type,
    };
  }

  @Get('all-employees')
  @Roles(RoleName.dep_manager, RoleName.unit_head)
  getAllEmployees(@Request() req: AuthenticatedRequest) {
    // Only department managers and unit heads can see all employees
    return {
      message: 'All employees accessed',
      user: req.user,
    };
  }

  @Get('senior-employees')
  @Roles(RoleName.senior, RoleName.dep_manager, RoleName.team_lead, RoleName.unit_head)
  getSeniorEmployees(@Request() req: AuthenticatedRequest) {
    // Senior employees and above can see other senior employees
    return {
      message: 'Senior employees accessed',
      user: req.user,
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
