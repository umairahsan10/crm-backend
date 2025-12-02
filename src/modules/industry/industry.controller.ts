import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ParseIntPipe,
  Patch,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { IndustryService } from './industry.service';
import { CreateIndustryDto, UpdateIndustryDto } from './dto/industry.dto';
import {
  GetIndustriesDto,
  IndustryResponseDto,
  IndustryListResponseDto,
  IndustryStatsDto,
} from './dto/industry-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { DepartmentsGuard } from '../../common/guards/departments.guard';
import { BlockProductionGuard } from '../../common/guards/block-production.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Departments } from '../../common/decorators/departments.decorator';
import { RoleName } from '@prisma/client';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';

interface AuthenticatedRequest extends Request {
  user: {
    id: number;
    email: string;
    role: string | number;
    type: string;
    departmentId?: number;
  };
}

@ApiTags('Industries')
@ApiBearerAuth()
@Controller('industries')
export class IndustryController {
  constructor(private readonly industryService: IndustryService) {}

  /**
   * Create a new industry
   * Only Marketing Manager, Sales (all roles), and Admin can create
   */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard, DepartmentsGuard)
  @Departments('Sales', 'Marketing', 'Admin')
  @ApiOperation({ summary: 'Create a new industry' })
  @ApiResponse({
    status: 201,
    description: 'Industry created successfully',
    type: IndustryResponseDto,
  })
  @ApiResponse({ status: 409, description: 'Industry already exists' })
  async createIndustry(
    @Body() createIndustryDto: CreateIndustryDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<{
    status: string;
    message: string;
    data: { industry: IndustryResponseDto };
  }> {
    const industry =
      await this.industryService.createIndustry(createIndustryDto);
    return {
      status: 'success',
      message: 'Industry created successfully',
      data: { industry },
    };
  }

  /**
   * Get all industries with filters and pagination
   * Accessible by all sales roles and marketing manager
   */
  @Get()
  @UseGuards(JwtAuthGuard, BlockProductionGuard, RolesGuard)
  @Roles(
    RoleName.dep_manager,
    RoleName.unit_head,
    RoleName.team_lead,
    RoleName.senior,
    RoleName.junior,
  )
  @ApiOperation({ summary: 'Get all industries with filters and pagination' })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search by name or description',
  })
  @ApiQuery({
    name: 'isActive',
    required: false,
    type: Boolean,
    description: 'Filter by active status',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    type: String,
    description: 'Field to sort by',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    type: String,
    description: 'Sort order asc or desc',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of items per page',
  })
  @ApiResponse({
    status: 200,
    description: 'Industries retrieved successfully',
    type: IndustryListResponseDto,
  })
  async getIndustries(
    @Query() query: GetIndustriesDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<{
    status: string;
    message: string;
    data: IndustryListResponseDto;
  }> {
    const result = await this.industryService.getIndustries(query);
    return {
      status: 'success',
      message: 'Industries retrieved successfully',
      data: result,
    };
  }

  /**
   * Get only active industries (for dropdowns)
   * Accessible by all authenticated users
   */
  @Get('active')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get only active industries' })
  @ApiResponse({
    status: 200,
    description: 'Active industries retrieved',
    type: [IndustryResponseDto],
  })
  async getActiveIndustries(@Request() req: AuthenticatedRequest): Promise<{
    status: string;
    message: string;
    data: { industries: IndustryResponseDto[] };
  }> {
    const industries = await this.industryService.getActiveIndustries();
    return {
      status: 'success',
      message: 'Active industries retrieved successfully',
      data: { industries },
    };
  }

  /**
   * Get industry statistics
   * Accessible by Marketing Manager, Sales (all roles), and Admin
   */
  @Get('stats')
  @UseGuards(JwtAuthGuard, BlockProductionGuard, RolesGuard)
  @Roles(RoleName.dep_manager, RoleName.unit_head, RoleName.team_lead)
  @ApiOperation({ summary: 'Get industry statistics' })
  @ApiResponse({
    status: 200,
    description: 'Industry statistics retrieved successfully',
    type: IndustryStatsDto,
  })
  async getIndustryStats(
    @Request() req: AuthenticatedRequest,
  ): Promise<{ status: string; message: string; data: IndustryStatsDto }> {
    const stats = await this.industryService.getIndustryStats();
    return {
      status: 'success',
      message: 'Industry statistics retrieved successfully',
      data: stats,
    };
  }

  /**
   * Get single industry by ID with statistics
   * Accessible by all sales roles and marketing manager
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard, BlockProductionGuard, RolesGuard)
  @Roles(
    RoleName.dep_manager,
    RoleName.unit_head,
    RoleName.team_lead,
    RoleName.senior,
    RoleName.junior,
  )
  @ApiOperation({ summary: 'Get single industry by ID' })
  @ApiParam({ name: 'id', type: Number, description: 'Industry ID' })
  @ApiResponse({
    status: 200,
    description: 'Industry retrieved successfully',
    type: IndustryResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Industry not found' })
  async getIndustryById(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: AuthenticatedRequest,
  ): Promise<{
    status: string;
    message: string;
    data: { industry: IndustryResponseDto };
  }> {
    const industry = await this.industryService.getIndustryById(id);
    return {
      status: 'success',
      message: 'Industry retrieved successfully',
      data: { industry },
    };
  }

  /**
   * Update industry
   * Only Marketing Manager, Sales (all roles), and Admin can update
   */
  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, DepartmentsGuard)
  @Departments('Sales', 'Marketing', 'Admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update an industry' })
  @ApiParam({ name: 'id', type: Number, description: 'Industry ID' })
  @ApiResponse({
    status: 200,
    description: 'Industry updated successfully',
    type: IndustryResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Industry not found' })
  async updateIndustry(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateIndustryDto: UpdateIndustryDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<{
    status: string;
    message: string;
    data: { industry: IndustryResponseDto };
  }> {
    const industry = await this.industryService.updateIndustry(
      id,
      updateIndustryDto,
    );
    return {
      status: 'success',
      message: 'Industry updated successfully',
      data: { industry },
    };
  }

  /**
   * Soft delete industry (deactivate)
   * Only Marketing Manager, Sales (all roles), and Admin can deactivate
   */
  @Patch(':id/deactivate')
  @UseGuards(JwtAuthGuard, RolesGuard, DepartmentsGuard)
  @Departments('Sales', 'Marketing', 'Admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft delete (deactivate) an industry' })
  @ApiParam({ name: 'id', type: Number, description: 'Industry ID' })
  @ApiResponse({
    status: 200,
    description: 'Industry deactivated successfully',
  })
  @ApiResponse({ status: 404, description: 'Industry not found' })
  async softDeleteIndustry(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: AuthenticatedRequest,
  ): Promise<{ status: string; message: string }> {
    const result = await this.industryService.softDeleteIndustry(id);
    return {
      status: 'success',
      message: result.message,
    };
  }

  /**
   * Reactivate industry
   * Only Marketing Manager, Sales (all roles), and Admin can reactivate
   */
  @Patch(':id/reactivate')
  @UseGuards(JwtAuthGuard, RolesGuard, DepartmentsGuard)
  @Departments('Sales', 'Marketing', 'Admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reactivate an industry' })
  @ApiParam({ name: 'id', type: Number, description: 'Industry ID' })
  @ApiResponse({
    status: 200,
    description: 'Industry reactivated successfully',
    type: IndustryResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Industry not found' })
  async reactivateIndustry(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: AuthenticatedRequest,
  ): Promise<{
    status: string;
    message: string;
    data: { industry: IndustryResponseDto };
  }> {
    const industry = await this.industryService.reactivateIndustry(id);
    return {
      status: 'success',
      message: 'Industry reactivated successfully',
      data: { industry },
    };
  }

  /**
   * Hard delete industry (for future implementation)
   * Only Marketing Manager, Sales (all roles), and Admin can delete
   * Note: This will check dependencies and prevent deletion if any exist
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, DepartmentsGuard)
  @Departments('Sales', 'Marketing', 'Admin')
  @ApiOperation({ summary: 'Hard delete an industry' })
  @ApiParam({ name: 'id', type: Number, description: 'Industry ID' })
  @ApiResponse({ status: 200, description: 'Industry deleted successfully' })
  @ApiResponse({
    status: 400,
    description: 'Cannot delete industry due to dependencies',
  })
  @ApiResponse({ status: 404, description: 'Industry not found' })
  async deleteIndustry(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: AuthenticatedRequest,
  ): Promise<{ status: string; message: string; dependencies?: any }> {
    const result = await this.industryService.deleteIndustry(id);

    if (!result.success) {
      return {
        status: 'error',
        message: result.message,
        dependencies: result.dependencies,
      };
    }

    return {
      status: 'success',
      message: result.message,
    };
  }
}
