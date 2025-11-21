import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../../../prisma/prisma.service';

@Injectable()
export class LeadsAccessGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    console.log('🔍 LeadsAccessGuard - canActivate called');
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    
    console.log('🔍 LeadsAccessGuard - user:', user);
    console.log('🔍 LeadsAccessGuard - user type:', typeof user);

    if (!user) {
      console.log('🔍 LeadsAccessGuard - User not authenticated');
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

    // Check if user can access leads (sales, HR, admin, marketing)
    const allowedDepartments = ['Sales', 'HR', 'Admin', 'Marketing'];
    if (allowedDepartments.includes(departmentName)) {
      return true;
    }

    throw new ForbiddenException('Access denied. Only sales, HR, admin, and marketing users can access leads.');
  }
}
