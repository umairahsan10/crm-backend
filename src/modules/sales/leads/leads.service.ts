import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { RequestLeadsDto } from './dto/request-leads.dto';
import { MarkUpsellDto } from './dto/mark-upsell.dto';
import { UpdateCrackedLeadDto } from './dto/update-cracked-lead.dto';
import { ArchiveLeadSource, ArchiveLeadOutcome, ArchiveLeadQualityRating } from '@prisma/client';
import { TimeStorageUtil } from '../../../common/utils/time-storage.util';

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

        // Get the maximum ID and increment it
        const maxLead = await this.prisma.lead.findFirst({
            orderBy: { id: 'desc' },
            select: { id: true }
        });

        const nextId = maxLead ? maxLead.id + 1 : 1;

        // Create lead with manual ID assignment
        const lead = await this.prisma.lead.create({
            data: {
                id: nextId,
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

    async getMyLeads(query: any, userId: number, userRole: string) {
        console.log('🔍 ===== GET MY LEADS START =====');
        console.log('🔍 User ID:', userId, '| Role:', userRole);
        console.log('🔍 Query params:', query);

        // Get user's sales department info for proper access control
        const userSalesDept = await this.getUserSalesDepartment(userId);
        console.log('🔍 User sales department info for my leads:', JSON.stringify(userSalesDept, null, 2));

        const where: any = {
            assignedToId: userId // Only leads assigned to the logged-in user
        };
        console.log('🔍 Initial WHERE clause (my leads):', where);

        // Apply basic filters
        if (query.status) {
            where.status = query.status;
            console.log('🔍 Added status filter:', query.status);
        }
        if (query.outcome) {
            where.outcome = query.outcome;
            console.log('🔍 Added outcome filter:', query.outcome);
        }
        if (query.salesUnitId) {
            where.salesUnitId = parseInt(query.salesUnitId);
            console.log('🔍 Added salesUnitId filter:', query.salesUnitId);
        }

        // Search support
        if (query.search) {
            where.OR = [
                { name: { contains: query.search, mode: 'insensitive' } },
                { email: { contains: query.search, mode: 'insensitive' } },
                { phone: { contains: query.search } }
            ];
            console.log('🔍 Added search filter for:', query.search);
        }

        // Apply role-based type filtering
        const typeFilters = this.getRoleTypeFilters(userRole, query.type);
        Object.assign(where, typeFilters);
        console.log('🔍 After type filtering, WHERE clause:', JSON.stringify(where, null, 2));

        // Apply unit restriction for non-admin users
        const { salesUnitId } = userSalesDept || {};
        if (salesUnitId && userRole !== 'admin') {
            where.salesUnitId = salesUnitId;
            console.log('🔍 Added unit restriction for non-admin:', salesUnitId);
        }

        const page = parseInt(query.page) || 1;
        const limit = parseInt(query.limit) || 20;
        const skip = (page - 1) * limit;

        // Flexible sorting
        const sortBy = query.sortBy || 'createdAt';
        const sortOrder = query.sortOrder || 'desc';

        console.log('🔍 Pagination - Page:', page, 'Limit:', limit, 'Skip:', skip);
        console.log('🔍 Sorting - By:', sortBy, 'Order:', sortOrder);
        console.log('🔍 Final WHERE clause for my leads:', JSON.stringify(where, null, 2));

        console.log('🔍 Executing database query for my leads...');
        const [leads, total] = await Promise.all([
            this.prisma.lead.findMany({
                where,
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                    status: true,
                    outcome: true,
                    type: true,
                    createdAt: true,
                    updatedAt: true,
                    assignedTo: { select: { firstName: true, lastName: true } },
                    salesUnit: { select: { name: true } }
                },
                orderBy: { [sortBy]: sortOrder },
                skip,
                take: limit
            }),
            this.prisma.lead.count({ where })
        ]);

        console.log('🔍 ===== MY LEADS QUERY RESULTS =====');
        console.log('🔍 Total my leads found:', total);
        console.log('🔍 My leads returned:', leads.length);
        console.log('🔍 My lead details:');
        leads.forEach((lead, index) => {
            console.log(`🔍   My Lead ${index + 1}:`);
            console.log(`🔍     ID: ${lead.id}`);
            console.log(`🔍     Name: ${lead.name}`);
            console.log(`🔍     Type: ${lead.type}`);
            console.log(`🔍     Status: ${lead.status}`);
            console.log(`🔍     Assigned To: ${lead.assignedTo?.firstName} ${lead.assignedTo?.lastName}`);
            console.log(`🔍     Sales Unit: ${lead.salesUnit?.name}`);
            console.log(`🔍     Created: ${lead.createdAt}`);
        });

        const result = {
            leads,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        };

        console.log('🔍 ===== MY LEADS FINAL RESPONSE =====');
        console.log('🔍 Response pagination:', { total, page, limit, totalPages: result.totalPages });
        console.log('🔍 ===== GET MY LEADS END =====');

        return result;
    }

    async findAll(query: any, userRole: string, userId: number) {
        console.log('🔍 ===== FIND ALL LEADS START =====');
        console.log('🔍 User ID:', userId, '| Role:', userRole);
        console.log('🔍 Query params:', query);

        // Get user's sales department info for proper access control
        const userSalesDept = await this.getUserSalesDepartment(userId);
        console.log('🔍 User sales department info:', JSON.stringify(userSalesDept, null, 2));

        const where: any = {};
        console.log('🔍 Initial WHERE clause:', where);

        // Apply basic filters
        if (query.status) {
            where.status = query.status;
            console.log('🔍 Added status filter:', query.status);
        }
        if (query.salesUnitId) {
            where.salesUnitId = parseInt(query.salesUnitId);
            console.log('🔍 Added salesUnitId filter:', query.salesUnitId);
        }
        if (query.assignedTo) {
            where.assignedToId = parseInt(query.assignedTo);
            console.log('🔍 Added assignedTo filter:', query.assignedTo);
        }

        // Search support
        if (query.search) {
            where.OR = [
                { name: { contains: query.search, mode: 'insensitive' } },
                { email: { contains: query.search, mode: 'insensitive' } },
                { phone: { contains: query.search } }
            ];
            console.log('🔍 Added search filter for:', query.search);
        }

        // Apply role-based type filtering
        const typeFilters = this.getRoleTypeFilters(userRole, query.type);
        Object.assign(where, typeFilters);
        console.log('🔍 After type filtering, WHERE clause:', JSON.stringify(where, null, 2));

        // Apply hierarchical access control
        const hierarchicalFilters = await this.getHierarchicalFilters(userRole, userId, userSalesDept);
        Object.assign(where, hierarchicalFilters);
        console.log('🔍 Final WHERE clause after hierarchical filtering:', JSON.stringify(where, null, 2));

        const page = parseInt(query.page) || 1;
        const limit = parseInt(query.limit) || 20;
        const skip = (page - 1) * limit;

        // Flexible sorting
        const sortBy = query.sortBy || 'createdAt';
        const sortOrder = query.sortOrder || 'desc';

        console.log('🔍 Pagination - Page:', page, 'Limit:', limit, 'Skip:', skip);
        console.log('🔍 Sorting - By:', sortBy, 'Order:', sortOrder);

        console.log('🔍 Executing database query...');
        const [leads, total] = await Promise.all([
            this.prisma.lead.findMany({
                where,
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                    status: true,
                    outcome: true,
                    type: true,
                    createdAt: true,
                    updatedAt: true,
                    assignedTo: { select: { firstName: true, lastName: true } },
                    startedBy: { select: { firstName: true, lastName: true } },
                    salesUnit: { select: { name: true } },
                },
                skip,
                take: limit,
                orderBy: { [sortBy]: sortOrder }
            }),
            this.prisma.lead.count({ where })
        ]);

        console.log('🔍 ===== QUERY RESULTS =====');
        console.log('🔍 Total leads found:', total);
        console.log('🔍 Leads returned:', leads.length);
        console.log('🔍 Lead details:');
        leads.forEach((lead, index) => {
            console.log(`🔍   Lead ${index + 1}:`);
            console.log(`🔍     ID: ${lead.id}`);
            console.log(`🔍     Name: ${lead.name}`);
            console.log(`🔍     Type: ${lead.type}`);
            console.log(`🔍     Status: ${lead.status}`);
            console.log(`🔍     Assigned To: ${lead.assignedTo?.firstName} ${lead.assignedTo?.lastName}`);
            console.log(`🔍     Sales Unit: ${lead.salesUnit?.name}`);
            console.log(`🔍     Created: ${lead.createdAt}`);
        });

        const result = {
            leads,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        };

        console.log('🔍 ===== FINAL RESPONSE =====');
        console.log('🔍 Response pagination:', result.pagination);
        console.log('🔍 ===== FIND ALL LEADS END =====');

        return result;
    }

    async findOne(id: number) {
        const lead = await this.prisma.lead.findUnique({
            where: { id },
            include: {
                assignedTo: { 
                    select: { 
                        id: true,
                        firstName: true, 
                        lastName: true,
                        email: true,
                        phone: true
                    } 
                },
                startedBy: { 
                    select: { 
                        id: true,
                        firstName: true, 
                        lastName: true,
                        email: true,
                        phone: true
                    } 
                },
                crackedBy: { 
                    select: { 
                        id: true,
                        firstName: true, 
                        lastName: true,
                        email: true,
                        phone: true
                    } 
                },
                closedBy: { 
                    select: { 
                        id: true,
                        firstName: true, 
                        lastName: true,
                        email: true,
                        phone: true
                    } 
                },
                salesUnit: { 
                    select: { 
                        id: true,
                        name: true
                    } 
                },
                comments: {
                    include: {
                        employee: { 
                            select: { 
                                id: true,
                                firstName: true, 
                                lastName: true,
                                email: true
                            } 
                        }
                    },
                    orderBy: { createdAt: 'desc' }
                },
                outcomeHistory: {
                    include: {
                        changedByUser: { 
                            select: { 
                                id: true,
                                firstName: true, 
                                lastName: true,
                                email: true
                            } 
                        },
                        comment: { 
                            select: { 
                                id: true,
                                commentText: true,
                                createdAt: true
                            } 
                        }
                    },
                    orderBy: { createdAt: 'desc' }
                },
                crackedLeads: {
                    include: {
                        industry: {
                            select: {
                                id: true,
                                name: true
                            }
                        },
                        employee: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                email: true
                            }
                        }
                    }
                }
            }
        });

        if (!lead) {
            throw new NotFoundException('Lead not found');
        }

        return lead;
    }

    async requestLeads(requestLeadsDto: RequestLeadsDto, userId: number, userRole: string) {
        const { keptLeadIds = [], includePushLeads = false } = requestLeadsDto;
        const employeeId = userId;

        // Validate push leads option based on role using existing role access logic
        if (includePushLeads) {
            const roleAccessMap = {
                'junior': ['warm', 'cold'],
                'senior': ['warm', 'cold', 'push'],
                'dep_manager': ['warm', 'cold', 'push', 'upsell'],
                'team_lead': ['warm', 'cold', 'push', 'upsell'],
                'unit_head': ['warm', 'cold', 'push', 'upsell'],
                'admin': ['warm', 'cold', 'push', 'upsell']
            };
            
            if (!roleAccessMap[userRole] || !roleAccessMap[userRole].includes('push')) {
                throw new BadRequestException('Push leads option is only available for senior and above roles');
            }
        }

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
            // Step 1: Auto-circulate all non-kept leads assigned to this employee
            const allAssignedLeads = await prisma.lead.findMany({
                where: {
                    assignedToId: employeeId,
                    status: { not: 'failed' }
                },
                select: { id: true, outcome: true, status: true }
            });

            // Find leads to circulate (only in_progress leads except kept ones)
            const leadsToCirculate = allAssignedLeads.filter(lead => 
                !keptLeadIds.includes(lead.id) && lead.status === 'in_progress'
            );

            // Validate that leads to circulate have outcomes
            const invalidLeads = leadsToCirculate.filter(lead => 
                lead.outcome === null
            );

            if (invalidLeads.length > 0) {
                throw new BadRequestException(
                    `Cannot circulate leads without outcomes. Invalid lead IDs: ${invalidLeads.map(l => l.id).join(', ')}`
                );
            }

            // Circulate all non-kept leads
            if (leadsToCirculate.length > 0) {
                await prisma.lead.updateMany({
                    where: {
                        id: { in: leadsToCirculate.map(l => l.id) },
                        assignedToId: employeeId
                    },
                    data: {
                        assignedToId: null,
                        startedById: null,
                        status: 'new',
                        outcome: null,
                        updatedAt: TimeStorageUtil.getCurrentTimeForStorage()
                    }
                });
            }

            // Step 2: Assign leads based on includePushLeads option
            let assignedLeads: any[] = [];
            
            if (includePushLeads) {
                // Assign 8 warm/cold leads + 2 push leads = 10 total
                const warmColdLeads = await prisma.lead.findMany({
                    where: {
                        assignedToId: null,
                        status: 'new',
                        salesUnitId,
                        type: { in: ['warm', 'cold'] }
                    },
                    orderBy: [
                        { type: 'asc' }, // warm comes before cold
                        { updatedAt: 'asc' } // oldest first
                    ],
                    take: 8
                });

                const pushLeads = await prisma.lead.findMany({
                    where: {
                        assignedToId: null,
                        status: 'new',
                        salesUnitId,
                        type: 'push'
                    },
                    orderBy: { updatedAt: 'asc' }, // oldest first
                    take: 2
                });

                const allAvailableLeads = [...warmColdLeads, ...pushLeads];
                
                if (allAvailableLeads.length < 10) {
                    throw new NotFoundException(`Insufficient leads available. Need 10, only ${allAvailableLeads.length} available (${warmColdLeads.length} warm/cold + ${pushLeads.length} push).`);
                }

                // Assign all available leads
                assignedLeads = await Promise.all(
                    allAvailableLeads.map(lead =>
                        prisma.lead.update({
                            where: { id: lead.id },
                            data: {
                                assignedToId: employeeId,
                                startedById: employeeId,
                                status: 'in_progress',
                                updatedAt: TimeStorageUtil.getCurrentTimeForStorage()
                            },
                            include: {
                                assignedTo: { select: { firstName: true, lastName: true } },
                                salesUnit: { select: { name: true } }
                            }
                        })
                    )
                );
            } else {
                // Original logic: Assign exactly 10 warm/cold leads
                const availableLeads = await prisma.lead.findMany({
                    where: {
                        assignedToId: null,
                        status: 'new',
                        salesUnitId,
                        type: { in: ['warm', 'cold'] }
                    },
                    orderBy: [
                        { type: 'asc' }, // warm comes before cold
                        { updatedAt: 'asc' } // oldest first
                    ],
                    take: 10
                });

                if (availableLeads.length < 10) {
                    throw new NotFoundException(`Insufficient leads available. Need 10, only ${availableLeads.length} available.`);
                }

                // Assign exactly 10 new leads
                assignedLeads = await Promise.all(
                    availableLeads.map(lead =>
                        prisma.lead.update({
                            where: { id: lead.id },
                            data: {
                                assignedToId: employeeId,
                                startedById: employeeId,
                                status: 'in_progress',
                                updatedAt: TimeStorageUtil.getCurrentTimeForStorage()
                            },
                            include: {
                                assignedTo: { select: { firstName: true, lastName: true } },
                                salesUnit: { select: { name: true } }
                            }
                        })
                    )
                );
            }

            // Get kept leads
            const keptLeads = await prisma.lead.findMany({
                where: { id: { in: keptLeadIds } },
                include: {
                    assignedTo: { select: { firstName: true, lastName: true } },
                    salesUnit: { select: { name: true } }
                }
            });

            // Count lead types in assigned leads
            const warmColdCount = assignedLeads.filter(lead => ['warm', 'cold'].includes(lead.type)).length;
            const pushCount = assignedLeads.filter(lead => lead.type === 'push').length;

            return {
                assignedLeads,
                keptLeads,
                totalActiveLeads: keptLeads.length + assignedLeads.length,
                circulatedLeads: leadsToCirculate.length,
                leadBreakdown: {
                    warmColdLeads: warmColdCount,
                    pushLeads: pushCount,
                    totalAssigned: assignedLeads.length
                },
                includePushLeads
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
            let isLeadArchived = false;

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

                // Check if lead is in progress before setting outcome to interested
                if (updateLeadDto.outcome === 'interested' && lead.status !== 'in_progress') {
                    throw new BadRequestException('Lead must be in progress before it can be marked as interested');
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
                    console.log('🔍 Lead denied - current failedCount:', lead.failedCount);
                    
                    // Increment failedCount by 1
                    const newFailedCount = (lead.failedCount || 0) + 1;
                    console.log('🔍 New failedCount will be:', newFailedCount);

                    // Check if failedCount reaches 4 (configurable threshold)
                    if (newFailedCount >= 4) {
                        console.log('🔍 Lead reached 4 denials - marking as failed and archiving');
                        
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
                        console.log('🔍 Lead marked as failed successfully');

                        // Move the lead to archived_leads table
                        // TODO: Future reversibility feature - when implemented, this archived lead can be reversed back to active status
                        // The original lead record remains in the leads table with status 'failed' for data preservation
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
                                createdAt: TimeStorageUtil.getCurrentTimeForStorage() // Add required createdAt field
                            }
                        });
                        console.log('🔍 Lead moved to archived_leads successfully');

                        // Mark that lead has been archived
                        isLeadArchived = true;
                        console.log('🔍 Lead archived flag set to true');
                    } else {
                        console.log('🔍 Lead denied but not yet at threshold - updating failed count only');
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

            // If lead was archived, return early with success message
            if (isLeadArchived) {
                console.log('🔍 Returning early due to lead being archived');
                return {
                    message: 'Lead moved to Archived lead',
                    leadId: id,
                    status: 'failed',
                    archived: true
                };
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

                // Ensure lead has proper ownership when status is set to in_progress
                if (updateLeadDto.status === 'in_progress') {
                    // Set startedById and assignedToId to current user if not already set
                    if (!lead.startedById) {
                        await prisma.lead.update({
                            where: { id },
                            data: { startedById: userId }
                        });
                    }
                    if (!lead.assignedToId) {
                        await prisma.lead.update({
                            where: { id },
                            data: { assignedToId: userId }
                        });
                    }
                }

                // Special handling for "cracked" status
                if (updateLeadDto.status === 'cracked') {
                    // Validate that lead must have "interested" outcome to be cracked
                    if (lead.outcome !== 'interested') {
                        throw new BadRequestException('Lead must have "interested" outcome before it can be marked as cracked');
                    }
                    
                    // Validate that lead must have startedBy and assignedTo set to the current user
                    if (!lead.startedById || lead.startedById !== userId) {
                        throw new BadRequestException('Lead must be started by the current user before it can be marked as cracked');
                    }
                    
                    if (!lead.assignedToId || lead.assignedToId !== userId) {
                        throw new BadRequestException('Lead must be assigned to the current user before it can be marked as cracked');
                    }
                    
                    // Validate required fields for cracked lead
                    if (!updateLeadDto.industryId) {
                        throw new BadRequestException('industryId is required when marking lead as cracked');
                    }
                    if (!updateLeadDto.totalAmount) {
                        throw new BadRequestException('totalAmount is required when marking lead as cracked');
                    }
                    if (!userId) {
                        throw new BadRequestException('closedById (current user) is required when marking lead as cracked');
                    }

                    // Validate industry exists
                    const industry = await prisma.industry.findUnique({
                        where: { id: updateLeadDto.industryId }
                    });
                    if (!industry) {
                        throw new BadRequestException('Industry with the provided industryId does not exist');
                    }

                    // Automatically fetch commission rate from sales department
                    const salesDept = await prisma.salesDepartment.findFirst({
                        where: { employeeId: userId }
                    });

                    if (!salesDept?.commissionRate) {
                        throw new BadRequestException('Commission rate not found for the current user in sales department');
                    }

                    const commissionRate = Number(salesDept.commissionRate);

                    // Create cracked lead record
                    crackedLeadData = await prisma.crackedLead.create({
                        data: {
                            leadId: id,
                            closedBy: userId,
                            industryId: updateLeadDto.industryId,
                            amount: updateLeadDto.totalAmount, 
                            remainingAmount: updateLeadDto.totalAmount,
                            commissionRate: commissionRate,
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
                    // Validate that lead has required fields for completion
                    if (!lead.crackedById) {
                        throw new BadRequestException('Lead must be cracked before it can be marked as completed');
                    }
                    if (!lead.assignedToId) {
                        throw new BadRequestException('Lead must be assigned to an employee before it can be marked as completed');
                    }
                    if (!lead.startedById) {
                        throw new BadRequestException('Lead must have a started by employee before it can be marked as completed');
                    }

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
                    updatedAt: TimeStorageUtil.getCurrentTimeForStorage()
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

    async getCrackedLeads(query: any, userRole: string, userId: number) {
        console.log('🔍 ===== GET CRACKED LEADS START =====');
        console.log('🔍 User ID:', userId, '| Role:', userRole);
        console.log('🔍 Query params:', query);

        // Get user's sales department info for proper access control
        const userSalesDept = await this.getUserSalesDepartment(userId);
        console.log('🔍 User sales department info:', JSON.stringify(userSalesDept, null, 2));

        const where: any = {};
        console.log('🔍 Initial WHERE clause:', where);

        // Apply basic filters
        if (query.status) {
            where.lead = { ...where.lead, status: query.status };
            console.log('🔍 Added status filter:', query.status);
        }
        if (query.outcome) {
            where.lead = { ...where.lead, outcome: query.outcome };
            console.log('🔍 Added outcome filter:', query.outcome);
        }
        if (query.salesUnitId) {
            where.lead = { ...where.lead, salesUnitId: parseInt(query.salesUnitId) };
            console.log('🔍 Added salesUnitId filter:', query.salesUnitId);
        }
        if (query.assignedTo) {
            where.lead = { ...where.lead, assignedToId: parseInt(query.assignedTo) };
            console.log('🔍 Added assignedTo filter:', query.assignedTo);
        }

        // Search support
        if (query.search) {
            where.lead = {
                ...where.lead,
                OR: [
                    { name: { contains: query.search, mode: 'insensitive' } },
                    { email: { contains: query.search, mode: 'insensitive' } },
                    { phone: { contains: query.search } }
                ]
            };
            console.log('🔍 Added search filter for:', query.search);
        }

        // Cracked lead specific filters
        if (query.industryId) {
            where.industryId = parseInt(query.industryId);
            console.log('🔍 Added industryId filter:', query.industryId);
        }
        if (query.minAmount) {
            where.amount = { ...where.amount, gte: parseFloat(query.minAmount) };
            console.log('🔍 Added minAmount filter:', query.minAmount);
        }
        if (query.maxAmount) {
            where.amount = { ...where.amount, lte: parseFloat(query.maxAmount) };
            console.log('🔍 Added maxAmount filter:', query.maxAmount);
        }
        if (query.closedBy) {
            where.closedBy = parseInt(query.closedBy);
            console.log('🔍 Added closedBy filter:', query.closedBy);
        }
        if (query.currentPhase) {
            where.currentPhase = parseInt(query.currentPhase);
            console.log('🔍 Added currentPhase filter:', query.currentPhase);
        }
        if (query.totalPhases) {
            where.totalPhases = parseInt(query.totalPhases);
            console.log('🔍 Added totalPhases filter:', query.totalPhases);
        }

        // Apply hierarchical access control
        const hierarchicalFilters = await this.getHierarchicalFilters(userRole, userId, userSalesDept);
        if (Object.keys(hierarchicalFilters).length > 0) {
            where.lead = { ...where.lead, ...hierarchicalFilters };
            console.log('🔍 Applied hierarchical filters to lead:', hierarchicalFilters);
        }

        const page = parseInt(query.page) || 1;
        const limit = parseInt(query.limit) || 20;
        const skip = (page - 1) * limit;

        // Flexible sorting
        const sortBy = query.sortBy || 'crackedAt';
        const sortOrder = query.sortOrder || 'desc';

        console.log('🔍 Pagination - Page:', page, 'Limit:', limit, 'Skip:', skip);
        console.log('🔍 Sorting - By:', sortBy, 'Order:', sortOrder);
        console.log('🔍 Final WHERE clause for cracked leads:', JSON.stringify(where, null, 2));

        console.log('🔍 Executing database query for cracked leads...');
        const [crackedLeads, total] = await Promise.all([
            this.prisma.crackedLead.findMany({
                where,
                include: {
                    lead: {
                        include: {
                            assignedTo: { select: { firstName: true, lastName: true } },
                            startedBy: { select: { firstName: true, lastName: true } },
                            salesUnit: { select: { name: true } },
                        }
                    },
                    employee: { 
                        select: { 
                            id: true,
                            firstName: true, 
                            lastName: true,
                            email: true
                        } 
                    },
                    industry: {
                        select: {
                            id: true,
                            name: true
                        }
                    }
                },
                skip,
                take: limit,
                orderBy: { [sortBy]: sortOrder }
            }),
            this.prisma.crackedLead.count({ where })
        ]);

        console.log('🔍 ===== CRACKED LEADS QUERY RESULTS =====');
        console.log('🔍 Total cracked leads found:', total);
        console.log('🔍 Cracked leads returned:', crackedLeads.length);

        const result = {
            crackedLeads,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        };

        console.log('🔍 ===== FINAL RESPONSE =====');
        console.log('🔍 Response pagination:', result.pagination);
        console.log('🔍 ===== GET CRACKED LEADS END =====');

        return result;
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

        // Get today's date range
        const today = new Date();
        const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

        const [
            totalLeads, 
            newLeads, 
            inProgressLeads, 
            completedLeads, 
            failedLeads, 
            warmLeads, 
            coldLeads, 
            pushLeads, 
            upsellLeads,
            // Today's activity
            todayNew,
            todayCompleted,
            todayInProgress
        ] = await Promise.all([
            this.prisma.lead.count({ where }),
            this.prisma.lead.count({ where: { ...where, status: 'new' } }),
            this.prisma.lead.count({ where: { ...where, status: 'in_progress' } }),
            this.prisma.lead.count({ where: { ...where, status: 'completed' } }),
            this.prisma.lead.count({ where: { ...where, status: 'failed' } }),
            this.prisma.lead.count({ where: { ...where, type: 'warm' } }),
            this.prisma.lead.count({ where: { ...where, type: 'cold' } }),
            this.prisma.lead.count({ where: { ...where, type: 'push' } }),
            this.prisma.lead.count({ where: { ...where, type: 'upsell' } }),
            // Today's activity
            this.prisma.lead.count({ 
                where: { 
                    ...where, 
                    status: 'new',
                    createdAt: {
                        gte: startOfToday,
                        lt: endOfToday
                    }
                } 
            }),
            this.prisma.lead.count({ 
                where: { 
                    ...where, 
                    status: 'completed',
                    updatedAt: {
                        gte: startOfToday,
                        lt: endOfToday
                    }
                } 
            }),
            this.prisma.lead.count({ 
                where: { 
                    ...where, 
                    status: 'in_progress',
                    updatedAt: {
                        gte: startOfToday,
                        lt: endOfToday
                    }
                } 
            })
        ]);

        // Calculate derived metrics
        const activeLeads = newLeads + inProgressLeads;
        const conversionRate = totalLeads > 0 ? ((completedLeads / totalLeads) * 100).toFixed(2) : '0.00';
        const completionRate = totalLeads > 0 ? ((completedLeads / totalLeads) * 100).toFixed(2) : '0.00';

        return {
            // Basic counts
            totalLeads,
            activeLeads,
            completedLeads,
            failedLeads,
            
            // Key performance
            conversionRate: `${conversionRate}%`,
            completionRate: `${completionRate}%`,
            
            // Current status breakdown
            byStatus: {
                new: newLeads,
                inProgress: inProgressLeads,
                completed: completedLeads,
                failed: failedLeads
            },
            
            // Lead types
            byType: {
                warm: warmLeads,
                cold: coldLeads,
                push: pushLeads,
                upsell: upsellLeads
            },
            
            // Today's activity
            today: {
                new: todayNew,
                completed: todayCompleted,
                inProgress: todayInProgress
            }
        };
    }

    // Helper method to get user's sales department info
    private async getUserSalesDepartment(userId: number) {
        console.log('🔍 Getting sales department info for user ID:', userId);
        
        const userSalesDept = await this.prisma.salesDepartment.findFirst({
            where: { employeeId: userId },
            include: { 
                salesUnit: { 
                    select: { 
                        id: true, 
                        headId: true,
                        teams: { 
                            select: { 
                                id: true, 
                                teamLeadId: true 
                            } 
                        }
                    }
                }
            }
        });

        if (userSalesDept) {
            console.log('🔍 Found sales department record:');
            console.log('🔍   Sales Unit ID:', userSalesDept.salesUnitId);
            console.log('🔍   Sales Unit Name:', userSalesDept.salesUnit?.id);
            console.log('🔍   Unit Head ID:', userSalesDept.salesUnit?.headId);
            console.log('🔍   Teams in unit:', userSalesDept.salesUnit?.teams?.length || 0);
            userSalesDept.salesUnit?.teams?.forEach((team, index) => {
                console.log(`🔍     Team ${index + 1}: ID=${team.id}, Lead=${team.teamLeadId}`);
            });
        } else {
            console.log('🔍 ❌ No sales department record found for user ID:', userId);
        }

        return userSalesDept;
    }

    // Helper method to get role-based type filters
    private getRoleTypeFilters(userRole: string, explicitType?: string) {
        console.log('🔍 ===== TYPE FILTERING =====');
        console.log('🔍 User role:', userRole, '| Explicit type:', explicitType);
        
        if (explicitType) {
            console.log('🔍 Using explicit type filter:', explicitType);
            return { type: explicitType };
        }

        const roleAccessMap = {
            'junior': ['warm', 'cold'],
            'senior': ['warm', 'cold', 'push'],
            'dep_manager': ['warm', 'cold', 'push', 'upsell'],
            'team_lead': ['warm', 'cold', 'push', 'upsell'],
            'unit_head': ['warm', 'cold', 'push', 'upsell'],
            'admin': ['warm', 'cold', 'push', 'upsell']
        };

        if (roleAccessMap[userRole]) {
            console.log('🔍 ✅', userRole, 'role - can see lead types:', roleAccessMap[userRole]);
            return { type: { in: roleAccessMap[userRole] } };
        } else {
            // Default fallback - restrict to warm and cold for unknown roles
            console.log('🔍 ⚠️ Unknown role:', userRole, '- restricted to warm/cold leads');
            return { type: { in: ['warm', 'cold'] } };
        }
    }

    // Helper method to get hierarchical access control filters
    private async getHierarchicalFilters(userRole: string, userId: number, userSalesDept: any) {
        console.log('🔍 ===== HIERARCHICAL FILTERING =====');
        const { salesUnitId, salesUnit } = userSalesDept || {};
        
        console.log('🔍 User role:', userRole);
        console.log('🔍 User ID:', userId);
        console.log('🔍 Sales Unit ID:', salesUnitId);
        console.log('🔍 Sales Unit Head ID:', salesUnit?.headId);
        console.log('🔍 Teams in unit:', salesUnit?.teams?.length || 0);

        switch(userRole) {
            case 'dep_manager':
                console.log('🔍 ✅ dep_manager - NO RESTRICTIONS');
                console.log('🔍   → Can see all leads from all units');
                return {}; // No restrictions - all units, all leads
                
            case 'unit_head':
                console.log('🔍 ✅ unit_head - UNIT RESTRICTION');
                console.log('🔍   → Can see all leads from unit ID:', salesUnitId);
                return { salesUnitId }; // Only their unit
                
            case 'team_lead':
                console.log('🔍 ✅ team_lead - TEAM RESTRICTION');
                console.log('🔍   → Can see leads from unit ID:', salesUnitId);
                console.log('🔍   → Can see leads assigned to team members of user ID:', userId);
                
                // Get all team members for this team lead
                console.log('🔍   → Querying team members for team lead ID:', userId);
                const teamMembers = await this.prisma.employee.findMany({
                    where: { teamLeadId: userId },
                    select: { id: true, firstName: true, lastName: true }
                });
                
                const teamMemberIds = teamMembers.map(member => member.id);
                console.log('🔍   → Found team members:', teamMembers.length);
                console.log('🔍   → Team member details:', teamMembers.map(m => `${m.id}: ${m.firstName} ${m.lastName}`));
                console.log('🔍   → Team member IDs for filtering:', teamMemberIds);
                
                // If team lead has no team members, they can only see their own leads
                if (teamMemberIds.length === 0) {
                    console.log('🔍   → No team members found - team lead can only see their own leads');
                    return { 
                        salesUnitId,
                        assignedToId: userId // Only their own leads
                    };
                }
                
                // Include the team lead themselves in the list
                const allMemberIds = [...teamMemberIds, userId];
                console.log('🔍   → Final member IDs (including team lead):', allMemberIds);
                
                return { 
                    salesUnitId,
                    assignedToId: { in: allMemberIds } // Team members + team lead
                };
                
            case 'senior':
                console.log('🔍 ✅ senior - ASSIGNMENT RESTRICTION');
                console.log('🔍   → Can see leads from unit ID:', salesUnitId);
                console.log('🔍   → Can see leads assigned to user ID:', userId);
                return { 
                    salesUnitId,
                    assignedToId: userId // Only assigned to them
                };
                
            case 'junior':
                console.log('🔍 ✅ junior - ASSIGNMENT RESTRICTION');
                console.log('🔍   → Can see leads from unit ID:', salesUnitId);
                console.log('🔍   → Can see leads assigned to user ID:', userId);
                return { 
                    salesUnitId,
                    assignedToId: userId // Only assigned to them
                };
                
            case 'admin':
                console.log('🔍 ✅ admin - NO RESTRICTIONS');
                console.log('🔍   → Can see all leads from all units');
                return {}; // No restrictions for admin
                
            default:
                console.log('🔍 ⚠️ Unknown role - DEFAULTING TO ASSIGNED LEADS');
                console.log('🔍   → Can see leads from unit ID:', salesUnitId);
                console.log('🔍   → Can see leads assigned to user ID:', userId);
                return { 
                    salesUnitId,
                    assignedToId: userId 
                };
        }
    }

    // Get sales units for filter dropdown
    async getSalesUnitsForFilter(userRole?: string) {
        console.log('🔍 Getting sales units for filter dropdown, userRole:', userRole);
        
        const salesUnits = await this.prisma.salesUnit.findMany({
            select: {
                id: true,
                name: true,
                email: true
            },
            orderBy: {
                name: 'asc'
            }
        });

        console.log('🔍 Found sales units:', salesUnits.length);
        
        return {
            success: true,
            data: salesUnits,
            total: salesUnits.length
        };
    }

    // Get employees for filter dropdown
    async getEmployeesForFilter(salesUnitId?: number, userRole?: string) {
        console.log('🔍 Getting employees for filter dropdown, salesUnitId:', salesUnitId, 'userRole:', userRole);
        
        const where: any = {
            status: 'active'
        };

        // For marketing managers, show all employees (sales + marketing)
        if (userRole === 'marketing_manager') {
            where.department = {
                name: { in: ['Sales', 'Marketing'] }
            };
            console.log('🔍 Marketing manager - showing Sales and Marketing employees');
        } else {
            // For sales employees, show only sales employees
            where.department = {
                name: 'Sales'
            };
            console.log('🔍 Sales employee - showing only Sales employees');
        }

        // If salesUnitId is provided, filter by sales unit (only for sales employees)
        if (salesUnitId && userRole !== 'marketing_manager') {
            where.salesDepartment = {
                some: {
                    salesUnitId: salesUnitId
                }
            };
            console.log('🔍 Filtering by sales unit:', salesUnitId);
        }

        const employees = await this.prisma.employee.findMany({
            where,
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                department: {
                    select: {
                        name: true
                    }
                },
                salesDepartment: {
                    select: {
                        salesUnit: {
                            select: {
                                id: true,
                                name: true
                            }
                        }
                    }
                }
            },
            orderBy: [
                { firstName: 'asc' },
                { lastName: 'asc' }
            ]
        });

        // Format the response
        const formattedEmployees = employees.map(emp => ({
            id: emp.id,
            firstName: emp.firstName,
            lastName: emp.lastName,
            fullName: `${emp.firstName} ${emp.lastName}`,
            email: emp.email,
            department: emp.department.name,
            salesUnit: emp.salesDepartment?.[0]?.salesUnit || null
        }));

        console.log('🔍 Found employees:', formattedEmployees.length);
        console.log('🔍 Employee breakdown:', {
            sales: formattedEmployees.filter(e => e.department === 'Sales').length,
            marketing: formattedEmployees.filter(e => e.department === 'Marketing').length
        });
        
        return {
            success: true,
            data: formattedEmployees,
            total: formattedEmployees.length
        };
    }

    // Archived Leads Methods
    async getArchivedLeads(query: any, userRole: string, userId: number) {
        console.log('🔍 ===== GET ARCHIVED LEADS START =====');
        console.log('🔍 User ID:', userId, '| Role:', userRole);
        console.log('🔍 Query params:', query);

        // Access control: Only admin, dep_manager, unit_head can access archived leads
        const allowedRoles = ['admin', 'dep_manager', 'unit_head'];
        if (!allowedRoles.includes(userRole)) {
            throw new ForbiddenException('Access denied. Only admin, department manager, and unit head can access archived leads.');
        }

        // Get user's sales department info for proper access control
        const userSalesDept = await this.getUserSalesDepartment(userId);
        console.log('🔍 User sales department info for archived leads:', JSON.stringify(userSalesDept, null, 2));

        const where: any = {};
        console.log('🔍 Initial WHERE clause for archived leads:', where);

        // Apply basic filters
        if (query.source) {
            where.source = query.source;
            console.log('🔍 Added source filter:', query.source);
        }
        if (query.outcome) {
            where.outcome = query.outcome;
            console.log('🔍 Added outcome filter:', query.outcome);
        }
        if (query.qualityRating) {
            where.qualityRating = query.qualityRating;
            console.log('🔍 Added qualityRating filter:', query.qualityRating);
        }
        if (query.assignedTo) {
            where.assignedTo = parseInt(query.assignedTo);
            console.log('🔍 Added assignedTo filter:', query.assignedTo);
        }
        if (query.unitId) {
            where.unitId = parseInt(query.unitId);
            console.log('🔍 Added unitId filter:', query.unitId);
        }

        // Search support
        if (query.search) {
            where.OR = [
                { name: { contains: query.search, mode: 'insensitive' } },
                { email: { contains: query.search, mode: 'insensitive' } },
                { phone: { contains: query.search } }
            ];
            console.log('🔍 Added search filter for:', query.search);
        }

        // Date range filters
        if (query.archivedFrom) {
            where.archivedOn = { ...where.archivedOn, gte: new Date(query.archivedFrom) };
            console.log('🔍 Added archivedFrom filter:', query.archivedFrom);
        }
        if (query.archivedTo) {
            where.archivedOn = { ...where.archivedOn, lte: new Date(query.archivedTo) };
            console.log('🔍 Added archivedTo filter:', query.archivedTo);
        }

        // Apply hierarchical access control
        const hierarchicalFilters = await this.getHierarchicalFilters(userRole, userId, userSalesDept);
        if (Object.keys(hierarchicalFilters).length > 0) {
            // For archived leads, we need to map the hierarchical filters to the archive table structure
            if (hierarchicalFilters.salesUnitId) {
                where.unitId = hierarchicalFilters.salesUnitId;
                console.log('🔍 Applied unit restriction for archived leads:', hierarchicalFilters.salesUnitId);
            }
            if (hierarchicalFilters.assignedToId) {
                where.assignedTo = hierarchicalFilters.assignedToId;
                console.log('🔍 Applied assignedTo restriction for archived leads:', hierarchicalFilters.assignedToId);
            }
        }

        const page = parseInt(query.page) || 1;
        const limit = parseInt(query.limit) || 20;
        const skip = (page - 1) * limit;

        // Flexible sorting
        const sortBy = query.sortBy || 'archivedOn';
        const sortOrder = query.sortOrder || 'desc';

        console.log('🔍 Pagination - Page:', page, 'Limit:', limit, 'Skip:', skip);
        console.log('🔍 Sorting - By:', sortBy, 'Order:', sortOrder);
        console.log('🔍 Final WHERE clause for archived leads:', JSON.stringify(where, null, 2));

        console.log('🔍 Executing database query for archived leads...');
        const [archivedLeads, total] = await Promise.all([
            this.prisma.archiveLead.findMany({
                where,
                select: {
                    id: true,
                    leadId: true,
                    name: true,
                    email: true,
                    phone: true,
                    source: true,
                    outcome: true,
                    qualityRating: true,
                    createdAt: true,
                    archivedOn: true,
                    assignedTo: true,
                    unitId: true,
                    employee: { 
                        select: { 
                            id: true,
                            firstName: true, 
                            lastName: true,
                            email: true
                        } 
                    },
                    unit: { 
                        select: { 
                            id: true,
                            name: true
                        } 
                    }
                },
                orderBy: { [sortBy]: sortOrder },
                skip,
                take: limit
            }),
            this.prisma.archiveLead.count({ where })
        ]);

        console.log('🔍 ===== ARCHIVED LEADS QUERY RESULTS =====');
        console.log('🔍 Total archived leads found:', total);
        console.log('🔍 Archived leads returned:', archivedLeads.length);

        const result = {
            archivedLeads,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        };

        console.log('🔍 ===== FINAL RESPONSE =====');
        console.log('🔍 Response pagination:', result.pagination);
        console.log('🔍 ===== GET ARCHIVED LEADS END =====');

        return result;
    }

    async getArchivedLead(id: number, userRole: string, userId: number) {
        console.log('🔍 ===== GET ARCHIVED LEAD START =====');
        console.log('🔍 Archived Lead ID:', id, '| User ID:', userId, '| Role:', userRole);

        // Access control: Only admin, dep_manager, unit_head can access archived leads
        const allowedRoles = ['admin', 'dep_manager', 'unit_head'];
        if (!allowedRoles.includes(userRole)) {
            throw new ForbiddenException('Access denied. Only admin, department manager, and unit head can access archived leads.');
        }

        // Get user's sales department info for proper access control
        const userSalesDept = await this.getUserSalesDepartment(userId);
        console.log('🔍 User sales department info:', JSON.stringify(userSalesDept, null, 2));

        const archivedLead = await this.prisma.archiveLead.findUnique({
            where: { id },
            include: {
                employee: { 
                    select: { 
                        id: true,
                        firstName: true, 
                        lastName: true,
                        email: true,
                        phone: true
                    } 
                },
                unit: { 
                    select: { 
                        id: true,
                        name: true,
                        email: true
                    } 
                }
            }
        });

        if (!archivedLead) {
            throw new NotFoundException('Archived lead not found');
        }

        // Apply hierarchical access control
        const hierarchicalFilters = await this.getHierarchicalFilters(userRole, userId, userSalesDept);
        
        // Check if user has access to this archived lead
        if (userRole === 'unit_head') {
            if (archivedLead.unitId !== userSalesDept?.salesUnitId) {
                throw new ForbiddenException('You can only access archived leads from your own unit');
            }
        } else if (userRole === 'dep_manager') {
            // Department managers can access all archived leads
            // No additional restrictions needed
        } else if (userRole === 'admin') {
            // Admins can access all archived leads
            // No additional restrictions needed
        }

        console.log('🔍 ===== GET ARCHIVED LEAD END =====');
        return archivedLead;
    }

    // TODO: Future implementation - Reversibility feature
    // This method will allow reversing archived leads back to active leads
    // When implemented, it should:
    // 1. Create a new lead record with the archived lead data
    // 2. Set the lead status to 'new'
    // 3. Reset failedCount to 0
    // 4. Optionally delete the archived lead record or mark it as reversed
    // 5. Log the reversal action for audit purposes
    async reverseArchivedLead(archivedLeadId: number, userId: number, userRole: string) {
        // Implementation placeholder for future reversibility feature
        throw new BadRequestException('Lead reversibility feature is not yet implemented. This feature will allow reversing archived leads back to active leads.');
    }
}