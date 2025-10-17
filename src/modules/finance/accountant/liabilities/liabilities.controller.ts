import { Body, Controller, Put, Patch, UseGuards, Request, Post, Get, Param, Query, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { LiabilitiesService } from './liabilities.service';
import { CreateLiabilityDto } from './dto/create-liability.dto';
import { UpdateLiabilityDto } from './dto/update-liability.dto';
import { MarkLiabilityPaidDto } from './dto/mark-liability-paid.dto';
import { LiabilityCreateResponseDto, LiabilityUpdateResponseDto, LiabilityListResponseDto, LiabilityDetailResponseDto, LiabilityMarkPaidResponseDto, LiabilityErrorResponseDto } from './dto/liability-response.dto';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../common/guards/roles.guard';
import { DepartmentsGuard } from '../../../../common/guards/departments.guard';
import { PermissionsGuard } from '../../../../common/guards/permissions.guard';
import { Departments } from '../../../../common/decorators/departments.decorator';
import { Permissions } from '../../../../common/decorators/permissions.decorator';
import { PermissionName } from '../../../../common/constants/permission.enum';

interface AuthenticatedRequest extends Request {
  user: {
    id: number;
    type: string;
    role?: string;
    department?: string;
    [key: string]: any;
  };
}

@ApiTags('Accountant Liabilities')
@ApiBearerAuth()
@Controller('accountant/liabilities')
export class LiabilitiesController {
  constructor(private readonly liabilitiesService: LiabilitiesService) {}

  /**
   * Create a new liability
   * 
   * This endpoint creates a new liability with a linked transaction record.
   * The transaction is created first, then the liability is linked to it.
   * 
   * @param dto - Liability creation data
   * @param req - Authenticated request
   * @returns Created liability with linked transaction
   * 
   * Required Permissions: expenses_permission
   * Required Department: Accounts
   */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard, DepartmentsGuard, PermissionsGuard)
  @Departments('Accounts')
  @Permissions(PermissionName.expenses_permission)
  @ApiOperation({ summary: 'Create a new liability' })
  @ApiResponse({ status: 201, description: 'Created liability with linked transaction', type: LiabilityCreateResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid input', type: LiabilityErrorResponseDto })
  @ApiBody({ type: CreateLiabilityDto })
  async createLiability(
    @Body() dto: CreateLiabilityDto,
    @Request() req: AuthenticatedRequest
  ) {
    const currentUserId = req.user.id;
    return await this.liabilitiesService.createLiability(dto, currentUserId);
  }

  /**
   * Get all liabilities with optional filters
   * 
   * This endpoint retrieves all liabilities with optional filtering by:
   * - Payment status (paid/unpaid)
   * - Vendor ID
   * - Category
   * - Date range
   * - Created by employee
   * 
   * @param req - Authenticated request
   * @param isPaid - Filter by payment status
   * @param relatedVendorId - Filter by vendor ID
   * @param category - Filter by category
   * @param fromDate - Filter from date (YYYY-MM-DD)
   * @param toDate - Filter to date (YYYY-MM-DD)
   * @param createdBy - Filter by employee who created
   * @returns List of liabilities with transaction details
   * 
   * Required Permissions: expenses_permission
   * Required Department: Accounts
   */
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard, DepartmentsGuard, PermissionsGuard)
  @Departments('Accounts')
  @Permissions(PermissionName.expenses_permission)
  @ApiOperation({ summary: 'Get all liabilities with optional filters' })
  @ApiResponse({ status: 200, description: 'List of liabilities with transaction details', type: LiabilityListResponseDto })
  @ApiQuery({ name: 'isPaid', required: false, description: 'Filter by payment status', example: 'true' })
  @ApiQuery({ name: 'relatedVendorId', required: false, description: 'Filter by related vendor ID', example: 5 })
  @ApiQuery({ name: 'category', required: false, description: 'Filter by category', example: 'Rent' })
  @ApiQuery({ name: 'fromDate', required: false, description: 'Filter from date (YYYY-MM-DD)', example: '2025-10-01' })
  @ApiQuery({ name: 'toDate', required: false, description: 'Filter to date (YYYY-MM-DD)', example: '2025-10-31' })
  @ApiQuery({ name: 'createdBy', required: false, description: 'Filter by employee ID', example: 12 })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number for pagination' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of records per page' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search term to filter liabilities by name or category' })
  async getAllLiabilities(
    @Request() req: AuthenticatedRequest,
    @Query() query: any,
  ) {
    const filters = {
      isPaid: query.isPaid === 'true' ? true : query.isPaid === 'false' ? false : undefined,
      relatedVendorId: query.relatedVendorId ? parseInt(query.relatedVendorId) : undefined,
      category: query.category,
      fromDate: query.fromDate,
      toDate: query.toDate,
      createdBy: query.createdBy ? parseInt(query.createdBy) : undefined,
    };

    return await this.liabilitiesService.getAllLiabilities(filters, query);
  }

  /**
   * Get liability statistics
   * 
   * This endpoint retrieves comprehensive statistics about all liabilities
   * including paid/unpaid breakdown, overdue, upcoming, and category analysis.
   * 
   * @param req - Authenticated request
   * @returns Liability statistics overview
   * 
   * Required Permissions: expenses_permission
   * Required Department: Accounts
   */
  @Get('stats')
  @UseGuards(JwtAuthGuard, RolesGuard, DepartmentsGuard, PermissionsGuard)
  @Departments('Accounts')
  @Permissions(PermissionName.expenses_permission)
  @ApiOperation({ summary: 'Get liability statistics overview' })
  @ApiResponse({ status: 200, description: 'Liability statistics retrieved successfully' })
  async getLiabilityStats() {
    return await this.liabilitiesService.getLiabilityStats();
  }

  /**
   * Get a single liability by ID
   * 
   * This endpoint retrieves detailed information about a specific liability
   * including its linked transaction and vendor details.
   * 
   * @param id - Liability ID
   * @param req - Authenticated request
   * @returns Liability details with transaction and vendor information
   * 
   * Required Permissions: expenses_permission
   * Required Department: Accounts
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, DepartmentsGuard, PermissionsGuard)
  @Departments('Accounts')
  @Permissions(PermissionName.expenses_permission)
  @ApiOperation({ summary: 'Get a single liability by ID' })
  @ApiResponse({ status: 200, description: 'Liability details with transaction and vendor information', type: LiabilityDetailResponseDto })
  @ApiResponse({ status: 404, description: 'Liability not found', type: LiabilityErrorResponseDto })
  async getLiabilityById(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: AuthenticatedRequest
  ) {
    return await this.liabilitiesService.getLiabilityById(id);
  }

  /**
   * Update a liability
   * 
   * This endpoint updates a liability's details. The liability cannot be updated
   * if it's already paid or if its linked transaction is completed.
   * 
   * @param dto - Update data (includes liability ID in body)
   * @param req - Authenticated request
   * @returns Updated liability details
   * 
   * Required Permissions: expenses_permission
   * Required Department: Accounts
   */
  @Patch()
  @UseGuards(JwtAuthGuard, RolesGuard, DepartmentsGuard, PermissionsGuard)
  @Departments('Accounts')
  @Permissions(PermissionName.expenses_permission)
  @ApiOperation({ summary: 'Update a liability' })
  @ApiResponse({ status: 200, description: 'Updated liability details', type: LiabilityUpdateResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid input or liability cannot be updated', type: LiabilityErrorResponseDto })
  @ApiBody({ type: UpdateLiabilityDto })
  async updateLiability(
    @Body() dto: UpdateLiabilityDto,
    @Request() req: AuthenticatedRequest
  ) {
    const currentUserId = req.user.id;
    return await this.liabilitiesService.updateLiability(dto, currentUserId);
  }

  /**
   * Mark a liability as paid
   * 
   * This endpoint marks a liability as paid and automatically:
   * 1. Updates the liability's paid status and date
   * 2. Updates the linked transaction to completed status
   * 3. Creates an expense record for the payment
   * 
   * @param dto - Payment details (includes liability ID in body)
   * @param req - Authenticated request
   * @returns Updated liability with transaction and expense details
   * 
   * Required Permissions: expenses_permission
   * Required Department: Accounts
   */
  @Patch('mark-paid')
  @UseGuards(JwtAuthGuard, RolesGuard, DepartmentsGuard, PermissionsGuard)
  @Departments('Accounts')
  @Permissions(PermissionName.expenses_permission)
  @ApiOperation({ summary: 'Mark a liability as paid' })
  @ApiResponse({ status: 200, description: 'Liability, transaction, and expense details after marking as paid', type: LiabilityMarkPaidResponseDto })
  @ApiResponse({ status: 400, description: 'Cannot mark liability as paid', type: LiabilityErrorResponseDto })
  @ApiBody({ type: MarkLiabilityPaidDto })
  async markLiabilityAsPaid(
    @Body() dto: MarkLiabilityPaidDto,
    @Request() req: AuthenticatedRequest
  ) {
    const currentUserId = req.user.id;
    return await this.liabilitiesService.markLiabilityAsPaid(dto, currentUserId);
  }
}
