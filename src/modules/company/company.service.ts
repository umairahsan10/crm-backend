import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { CompanyResponseDto } from './dto/company-response.dto';

@Injectable()
export class CompanyService {
  constructor(private readonly prisma: PrismaService) {}

  async createCompany(createCompanyDto: CreateCompanyDto): Promise<CompanyResponseDto> {
    // Set default values for time fields if not provided
    const companyData = {
      ...createCompanyDto,
      lateTime: createCompanyDto.lateTime ?? 30,      // Default: 30 minutes
      halfTime: createCompanyDto.halfTime ?? 90,      // Default: 90 minutes
      absentTime: createCompanyDto.absentTime ?? 180, // Default: 180 minutes
    };

    const company = await this.prisma.company.create({
      data: companyData,
    });

    return this.mapToResponseDto(company);
  }

  async getAllCompanies(query: any): Promise<any> {
    const where: any = {};

    // Apply search filters
    if (query?.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { country: { contains: query.search, mode: 'insensitive' } },
        { status: { contains: query.search, mode: 'insensitive' } }
      ];
    }

    // Apply specific filters
    if (query?.status) {
      where.status = query.status;
    }

    if (query?.country) {
      where.country = { contains: query.country, mode: 'insensitive' };
    }

    if (query?.name) {
      where.name = { contains: query.name, mode: 'insensitive' };
    }

    // Apply sorting
    const orderBy: any = {};
    if (query?.sortBy) {
      orderBy[query.sortBy] = query.sortOrder || 'asc';
    } else {
      orderBy.createdAt = 'desc';
    }

    // Apply pagination - following leads convention
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 20;
    const skip = (page - 1) * limit;

    // Execute query with pagination
    const [companies, total] = await Promise.all([
      this.prisma.company.findMany({
        where,
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.company.count({ where })
    ]);

    // Return structured response with pagination metadata like leads
    return {
      companies: companies.map(company => this.mapToResponseDto(company)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async getCompanyById(id: number): Promise<CompanyResponseDto> {
    const company = await this.prisma.company.findUnique({
      where: { id },
    });

    if (!company) {
      throw new NotFoundException(`Company with ID ${id} not found`);
    }

    return this.mapToResponseDto(company);
  }

  async getCompanyStatistics(): Promise<any> {
    // Get all companies for statistics
    const companies = await this.prisma.company.findMany({
      select: {
        id: true,
        status: true,
        country: true,
      },
    });

    // Calculate total companies
    const total = companies.length;

    // Calculate active and inactive counts
    const active = companies.filter(company => company.status === 'active').length;
    const inactive = companies.filter(company => company.status === 'inactive').length;

    // Calculate byCountry statistics
    const byCountry: { [key: string]: number } = {};
    companies.forEach(company => {
      const country = company.country || 'Unknown';
      byCountry[country] = (byCountry[country] || 0) + 1;
    });

    // Calculate byStatus statistics
    const byStatus: { [key: string]: number } = {};
    companies.forEach(company => {
      const status = company.status || 'Unknown';
      byStatus[status] = (byStatus[status] || 0) + 1;
    });

    return {
      total,
      active,
      inactive,
      byCountry,
      byStatus,
    };
  }

  async updateCompany(id: number, updateCompanyDto: UpdateCompanyDto): Promise<CompanyResponseDto> {
    // Check if company exists
    const existingCompany = await this.prisma.company.findUnique({
      where: { id },
    });

    if (!existingCompany) {
      throw new NotFoundException(`Company with ID ${id} not found`);
    }

    // Update company with provided data
    const updatedCompany = await this.prisma.company.update({
      where: { id },
      data: updateCompanyDto,
    });

    return this.mapToResponseDto(updatedCompany);
  }

  async deleteCompany(id: number): Promise<{ message: string }> {
    // Check if company exists
    const existingCompany = await this.prisma.company.findUnique({
      where: { id },
    });

    if (!existingCompany) {
      throw new NotFoundException(`Company with ID ${id} not found`);
    }

    // Delete company
    await this.prisma.company.delete({
      where: { id },
    });

    return { message: 'Company deleted successfully' };
  }

  async getCompanySettings(): Promise<{
    lateTime: number;
    halfTime: number;
    absentTime: number;
    quarterlyLeavesDays: number;
    monthlyLatesDays: number;
    absentDeduction: number;
    lateDeduction: number;
    halfDeduction: number;
  }> {
    const company = await this.prisma.company.findFirst();
    
    if (!company) {
      throw new NotFoundException('No company found');
    }

    return {
      lateTime: company.lateTime,
      halfTime: company.halfTime,
      absentTime: company.absentTime,
      quarterlyLeavesDays: company.quarterlyLeavesDays,
      monthlyLatesDays: company.monthlyLatesDays,
      absentDeduction: company.absentDeduction,
      lateDeduction: company.lateDeduction,
      halfDeduction: company.halfDeduction,
    };
  }

  private mapToResponseDto(company: any): CompanyResponseDto {
    return {
      id: company.id,
      name: company.name,
      address: company.address,
      city: company.city,
      state: company.state,
      zip: company.zip,
      country: company.country,
      phone: company.phone,
      email: company.email,
      website: company.website,
      createdAt: company.createdAt,
      updatedAt: company.updatedAt,
      quarterlyLeavesDays: company.quarterlyLeavesDays,
      monthlyLatesDays: company.monthlyLatesDays,
      absentDeduction: company.absentDeduction,
      lateDeduction: company.lateDeduction,
      halfDeduction: company.halfDeduction,
      taxId: company.taxId,
      lateTime: company.lateTime,
      halfTime: company.halfTime,
      absentTime: company.absentTime,
      status: company.status,
    };
  }
}
