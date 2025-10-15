import { Body, Controller, Patch, Post, Get, UseGuards, Request, Param, Query, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiQuery } from '@nestjs/swagger';
import { AccountantService } from './accountant.service';
import { UpdatePermissionsDto } from './dto/update-permission.dto';
import { PermissionsResponseDto } from './dto/permission-response.dto';
import { AddVendorDto } from './dto/add-vendor.dto';
import { VendorResponseDto } from './dto/vendor-response.dto';
import { VendorListResponseDto } from './dto/vendor-list-response.dto';
import { CalculatePnLDto } from './dto/calculate-pnl.dto';
import { PnLResponseDto } from './dto/pnl-response.dto';
import { PnLCategoryResponseDto } from './dto/pnl-category-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { DepartmentsGuard } from '../../../common/guards/departments.guard';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { Departments } from '../../../common/decorators/departments.decorator';
import { Permissions } from '../../../common/decorators/permissions.decorator';
import { PermissionName } from '../../../common/constants/permission.enum';

interface AuthenticatedRequest extends Request {
  user: {
    id: number;
    type: string;
    role?: string;
    department?: string;
    [key: string]: any;
  };
}

@ApiTags('Accountant')
@Controller('accountant')
export class AccountantController {
  constructor(private readonly accountantService: AccountantService) {}

  /**
   * Update permissions for an accountant
   * 
   * This endpoint allows admins or account managers to update permissions for accountants:
   * 1. Validates that the target employee exists and is active
   * 2. Ensures the employee is in the Accounts department
   * 3. Verifies the accountant record exists
   * 4. Applies permission restrictions (admin bypass, account manager restrictions)
   * 5. Updates all specified permission flags
   * 6. Creates audit log entry for tracking
   * 
   * @param dto - Contains employee_id and permissions object
   * @param req - Authenticated request containing user details
   * @returns Success/error response with updated permissions and previous state
   * 
   * Required Permissions: Any accountant permission (for validation)
   * Required Department: Accounts (for account managers)
   * Admin bypass: Yes (admins can update any accountant permissions)
   */
  @Patch('permissions')
  @UseGuards(JwtAuthGuard, RolesGuard, DepartmentsGuard, PermissionsGuard)
  @Departments('Accounts')
  @Permissions(PermissionName.salary_permission) // Using salary_permission as a representative permission
  @ApiOperation({ summary: 'Update accountant permissions' })
  @ApiBody({ type: UpdatePermissionsDto })
  @ApiResponse({ status: 200, description: 'Permissions updated successfully', type: PermissionsResponseDto })
  async updatePermissions(
    @Body() dto: UpdatePermissionsDto,
    @Request() req: AuthenticatedRequest
  ): Promise<PermissionsResponseDto> {
    const currentUserId = req.user.id;
    const isAdmin = req.user.type === 'admin';
    
    const result = await this.accountantService.updatePermissions(
      dto,
      currentUserId,
      isAdmin
    );

    // Return the result directly (success or error response)
    return result;
  }

  /**
   * Add a new vendor record
   * 
   * This endpoint allows accountants to add new vendor records:
   * 1. Validates that the current user exists and is active
   * 2. Ensures the user is in the Accounts department
   * 3. Verifies the user is an accountant
   * 4. Creates the vendor record with all provided information
   * 5. Returns the created vendor data
   * 
   * @param dto - Contains vendor information (all fields optional)
   * @param req - Authenticated request containing user details
   * @returns Success/error response with vendor data
   * 
   * Required Permissions: Any accountant permission (for validation)
   * Required Department: Accounts
   * Admin bypass: No (only accountants can add vendors)
   */
  @Post('vendor/create')
  @UseGuards(JwtAuthGuard, RolesGuard, DepartmentsGuard, PermissionsGuard)
  @Departments('Accounts')
  @Permissions(PermissionName.expenses_permission) // Using expenses_permission as it's related to vendor management
  @ApiOperation({ summary: 'Add a new vendor' })
  @ApiBody({ type: AddVendorDto })
  @ApiResponse({ status: 200, description: 'Vendor added successfully', type: VendorResponseDto })
  async addVendor(
    @Body() dto: AddVendorDto,
    @Request() req: AuthenticatedRequest
  ): Promise<VendorResponseDto> {
    const currentUserId = req.user.id;
    
    const result = await this.accountantService.addVendor(
      dto,
      currentUserId
    );

    // Return the result directly (success or error response)
    return result;
  }

  /**
   * Get all vendor records
   * 
   * This endpoint allows accountants to retrieve all vendor records:
   * 1. Validates that the current user exists and is active
   * 2. Ensures the user is in the Accounts department
   * 3. Verifies the user is an accountant
   * 4. Retrieves all vendor records with pagination support
   * 5. Returns the vendor list with metadata
   * 
   * @param req - Authenticated request containing user details
   * @returns Success/error response with vendor list
   * 
   * Required Permissions: Any accountant permission (for validation)
   * Required Department: Accounts
   * Admin bypass: No (only accountants can view vendors)
   */
  @Get('vendors/display')
  @UseGuards(JwtAuthGuard, RolesGuard, DepartmentsGuard, PermissionsGuard)
  @Departments('Accounts')
  @Permissions(PermissionName.expenses_permission) // Using expenses_permission as it's related to vendor management
  @ApiOperation({ summary: 'Get all vendors' })
  @ApiResponse({ status: 200, description: 'Vendor list retrieved successfully', type: VendorListResponseDto })
  async getAllVendors(
    @Request() req: AuthenticatedRequest
  ): Promise<VendorListResponseDto> {
    const currentUserId = req.user.id;
    
    const result = await this.accountantService.getAllVendors(
      currentUserId
    );

    // Return the result directly (success or error response)
    return result;
  }

  /**
   * Trigger automatic P&L calculation for a specific month
   * 
   * This endpoint manually triggers the same process that runs automatically
   * via cron job on the 1st of every month. It calculates total income and expenses
   * for the specified month and stores the results in profit_loss table.
   * 
   * This is useful for:
   * - Manual P&L processing outside the scheduled time
   * - Testing the P&L calculation system
   * - Processing P&L for specific scenarios
   * 
   * @param dto - Optional month and year (if not provided, calculates for previous month)
   * @returns Success message confirming P&L calculation completion
   * 
   * Note: No authentication required for this endpoint (cron job compatibility)
   */
  @Post('pnl/auto')
  @ApiOperation({ summary: 'Trigger automatic P&L calculation' })
  @ApiBody({ type: CalculatePnLDto, required: false })
  @ApiResponse({ status: 200, description: 'P&L calculated successfully', type: PnLResponseDto })
  async calculatePnLAuto(@Body() dto?: CalculatePnLDto): Promise<PnLResponseDto> {
    const result = await this.accountantService.calculateAndSavePnL(dto?.month, dto?.year);
    return result;
  }

  /**
   * Read-only P&L calculation for a specific month
   * 
   * This endpoint calculates total income and expenses for a specific month
   * but does NOT update the database. It's used for real-time P&L preview
   * and analysis.
   * 
   * @param month - Month in numeric format (e.g., '01', '02', '03', '12')
   * @param year - Year in YYYY format (e.g., '2024')
   * @returns Detailed P&L calculation with income, expenses, and net profit
   * 
   * Required Permissions: revenues_permission
   * Required Department: Accounts
   */
  @Get('pnl/calculate/:month/:year')
  @UseGuards(JwtAuthGuard, RolesGuard, DepartmentsGuard, PermissionsGuard)
  @Departments('Accounts')
  @Permissions(PermissionName.revenues_permission)
  @ApiOperation({ summary: 'Preview P&L for a specific month' })
  @ApiParam({ name: 'month', description: 'Month in numeric format (01-12)', example: '09' })
  @ApiParam({ name: 'year', description: 'Year in YYYY format', example: '2025' })
  @ApiResponse({ status: 200, description: 'P&L preview retrieved successfully', type: PnLResponseDto })
  async calculatePnLPreview(
    @Param('month') month: string,
    @Param('year') year: string
  ): Promise<PnLResponseDto> {
    console.log('Accountant controller - P&L preview endpoint called for:', month, year);

    // Validate parameters
    if (!month || !year) {
      throw new BadRequestException('Month and year parameters are required');
    }

    try {
      const result = await this.accountantService.calculatePnLPreview(month, year);
      return result;
    } catch (error) {
      console.error('Error in accountant controller P&L preview:', error);
      throw error;
    }
  }

  /**
   * P&L calculation with category breakdown for a specific month
   * 
   * This endpoint calculates P&L with detailed breakdown by category for a specific month
   * but does NOT update the database. It's used for detailed financial analysis and reporting.
   * 
   * @param month - Month in numeric format (e.g., '01', '02', '03', '12')
   * @param year - Year in YYYY format (e.g., '2024')
   * @returns Detailed P&L calculation with category breakdown for income and expenses
   * 
   * Required Permissions: revenues_permission
   * Required Department: Accounts
   */
  @Get('pnl/categories/:month/:year')
  @UseGuards(JwtAuthGuard, RolesGuard, DepartmentsGuard, PermissionsGuard)
  @Departments('Accounts')
  @Permissions(PermissionName.revenues_permission)
  @ApiOperation({ summary: 'Preview P&L with category breakdown for a specific month' })
  @ApiParam({ name: 'month', description: 'Month in numeric format (01-12)', example: '09' })
  @ApiParam({ name: 'year', description: 'Year in YYYY format', example: '2025' })
  @ApiResponse({ status: 200, description: 'P&L with category breakdown retrieved successfully', type: PnLCategoryResponseDto })
  async calculatePnLWithCategories(
    @Param('month') month: string,
    @Param('year') year: string
  ): Promise<PnLCategoryResponseDto> {
    console.log('Accountant controller - P&L category breakdown endpoint called for:', month, year);

    // Validate parameters
    if (!month || !year) {
      throw new BadRequestException('Month and year parameters are required');
    }

    try {
      const result = await this.accountantService.calculatePnLWithCategories(month, year);
      return result;
    } catch (error) {
      console.error('Error in accountant controller P&L category breakdown:', error);
      throw error;
    }
  }
}
