import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../../prisma/prisma.service';
import { Prisma, TransactionType, TransactionStatus, PaymentWays, PaymentMethod } from '@prisma/client';
import { CreateLiabilityDto } from './dto/create-liability.dto';
import { UpdateLiabilityDto } from './dto/update-liability.dto';
import { MarkLiabilityPaidDto } from './dto/mark-liability-paid.dto';
import { 
  LiabilityResponseDto, 
  LiabilityListResponseDto, 
  LiabilityDetailResponseDto,
  LiabilityCreateResponseDto,
  LiabilityUpdateResponseDto,
  LiabilityMarkPaidResponseDto,
  LiabilityErrorResponseDto 
} from './dto/liability-response.dto';

@Injectable()
export class LiabilitiesService {
  private readonly logger = new Logger(LiabilitiesService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Helper method to get current date in PKT timezone
   */
  private getCurrentDateInPKT(): Date {
    return new Date(new Date().toLocaleString("en-US", {timeZone: "Asia/Karachi"}));
  }

  /**
   * Creates a new liability with linked transaction
   */
  async createLiability(
    dto: CreateLiabilityDto,
    currentUserId: number
  ): Promise<LiabilityCreateResponseDto | LiabilityErrorResponseDto> {
    try {
      // Validate vendor if provided
      if (dto.relatedVendorId) {
        const vendor = await this.prisma.vendor.findUnique({
          where: { id: dto.relatedVendorId },
        });
        if (!vendor) {
          return {
            status: 'error',
            message: 'Vendor not found',
            error_code: 'VENDOR_NOT_FOUND'
          };
        }
      }

      // Validate due date is in the future
      const dueDate = new Date(dto.dueDate);
      if (dueDate <= this.getCurrentDateInPKT()) {
        return {
          status: 'error',
          message: 'Due date must be in the future',
          error_code: 'INVALID_DUE_DATE'
        };
      }

      // Use Prisma transaction to ensure data consistency
      const result = await this.prisma.$transaction(async (prisma) => {
        // 1. Create transaction record first
        // Get the next available ID (largest ID + 1)
        const maxTransactionId = await prisma.transaction.aggregate({
          _max: { id: true }
        });
        const nextTransactionId = (maxTransactionId._max.id || 0) + 1;

        const transaction = await prisma.transaction.create({
          data: {
            id: nextTransactionId, // Use explicit ID to avoid sequence conflicts
            employeeId: currentUserId, // Set the accountant/employee who created this
            vendorId: dto.relatedVendorId, // Set the vendor if provided
            amount: new Prisma.Decimal(dto.amount),
            transactionType: TransactionType.payment,
            paymentMethod: PaymentWays.cash, // Default payment method
            transactionDate: this.getCurrentDateInPKT(),
            status: TransactionStatus.pending,
            notes: `Liability: ${dto.name} - ${dto.category}`,
          },
        });

        // 2. Create liability record
        // Get the next available ID (largest ID + 1)
        const maxLiabilityId = await prisma.liability.aggregate({
          _max: { id: true }
        });
        const nextLiabilityId = (maxLiabilityId._max.id || 0) + 1;

        const liability = await prisma.liability.create({
          data: {
            id: nextLiabilityId, // Use explicit ID to avoid sequence conflicts
            name: dto.name,
            category: dto.category,
            amount: new Prisma.Decimal(dto.amount),
            dueDate: dueDate,
            isPaid: false,
            transactionId: transaction.id,
            relatedVendorId: dto.relatedVendorId,
            createdBy: currentUserId,
          },
          include: {
            transaction: true,
            vendor: true,
            employee: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        });

        return { liability, transaction };
      });

      this.logger.log(
        `Liability created: ${result.liability.id} by user ${currentUserId}`,
      );

      return {
        status: 'success',
        message: 'Liability created successfully',
        data: {
          liability: this.mapLiabilityToResponse(result.liability),
          transaction: this.mapTransactionToResponse(result.transaction),
        },
      };

    } catch (error) {
      this.logger.error(
        `Failed to create liability: ${error.message}`,
      );

      return {
        status: 'error',
        message: this.getErrorMessage(error.message),
        error_code: error.message,
      };
    }
  }

  /**
   * Gets all liabilities with optional filters
   */
  async getAllLiabilities(
    filters: {
      isPaid?: boolean;
      relatedVendorId?: number;
      category?: string;
      fromDate?: string;
      toDate?: string;
      createdBy?: number;
    }
  ): Promise<LiabilityListResponseDto | LiabilityErrorResponseDto> {
    try {
      const whereClause: any = {};

      // Apply filters
      if (filters.isPaid !== undefined) {
        whereClause.isPaid = filters.isPaid;
      }

      if (filters.relatedVendorId) {
        whereClause.relatedVendorId = filters.relatedVendorId;
      }

      if (filters.category) {
        whereClause.category = filters.category;
      }

      if (filters.createdBy) {
        whereClause.createdBy = filters.createdBy;
      }

      // Date range filter
      if (filters.fromDate || filters.toDate) {
        whereClause.dueDate = {};
        if (filters.fromDate) {
          whereClause.dueDate.gte = new Date(filters.fromDate);
        }
        if (filters.toDate) {
          whereClause.dueDate.lte = new Date(filters.toDate);
        }
      }

      const liabilities = await this.prisma.liability.findMany({
        where: whereClause,
        include: {
          transaction: true,
          vendor: true,
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      const total = await this.prisma.liability.count({ where: whereClause });

      return {
        status: 'success',
        message: 'Liabilities retrieved successfully',
        data: liabilities.map(liability => this.mapLiabilityToResponse(liability)),
        total,
      };

    } catch (error) {
      this.logger.error(
        `Failed to get liabilities: ${error.message}`,
      );

      return {
        status: 'error',
        message: this.getErrorMessage(error.message),
        error_code: error.message,
      };
    }
  }

  /**
   * Gets a single liability by ID
   */
  async getLiabilityById(id: number): Promise<LiabilityDetailResponseDto | LiabilityErrorResponseDto> {
    try {
      const liability = await this.prisma.liability.findUnique({
        where: { id },
        include: {
          transaction: true,
          vendor: true,
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      if (!liability) {
        return {
          status: 'error',
          message: 'Liability not found',
          error_code: 'LIABILITY_NOT_FOUND'
        };
      }

      return {
        status: 'success',
        message: 'Liability retrieved successfully',
        data: this.mapLiabilityToResponse(liability),
      };

    } catch (error) {
      this.logger.error(
        `Failed to get liability ${id}: ${error.message}`,
      );

      return {
        status: 'error',
        message: this.getErrorMessage(error.message),
        error_code: error.message,
      };
    }
  }

  /**
   * Updates a liability (only if not paid)
   */
  async updateLiability(
    dto: UpdateLiabilityDto,
    currentUserId: number
  ): Promise<LiabilityUpdateResponseDto | LiabilityErrorResponseDto> {
    const { liability_id, ...updateData } = dto;
    
    // Validate that ID exists
    if (!liability_id) {
      return {
        status: 'error',
        message: 'Liability ID is required',
        error_code: 'MISSING_LIABILITY_ID'
      };
    }
    
    try {
      // 1. Check if liability exists and is not paid
      const existingLiability = await this.prisma.liability.findUnique({
        where: { id: liability_id },
        include: {
          transaction: true,
        },
      });

      if (!existingLiability) {
        return {
          status: 'error',
          message: 'Liability not found',
          error_code: 'LIABILITY_NOT_FOUND'
        };
      }

      if (existingLiability.isPaid) {
        return {
          status: 'error',
          message: 'Liability is already paid and cannot be updated',
          error_code: 'LIABILITY_ALREADY_PAID'
        };
      }

      // 2. Check if linked transaction is completed
      if (existingLiability.transaction.status === TransactionStatus.completed) {
        return {
          status: 'error',
          message: 'Linked transaction is already completed',
          error_code: 'TRANSACTION_ALREADY_COMPLETED'
        };
      }

      // 3. Validate vendor if provided
      if (updateData.relatedVendorId) {
        const vendor = await this.prisma.vendor.findUnique({
          where: { id: updateData.relatedVendorId },
        });
        if (!vendor) {
          return {
            status: 'error',
            message: 'Vendor not found',
            error_code: 'VENDOR_NOT_FOUND'
          };
        }
      }

      // 4. Validate due date if provided
      if (updateData.dueDate) {
        const dueDate = new Date(updateData.dueDate);
        if (dueDate <= this.getCurrentDateInPKT()) {
          return {
            status: 'error',
            message: 'Due date must be in the future',
            error_code: 'INVALID_DUE_DATE'
          };
        }
      }

      // 5. Use Prisma transaction to ensure data consistency
      const result = await this.prisma.$transaction(async (prisma) => {
        const liabilityUpdateData: any = {
          updatedAt: this.getCurrentDateInPKT(),
        };

        // Update liability fields
        if (updateData.name !== undefined) liabilityUpdateData.name = updateData.name;
        if (updateData.category !== undefined) liabilityUpdateData.category = updateData.category;
        if (updateData.relatedVendorId !== undefined) liabilityUpdateData.relatedVendorId = updateData.relatedVendorId;
        if (updateData.dueDate !== undefined) liabilityUpdateData.dueDate = new Date(updateData.dueDate);
        if (updateData.amount !== undefined) liabilityUpdateData.amount = new Prisma.Decimal(updateData.amount);

        // Update liability
        const updatedLiability = await prisma.liability.update({
          where: { id: liability_id },
          data: liabilityUpdateData,
          include: {
            transaction: true,
            vendor: true,
            employee: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        });

        // Update transaction if amount changed
        let updatedTransaction: any = null;
        if (updateData.amount !== undefined && updateData.amount !== Number(existingLiability.amount)) {
          updatedTransaction = await prisma.transaction.update({
            where: { id: existingLiability.transactionId },
            data: {
              amount: new Prisma.Decimal(updateData.amount),
              notes: `Liability: ${updatedLiability.name} - ${updatedLiability.category} (Updated)`,
              updatedAt: this.getCurrentDateInPKT(),
            },
          });
        }

        return { liability: updatedLiability, transaction: updatedTransaction };
      });

      this.logger.log(
        `Liability updated: ${liability_id} by user ${currentUserId}`,
      );

      return {
        status: 'success',
        message: 'Liability updated successfully',
        data: {
          liability: this.mapLiabilityToResponse(result.liability),
          transaction: result.transaction ? this.mapTransactionToResponse(result.transaction) : undefined,
        },
      };

    } catch (error) {
      this.logger.error(
        `Failed to update liability ${liability_id}: ${error.message}`,
      );

      return {
        status: 'error',
        message: this.getErrorMessage(error.message),
        error_code: error.message,
      };
    }
  }

  /**
   * Marks a liability as paid and creates expense record
   */
  async markLiabilityAsPaid(
    dto: MarkLiabilityPaidDto,
    currentUserId: number
  ): Promise<LiabilityMarkPaidResponseDto | LiabilityErrorResponseDto> {
    const { liability_id, ...markPaidData } = dto;
    
    // Validate that ID exists
    if (!liability_id) {
      return {
        status: 'error',
        message: 'Liability ID is required',
        error_code: 'MISSING_LIABILITY_ID'
      };
    }
    
    try {
      // 1. Check if liability exists and is not already paid
      const existingLiability = await this.prisma.liability.findUnique({
        where: { id: liability_id },
        include: {
          transaction: true,
          vendor: true,
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      if (!existingLiability) {
        return {
          status: 'error',
          message: 'Liability not found',
          error_code: 'LIABILITY_NOT_FOUND'
        };
      }

      if (existingLiability.isPaid) {
        return {
          status: 'error',
          message: 'Liability is already paid',
          error_code: 'LIABILITY_ALREADY_PAID'
        };
      }

      // 2. Use Prisma transaction to ensure data consistency
      const result = await this.prisma.$transaction(async (prisma) => {
        const currentDate = this.getCurrentDateInPKT();

        // 3. Update liability as paid
        const updatedLiability = await prisma.liability.update({
          where: { id: liability_id },
          data: {
            isPaid: true,
            paidOn: currentDate,
            updatedAt: currentDate,
          },
          include: {
            transaction: true,
            vendor: true,
            employee: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        });

        // 4. Update linked transaction as completed
        const updatedTransaction = await prisma.transaction.update({
          where: { id: existingLiability.transactionId },
          data: {
            status: TransactionStatus.completed,
            updatedAt: currentDate,
            notes: `Liability paid: ${updatedLiability.name} - ${updatedLiability.category}`,
          },
        });

        // 5. Create expense record
        const expense = await prisma.expense.create({
          data: {
            title: updatedLiability.name,
            category: updatedLiability.category,
            amount: updatedLiability.amount,
            createdBy: currentUserId,
            paidOn: currentDate,
            transactionId: existingLiability.transactionId,
            processedByRole: 'Employee' as any,
            paymentMethod: this.mapPaymentWaysToPaymentMethod(PaymentWays.cash),
            notes: `Liability payment: ${updatedLiability.name} - ${updatedLiability.category}. Processed by user ID: ${currentUserId} on ${currentDate.toISOString()}.`,
          },
        });

        return { liability: updatedLiability, transaction: updatedTransaction, expense };
      });

      this.logger.log(
        `Liability marked as paid: ${liability_id} by user ${currentUserId}`,
      );

      return {
        status: 'success',
        message: 'Liability marked as paid successfully',
        data: {
          liability: this.mapLiabilityToResponse(result.liability),
          transaction: this.mapTransactionToResponse(result.transaction),
          expense: this.mapExpenseToResponse(result.expense),
        },
      };

    } catch (error) {
      this.logger.error(
        `Failed to mark liability ${liability_id} as paid: ${error.message}`,
      );

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
   * Maps liability data to response DTO
   */
  private mapLiabilityToResponse(liability: any): LiabilityResponseDto {
    return {
      id: liability.id,
      name: liability.name,
      category: liability.category,
      amount: Number(liability.amount),
      dueDate: liability.dueDate,
      isPaid: liability.isPaid,
      paidOn: liability.paidOn,
      relatedVendorId: liability.relatedVendorId,
      createdBy: liability.createdBy,
      createdAt: liability.createdAt,
      updatedAt: liability.updatedAt,
      transaction: this.mapTransactionToResponse(liability.transaction),
      expense: liability.expense ? this.mapExpenseToResponse(liability.expense) : undefined,
    };
  }

  /**
   * Maps transaction data to response DTO
   */
  private mapTransactionToResponse(transaction: any): any {
    return {
      id: transaction.id,
      employeeId: transaction.employeeId,
      vendorId: transaction.vendorId,
      clientId: transaction.clientId,
      invoiceId: transaction.invoiceId,
      amount: Number(transaction.amount),
      transactionType: transaction.transactionType,
      paymentMethod: transaction.paymentMethod,
      transactionDate: transaction.transactionDate,
      status: transaction.status,
      notes: transaction.notes,
      createdAt: transaction.createdAt,
      updatedAt: transaction.updatedAt,
    };
  }

  /**
   * Maps expense data to response DTO
   */
  private mapExpenseToResponse(expense: any): any {
    return {
      id: expense.id,
      title: expense.title,
      category: expense.category,
      amount: Number(expense.amount),
      paidOn: expense.paidOn,
      paymentMethod: expense.paymentMethod,
      notes: expense.notes,
    };
  }

  /**
   * Helper method to get error message
   */
  private getErrorMessage(errorCode: string): string {
    switch (errorCode) {
      case 'P2002':
        return 'A record with this ID already exists';
      case 'P2003':
        return 'Foreign key constraint failed';
      case 'P2025':
        return 'Record not found';
      default:
        return 'An error occurred while processing the request';
    }
  }
}