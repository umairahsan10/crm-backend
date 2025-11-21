import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateIndustryDto, UpdateIndustryDto } from './dto/industry.dto';
import { GetIndustriesDto, IndustryResponseDto, IndustryListResponseDto, IndustryStatsDto } from './dto/industry-query.dto';

@Injectable()
export class IndustryService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new industry
   */
  async createIndustry(dto: CreateIndustryDto): Promise<IndustryResponseDto> {
    // Check if industry with same name already exists (case-insensitive)
    const existingIndustry = await this.prisma.industry.findFirst({
      where: {
        name: {
          equals: dto.name,
          mode: 'insensitive'
        }
      }
    });

    if (existingIndustry) {
      throw new ConflictException(`Industry with name "${dto.name}" already exists`);
    }

    // Create new industry
    const industry = await this.prisma.industry.create({
      data: {
        name: dto.name,
        description: dto.description || null,
        isActive: true
      }
    });

    return this.mapToResponseDto(industry);
  }

  /**
   * Get all industries with filters and pagination
   */
  async getIndustries(query: GetIndustriesDto): Promise<IndustryListResponseDto> {
    const { search, isActive, sortBy, sortOrder, page, limit } = query;

    // Build where clause
    const where: any = {};

    // Search filter (case-insensitive)
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Active/Inactive filter
    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    // Get total count for pagination
    const total = await this.prisma.industry.count({ where });

    // Calculate pagination
    const skip = ((page || 1) - 1) * (limit || 20);
    const totalPages = Math.ceil(total / (limit || 20));

    // Fetch industries
    const industries = await this.prisma.industry.findMany({
      where,
      skip,
      take: limit || 20,
      orderBy: {
        [sortBy || 'name']: sortOrder || 'asc'
      },
      include: {
        _count: {
          select: {
            clients: true,
            crackedLeads: true
          }
        }
      }
    });

    // Map to response DTOs
    const industryDtos = industries.map(industry => ({
      ...this.mapToResponseDto(industry),
      clientsCount: industry._count.clients,
      crackedLeadsCount: industry._count.crackedLeads
    }));

    return {
      industries: industryDtos,
      pagination: {
        page: page || 1,
        limit: limit || 20,
        total,
        totalPages
      }
    };
  }

  /**
   * Get only active industries (for dropdowns)
   */
  async getActiveIndustries(): Promise<IndustryResponseDto[]> {
    const industries = await this.prisma.industry.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    });

    return industries.map(industry => this.mapToResponseDto(industry));
  }

  /**
   * Get single industry by ID with statistics
   */
  async getIndustryById(id: number): Promise<IndustryResponseDto> {
    const industry = await this.prisma.industry.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            clients: true,
            crackedLeads: true
          }
        }
      }
    });

    if (!industry) {
      throw new NotFoundException(`Industry with ID ${id} not found`);
    }

    return {
      ...this.mapToResponseDto(industry),
      clientsCount: industry._count.clients,
      crackedLeadsCount: industry._count.crackedLeads
    };
  }

  /**
   * Update industry
   */
  async updateIndustry(id: number, dto: UpdateIndustryDto): Promise<IndustryResponseDto> {
    // Check if industry exists
    const existingIndustry = await this.prisma.industry.findUnique({
      where: { id }
    });

    if (!existingIndustry) {
      throw new NotFoundException(`Industry with ID ${id} not found`);
    }

    // If name is being updated, check for duplicates
    if (dto.name && dto.name !== existingIndustry.name) {
      const duplicateIndustry = await this.prisma.industry.findFirst({
        where: {
          name: {
            equals: dto.name,
            mode: 'insensitive'
          },
          id: { not: id }
        }
      });

      if (duplicateIndustry) {
        throw new ConflictException(`Industry with name "${dto.name}" already exists`);
      }
    }

    // Update industry
    const updatedIndustry = await this.prisma.industry.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive })
      }
    });

    return this.mapToResponseDto(updatedIndustry);
  }

  /**
   * Soft delete industry (set isActive = false)
   */
  async softDeleteIndustry(id: number): Promise<{ message: string }> {
    // Check if industry exists
    const existingIndustry = await this.prisma.industry.findUnique({
      where: { id }
    });

    if (!existingIndustry) {
      throw new NotFoundException(`Industry with ID ${id} not found`);
    }

    // Check if already inactive
    if (!existingIndustry.isActive) {
      throw new BadRequestException('Industry is already inactive');
    }

    // Soft delete (set isActive = false)
    await this.prisma.industry.update({
      where: { id },
      data: { isActive: false }
    });

    return {
      message: `Industry "${existingIndustry.name}" has been deactivated successfully`
    };
  }

  /**
   * Hard delete industry (for future implementation)
   * Currently disabled - checks dependencies
   */
  async deleteIndustry(id: number): Promise<{ success: boolean; message: string; dependencies?: any }> {
    // Check if industry exists
    const existingIndustry = await this.prisma.industry.findUnique({
      where: { id }
    });

    if (!existingIndustry) {
      throw new NotFoundException(`Industry with ID ${id} not found`);
    }

    // Check for dependencies
    const clientsCount = await this.prisma.client.count({
      where: { industryId: id }
    });

    const crackedLeadsCount = await this.prisma.crackedLead.count({
      where: { industryId: id }
    });

    const hasDependencies = clientsCount > 0 || crackedLeadsCount > 0;

    if (hasDependencies) {
      return {
        success: false,
        message: 'Cannot delete industry. Dependencies exist. Please reassign or remove dependencies first.',
        dependencies: {
          clients: {
            count: clientsCount
          },
          crackedLeads: {
            count: crackedLeadsCount
          }
        }
      };
    }

    // If no dependencies, proceed with deletion
    await this.prisma.industry.delete({
      where: { id }
    });

    return {
      success: true,
      message: `Industry "${existingIndustry.name}" has been deleted successfully`
    };
  }

  /**
   * Get industry statistics
   */
  async getIndustryStats(): Promise<IndustryStatsDto> {
    // Total counts
    const totalIndustries = await this.prisma.industry.count();
    const activeIndustries = await this.prisma.industry.count({
      where: { isActive: true }
    });
    const inactiveIndustries = totalIndustries - activeIndustries;

    // Total clients and cracked leads
    const totalClients = await this.prisma.client.count({
      where: { 
        industryId: { 
          not: null 
        } 
      }
    });
    // Count all cracked leads (industryId is required, not nullable)
    const totalCrackedLeads = await this.prisma.crackedLead.count();

    // Top industries by clients and cracked leads
    const industriesWithCounts = await this.prisma.industry.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: {
            clients: true,
            crackedLeads: true
          }
        }
      }
    });

    const topIndustries = industriesWithCounts
      .map(industry => ({
        id: industry.id,
        name: industry.name,
        clientsCount: industry._count.clients,
        crackedLeadsCount: industry._count.crackedLeads,
        totalCount: industry._count.clients + industry._count.crackedLeads
      }))
      .sort((a, b) => b.totalCount - a.totalCount)
      .slice(0, 5)
      .map(({ totalCount, ...rest }) => rest);

    return {
      totalIndustries,
      activeIndustries,
      inactiveIndustries,
      totalClients,
      totalCrackedLeads,
      topIndustries
    };
  }

  /**
   * Reactivate industry
   */
  async reactivateIndustry(id: number): Promise<IndustryResponseDto> {
    // Check if industry exists
    const existingIndustry = await this.prisma.industry.findUnique({
      where: { id }
    });

    if (!existingIndustry) {
      throw new NotFoundException(`Industry with ID ${id} not found`);
    }

    // Check if already active
    if (existingIndustry.isActive) {
      throw new BadRequestException('Industry is already active');
    }

    // Reactivate
    const updatedIndustry = await this.prisma.industry.update({
      where: { id },
      data: { isActive: true }
    });

    return this.mapToResponseDto(updatedIndustry);
  }

  /**
   * Map Prisma model to response DTO
   */
  private mapToResponseDto(industry: any): IndustryResponseDto {
    return {
      id: industry.id,
      name: industry.name,
      description: industry.description,
      isActive: industry.isActive,
      createdAt: industry.createdAt,
      updatedAt: industry.updatedAt
    };
  }
}

