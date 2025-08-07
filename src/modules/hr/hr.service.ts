import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { FinanceService } from '../finance/finance.service';

@Injectable()
export class HrService {
  private readonly logger = new Logger(HrService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly financeService: FinanceService,
  ) { }

  /**
   * Helper method to get current date in PKT timezone
   */
  private getCurrentDateInPKT(): Date {
    return new Date(new Date().toLocaleString("en-US", {timeZone: "Asia/Karachi"}));
  }

  async terminateEmployee(employeeId: number, terminationDate: string, hrEmployeeId: number, description?: string) {
    // Validate date format
    const parsedDate = new Date(terminationDate);
    if (isNaN(parsedDate.getTime())) {
      throw new BadRequestException(`Invalid date format: ${terminationDate}. Please use YYYY-MM-DD format (e.g., 2025-07-31)`);
    }

    // Check if employee exists
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
    });

    if (!employee) {
      throw new NotFoundException(`Employee with ID ${employeeId} not found`);
    }

    // Check if employee is already terminated
    if (employee.status === 'terminated') {
      throw new BadRequestException(`Employee ${employeeId} is already terminated`);
    }

    // Get HR employee details for logging
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

    try {
      await this.prisma.employee.update({
        where: { id: employeeId },
        data: {
          endDate: parsedDate,
          status: 'terminated',
        },
      });

      await this.financeService.calculateSalaryManual(employeeId);

      // Create HR log entry
      const logDescription = description ||
        `Employee ${employee.firstName} ${employee.lastName} (ID: ${employeeId}) was terminated on ${terminationDate} by HR ${hrEmployee.firstName} ${hrEmployee.lastName}`;

      try {
        // Check if there's already a log for this termination
        const existingLog = await this.prisma.hRLog.findFirst({
          where: {
            hrId: hrRecord.id,
            actionType: 'employee_termination',
            affectedEmployeeId: employeeId,
          },
        });

        if (existingLog) {
          this.logger.warn(`HR log already exists for employee ${employeeId} termination`);
        } else {
          // Use raw SQL to handle potential sequence issues
          await this.prisma.$executeRaw`
            INSERT INTO hr_logs (hr_id, action_type, affected_employee_id, description, created_at, updated_at)
            VALUES (${hrRecord.id}, 'employee_termination', ${employeeId}, ${logDescription}, NOW(), NOW())
          `;
          this.logger.log(`HR log created successfully for employee ${employeeId}`);
        }
      } catch (logError) {
        this.logger.error(`Failed to create HR log: ${logError.message}`);
        this.logger.error(`Log data: hrId=${hrRecord.id}, actionType=employee_termination, affectedEmployeeId=${employeeId}`);
        // Don't fail the entire operation if log creation fails
        // Just log the error and continue
      }

      this.logger.log(
        `Employee ${employeeId} terminated on ${terminationDate} and salary processed.`,
      );
    } catch (error) {
      this.logger.error(`Failed to terminate employee ${employeeId}: ${error.message}`);
      throw new BadRequestException(`Failed to terminate employee: ${error.message}`);
    }
  }

  async getHrLogs(hrEmployeeId: number) {
    // Get HR record
    const hrRecord = await this.prisma.hR.findUnique({
      where: { employeeId: hrEmployeeId },
    });

    if (!hrRecord) {
      throw new NotFoundException(`HR record not found for employee ${hrEmployeeId}`);
    }

    // Get HR logs with related data
    const logs = await this.prisma.hRLog.findMany({
      where: { hrId: hrRecord.id },
      include: {
        affectedEmployee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        hr: {
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
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return logs;
  }







}
