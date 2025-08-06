import { Body, Controller, Put, Patch, UseGuards, Request, Post, Get, Param, Query, ParseIntPipe } from '@nestjs/common';
import { AssetsService } from './assets.service';
import { CreateAssetDto } from './dto/create-asset.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';
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

@Controller('accountant/assets')
export class AssetsController {
  constructor(private readonly assetsService: AssetsService) {}

  // ==================== ASSET MANAGEMENT ENDPOINTS ====================

  /**
   * Create a new asset
   * 
   * This endpoint creates a new asset with a linked transaction record.
   * The transaction is created first, then the asset is linked to it.
   * 
   * @param dto - Asset creation data
   * @param req - Authenticated request
   * @returns Created asset with linked transaction
   * 
   * Required Permissions: assets_permission
   * Required Department: Accounts
   */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard, DepartmentsGuard, PermissionsGuard)
  @Departments('Accounts')
  @Permissions(PermissionName.assets_permission)
  async createAsset(
    @Body() dto: CreateAssetDto,
    @Request() req: AuthenticatedRequest
  ) {
    const currentUserId = req.user.id;
    return await this.assetsService.createAsset(dto, currentUserId);
  }

  /**
   * Get all assets with optional filters
   * 
   * This endpoint retrieves all assets with optional filtering by:
   * - Category
   * - Purchase date range
   * - Created by employee
   * - Purchase value range
   * - Current value range
   * 
   * @param req - Authenticated request
   * @param category - Filter by asset category
   * @param fromDate - Filter from purchase date
   * @param toDate - Filter to purchase date
   * @param createdBy - Filter by employee who created
   * @param minPurchaseValue - Minimum purchase value
   * @param maxPurchaseValue - Maximum purchase value
   * @param minCurrentValue - Minimum current value
   * @param maxCurrentValue - Maximum current value
   * @returns List of assets with transaction and vendor details
   * 
   * Required Permissions: assets_permission
   * Required Department: Accounts
   */
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard, DepartmentsGuard, PermissionsGuard)
  @Departments('Accounts')
  @Permissions(PermissionName.assets_permission)
  async getAllAssets(
    @Request() req: AuthenticatedRequest,
    @Query('category') category?: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
    @Query('createdBy') createdBy?: string,
    @Query('minPurchaseValue') minPurchaseValue?: string,
    @Query('maxPurchaseValue') maxPurchaseValue?: string,
    @Query('minCurrentValue') minCurrentValue?: string,
    @Query('maxCurrentValue') maxCurrentValue?: string,
  ) {
    const filters = {
      category,
      fromDate,
      toDate,
      createdBy: createdBy ? parseInt(createdBy) : undefined,
      minPurchaseValue: minPurchaseValue ? parseFloat(minPurchaseValue) : undefined,
      maxPurchaseValue: maxPurchaseValue ? parseFloat(maxPurchaseValue) : undefined,
      minCurrentValue: minCurrentValue ? parseFloat(minCurrentValue) : undefined,
      maxCurrentValue: maxCurrentValue ? parseFloat(maxCurrentValue) : undefined,
    };

    return await this.assetsService.getAllAssets(filters);
  }

  /**
   * Get a single asset by ID
   * 
   * This endpoint retrieves detailed information about a specific asset
   * including its linked transaction and vendor details.
   * 
   * @param id - Asset ID
   * @param req - Authenticated request
   * @returns Asset details with transaction and vendor information
   * 
   * Required Permissions: assets_permission
   * Required Department: Accounts
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, DepartmentsGuard, PermissionsGuard)
  @Departments('Accounts')
  @Permissions(PermissionName.assets_permission)
  async getAssetById(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: AuthenticatedRequest
  ) {
    return await this.assetsService.getAssetById(id);
  }

  /**
   * Update an asset
   * 
   * This endpoint updates an asset's details. If purchase value changes,
   * the linked transaction amount is also updated.
   * 
   * @param dto - Update data (includes asset ID in body)
   * @param req - Authenticated request
   * @returns Updated asset details
   * 
   * Required Permissions: assets_permission
   * Required Department: Accounts
   */
  @Patch()
  @UseGuards(JwtAuthGuard, RolesGuard, DepartmentsGuard, PermissionsGuard)
  @Departments('Accounts')
  @Permissions(PermissionName.assets_permission)
  async updateAsset(
    @Body() dto: UpdateAssetDto,
    @Request() req: AuthenticatedRequest
  ) {
    const currentUserId = req.user.id;
    return await this.assetsService.updateAsset(dto, currentUserId);
  }
}