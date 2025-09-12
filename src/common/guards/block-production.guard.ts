import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';

@Injectable()
export class BlockProductionGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const { user } = context.switchToHttp().getRequest();

    // Admin bypass
    if (user?.type === 'admin') {
      return true;
    }

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Check if user belongs to production department
    const userDepartment = user.department ?? user.departmentName ?? user.departmentId;
    
    // If department is a string, check directly
    if (typeof userDepartment === 'string') {
      if (userDepartment.toLowerCase() === 'production') {
        throw new ForbiddenException('Production department members are not allowed to access client APIs');
      }
    }
    
    // If department is a number (ID), we need to check against known production department ID
    // For now, we'll assume production department has ID 3 (this should be verified)
    if (typeof userDepartment === 'number' && userDepartment === 3) {
      throw new ForbiddenException('Production department members are not allowed to access client APIs');
    }

    return true;
  }
}
