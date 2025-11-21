import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { RoleName } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class RolesWithServiceGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<RoleName[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const { user } = context.switchToHttp().getRequest();

    // Admin bypass - check both type and role for defense in depth
    if (user?.type === 'admin' || user?.role === 'admin') {
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
    const hasRole = await this.checkUserRole(user, requiredRoles);
    
    if (!hasRole) {
      throw new ForbiddenException(
        `User does not have the required roles. Required: ${requiredRoles.join(', ')}. User role: ${user.role}`
      );
    }

    return true;
  }

  private async checkUserRole(user: any, requiredRoles: RoleName[]): Promise<boolean> {
    // If user.role is already a role name, check directly
    if (typeof user.role === 'string' && Object.values(RoleName).includes(user.role as RoleName)) {
      return requiredRoles.includes(user.role as RoleName);
    }

    // If user.role is a role ID, fetch the role from database
    if (typeof user.role === 'number') {
      try {
        const userRole = await this.prisma.role.findUnique({
          where: { id: user.role },
        });

        if (!userRole) {
          return false;
        }

        return requiredRoles.includes(userRole.name);
      } catch (error) {
        console.error('Error fetching user role:', error);
        return false;
      }
    }

    // If user.role is neither string nor number, deny access
    return false;
  }
} 