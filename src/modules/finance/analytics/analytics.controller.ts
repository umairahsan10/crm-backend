import { Controller, Get, UseGuards, Query, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { DepartmentsGuard } from 'src/common/guards/departments.guard';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { Departments } from 'src/common/decorators/departments.decorator';
import { Permissions } from 'src/common/decorators/permissions.decorator';
import { PermissionName } from 'src/common/constants/permission.enum';
import { 
  FinanceAnalyticsResponseDto, 
  ErrorResponseDto 
} from './dto/analytics-response.dto';

@ApiTags('Finance Analytics')
@ApiBearerAuth()
@Controller('accountant/analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  /**
   * Get comprehensive finance analytics
   * 
   * This endpoint provides a complete financial overview by aggregating statistics
   * from all finance modules (Assets, Expenses, Revenues, Liabilities) into a single
   * comprehensive analytics dashboard for accountants.
   * 
   * The analytics include:
   * - Financial summary metrics (total income, expenses, assets, liabilities, net position)
   * - Detailed breakdowns by category, payment method, and other dimensions
   * - Monthly trends and this month's activity
   * - Top performers and areas needing attention
   * - Overdue liabilities and assets requiring maintenance
   * 
   * @param fromDate - Optional start date for filtering (YYYY-MM-DD format)
   * @param toDate - Optional end date for filtering (YYYY-MM-DD format)
   * @param month - Optional month for filtering (1-12)
   * @param year - Optional year for filtering (YYYY)
   * @param quarter - Optional quarter for filtering (1-4)
   * @param category - Optional category filter (applies to all modules)
   * @param paymentMethod - Optional payment method filter
   * @param status - Optional status filter (active, inactive, paid, unpaid, etc.)
   * @param employeeId - Optional employee ID filter
   * @param vendorId - Optional vendor ID filter
   * @param clientId - Optional client ID filter
   * @param minAmount - Optional minimum amount filter
   * @param maxAmount - Optional maximum amount filter
   * @returns Comprehensive finance analytics with all metrics
   * 
   * Required Permissions: revenues_permission
   * Required Department: Accounts
   * Admin bypass: No (only accountants can view analytics)
   */
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard, DepartmentsGuard, PermissionsGuard)
  @Departments('Accounts')
  @Permissions(PermissionName.revenues_permission)
  @ApiOperation({ 
    summary: 'Get comprehensive finance analytics with advanced filtering',
    description: 'Retrieves aggregated financial statistics from all finance modules with comprehensive filtering options for accountant dashboard'
  })
  @ApiQuery({ 
    name: 'fromDate', 
    description: 'Start date for filtering (YYYY-MM-DD format)', 
    required: false, 
    example: '2024-01-01' 
  })
  @ApiQuery({ 
    name: 'toDate', 
    description: 'End date for filtering (YYYY-MM-DD format)', 
    required: false, 
    example: '2024-12-31' 
  })
  @ApiQuery({ 
    name: 'month', 
    description: 'Month for filtering (1-12)', 
    required: false, 
    example: 10 
  })
  @ApiQuery({ 
    name: 'year', 
    description: 'Year for filtering (YYYY)', 
    required: false, 
    example: 2024 
  })
  @ApiQuery({ 
    name: 'quarter', 
    description: 'Quarter for filtering (1-4)', 
    required: false, 
    example: 4 
  })
  @ApiQuery({ 
    name: 'category', 
    description: 'Category filter (applies to all modules)', 
    required: false, 
    example: 'Office Supplies' 
  })
  @ApiQuery({ 
    name: 'paymentMethod', 
    description: 'Payment method filter (cash, bank, online)', 
    required: false, 
    example: 'bank' 
  })
  @ApiQuery({ 
    name: 'status', 
    description: 'Status filter (active, inactive, paid, unpaid, etc.)', 
    required: false, 
    example: 'active' 
  })
  @ApiQuery({ 
    name: 'employeeId', 
    description: 'Employee ID filter', 
    required: false, 
    example: 123 
  })
  @ApiQuery({ 
    name: 'vendorId', 
    description: 'Vendor ID filter', 
    required: false, 
    example: 456 
  })
  @ApiQuery({ 
    name: 'clientId', 
    description: 'Client ID filter', 
    required: false, 
    example: 789 
  })
  @ApiQuery({ 
    name: 'minAmount', 
    description: 'Minimum amount filter', 
    required: false, 
    example: 100 
  })
  @ApiQuery({ 
    name: 'maxAmount', 
    description: 'Maximum amount filter', 
    required: false, 
    example: 10000 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Finance analytics retrieved successfully', 
    type: FinanceAnalyticsResponseDto,
    schema: {
      example: {
        status: 'success',
        message: 'Finance analytics retrieved successfully',
        data: {
          summary: {
            totalIncome: 150000,
            totalExpenses: 75000,
            totalAssetValue: 200000,
            totalLiabilities: 50000,
            paidLiabilities: 30000,
            unpaidLiabilities: 20000,
            netPosition: 55000
          },
          assets: {
            totalAssets: 25,
            totalPurchaseValue: 180000,
            totalCurrentValue: 200000,
            totalDepreciation: -20000,
            averageDepreciationRate: 11.11,
            thisMonth: { count: 3, totalValue: 25000 },
            byCategory: {
              'Equipment': { count: 10, totalPurchaseValue: 100000, totalCurrentValue: 110000 }
            },
            assetsNeedingAttention: []
          },
          expenses: {
            totalExpenses: 150,
            totalAmount: 75000,
            averageExpense: 500,
            thisMonth: { count: 12, amount: 8000 },
            byCategory: {
              'Office Supplies': { count: 20, amount: 5000 }
            },
            topCategories: [],
            byPaymentMethod: {
              'cash': { count: 50, amount: 25000 }
            },
            byProcessedByRole: {
              'Employee': { count: 100, amount: 50000 }
            }
          },
          revenues: {
            totalRevenue: 80,
            totalAmount: 150000,
            averageRevenue: 1875,
            thisMonth: { count: 8, amount: 15000 },
            byCategory: {
              'Project Revenue': { count: 50, amount: 100000 }
            },
            bySource: {
              'Lead Revenue': { count: 40, amount: 80000 }
            },
            byPaymentMethod: {
              'bank': { count: 60, amount: 120000 }
            },
            topGenerators: []
          },
          liabilities: {
            totalLiabilities: 30,
            totalAmount: 50000,
            paidCount: 18,
            unpaidCount: 12,
            paidAmount: 30000,
            unpaidAmount: 20000,
            byCategory: {
              'Vendor Payments': { count: 15, amount: 25000, paidCount: 10, unpaidCount: 5, paidAmount: 15000, unpaidAmount: 10000 }
            },
            overdueLiabilities: []
          }
        }
      }
    }
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Invalid date format or parameters', 
    type: ErrorResponseDto 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized - JWT token required' 
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Forbidden - Accounts department and revenues_permission required' 
  })
  @ApiResponse({ 
    status: 500, 
    description: 'Internal server error', 
    type: ErrorResponseDto 
  })
  async getFinanceAnalytics(
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
    @Query('month') month?: string,
    @Query('year') year?: string,
    @Query('quarter') quarter?: string,
    @Query('category') category?: string,
    @Query('paymentMethod') paymentMethod?: string,
    @Query('status') status?: string,
    @Query('employeeId') employeeId?: string,
    @Query('vendorId') vendorId?: string,
    @Query('clientId') clientId?: string,
    @Query('minAmount') minAmount?: string,
    @Query('maxAmount') maxAmount?: string,
  ): Promise<FinanceAnalyticsResponseDto | ErrorResponseDto> {
    // Validate all filter parameters
    this.validateFilterParameters({
      fromDate,
      toDate,
      month,
      year,
      quarter,
      employeeId,
      vendorId,
      clientId,
      minAmount,
      maxAmount
    });

    try {
      const result = await this.analyticsService.getFinanceAnalytics({
        fromDate,
        toDate,
        month: month ? parseInt(month) : undefined,
        year: year ? parseInt(year) : undefined,
        quarter: quarter ? parseInt(quarter) : undefined,
        category,
        paymentMethod,
        status,
        employeeId: employeeId ? parseInt(employeeId) : undefined,
        vendorId: vendorId ? parseInt(vendorId) : undefined,
        clientId: clientId ? parseInt(clientId) : undefined,
        minAmount: minAmount ? parseFloat(minAmount) : undefined,
        maxAmount: maxAmount ? parseFloat(maxAmount) : undefined,
      });
      return result;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  /**
   * Validate all filter parameters
   */
  private validateFilterParameters(params: {
    fromDate?: string;
    toDate?: string;
    month?: string;
    year?: string;
    quarter?: string;
    employeeId?: string;
    vendorId?: string;
    clientId?: string;
    minAmount?: string;
    maxAmount?: string;
  }): void {
    // Validate date formats
    if (params.fromDate && !this.isValidDate(params.fromDate)) {
      throw new BadRequestException('Invalid fromDate format. Use YYYY-MM-DD format.');
    }

    if (params.toDate && !this.isValidDate(params.toDate)) {
      throw new BadRequestException('Invalid toDate format. Use YYYY-MM-DD format.');
    }

    // Validate date range if both dates are provided
    if (params.fromDate && params.toDate) {
      const from = new Date(params.fromDate);
      const to = new Date(params.toDate);
      
      if (from > to) {
        throw new BadRequestException('fromDate cannot be later than toDate.');
      }
    }

    // Validate month (1-12)
    if (params.month) {
      const monthNum = parseInt(params.month);
      if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
        throw new BadRequestException('Invalid month value. Month must be between 1 and 12.');
      }
    }

    // Validate year (reasonable range)
    if (params.year) {
      const yearNum = parseInt(params.year);
      const currentYear = new Date().getFullYear();
      if (isNaN(yearNum) || yearNum < 1900 || yearNum > currentYear + 10) {
        throw new BadRequestException(`Invalid year value. Year must be between 1900 and ${currentYear + 10}.`);
      }
    }

    // Validate quarter (1-4)
    if (params.quarter) {
      const quarterNum = parseInt(params.quarter);
      if (isNaN(quarterNum) || quarterNum < 1 || quarterNum > 4) {
        throw new BadRequestException('Invalid quarter value. Quarter must be between 1 and 4.');
      }
    }

    // Validate ID parameters (must be positive integers)
    if (params.employeeId) {
      const id = parseInt(params.employeeId);
      if (isNaN(id) || id <= 0) {
        throw new BadRequestException('Invalid employeeId. Must be a positive integer.');
      }
    }

    if (params.vendorId) {
      const id = parseInt(params.vendorId);
      if (isNaN(id) || id <= 0) {
        throw new BadRequestException('Invalid vendorId. Must be a positive integer.');
      }
    }

    if (params.clientId) {
      const id = parseInt(params.clientId);
      if (isNaN(id) || id <= 0) {
        throw new BadRequestException('Invalid clientId. Must be a positive integer.');
      }
    }

    // Validate amount parameters
    if (params.minAmount) {
      const amount = parseFloat(params.minAmount);
      if (isNaN(amount) || amount < 0) {
        throw new BadRequestException('Invalid minAmount. Must be a non-negative number.');
      }
    }

    if (params.maxAmount) {
      const amount = parseFloat(params.maxAmount);
      if (isNaN(amount) || amount < 0) {
        throw new BadRequestException('Invalid maxAmount. Must be a non-negative number.');
      }
    }

    // Validate amount range
    if (params.minAmount && params.maxAmount) {
      const minAmount = parseFloat(params.minAmount);
      const maxAmount = parseFloat(params.maxAmount);
      if (minAmount > maxAmount) {
        throw new BadRequestException('minAmount cannot be greater than maxAmount.');
      }
    }
  }

  /**
   * Validate date format (YYYY-MM-DD)
   */
  private isValidDate(dateString: string): boolean {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateString)) {
      return false;
    }

    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime()) && date.toISOString().split('T')[0] === dateString;
  }
}
