import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { FinanceService } from '../../finance/finance.service';
import {
  SalaryDeductionDto,
  DeductionCalculationDto,
  SalaryDeductionResponseDto,
} from './dto/salary-deduction.dto';
import { MarkSalaryPaidDto } from './dto/mark-salary-paid.dto';
import {
  Prisma,
  PaymentWays,
  PaymentMethod,
  SalaryStatus,
  TransactionType,
  TransactionStatus,
} from '@prisma/client';

@Injectable()
export class SalaryService {
  private readonly logger = new Logger(SalaryService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly financeService: FinanceService,
  ) {}

  /**
   * Helper method to get current date in PKT timezone
   */
  private getCurrentDateInPKT(): Date {
    return new Date(
      new Date().toLocaleString('en-US', { timeZone: 'Asia/Karachi' }),
    );
  }

  async calculateSalaryDeductions(
    dto: SalaryDeductionDto,
  ): Promise<SalaryDeductionResponseDto> {
    this.logger.log(
      `Calculating salary deductions for ${dto.employeeId ? 'employee ' + dto.employeeId : 'all employees'}`,
    );

    // Use the finance service to calculate deductions
    if (dto.employeeId) {
      // Calculate for specific employee
      const currentDate = new Date();
      const calculationMonth =
        dto.month ||
        `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;

      const deductionResult =
        await this.financeService.calculateEmployeeDeductions(
          dto.employeeId,
          calculationMonth,
        );

      // Get employee details
      const employee = await this.prisma.employee.findUnique({
        where: { id: dto.employeeId },
        select: { firstName: true, lastName: true },
      });

      const calculation: DeductionCalculationDto = {
        employeeId: deductionResult.employeeId,
        employeeName: `${employee?.firstName} ${employee?.lastName}`,
        baseSalary: deductionResult.baseSalary,
        perDaySalary: deductionResult.perDaySalary,
        month: calculationMonth,
        totalPresent: 0, // Not calculated in finance service
        totalAbsent: deductionResult.totalAbsent,
        totalLateDays: deductionResult.totalLateDays,
        totalHalfDays: deductionResult.totalHalfDays,
        monthlyLatesDays: deductionResult.monthlyLatesDays,
        absentDeduction: deductionResult.absentDeduction,
        lateDeduction: deductionResult.lateDeduction,
        halfDayDeduction: deductionResult.halfDayDeduction,
        chargebackDeduction: deductionResult.chargebackDeduction || 0,
        refundDeduction: deductionResult.refundDeduction || 0,
        totalDeduction: deductionResult.totalDeduction,
        netSalary: deductionResult.baseSalary, // Base salary without deductions
        finalSalary:
          deductionResult.baseSalary - deductionResult.totalDeduction, // Salary after deductions
      };

      return {
        calculations: [calculation],
        summary: {
          totalEmployees: 1,
          totalDeductions: deductionResult.totalDeduction,
          totalNetSalary: calculation.finalSalary,
        },
      };
    } else {
      // Calculate for all employees
      const result = await this.financeService.calculateAllEmployeesDeductions(
        dto.month,
      );

      // Transform the results to match the expected format
      const calculations: DeductionCalculationDto[] = result.results.map(
        (deductionResult) => {
          return {
            employeeId: deductionResult.employeeId,
            employeeName: `Employee ${deductionResult.employeeId}`, // Will be enhanced with actual names
            baseSalary: deductionResult.baseSalary,
            perDaySalary: deductionResult.perDaySalary,
            month: result.month,
            totalPresent: 0, // Not calculated in finance service
            totalAbsent: deductionResult.totalAbsent,
            totalLateDays: deductionResult.totalLateDays,
            totalHalfDays: deductionResult.totalHalfDays,
            monthlyLatesDays: deductionResult.monthlyLatesDays,
            absentDeduction: deductionResult.absentDeduction,
            lateDeduction: deductionResult.lateDeduction,
            halfDayDeduction: deductionResult.halfDayDeduction,
            chargebackDeduction: deductionResult.chargebackDeduction || 0,
            refundDeduction: deductionResult.refundDeduction || 0,
            totalDeduction: deductionResult.totalDeduction,
            netSalary: deductionResult.baseSalary, // Base salary without deductions
            finalSalary:
              deductionResult.baseSalary - deductionResult.totalDeduction, // Salary after deductions
          };
        },
      );

      // Get employee names for better display
      const employeeIds = result.results.map((r) => r.employeeId);
      const employees = await this.prisma.employee.findMany({
        where: { id: { in: employeeIds } },
        select: { id: true, firstName: true, lastName: true },
      });

      // Update employee names
      calculations.forEach((calc) => {
        const employee = employees.find((emp) => emp.id === calc.employeeId);
        if (employee) {
          calc.employeeName = `${employee.firstName} ${employee.lastName}`;
        }
      });

      return {
        calculations,
        summary: {
          totalEmployees: result.totalEmployees,
          totalDeductions: result.totalDeductions,
          totalNetSalary: calculations.reduce(
            (sum, calc) => sum + calc.finalSalary,
            0,
          ),
        },
      };
    }
  }

  /**
   * Sets or updates the base salary for an employee with proper permission checks.
   * Admins can set any salary, HR employees have restrictions.
   */
  async updateSalary(
    employeeId: number,
    amount: number,
    currentUserId: number,
    isAdmin: boolean,
    description?: string,
  ) {
    // 1. Check if employee exists and is active
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      select: { id: true, status: true },
    });

    if (!employee) {
      return {
        status: 'error',
        message: 'Employee does not exist',
        error_code: 'EMPLOYEE_NOT_FOUND',
      };
    }

    if (employee.status !== 'active') {
      return {
        status: 'error',
        message: 'Employee is not active',
        error_code: 'EMPLOYEE_INACTIVE',
      };
    }

    // 2. Check if account record exists (mandatory)
    const account = await this.prisma.account.findFirst({
      where: { employeeId },
      select: { id: true, baseSalary: true },
    });

    if (!account) {
      return {
        status: 'error',
        message: 'Account record does not exist for employee',
        error_code: 'ACCOUNT_NOT_FOUND',
      };
    }

    // 3. Apply permission restrictions for non-admin users
    if (!isAdmin) {
      // HR cannot set their own salary
      if (currentUserId === employeeId) {
        return {
          status: 'error',
          message: 'HR cannot set their own salary',
          error_code: 'SELF_SALARY_RESTRICTION',
        };
      }

      // Check if target employee is HR with salary permission
      const targetHr = await this.prisma.hR.findFirst({
        where: { employeeId },
        select: { salaryPermission: true },
      });

      if (targetHr?.salaryPermission) {
        return {
          status: 'error',
          message: 'HR cannot set salary of another HR with salary permission',
          error_code: 'HR_PERMISSION_RESTRICTION',
        };
      }
    }

    // 4. Get previous salary for logging
    const previousSalary = account.baseSalary || new Prisma.Decimal(0);
    const newSalary = new Prisma.Decimal(amount);

    // 5. Update the base salary
    const updatedAccount = await this.prisma.account.update({
      where: { id: account.id },
      data: {
        baseSalary: newSalary,
        updatedAt: this.getCurrentDateInPKT(),
      },
    });

    // 6. Handle logging and response based on user type
    if (isAdmin) {
      // Admin: No HR log, updated_by = 0
      this.logger.log(
        `Salary updated for employee ${employeeId}: ${previousSalary.toFixed(2)} -> ${newSalary.toFixed(2)} by admin`,
      );

      return {
        status: 'success',
        message: 'Salary updated successfully',
        employee_id: employeeId,
        previous_salary: parseFloat(previousSalary.toFixed(2)),
        new_salary: parseFloat(newSalary.toFixed(2)),
        updated_by: 0, // Admin action
      };
    } else {
      // HR: Create HR log entry
      const currentHr = await this.prisma.hR.findFirst({
        where: { employeeId: currentUserId },
        select: { id: true },
      });

      if (!currentHr) {
        return {
          status: 'error',
          message: 'HR record not found for current user',
          error_code: 'HR_RECORD_NOT_FOUND',
        };
      }

      // Generate description if not provided
      const logDescription =
        description ||
        `Salary updated from ${previousSalary.toFixed(2)} to ${newSalary.toFixed(2)}`;

      // Create HR log entry
      await this.prisma.hRLog.create({
        data: {
          hrId: currentHr.id,
          actionType: 'salary_update',
          affectedEmployeeId: employeeId,
          description: logDescription,
        },
      });

      this.logger.log(
        `Salary updated for employee ${employeeId}: ${previousSalary.toFixed(2)} -> ${newSalary.toFixed(2)} by HR user ${currentUserId}`,
      );

      return {
        status: 'success',
        message: 'Salary updated successfully',
        employee_id: employeeId,
        previous_salary: parseFloat(previousSalary.toFixed(2)),
        new_salary: parseFloat(newSalary.toFixed(2)),
        updated_by: currentUserId,
      };
    }
  }

  /**
   * Marks a salary as paid for an employee
   * Updates net_salary_logs, creates transaction and expense records
   */
  async markSalaryPaid(
    dto: MarkSalaryPaidDto,
    currentUserId: number,
    isAdmin: boolean = false,
  ) {
    const { employee_id, type } = dto;
    const paymentMethod = type || PaymentWays.cash;

    try {
      // Use Prisma transaction to ensure data consistency
      const result = await this.prisma.$transaction(async (prisma) => {
        // 1. Validate employee exists and is active
        const employee = await prisma.employee.findUnique({
          where: { id: employee_id },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            status: true,
          },
        });

        if (!employee) {
          throw new Error('EMPLOYEE_NOT_FOUND');
        }

        if (employee.status !== 'active') {
          throw new Error('EMPLOYEE_INACTIVE');
        }

        // 2. Find the latest unpaid salary log for the current month
        const currentDate = new Date();
        const currentMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;

        const salaryLog = await prisma.netSalaryLog.findFirst({
          where: {
            employeeId: employee_id,
            month: currentMonth,
            paidOn: null, // Not paid yet
          },
          orderBy: {
            createdAt: 'desc',
          },
        });

        if (!salaryLog) {
          throw new Error('NO_UNPAID_SALARY_FOUND');
        }

        if (!salaryLog.netSalary) {
          throw new Error('INVALID_SALARY_AMOUNT');
        }

        // 3. Update the salary log
        const updatedSalaryLog = await prisma.netSalaryLog.update({
          where: { id: salaryLog.id },
          data: {
            paidOn: currentDate,
            processedBy: isAdmin ? 0 : currentUserId, // Set to zero for admin or employee ID
            processedByRole: (isAdmin ? 'Admin' : 'Employee') as any,
            status: SalaryStatus.paid,
            updatedAt: currentDate,
          },
        });

        // 3.5. Reset bonuses to zero when salary is paid
        // Reset employee bonus
        await prisma.employee.update({
          where: { id: employee_id },
          data: {
            bonus: 0,
            updatedAt: currentDate,
          },
        });

        // Reset sales department bonus if employee is in sales
        const salesDepartment = await prisma.salesDepartment.findFirst({
          where: { employeeId: employee_id },
        });

        if (salesDepartment) {
          await prisma.salesDepartment.update({
            where: { id: salesDepartment.id },
            data: {
              salesBonus: 0,
              updatedAt: currentDate,
            },
          });
        }

        // 3.6. Create HR log entry (only for HR users, not admins)
        if (!isAdmin) {
          const hrRecord = await prisma.hR.findFirst({
            where: { employeeId: currentUserId },
            select: { id: true },
          });

          if (hrRecord) {
            await prisma.hRLog.create({
              data: {
                hrId: hrRecord.id,
                actionType: 'salary_payment',
                affectedEmployeeId: employee_id,
                description: `Salary payment processed for ${employee.firstName} ${employee.lastName} (ID: ${employee_id}) for ${currentMonth}. Amount: ${salaryLog.netSalary.toFixed(2)}. Bonuses reset to zero.`,
              },
            });
          }
        }

        // 4. Create transaction record
        let transaction;
        try {
          transaction = await prisma.transaction.create({
            data: {
              employeeId: employee_id,
              amount: salaryLog.netSalary,
              transactionType: TransactionType.salary,
              paymentMethod: paymentMethod,
              transactionDate: currentDate,
              status: TransactionStatus.completed,
              notes: `Salary payment for ${employee.firstName} ${employee.lastName} - ${currentMonth} via ${paymentMethod}. Employee and sales bonuses reset to zero.`,
            },
          });
        } catch (transactionError) {
          this.logger.error(
            `Transaction creation failed: ${transactionError.message}`,
          );
          throw new Error('TRANSACTION_CREATION_FAILED');
        }

        // 5. Create expense record
        const expense = await prisma.expense.create({
          data: {
            title: `${employee.firstName} ${employee.lastName} Salary`,
            category: 'salary',
            amount: salaryLog.netSalary,
            createdBy: isAdmin ? 0 : currentUserId, // Set to admin ID or employee ID
            processedByRole: (isAdmin ? 'Admin' : 'Employee') as any,
            paidOn: currentDate,
            transactionId: transaction.id,
            paymentMethod: this.mapPaymentWaysToPaymentMethod(paymentMethod),
            notes: `Salary payment processed for ${employee.firstName} ${employee.lastName} (ID: ${employee_id}) for ${currentMonth}. Amount: ${salaryLog.netSalary.toFixed(2)}. Processed by ${isAdmin ? 'Admin' : 'HR user ID: ' + currentUserId} on ${currentDate.toISOString()}. Employee and sales bonuses reset to zero.`,
          },
        });

        return {
          salaryLog: updatedSalaryLog,
          transaction,
          expense,
        };
      });

      this.logger.log(
        `Salary marked as paid for employee ${employee_id} by HR user ${currentUserId}`,
      );

      return {
        status: 'success',
        message: 'Salary marked as paid successfully',
        data: {
          employee_id,
          salary_log_id: result.salaryLog.id,
          transaction_id: result.transaction.id,
          expense_id: result.expense.id,
          amount: parseFloat(result.salaryLog.netSalary?.toFixed(2) || '0.00'),
          payment_method: paymentMethod,
          paid_on: result.salaryLog.paidOn,
        },
      };
    } catch (error) {
      this.logger.error(
        `Failed to mark salary as paid for employee ${employee_id}: ${error.message}`,
      );

      // Handle specific database constraint errors
      if (error.message.includes('Unique constraint failed')) {
        return {
          status: 'error',
          message: 'Database constraint violation - transaction ID conflict',
          error_code: 'TRANSACTION_CONSTRAINT_VIOLATION',
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
   * Maps PaymentWays enum to PaymentMethod enum for expense records
   */
  private mapPaymentWaysToPaymentMethod(
    paymentWays: PaymentWays,
  ): PaymentMethod {
    switch (paymentWays) {
      case PaymentWays.cash:
        return PaymentMethod.cash;
      case PaymentWays.bank:
        return PaymentMethod.bank;
      case PaymentWays.online:
      case PaymentWays.credit_card:
      case PaymentWays.cashapp:
        return PaymentMethod.online;
      default:
        return PaymentMethod.cash;
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
      case 'NO_UNPAID_SALARY_FOUND':
        return 'No unpaid salary found for the current month';
      case 'INVALID_SALARY_AMOUNT':
        return 'Invalid salary amount';
      case 'TRANSACTION_CONSTRAINT_VIOLATION':
        return 'Database constraint violation - transaction ID conflict';
      case 'TRANSACTION_CREATION_FAILED':
        return 'Failed to create transaction record';
      case 'USER_NOT_FOUND':
        return 'Current user not found';
      default:
        return 'An error occurred while processing the salary payment';
    }
  }
}
