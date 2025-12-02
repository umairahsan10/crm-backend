import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';
import { CampaignQueryDto } from './dto/campaign-query.dto';
import {
  CampaignResponseDto,
  CampaignListResponseDto,
} from './dto/campaign-response.dto';
import { CampaignLog, CampaignStatus } from '@prisma/client';

@Injectable()
export class CampaignService {
  constructor(private prisma: PrismaService) {}

  // Helper method to check if user belongs to Marketing department
  private async validateMarketingAccess(userId: number): Promise<void> {
    const user = await this.prisma.employee.findUnique({
      where: { id: userId },
      include: { department: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.department.name !== 'Marketing') {
      throw new ForbiddenException(
        'Access denied. Only Marketing department can manage campaigns.',
      );
    }
  }

  // Helper method to build where clause for filtering
  private buildWhereClause(query: CampaignQueryDto) {
    const where: any = {};

    if (query.search) {
      where.OR = [
        { campaignName: { contains: query.search, mode: 'insensitive' } },
        { campaignType: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.campaignType) {
      where.campaignType = {
        contains: query.campaignType,
        mode: 'insensitive',
      };
    }

    if (query.unitId) {
      where.unitId = query.unitId;
    }

    if (query.productionUnitId) {
      where.productionUnitId = query.productionUnitId;
    }

    if (query.startDateFrom || query.startDateTo) {
      where.startDate = {};
      if (query.startDateFrom) {
        where.startDate.gte = new Date(query.startDateFrom);
      }
      if (query.startDateTo) {
        where.startDate.lte = new Date(query.startDateTo);
      }
    }

    if (query.endDateFrom || query.endDateTo) {
      where.endDate = {};
      if (query.endDateFrom) {
        where.endDate.gte = new Date(query.endDateFrom);
      }
      if (query.endDateTo) {
        where.endDate.lte = new Date(query.endDateTo);
      }
    }

    if (query.minBudget || query.maxBudget) {
      where.budget = {};
      if (query.minBudget) {
        where.budget.gte = query.minBudget;
      }
      if (query.maxBudget) {
        where.budget.lte = query.maxBudget;
      }
    }

    return where;
  }

  // Helper method to build orderBy clause
  private buildOrderByClause(sortBy?: string, sortOrder?: 'asc' | 'desc') {
    const orderBy: any = {};

    if (sortBy) {
      const validSortFields = [
        'campaignName',
        'campaignType',
        'startDate',
        'endDate',
        'status',
        'budget',
        'actualCost',
        'createdAt',
        'updatedAt',
      ];

      if (validSortFields.includes(sortBy)) {
        orderBy[sortBy] = sortOrder || 'asc';
      } else {
        orderBy.createdAt = 'desc'; // Default sort
      }
    } else {
      orderBy.createdAt = 'desc'; // Default sort
    }

    return orderBy;
  }

  // Create a new campaign
  async createCampaign(
    createCampaignDto: CreateCampaignDto,
    userId: number,
  ): Promise<CampaignResponseDto> {
    await this.validateMarketingAccess(userId);

    // Validate that the marketing unit exists
    const marketingUnit = await this.prisma.marketingUnit.findUnique({
      where: { id: createCampaignDto.unitId },
    });

    if (!marketingUnit) {
      throw new NotFoundException(
        `Marketing unit with ID ${createCampaignDto.unitId} not found`,
      );
    }

    // Validate production unit if provided
    if (createCampaignDto.productionUnitId) {
      const productionUnit = await this.prisma.productionUnit.findUnique({
        where: { id: createCampaignDto.productionUnitId },
      });

      if (!productionUnit) {
        throw new NotFoundException(
          `Production unit with ID ${createCampaignDto.productionUnitId} not found`,
        );
      }
    }

    // Validate date range
    const startDate = new Date(createCampaignDto.startDate);
    const endDate = new Date(createCampaignDto.endDate);

    if (startDate >= endDate) {
      throw new BadRequestException('End date must be after start date');
    }

    const campaign = await this.prisma.campaignLog.create({
      data: {
        campaignName: createCampaignDto.campaignName,
        campaignType: createCampaignDto.campaignType,
        startDate,
        endDate,
        status: createCampaignDto.status,
        budget: createCampaignDto.budget,
        actualCost: createCampaignDto.actualCost,
        unitId: createCampaignDto.unitId,
        description: createCampaignDto.description,
        productionUnitId: createCampaignDto.productionUnitId,
      },
      include: {
        marketingUnit: {
          select: {
            id: true,
            name: true,
          },
        },
        ProductionUnit: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return this.mapToResponseDto(campaign);
  }

  // Get all campaigns with filtering and pagination
  async getAllCampaigns(
    query: CampaignQueryDto,
    userId: number,
  ): Promise<CampaignListResponseDto> {
    await this.validateMarketingAccess(userId);

    const where = this.buildWhereClause(query);
    const orderBy = this.buildOrderByClause(query.sortBy, query.sortOrder);

    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const [campaigns, total] = await Promise.all([
      this.prisma.campaignLog.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          marketingUnit: {
            select: {
              id: true,
              name: true,
            },
          },
          ProductionUnit: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      this.prisma.campaignLog.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      campaigns: campaigns.map((campaign) => this.mapToResponseDto(campaign)),
      total,
      page,
      limit,
      totalPages,
    };
  }

  // Get campaign by ID
  async getCampaignById(
    id: number,
    userId: number,
  ): Promise<CampaignResponseDto> {
    await this.validateMarketingAccess(userId);

    const campaign = await this.prisma.campaignLog.findUnique({
      where: { id },
      include: {
        marketingUnit: {
          select: {
            id: true,
            name: true,
          },
        },
        ProductionUnit: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!campaign) {
      throw new NotFoundException(`Campaign with ID ${id} not found`);
    }

    return this.mapToResponseDto(campaign);
  }

  // Update campaign
  async updateCampaign(
    id: number,
    updateCampaignDto: UpdateCampaignDto,
    userId: number,
  ): Promise<CampaignResponseDto> {
    await this.validateMarketingAccess(userId);

    // Check if campaign exists
    const existingCampaign = await this.prisma.campaignLog.findUnique({
      where: { id },
    });

    if (!existingCampaign) {
      throw new NotFoundException(`Campaign with ID ${id} not found`);
    }

    // Validate marketing unit if provided
    if (updateCampaignDto.unitId) {
      const marketingUnit = await this.prisma.marketingUnit.findUnique({
        where: { id: updateCampaignDto.unitId },
      });

      if (!marketingUnit) {
        throw new NotFoundException(
          `Marketing unit with ID ${updateCampaignDto.unitId} not found`,
        );
      }
    }

    // Validate production unit if provided
    if (updateCampaignDto.productionUnitId) {
      const productionUnit = await this.prisma.productionUnit.findUnique({
        where: { id: updateCampaignDto.productionUnitId },
      });

      if (!productionUnit) {
        throw new NotFoundException(
          `Production unit with ID ${updateCampaignDto.productionUnitId} not found`,
        );
      }
    }

    // Validate date range if dates are provided
    if (updateCampaignDto.startDate || updateCampaignDto.endDate) {
      const startDate = updateCampaignDto.startDate
        ? new Date(updateCampaignDto.startDate)
        : existingCampaign.startDate;
      const endDate = updateCampaignDto.endDate
        ? new Date(updateCampaignDto.endDate)
        : existingCampaign.endDate;

      if (startDate >= endDate) {
        throw new BadRequestException('End date must be after start date');
      }
    }

    const campaign = await this.prisma.campaignLog.update({
      where: { id },
      data: {
        ...updateCampaignDto,
        startDate: updateCampaignDto.startDate
          ? new Date(updateCampaignDto.startDate)
          : undefined,
        endDate: updateCampaignDto.endDate
          ? new Date(updateCampaignDto.endDate)
          : undefined,
      },
      include: {
        marketingUnit: {
          select: {
            id: true,
            name: true,
          },
        },
        ProductionUnit: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return this.mapToResponseDto(campaign);
  }

  // Delete campaign
  async deleteCampaign(
    id: number,
    userId: number,
  ): Promise<{ message: string }> {
    await this.validateMarketingAccess(userId);

    const campaign = await this.prisma.campaignLog.findUnique({
      where: { id },
    });

    if (!campaign) {
      throw new NotFoundException(`Campaign with ID ${id} not found`);
    }

    await this.prisma.campaignLog.delete({
      where: { id },
    });

    return {
      message: `Campaign "${campaign.campaignName}" deleted successfully`,
    };
  }

  // Get campaign statistics
  async getCampaignStats(userId: number): Promise<any> {
    await this.validateMarketingAccess(userId);

    const [
      totalCampaigns,
      activeCampaigns,
      completedCampaigns,
      totalBudget,
      totalActualCost,
      campaignsByStatus,
      campaignsByType,
    ] = await Promise.all([
      this.prisma.campaignLog.count(),
      this.prisma.campaignLog.count({ where: { status: 'Running' } }),
      this.prisma.campaignLog.count({ where: { status: 'Completed' } }),
      this.prisma.campaignLog.aggregate({
        _sum: { budget: true },
      }),
      this.prisma.campaignLog.aggregate({
        _sum: { actualCost: true },
      }),
      this.prisma.campaignLog.groupBy({
        by: ['status'],
        _count: { status: true },
      }),
      this.prisma.campaignLog.groupBy({
        by: ['campaignType'],
        _count: { campaignType: true },
      }),
    ]);

    return {
      totalCampaigns,
      activeCampaigns,
      completedCampaigns,
      totalBudget: totalBudget._sum.budget || 0,
      totalActualCost: totalActualCost._sum.actualCost || 0,
      campaignsByStatus: campaignsByStatus.map((item) => ({
        status: item.status,
        count: item._count.status,
      })),
      campaignsByType: campaignsByType.map((item) => ({
        type: item.campaignType,
        count: item._count.campaignType,
      })),
    };
  }

  // Helper method to map CampaignLog to CampaignResponseDto
  private mapToResponseDto(campaign: any): CampaignResponseDto {
    return {
      id: campaign.id,
      campaignName: campaign.campaignName,
      campaignType: campaign.campaignType,
      startDate: campaign.startDate,
      endDate: campaign.endDate,
      status: campaign.status,
      budget: campaign.budget,
      actualCost: campaign.actualCost,
      unitId: campaign.unitId,
      description: campaign.description,
      createdAt: campaign.createdAt,
      updatedAt: campaign.updatedAt,
      productionUnitId: campaign.productionUnitId,
      marketingUnit: campaign.marketingUnit,
      productionUnit: campaign.ProductionUnit,
    };
  }
}
