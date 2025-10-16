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
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiQuery, ApiParam, getSchemaPath } from '@nestjs/swagger';
import { AssetCreateResponseDto, AssetUpdateResponseDto, AssetSingleResponseDto, AssetListResponseDto, AssetErrorResponseDto } from './dto/asset-response.dto';

interface AuthenticatedRequest extends Request {
  user: {
    id: number;
    type: string;
    role?: string;
    department?: string;
    [key: string]: any;
  };
}

@ApiTags('AccountantAssets')
@ApiBearerAuth()
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
  @ApiOperation({ summary: 'Create a new asset', description: 'Creates a new asset with a linked transaction record.' })
  @ApiResponse({ status: 201, description: 'Asset created successfully', type: AssetCreateResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid input', type: AssetErrorResponseDto })
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
  @ApiOperation({ summary: 'Get all assets', description: 'Retrieve all assets with optional filtering by category, date, employee, or value ranges.' })
  @ApiQuery({ name: 'category', required: false, type: String, description: 'Filter by asset category' })
  @ApiQuery({ name: 'fromDate', required: false, type: String, description: 'Filter from purchase date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'toDate', required: false, type: String, description: 'Filter to purchase date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'createdBy', required: false, type: String, description: 'Filter by employee ID who created the asset' })
  @ApiQuery({ name: 'minPurchaseValue', required: false, type: Number, description: 'Minimum purchase value' })
  @ApiQuery({ name: 'maxPurchaseValue', required: false, type: Number, description: 'Maximum purchase value' })
  @ApiQuery({ name: 'minCurrentValue', required: false, type: Number, description: 'Minimum current value' })
  @ApiQuery({ name: 'maxCurrentValue', required: false, type: Number, description: 'Maximum current value' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number for pagination' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of records per page' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search term to filter assets by title or category' })
  @ApiResponse({ status: 200, description: 'Assets retrieved successfully', type: AssetListResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid query parameters', type: AssetErrorResponseDto })
  async getAllAssets(
    @Request() req: AuthenticatedRequest,
    @Query() query: any,
  ) {
    const filters = {
      category: query.category,
      fromDate: query.fromDate,
      toDate: query.toDate,
      createdBy: query.createdBy ? parseInt(query.createdBy) : undefined,
      minPurchaseValue: query.minPurchaseValue ? parseFloat(query.minPurchaseValue) : undefined,
      maxPurchaseValue: query.maxPurchaseValue ? parseFloat(query.maxPurchaseValue) : undefined,
      minCurrentValue: query.minCurrentValue ? parseFloat(query.minCurrentValue) : undefined,
      maxCurrentValue: query.maxCurrentValue ? parseFloat(query.maxCurrentValue) : undefined,
    };

    return await this.assetsService.getAllAssets(filters, query);
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
  @ApiOperation({ summary: 'Get asset by ID', description: 'Retrieve detailed information about a specific asset including transaction and vendor.' })
  @ApiParam({ name: 'id', type: Number, description: 'Asset ID' })
  @ApiResponse({ status: 200, description: 'Asset retrieved successfully', type: AssetSingleResponseDto })
  @ApiResponse({ status: 404, description: 'Asset not found', type: AssetErrorResponseDto })
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
  @ApiOperation({ summary: 'Update an asset', description: 'Update asset details and linked transaction if purchase value changes.' })
  @ApiResponse({ status: 200, description: 'Asset updated successfully', type: AssetUpdateResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid input or asset not found', type: AssetErrorResponseDto })
  async updateAsset(
    @Body() dto: UpdateAssetDto,
    @Request() req: AuthenticatedRequest
  ) {
    const currentUserId = req.user.id;
    return await this.assetsService.updateAsset(dto, currentUserId);
  }
}