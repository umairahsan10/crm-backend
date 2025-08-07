import { Body, Controller, Put, Patch, UseGuards, Request, Post, Get, Param, Query, ParseIntPipe } from '@nestjs/common';
import { LiabilitiesService } from './liabilities.service';
import { CreateLiabilityDto } from './dto/create-liability.dto';
import { UpdateLiabilityDto } from './dto/update-liability.dto';
import { MarkLiabilityPaidDto } from './dto/mark-liability-paid.dto';
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
  async getAllLiabilities(
    @Request() req: AuthenticatedRequest,
    @Query('isPaid') isPaid?: string,
    @Query('relatedVendorId') relatedVendorId?: string,
    @Query('category') category?: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
    @Query('createdBy') createdBy?: string,
  ) {
    const filters = {
      isPaid: isPaid === 'true' ? true : isPaid === 'false' ? false : undefined,
      relatedVendorId: relatedVendorId ? parseInt(relatedVendorId) : undefined,
      category,
      fromDate,
      toDate,
      createdBy: createdBy ? parseInt(createdBy) : undefined,
    };

    return await this.liabilitiesService.getAllLiabilities(filters);
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
  async markLiabilityAsPaid(
    @Body() dto: MarkLiabilityPaidDto,
    @Request() req: AuthenticatedRequest
  ) {
    const currentUserId = req.user.id;
    return await this.liabilitiesService.markLiabilityAsPaid(dto, currentUserId);
  }
}
