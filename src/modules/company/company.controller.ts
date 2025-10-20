import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe, UseGuards, Query } from '@nestjs/common';
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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiBody, ApiQuery } from '@nestjs/swagger';

@ApiTags('Company')
@ApiBearerAuth()
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
  @ApiOperation({ summary: 'Create a new company' })
  @ApiBody({ type: CreateCompanyDto })
  @ApiResponse({ status: 201, description: 'Company created successfully', type: CompanyResponseDto })
  async createCompany(@Body() createCompanyDto: CreateCompanyDto): Promise<CompanyResponseDto> {
    return this.companyService.createCompany(createCompanyDto);
  }

  /**
   * Get all companies with search and filtering capabilities
   * Only Admin, HR department, or department managers can access
   */
  @Get()
  @Roles(RoleName.dep_manager, RoleName.unit_head)
  @Departments('HR')
  @ApiOperation({ summary: 'Get all companies with search and filtering' })
  @ApiQuery({ name: 'search', required: false, description: 'Search term to filter companies by name, country, or status' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number for pagination' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of items per page' })
  @ApiQuery({ name: 'sortBy', required: false, description: 'Field to sort by' })
  @ApiQuery({ name: 'sortOrder', required: false, description: 'Sort order: asc or desc' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by company status (active/inactive)' })
  @ApiQuery({ name: 'country', required: false, description: 'Filter by country' })
  @ApiQuery({ name: 'name', required: false, description: 'Filter by company name' })
  @ApiResponse({ status: 200, description: 'List of companies with pagination metadata' })
  async getAllCompanies(@Query() query: any): Promise<any> {
    return this.companyService.getAllCompanies(query);
  }

  /**
   * Get company by ID
   * Only Admin, HR department, or department managers can access
   */
  @Get(':id')
  @Roles(RoleName.dep_manager, RoleName.unit_head)
  @Departments('HR')
  @ApiOperation({ summary: 'Get company by ID' })
  @ApiParam({ name: 'id', description: 'Company ID', example: 1 })
  @ApiResponse({ status: 200, description: 'Company details', type: CompanyResponseDto })
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
  @ApiOperation({ summary: 'Update company by ID' })
  @ApiParam({ name: 'id', description: 'Company ID', example: 1 })
  @ApiBody({ type: UpdateCompanyDto })
  @ApiResponse({ status: 200, description: 'Updated company details', type: CompanyResponseDto })
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
  @ApiOperation({ summary: 'Delete company by ID' })
  @ApiParam({ name: 'id', description: 'Company ID', example: 1 })
  @ApiResponse({ status: 200, description: 'Company deleted successfully', schema: { example: { message: 'Company deleted successfully' } } })
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
  @ApiOperation({ summary: 'Get company attendance settings (time thresholds and deductions)' })
  @ApiResponse({ status: 200, description: 'Company attendance settings', schema: { example: {
    lateTime: 15,
    halfTime: 4,
    absentTime: 8,
    quarterlyLeavesDays: 10,
    monthlyLatesDays: 3,
    absentDeduction: 500,
    lateDeduction: 50,
    halfDeduction: 250,
  }}})
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
