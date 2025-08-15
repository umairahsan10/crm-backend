import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { RequestLeadsDto } from './dto/request-leads.dto';
import { MarkUpsellDto } from './dto/mark-upsell.dto';
import { UpdateCrackedLeadDto } from './dto/update-cracked-lead.dto';
import { ArchiveLeadSource, ArchiveLeadOutcome, ArchiveLeadQualityRating } from '@prisma/client';

@Injectable()
export class LeadsService {
    constructor(private prisma: PrismaService) { }

    async create(createLeadDto: CreateLeadDto) {
        // Validate sales unit exists
        const salesUnit = await this.prisma.salesUnit.findUnique({
            where: { id: createLeadDto.salesUnitId }
        });

        if (!salesUnit) {
            throw new BadRequestException('Sales unit not found');
        }

        // Create lead with defaults
        const lead = await this.prisma.lead.create({
            data: {
                name: createLeadDto.name,
                email: createLeadDto.email,
                phone: createLeadDto.phone,
                source: createLeadDto.source,
                type: createLeadDto.type,
                status: 'new',
                outcome: null,
                assignedToId: null,
                startedById: null,
                failedCount: 0,
                salesUnitId: createLeadDto.salesUnitId,
            }
        });

        return lead;
    }

    async findAll(query: any, userRole: string, userUnitId?: number) {
        console.log('🔍 findAll called with userRole:', userRole, 'userUnitId:', userUnitId);
        
        const where: any = {};

        // Apply filters
        if (query.status) where.status = query.status;
        if (query.salesUnitId) where.salesUnitId = parseInt(query.salesUnitId);
        if (query.assignedTo) where.assignedToId = parseInt(query.assignedTo);

        // Role-based type filtering
        if (query.type) {
            where.type = query.type;
            console.log('🔍 Using explicit type filter:', query.type);
        } else {
            // Apply role-based restrictions based on schema enum values
            const roleAccessMap = {
                'junior': ['warm', 'cold'],
                'senior': ['warm', 'cold', 'push'],
                'dep_manager': ['warm', 'cold', 'push', 'upsell'],
                'team_lead': ['warm', 'cold', 'push', 'upsell'],
                'unit_head': ['warm', 'cold', 'push', 'upsell'],
                'admin': ['warm', 'cold', 'push', 'upsell']
            };

            if (roleAccessMap[userRole]) {
                where.type = { in: roleAccessMap[userRole] };
                console.log('🔍', userRole, 'role - can see:', roleAccessMap[userRole], 'leads');
            } else {
                // Default fallback - restrict to warm and cold for unknown roles
                where.type = { in: ['warm', 'cold'] };
                console.log('🔍 Unknown role:', userRole, '- restricted to warm/cold leads');
            }
        }

        // Unit restriction for non-admin users
        if (userUnitId && userRole !== 'admin') {
            where.salesUnitId = userUnitId;
        }

        const page = parseInt(query.page) || 1;
        const limit = parseInt(query.limit) || 20;
        const skip = (page - 1) * limit;

        const [leads, total] = await Promise.all([
            this.prisma.lead.findMany({
                where,
                include: {
                    assignedTo: { select: { firstName: true, lastName: true } },
                    startedBy: { select: { firstName: true, lastName: true } },
                    salesUnit: { select: { name: true } },
                },
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' }
            }),
            this.prisma.lead.count({ where })
        ]);

        return {
            leads,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    async findOne(id: number) {
        const lead = await this.prisma.lead.findUnique({
            where: { id },
            include: {
                assignedTo: { select: { firstName: true, lastName: true } },
                startedBy: { select: { firstName: true, lastName: true } },
                salesUnit: { select: { name: true } },
                comments: {
                    include: {
                        employee: { select: { firstName: true, lastName: true } }
                    },
                    orderBy: { createdAt: 'desc' }
                },
                outcomeHistory: {
                    include: {
                        changedByUser: { select: { firstName: true, lastName: true } },
                        comment: { select: { commentText: true } }
                    },
                    orderBy: { createdAt: 'desc' }
                }
            }
        });

        if (!lead) {
            throw new NotFoundException('Lead not found');
        }

        return lead;
    }

    async requestLeads(requestLeadsDto: RequestLeadsDto) {
        const { employeeId, keptLeadIds = [], circulateLeadIds = [] } = requestLeadsDto;

        // Validate employee exists and is active
        const employee = await this.prisma.employee.findFirst({
            where: {
                id: employeeId,
                status: 'active'
            },
            include: {
                salesDepartment: {
                    select: { salesUnitId: true }
                }
            }
        });

        if (!employee) {
            throw new BadRequestException('Employee not found or inactive');
        }

        if (!employee.salesDepartment?.[0]?.salesUnitId) {
            throw new BadRequestException('Employee not assigned to any sales unit');
        }

        const salesUnitId = employee.salesDepartment[0].salesUnitId;

        return await this.prisma.$transaction(async (prisma) => {
            // Step 2.1: Handle circulated leads
            if (circulateLeadIds.length > 0) {
                await prisma.lead.updateMany({
                    where: {
                        id: { in: circulateLeadIds },
                        assignedToId: employeeId
                    },
                    data: {
                        assignedToId: null,
                        outcome: null,
                        status: 'new',
                        updatedAt: new Date()
                    }
                });
            }

            // Count current assigned leads
            const currentAssignedCount = await prisma.lead.count({
                where: {
                    assignedToId: employeeId,
                    status: { not: 'failed' }
                }
            });

            const keptCount = keptLeadIds.length;
            const neededLeads = 10 - keptCount - currentAssignedCount;

            if (neededLeads <= 0) {
                // Return existing leads if already have 10
                const existingLeads = await prisma.lead.findMany({
                    where: { assignedToId: employeeId },
                    include: {
                        assignedTo: { select: { firstName: true, lastName: true } },
                        salesUnit: { select: { name: true } }
                    }
                });

                return {
                    assignedLeads: [],
                    keptLeads: existingLeads.slice(0, 10),
                    totalActiveLeads: existingLeads.length
                };
            }

            // Step 2.2: Assign new leads (prioritize warm over cold)
            const availableLeads = await prisma.lead.findMany({
                where: {
                    assignedToId: null,
                    status: 'new',
                    salesUnitId,
                    type: { in: ['warm', 'cold'] }
                },
                orderBy: [
                    { type: 'asc' }, // warm comes before cold
                    { createdAt: 'asc' } // oldest first
                ],
                take: neededLeads
            });

            if (availableLeads.length < neededLeads) {
                throw new NotFoundException(`Insufficient leads available. Need ${neededLeads}, only ${availableLeads.length} available.`);
            }

            // Assign leads
            const assignedLeads = await Promise.all(
                availableLeads.map(lead =>
                    prisma.lead.update({
                        where: { id: lead.id },
                        data: {
                            assignedToId: employeeId,
                            startedById: employeeId,
                            status: 'in_progress',
                            updatedAt: new Date()
                        },
                        include: {
                            assignedTo: { select: { firstName: true, lastName: true } },
                            salesUnit: { select: { name: true } }
                        }
                    })
                )
            );

            // Get kept leads
            const keptLeads = await prisma.lead.findMany({
                where: { id: { in: keptLeadIds } },
                include: {
                    assignedTo: { select: { firstName: true, lastName: true } },
                    salesUnit: { select: { name: true } }
                }
            });

            return {
                assignedLeads,
                keptLeads,
                totalActiveLeads: keptLeads.length + assignedLeads.length
            };
        });
    }

    async update(id: number, updateLeadDto: UpdateLeadDto, userId: number) {
        const lead = await this.prisma.lead.findUnique({
            where: { id },
            include: {
                assignedTo: true,
                salesUnit: true
            }
        });

        if (!lead) {
            throw new NotFoundException('Lead not found');
        }

        // Validate permissions
        if (lead.assignedToId && lead.assignedToId !== userId) {
            throw new ForbiddenException('You can only update leads assigned to you');
        }

        return await this.prisma.$transaction(async (prisma) => {
            let commentId: number | null = null;
            let crackedLeadData: any = null;
            let teamUpdateData: any = null;

            // Create comment if provided
            if (updateLeadDto.comment) {
                const comment = await prisma.leadComment.create({
                    data: {
                        leadId: id,
                        commentBy: userId,
                        commentText: updateLeadDto.comment
                    }
                });
                commentId = comment.id;
            }

            // Handle outcome update
            if (updateLeadDto.outcome) {
                if (!updateLeadDto.comment) {
                    throw new BadRequestException('Comment is required when updating outcome');
                }

                // Create outcome history
                await prisma.leadOutcomeHistory.create({
                    data: {
                        leadId: id,
                        outcome: updateLeadDto.outcome,
                        changedBy: userId,
                        commentId
                    }
                });

                // Automatic Failed Lead Handling (if outcome = "denied")
                if (updateLeadDto.outcome === 'denied') {
                    // Increment failedCount by 1
                    const newFailedCount = (lead.failedCount || 0) + 1;

                    // Check if failedCount reaches 4 (configurable threshold)
                    if (newFailedCount >= 4) {
                                                // Mark Status as "failed"
                        await prisma.lead.update({
                            where: { id },
                            data: {
                                status: 'failed',
                                failedCount: newFailedCount,
                                closedAt: new Date(),
                                closedById: userId
                            }
                        });

                        // Move the lead to archived_leads table
                        await prisma.archiveLead.create({
                            data: {
                                leadId: id,
                                name: lead.name || '',
                                email: lead.email || '',
                                phone: lead.phone || '',
                                source: (lead.source === 'PPC' ? 'PPC' : 'SMM') as ArchiveLeadSource,
                                assignedTo: lead.assignedToId || 1, // Default to employee ID 1 if null
                                unitId: lead.salesUnitId,
                                outcome: 'denied' as ArchiveLeadOutcome,
                                qualityRating: 'bad' as ArchiveLeadQualityRating,
                                createdAt: new Date() // Add required createdAt field
                            }
                        });
                    } else {
                        // Just update the failed count
                        await prisma.lead.update({
                            where: { id },
                            data: {
                                failedCount: newFailedCount
                            }
                        });
                    }
                }
            }

            // Handle status update
            if (updateLeadDto.status) {
                // Create status history
                await prisma.leadOutcomeHistory.create({
                    data: {
                        leadId: id,
                        outcome: 'STATUS_CHANGE', // Status change, not outcome change
                        changedBy: userId,
                        commentId
                    }
                });

                // Special handling for "cracked" status
                if (updateLeadDto.status === 'cracked' && lead.outcome === 'interested') {
                    // Validate required fields for cracked lead
                    if (!updateLeadDto.industryId || !updateLeadDto.totalAmount || !updateLeadDto.commission) {
                        throw new BadRequestException('industryId, totalAmount, and commission are required when marking lead as cracked');
                    }

                    // Create cracked lead record
                    crackedLeadData = await prisma.crackedLead.create({
                        data: {
                            leadId: id,
                            closedBy: userId,
                            industryId: updateLeadDto.industryId,
                            amount: updateLeadDto.totalAmount,
                            commissionRate: updateLeadDto.commission,
                            description: updateLeadDto.description || '',
                            totalPhases: updateLeadDto.totalPhases || 1,
                            currentPhase: updateLeadDto.currentPhase || 1
                        }
                    });

                    // Update lead with cracked info
                    await prisma.lead.update({
                        where: { id },
                        data: {
                            failedCount: 0,
                            crackedById: userId
                        }
                    });
                }

                                        // Special handling for "completed" status
                        if (updateLeadDto.status === 'completed') {
                            // Automatically change type to upsell
                            await prisma.lead.update({
                                where: { id },
                                data: {
                                    type: 'upsell',
                                    closedAt: new Date(),
                                    closedById: userId
                                }
                            });

                            // Get commission rate from sales department and update cracked lead
                            if (lead.crackedById) {
                                const salesDept = await prisma.salesDepartment.findFirst({
                                    where: { employeeId: lead.crackedById }
                                });

                                if (salesDept?.commissionRate) {
                                    // Update commission rate in cracked_leads table
                                    await prisma.crackedLead.updateMany({
                                        where: { leadId: id },
                                        data: {
                                            commissionRate: salesDept.commissionRate
                                        }
                                    });
                                }

                                // Update team statistics
                                const employee = await prisma.employee.findUnique({
                                    where: { id: lead.crackedById },
                                    include: { teamsAsLead: true }
                                });

                                if (employee?.teamsAsLead?.[0]) {
                                    const teamId = employee.teamsAsLead[0].id;

                                    // Update team statistics
                                    await prisma.team.update({
                                        where: { id: teamId },
                                        data: {
                                            completedLeads: { increment: 1 }
                                        }
                                    });
                                }
                            }
                        }
            }

            // Handle push action
            if (updateLeadDto.action === 'push') {
                if (!updateLeadDto.comment) {
                    throw new BadRequestException('Comment is required when pushing a lead');
                }

                // Create history for push action
                await prisma.leadOutcomeHistory.create({
                    data: {
                        leadId: id,
                        outcome: 'push',
                        changedBy: userId,
                        commentId
                    }
                });
            }

            // Update lead
            const updatedLead = await prisma.lead.update({
                where: { id },
                data: {
                    ...(updateLeadDto.outcome && { outcome: updateLeadDto.outcome }),
                    ...(updateLeadDto.status && { status: updateLeadDto.status }),
                    ...(updateLeadDto.type && { type: updateLeadDto.type }),
                    ...(updateLeadDto.action === 'push' && {
                        type: 'push',
                        status: 'new',
                        assignedToId: null,
                        outcome: null
                    }),
                    updatedAt: new Date()
                },
                include: {
                    assignedTo: { select: { firstName: true, lastName: true } },
                    salesUnit: { select: { name: true } },
                    comments: {
                        include: {
                            employee: { select: { firstName: true, lastName: true } }
                        },
                        orderBy: { createdAt: 'desc' }
                    },
                    outcomeHistory: {
                        include: {
                            changedByUser: { select: { firstName: true, lastName: true } },
                            comment: { select: { commentText: true } }
                        },
                        orderBy: { createdAt: 'desc' }
                    }
                }
            });

            return {
                ...updatedLead,
                crackedLead: crackedLeadData,
                teamUpdate: teamUpdateData
            };
        });
    }

    async markUpsell(id: number, markUpsellDto: MarkUpsellDto, userId: number) {
        const lead = await this.prisma.lead.findUnique({
            where: { id }
        });

        if (!lead) {
            throw new NotFoundException('Lead not found');
        }

        if (lead.status !== 'completed') {
            throw new BadRequestException('Lead must be completed to mark as upsell');
        }

        return await this.prisma.$transaction(async (prisma) => {
            // Create comment
            const comment = await prisma.leadComment.create({
                data: {
                    leadId: id,
                    commentBy: userId,
                    commentText: markUpsellDto.comment
                }
            });

            // Create history
            await prisma.leadOutcomeHistory.create({
                data: {
                    leadId: id,
                    outcome: 'upsell',
                    changedBy: userId,
                    commentId: comment.id
                }
            });

            // Update lead type
            const updatedLead = await prisma.lead.update({
                where: { id },
                data: {
                    type: 'upsell',
                    updatedAt: new Date()
                }
            });

            return {
                ...updatedLead,
                comment: {
                    id: comment.id,
                    commentText: markUpsellDto.comment,
                    commentBy: userId
                },
                outcomeHistory: {
                    outcome: 'upsell',
                    changedBy: userId,
                    commentId: comment.id
                }
            };
        });
    }

    async getCrackedLeads(query: any) {
        const where: any = {};

        if (query.amount) where.amount = { gte: parseFloat(query.amount) };
        if (query.employeeId) where.closedBy = parseInt(query.employeeId);

        const page = parseInt(query.page) || 1;
        const limit = parseInt(query.limit) || 20;
        const skip = (page - 1) * limit;

        const [crackedLeads, total] = await Promise.all([
            this.prisma.crackedLead.findMany({
                where,
                include: {
                    lead: {
                        include: {
                            assignedTo: { select: { firstName: true, lastName: true } },
                            salesUnit: { select: { name: true } }
                        }
                    },
                    employee: { select: { firstName: true, lastName: true } }
                },
                skip,
                take: limit,
                orderBy: { crackedAt: 'desc' }
            }),
            this.prisma.crackedLead.count({ where })
        ]);

        return {
            crackedLeads,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    async updateCrackedLead(id: number, updateCrackedLeadDto: UpdateCrackedLeadDto) {
        const crackedLead = await this.prisma.crackedLead.findUnique({
            where: { id }
        });

        if (!crackedLead) {
            throw new NotFoundException('Cracked lead not found');
        }

        const updatedCrackedLead = await this.prisma.crackedLead.update({
            where: { id },
            data: {
                ...updateCrackedLeadDto,
                updatedAt: new Date()
            },
            include: {
                lead: {
                    include: {
                        assignedTo: { select: { firstName: true, lastName: true } },
                        salesUnit: { select: { name: true } }
                    }
                },
                employee: { select: { firstName: true, lastName: true } }
            }
        });

        return updatedCrackedLead;
    }

    // Additional utility method for bulk operations
    async bulkUpdateLeads(leadIds: number[], updateData: Partial<UpdateLeadDto>, userId: number) {
        const results = await Promise.allSettled(
            leadIds.map(id => this.update(id, updateData, userId))
        );

        const successful = results.filter(result => result.status === 'fulfilled').length;
        const failed = results.filter(result => result.status === 'rejected').length;

        return {
            total: leadIds.length,
            successful,
            failed,
            results: results.map((result, index) => ({
                leadId: leadIds[index],
                status: result.status,
                data: result.status === 'fulfilled' ? result.value : null,
                error: result.status === 'rejected' ? result.reason?.message : null
            }))
        };
    }

    // Method to get lead statistics
    async getLeadStatistics(userRole: string, userUnitId?: number) {
        const where: any = {};
        
        // Apply unit restriction for non-admin users
        if (userUnitId && userRole !== 'admin') {
            where.salesUnitId = userUnitId;
        }

        const [totalLeads, newLeads, inProgressLeads, completedLeads, failedLeads, warmLeads, coldLeads, pushLeads, upsellLeads] = await Promise.all([
            this.prisma.lead.count({ where }),
            this.prisma.lead.count({ where: { ...where, status: 'new' } }),
            this.prisma.lead.count({ where: { ...where, status: 'in_progress' } }),
            this.prisma.lead.count({ where: { ...where, status: 'completed' } }),
            this.prisma.lead.count({ where: { ...where, status: 'failed' } }),
            this.prisma.lead.count({ where: { ...where, type: 'warm' } }),
            this.prisma.lead.count({ where: { ...where, type: 'cold' } }),
            this.prisma.lead.count({ where: { ...where, type: 'push' } }),
            this.prisma.lead.count({ where: { ...where, type: 'upsell' } })
        ]);

        return {
            totalLeads,
            byStatus: {
                new: newLeads,
                inProgress: inProgressLeads,
                completed: completedLeads,
                failed: failedLeads
            },
            byType: {
                warm: warmLeads,
                cold: coldLeads,
                push: pushLeads,
                upsell: upsellLeads
            },
            conversionRate: totalLeads > 0 ? ((completedLeads / totalLeads) * 100).toFixed(2) : '0.00'
        };
    }
}
