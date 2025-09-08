import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../../../prisma/prisma.service';

@Injectable()
export class LeadsAccessGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Admin users have full access
    if (user.role === 'admin') {
      return true;
    }

    // Get user's department from database to ensure accuracy
    const employee = await this.prisma.employee.findUnique({
      where: { id: user.id },
      include: {
        department: {
          select: { name: true }
        }
      }
    });

    if (!employee) {
      throw new ForbiddenException('Employee not found');
    }

    const departmentName = employee.department.name;

    // Check if user can access leads (sales, HR, admin)
    const allowedDepartments = ['Sales', 'HR', 'Admin'];
    if (allowedDepartments.includes(departmentName)) {
      return true;
    }

    throw new ForbiddenException('Access denied. Only sales, HR, and admin users can access leads.');
  }
}
