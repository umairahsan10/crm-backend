import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../../prisma/prisma.service';
import { Prisma, TransactionType, TransactionStatus, PaymentWays } from '@prisma/client';
import { CreateRevenueDto } from './dto/create-revenue.dto';
import { UpdateRevenueDto } from './dto/update-revenue.dto';
import { 
  RevenueResponseDto, 
  TransactionResponseDto, 
  LeadResponseDto, 
  InvoiceResponseDto,
  RevenueListResponseDto,
  RevenueCreateResponseDto,
  RevenueUpdateResponseDto,
  RevenueSingleResponseDto
} from './dto/revenue-response.dto';

export interface ErrorResponseDto {
  status: string;
  message: string;
  error_code: string;
}

@Injectable()
export class RevenueService {
  private readonly logger = new Logger(RevenueService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createRevenue(dto: CreateRevenueDto, currentUserId: number): Promise<RevenueCreateResponseDto | ErrorResponseDto> {
    try {
      // Validate inputs first
      const validationResult = await this.validateRevenueInputs(dto);
      if (validationResult) {
        return validationResult;
      }

      // Determine source and lead ID logic
      let finalSource = dto.source;
      let finalReceivedFrom = dto.receivedFrom;
      let finalRelatedInvoiceId = dto.relatedInvoiceId;

      // Logic: If receivedFrom is provided, relatedInvoiceId is required
      if (dto.receivedFrom && !dto.relatedInvoiceId) {
        return {
          status: 'error',
          message: 'If lead ID is provided, invoice ID is required',
          error_code: 'INVALID_INPUT'
        };
      }

      // If only relatedInvoiceId is provided, fetch lead ID from invoice
      if (!dto.receivedFrom && dto.relatedInvoiceId) {
        const invoice = await this.prisma.invoice.findUnique({
          where: { id: dto.relatedInvoiceId },
          include: { lead: true }
        });
        if (invoice && invoice.lead) {
          finalReceivedFrom = invoice.lead.id;
          finalSource = 'Lead Revenue';
        }
      }

      // If both are null, it's admin entry
      if (!finalReceivedFrom && !finalRelatedInvoiceId) {
        finalSource = 'Admin';
      }

      // Use Prisma transaction to ensure data consistency
      const result = await this.prisma.$transaction(async (prisma) => {
        const currentDate = this.getCurrentDateInPKT();
        const receivedOn = dto.receivedOn ? new Date(dto.receivedOn) : currentDate;

        let transaction;

        // Check if transaction ID exists
        if (dto.transactionId) {
          // Update existing transaction status to completed
          transaction = await prisma.transaction.update({
            where: { id: dto.transactionId },
            data: { status: TransactionStatus.completed }
          });
        } else {
          // 1. Create transaction record first
          // Get the next available ID (largest ID + 1)
          const maxTransactionId = await prisma.transaction.aggregate({
            _max: { id: true }
          });
          const nextTransactionId = (maxTransactionId._max.id || 0) + 1;

          // Determine transaction notes based on the scenario
          let transactionNotes = '';
          if (finalReceivedFrom && finalRelatedInvoiceId) {
            const lead = await prisma.lead.findUnique({ where: { id: finalReceivedFrom } });
            transactionNotes = `Revenue from Lead: ${lead?.name || 'Unknown'} - ${dto.category}`;
          } else if (finalRelatedInvoiceId) {
            transactionNotes = `Revenue from Invoice: ${finalRelatedInvoiceId} - ${dto.category}`;
          } else {
            transactionNotes = `Admin Revenue Entry: ${finalSource} - ${dto.category}`;
          }

          transaction = await prisma.transaction.create({
            data: {
              id: nextTransactionId, // Use explicit ID to avoid sequence conflicts
              employeeId: currentUserId,
              clientId: null, // Revenue transactions don't need client reference
              invoiceId: finalRelatedInvoiceId || null,
              amount: new Prisma.Decimal(dto.amount),
              transactionType: TransactionType.payment,
              paymentMethod: dto.paymentMethod ? this.mapPaymentMethodToPaymentWays(dto.paymentMethod) : PaymentWays.bank,
              transactionDate: currentDate,
              status: TransactionStatus.completed,
              notes: transactionNotes,
            },
          });
        }

        // 2. Create revenue record
        // Get the next available ID (largest ID + 1)
        const maxRevenueId = await prisma.revenue.aggregate({
          _max: { id: true }
        });
        const nextRevenueId = (maxRevenueId._max.id || 0) + 1;

        const revenue = await prisma.revenue.create({
          data: {
            id: nextRevenueId, // Use explicit ID to avoid sequence conflicts
            source: finalSource,
            category: dto.category,
            amount: new Prisma.Decimal(dto.amount),
            receivedFrom: finalReceivedFrom,
            receivedOn: receivedOn,
            paymentMethod: dto.paymentMethod || 'bank',
            relatedInvoiceId: finalRelatedInvoiceId,
            createdBy: currentUserId,
            transactionId: transaction.id,
          },
          include: {
            transaction: {
              include: {
                client: true, // This will be the lead
              },
            },
            lead: true,
            invoice: true,
            employee: {
              select: {
                id: true,
              },
            },
          },
        });
        return { revenue, transaction };
      });

      return {
        status: 'success',
        message: 'Revenue created successfully',
        data: {
          revenue: this.mapRevenueToResponse(result.revenue),
          transaction: this.mapTransactionToResponse(result.transaction),
        },
      };
    } catch (error) {
      this.logger.error(`Error creating revenue: ${error.message}`);
      
      // Handle specific database errors
      if (error.code === 'P2002') {
        return {
          status: 'error',
          message: 'A revenue record with this ID already exists',
          error_code: 'DUPLICATE_ID'
        };
      }
      
      if (error.code === 'P2003') {
        return {
          status: 'error',
          message: 'Invalid reference: One of the provided IDs does not exist',
          error_code: 'INVALID_REFERENCE'
        };
      }
      
      return this.getErrorMessage('creating revenue', error);
    }
  }

  async getAllRevenues(query: any): Promise<RevenueListResponseDto | ErrorResponseDto> {
    try {
      const {
        category,
        fromDate,
        toDate,
        createdBy,
        minAmount,
        maxAmount,
        paymentMethod,
        source,
        receivedFrom,
        relatedInvoiceId,
        page = 1,
        limit = 10,
      } = query;

      const skip = (page - 1) * limit;
      const whereClause: any = {};

      // Add filters
      if (category) {
        whereClause.category = { contains: category, mode: 'insensitive' };
      }

      if (source) {
        whereClause.source = { contains: source, mode: 'insensitive' };
      }

      if (receivedFrom) {
        whereClause.receivedFrom = parseInt(receivedFrom);
      }

      if (relatedInvoiceId) {
        whereClause.relatedInvoiceId = parseInt(relatedInvoiceId);
      }

      if (createdBy) {
        whereClause.createdBy = parseInt(createdBy);
      }

      if (minAmount || maxAmount) {
        whereClause.amount = {};
        if (minAmount) whereClause.amount.gte = new Prisma.Decimal(minAmount);
        if (maxAmount) whereClause.amount.lte = new Prisma.Decimal(maxAmount);
      }

      if (paymentMethod) {
        whereClause.paymentMethod = paymentMethod;
      }

      if (fromDate || toDate) {
        whereClause.receivedOn = {};
        if (fromDate) {
          whereClause.receivedOn.gte = new Date(fromDate);
        }
        if (toDate) {
          whereClause.receivedOn.lte = new Date(toDate);
        }
      }

      console.log('Revenue filters:', query);
      console.log('Generated where clause:', JSON.stringify(whereClause, null, 2));

      const [revenues, total] = await Promise.all([
        this.prisma.revenue.findMany({
          where: whereClause,
          include: {
            transaction: {
              include: {
                client: true,
              },
            },
            lead: true,
            invoice: true,
            employee: {
              select: {
                id: true,
              },
            },
          },
          skip,
          take: parseInt(limit),
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.revenue.count({ where: whereClause }),
      ]);

      console.log(`Found ${revenues.length} revenues out of ${total} total`);

      return {
        status: 'success',
        message: 'Revenues retrieved successfully',
        data: revenues.map(revenue => this.mapRevenueToResponse(revenue)),
        total,
      };
    } catch (error) {
      this.logger.error(`Error retrieving revenues: ${error.message}`);
      
      // Handle specific database errors
      if (error.code === 'P2003') {
        return {
          status: 'error',
          message: 'Invalid reference in filter criteria',
          error_code: 'INVALID_FILTER'
        };
      }
      
      return this.getErrorMessage('retrieving revenues', error);
    }
  }

  async getRevenueById(id: number): Promise<RevenueSingleResponseDto | ErrorResponseDto> {
    try {
      if (!id) {
        return {
          status: 'error',
          message: 'Revenue ID is required',
          error_code: 'MISSING_ID'
        };
      }

      const revenue = await this.prisma.revenue.findUnique({
        where: { id },
        include: {
          transaction: {
            include: {
              client: true,
            },
          },
          lead: true,
          invoice: true,
          employee: {
            select: {
              id: true,
            },
          },
        },
      });

      if (!revenue) {
        return {
          status: 'error',
          message: 'Revenue not found',
          error_code: 'NOT_FOUND'
        };
      }

      return {
        status: 'success',
        message: 'Revenue retrieved successfully',
        data: this.mapRevenueToResponse(revenue),
      };
    } catch (error) {
      this.logger.error(`Error retrieving revenue: ${error.message}`);
      
      // Handle specific database errors
      if (error.code === 'P2003') {
        return {
          status: 'error',
          message: 'Invalid revenue ID provided',
          error_code: 'INVALID_ID'
        };
      }
      
      return this.getErrorMessage('retrieving revenue', error);
    }
  }

  async updateRevenue(dto: UpdateRevenueDto): Promise<RevenueUpdateResponseDto | ErrorResponseDto> {
    try {
      if (!dto.revenue_id) {
        return {
          status: 'error',
          message: 'Revenue ID is required',
          error_code: 'MISSING_ID'
        };
      }

      // Check if revenue exists
      const existingRevenue = await this.prisma.revenue.findUnique({
        where: { id: dto.revenue_id },
        include: { transaction: true }
      });

      if (!existingRevenue) {
        return {
          status: 'error',
          message: 'Revenue not found',
          error_code: 'NOT_FOUND'
        };
      }

      // Validate inputs if provided
      if (dto.receivedFrom || dto.relatedInvoiceId) {
        const validationResult = await this.validateRevenueInputs({
          receivedFrom: dto.receivedFrom,
          relatedInvoiceId: dto.relatedInvoiceId,
        } as any);
        if (validationResult) {
          return validationResult;
        }
      }

      // Use Prisma transaction to ensure data consistency
      const result = await this.prisma.$transaction(async (prisma) => {
        const currentDate = this.getCurrentDateInPKT();

        // Prepare update data
        const updateData: any = {
          updatedAt: currentDate,
        };

        if (dto.source !== undefined) updateData.source = dto.source;
        if (dto.category !== undefined) updateData.category = dto.category;
        if (dto.amount !== undefined) updateData.amount = new Prisma.Decimal(dto.amount);
        if (dto.receivedFrom !== undefined) updateData.receivedFrom = dto.receivedFrom;
        if (dto.receivedOn !== undefined) updateData.receivedOn = new Date(dto.receivedOn);
        if (dto.paymentMethod !== undefined) updateData.paymentMethod = dto.paymentMethod;
        if (dto.relatedInvoiceId !== undefined) updateData.relatedInvoiceId = dto.relatedInvoiceId;

        // Update revenue
        const updatedRevenue = await prisma.revenue.update({
          where: { id: dto.revenue_id },
          data: updateData,
          include: {
            transaction: {
              include: {
                client: true,
              },
            },
            lead: true,
            invoice: true,
            employee: {
              select: {
                id: true,
              },
            },
          },
        });

        // Update transaction if necessary
        let updatedTransaction: any = null;
        if (dto.amount || dto.receivedFrom !== undefined || dto.relatedInvoiceId !== undefined || dto.paymentMethod || dto.source || dto.category) {
          const transactionUpdateData: any = {
            updatedAt: currentDate,
          };

          if (dto.amount) {
            transactionUpdateData.amount = new Prisma.Decimal(dto.amount);
          }

          // Note: clientId is not updated as revenue transactions don't reference clients
          // The lead relationship is maintained through the Revenue.receivedFrom field

          if (dto.relatedInvoiceId !== undefined) {
            transactionUpdateData.invoiceId = dto.relatedInvoiceId;
          }

          if (dto.paymentMethod) {
            transactionUpdateData.paymentMethod = this.mapPaymentMethodToPaymentWays(dto.paymentMethod);
          }

          if (dto.source || dto.category) {
            const newSource = dto.source || updatedRevenue.source;
            const newCategory = dto.category || updatedRevenue.category;
            
            // Determine transaction notes based on the scenario
            let transactionNotes = '';
            if (updatedRevenue.receivedFrom && updatedRevenue.relatedInvoiceId) {
              const lead = await prisma.lead.findUnique({ where: { id: updatedRevenue.receivedFrom } });
              transactionNotes = `Revenue from Lead: ${lead?.name || 'Unknown'} - ${newCategory}`;
            } else if (updatedRevenue.relatedInvoiceId) {
              transactionNotes = `Revenue from Invoice: ${updatedRevenue.relatedInvoiceId} - ${newCategory}`;
            } else {
              transactionNotes = `Admin Revenue Entry: ${newSource} - ${newCategory}`;
            }
            
            transactionUpdateData.notes = transactionNotes;
          }

          if (existingRevenue.transactionId) {
            updatedTransaction = await prisma.transaction.update({
              where: { id: existingRevenue.transactionId },
              data: transactionUpdateData,
            });
          }
        }

        return { revenue: updatedRevenue, transaction: updatedTransaction };
      });

              const responseData: any = {
          revenue: this.mapRevenueToResponse(result.revenue),
        };
        
        if (result.transaction) {
          responseData.transaction = this.mapTransactionToResponse(result.transaction);
        }

        return {
          status: 'success',
          message: 'Revenue updated successfully',
          data: responseData,
        };
    } catch (error) {
      this.logger.error(`Error updating revenue: ${error.message}`);
      
      // Handle specific database errors
      if (error.code === 'P2002') {
        return {
          status: 'error',
          message: 'A revenue record with this ID already exists',
          error_code: 'DUPLICATE_ID'
        };
      }
      
      if (error.code === 'P2003') {
        return {
          status: 'error',
          message: 'Invalid reference: One of the provided IDs does not exist',
          error_code: 'INVALID_REFERENCE'
        };
      }
      
      if (error.code === 'P2025') {
        return {
          status: 'error',
          message: 'Revenue record not found for update',
          error_code: 'NOT_FOUND'
        };
      }
      
      return this.getErrorMessage('updating revenue', error);
    }
  }

  private async validateRevenueInputs(dto: any): Promise<ErrorResponseDto | null> {
    // Validate lead exists and is completed if provided
    if (dto.receivedFrom) {
      const lead = await this.prisma.lead.findUnique({
        where: { id: dto.receivedFrom }
      });
      if (!lead) {
        return {
          status: 'error',
          message: 'Lead not found',
          error_code: 'LEAD_NOT_FOUND'
        };
      }
      
      // Check if lead status is completed
      if (lead.status !== 'completed') {
        return {
          status: 'error',
          message: 'Revenue can only be recorded for completed leads',
          error_code: 'LEAD_NOT_COMPLETED'
        };
      }
    }

    // Validate invoice exists if provided
    if (dto.relatedInvoiceId) {
      const invoice = await this.prisma.invoice.findUnique({
        where: { id: dto.relatedInvoiceId },
        include: { lead: true }
      });
      if (!invoice) {
        return {
          status: 'error',
          message: 'Invoice not found',
          error_code: 'INVOICE_NOT_FOUND'
        };
      }

      // If both lead and invoice are provided, validate they match
      if (dto.receivedFrom && invoice.leadId !== dto.receivedFrom) {
        return {
          status: 'error',
          message: 'Lead ID does not match invoice lead ID',
          error_code: 'LEAD_INVOICE_MISMATCH'
        };
      }
    }

    return null;
  }

  private getCurrentDateInPKT(): Date {
    return new Date();
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
        return PaymentWays.bank;
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

  private mapLeadToResponse(lead: any): LeadResponseDto | null {
    if (!lead) return null;
    return {
      id: lead.id,
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      source: lead.source,
      type: lead.type,
      status: lead.status,
      createdAt: lead.createdAt.toISOString(),
      updatedAt: lead.updatedAt.toISOString(),
    };
  }

  private mapInvoiceToResponse(invoice: any): InvoiceResponseDto | null {
    if (!invoice) return null;
    return {
      id: invoice.id,
      issueDate: invoice.issueDate.toISOString(),
      amount: Number(invoice.amount),
      notes: invoice.notes,
      createdAt: invoice.createdAt.toISOString(),
    };
  }

  private mapRevenueToResponse(revenue: any): RevenueResponseDto {
    return {
      id: revenue.id,
      source: revenue.source,
      category: revenue.category,
      amount: Number(revenue.amount),
      receivedFrom: revenue.receivedFrom,
      receivedOn: revenue.receivedOn ? revenue.receivedOn.toISOString() : null,
      paymentMethod: revenue.paymentMethod,
      relatedInvoiceId: revenue.relatedInvoiceId,
      createdBy: revenue.createdBy,
      transactionId: revenue.transactionId,
      createdAt: revenue.createdAt.toISOString(),
      updatedAt: revenue.updatedAt.toISOString(),
      transaction: revenue.transaction ? this.mapTransactionToResponse(revenue.transaction) : null,
      lead: this.mapLeadToResponse(revenue.lead),
      invoice: this.mapInvoiceToResponse(revenue.invoice),
      employee: revenue.employee ? { id: revenue.employee.id } : null,
    };
  }

  private getErrorMessage(operation: string, error: any): ErrorResponseDto {
    return {
      status: 'error',
      message: `An error occurred while ${operation}`,
      error_code: error.code || 'UNKNOWN_ERROR',
    };
  }
}
