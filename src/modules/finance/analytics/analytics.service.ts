import { Injectable, Logger } from '@nestjs/common';
import { AssetsService } from '../accountant/assets/assets.service';
import { ExpenseService } from '../accountant/expense/expense.service';
import { RevenueService } from '../accountant/revenue/revenue.service';
import { LiabilitiesService } from '../accountant/liabilities/liabilities.service';
import {
  FinanceAnalyticsResponseDto,
  FinanceAnalyticsDataDto,
  SummaryStatsDto,
  AssetStatsDto,
  ExpenseStatsDto,
  RevenueStatsDto,
  LiabilityStatsDto,
  ErrorResponseDto
} from './dto/analytics-response.dto';

export interface AnalyticsFilters {
  fromDate?: string;
  toDate?: string;
  month?: number;
  year?: number;
  quarter?: number;
  category?: string;
  paymentMethod?: string;
  status?: string;
  employeeId?: number;
  vendorId?: number;
  clientId?: number;
  minAmount?: number;
  maxAmount?: number;
}

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    private readonly assetsService: AssetsService,
    private readonly expenseService: ExpenseService,
    private readonly revenueService: RevenueService,
    private readonly liabilitiesService: LiabilitiesService,
  ) {}

  /**
   * Get comprehensive finance analytics
   * 
   * This method aggregates statistics from all finance modules (Assets, Expenses, Revenues, Liabilities)
   * and provides a complete financial overview for the accountant dashboard.
   * 
   * @param fromDate - Optional start date for filtering (ISO string)
   * @param toDate - Optional end date for filtering (ISO string)
   * @returns Comprehensive finance analytics with all metrics
   */
  async getFinanceAnalytics(
    filters: AnalyticsFilters = {}
  ): Promise<FinanceAnalyticsResponseDto | ErrorResponseDto> {
    try {
      this.logger.log('Retrieving comprehensive finance analytics');

      // Get statistics from all finance services with filtering
      const [
        assetsResult,
        expensesResult,
        revenuesResult,
        liabilitiesResult
      ] = await Promise.all([
        this.getFilteredAssetStats(filters),
        this.getFilteredExpenseStats(filters),
        this.getFilteredRevenueStats(filters),
        this.getFilteredLiabilityStats(filters)
      ]);

      // Check if any service returned an error
      if (assetsResult.status === 'error') {
        this.logger.error('Failed to retrieve asset statistics');
        return this.createErrorResponse('Failed to retrieve asset statistics', 'ASSETS_ERROR');
      }

      if (expensesResult.status === 'error') {
        this.logger.error('Failed to retrieve expense statistics');
        return this.createErrorResponse('Failed to retrieve expense statistics', 'EXPENSES_ERROR');
      }

      if (revenuesResult.status === 'error') {
        this.logger.error('Failed to retrieve revenue statistics');
        return this.createErrorResponse('Failed to retrieve revenue statistics', 'REVENUES_ERROR');
      }

      if (liabilitiesResult.status === 'error') {
        this.logger.error('Failed to retrieve liability statistics');
        return this.createErrorResponse('Failed to retrieve liability statistics', 'LIABILITIES_ERROR');
      }

      // Extract data from service responses
      const assetsData = assetsResult.data;
      const expensesData = expensesResult.data;
      const revenuesData = revenuesResult.data;
      const liabilitiesData = liabilitiesResult.data;

      // Calculate summary metrics
      const summary = this.calculateSummaryMetrics(
        assetsData,
        expensesData,
        revenuesData,
        liabilitiesData
      );

      // Map individual module statistics
      const assets = this.mapAssetStats(assetsData);
      const expenses = this.mapExpenseStats(expensesData);
      const revenues = this.mapRevenueStats(revenuesData);
      const liabilities = this.mapLiabilityStats(liabilitiesData);

      // Create comprehensive analytics data
      const analyticsData: FinanceAnalyticsDataDto = {
        summary,
        assets,
        expenses,
        revenues,
        liabilities
      };

      this.logger.log('Finance analytics retrieved successfully');

      return {
        status: 'success',
        message: 'Finance analytics retrieved successfully',
        data: analyticsData
      };

    } catch (error) {
      this.logger.error(`Error retrieving finance analytics: ${error.message}`);
      return this.createErrorResponse(
        'An error occurred while retrieving finance analytics',
        'ANALYTICS_ERROR'
      );
    }
  }

  /**
   * Calculate summary financial metrics
   */
  private calculateSummaryMetrics(
    assetsData: any,
    expensesData: any,
    revenuesData: any,
    liabilitiesData: any
  ): SummaryStatsDto {
    const totalIncome = revenuesData.totalAmount || 0;
    const totalExpenses = expensesData.totalAmount || 0;
    const totalAssetValue = assetsData.totalCurrentValue || 0;
    const totalLiabilities = liabilitiesData.totalAmount || 0;
    const paidLiabilities = liabilitiesData.paidAmount || 0;
    const unpaidLiabilities = liabilitiesData.unpaidAmount || 0;
    
    // Net position = Income - Expenses - Unpaid Liabilities
    const netPosition = totalIncome - totalExpenses - unpaidLiabilities;

    return {
      totalIncome: Math.round(totalIncome * 100) / 100,
      totalExpenses: Math.round(totalExpenses * 100) / 100,
      totalAssetValue: Math.round(totalAssetValue * 100) / 100,
      totalLiabilities: Math.round(totalLiabilities * 100) / 100,
      paidLiabilities: Math.round(paidLiabilities * 100) / 100,
      unpaidLiabilities: Math.round(unpaidLiabilities * 100) / 100,
      netPosition: Math.round(netPosition * 100) / 100
    };
  }

  /**
   * Map asset statistics to DTO
   */
  private mapAssetStats(assetsData: any): AssetStatsDto {
    return {
      totalAssets: assetsData.totalAssets || 0,
      totalPurchaseValue: Math.round((assetsData.totalPurchaseValue || 0) * 100) / 100,
      totalCurrentValue: Math.round((assetsData.totalCurrentValue || 0) * 100) / 100,
      totalDepreciation: Math.round((assetsData.totalDepreciation || 0) * 100) / 100,
      averageDepreciationRate: Math.round((assetsData.averageDepreciationRate || 0) * 100) / 100,
      thisMonth: {
        count: assetsData.thisMonth?.count || 0,
        totalValue: Math.round((assetsData.thisMonth?.totalValue || 0) * 100) / 100
      },
      byCategory: assetsData.byCategory || {},
      assetsNeedingAttention: assetsData.assetsNeedingAttention || []
    };
  }

  /**
   * Map expense statistics to DTO
   */
  private mapExpenseStats(expensesData: any): ExpenseStatsDto {
    return {
      totalExpenses: expensesData.totalExpenses || 0,
      totalAmount: Math.round((expensesData.totalAmount || 0) * 100) / 100,
      averageExpense: Math.round((expensesData.averageExpense || 0) * 100) / 100,
      thisMonth: {
        count: expensesData.thisMonth?.count || 0,
        amount: Math.round((expensesData.thisMonth?.amount || 0) * 100) / 100
      },
      byCategory: expensesData.byCategory || {},
      topCategories: expensesData.topCategories || [],
      byPaymentMethod: expensesData.byPaymentMethod || {},
      byProcessedByRole: expensesData.byProcessedByRole || {}
    };
  }

  /**
   * Map revenue statistics to DTO
   */
  private mapRevenueStats(revenuesData: any): RevenueStatsDto {
    return {
      totalRevenue: revenuesData.totalRevenue || 0,
      totalAmount: Math.round((revenuesData.totalAmount || 0) * 100) / 100,
      averageRevenue: Math.round((revenuesData.averageRevenue || 0) * 100) / 100,
      thisMonth: {
        count: revenuesData.thisMonth?.count || 0,
        amount: Math.round((revenuesData.thisMonth?.amount || 0) * 100) / 100
      },
      byCategory: revenuesData.byCategory || {},
      bySource: revenuesData.bySource || {},
      byPaymentMethod: revenuesData.byPaymentMethod || {},
      topGenerators: revenuesData.topGenerators || []
    };
  }

  /**
   * Map liability statistics to DTO
   */
  private mapLiabilityStats(liabilitiesData: any): LiabilityStatsDto {
    return {
      totalLiabilities: liabilitiesData.totalLiabilities || 0,
      totalAmount: Math.round((liabilitiesData.totalAmount || 0) * 100) / 100,
      paidCount: liabilitiesData.paidCount || 0,
      unpaidCount: liabilitiesData.unpaidCount || 0,
      paidAmount: Math.round((liabilitiesData.paidAmount || 0) * 100) / 100,
      unpaidAmount: Math.round((liabilitiesData.unpaidAmount || 0) * 100) / 100,
      byCategory: liabilitiesData.byCategory || {},
      overdueLiabilities: liabilitiesData.overdueLiabilities || []
    };
  }

  /**
   * Create error response
   */
  private createErrorResponse(message: string, errorCode: string): ErrorResponseDto {
    return {
      status: 'error',
      message,
      error_code: errorCode
    };
  }

  /**
   * Get filtered asset statistics
   */
  private async getFilteredAssetStats(filters: AnalyticsFilters): Promise<any> {
    try {
      // For now, return the basic stats and apply filtering in the response
      // In a full implementation, you would modify the Prisma queries in AssetsService
      const result = await this.assetsService.getAssetStats();
      
      if (result.status === 'success' && result.data) {
        // Apply filters to the data
        let filteredData = { ...result.data };
        
        // Apply amount filters
        if (filters.minAmount !== undefined || filters.maxAmount !== undefined) {
          // This would require modifying the underlying service queries
          // For now, we'll return the unfiltered data
        }
        
        return {
          status: 'success',
          data: filteredData
        };
      }
      
      return result;
    } catch (error) {
      this.logger.error('Error getting filtered asset stats:', error);
      return {
        status: 'error',
        message: 'Failed to retrieve filtered asset statistics'
      };
    }
  }

  /**
   * Get filtered expense statistics
   */
  private async getFilteredExpenseStats(filters: AnalyticsFilters): Promise<any> {
    try {
      const result = await this.expenseService.getExpenseStats();
      
      if (result.status === 'success' && result.data) {
        let filteredData = { ...result.data };
        
        // Apply filters to the data
        if (filters.minAmount !== undefined || filters.maxAmount !== undefined) {
          // This would require modifying the underlying service queries
        }
        
        return {
          status: 'success',
          data: filteredData
        };
      }
      
      return result;
    } catch (error) {
      this.logger.error('Error getting filtered expense stats:', error);
      return {
        status: 'error',
        message: 'Failed to retrieve filtered expense statistics'
      };
    }
  }

  /**
   * Get filtered revenue statistics
   */
  private async getFilteredRevenueStats(filters: AnalyticsFilters): Promise<any> {
    try {
      const result = await this.revenueService.getRevenueStats();
      
      if (result.status === 'success' && result.data) {
        let filteredData = { ...result.data };
        
        // Apply filters to the data
        if (filters.minAmount !== undefined || filters.maxAmount !== undefined) {
          // This would require modifying the underlying service queries
        }
        
        return {
          status: 'success',
          data: filteredData
        };
      }
      
      return result;
    } catch (error) {
      this.logger.error('Error getting filtered revenue stats:', error);
      return {
        status: 'error',
        message: 'Failed to retrieve filtered revenue statistics'
      };
    }
  }

  /**
   * Get filtered liability statistics
   */
  private async getFilteredLiabilityStats(filters: AnalyticsFilters): Promise<any> {
    try {
      const result = await this.liabilitiesService.getLiabilityStats();
      
      if (result.status === 'success' && result.data) {
        let filteredData = { ...result.data };
        
        // Apply filters to the data
        if (filters.minAmount !== undefined || filters.maxAmount !== undefined) {
          // This would require modifying the underlying service queries
        }
        
        return {
          status: 'success',
          data: filteredData
        };
      }
      
      return result;
    } catch (error) {
      this.logger.error('Error getting filtered liability stats:', error);
      return {
        status: 'error',
        message: 'Failed to retrieve filtered liability statistics'
      };
    }
  }
}
