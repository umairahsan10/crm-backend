import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { RoleName } from '@prisma/client';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<RoleName[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const { user } = context.switchToHttp().getRequest();

    // Admin bypass
    if (user?.type === 'admin') {
      return true;
    }

    // If no roles are required, allow access
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // If no user is present, deny access
    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Check if user has any of the required roles
    // Support both role name (string) and role ID (number)
    const hasRole = requiredRoles.some((requiredRole) => {
      // If user.role is a number (role ID), we need to handle it differently
      // For now, we'll assume user.role contains the role name
      return user.role === requiredRole;
    });
    
    if (!hasRole) {
      throw new ForbiddenException(
        `User does not have the required roles. Required: ${requiredRoles.join(', ')}. User role: ${user.role}`
      );
    }

    return true;
  }
} 