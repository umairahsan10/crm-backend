import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../../prisma/prisma.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import {
  ExpenseCreateResponseDto,
  ExpenseUpdateResponseDto,
  ExpenseSingleResponseDto,
  ExpenseListResponseDto,
  ExpenseResponseDto,
  TransactionResponseDto,
  VendorResponseDto,
} from './dto/expense-response.dto';
import { Prisma, TransactionType, TransactionStatus, PaymentWays } from '@prisma/client';

export interface ErrorResponseDto {
  status: string;
  message: string;
  error_code: string;
}

interface ExpenseFilters {
  category?: string;
  fromDate?: string;
  toDate?: string;
  createdBy?: number;
  minAmount?: number;
  maxAmount?: number;
  paymentMethod?: string;
  processedByRole?: string;
}

@Injectable()
export class ExpenseService {
  private readonly logger = new Logger(ExpenseService.name);

  constructor(private readonly prisma: PrismaService) {}

  private getCurrentDateInPKT(): Date {
    const now = new Date();
    return new Date(now.getTime() + (5 * 60 * 60 * 1000)); // PKT is UTC+5
  }

  private getErrorMessage(errorMessage: string): string {
    if (errorMessage.includes('EXPENSE_NOT_FOUND')) {
      return 'Expense not found';
    } else if (errorMessage.includes('VENDOR_NOT_FOUND')) {
      return 'Vendor not found';
    } else if (errorMessage.includes('MISSING_EXPENSE_ID')) {
      return 'Expense ID is required';
    } else {
      return 'An error occurred while processing the request';
    }
  }

  private mapTransactionToResponse(transaction: any): TransactionResponseDto {
    return {
      id: transaction.id,
      amount: Number(transaction.amount),
      transactionType: transaction.transactionType,
      paymentMethod: transaction.paymentMethod,
      transactionDate: transaction.transactionDate.toISOString(),
      status: transaction.status,
      notes: transaction.notes,
      employeeId: transaction.employeeId,
      vendorId: transaction.vendorId,
      clientId: transaction.clientId,
      invoiceId: transaction.invoiceId,
      createdAt: transaction.createdAt.toISOString(),
      updatedAt: transaction.updatedAt.toISOString(),
    };
  }

  private mapVendorToResponse(vendor: any): VendorResponseDto {
    return {
      id: vendor.id,
      name: vendor.name,
      contactPerson: vendor.contactPerson,
      email: vendor.email,
      phone: vendor.phone,
      address: vendor.address,
      city: vendor.city,
      country: vendor.country,
      bankAccount: vendor.bankAccount,
      status: vendor.status,
      notes: vendor.notes,
      createdAt: vendor.createdAt.toISOString(),
      updatedAt: vendor.updatedAt.toISOString(),
    };
  }

  private mapExpenseToResponse(expense: any): ExpenseResponseDto {
    return {
      id: expense.id,
      title: expense.title,
      category: expense.category,
      amount: Number(expense.amount),
      paidOn: expense.paidOn ? expense.paidOn.toISOString() : null,
      notes: expense.notes,
      transactionId: expense.transactionId,
      processedByRole: expense.processedByRole,
      paymentMethod: expense.paymentMethod,
      createdBy: expense.createdBy,
      createdAt: expense.createdAt.toISOString(),
      updatedAt: expense.updatedAt.toISOString(),
      transaction: expense.transaction ? this.mapTransactionToResponse(expense.transaction) : null,
      vendor: expense.transaction?.vendor ? this.mapVendorToResponse(expense.transaction.vendor) : null,
      employee: expense.employee ? { id: expense.employee.id } : null,
    };
  }

  private mapPaymentMethodToPaymentWays(paymentMethod: string): PaymentWays {
    switch (paymentMethod) {
      case 'cash':
        return PaymentWays.cash;
      case 'bank':
        return PaymentWays.bank;
      case 'online':
        return PaymentWays.online;
      default:
        return PaymentWays.cash;
    }
  }

  async createExpense(
    dto: CreateExpenseDto,
    currentUserId: number
  ): Promise<ExpenseCreateResponseDto | ErrorResponseDto> {
    try {
      // Validate vendor exists if provided
      if (dto.vendorId) {
        const vendor = await this.prisma.vendor.findUnique({
          where: { id: dto.vendorId },
        });
        if (!vendor) {
          return {
            status: 'error',
            message: 'Vendor not found',
            error_code: 'VENDOR_NOT_FOUND'
          };
        }
      }

      // Use Prisma transaction to ensure data consistency
      const result = await this.prisma.$transaction(async (prisma) => {
        const currentDate = this.getCurrentDateInPKT();
        const paidOn = dto.paidOn ? new Date(dto.paidOn) : currentDate;

                 // 1. Create transaction record first
         // Get the next available ID (largest ID + 1)
         const maxTransactionId = await prisma.transaction.aggregate({
           _max: { id: true }
         });
         const nextTransactionId = (maxTransactionId._max.id || 0) + 1;

         const transaction = await prisma.transaction.create({
           data: {
             id: nextTransactionId, // Use explicit ID to avoid sequence conflicts
             employeeId: currentUserId,
             vendorId: dto.vendorId || null,
             amount: new Prisma.Decimal(dto.amount),
             transactionType: TransactionType.expense,
             paymentMethod: dto.paymentMethod ? this.mapPaymentMethodToPaymentWays(dto.paymentMethod) : PaymentWays.cash,
             transactionDate: currentDate,
             status: TransactionStatus.completed,
             notes: `Expense: ${dto.title} - ${dto.category}`,
           },
         });

        // 2. Create expense record
        const expense = await prisma.expense.create({
          data: {
            title: dto.title,
            category: dto.category,
            amount: new Prisma.Decimal(dto.amount),
            paidOn: paidOn,
            notes: dto.notes,
            transactionId: transaction.id,
            processedByRole: dto.processedByRole || 'Employee',
            paymentMethod: dto.paymentMethod || 'cash',
            createdBy: currentUserId,
          },
          include: {
            transaction: {
              include: {
                vendor: true,
              },
            },
            employee: {
              select: {
                id: true,
              },
            },
          },
        });
        return { expense, transaction };
      });
      this.logger.log(`Expense created: ${result.expense.id} by user ${currentUserId}`);
      return {
        status: 'success',
        message: 'Expense created successfully',
        data: {
          expense: this.mapExpenseToResponse(result.expense),
          transaction: this.mapTransactionToResponse(result.transaction),
        },
      };
    } catch (error) {
      this.logger.error(`Failed to create expense: ${error.message}`);
      return {
        status: 'error',
        message: this.getErrorMessage(error.message),
        error_code: error.message,
      };
    }
  }

  async getAllExpenses(filters: ExpenseFilters, query?: any): Promise<ExpenseListResponseDto | ErrorResponseDto> {
    try {
      const whereClause: any = {};

      // Apply filters
      if (filters.category) {
        whereClause.category = { contains: filters.category, mode: 'insensitive' };
      }

      if (filters.fromDate || filters.toDate) {
        whereClause.paidOn = {};
        if (filters.fromDate) {
          whereClause.paidOn.gte = new Date(filters.fromDate);
        }
        if (filters.toDate) {
          whereClause.paidOn.lte = new Date(filters.toDate);
        }
      }

      if (filters.createdBy) {
        whereClause.createdBy = filters.createdBy;
      }

      if (filters.minAmount || filters.maxAmount) {
        whereClause.amount = {};
        if (filters.minAmount) {
          whereClause.amount.gte = new Prisma.Decimal(filters.minAmount);
        }
        if (filters.maxAmount) {
          whereClause.amount.lte = new Prisma.Decimal(filters.maxAmount);
        }
      }

      if (filters.paymentMethod) {
        whereClause.paymentMethod = filters.paymentMethod;
      }

      if (filters.processedByRole) {
        whereClause.processedByRole = filters.processedByRole;
      }

      // Search support
      if (query?.search) {
        whereClause.OR = [
          { title: { contains: query.search, mode: 'insensitive' } },
          { category: { contains: query.search, mode: 'insensitive' } }
        ];
      }

      // Pagination parameters
      const page = parseInt(query?.page) || 1;
      const limit = parseInt(query?.limit) || 20;
      const skip = (page - 1) * limit;

      const [expenses, total] = await Promise.all([
        this.prisma.expense.findMany({
          where: whereClause,
          include: {
            transaction: {
              include: {
                vendor: true,
              },
            },
            employee: {
              select: {
                id: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          skip,
          take: limit,
        }),
        this.prisma.expense.count({
          where: whereClause,
        })
      ]);

      return {
        status: 'success',
        message: 'Expenses retrieved successfully',
        data: expenses.map(expense => this.mapExpenseToResponse(expense)),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          retrieved: expenses.length
        }
      };
    } catch (error) {
      this.logger.error(`Failed to retrieve expenses: ${error.message}`);
      return {
        status: 'error',
        message: this.getErrorMessage(error.message),
        error_code: error.message,
      };
    }
  }

  async getExpenseById(id: number): Promise<ExpenseSingleResponseDto | ErrorResponseDto> {
    try {
      const expense = await this.prisma.expense.findUnique({
        where: { id },
        include: {
          transaction: {
            include: {
              vendor: true,
            },
          },
          employee: {
            select: {
              id: true,
            },
          },
        },
      });

      if (!expense) {
        return {
          status: 'error',
          message: 'Expense not found',
          error_code: 'EXPENSE_NOT_FOUND'
        };
      }

      return {
        status: 'success',
        message: 'Expense retrieved successfully',
        data: this.mapExpenseToResponse(expense),
      };
    } catch (error) {
      this.logger.error(`Failed to retrieve expense: ${error.message}`);
      return {
        status: 'error',
        message: this.getErrorMessage(error.message),
        error_code: error.message,
      };
    }
  }

  async updateExpense(
    dto: UpdateExpenseDto,
    currentUserId: number
  ): Promise<ExpenseUpdateResponseDto | ErrorResponseDto> {
    try {
      // Validate expense_id is provided
      if (!dto.expense_id) {
        return {
          status: 'error',
          message: 'Expense ID is required',
          error_code: 'MISSING_EXPENSE_ID'
        };
      }

      // Check if expense exists
      const existingExpense = await this.prisma.expense.findUnique({
        where: { id: dto.expense_id },
        include: {
          transaction: true,
        },
      });

      if (!existingExpense) {
        return {
          status: 'error',
          message: 'Expense not found',
          error_code: 'EXPENSE_NOT_FOUND'
        };
      }

      // Validate vendor exists if provided
      if (dto.vendorId) {
        const vendor = await this.prisma.vendor.findUnique({
          where: { id: dto.vendorId },
        });
        if (!vendor) {
          return {
            status: 'error',
            message: 'Vendor not found',
            error_code: 'VENDOR_NOT_FOUND'
          };
        }
      }

      // Use Prisma transaction to ensure data consistency
      const result = await this.prisma.$transaction(async (prisma) => {
        const currentDate = this.getCurrentDateInPKT();
        let updatedTransaction: any = null;

        // Update expense
        const updatedExpense = await prisma.expense.update({
          where: { id: dto.expense_id },
          data: {
            title: dto.title,
            category: dto.category,
            amount: dto.amount ? new Prisma.Decimal(dto.amount) : undefined,
            paidOn: dto.paidOn ? new Date(dto.paidOn) : undefined,
            notes: dto.notes,
            processedByRole: dto.processedByRole,
            paymentMethod: dto.paymentMethod,
            updatedAt: currentDate,
          },
          include: {
            transaction: {
              include: {
                vendor: true,
              },
            },
            employee: {
              select: {
                id: true,
              },
            },
          },
        });

        // Update linked transaction if amount, vendor, or payment method changed
        if (dto.amount || dto.vendorId || dto.paymentMethod) {
          const transactionUpdateData: any = {
            updatedAt: currentDate,
          };

          if (dto.amount) {
            transactionUpdateData.amount = new Prisma.Decimal(dto.amount);
          }

                     if (dto.vendorId !== undefined) {
             transactionUpdateData.vendorId = dto.vendorId;
           }

          if (dto.paymentMethod) {
            transactionUpdateData.paymentMethod = this.mapPaymentMethodToPaymentWays(dto.paymentMethod);
          }

          if (dto.title || dto.category) {
            const newTitle = dto.title || updatedExpense.title;
            const newCategory = dto.category || updatedExpense.category;
            transactionUpdateData.notes = `Expense: ${newTitle} - ${newCategory}`;
          }

          if (existingExpense.transactionId) {
            updatedTransaction = await prisma.transaction.update({
              where: { id: existingExpense.transactionId },
              data: transactionUpdateData,
            });
          }
        }

        return { expense: updatedExpense, transaction: updatedTransaction };
      });

      this.logger.log(`Expense updated: ${result.expense.id} by user ${currentUserId}`);
      return {
        status: 'success',
        message: 'Expense updated successfully',
        data: {
          expense: this.mapExpenseToResponse(result.expense),
          transaction: result.transaction ? this.mapTransactionToResponse(result.transaction) : undefined,
        },
      };
    } catch (error) {
      this.logger.error(`Failed to update expense: ${error.message}`);
      return {
        status: 'error',
        message: this.getErrorMessage(error.message),
        error_code: error.message,
      };
    }
  }

  async getExpenseStats(): Promise<any> {
    try {
      const currentDate = this.getCurrentDateInPKT();
      const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);

      // Get all expenses
      const allExpenses = await this.prisma.expense.findMany({});

      // Total count and sum
      const totalExpenses = allExpenses.length;
      const totalAmount = allExpenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
      const averageExpense = totalExpenses > 0 ? totalAmount / totalExpenses : 0;

      // Breakdown by category
      const categoryBreakdown: Record<string, { count: number; amount: number }> = {};
      allExpenses.forEach((exp) => {
        const category = exp.category || 'Uncategorized';
        if (!categoryBreakdown[category]) {
          categoryBreakdown[category] = { count: 0, amount: 0 };
        }
        categoryBreakdown[category].count++;
        categoryBreakdown[category].amount += Number(exp.amount);
      });

      // Top 3 expense categories by total amount
      const topCategories = Object.entries(categoryBreakdown)
        .map(([category, data]) => ({
          category,
          totalAmount: data.amount,
          count: data.count,
        }))
        .sort((a, b) => b.totalAmount - a.totalAmount)
        .slice(0, 3);

      // Breakdown by payment method
      const paymentMethodBreakdown: Record<string, { count: number; amount: number }> = {};
      allExpenses.forEach((exp) => {
        const method = exp.paymentMethod || 'unknown';
        if (!paymentMethodBreakdown[method]) {
          paymentMethodBreakdown[method] = { count: 0, amount: 0 };
        }
        paymentMethodBreakdown[method].count++;
        paymentMethodBreakdown[method].amount += Number(exp.amount);
      });

      // Breakdown by processedByRole
      const roleBreakdown: Record<string, { count: number; amount: number }> = {};
      allExpenses.forEach((exp) => {
        const role = exp.processedByRole || 'Unknown';
        if (!roleBreakdown[role]) {
          roleBreakdown[role] = { count: 0, amount: 0 };
        }
        roleBreakdown[role].count++;
        roleBreakdown[role].amount += Number(exp.amount);
      });

      // This month's stats
      const thisMonthExpenses = allExpenses.filter(
        (exp) => exp.createdAt >= firstDayOfMonth
      );
      const thisMonthCount = thisMonthExpenses.length;
      const thisMonthAmount = thisMonthExpenses.reduce((sum, exp) => sum + Number(exp.amount), 0);

      return {
        status: 'success',
        message: 'Expense statistics retrieved successfully',
        data: {
          totalExpenses,
          totalAmount: Math.round(totalAmount * 100) / 100,
          averageExpense: Math.round(averageExpense * 100) / 100,
          byCategory: categoryBreakdown,
          topCategories,
          byPaymentMethod: paymentMethodBreakdown,
          byProcessedByRole: roleBreakdown,
          thisMonth: {
            count: thisMonthCount,
            amount: Math.round(thisMonthAmount * 100) / 100,
          },
        },
      };
    } catch (error) {
      this.logger.error(`Error retrieving expense statistics: ${error.message}`);
      return {
        status: 'error',
        message: 'An error occurred while retrieving expense statistics',
        error_code: error.message,
      };
    }
  }
} 