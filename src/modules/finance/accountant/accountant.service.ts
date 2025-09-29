import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../../../prisma/prisma.service';
import { UpdatePermissionsDto, PermissionsDto } from './dto/update-permission.dto';
import { PermissionsResponseDto } from './dto/permission-response.dto';
import { AddVendorDto } from './dto/add-vendor.dto';
import { VendorResponseDto } from './dto/vendor-response.dto';
import { VendorListResponseDto } from './dto/vendor-list-response.dto';
import { CalculatePnLDto } from './dto/calculate-pnl.dto';
import { PnLResponseDto } from './dto/pnl-response.dto';
import { PnLCategoryResponseDto } from './dto/pnl-category-response.dto';

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
          liabilitiesPermission: true,
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
        liabilities_permission: accountant.liabilitiesPermission ?? false,
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
      if (dto.permissions.liabilities_permission !== undefined) {
        if (dto.permissions.liabilities_permission === currentPermissions.liabilities_permission) {
          alreadySetPermissions.liabilities_permission = dto.permissions.liabilities_permission;
        } else {
          permissionsToUpdate.liabilitiesPermission = dto.permissions.liabilities_permission;
          changedPermissions.liabilities_permission = currentPermissions.liabilities_permission;
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
   * Creates a new vendor record
   * Only accountants can perform this action
   */
  async addVendor(
    dto: AddVendorDto,
    currentUserId: number
  ): Promise<VendorResponseDto> {
    try {
      // 1. Check if current user exists and is active
      const currentEmployee = await this.prisma.employee.findUnique({
        where: { id: currentUserId },
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

      if (!currentEmployee) {
        return {
          status: 'error',
          message: 'Authentication failed: User account not found in the system. Please contact your administrator.',
          error_code: 'CURRENT_USER_NOT_FOUND'
        };
      }

      if (currentEmployee.status !== 'active') {
        return {
          status: 'error',
          message: `Access denied: Your account (${currentEmployee.firstName} ${currentEmployee.lastName}) is currently inactive. Please contact HR to reactivate your account.`,
          error_code: 'CURRENT_USER_INACTIVE'
        };
      }

      // 2. Check if employee is in Accounts department
      if (currentEmployee.department?.name !== 'Accounts') {
        return {
          status: 'error',
          message: `Permission denied: You (${currentEmployee.firstName} ${currentEmployee.lastName}) are in the ${currentEmployee.department?.name || 'Unknown'} department. Only members of the Accounts department can add vendor records.`,
          error_code: 'NOT_ACCOUNTS_DEPARTMENT'
        };
      }

      // 3. Check if employee is an accountant
      const accountant = await this.prisma.accountant.findUnique({
        where: { employeeId: currentUserId },
        select: { id: true },
      });

      if (!accountant) {
        return {
          status: 'error',
          message: `Access denied: You (${currentEmployee.firstName} ${currentEmployee.lastName}) are not authorized as an accountant. Only accountants can add vendor records. Please contact your department manager to request accountant privileges.`,
          error_code: 'NOT_ACCOUNTANT'
        };
      }

      // 4. Validate that at least one identifying field is provided
      if (!dto.name && !dto.contact_person && !dto.email && !dto.phone) {
        return {
          status: 'error',
          message: 'Validation error: Please provide at least one identifying field (name, contact person, email, or phone number) to create a vendor record.',
          error_code: 'INSUFFICIENT_VENDOR_DATA'
        };
      }

      // 5. Create vendor record
      const vendorData = {
        name: dto.name,
        contactPerson: dto.contact_person,
        email: dto.email,
        phone: dto.phone,
        address: dto.address,
        city: dto.city,
        country: dto.country,
        bankAccount: dto.bank_account,
        status: dto.status,
        createdBy: currentUserId,
        notes: dto.notes,
      };

      const newVendor = await this.prisma.vendor.create({
        data: vendorData,
      });

      this.logger.log(
        `Vendor created by accountant ${currentUserId}: ${newVendor.id}`,
      );

      // 6. Return success response
      return {
        status: 'success',
        message: `Vendor "${newVendor.name || 'Unnamed Vendor'}" has been successfully created with ID ${newVendor.id}. The vendor record is now available for use in financial transactions.`,
        vendor_id: newVendor.id,
        vendor_data: {
          id: newVendor.id,
          name: newVendor.name || undefined,
          contact_person: newVendor.contactPerson || undefined,
          email: newVendor.email || undefined,
          phone: newVendor.phone || undefined,
          address: newVendor.address || undefined,
          city: newVendor.city || undefined,
          country: newVendor.country || undefined,
          bank_account: newVendor.bankAccount || undefined,
          status: newVendor.status || undefined,
          created_by: newVendor.createdBy || undefined,
          notes: newVendor.notes || undefined,
          created_at: newVendor.createdAt,
          updated_at: newVendor.updatedAt,
        },
      };

    } catch (error) {
      this.logger.error(`Failed to create vendor: ${error.message}`);

      // Handle specific database constraint errors
      if (error.message.includes('Unique constraint failed')) {
        return {
          status: 'error',
          message: 'Database error: A vendor with similar information already exists. Please check for duplicate entries or contact support if this is unexpected.',
          error_code: 'DATABASE_CONSTRAINT_VIOLATION',
        };
      }

      // Handle validation errors
      if (error.message.includes('Validation failed')) {
        return {
          status: 'error',
          message: 'Validation error: Please check that all provided information is in the correct format (e.g., valid email address, proper phone number format).',
          error_code: 'VALIDATION_ERROR',
        };
      }

      // Handle database connection errors
      if (error.message.includes('connect') || error.message.includes('timeout')) {
        return {
          status: 'error',
          message: 'System error: Unable to connect to the database. Please try again in a few moments or contact technical support if the problem persists.',
          error_code: 'DATABASE_CONNECTION_ERROR',
        };
      }

      // Return structured error response
      return {
        status: 'error',
        message: this.getVendorErrorMessage(error.message),
        error_code: error.message,
      };
    }
  }

  /**
   * Retrieves all vendor records
   * Only accountants can perform this action
   */
  async getAllVendors(
    currentUserId: number
  ): Promise<VendorListResponseDto> {
    try {
      // 1. Check if current user exists and is active
      const currentEmployee = await this.prisma.employee.findUnique({
        where: { id: currentUserId },
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

      if (!currentEmployee) {
        return {
          status: 'error',
          message: 'Authentication failed: User account not found in the system. Please contact your administrator.',
          error_code: 'CURRENT_USER_NOT_FOUND'
        };
      }

      if (currentEmployee.status !== 'active') {
        return {
          status: 'error',
          message: `Access denied: Your account (${currentEmployee.firstName} ${currentEmployee.lastName}) is currently inactive. Please contact HR to reactivate your account.`,
          error_code: 'CURRENT_USER_INACTIVE'
        };
      }

      // 2. Check if employee is in Accounts department
      if (currentEmployee.department?.name !== 'Accounts') {
        return {
          status: 'error',
          message: `Permission denied: You (${currentEmployee.firstName} ${currentEmployee.lastName}) are in the ${currentEmployee.department?.name || 'Unknown'} department. Only members of the Accounts department can view vendor records.`,
          error_code: 'NOT_ACCOUNTS_DEPARTMENT'
        };
      }

      // 3. Check if employee is an accountant
      const accountant = await this.prisma.accountant.findUnique({
        where: { employeeId: currentUserId },
        select: { id: true },
      });

      if (!accountant) {
        return {
          status: 'error',
          message: `Access denied: You (${currentEmployee.firstName} ${currentEmployee.lastName}) are not authorized as an accountant. Only accountants can view vendor records. Please contact your department manager to request accountant privileges.`,
          error_code: 'NOT_ACCOUNTANT'
        };
      }

      // 4. Retrieve all vendor records
      const vendors = await this.prisma.vendor.findMany({
        orderBy: [
          { name: 'asc' }
        ],
        select: {
          id: true,
          name: true,
          contactPerson: true,
          email: true,
          phone: true,
          address: true,
          city: true,
          country: true,
          bankAccount: true,
          status: true,
          createdBy: true,
          notes: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      // 5. Get total count for metadata
      const totalCount = await this.prisma.vendor.count();

      this.logger.log(
        `Vendors retrieved by accountant ${currentUserId}: ${vendors.length} vendors found`,
      );

      // 6. Return success response
      return {
        status: 'success',
        message: `Successfully retrieved ${vendors.length} vendor record${vendors.length !== 1 ? 's' : ''}.`,
        vendors: vendors.map(vendor => ({
          id: vendor.id,
          name: vendor.name || undefined,
          contact_person: vendor.contactPerson || undefined,
          email: vendor.email || undefined,
          phone: vendor.phone || undefined,
          address: vendor.address || undefined,
          city: vendor.city || undefined,
          country: vendor.country || undefined,
          bank_account: vendor.bankAccount || undefined,
          status: vendor.status || undefined,
          created_by: vendor.createdBy || undefined,
          notes: vendor.notes || undefined,
          created_at: vendor.createdAt,
          updated_at: vendor.updatedAt,
        })),
        metadata: {
          total_count: totalCount,
        },
      };

    } catch (error) {
      this.logger.error(`Failed to retrieve vendors: ${error.message}`);

      // Handle database connection errors
      if (error.message.includes('connect') || error.message.includes('timeout')) {
        return {
          status: 'error',
          message: 'System error: Unable to connect to the database. Please try again in a few moments or contact technical support if the problem persists.',
          error_code: 'DATABASE_CONNECTION_ERROR',
        };
      }

      // Return structured error response
      return {
        status: 'error',
        message: this.getVendorListErrorMessage(error.message),
        error_code: error.message,
      };
    }
  }

  /**
   * Monthly P&L calculation cron job.
   * Runs on the 1st of every month at 12:00 AM PKT.
   * Cron expression: '0 0 1 * *' = At 00:00 (12:00 AM) on day-of-month 1
   */
  @Cron('0 0 1 * *', { timeZone: 'Asia/Karachi' })
  async handleMonthlyPnLCalculation() {
    try {
      // Check database connection first
      const isHealthy = await this.prisma.isConnectionHealthy();
      if (!isHealthy) {
        this.logger.warn('Database connection is unhealthy, attempting to reconnect...');
        const reconnected = await this.prisma.reconnectIfNeeded();
        if (!reconnected) {
          this.logger.warn('Failed to reconnect to database, skipping monthly P&L calculation');
          return;
        }
      }
      
      this.logger.log('🕔 12:00 AM PKT reached - Starting monthly auto P&L calculation');
      await this.calculateAndSavePnL();
      this.logger.log('✅ Monthly auto P&L calculation completed successfully');
    } catch (error) {
      if (error.message?.includes("Can't reach database server") || error.code === 'P1001') {
        this.logger.warn(`❌ Database connection issue in monthly P&L cron: ${error.message}`);
      } else {
        this.logger.error(`❌ Monthly P&L cron failed: ${error.message}`);
        throw error; // Re-throw to let NestJS handle the error
      }
    }
  }

  /**
   * Calculate P&L for a specific month and save to database (used by cron job)
   */
  public async calculateAndSavePnL(month?: string, year?: string): Promise<PnLResponseDto> {
    try {
      // Get the calculation period (previous month if not specified)
      const { calcMonth, calcYear } = this.getCalculationPeriod(month, year);
      
      this.logger.log(`🔄 Auto P&L calculation: Processing for ${calcMonth}/${calcYear}`);

      // Check if record already exists
      const existingRecord = await this.prisma.profitLoss.findFirst({
        where: {
          month: calcMonth,
          year: calcYear,
        },
      });

      if (existingRecord) {
        this.logger.log(`⏭️ P&L record already exists for ${calcMonth}/${calcYear} - skipping`);
        return {
          status: 'success',
          message: `P&L record already exists for ${calcMonth}/${calcYear}`,
          data: {
            month: calcMonth,
            year: calcYear,
            totalIncome: Number(existingRecord.totalIncome) || 0,
            totalExpenses: Number(existingRecord.totalExpenses) || 0,
            netProfit: Number(existingRecord.netProfit) || 0,
            calculationDate: existingRecord.createdAt.toISOString(),
          },
        };
      }

      // Calculate P&L
      const result = await this.calculatePnLInternal(calcMonth, calcYear);

      // Save to database with better error handling
      let savedRecord;
      try {
        savedRecord = await this.prisma.profitLoss.create({
          data: {
            month: calcMonth,
            year: calcYear,
            totalIncome: result.totalIncome,
            totalExpenses: result.totalExpenses,
            netProfit: result.netProfit,
          },
        });
      } catch (createError) {
        // If create fails due to unique constraint, try to find existing record
        if (createError.message.includes('Unique constraint failed')) {
          this.logger.log(`🔄 Unique constraint failed, checking for existing record`);
          const existingRecord = await this.prisma.profitLoss.findFirst({
            where: {
              month: calcMonth,
              year: calcYear,
            },
          });
          
          if (existingRecord) {
            this.logger.log(`✅ Found existing record for ${calcMonth}/${calcYear}`);
            savedRecord = existingRecord;
          } else {
            throw createError; // Re-throw if no existing record found
          }
        } else {
          throw createError; // Re-throw other errors
        }
      }

      this.logger.log(`✅ P&L calculation and save completed for ${calcMonth}/${calcYear} - record id ${savedRecord.id}`);

      return {
        status: 'success',
        message: `P&L calculation completed and saved for ${calcMonth}/${calcYear}`,
        data: {
          month: calcMonth,
          year: calcYear,
          totalIncome: result.totalIncome,
          totalExpenses: result.totalExpenses,
          netProfit: result.netProfit,
          calculationDate: savedRecord.createdAt.toISOString(),
        },
      };

    } catch (error) {
      this.logger.error(`Failed to calculate and save P&L: ${error.message}`);
      
      // Handle specific database errors
      if (error.message.includes('Unique constraint failed')) {
        return {
          status: 'error',
          message: 'P&L record already exists for this month/year',
          error_code: 'RECORD_ALREADY_EXISTS',
        };
      }
      
      return {
        status: 'error',
        message: 'Failed to calculate and save P&L',
        error_code: error.message,
      };
    }
  }

  /**
   * Read-only P&L calculation for a specific month (manual trigger)
   * This method calculates P&L but does NOT update the database.
   */
  public async calculatePnLPreview(month: string, year: string): Promise<PnLResponseDto> {
    try {
      this.logger.log(`⏳ Starting read-only P&L preview for ${month}/${year}`);

      // Validate month and year
      if (!this.isValidNumericMonth(month) || !this.isValidYear(year)) {
        return {
          status: 'error',
          message: 'Invalid month or year format. Month should be 01-12, year should be 2000-2100',
          error_code: 'INVALID_DATE_FORMAT',
        };
      }

      // Calculate P&L
      const result = await this.calculatePnLInternal(month, year);

      this.logger.log(`✅ P&L preview calculation completed for ${month}/${year}`);

      return {
        status: 'success',
        message: `P&L calculation preview for ${month}/${year}`,
        data: {
          month,
          year,
          totalIncome: result.totalIncome,
          totalExpenses: result.totalExpenses,
          netProfit: result.netProfit,
          calculationDate: new Date().toISOString(),
        },
      };

    } catch (error) {
      this.logger.error(`Failed to calculate P&L preview: ${error.message}`);
      return {
        status: 'error',
        message: 'Failed to calculate P&L preview',
        error_code: error.message,
      };
    }
  }

  /**
   * Read-only P&L calculation with category breakdown for a specific month
   * This method calculates P&L with detailed category breakdown but does NOT update the database.
   */
  public async calculatePnLWithCategories(month: string, year: string): Promise<PnLCategoryResponseDto> {
    try {
      this.logger.log(`⏳ Starting read-only P&L category breakdown for ${month}/${year}`);

      // Validate month and year
      if (!this.isValidNumericMonth(month) || !this.isValidYear(year)) {
        return {
          status: 'error',
          message: 'Invalid month or year format. Month should be 01-12, year should be 2000-2100',
          error_code: 'INVALID_DATE_FORMAT',
        };
      }

      // Calculate P&L with category breakdown
      const result = await this.calculatePnLWithCategoriesInternal(month, year);

      this.logger.log(`✅ P&L category breakdown completed for ${month}/${year}`);

      return {
        status: 'success',
        message: `P&L category breakdown for ${month}/${year}`,
        data: {
          month,
          year,
          totalIncome: result.totalIncome,
          totalExpenses: result.totalExpenses,
          netProfit: result.netProfit,
          revenueBreakdown: result.revenueBreakdown,
          expenseBreakdown: result.expenseBreakdown,
          calculationDate: new Date().toISOString(),
        },
      };

    } catch (error) {
      this.logger.error(`Failed to calculate P&L category breakdown: ${error.message}`);
      return {
        status: 'error',
        message: 'Failed to calculate P&L category breakdown',
        error_code: error.message,
      };
    }
  }

  /**
   * Internal method to calculate P&L for a specific month
   */
  private async calculatePnLInternal(month: string, year: string): Promise<{
    totalIncome: number;
    totalExpenses: number;
    netProfit: number;
  }> {
    // Get month number for date filtering
    const monthNumber = parseInt(month);
    const startDate = new Date(parseInt(year), monthNumber - 1, 1);
    const endDate = new Date(parseInt(year), monthNumber, 0); // Last day of the month

    this.logger.log(`📊 Calculating P&L for period: ${startDate.toISOString()} to ${endDate.toISOString()}`);

    // Calculate total revenue
    const totalRevenue = await this.prisma.revenue.aggregate({
      where: {
        receivedOn: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: {
        amount: true,
      },
    });

    // Calculate total expenses
    const totalExpenses = await this.prisma.expense.aggregate({
      where: {
        paidOn: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: {
        amount: true,
      },
    });

    const totalIncome = Number(totalRevenue._sum.amount) || 0;
    const totalExpensesAmount = Number(totalExpenses._sum.amount) || 0;
    const netProfit = totalIncome - totalExpensesAmount;

    this.logger.log(`💰 P&L calculation results: Income=${totalIncome}, Expenses=${totalExpensesAmount}, Net Profit=${netProfit}`);

    return {
      totalIncome,
      totalExpenses: totalExpensesAmount,
      netProfit,
    };
  }

  /**
   * Internal method to calculate P&L with category breakdown for a specific month
   */
  private async calculatePnLWithCategoriesInternal(month: string, year: string): Promise<{
    totalIncome: number;
    totalExpenses: number;
    netProfit: number;
    revenueBreakdown: Array<{ category: string; totalAmount: number; count: number }>;
    expenseBreakdown: Array<{ category: string; totalAmount: number; count: number }>;
  }> {
    // Get month number for date filtering
    const monthNumber = parseInt(month);
    const startDate = new Date(parseInt(year), monthNumber - 1, 1);
    const endDate = new Date(parseInt(year), monthNumber, 0); // Last day of the month

    this.logger.log(`📊 Calculating P&L category breakdown for period: ${startDate.toISOString()} to ${endDate.toISOString()}`);

    // Calculate revenue breakdown by category
    const revenueBreakdown = await this.prisma.revenue.groupBy({
      by: ['category'],
      where: {
        receivedOn: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: {
        amount: true,
      },
      _count: {
        id: true,
      },
    });

    // Calculate expense breakdown by category
    const expenseBreakdown = await this.prisma.expense.groupBy({
      by: ['category'],
      where: {
        paidOn: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: {
        amount: true,
      },
      _count: {
        id: true,
      },
    });

    // Calculate totals
    const totalIncome = revenueBreakdown.reduce((sum, item) => sum + Number(item._sum.amount || 0), 0);
    const totalExpenses = expenseBreakdown.reduce((sum, item) => sum + Number(item._sum.amount || 0), 0);
    const netProfit = totalIncome - totalExpenses;

    // Format revenue breakdown
    const formattedRevenueBreakdown = revenueBreakdown.map(item => ({
      category: item.category || 'Uncategorized',
      totalAmount: Number(item._sum.amount || 0),
      count: item._count.id,
    }));

    // Format expense breakdown
    const formattedExpenseBreakdown = expenseBreakdown.map(item => ({
      category: item.category || 'Uncategorized',
      totalAmount: Number(item._sum.amount || 0),
      count: item._count.id,
    }));

    this.logger.log(`💰 P&L category breakdown results: Income=${totalIncome}, Expenses=${totalExpenses}, Net Profit=${netProfit}`);
    this.logger.log(`📈 Revenue categories: ${formattedRevenueBreakdown.length}, Expense categories: ${formattedExpenseBreakdown.length}`);

    return {
      totalIncome,
      totalExpenses,
      netProfit,
      revenueBreakdown: formattedRevenueBreakdown,
      expenseBreakdown: formattedExpenseBreakdown,
    };
  }

  /**
   * Get calculation period (previous month if not specified)
   */
  private getCalculationPeriod(month?: string, year?: string): { calcMonth: string; calcYear: string } {
    if (month && year) {
      return { calcMonth: month, calcYear: year };
    }

    // Calculate previous month
    const currentDate = this.getCurrentDateInPKT();
    const previousMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    
    const calcMonth = String(previousMonth.getMonth() + 1).padStart(2, '0'); // 01, 02, 03, etc.
    const calcYear = previousMonth.getFullYear().toString();

    return { calcMonth, calcYear };
  }

  /**
   * Validate numeric month format (01-12)
   */
  private isValidNumericMonth(month: string): boolean {
    const monthNum = parseInt(month);
    return !isNaN(monthNum) && monthNum >= 1 && monthNum <= 12;
  }

  /**
   * Validate year format
   */
  private isValidYear(year: string): boolean {
    const yearNum = parseInt(year);
    return !isNaN(yearNum) && yearNum >= 2000 && yearNum <= 2100;
  }

  /**
   * Converts error codes to user-friendly messages for vendor list operations
   */
  private getVendorListErrorMessage(errorCode: string): string {
    switch (errorCode) {
      case 'CURRENT_USER_NOT_FOUND':
        return 'Authentication failed: User account not found in the system. Please contact your administrator.';
      case 'CURRENT_USER_INACTIVE':
        return 'Access denied: Your account is currently inactive. Please contact HR to reactivate your account.';
      case 'NOT_ACCOUNTS_DEPARTMENT':
        return 'Permission denied: Only members of the Accounts department can view vendor records.';
      case 'NOT_ACCOUNTANT':
        return 'Access denied: Only accountants can view vendor records. Please contact your department manager to request accountant privileges.';
      case 'DATABASE_CONNECTION_ERROR':
        return 'System error: Unable to connect to the database. Please try again in a few moments.';
      default:
        return 'An unexpected error occurred while retrieving vendor records. Please try again or contact technical support if the problem persists.';
    }
  }

  /**
   * Converts error codes to user-friendly messages for vendor operations
   */
  private getVendorErrorMessage(errorCode: string): string {
    switch (errorCode) {
      case 'CURRENT_USER_NOT_FOUND':
        return 'Authentication failed: User account not found in the system. Please contact your administrator.';
      case 'CURRENT_USER_INACTIVE':
        return 'Access denied: Your account is currently inactive. Please contact HR to reactivate your account.';
      case 'NOT_ACCOUNTS_DEPARTMENT':
        return 'Permission denied: Only members of the Accounts department can add vendor records.';
      case 'NOT_ACCOUNTANT':
        return 'Access denied: Only accountants can add vendor records. Please contact your department manager to request accountant privileges.';
      case 'DATABASE_CONSTRAINT_VIOLATION':
        return 'Database error: A vendor with similar information already exists. Please check for duplicate entries.';
      case 'VALIDATION_ERROR':
        return 'Validation error: Please check that all provided information is in the correct format.';
      case 'DATABASE_CONNECTION_ERROR':
        return 'System error: Unable to connect to the database. Please try again in a few moments.';
      case 'INSUFFICIENT_VENDOR_DATA':
        return 'Validation error: Please provide at least one identifying field (name, contact person, email, or phone number) to create a vendor record.';
      default:
        return 'An unexpected error occurred while creating the vendor. Please try again or contact technical support if the problem persists.';
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
