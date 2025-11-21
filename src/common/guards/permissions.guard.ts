import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { PermissionName } from '../constants/permission.enum';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPerms = this.reflector.getAllAndOverride<PermissionName[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    const { user } = context.switchToHttp().getRequest();

    // Admin bypass - check both type and role
    if (user?.type === 'admin' || user?.role === 'admin') {
      return true;
    }

    if (!requiredPerms || requiredPerms.length === 0) {
      return true;
    }

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    const perms = user.permissions ?? {};

    // Require ALL permissions when multiple are specified
    const hasPermission = requiredPerms.every((perm) => perms[perm] === true);

    if (!hasPermission) {
      throw new ForbiddenException(
        `Missing required permissions: ${requiredPerms.join(', ')}`,
      );
    }

    return true;
  }
} 