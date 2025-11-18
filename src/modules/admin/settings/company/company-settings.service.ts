import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../../prisma/prisma.service';
import { UpdateCompanySettingsDto } from './dto/update-company-settings.dto';
import { CompanySettingsResponseDto } from './dto/company-settings-response.dto';

@Injectable()
export class CompanySettingsService {
  private readonly logger = new Logger(CompanySettingsService.name);
  private readonly COMPANY_ID = 1; // Only one company exists with ID = 1

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get company settings (single company with ID = 1)
   */
  async getCompanySettings(): Promise<CompanySettingsResponseDto> {
    try {
      const company = await this.prisma.company.findUnique({
        where: { id: this.COMPANY_ID },
      });

      if (!company) {
        throw new NotFoundException('Company settings not found. Please create a company first.');
      }

      return this.mapToResponseDto(company);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to get company settings: ${error.message}`);
      throw new BadRequestException(`Failed to get company settings: ${error.message}`);
    }
  }

  /**
   * Update company settings (single company with ID = 1)
   * Supports partial updates - can update single field or multiple fields
   */
  async updateCompanySettings(dto: UpdateCompanySettingsDto): Promise<CompanySettingsResponseDto> {
    // Check if company exists
    const existingCompany = await this.prisma.company.findUnique({
      where: { id: this.COMPANY_ID },
    });

    if (!existingCompany) {
      throw new NotFoundException('Company settings not found. Please create a company first.');
    }

    try {
      // Build update data with only provided fields
      const updateData: any = {};

      // Company Information
      if (dto.name !== undefined) updateData.name = dto.name;
      if (dto.address !== undefined) updateData.address = dto.address;
      if (dto.city !== undefined) updateData.city = dto.city;
      if (dto.state !== undefined) updateData.state = dto.state;
      if (dto.zip !== undefined) updateData.zip = dto.zip;
      if (dto.country !== undefined) updateData.country = dto.country;
      if (dto.phone !== undefined) updateData.phone = dto.phone;
      if (dto.email !== undefined) updateData.email = dto.email;
      if (dto.website !== undefined) updateData.website = dto.website;
      if (dto.taxId !== undefined) updateData.taxId = dto.taxId;
      if (dto.status !== undefined) updateData.status = dto.status;

      // Attendance Settings
      if (dto.lateTime !== undefined) updateData.lateTime = dto.lateTime;
      if (dto.halfTime !== undefined) updateData.halfTime = dto.halfTime;
      if (dto.absentTime !== undefined) updateData.absentTime = dto.absentTime;

      // Leave Policies
      if (dto.quarterlyLeavesDays !== undefined) updateData.quarterlyLeavesDays = dto.quarterlyLeavesDays;
      if (dto.monthlyLatesDays !== undefined) updateData.monthlyLatesDays = dto.monthlyLatesDays;

      // Deductions
      if (dto.absentDeduction !== undefined) updateData.absentDeduction = dto.absentDeduction;
      if (dto.lateDeduction !== undefined) updateData.lateDeduction = dto.lateDeduction;
      if (dto.halfDeduction !== undefined) updateData.halfDeduction = dto.halfDeduction;

      // Update company
      const updatedCompany = await this.prisma.company.update({
        where: { id: this.COMPANY_ID },
        data: updateData,
      });

      this.logger.log(`Company settings updated successfully`);
      return this.mapToResponseDto(updatedCompany);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to update company settings: ${error.message}`);
      throw new BadRequestException(`Failed to update company settings: ${error.message}`);
    }
  }

  /**
   * Map company data to response DTO
   */
  private mapToResponseDto(company: any): CompanySettingsResponseDto {
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
      taxId: company.taxId,
      status: company.status,
      lateTime: company.lateTime,
      halfTime: company.halfTime,
      absentTime: company.absentTime,
      quarterlyLeavesDays: company.quarterlyLeavesDays,
      monthlyLatesDays: company.monthlyLatesDays,
      absentDeduction: company.absentDeduction,
      lateDeduction: company.lateDeduction,
      halfDeduction: company.halfDeduction,
      createdAt: company.createdAt,
      updatedAt: company.updatedAt,
    };
  }
}

