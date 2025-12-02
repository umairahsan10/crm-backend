import { SetMetadata } from '@nestjs/common';
import { PermissionName } from '../constants/permission.enum';

export const PERMISSIONS_KEY = 'permissions_required';
export const Permissions = (...permissions: PermissionName[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
