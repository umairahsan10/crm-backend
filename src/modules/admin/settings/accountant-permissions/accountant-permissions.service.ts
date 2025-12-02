import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../../../prisma/prisma.service';
import { CreateAccountantPermissionDto } from './dto/create-accountant-permission.dto';
import { UpdateAccountantPermissionDto } from './dto/update-accountant-permission.dto';
import {
  AccountantPermissionResponseDto,
  AccountantPermissionsListResponseDto,
} from './dto/accountant-permission-response.dto';

@Injectable()
export class AccountantPermissionsService {
  private readonly logger = new Logger(AccountantPermissionsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get all accountant records with pagination
   */
  async getAllAccountantPermissions(
    page: number = 1,
    limit: number = 10,
    employeeId?: number,
  ): Promise<AccountantPermissionsListResponseDto> {
    const skip = (page - 1) * limit;
    const where = employeeId ? { employeeId } : {};

    try {
      const [accountants, total] = await Promise.all([
        this.prisma.accountant.findMany({
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
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        this.prisma.accountant.count({ where }),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        accountants,
        total,
        page,
        limit,
        totalPages,
      };
    } catch (error) {
      this.logger.error(`Failed to get accountant records: ${error.message}`);
      throw new BadRequestException(
        `Failed to get accountant records: ${error.message}`,
      );
    }
  }

  /**
   * Get accountant record by ID
   */
  async getAccountantPermissionById(
    id: number,
  ): Promise<AccountantPermissionResponseDto> {
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
   * Create a new accountant record
   */
  async createAccountantPermission(
    dto: CreateAccountantPermissionDto,
  ): Promise<AccountantPermissionResponseDto> {
    // Check if employee exists
    const employee = await this.prisma.employee.findUnique({
      where: { id: dto.employeeId },
    });

    if (!employee) {
      throw new NotFoundException(
        `Employee with ID ${dto.employeeId} not found`,
      );
    }

    // Check if employee is already an accountant
    const existingAccountant = await this.prisma.accountant.findUnique({
      where: { employeeId: dto.employeeId },
    });

    if (existingAccountant) {
      throw new BadRequestException(
        `Employee ${dto.employeeId} is already an accountant`,
      );
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

      this.logger.log(
        `Accountant record created for employee ${dto.employeeId}`,
      );
      return accountant;
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      this.logger.error(`Failed to create accountant record: ${error.message}`);
      throw new BadRequestException(
        `Failed to create accountant record: ${error.message}`,
      );
    }
  }

  /**
   * Update accountant record
   */
  async updateAccountantPermission(
    id: number,
    dto: UpdateAccountantPermissionDto,
  ): Promise<AccountantPermissionResponseDto> {
    // Check if accountant record exists
    const existingAccountant = await this.prisma.accountant.findUnique({
      where: { id },
    });

    if (!existingAccountant) {
      throw new NotFoundException(`Accountant record with ID ${id} not found`);
    }

    try {
      const updateData: any = {};

      // Only include fields that are provided
      if (dto.liabilitiesPermission !== undefined)
        updateData.liabilitiesPermission = dto.liabilitiesPermission;
      if (dto.salaryPermission !== undefined)
        updateData.salaryPermission = dto.salaryPermission;
      if (dto.salesPermission !== undefined)
        updateData.salesPermission = dto.salesPermission;
      if (dto.invoicesPermission !== undefined)
        updateData.invoicesPermission = dto.invoicesPermission;
      if (dto.expensesPermission !== undefined)
        updateData.expensesPermission = dto.expensesPermission;
      if (dto.assetsPermission !== undefined)
        updateData.assetsPermission = dto.assetsPermission;
      if (dto.revenuesPermission !== undefined)
        updateData.revenuesPermission = dto.revenuesPermission;

      const accountant = await this.prisma.accountant.update({
        where: { id },
        data: updateData,
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
      this.logger.error(
        `Failed to update accountant record ${id}: ${error.message}`,
      );
      throw new BadRequestException(
        `Failed to update accountant record: ${error.message}`,
      );
    }
  }

  /**
   * Delete accountant record
   */
  async deleteAccountantPermission(id: number): Promise<{ message: string }> {
    // Check if accountant record exists
    const accountant = await this.prisma.accountant.findUnique({
      where: { id },
    });

    if (!accountant) {
      throw new NotFoundException(`Accountant record with ID ${id} not found`);
    }

    try {
      await this.prisma.accountant.delete({
        where: { id },
      });

      this.logger.log(`Accountant record ${id} deleted successfully`);
      return { message: 'Accountant record deleted successfully' };
    } catch (error) {
      this.logger.error(
        `Failed to delete accountant record ${id}: ${error.message}`,
      );
      throw new BadRequestException(
        `Failed to delete accountant record: ${error.message}`,
      );
    }
  }
}
