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
  HttpStatus
} from '@nestjs/common';
import { IndustryService } from './industry.service';
import { CreateIndustryDto, UpdateIndustryDto } from './dto/industry.dto';
import { GetIndustriesDto, IndustryResponseDto, IndustryListResponseDto, IndustryStatsDto } from './dto/industry-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { DepartmentsGuard } from '../../common/guards/departments.guard';
import { BlockProductionGuard } from '../../common/guards/block-production.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Departments } from '../../common/decorators/departments.decorator';
import { RoleName } from '@prisma/client';

interface AuthenticatedRequest extends Request {
  user: {
    id: number;
    email: string;
    role: string | number;
    type: string;
    departmentId?: number;
  };
}

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
  async createIndustry(
    @Body() createIndustryDto: CreateIndustryDto,
    @Request() req: AuthenticatedRequest
  ): Promise<{ status: string; message: string; data: { industry: IndustryResponseDto } }> {
    const industry = await this.industryService.createIndustry(createIndustryDto);
    return {
      status: 'success',
      message: 'Industry created successfully',
      data: { industry }
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
    RoleName.junior
  )
  async getIndustries(
    @Query() query: GetIndustriesDto,
    @Request() req: AuthenticatedRequest
  ): Promise<{ status: string; message: string; data: IndustryListResponseDto }> {
    const result = await this.industryService.getIndustries(query);
    return {
      status: 'success',
      message: 'Industries retrieved successfully',
      data: result
    };
  }

  /**
   * Get only active industries (for dropdowns)
   * Accessible by all authenticated users
   */
  @Get('active')
  @UseGuards(JwtAuthGuard)
  async getActiveIndustries(
    @Request() req: AuthenticatedRequest
  ): Promise<{ status: string; message: string; data: { industries: IndustryResponseDto[] } }> {
    const industries = await this.industryService.getActiveIndustries();
    return {
      status: 'success',
      message: 'Active industries retrieved successfully',
      data: { industries }
    };
  }

  /**
   * Get industry statistics
   * Accessible by Marketing Manager, Sales (all roles), and Admin
   */
  @Get('stats')
  @UseGuards(JwtAuthGuard, BlockProductionGuard, RolesGuard)
  @Roles(
    RoleName.dep_manager,
    RoleName.unit_head,
    RoleName.team_lead
  )
  async getIndustryStats(
    @Request() req: AuthenticatedRequest
  ): Promise<{ status: string; message: string; data: IndustryStatsDto }> {
    const stats = await this.industryService.getIndustryStats();
    return {
      status: 'success',
      message: 'Industry statistics retrieved successfully',
      data: stats
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
    RoleName.junior
  )
  async getIndustryById(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: AuthenticatedRequest
  ): Promise<{ status: string; message: string; data: { industry: IndustryResponseDto } }> {
    const industry = await this.industryService.getIndustryById(id);
    return {
      status: 'success',
      message: 'Industry retrieved successfully',
      data: { industry }
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
  async updateIndustry(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateIndustryDto: UpdateIndustryDto,
    @Request() req: AuthenticatedRequest
  ): Promise<{ status: string; message: string; data: { industry: IndustryResponseDto } }> {
    const industry = await this.industryService.updateIndustry(id, updateIndustryDto);
    return {
      status: 'success',
      message: 'Industry updated successfully',
      data: { industry }
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
  async softDeleteIndustry(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: AuthenticatedRequest
  ): Promise<{ status: string; message: string }> {
    const result = await this.industryService.softDeleteIndustry(id);
    return {
      status: 'success',
      message: result.message
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
  async reactivateIndustry(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: AuthenticatedRequest
  ): Promise<{ status: string; message: string; data: { industry: IndustryResponseDto } }> {
    const industry = await this.industryService.reactivateIndustry(id);
    return {
      status: 'success',
      message: 'Industry reactivated successfully',
      data: { industry }
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
  async deleteIndustry(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: AuthenticatedRequest
  ): Promise<{ status: string; message: string; dependencies?: any }> {
    const result = await this.industryService.deleteIndustry(id);
    
    if (!result.success) {
      return {
        status: 'error',
        message: result.message,
        dependencies: result.dependencies
      };
    }

    return {
      status: 'success',
      message: result.message
    };
  }
}

