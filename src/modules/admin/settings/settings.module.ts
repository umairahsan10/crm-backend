import { Module } from '@nestjs/common';
import { CompanySettingsModule } from './company/company-settings.module';
import { DepartmentsModule } from './departments/departments.module';
import { RolesModule } from './roles/roles.module';
import { HrPermissionsModule } from './hr-permissions/hr-permissions.module';
import { AccountantPermissionsModule } from './accountant-permissions/accountant-permissions.module';

/**
 * Settings Module
 *
 * This module contains sub-modules for:
 * - Company Settings ✅
 * - Departments Management ✅
 * - Roles Management ✅
 * - HR Permissions Management ✅
 * - Accountant Permissions Management ✅
 */
@Module({
  imports: [
    CompanySettingsModule,
    DepartmentsModule,
    RolesModule,
    HrPermissionsModule,
    AccountantPermissionsModule,
  ],
})
export class SettingsModule {}
