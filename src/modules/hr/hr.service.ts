import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { MarkSalaryPaidDto } from './dto/mark-salary-paid.dto';
import { PaymentWays, SalaryStatus, TransactionType, TransactionStatus, PaymentMethod } from '@prisma/client';
import { Prisma } from '@prisma/client';

@Injectable()
export class HrService {
  private readonly logger = new Logger(HrService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Marks a salary as paid for an employee
   * Updates net_salary_logs, creates transaction and expense records
   */
  async markSalaryPaid(dto: MarkSalaryPaidDto, currentUserId: number, isAdmin: boolean = false) {
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
            processedBy: currentUserId, // Set to admin ID or employee ID
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
              bonus: 0,
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
          this.logger.error(`Transaction creation failed: ${transactionError.message}`);
          throw new Error('TRANSACTION_CREATION_FAILED');
        }

        // 5. Create expense record
        const expense = await prisma.expense.create({
          data: {
            title: `${employee.firstName} ${employee.lastName} Salary`,
            category: 'salary',
            amount: salaryLog.netSalary,
            createdBy: currentUserId, // Set to admin ID or employee ID
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
  private mapPaymentWaysToPaymentMethod(paymentWays: PaymentWays): PaymentMethod {
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
