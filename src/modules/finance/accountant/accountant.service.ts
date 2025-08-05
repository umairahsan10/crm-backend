import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { UpdatePermissionsDto, PermissionsDto } from './dto/update-permission.dto';
import { PermissionsResponseDto } from './dto/permission-response.dto';

interface AuthenticatedRequest {
  user: {
    id: number;
    type: string;
    role?: string;
    department?: string;
    [key: string]: any;
  };
}

@Injectable()
export class AccountantService {
  private readonly logger = new Logger(AccountantService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Helper method to get current date in PKT timezone
   */
  private getCurrentDateInPKT(): Date {
    return new Date(new Date().toLocaleString("en-US", {timeZone: "Asia/Karachi"}));
  }

  /**
   * Updates permissions for an accountant
   * Only admins or account managers can perform this action
   */
  async updatePermissions(
    dto: UpdatePermissionsDto,
    currentUserId: number,
    isAdmin: boolean
  ): Promise<PermissionsResponseDto> {
    try {
      // 1. Check if employee exists and is active
      const employee = await this.prisma.employee.findUnique({
        where: { id: dto.employee_id },
        select: { 
          id: true, 
          status: true, 
          firstName: true, 
          lastName: true,
          department: {
            select: { name: true }
          }
        },
      });

      if (!employee) {
        return {
          status: 'error',
          message: 'Employee does not exist',
          error_code: 'EMPLOYEE_NOT_FOUND'
        };
      }

      if (employee.status !== 'active') {
        return {
          status: 'error',
          message: 'Employee is not active',
          error_code: 'EMPLOYEE_INACTIVE'
        };
      }

      // 2. Check if employee is in Accounts department
      if (employee.department?.name !== 'Accounts') {
        return {
          status: 'error',
          message: 'Employee is not in Accounts department',
          error_code: 'NOT_ACCOUNTS_DEPARTMENT'
        };
      }

      // 3. Check if accountant record exists
      const accountant = await this.prisma.accountant.findUnique({
        where: { employeeId: dto.employee_id },
        select: {
          id: true,
          taxPermission: true,
          salaryPermission: true,
          salesPermission: true,
          invoicesPermission: true,
          expensesPermission: true,
          assetsPermission: true,
          revenuesPermission: true,
        },
      });

      if (!accountant) {
        return {
          status: 'error',
          message: 'Employee is not an accountant',
          error_code: 'NOT_ACCOUNTANT'
        };
      }

      // Debug: Log current accountant permissions
      this.logger.log(`Current accountant permissions: ${JSON.stringify(accountant)}`);

      // 4. Apply permission restrictions for non-admin users
      if (!isAdmin) {
        // Check if current user is account manager (department manager of Accounts)
        const currentEmployee = await this.prisma.employee.findUnique({
          where: { id: currentUserId },
          select: {
            id: true,
            department: {
              select: { name: true, managerId: true }
            }
          },
        });

        if (!currentEmployee) {
          return {
            status: 'error',
            message: 'Current user not found',
            error_code: 'CURRENT_USER_NOT_FOUND'
          };
        }

        // Check if current user is in Accounts department
        // if (currentEmployee.department?.name !== 'Accounts') {
        //   return {
        //     status: 'error',
        //     message: 'Only Accounts department members can update accountant permissions',
        //     error_code: 'NOT_ACCOUNTS_DEPARTMENT_MEMBER'
        //   };
        // }

        // Check if current user is the department manager
        // if (currentEmployee.department?.managerId !== currentUserId) {
        //   return {
        //     status: 'error',
        //     message: 'Only Accounts department manager can update accountant permissions',
        //     error_code: 'NOT_DEPARTMENT_MANAGER'
        //   };
        // }

        // Account manager cannot update their own permissions
        if (currentUserId === dto.employee_id) {
          return {
            status: 'error',
            message: 'Account manager cannot update their own permissions',
            error_code: 'SELF_PERMISSION_RESTRICTION'
          };
        }
      }

      // 5. Store current permissions for comparison
      const currentPermissions = {
        tax_permission: accountant.taxPermission ?? false,
        salary_permission: accountant.salaryPermission ?? false,
        sales_permission: accountant.salesPermission ?? false,
        invoices_permission: accountant.invoicesPermission ?? false,
        expenses_permission: accountant.expensesPermission ?? false,
        assets_permission: accountant.assetsPermission ?? false,
        revenues_permission: accountant.revenuesPermission ?? false,
      };

      // 6. Check which permissions need to be updated
      const permissionsToUpdate: any = {};
      const alreadySetPermissions: any = {};
      const changedPermissions: any = {};

      // Check each permission that was provided in the request
      if (dto.permissions.tax_permission !== undefined) {
        if (dto.permissions.tax_permission === currentPermissions.tax_permission) {
          alreadySetPermissions.tax_permission = dto.permissions.tax_permission;
        } else {
          permissionsToUpdate.taxPermission = dto.permissions.tax_permission;
          changedPermissions.tax_permission = currentPermissions.tax_permission;
        }
      }

      if (dto.permissions.salary_permission !== undefined) {
        if (dto.permissions.salary_permission === currentPermissions.salary_permission) {
          alreadySetPermissions.salary_permission = dto.permissions.salary_permission;
        } else {
          permissionsToUpdate.salaryPermission = dto.permissions.salary_permission;
          changedPermissions.salary_permission = currentPermissions.salary_permission;
        }
      }

      if (dto.permissions.sales_permission !== undefined) {
        if (dto.permissions.sales_permission === currentPermissions.sales_permission) {
          alreadySetPermissions.sales_permission = dto.permissions.sales_permission;
        } else {
          permissionsToUpdate.salesPermission = dto.permissions.sales_permission;
          changedPermissions.sales_permission = currentPermissions.sales_permission;
        }
      }

      if (dto.permissions.invoices_permission !== undefined) {
        if (dto.permissions.invoices_permission === currentPermissions.invoices_permission) {
          alreadySetPermissions.invoices_permission = dto.permissions.invoices_permission;
        } else {
          permissionsToUpdate.invoicesPermission = dto.permissions.invoices_permission;
          changedPermissions.invoices_permission = currentPermissions.invoices_permission;
        }
      }

      if (dto.permissions.expenses_permission !== undefined) {
        if (dto.permissions.expenses_permission === currentPermissions.expenses_permission) {
          alreadySetPermissions.expenses_permission = dto.permissions.expenses_permission;
        } else {
          permissionsToUpdate.expensesPermission = dto.permissions.expenses_permission;
          changedPermissions.expenses_permission = currentPermissions.expenses_permission;
        }
      }

      if (dto.permissions.assets_permission !== undefined) {
        if (dto.permissions.assets_permission === currentPermissions.assets_permission) {
          alreadySetPermissions.assets_permission = dto.permissions.assets_permission;
        } else {
          permissionsToUpdate.assetsPermission = dto.permissions.assets_permission;
          changedPermissions.assets_permission = currentPermissions.assets_permission;
        }
      }

      if (dto.permissions.revenues_permission !== undefined) {
        if (dto.permissions.revenues_permission === currentPermissions.revenues_permission) {
          alreadySetPermissions.revenues_permission = dto.permissions.revenues_permission;
        } else {
          permissionsToUpdate.revenuesPermission = dto.permissions.revenues_permission;
          changedPermissions.revenues_permission = currentPermissions.revenues_permission;
        }
      }

      // Debug logging
      this.logger.log(`Request permissions: ${JSON.stringify(dto.permissions)}`);
      this.logger.log(`Current permissions: ${JSON.stringify(currentPermissions)}`);
      this.logger.log(`Permissions to update: ${JSON.stringify(permissionsToUpdate)}`);
      this.logger.log(`Already set permissions: ${JSON.stringify(alreadySetPermissions)}`);

      // 7. If no permissions need to be updated, return early
      if (Object.keys(permissionsToUpdate).length === 0) {
        return {
          status: 'success',
          message: 'All permissions are already set to the requested values',
          employee_id: dto.employee_id,
          already_set_permissions: alreadySetPermissions,
          updated_permissions: undefined,
          previous_permissions: undefined,
        };
      }

      // 8. Update only the permissions that need to be changed
      const updateData = {
        ...permissionsToUpdate,
        updatedAt: this.getCurrentDateInPKT(),
      };

      this.logger.log(`Update data: ${JSON.stringify(updateData)}`);
      this.logger.log(`Accountant ID: ${accountant.id}`);

      const updatedAccountant = await this.prisma.accountant.update({
        where: { id: accountant.id },
        data: updateData,
      });

      this.logger.log(`Updated accountant result: ${JSON.stringify(updatedAccountant)}`);

      // 9. Create audit log entry
      const logDescription = `Accountant permissions updated for ${employee.firstName} ${employee.lastName} (ID: ${dto.employee_id}) by ${isAdmin ? 'Admin' : 'Account Manager ID: ' + currentUserId}`;

      try {
        this.logger.log(logDescription);
        this.logger.log(`Previous permissions: ${JSON.stringify(changedPermissions)}`);
        this.logger.log(`New permissions: ${JSON.stringify(permissionsToUpdate)}`);
      } catch (logError) {
        this.logger.error(`Failed to create audit log: ${logError.message}`);
      }

      this.logger.log(
        `Permissions updated for accountant ${dto.employee_id} by ${isAdmin ? 'admin' : 'account manager ' + currentUserId}`,
      );

      // 10. Prepare response
      const updatedPermissions: any = {};
      Object.keys(permissionsToUpdate).forEach(key => {
        const permissionKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        updatedPermissions[permissionKey] = permissionsToUpdate[key];
      });

      return {
        status: 'success',
        message: 'Permissions updated for accountant',
        employee_id: dto.employee_id,
        updated_permissions: updatedPermissions,
        previous_permissions: changedPermissions,
        already_set_permissions: Object.keys(alreadySetPermissions).length > 0 ? alreadySetPermissions : undefined,
      };

    } catch (error) {
      this.logger.error(`Failed to update permissions for accountant ${dto.employee_id}: ${error.message}`);

      // Handle specific database constraint errors
      if (error.message.includes('Unique constraint failed')) {
        return {
          status: 'error',
          message: 'Database constraint violation',
          error_code: 'DATABASE_CONSTRAINT_VIOLATION',
        };
      }

      // Return structured error response
      return {
        status: 'error',
        message: this.getErrorMessage(error.message),
        error_code: error.message,
      };
    }
  }

  /**
   * Converts error codes to user-friendly messages
   */
  private getErrorMessage(errorCode: string): string {
    switch (errorCode) {
      case 'EMPLOYEE_NOT_FOUND':
        return 'Employee not found';
      case 'EMPLOYEE_INACTIVE':
        return 'Employee is not active';
      case 'NOT_ACCOUNTS_DEPARTMENT':
        return 'Employee is not in Accounts department';
      case 'NOT_ACCOUNTANT':
        return 'Employee is not an accountant';
      case 'CURRENT_USER_NOT_FOUND':
        return 'Current user not found';
      case 'NOT_ACCOUNTS_DEPARTMENT_MEMBER':
        return 'Only Accounts department members can update accountant permissions';
      case 'NOT_DEPARTMENT_MANAGER':
        return 'Only Accounts department manager can update accountant permissions';
      case 'SELF_PERMISSION_RESTRICTION':
        return 'Account manager cannot update their own permissions';
      case 'DATABASE_CONSTRAINT_VIOLATION':
        return 'Database constraint violation';
      case 'NO_PERMISSIONS_PROVIDED':
        return 'No permissions provided to update';
      default:
        return 'An error occurred while updating permissions';
    }
  }
}
