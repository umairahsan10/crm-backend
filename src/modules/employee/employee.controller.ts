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
import { ApiTags, ApiOperation, ApiResponse, getSchemaPath, ApiExtraModels, ApiBearerAuth } from '@nestjs/swagger';

interface AuthenticatedRequest extends Request {
  user: {
    id: number;
    email: string;
    role: string | number;
    type: string;
    departmentId?: number;
  };
}

@ApiTags('Employees')
@ApiExtraModels() // You can define and pass DTO classes here if you create EmployeeResponseDto
@ApiBearerAuth()
@Controller('employee')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EmployeeController {
  constructor(private readonly employeeService: EmployeeService) {}

  @Get('my-profile')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({
    status: 200,
    description: 'Profile accessed successfully',
    schema: {
      example: {
        message: 'Profile accessed successfully',
        data: {
          id: 1,
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          phone: '+1234567890',
          status: 'active',
          address: '123 Main St, City, State',
          dateOfBirth: '1990-01-15T00:00:00.000Z',
          department: { 
            id: 2, 
            name: 'Production' 
          },
          role: { 
            id: 3, 
            name: 'dep_manager' 
          },
          manager: { 
            id: 5, 
            firstName: 'Jane', 
            lastName: 'Smith', 
            email: 'jane.smith@example.com' 
          },
          teamLead: { 
            id: 6, 
            firstName: 'Mark', 
            lastName: 'Taylor', 
            email: 'mark.taylor@example.com' 
          }
        }
      }
    }
  })
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
  @ApiOperation({ summary: 'Get all employees in the current user department' })
  @ApiResponse({
    status: 200,
    description: 'Department employees accessed successfully',
    schema: {
      example: {
        message: 'Department employees accessed',
        departmentId: 2,
        data: [
          {
            id: 7,
            firstName: 'Alice',
            lastName: 'Johnson',
            email: 'alice.johnson@example.com',
            department: { id: 2, name: 'Engineering' },
            role: { id: 4, name: 'senior' },
            manager: { id: 5, firstName: 'Jane', lastName: 'Smith', email: 'jane.smith@example.com' },
            teamLead: { id: 6, firstName: 'Mark', lastName: 'Taylor', email: 'mark.taylor@example.com' }
          }
        ]
      }
    }
  })
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
  @ApiOperation({ summary: 'Get all employees in the system' })
  @ApiResponse({
    status: 200,
    description: 'All employees accessed successfully',
    schema: { example: { message: 'All employees accessed', data: [] } } // Simplified example
  })
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
  @ApiOperation({ summary: 'Get all senior employees' })
  @ApiResponse({
    status: 200,
    description: 'Senior employees accessed successfully',
    schema: { example: { message: 'Senior employees accessed', data: [] } }
  })
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
  @ApiOperation({ summary: 'Test salary permission access for current user' })
  @ApiResponse({
    status: 200,
    description: 'Access granted: You have salary permission.',
    schema: { example: { message: 'Access granted: You have salary permission.' } }
  })
  testSalaryPermission() {
    return { message: 'Access granted: You have salary permission.' };
  }
}
