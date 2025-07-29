import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { DEPARTMENTS_KEY } from '../decorators/departments.decorator';

@Injectable()
export class DepartmentsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
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
      return true; // no department restriction
    }

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    const userDepartment = user.department ?? user.departmentName;

    if (typeof userDepartment !== 'string') {
      throw new ForbiddenException('Invalid department information');
    }

    if (!requiredDepartments.includes(userDepartment)) {
      throw new ForbiddenException(
        `User does not belong to required departments. Required: ${requiredDepartments.join(', ')}. User department: ${userDepartment}`,
      );
    }

    return true;
  }
} 