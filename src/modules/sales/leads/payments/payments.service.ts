import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../../prisma/prisma.service';
import { GeneratePaymentLinkDto } from './dto/generate-payment-link.dto';
import { PaymentLinkResponseDto } from './dto/payment-link-response.dto';
import { RevenueService } from '../../../finance/accountant/revenue/revenue.service';

@Injectable()
export class PaymentsService {
    constructor(
        private prisma: PrismaService,
        private revenueService: RevenueService
    ) { }

    async generatePaymentLink(
        dto: GeneratePaymentLinkDto,
        userId: number
    ): Promise<PaymentLinkResponseDto> {
        try {
            // 1. Validate lead exists and is cracked
            const lead = await this.prisma.lead.findFirst({
                where: {
                    id: dto.leadId,
                    status: 'cracked'
                }
            });

            if (!lead) {
                throw new NotFoundException('Lead not found or not in cracked status');
            }

            // Get the cracked lead record
            const crackedLead = await this.prisma.crackedLead.findFirst({
                where: { leadId: dto.leadId }
            });

            if (!crackedLead) {
                throw new BadRequestException('Lead is not properly cracked');
            }

            // 2. Verify JWT user is the same as crackedById from the lead
            if (crackedLead.closedBy !== userId) {
                throw new ForbiddenException('Only the sales representative who cracked this lead can generate payment link');
            }
            if (crackedLead.remainingAmount !== null && dto.amount > crackedLead.remainingAmount) {
                throw new BadRequestException(`Phase amount (${dto.amount}) cannot exceed remaining amount (${crackedLead.remainingAmount})`);
            }

            // Check if this is the final phase (current phase equals total phases)
            if (crackedLead.currentPhase && crackedLead.totalPhases && 
                crackedLead.currentPhase === crackedLead.totalPhases) {
                // For final phase, amount must exactly match remaining amount
                if (crackedLead.remainingAmount !== null && dto.amount !== crackedLead.remainingAmount) {
                    throw new BadRequestException(`Final phase amount (${dto.amount}) must exactly match remaining amount (${crackedLead.remainingAmount})`);
                }
            }
            // 3. Validate all required fields (already done by DTO validation)

            // 4. Square API Simulation - For now, just validate fields
            // TODO: Replace with actual Square API call when available
            const squareApiSuccess = await this.simulateSquareApiCall(dto);

            if (!squareApiSuccess) {
                return {
                    success: false,
                    message: 'Payment link generation failed',
                    error: 'Square API returned failure status'
                };
            }

            // 5. Database Operations - If validation passes
            const result = await this.prisma.$transaction(async (prisma) => {
                let client;

                // If clientId is provided, update existing client
                if (dto.clientId) {
                    client = await prisma.client.findUnique({
                        where: { id: dto.clientId }
                    });

                    if (!client) {
                        throw new BadRequestException(`Client with ID ${dto.clientId} not found. Please provide client information to create a new client.`);
                    }

                    // Update existing client with new information
                    client = await prisma.client.update({
                        where: { id: dto.clientId },
                        data: {
                            clientName: dto.clientName || client.clientName,
                            companyName: dto.companyName || client.companyName,
                            email: dto.email || client.email,
                            phone: dto.phone || client.phone,
                            country: dto.country || client.country,
                            state: dto.state || client.state,
                            postalCode: dto.postalCode || client.postalCode,
                            notes: `Updated from lead ${dto.leadId} payment link generation`
                        }
                    });
                } else {
                    // Check if client already exists by email
                    client = await prisma.client.findFirst({
                        where: { email: dto.email }
                    });

                    // If client doesn't exist, create new one
                    if (!client) {
                        // Get max client ID and increment by 1
                        const maxClient = await prisma.client.findFirst({
                            orderBy: { id: 'desc' }
                        });
                        const nextClientId = (maxClient?.id || 0) + 1;

                        // Create client record with custom ID
                        client = await prisma.client.create({
                            data: {
                                id: nextClientId,
                                clientName: dto.clientName!,
                                companyName: dto.companyName,
                                email: dto.email!,
                                phone: dto.phone!,
                                country: dto.country!,
                                state: dto.state!,
                                postalCode: dto.postalCode!,
                                industryId: crackedLead.industryId, // Get industry ID from cracked lead
                                passwordHash: 'temp123', // Required field
                                accountStatus: 'prospect',
                                createdBy: userId,
                                notes: `Created from lead ${dto.leadId} payment link generation`
                            }
                        });
                    } else {
                        // Update existing client with new information if provided
                        client = await prisma.client.update({
                            where: { id: client.id },
                            data: {
                                clientName: dto.clientName!,
                                companyName: dto.companyName!,
                                email: dto.email!,
                                phone: dto.phone!,
                                country: dto.country!,
                                state: dto.state!,
                                postalCode: dto.postalCode!,
                                notes: `Updated from lead ${dto.leadId} payment link generation`
                            }
                        });
                    }
                }

                // Get max transaction ID and increment by 1
                const maxTransaction = await prisma.transaction.findFirst({
                    orderBy: { id: 'desc' }
                });
                const nextTransactionId = (maxTransaction?.id || 0) + 1;

                // Create transaction record with custom ID
                const transaction = await prisma.transaction.create({
                    data: {
                        id: nextTransactionId,
                        amount: dto.amount,
                        transactionType: dto.type || 'payment',
                        paymentMethod: dto.method || 'bank',
                        clientId: client.id,
                        employeeId: userId,
                        status: 'pending',
                        notes: `Payment link generated for lead ${dto.leadId}`
                    }
                });

                // Get max invoice ID and increment by 1
                const maxInvoice = await prisma.invoice.findFirst({
                    orderBy: { id: 'desc' }
                });
                const nextInvoiceId = (maxInvoice?.id || 0) + 1;

                // Create invoice record with custom ID
                const invoice = await prisma.invoice.create({
                    data: {
                        id: nextInvoiceId,
                        leadId: dto.leadId,
                        issueDate: new Date(),
                        amount: dto.amount,
                        notes: `Invoice generated for payment link - Lead ${dto.leadId} - Client: ${client.clientName}`
                    }
                });

                // Update transaction with invoice ID
                const updatedTransaction = await prisma.transaction.update({
                    where: { id: transaction.id },
                    data: { invoiceId: invoice.id }
                });

                // Update lead status to payment_link_generated
                await prisma.lead.update({
                    where: { id: dto.leadId },
                    data: { status: 'payment_link_generated' }
                });

                return { client, transaction: updatedTransaction, invoice };
            });

            return {
                success: true,
                message: 'Payment link generated successfully',
                data: {
                    clientId: result.client.id,
                    transactionId: result.transaction.id,
                    invoiceId: result.invoice.id,
                    paymentLink: `https://payment.example.com/pay/${result.transaction.id}`, // TODO: Generate actual payment link
                    leadStatus: 'payment_link_generated'
                }
            };

        } catch (error) {
            if (error instanceof BadRequestException ||
                error instanceof ForbiddenException ||
                error instanceof NotFoundException) {
                throw error;
            }

            return {
                success: false,
                message: 'Internal server error occurred',
                error: error.message
            };
        }
    }

    private async simulateSquareApiCall(dto: GeneratePaymentLinkDto): Promise<boolean> {
        // TODO: Replace with actual Square API call
        // For now, just simulate success
        console.log('Simulating Square API call with data:', dto);

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 100));

        // Simulate success (you can change this to false to test failure scenario)
        return true;
    }

    // Method to get payment details by transaction ID
    async getPaymentDetails(transactionId: number, userId: number) {
        const transaction = await this.prisma.transaction.findFirst({
            where: { id: transactionId },
            include: {
                client: true,
                employee: true
            }
        });

        if (!transaction) {
            throw new NotFoundException('Transaction not found');
        }

        // Only allow access to the user who created the transaction
        if (transaction.employeeId !== userId) {
            throw new ForbiddenException('Access denied to this payment record');
        }

        return transaction;
    }

    // Method to update payment link details (only by creator)
    async updatePaymentLinkDetails(
        transactionId: number,
        updateDto: any,
        userId: number
    ) {
        // Get transaction with client details
        const transaction = await this.prisma.transaction.findFirst({
            where: { id: transactionId },
            include: { client: true, invoice: true }
        });

        if (!transaction) {
            throw new NotFoundException('Transaction not found');
        }

        if (transaction.employeeId !== userId) {
            throw new ForbiddenException('Only the creator can update this payment record');
        }

        // Update in transaction to ensure data consistency
        const result = await this.prisma.$transaction(async (prisma) => {
            const updateData: any = {};
            const clientUpdateData: any = {};

            // Prepare transaction update data
            if (updateDto.amount !== undefined) {
                // Validate phase amount against remaining amount in cracked lead
                if (!transaction.invoice?.leadId) {
                    throw new BadRequestException('No associated lead found for this transaction');
                }
                
                const crackedLead = await prisma.crackedLead.findFirst({
                    where: { 
                        leadId: transaction.invoice.leadId 
                    }
                });

                if (crackedLead && crackedLead.remainingAmount !== null) {
                    if (crackedLead.remainingAmount <= 0) {
                        throw new BadRequestException('No remaining amount available for this lead');
                    }
                    
                    if (updateDto.amount > crackedLead.remainingAmount) {
                        throw new BadRequestException(`Phase amount (${updateDto.amount}) cannot exceed remaining amount (${crackedLead.remainingAmount})`);
                    }
                }
                
                updateData.amount = updateDto.amount;
            }
            if (updateDto.type !== undefined) {
                updateData.transactionType = updateDto.type;
            }
            if (updateDto.method !== undefined) {
                updateData.paymentMethod = updateDto.method;
            }

            // Prepare client update data
            if (updateDto.clientName !== undefined) {
                clientUpdateData.clientName = updateDto.clientName;
            }
            if (updateDto.companyName !== undefined) {
                clientUpdateData.companyName = updateDto.companyName;
            }
            if (updateDto.email !== undefined) {
                clientUpdateData.email = updateDto.email;
            }
            if (updateDto.phone !== undefined) {
                clientUpdateData.phone = updateDto.phone;
            }
            if (updateDto.country !== undefined) {
                clientUpdateData.country = updateDto.country;
            }
            if (updateDto.state !== undefined) {
                clientUpdateData.state = updateDto.state;
            }
            if (updateDto.postalCode !== undefined) {
                clientUpdateData.postalCode = updateDto.postalCode;
            }

            // Update transaction if there are changes
            let updatedTransaction = transaction;
            if (Object.keys(updateData).length > 0) {
                updatedTransaction = await prisma.transaction.update({
                    where: { id: transactionId },
                    data: updateData,
                    include: { client: true, invoice: true }
                });
            }

            // Update client if there are changes
            let updatedClient = transaction.client;
            if (Object.keys(clientUpdateData).length > 0 && transaction.clientId) {
                updatedClient = await prisma.client.update({
                    where: { id: transaction.clientId },
                    data: clientUpdateData
                });
            }

            return { transaction: updatedTransaction, client: updatedClient };
        });

        return {
            success: true,
            message: 'Payment link details updated successfully',
            data: {
                transactionId: result.transaction.id,
                clientId: result.client?.id || transaction.clientId,
                updatedFields: {
                    transaction: Object.keys(updateDto).filter(key => ['amount', 'type', 'method'].includes(key)),
                    client: Object.keys(updateDto).filter(key => ['clientName', 'companyName', 'email', 'phone', 'country', 'state', 'postalCode'].includes(key))
                }
            }
        };
    }

    // Method to handle payment completion and generate revenue
    async handlePaymentCompletion(
        transactionId: number,
        userId: number,
        paymentDetails: {
            // amount: number;
            paymentMethod?: string;
            category?: string;
        }
    ) {
        try {
            // 1. Verify transaction exists and user has access
            const transaction = await this.prisma.transaction.findFirst({
                where: { id: transactionId },
                include: { client: true, invoice: true }
            });

            if (!transaction) {
                throw new NotFoundException('Transaction not found');
            }

            if (transaction.employeeId !== userId) {
                throw new ForbiddenException('Only the creator can complete this payment');
            }
            const amount = transaction.amount.toNumber();

            // 2. Complete transaction, subtract amount from remaining amount, and log client payment
            await this.prisma.$transaction(async (prisma) => {
                // Update transaction status to completed
                await prisma.transaction.update({
                    where: { id: transactionId },
                    data: { status: 'completed' }
                });

                // Update remaining amount in cracked lead
                let crackedLead: any = null;
                if (transaction.invoice?.leadId) {
                    crackedLead = await prisma.crackedLead.findFirst({
                        where: { leadId: transaction.invoice.leadId }
                    });

                    if (crackedLead && crackedLead.remainingAmount !== null) {
                        const newRemainingAmount = Math.max(0, crackedLead.remainingAmount - amount);
                        await prisma.crackedLead.update({
                            where: { id: crackedLead.id },
                            data: { remainingAmount: newRemainingAmount }
                        });
                    }
                }

                // Create client payment record
                if (transaction.clientId && transaction.invoiceId) {
                    // Get the next available client payment ID
                    const maxClientPaymentId = await prisma.clientPayment.aggregate({
                        _max: { id: true }
                    });
                    const nextClientPaymentId = (maxClientPaymentId._max.id || 0) + 1;

                    await prisma.clientPayment.create({
                        data: {
                            id: nextClientPaymentId,
                            clientId: transaction.clientId,
                            invoiceId: transaction.invoiceId,
                            paymentDate: new Date(),
                            amountPaid: amount,
                            paymentMethod: paymentDetails.paymentMethod || 'bank',
                            transactionId: transactionId.toString(),
                            paymentStatus: 'completed',
                            paymentPhase: 1, // Default phase, can be updated based on business logic
                            notes: `Payment completed via payment link for transaction ${transactionId}`,
                            cracked_lead_id: crackedLead?.id || null
                        }
                    });
                }
            });

            // 3. Update lead status to completed for revenue generation
            if (transaction.invoice?.leadId) {
                await this.prisma.lead.update({
                    where: { id: transaction.invoice.leadId },
                    data: { status: 'completed' }
                });
            }

            // 4. Generate revenue after transaction is completed
            const revenueDto = {
                source: 'Lead Revenue',
                category: paymentDetails.category || 'Payment Link Revenue',
                amount: amount,
                receivedFrom: transaction.invoice?.leadId || undefined,
                receivedOn: new Date().toISOString(),
                paymentMethod: (paymentDetails.paymentMethod as any) || 'bank',
                relatedInvoiceId: transaction.invoiceId || undefined,
                transactionId: transactionId
            };

            const revenueResult = await this.revenueService.createRevenue(revenueDto, userId);

            if (revenueResult.status === 'error') {
                // If revenue creation fails, we don't revert transaction since it's already completed
                // This is intentional - transaction completion is separate from revenue recording
                console.warn(`Revenue creation failed for transaction ${transactionId}: ${revenueResult.message}`);
            }

            // 5. Check remaining amount and update lead status/phase accordingly
            if (transaction.invoice?.leadId) {
                const updatedCrackedLead = await this.prisma.crackedLead.findFirst({
                    where: { leadId: transaction.invoice.leadId }
                });

                if (updatedCrackedLead) {
                    // If remaining amount is not 0, revert lead status to cracked and increment current phase
                    if (updatedCrackedLead.remainingAmount !== null && updatedCrackedLead.remainingAmount > 0) {
                        const newCurrentPhase = (updatedCrackedLead.currentPhase || 0) + 1;
                        
                        // Check if current phase would exceed total phases
                        if (updatedCrackedLead.totalPhases && newCurrentPhase > updatedCrackedLead.totalPhases) {
                            throw new BadRequestException(`Current phase (${newCurrentPhase}) cannot exceed total phases (${updatedCrackedLead.totalPhases})`);
                        }
                        
                        const finalCurrentPhase = newCurrentPhase;

                        await this.prisma.$transaction(async (prisma) => {
                            // Update lead status back to cracked
                            await prisma.lead.update({
                                where: { id: transaction.invoice!.leadId! },
                                data: { status: 'cracked' }
                            });

                            // Update current phase in cracked lead
                            await prisma.crackedLead.update({
                                where: { id: updatedCrackedLead.id },
                                data: { currentPhase: finalCurrentPhase }
                            });
                        });
                    }
                }
            }

            return {
                success: true,
                message: 'Payment completed, client payment logged, and revenue generated successfully',
                data: {
                    transactionId: transactionId,
                    transactionStatus: 'completed',
                    clientPaymentLogged: true,
                    revenue: revenueResult.status === 'success' ? (revenueResult as any).data?.revenue : null,
                    revenueStatus: revenueResult.status,
                    clientId: transaction.clientId,
                    invoiceId: transaction.invoiceId
                }
            };

        } catch (error) {
            if (error instanceof BadRequestException ||
                error instanceof ForbiddenException ||
                error instanceof NotFoundException) {
                throw error;
            }

            return {
                success: false,
                message: 'Payment completion failed',
                error: error.message
            };
        }
    }
}
