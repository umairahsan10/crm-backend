import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { CompanyResponseDto } from './dto/company-response.dto';

@Injectable()
export class CompanyService {
  constructor(private readonly prisma: PrismaService) {}

  async createCompany(createCompanyDto: CreateCompanyDto): Promise<CompanyResponseDto> {
    // Check if company already exists
    const existingCompany = await this.prisma.company.findFirst();
    if (existingCompany) {
      throw new ConflictException('A company already exists. Only one company can be created.');
    }

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

  async getAllCompanies(): Promise<CompanyResponseDto[]> {
    const companies = await this.prisma.company.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return companies.map(company => this.mapToResponseDto(company));
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
    };
  }
}
