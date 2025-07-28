import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

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
export class EmployeeController {
  @UseGuards(JwtAuthGuard)
  @Get('my-profile')
  getMyProfile(@Request() req: AuthenticatedRequest) {
    // req.user contains: { id, email, role, type, departmentId? }
    return {
      message: 'Profile accessed successfully',
      user: req.user,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('department-employees')
  getDepartmentEmployees(@Request() req: AuthenticatedRequest) {
    // Only employees can access their department info
    if (req.user.type === 'admin') {
      throw new Error(
        'Admins cannot access department-specific employee lists',
      );
    }

    return {
      message: 'Department employees accessed',
      departmentId: req.user.departmentId,
      userType: req.user.type,
    };
  }
}
