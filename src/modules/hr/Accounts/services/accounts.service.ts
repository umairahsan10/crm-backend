import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../../../prisma/prisma.service';
import { CreateAccountDto, UpdateAccountDto } from '../dto/accounts.dto';

@Injectable()
export class AccountsService {
  private readonly logger = new Logger(AccountsService.name);

  constructor(private readonly prisma: PrismaService) {}

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
      throw new BadRequestException(
        `Failed to retrieve account records: ${error.message}`,
      );
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
      this.logger.error(
        `Failed to retrieve account record ${id}: ${error.message}`,
      );
      throw new BadRequestException(
        `Failed to retrieve account record: ${error.message}`,
      );
    }
  }

  async createAccountRecord(dto: CreateAccountDto, hrEmployeeId: number) {
    // Validate HR employee exists
    const hrEmployee = await this.prisma.employee.findUnique({
      where: { id: hrEmployeeId },
    });

    if (!hrEmployee) {
      throw new NotFoundException(
        `HR Employee with ID ${hrEmployeeId} not found`,
      );
    }

    // Get HR record
    const hrRecord = await this.prisma.hR.findUnique({
      where: { employeeId: hrEmployeeId },
    });

    if (!hrRecord) {
      throw new NotFoundException(
        `HR record not found for employee ${hrEmployeeId}`,
      );
    }

    try {
      const employee = await this.prisma.employee.findUnique({
        where: { id: dto.employeeId },
        select: { id: true, firstName: true, lastName: true, email: true },
      });

      if (!employee) {
        throw new BadRequestException(
          `Employee with ID ${dto.employeeId} does not exist. Account records can only be created for existing employees.`,
        );
      }

      const existingAccountRecord = await this.prisma.account.findFirst({
        where: { employeeId: dto.employeeId },
      });

      if (existingAccountRecord) {
        throw new BadRequestException(
          `Account record already exists for employee ${dto.employeeId}. Use update endpoint instead.`,
        );
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

      // Create HR log entry
      const logDescription = `Account record created for employee ${employee.firstName} ${employee.lastName} (ID: ${employee.id}, Email: ${employee.email}) - Bank: ${dto.bankName || 'N/A'}, Account Title: ${dto.accountTitle || 'N/A'}, Base Salary: ${dto.baseSalary || 'N/A'}`;
      await this.createHrLog(
        hrEmployeeId,
        'account_created',
        employee.id,
        logDescription,
      );

      this.logger.log(`Created account record for employee ${dto.employeeId}`);
      return accountRecord;
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      this.logger.error(`Failed to create account record: ${error.message}`);
      throw new BadRequestException(
        `Failed to create account record: ${error.message}`,
      );
    }
  }

  async updateAccountRecord(
    id: number,
    dto: UpdateAccountDto,
    hrEmployeeId: number,
  ) {
    // Validate HR employee exists
    const hrEmployee = await this.prisma.employee.findUnique({
      where: { id: hrEmployeeId },
    });

    if (!hrEmployee) {
      throw new NotFoundException(
        `HR Employee with ID ${hrEmployeeId} not found`,
      );
    }

    // Get HR record
    const hrRecord = await this.prisma.hR.findUnique({
      where: { employeeId: hrEmployeeId },
    });

    if (!hrRecord) {
      throw new NotFoundException(
        `HR record not found for employee ${hrEmployeeId}`,
      );
    }

    try {
      const existingAccountRecord = await this.prisma.account.findUnique({
        where: { id },
        include: {
          employee: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
      });

      if (!existingAccountRecord) {
        throw new NotFoundException(`Account record with ID ${id} not found`);
      }

      const employee = await this.prisma.employee.findUnique({
        where: { id: existingAccountRecord.employeeId },
        select: { id: true, firstName: true, lastName: true, email: true },
      });

      if (!employee) {
        throw new BadRequestException(
          `Employee with ID ${existingAccountRecord.employeeId} no longer exists. Cannot update account record.`,
        );
      }

      // Track changes for logging
      const changes: string[] = [];
      if (
        dto.accountTitle !== undefined &&
        dto.accountTitle !== existingAccountRecord.accountTitle
      ) {
        changes.push(
          `Account Title: ${existingAccountRecord.accountTitle || 'N/A'} → ${dto.accountTitle}`,
        );
      }
      if (
        dto.bankName !== undefined &&
        dto.bankName !== existingAccountRecord.bankName
      ) {
        changes.push(
          `Bank Name: ${existingAccountRecord.bankName || 'N/A'} → ${dto.bankName}`,
        );
      }
      if (
        dto.ibanNumber !== undefined &&
        dto.ibanNumber !== existingAccountRecord.ibanNumber
      ) {
        changes.push(
          `IBAN: ${existingAccountRecord.ibanNumber || 'N/A'} → ${dto.ibanNumber}`,
        );
      }
      if (
        dto.baseSalary !== undefined &&
        dto.baseSalary !== Number(existingAccountRecord.baseSalary)
      ) {
        changes.push(
          `Base Salary: ${existingAccountRecord.baseSalary || 'N/A'} → ${dto.baseSalary}`,
        );
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

      // Create HR log entry with detailed changes
      const logDescription =
        changes.length > 0
          ? `Account record updated for employee ${employee.firstName} ${employee.lastName} (ID: ${employee.id}) - Changes: ${changes.join(', ')}`
          : `Account record updated for employee ${employee.firstName} ${employee.lastName} (ID: ${employee.id}) - No changes detected`;

      await this.createHrLog(
        hrEmployeeId,
        'account_updated',
        employee.id,
        logDescription,
      );

      this.logger.log(`Updated account record with ID ${id}`);
      return updatedAccountRecord;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      this.logger.error(
        `Failed to update account record ${id}: ${error.message}`,
      );
      throw new BadRequestException(
        `Failed to update account record: ${error.message}`,
      );
    }
  }

  async deleteAccountRecord(id: number, hrEmployeeId: number) {
    // Validate HR employee exists
    const hrEmployee = await this.prisma.employee.findUnique({
      where: { id: hrEmployeeId },
    });

    if (!hrEmployee) {
      throw new NotFoundException(
        `HR Employee with ID ${hrEmployeeId} not found`,
      );
    }

    // Get HR record
    const hrRecord = await this.prisma.hR.findUnique({
      where: { employeeId: hrEmployeeId },
    });

    if (!hrRecord) {
      throw new NotFoundException(
        `HR record not found for employee ${hrEmployeeId}`,
      );
    }

    try {
      const existingAccountRecord = await this.prisma.account.findUnique({
        where: { id },
        include: {
          employee: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
      });

      if (!existingAccountRecord) {
        throw new NotFoundException(`Account record with ID ${id} not found`);
      }

      const employee = await this.prisma.employee.findUnique({
        where: { id: existingAccountRecord.employeeId },
        select: { id: true, firstName: true, lastName: true, email: true },
      });

      if (!employee) {
        throw new BadRequestException(
          `Employee with ID ${existingAccountRecord.employeeId} no longer exists. Cannot delete account record.`,
        );
      }

      // Store account details before deletion for logging
      const accountDetails = {
        accountTitle: existingAccountRecord.accountTitle,
        bankName: existingAccountRecord.bankName,
        ibanNumber: existingAccountRecord.ibanNumber,
        baseSalary: existingAccountRecord.baseSalary,
      };

      await this.prisma.account.delete({
        where: { id },
      });

      // Create HR log entry with detailed account information
      const logDescription = `Account record deleted for employee ${employee.firstName} ${employee.lastName} (ID: ${employee.id}, Email: ${employee.email}) - Account Details: Bank: ${accountDetails.bankName || 'N/A'}, Account Title: ${accountDetails.accountTitle || 'N/A'}, IBAN: ${accountDetails.ibanNumber || 'N/A'}, Base Salary: ${accountDetails.baseSalary || 'N/A'}`;
      await this.createHrLog(
        hrEmployeeId,
        'account_deleted',
        employee.id,
        logDescription,
      );

      this.logger.log(
        `Deleted account record with ID ${id} for employee ${existingAccountRecord.employeeId}`,
      );

      return {
        message: `Account record for employee ${employee.firstName} ${employee.lastName} (ID: ${existingAccountRecord.employeeId}) has been successfully deleted.`,
        deletedRecord: {
          id: existingAccountRecord.id,
          employeeId: existingAccountRecord.employeeId,
          employeeName: `${employee.firstName} ${employee.lastName}`,
          employeeEmail: employee.email,
          accountDetails,
        },
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      this.logger.error(
        `Failed to delete account record ${id}: ${error.message}`,
      );
      throw new BadRequestException(
        `Failed to delete account record: ${error.message}`,
      );
    }
  }

  async updateBaseSalary(id: number, baseSalary: number, hrEmployeeId: number) {
    // Validate HR employee exists
    const hrEmployee = await this.prisma.employee.findUnique({
      where: { id: hrEmployeeId },
    });

    if (!hrEmployee) {
      throw new NotFoundException(
        `HR Employee with ID ${hrEmployeeId} not found`,
      );
    }

    // Get HR record
    const hrRecord = await this.prisma.hR.findUnique({
      where: { employeeId: hrEmployeeId },
    });

    if (!hrRecord) {
      throw new NotFoundException(
        `HR record not found for employee ${hrEmployeeId}`,
      );
    }

    try {
      const existingAccountRecord = await this.prisma.account.findUnique({
        where: { id },
        include: {
          employee: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
      });

      if (!existingAccountRecord) {
        throw new NotFoundException(`Account record with ID ${id} not found`);
      }

      const employee = await this.prisma.employee.findUnique({
        where: { id: existingAccountRecord.employeeId },
        select: { id: true, firstName: true, lastName: true, email: true },
      });

      if (!employee) {
        throw new BadRequestException(
          `Employee with ID ${existingAccountRecord.employeeId} no longer exists. Cannot update account record.`,
        );
      }

      const updatedAccountRecord = await this.prisma.account.update({
        where: { id },
        data: { baseSalary },
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

      const logDescription = `Base salary updated for employee ${employee.firstName} ${employee.lastName} from ${existingAccountRecord.baseSalary || 0} to ${baseSalary}`;
      await this.createHrLog(
        hrEmployeeId,
        'base_salary_updated',
        employee.id,
        logDescription,
      );

      this.logger.log(
        `Base salary updated for account record ${id} from ${existingAccountRecord.baseSalary || 0} to ${baseSalary}`,
      );
      return updatedAccountRecord;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      this.logger.error(
        `Failed to update base salary for account record ${id}: ${error.message}`,
      );
      throw new BadRequestException(
        `Failed to update base salary: ${error.message}`,
      );
    }
  }

  /**
   * Helper method to create HR log entries
   */
  private async createHrLog(
    hrEmployeeId: number,
    actionType: string,
    affectedEmployeeId: number,
    description: string,
  ) {
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
        this.logger.log(
          `HR log created for action: ${actionType}, affected employee: ${affectedEmployeeId}`,
        );
      } else {
        this.logger.warn(
          `No HR record found for HR employee ${hrEmployeeId}, skipping log creation`,
        );
      }
    } catch (error) {
      this.logger.error(`Failed to create HR log: ${error.message}`);
      // Don't fail the main operation if log creation fails
    }
  }
}
