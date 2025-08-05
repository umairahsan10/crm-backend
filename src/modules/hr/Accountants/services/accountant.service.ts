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
  async createAccountant(dto: CreateAccountantDto): Promise<AccountantResponseDto> {
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
          taxPermission: dto.taxPermission,
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

      this.logger.log(`Accountant record created for employee ${dto.employeeId}`);
      return accountant;
    } catch (error) {
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
  }

  /**
   * Update accountant record
   * Allows updating any column of the accountant table
   */
  async updateAccountant(id: number, dto: UpdateAccountantDto): Promise<AccountantResponseDto> {
    // Check if accountant record exists
    const existingAccountant = await this.prisma.accountant.findUnique({
      where: { id },
    });

    if (!existingAccountant) {
      throw new NotFoundException(`Accountant record with ID ${id} not found`);
    }

    try {
      const accountant = await this.prisma.accountant.update({
        where: { id },
        data: {
          taxPermission: dto.taxPermission,
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

      this.logger.log(`Accountant record ${id} updated successfully`);
      return accountant;
    } catch (error) {
      this.logger.error(`Failed to update accountant record ${id}: ${error.message}`);
      throw new BadRequestException(`Failed to update accountant record: ${error.message}`);
    }
  }

  /**
   * Delete accountant record
   * Removes employee from accountant department
   */
  async deleteAccountant(id: number): Promise<{ message: string }> {
    // Check if accountant record exists
    const existingAccountant = await this.prisma.accountant.findUnique({
      where: { id },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!existingAccountant) {
      throw new NotFoundException(`Accountant record with ID ${id} not found`);
    }

    const employeeId = existingAccountant.employeeId;

    try {
      // Use transaction to ensure all operations succeed or fail together
      await this.prisma.$transaction(async (prisma) => {
        // Delete the accountant record
        await prisma.accountant.delete({
          where: { id },
        });

        this.logger.log(`Accountant record ${id} deleted successfully for employee ${employeeId}`);
      });

      return {
        message: `Employee ${existingAccountant.employee.firstName} ${existingAccountant.employee.lastName} removed from accountant department successfully`,
      };
    } catch (error) {
      this.logger.error(`Failed to delete accountant record ${id}: ${error.message}`);
      throw new BadRequestException(`Failed to delete accountant record: ${error.message}`);
    }
  }
} 