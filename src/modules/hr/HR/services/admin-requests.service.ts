import { Injectable, Logger, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../../../prisma/prisma.service';
import {
    CreateAdminRequestDto,
    UpdateAdminRequestDto,
    UpdateAdminRequestStatusDto,
    AdminRequestResponseDto,
    AdminRequestListResponseDto,
    AdminRequestStatus
} from '../dto/admin-requests.dto';

@Injectable()
export class AdminRequestsService {
    private readonly logger = new Logger(AdminRequestsService.name);

    constructor(private readonly prisma: PrismaService) { }

    /**
     * Create a new admin request (HR only)
     */
    async createAdminRequest(dto: CreateAdminRequestDto, hrEmployeeId: number): Promise<AdminRequestResponseDto> {
        // Validate HR employee exists
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

        // Validate HR log if provided
        if (dto.hrLogId) {
            const hrLog = await this.prisma.hRLog.findUnique({
                where: { id: dto.hrLogId },
            });

            if (!hrLog) {
                throw new NotFoundException(`HR Log with ID ${dto.hrLogId} not found`);
            }
        }

        try {
            const adminRequest = await this.prisma.adminRequest.create({
                data: {
                    hrId: hrRecord.id,
                    hrLogId: dto.hrLogId,
                    description: dto.description,
                    type: dto.type,
                    status: AdminRequestStatus.pending, // Default status
                },
                include: {
                    hr: {
                        select: {
                            id: true,
                            employeeId: true,
                        },
                    },
                    hrLog: {
                        select: {
                            id: true,
                            hrId: true,
                            actionType: true,
                            affectedEmployeeId: true,
                            description: true,
                            createdAt: true,
                        },
                    },
                },
            });

            this.logger.log(`Admin request created by HR employee ${hrEmployeeId}: ${adminRequest.id}`);
            return adminRequest;
        } catch (error) {
            this.logger.error(`Failed to create admin request: ${error.message}`);
            throw new BadRequestException(`Failed to create admin request: ${error.message}`);
        }
    }

    /**
     * Get all admin requests 
     */
    async getAllAdminRequests(): Promise<AdminRequestListResponseDto> {
        try {
            const adminRequests = await this.prisma.adminRequest.findMany({
                include: {
                    hr: {
                        select: {
                            id: true,
                            employeeId: true,
                        },
                    },
                    hrLog: {
                        select: {
                            id: true,
                            hrId: true,
                            actionType: true,
                            affectedEmployeeId: true,
                            description: true,
                            createdAt: true,
                        },
                    },
                },
                orderBy: {
                    createdAt: 'desc',
                },
            });

            const total = await this.prisma.adminRequest.count();

            return {
                adminRequests,
                total,
            };
        } catch (error) {
            this.logger.error(`Failed to get admin requests: ${error.message}`);
            throw new BadRequestException(`Failed to get admin requests: ${error.message}`);
        }
    }

    /**
     * Get admin requests by status (Admin only)
     */
    async getAdminRequestsByStatus(status: string): Promise<AdminRequestListResponseDto> {
        try {
            // Validate status
            if (!Object.values(AdminRequestStatus).includes(status as AdminRequestStatus)) {
                throw new BadRequestException(`Invalid status: ${status}. Valid statuses are: ${Object.values(AdminRequestStatus).join(', ')}`);
            }

            const adminRequests = await this.prisma.adminRequest.findMany({
                where: {
                    status: status as AdminRequestStatus,
                },
                include: {
                    hr: {
                        select: {
                            id: true,
                            employeeId: true,
                        },
                    },
                    hrLog: {
                        select: {
                            id: true,
                            hrId: true,
                            actionType: true,
                            affectedEmployeeId: true,
                            description: true,
                            createdAt: true,
                        },
                    },
                },
                orderBy: {
                    createdAt: 'desc',
                },
            });

            const total = await this.prisma.adminRequest.count({
                where: {
                    status: status as AdminRequestStatus,
                },
            });

            return {
                adminRequests,
                total,
            };
        } catch (error) {
            if (error instanceof BadRequestException) {
                throw error;
            }
            this.logger.error(`Failed to get admin requests by status ${status}: ${error.message}`);
            throw new BadRequestException(`Failed to get admin requests by status: ${error.message}`);
        }
    }

    /**
     * Get admin request by ID
     */
    async getAdminRequestById(id: number): Promise<AdminRequestResponseDto> {
        try {
            const adminRequest = await this.prisma.adminRequest.findUnique({
                where: { id },
                include: {
                    hr: {
                        select: {
                            id: true,
                            employeeId: true,
                        },
                    },
                    hrLog: {
                        select: {
                            id: true,
                            hrId: true,
                            actionType: true,
                            affectedEmployeeId: true,
                            description: true,
                            createdAt: true,
                        },
                    },
                },
            });

            if (!adminRequest) {
                throw new NotFoundException(`Admin request with ID ${id} not found`);
            }

            return adminRequest;
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            this.logger.error(`Failed to get admin request ${id}: ${error.message}`);
            throw new BadRequestException(`Failed to get admin request: ${error.message}`);
        }
    }

    /**
     * Get admin requests by HR ID (HR can view their own requests)
     */
    async getAdminRequestsByHrId(hrId: number): Promise<AdminRequestListResponseDto> {
        try {
            const adminRequests = await this.prisma.adminRequest.findMany({
                where: {
                    hrId: hrId,
                },
                include: {
                    hr: {
                        select: {
                            id: true,
                            employeeId: true,
                        },
                    },
                    hrLog: {
                        select: {
                            id: true,
                            hrId: true,
                            actionType: true,
                            affectedEmployeeId: true,
                            description: true,
                            createdAt: true,
                        },
                    },
                },
                orderBy: {
                    createdAt: 'desc',
                },
            });

            const total = await this.prisma.adminRequest.count({
                where: {
                    hrId: hrId,
                },
            });

            return {
                adminRequests,
                total,
            };
        } catch (error) {
            this.logger.error(`Failed to get admin requests for HR ${hrId}: ${error.message}`);
            throw new BadRequestException(`Failed to get admin requests: ${error.message}`);
        }
    }

    /**
     * Update admin request (HR only, pending status only)
     */
    async updateAdminRequest(id: number, dto: UpdateAdminRequestDto, hrEmployeeId: number): Promise<AdminRequestResponseDto> {
        // Validate HR employee exists
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

        // Check if admin request exists and is pending
        const existingRequest = await this.prisma.adminRequest.findUnique({
            where: { id },
            include: {
                hrLog: {
                    select: {
                        id: true,
                        hrId: true,
                        actionType: true,
                        affectedEmployeeId: true,
                        description: true,
                        createdAt: true,
                    },
                },
            },
        });

        if (!existingRequest) {
            throw new NotFoundException(`Admin request with ID ${id} not found`);
        }

        if (existingRequest.status !== AdminRequestStatus.pending) {
            throw new ForbiddenException(`Cannot update admin request with status: ${existingRequest.status}. Only pending requests can be updated.`);
        }

        try {
            const adminRequest = await this.prisma.adminRequest.update({
                where: { id },
                data: {
                    description: dto.description,
                    type: dto.type,
                },
                include: {
                    hr: {
                        select: {
                            id: true,
                            employeeId: true,
                        },
                    },
                    hrLog: {
                        select: {
                            id: true,
                            hrId: true,
                            actionType: true,
                            affectedEmployeeId: true,
                            description: true,
                            createdAt: true,
                        },
                    },
                },
            });

            this.logger.log(`Admin request ${id} updated by HR employee ${hrEmployeeId}`);
            return adminRequest;
        } catch (error) {
            if (error instanceof NotFoundException || error instanceof ForbiddenException) {
                throw error;
            }
            this.logger.error(`Failed to update admin request ${id}: ${error.message}`);
            throw new BadRequestException(`Failed to update admin request: ${error.message}`);
        }
    }

    /**
     * Delete admin request (HR only, pending status only)
     */
    async deleteAdminRequest(id: number, hrEmployeeId: number): Promise<{ message: string }> {
        // Validate HR employee exists
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

        // Check if admin request exists and is pending
        const existingRequest = await this.prisma.adminRequest.findUnique({
            where: { id },
        });

        if (!existingRequest) {
            throw new NotFoundException(`Admin request with ID ${id} not found`);
        }

        if (existingRequest.status !== AdminRequestStatus.pending) {
            throw new ForbiddenException(`Cannot delete admin request with status: ${existingRequest.status}. Only pending requests can be deleted.`);
        }

        try {
            await this.prisma.adminRequest.delete({
                where: { id },
            });

            this.logger.log(`Admin request ${id} deleted by HR employee ${hrEmployeeId}`);
            return {
                message: `Admin request ${id} deleted successfully`,
            };
        } catch (error) {
            if (error instanceof NotFoundException || error instanceof ForbiddenException) {
                throw error;
            }
            this.logger.error(`Failed to delete admin request ${id}: ${error.message}`);
            throw new BadRequestException(`Failed to delete admin request: ${error.message}`);
        }
    }

    /**
     * Update admin request status (Admin only)
     */
    async updateAdminRequestStatus(id: number, dto: UpdateAdminRequestStatusDto, adminId: number): Promise<AdminRequestResponseDto> {
        // Validate admin exists
        const admin = await this.prisma.admin.findUnique({
            where: { id: adminId },
        });

        if (!admin) {
            throw new NotFoundException(`Admin with ID ${adminId} not found`);
        }

        // Check if admin request exists
        const existingRequest = await this.prisma.adminRequest.findUnique({
            where: { id },
            include: {
                hrLog: {
                    select: {
                        id: true,
                        hrId: true,
                        actionType: true,
                        affectedEmployeeId: true,
                        description: true,
                        createdAt: true,
                    },
                },
            },
        });

        if (!existingRequest) {
            throw new NotFoundException(`Admin request with ID ${id} not found`);
        }

        if (existingRequest.status === AdminRequestStatus.approved) {
            throw new ForbiddenException(`Cannot update admin request with status: ${existingRequest.status}. Only pending requests can be updated.`);
        }

        try {
            const adminRequest = await this.prisma.adminRequest.update({
                where: { id },
                data: {
                    status: dto.status,
                },
                include: {
                    hr: {
                        select: {
                            id: true,
                            employeeId: true,
                        },
                    },
                    hrLog: {
                        select: {
                            id: true,
                            hrId: true,
                            actionType: true,
                            affectedEmployeeId: true,
                            description: true,
                            createdAt: true,
                        },
                    },
                },
            });

            this.logger.log(`Admin request ${id} status updated to ${dto.status} by admin ${adminId}`);
            return adminRequest;
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            this.logger.error(`Failed to update admin request status ${id}: ${error.message}`);
            throw new BadRequestException(`Failed to update admin request status: ${error.message}`);
        }
    }

    /**
     * Get admin request statistics
     */
    async getAdminRequestStats(): Promise<any> {
        try {
            const currentDate = new Date();
            const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);

            // Get all admin requests with HR relationships
            const allRequests = await this.prisma.adminRequest.findMany({
                include: {
                    hr: {
                        select: {
                            id: true,
                            employeeId: true,
                        },
                    },
                },
            });

            // Total counts
            const total = allRequests.length;
            const active = allRequests.filter(req => req.status === AdminRequestStatus.pending).length;
            const completed = allRequests.filter(req => 
                req.status === AdminRequestStatus.approved || req.status === AdminRequestStatus.declined
            ).length;

            // Status breakdown
            const pendingCount = allRequests.filter(req => req.status === AdminRequestStatus.pending).length;
            const approvedCount = allRequests.filter(req => req.status === AdminRequestStatus.approved).length;
            const declinedCount = allRequests.filter(req => req.status === AdminRequestStatus.declined).length;

            const byStatus = {
                pending: {
                    count: pendingCount,
                    percentage: total > 0 ? Math.round((pendingCount / total) * 100 * 100) / 100 : 0,
                },
                approved: {
                    count: approvedCount,
                    percentage: total > 0 ? Math.round((approvedCount / total) * 100 * 100) / 100 : 0,
                },
                declined: {
                    count: declinedCount,
                    percentage: total > 0 ? Math.round((declinedCount / total) * 100 * 100) / 100 : 0,
                },
            };

            // Type breakdown
            const salaryIncreaseCount = allRequests.filter(req => req.type === 'salary_increase').length;
            const lateApprovalCount = allRequests.filter(req => req.type === 'late_approval').length;
            const othersCount = allRequests.filter(req => req.type === 'others').length;

            const byType = {
                salary_increase: {
                    count: salaryIncreaseCount,
                    percentage: total > 0 ? Math.round((salaryIncreaseCount / total) * 100 * 100) / 100 : 0,
                },
                late_approval: {
                    count: lateApprovalCount,
                    percentage: total > 0 ? Math.round((lateApprovalCount / total) * 100 * 100) / 100 : 0,
                },
                others: {
                    count: othersCount,
                    percentage: total > 0 ? Math.round((othersCount / total) * 100 * 100) / 100 : 0,
                },
            };

            // Approval rate
            const completedRequests = approvedCount + declinedCount;
            const approvalRate = {
                approved: approvedCount,
                declined: declinedCount,
                approvalPercentage: completedRequests > 0 ? Math.round((approvedCount / completedRequests) * 100 * 100) / 100 : 0,
                declinePercentage: completedRequests > 0 ? Math.round((declinedCount / completedRequests) * 100 * 100) / 100 : 0,
            };

            // This month's stats
            const thisMonthRequests = allRequests.filter(req => req.createdAt >= firstDayOfMonth);
            const thisMonthNew = thisMonthRequests.length;
            const thisMonthApproved = thisMonthRequests.filter(req => req.status === AdminRequestStatus.approved).length;
            const thisMonthDeclined = thisMonthRequests.filter(req => req.status === AdminRequestStatus.declined).length;
            const thisMonthPending = thisMonthRequests.filter(req => req.status === AdminRequestStatus.pending).length;

            const thisMonth = {
                new: thisMonthNew,
                approved: thisMonthApproved,
                declined: thisMonthDeclined,
                pending: thisMonthPending,
            };

            // Top HR contributors
            const hrContributions: Record<number, { hrEmployeeId: number; count: number }> = {};
            allRequests.forEach(req => {
                if (req.hrId && req.hr) {
                    if (!hrContributions[req.hrId]) {
                        hrContributions[req.hrId] = {
                            hrEmployeeId: req.hr.employeeId,
                            count: 0,
                        };
                    }
                    hrContributions[req.hrId].count++;
                }
            });

            const topContributors = Object.entries(hrContributions)
                .map(([hrId, data]) => ({
                    hrId: parseInt(hrId),
                    hrEmployeeId: data.hrEmployeeId,
                    requestCount: data.count,
                }))
                .sort((a, b) => b.requestCount - a.requestCount)
                .slice(0, 5);

            return {
                status: 'success',
                message: 'Admin request statistics retrieved successfully',
                data: {
                    total,
                    active,
                    completed,
                    byStatus,
                    byType,
                    approvalRate,
                    thisMonth,
                    topContributors,
                },
            };
        } catch (error) {
            this.logger.error(`Failed to retrieve admin request statistics: ${error.message}`);
            throw new BadRequestException(`Failed to retrieve admin request statistics: ${error.message}`);
        }
    }
} 