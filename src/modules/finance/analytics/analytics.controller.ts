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
    summary: 'Get comprehensive finance analytics',
    description: 'Retrieves aggregated financial statistics from all finance modules for accountant dashboard'
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
    @Query('toDate') toDate?: string
  ): Promise<FinanceAnalyticsResponseDto | ErrorResponseDto> {
    // Validate date formats if provided
    if (fromDate && !this.isValidDate(fromDate)) {
      throw new BadRequestException('Invalid fromDate format. Use YYYY-MM-DD format.');
    }

    if (toDate && !this.isValidDate(toDate)) {
      throw new BadRequestException('Invalid toDate format. Use YYYY-MM-DD format.');
    }

    // Validate date range if both dates are provided
    if (fromDate && toDate) {
      const from = new Date(fromDate);
      const to = new Date(toDate);
      
      if (from > to) {
        throw new BadRequestException('fromDate cannot be later than toDate.');
      }
    }

    return await this.analyticsService.getFinanceAnalytics(fromDate, toDate);
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
