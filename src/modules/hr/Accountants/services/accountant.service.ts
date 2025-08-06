import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../../prisma/prisma.service';
import { CreateAccountantDto } from '../dto/accountant.dto';
import { UpdateAccountantDto } from '../dto/accountant.dto';
import { AccountantResponseDto, AccountantListResponseDto } from '../dto/accountant.dto';

@Injectable()
export class AccountantService {
  private readonly logger = new Logger(AccountantService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new accountant record
   * Validates that the employee exists and is not already an accountant
   */
  async createAccountant(dto: CreateAccountantDto, hrEmployeeId: number): Promise<AccountantResponseDto> {
    // Validate HR employee exists
    const hrEmployee = await this.prisma.employee.findUnique({
      where: { id: hrEmployeeId },
    });

    if (!hrEmployee) {
      throw new NotFoundException(`HR Employee with ID ${hrEmployeeId} not found`);
    }

    // Get HR record
    const hrRecord = await this.prisma.hR.findUnique({
      where: { employeeId: hrEmployeeId },
    });

    if (!hrRecord) {
      throw new NotFoundException(`HR record not found for employee ${hrEmployeeId}`);
    }

    // Check if employee exists
    const employee = await this.prisma.employee.findUnique({
      where: { id: dto.employeeId },
    });

    if (!employee) {
      throw new NotFoundException(`Employee with ID ${dto.employeeId} not found`);
    }

    // Check if employee is already an accountant
    const existingAccountant = await this.prisma.accountant.findUnique({
      where: { employeeId: dto.employeeId },
    });

    if (existingAccountant) {
      throw new BadRequestException(`Employee ${dto.employeeId} is already an accountant`);
    }

    try {
      const accountant = await this.prisma.accountant.create({
        data: {
          employeeId: dto.employeeId,
          liabilitiesPermission: dto.liabilitiesPermission,
          salaryPermission: dto.salaryPermission,
          salesPermission: dto.salesPermission,
          invoicesPermission: dto.invoicesPermission,
          expensesPermission: dto.expensesPermission,
          assetsPermission: dto.assetsPermission,
          revenuesPermission: dto.revenuesPermission,
        },
        include: {
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      // Create HR log entry with detailed permissions
      const permissions: string[] = [];
      if (dto.liabilitiesPermission) permissions.push('Liabilities');
      if (dto.salaryPermission) permissions.push('Salary');
      if (dto.salesPermission) permissions.push('Sales');
      if (dto.invoicesPermission) permissions.push('Invoices');
      if (dto.expensesPermission) permissions.push('Expenses');
      if (dto.assetsPermission) permissions.push('Assets');
      if (dto.revenuesPermission) permissions.push('Revenues');

      const logDescription = `Accountant record created for employee ${employee.firstName} ${employee.lastName} (ID: ${employee.id}, Email: ${employee.email}) - Permissions granted: ${permissions.length > 0 ? permissions.join(', ') : 'None'}`;
      await this.createHrLog(hrEmployeeId, 'accountant_created', employee.id, logDescription);

      this.logger.log(`Accountant record created for employee ${dto.employeeId}`);
      return accountant;
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to create accountant record: ${error.message}`);
      throw new BadRequestException(`Failed to create accountant record: ${error.message}`);
    }
  }

  /**
   * Get all accountant records with optional employee filtering
   */
  async getAllAccountants(employeeId?: number): Promise<AccountantListResponseDto> {
    try {
      const where = employeeId ? { employeeId } : {};

      const accountants = await this.prisma.accountant.findMany({
        where,
        include: {
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      const total = await this.prisma.accountant.count({ where });

      return {
        accountants,
        total,
      };
    } catch (error) {
      this.logger.error(`Failed to get accountant records: ${error.message}`);
      throw new BadRequestException(`Failed to get accountant records: ${error.message}`);
    }
  }

  /**
   * Get accountant record by ID
   */
  async getAccountantById(id: number): Promise<AccountantResponseDto> {
    try {
      const accountant = await this.prisma.accountant.findUnique({
        where: { id },
        include: {
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      if (!accountant) {
        throw new NotFoundException(`Accountant record with ID ${id} not found`);
      }

      return accountant;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to get accountant record ${id}: ${error.message}`);
      throw new BadRequestException(`Failed to get accountant record: ${error.message}`);
    }
  }

  /**
   * Update accountant record
   * Allows updating any column of the accountant table
   */
  async updateAccountant(id: number, dto: UpdateAccountantDto, hrEmployeeId: number): Promise<AccountantResponseDto> {
    // Validate HR employee exists
    const hrEmployee = await this.prisma.employee.findUnique({
      where: { id: hrEmployeeId },
    });

    if (!hrEmployee) {
      throw new NotFoundException(`HR Employee with ID ${hrEmployeeId} not found`);
    }

    // Get HR record
    const hrRecord = await this.prisma.hR.findUnique({
      where: { employeeId: hrEmployeeId },
    });

    if (!hrRecord) {
      throw new NotFoundException(`HR record not found for employee ${hrEmployeeId}`);
    }

    // Check if accountant record exists
    const existingAccountant = await this.prisma.accountant.findUnique({
      where: { id },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!existingAccountant) {
      throw new NotFoundException(`Accountant record with ID ${id} not found`);
    }

    try {
      // Track changes for logging
      const changes: string[] = [];

      if (dto.liabilitiesPermission !== undefined && dto.liabilitiesPermission !== existingAccountant.liabilitiesPermission) {
        changes.push(`Liabilities Permission: ${existingAccountant.liabilitiesPermission ? 'Yes' : 'No'} → ${dto.liabilitiesPermission ? 'Yes' : 'No'}`);
      }
      if (dto.salaryPermission !== undefined && dto.salaryPermission !== existingAccountant.salaryPermission) {
        changes.push(`Salary Permission: ${existingAccountant.salaryPermission ? 'Yes' : 'No'} → ${dto.salaryPermission ? 'Yes' : 'No'}`);
      }
      if (dto.salesPermission !== undefined && dto.salesPermission !== existingAccountant.salesPermission) {
        changes.push(`Sales Permission: ${existingAccountant.salesPermission ? 'Yes' : 'No'} → ${dto.salesPermission ? 'Yes' : 'No'}`);
      }
      if (dto.invoicesPermission !== undefined && dto.invoicesPermission !== existingAccountant.invoicesPermission) {
        changes.push(`Invoices Permission: ${existingAccountant.invoicesPermission ? 'Yes' : 'No'} → ${dto.invoicesPermission ? 'Yes' : 'No'}`);
      }
      if (dto.expensesPermission !== undefined && dto.expensesPermission !== existingAccountant.expensesPermission) {
        changes.push(`Expenses Permission: ${existingAccountant.expensesPermission ? 'Yes' : 'No'} → ${dto.expensesPermission ? 'Yes' : 'No'}`);
      }
      if (dto.assetsPermission !== undefined && dto.assetsPermission !== existingAccountant.assetsPermission) {
        changes.push(`Assets Permission: ${existingAccountant.assetsPermission ? 'Yes' : 'No'} → ${dto.assetsPermission ? 'Yes' : 'No'}`);
      }
      if (dto.revenuesPermission !== undefined && dto.revenuesPermission !== existingAccountant.revenuesPermission) {
        changes.push(`Revenues Permission: ${existingAccountant.revenuesPermission ? 'Yes' : 'No'} → ${dto.revenuesPermission ? 'Yes' : 'No'}`);
      }

      const accountant = await this.prisma.accountant.update({
        where: { id },
        data: {
          liabilitiesPermission: dto.liabilitiesPermission,
          salaryPermission: dto.salaryPermission,
          salesPermission: dto.salesPermission,
          invoicesPermission: dto.invoicesPermission,
          expensesPermission: dto.expensesPermission,
          assetsPermission: dto.assetsPermission,
          revenuesPermission: dto.revenuesPermission,
        },
        include: {
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      // Create HR log entry with detailed changes
      const logDescription = changes.length > 0 
        ? `Accountant record updated for employee ${existingAccountant.employee.firstName} ${existingAccountant.employee.lastName} (ID: ${existingAccountant.employee.id}) - Changes: ${changes.join(', ')}`
        : `Accountant record updated for employee ${existingAccountant.employee.firstName} ${existingAccountant.employee.lastName} (ID: ${existingAccountant.employee.id}) - No changes detected`;
      
      await this.createHrLog(hrEmployeeId, 'accountant_updated', existingAccountant.employee.id, logDescription);

      this.logger.log(`Accountant record ${id} updated successfully`);
      return accountant;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Failed to update accountant record ${id}: ${error.message}`);
      throw new BadRequestException(`Failed to update accountant record: ${error.message}`);
    }
  }

  /**
   * Delete accountant record
   * Removes employee from accountant department
   */
  async deleteAccountant(id: number, hrEmployeeId: number): Promise<{ message: string }> {
    // Validate HR employee exists
    const hrEmployee = await this.prisma.employee.findUnique({
      where: { id: hrEmployeeId },
    });

    if (!hrEmployee) {
      throw new NotFoundException(`HR Employee with ID ${hrEmployeeId} not found`);
    }

    // Get HR record
    const hrRecord = await this.prisma.hR.findUnique({
      where: { employeeId: hrEmployeeId },
    });

    if (!hrRecord) {
      throw new NotFoundException(`HR record not found for employee ${hrEmployeeId}`);
    }

    // Check if accountant record exists
    const existingAccountant = await this.prisma.accountant.findUnique({
      where: { id },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!existingAccountant) {
      throw new NotFoundException(`Accountant record with ID ${id} not found`);
    }

    const employeeId = existingAccountant.employeeId;

    // Store accountant details before deletion for logging
    const accountantDetails = {
      liabilitiesPermission: existingAccountant.liabilitiesPermission,
      salaryPermission: existingAccountant.salaryPermission,
      salesPermission: existingAccountant.salesPermission,
      invoicesPermission: existingAccountant.invoicesPermission,
      expensesPermission: existingAccountant.expensesPermission,
      assetsPermission: existingAccountant.assetsPermission,
      revenuesPermission: existingAccountant.revenuesPermission,
    };

    try {
      // Use transaction to ensure all operations succeed or fail together
      await this.prisma.$transaction(async (prisma) => {
        // Delete the accountant record
        await prisma.accountant.delete({
          where: { id },
        });

        this.logger.log(`Accountant record ${id} deleted successfully for employee ${employeeId}`);
      });

      // Create HR log entry with detailed accountant information
      const permissions: string[] = [];
      if (accountantDetails.liabilitiesPermission) permissions.push('Liabilities');
      if (accountantDetails.salaryPermission) permissions.push('Salary');
      if (accountantDetails.salesPermission) permissions.push('Sales');
      if (accountantDetails.invoicesPermission) permissions.push('Invoices');
      if (accountantDetails.expensesPermission) permissions.push('Expenses');
      if (accountantDetails.assetsPermission) permissions.push('Assets');
      if (accountantDetails.revenuesPermission) permissions.push('Revenues');

      const logDescription = `Accountant record deleted for employee ${existingAccountant.employee.firstName} ${existingAccountant.employee.lastName} (ID: ${existingAccountant.employee.id}, Email: ${existingAccountant.employee.email}) - Removed permissions: ${permissions.length > 0 ? permissions.join(', ') : 'None'}`;
      await this.createHrLog(hrEmployeeId, 'accountant_deleted', existingAccountant.employee.id, logDescription);

      return {
        message: `Employee ${existingAccountant.employee.firstName} ${existingAccountant.employee.lastName} removed from accountant department successfully`,
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Failed to delete accountant record ${id}: ${error.message}`);
      throw new BadRequestException(`Failed to delete accountant record: ${error.message}`);
    }
  }

  /**
   * Helper method to create HR log entries
   */
  private async createHrLog(hrEmployeeId: number, actionType: string, affectedEmployeeId: number, description: string) {
    try {
      const hrRecord = await this.prisma.hR.findUnique({
        where: { employeeId: hrEmployeeId },
      });

      if (hrRecord) {
        await this.prisma.hRLog.create({
          data: {
            hrId: hrRecord.id,
            actionType,
            affectedEmployeeId,
            description,
          },
        });
        this.logger.log(`HR log created for action: ${actionType}, affected employee: ${affectedEmployeeId}`);
      } else {
        this.logger.warn(`No HR record found for HR employee ${hrEmployeeId}, skipping log creation`);
      }
    } catch (error) {
      this.logger.error(`Failed to create HR log: ${error.message}`);
      // Don't fail the main operation if log creation fails
    }
  }
} 