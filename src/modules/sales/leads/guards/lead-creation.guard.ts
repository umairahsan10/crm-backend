import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../../../prisma/prisma.service';

@Injectable()
export class LeadCreationGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Admin users can create leads
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

    // Only sales team and admin can create leads
    const allowedDepartments = ['Sales', 'Admin'];
    if (allowedDepartments.includes(departmentName)) {
      return true;
    }

    throw new ForbiddenException('Access denied. Only sales team and admin users can create leads.');
  }
}
