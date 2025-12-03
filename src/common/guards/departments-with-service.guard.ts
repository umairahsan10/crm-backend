import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { DEPARTMENTS_KEY } from '../decorators/departments.decorator';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class DepartmentsWithServiceGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredDepartments = this.reflector.getAllAndOverride<string[]>(
      DEPARTMENTS_KEY,
      [context.getHandler(), context.getClass()],
    );

    const { user } = context.switchToHttp().getRequest();

    // Admin bypass
    if (user?.type === 'admin') {
      return true;
    }

    if (!requiredDepartments || requiredDepartments.length === 0) {
      return true;
    }

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    const userDept = user.department ?? user.departmentId;

    if (typeof userDept === 'string') {
      if (requiredDepartments.includes(userDept)) {
        return true;
      }
      throw new ForbiddenException(
        `User does not belong to required departments. Required: ${requiredDepartments.join(', ')}. User department: ${userDept}`,
      );
    }

    if (typeof userDept === 'number') {
      const dept = await this.prisma.department.findUnique({
        where: { id: userDept },
        select: { name: true },
      });
      if (!dept) {
        throw new ForbiddenException('Department not found');
      }
      if (requiredDepartments.includes(dept.name)) {
        return true;
      }
      throw new ForbiddenException(
        `User does not belong to required departments. Required: ${requiredDepartments.join(', ')}. User department: ${dept.name}`,
      );
    }

    throw new ForbiddenException('Invalid department information');
  }
}
