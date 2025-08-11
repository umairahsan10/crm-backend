import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { CompanyService } from './company.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { CompanyResponseDto } from './dto/company-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { DepartmentsGuard } from '../../common/guards/departments.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Departments } from '../../common/decorators/departments.decorator';
import { RoleName } from '@prisma/client';

@Controller('company')
@UseGuards(JwtAuthGuard, RolesGuard, DepartmentsGuard)
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  /**
   * Create a new company
   * Only Admin, HR department, or department managers can create
   */
  @Post()
  @Roles(RoleName.dep_manager, RoleName.unit_head)
  @Departments('HR')
  async createCompany(@Body() createCompanyDto: CreateCompanyDto): Promise<CompanyResponseDto> {
    return this.companyService.createCompany(createCompanyDto);
  }

  /**
   * Get all companies (usually only one)
   * Only Admin, HR department, or department managers can access
   */
  @Get()
  @Roles(RoleName.dep_manager, RoleName.unit_head)
  @Departments('HR')
  async getAllCompanies(): Promise<CompanyResponseDto[]> {
    return this.companyService.getAllCompanies();
  }

  /**
   * Get company by ID
   * Only Admin, HR department, or department managers can access
   */
  @Get(':id')
  @Roles(RoleName.dep_manager, RoleName.unit_head)
  @Departments('HR')
  async getCompanyById(@Param('id', ParseIntPipe) id: number): Promise<CompanyResponseDto> {
    return this.companyService.getCompanyById(id);
  }

  /**
   * Update company by ID
   * Only Admin, HR department, or department managers can update
   */
  @Put(':id')
  @Roles(RoleName.dep_manager, RoleName.unit_head)
  @Departments('HR')
  async updateCompany(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCompanyDto: UpdateCompanyDto,
  ): Promise<CompanyResponseDto> {
    return this.companyService.updateCompany(id, updateCompanyDto);
  }

  /**
   * Delete company by ID
   * Only Admin, HR department, or department managers can delete
   */
  @Delete(':id')
  @Roles(RoleName.dep_manager, RoleName.unit_head)
  @Departments('HR')
  async deleteCompany(@Param('id', ParseIntPipe) id: number): Promise<{ message: string }> {
    return this.companyService.deleteCompany(id);
  }

  /**
   * Get company settings (time configurations and deductions)
   * Only Admin, HR department, or department managers can access
   */
  @Get('settings/attendance')
  @Roles(RoleName.dep_manager, RoleName.unit_head)
  @Departments('HR')
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
    return this.companyService.getCompanySettings();
  }
}
