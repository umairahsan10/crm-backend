import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../../prisma/prisma.service';
import { CreateAccountDto, UpdateAccountDto } from '../dto/accounts.dto';

@Injectable()
export class AccountsService {
  private readonly logger = new Logger(AccountsService.name);

  constructor(
    private readonly prisma: PrismaService,
  ) { }

  async getAllAccountRecords() {
    try {
      const accountRecords = await this.prisma.account.findMany({
        include: {
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              status: true,
              department: {
                select: {
                  id: true,
                  name: true,
                },
              },
              role: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      this.logger.log(`Retrieved ${accountRecords.length} account records`);
      return accountRecords;
    } catch (error) {
      this.logger.error(`Failed to retrieve account records: ${error.message}`);
      throw error;
    }
  }

  async getAccountRecordById(id: number) {
    try {
      const accountRecord = await this.prisma.account.findUnique({
        where: { id },
        include: {
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              status: true,
              department: {
                select: {
                  id: true,
                  name: true,
                },
              },
              role: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });

      if (!accountRecord) {
        throw new NotFoundException(`Account record with ID ${id} not found`);
      }

      this.logger.log(`Retrieved account record with ID ${id}`);
      return accountRecord;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to retrieve account record ${id}: ${error.message}`);
      throw error;
    }
  }

  async createAccountRecord(dto: CreateAccountDto) {
    try {
      const employee = await this.prisma.employee.findUnique({
        where: { id: dto.employeeId },
        select: { id: true, firstName: true, lastName: true, email: true },
      });

      if (!employee) {
        throw new BadRequestException(`Employee with ID ${dto.employeeId} does not exist. Account records can only be created for existing employees.`);
      }

      const existingAccountRecord = await this.prisma.account.findFirst({
        where: { employeeId: dto.employeeId },
      });

      if (existingAccountRecord) {
        throw new BadRequestException(`Account record already exists for employee ${dto.employeeId}. Use update endpoint instead.`);
      }

      const accountRecord = await this.prisma.account.create({
        data: {
          employeeId: dto.employeeId,
          accountTitle: dto.accountTitle,
          bankName: dto.bankName,
          ibanNumber: dto.ibanNumber,
          baseSalary: dto.baseSalary,
        },
        include: {
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              status: true,
              department: {
                select: {
                  id: true,
                  name: true,
                },
              },
              role: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });

      this.logger.log(`Created account record for employee ${dto.employeeId}`);
      return accountRecord;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Failed to create account record: ${error.message}`);
      throw new BadRequestException(`Failed to create account record: ${error.message}`);
    }
  }

  async updateAccountRecord(id: number, dto: UpdateAccountDto) {
    try {
      const existingAccountRecord = await this.prisma.account.findUnique({
        where: { id },
        include: { employee: { select: { id: true, firstName: true, lastName: true, email: true } } },
      });

      if (!existingAccountRecord) {
        throw new NotFoundException(`Account record with ID ${id} not found`);
      }

      const employee = await this.prisma.employee.findUnique({
        where: { id: existingAccountRecord.employeeId },
        select: { id: true, firstName: true, lastName: true, email: true },
      });

      if (!employee) {
        throw new BadRequestException(`Employee with ID ${existingAccountRecord.employeeId} no longer exists. Cannot update account record.`);
      }

      const updatedAccountRecord = await this.prisma.account.update({
        where: { id },
        data: {
          accountTitle: dto.accountTitle,
          bankName: dto.bankName,
          ibanNumber: dto.ibanNumber,
          baseSalary: dto.baseSalary,
        },
        include: {
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              status: true,
              department: {
                select: {
                  id: true,
                  name: true,
                },
              },
              role: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });

      this.logger.log(`Updated account record with ID ${id}`);
      return updatedAccountRecord;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Failed to update account record ${id}: ${error.message}`);
      throw new BadRequestException(`Failed to update account record: ${error.message}`);
    }
  }

  async deleteAccountRecord(id: number) {
    try {
      const existingAccountRecord = await this.prisma.account.findUnique({
        where: { id },
        include: { employee: { select: { id: true, firstName: true, lastName: true, email: true } } },
      });

      if (!existingAccountRecord) {
        throw new NotFoundException(`Account record with ID ${id} not found`);
      }

      const employee = await this.prisma.employee.findUnique({
        where: { id: existingAccountRecord.employeeId },
        select: { id: true, firstName: true, lastName: true, email: true },
      });

      if (!employee) {
        throw new BadRequestException(`Employee with ID ${existingAccountRecord.employeeId} no longer exists. Cannot delete account record.`);
      }

      await this.prisma.account.delete({
        where: { id },
      });

      this.logger.log(`Deleted account record with ID ${id} for employee ${existingAccountRecord.employeeId}`);

      return {
        message: `Account record for employee ${employee.firstName} ${employee.lastName} (ID: ${existingAccountRecord.employeeId}) has been successfully deleted.`,
        deletedRecord: {
          id: existingAccountRecord.id,
          employeeId: existingAccountRecord.employeeId,
          employeeName: `${employee.firstName} ${employee.lastName}`,
          employeeEmail: employee.email,
        }
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Failed to delete account record ${id}: ${error.message}`);
      throw new BadRequestException(`Failed to delete account record: ${error.message}`);
    }
  }
} 