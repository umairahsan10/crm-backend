import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../../../../prisma/prisma.service';

@Injectable()
export class ArchivedLeadsAccessGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    console.log('🔍 ArchivedLeadsAccessGuard - canActivate called');
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    console.log('🔍 ArchivedLeadsAccessGuard - user:', user);
    console.log('🔍 ArchivedLeadsAccessGuard - user type:', typeof user);

    if (!user) {
      console.log('🔍 ArchivedLeadsAccessGuard - User not authenticated');
      throw new ForbiddenException('User not authenticated');
    }

    // Admin users have full access
    if (user.role === 'admin') {
      console.log('🔍 ArchivedLeadsAccessGuard - Admin access granted');
      return true;
    }

    // Get user's department from database to ensure accuracy
    const employee = await this.prisma.employee.findUnique({
      where: { id: user.id },
      include: {
        department: {
          select: { name: true },
        },
      },
    });

    if (!employee) {
      throw new ForbiddenException('Employee not found');
    }

    const departmentName = employee.department.name;

    // Check if user can access archived leads (sales department required)
    if (departmentName !== 'Sales') {
      throw new ForbiddenException(
        'Access denied. Only sales department users can access archived leads.',
      );
    }

    // Check if user has the required role for archived leads access
    const allowedRoles = ['dep_manager', 'unit_head'];
    if (!allowedRoles.includes(user.role)) {
      throw new ForbiddenException(
        'Access denied. Only admin, department manager, and unit head can access archived leads.',
      );
    }

    console.log(
      '🔍 ArchivedLeadsAccessGuard - Access granted for role:',
      user.role,
    );
    return true;
  }
}
