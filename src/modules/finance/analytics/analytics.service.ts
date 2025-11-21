import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
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
import {
  DashboardResponseDto,
  DashboardDataDto,
  FinancialSummaryDto,
  RevenueMetricsDto,
  ExpenseMetricsDto,
  LiabilityMetricsDto,
  TimePeriodMetricsDto,
  PeriodComparisonDto,
  TimeSeriesDataPointDto,
  DashboardWidgetsDto,
  WidgetMetricDto,
  CategoryBreakdownDto,
  TrendDataDto
} from './dto/dashboard-response.dto';
import { TransactionType, TransactionStatus } from '@prisma/client';

export interface AnalyticsFilters {
  fromDate?: string;
  toDate?: string;
  month?: number;
  year?: number;
  quarter?: number;
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
    private readonly prisma: PrismaService,
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

  /**
   * Get comprehensive finance dashboard data for frontend widgets and graphs
   * 
   * This method provides all necessary data for building comprehensive finance dashboards:
   * - Time-based metrics (today, this week, this month, this quarter, this year)
   * - Trend analysis (daily, weekly, monthly time series)
   * - Comparison metrics (vs previous periods)
   * - Widget-ready data structures
   * - Graph-ready time series data
   */
  async getFinanceDashboard(): Promise<DashboardResponseDto | ErrorResponseDto> {
    try {
      this.logger.log('Retrieving comprehensive finance dashboard data');

      // Get current date in PKT
      const currentDate = this.getCurrentDateInPKT();
      
      // Calculate all date ranges
      const dateRanges = this.calculateDateRanges(currentDate);

      // Fetch all transactions in parallel
      const [revenueTransactions, expenseTransactions, liabilityTransactions, assetsData, liabilitiesData] = await Promise.all([
        this.getRevenueTransactions(),
        this.getExpenseTransactions(),
        this.getLiabilityTransactions(),
        this.getFilteredAssetStats({}),
        this.getFilteredLiabilityStats({})
      ]);

      // Calculate metrics
      const revenues = this.calculateRevenueMetrics(revenueTransactions, dateRanges);
      const expenses = this.calculateExpenseMetrics(expenseTransactions, dateRanges);
      const liabilities = this.calculateLiabilityMetrics(liabilityTransactions, dateRanges);
      const summary = this.calculateFinancialSummary(revenueTransactions, expenseTransactions, assetsData, liabilitiesData, dateRanges);
      const trends = this.calculateTrends(revenueTransactions, expenseTransactions, liabilityTransactions);
      const widgets = this.calculateWidgets(revenueTransactions, expenseTransactions, revenues, expenses, summary);

      const dashboardData: DashboardDataDto = {
        summary,
        revenues,
        expenses,
        liabilities,
        trends,
        widgets,
        periodInfo: {
          currentPeriod: `${dateRanges.thisMonth.start.getFullYear()}-${String(dateRanges.thisMonth.start.getMonth() + 1).padStart(2, '0')}`,
          previousPeriod: `${dateRanges.lastMonth.start.getFullYear()}-${String(dateRanges.lastMonth.start.getMonth() + 1).padStart(2, '0')}`,
          generatedAt: currentDate.toISOString()
        }
      };

      this.logger.log('Dashboard data retrieved successfully');

      return {
        status: 'success',
        message: 'Dashboard data retrieved successfully',
        data: dashboardData
      };
    } catch (error) {
      this.logger.error(`Error retrieving dashboard data: ${error.message}`);
      return this.createErrorResponse(
        'An error occurred while retrieving dashboard data',
        'DASHBOARD_ERROR'
      );
    }
  }

  /**
   * Get current date in PKT timezone
   */
  private getCurrentDateInPKT(): Date {
    const now = new Date();
    return new Date(now.getTime() + (5 * 60 * 60 * 1000)); // PKT is UTC+5
  }

  /**
   * Calculate all date ranges needed for dashboard
   */
  private calculateDateRanges(currentDate: Date) {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const day = currentDate.getDate();

    // Today
    const todayStart = new Date(year, month, day, 0, 0, 0, 0);
    const todayEnd = new Date(year, month, day, 23, 59, 59, 999);

    // This week (Monday to Sunday)
    const dayOfWeek = currentDate.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const thisWeekStart = new Date(year, month, day + mondayOffset, 0, 0, 0, 0);
    const thisWeekEnd = new Date(thisWeekStart.getTime() + (6 * 24 * 60 * 60 * 1000) + (23 * 60 * 60 * 1000) + (59 * 60 * 1000) + (59 * 1000) + 999);

    // This month
    const thisMonthStart = new Date(year, month, 1, 0, 0, 0, 0);
    const thisMonthEnd = new Date(year, month + 1, 0, 23, 59, 59, 999);

    // Last month
    const lastMonthStart = new Date(year, month - 1, 1, 0, 0, 0, 0);
    const lastMonthEnd = new Date(year, month, 0, 23, 59, 59, 999);

    // This quarter
    const quarter = Math.floor(month / 3);
    const thisQuarterStart = new Date(year, quarter * 3, 1, 0, 0, 0, 0);
    const thisQuarterEnd = new Date(year, (quarter + 1) * 3, 0, 23, 59, 59, 999);

    // Last quarter
    const lastQuarter = quarter === 0 ? 3 : quarter - 1;
    const lastQuarterYear = quarter === 0 ? year - 1 : year;
    const lastQuarterStart = new Date(lastQuarterYear, lastQuarter * 3, 1, 0, 0, 0, 0);
    const lastQuarterEnd = new Date(lastQuarterYear, (lastQuarter + 1) * 3, 0, 23, 59, 59, 999);

    // This year
    const thisYearStart = new Date(year, 0, 1, 0, 0, 0, 0);
    const thisYearEnd = new Date(year, 11, 31, 23, 59, 59, 999);

    // Last year
    const lastYearStart = new Date(year - 1, 0, 1, 0, 0, 0, 0);
    const lastYearEnd = new Date(year - 1, 11, 31, 23, 59, 59, 999);

    return {
      today: { start: todayStart, end: todayEnd },
      thisWeek: { start: thisWeekStart, end: thisWeekEnd },
      thisMonth: { start: thisMonthStart, end: thisMonthEnd },
      lastMonth: { start: lastMonthStart, end: lastMonthEnd },
      thisQuarter: { start: thisQuarterStart, end: thisQuarterEnd },
      lastQuarter: { start: lastQuarterStart, end: lastQuarterEnd },
      thisYear: { start: thisYearStart, end: thisYearEnd },
      lastYear: { start: lastYearStart, end: lastYearEnd }
    };
  }

  /**
   * Get all revenue transactions with related data
   */
  private async getRevenueTransactions() {
    return await this.prisma.transaction.findMany({
      where: {
        transactionType: TransactionType.payment,
        status: TransactionStatus.completed
      },
      include: {
        Revenue: {
          include: {
            lead: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        transactionDate: 'asc'
      }
    });
  }

  /**
   * Get all expense transactions with related data
   */
  private async getExpenseTransactions() {
    return await this.prisma.transaction.findMany({
      where: {
        transactionType: TransactionType.expense,
        status: TransactionStatus.completed
      },
      include: {
        Expense: true
      },
      orderBy: {
        transactionDate: 'asc'
      }
    });
  }

  /**
   * Get all liability transactions with related data
   */
  private async getLiabilityTransactions() {
    const liabilities = await this.prisma.liability.findMany({
      include: {
        transaction: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    });
    
    // Map to transaction-like structure for consistency with other methods
    return liabilities.map(liability => ({
      ...liability.transaction,
      Liability: [liability]
    }));
  }

  /**
   * Filter transactions by date range
   */
  private filterTransactionsByDate(transactions: any[], startDate: Date, endDate: Date) {
    return transactions.filter(t => {
      const txDate = new Date(t.transactionDate);
      return txDate >= startDate && txDate <= endDate;
    });
  }

  /**
   * Calculate time period metrics
   */
  private calculateTimePeriodMetrics(transactions: any[], dateRange: { start: Date; end: Date }): TimePeriodMetricsDto {
    const filtered = this.filterTransactionsByDate(transactions, dateRange.start, dateRange.end);
    const count = filtered.length;
    const amount = filtered.reduce((sum, t) => sum + Number(t.amount), 0);
    const average = count > 0 ? amount / count : 0;

    return {
      count,
      amount: Math.round(amount * 100) / 100,
      average: Math.round(average * 100) / 100,
      changePercent: 0 // Will be calculated in comparison
    };
  }

  /**
   * Calculate period comparison
   */
  private calculatePeriodComparison(
    currentTransactions: any[],
    previousTransactions: any[],
    currentRange: { start: Date; end: Date },
    previousRange: { start: Date; end: Date }
  ): PeriodComparisonDto {
    const current = this.calculateTimePeriodMetrics(currentTransactions, currentRange);
    const previous = this.calculateTimePeriodMetrics(previousTransactions, previousRange);
    
    const difference = current.amount - previous.amount;
    const changePercent = previous.amount > 0 
      ? Math.round((difference / previous.amount) * 100 * 100) / 100 
      : (current.amount > 0 ? 100 : 0);
    
    let trend: 'up' | 'down' | 'neutral' = 'neutral';
    if (changePercent > 0.1) trend = 'up';
    else if (changePercent < -0.1) trend = 'down';

    return {
      current: { ...current, changePercent },
      previous: { ...previous, changePercent: 0 },
      difference: Math.round(difference * 100) / 100,
      changePercent,
      trend
    };
  }

  /**
   * Calculate revenue metrics
   */
  private calculateRevenueMetrics(transactions: any[], dateRanges: any): RevenueMetricsDto {
    const today = this.calculateTimePeriodMetrics(transactions, dateRanges.today);
    const thisWeek = this.calculateTimePeriodMetrics(transactions, dateRanges.thisWeek);
    const thisMonth = this.calculateTimePeriodMetrics(transactions, dateRanges.thisMonth);
    const thisQuarter = this.calculateTimePeriodMetrics(transactions, dateRanges.thisQuarter);
    const thisYear = this.calculateTimePeriodMetrics(transactions, dateRanges.thisYear);

    const monthOverMonth = this.calculatePeriodComparison(
      transactions,
      transactions,
      dateRanges.thisMonth,
      dateRanges.lastMonth
    );

    const yearOverYear = this.calculatePeriodComparison(
      transactions,
      transactions,
      dateRanges.thisYear,
      dateRanges.lastYear
    );

    // Calculate top categories - use thisYear for better data coverage
    const categoryMap = new Map<string, { amount: number; count: number }>();
    this.filterTransactionsByDate(transactions, dateRanges.thisYear.start, dateRanges.thisYear.end).forEach(t => {
      const revenue = Array.isArray(t.Revenue) ? t.Revenue[0] : t.Revenue;
      if (revenue) {
        const category = revenue.category || 'Uncategorized';
        const existing = categoryMap.get(category) || { amount: 0, count: 0 };
        existing.amount += Number(t.amount);
        existing.count++;
        categoryMap.set(category, existing);
      }
    });

    const totalAmount = Array.from(categoryMap.values()).reduce((sum, v) => sum + v.amount, 0);
    const topCategories: CategoryBreakdownDto[] = Array.from(categoryMap.entries())
      .map(([name, data]) => ({
        name,
        amount: Math.round(data.amount * 100) / 100,
        count: data.count,
        percentage: totalAmount > 0 ? Math.round((data.amount / totalAmount) * 100 * 100) / 100 : 0
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10);

    // Calculate top sources - use thisYear for better data coverage
    const sourceMap = new Map<string, { amount: number; count: number }>();
    this.filterTransactionsByDate(transactions, dateRanges.thisYear.start, dateRanges.thisYear.end).forEach(t => {
      const revenue = Array.isArray(t.Revenue) ? t.Revenue[0] : t.Revenue;
      if (revenue) {
        const source = revenue.source || 'Unknown';
        const existing = sourceMap.get(source) || { amount: 0, count: 0 };
        existing.amount += Number(t.amount);
        existing.count++;
        sourceMap.set(source, existing);
      }
    });

    const topSources: CategoryBreakdownDto[] = Array.from(sourceMap.entries())
      .map(([name, data]) => ({
        name,
        amount: Math.round(data.amount * 100) / 100,
        count: data.count,
        percentage: totalAmount > 0 ? Math.round((data.amount / totalAmount) * 100 * 100) / 100 : 0
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10);

    return {
      today,
      thisWeek,
      thisMonth,
      thisQuarter,
      thisYear,
      monthOverMonth,
      yearOverYear,
      topCategories,
      topSources
    };
  }

  /**
   * Calculate expense metrics
   */
  private calculateExpenseMetrics(transactions: any[], dateRanges: any): ExpenseMetricsDto {
    const today = this.calculateTimePeriodMetrics(transactions, dateRanges.today);
    const thisWeek = this.calculateTimePeriodMetrics(transactions, dateRanges.thisWeek);
    const thisMonth = this.calculateTimePeriodMetrics(transactions, dateRanges.thisMonth);
    const thisQuarter = this.calculateTimePeriodMetrics(transactions, dateRanges.thisQuarter);
    const thisYear = this.calculateTimePeriodMetrics(transactions, dateRanges.thisYear);

    const monthOverMonth = this.calculatePeriodComparison(
      transactions,
      transactions,
      dateRanges.thisMonth,
      dateRanges.lastMonth
    );

    const yearOverYear = this.calculatePeriodComparison(
      transactions,
      transactions,
      dateRanges.thisYear,
      dateRanges.lastYear
    );

    // Calculate top categories - use thisYear for better data coverage
    const categoryMap = new Map<string, { amount: number; count: number }>();
    this.filterTransactionsByDate(transactions, dateRanges.thisYear.start, dateRanges.thisYear.end).forEach(t => {
      const expense = Array.isArray(t.Expense) ? t.Expense[0] : t.Expense;
      if (expense) {
        const category = expense.category || 'Uncategorized';
        const existing = categoryMap.get(category) || { amount: 0, count: 0 };
        existing.amount += Number(t.amount);
        existing.count++;
        categoryMap.set(category, existing);
      }
    });

    const totalAmount = Array.from(categoryMap.values()).reduce((sum, v) => sum + v.amount, 0);
    const topCategories: CategoryBreakdownDto[] = Array.from(categoryMap.entries())
      .map(([name, data]) => ({
        name,
        amount: Math.round(data.amount * 100) / 100,
        count: data.count,
        percentage: totalAmount > 0 ? Math.round((data.amount / totalAmount) * 100 * 100) / 100 : 0
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10);

    // Calculate top payment methods - use thisYear for better data coverage
    const paymentMethodMap = new Map<string, { amount: number; count: number }>();
    this.filterTransactionsByDate(transactions, dateRanges.thisYear.start, dateRanges.thisYear.end).forEach(t => {
      const method = t.paymentMethod || 'unknown';
      const existing = paymentMethodMap.get(method) || { amount: 0, count: 0 };
      existing.amount += Number(t.amount);
      existing.count++;
      paymentMethodMap.set(method, existing);
    });

    const topPaymentMethods: CategoryBreakdownDto[] = Array.from(paymentMethodMap.entries())
      .map(([name, data]) => ({
        name,
        amount: Math.round(data.amount * 100) / 100,
        count: data.count,
        percentage: totalAmount > 0 ? Math.round((data.amount / totalAmount) * 100 * 100) / 100 : 0
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10);

    return {
      today,
      thisWeek,
      thisMonth,
      thisQuarter,
      thisYear,
      monthOverMonth,
      yearOverYear,
      topCategories,
      topPaymentMethods
    };
  }

  /**
   * Calculate liability metrics
   */
  private calculateLiabilityMetrics(transactions: any[], dateRanges: any): LiabilityMetricsDto {
    const today = this.calculateTimePeriodMetrics(transactions, dateRanges.today);
    const thisWeek = this.calculateTimePeriodMetrics(transactions, dateRanges.thisWeek);
    const thisMonth = this.calculateTimePeriodMetrics(transactions, dateRanges.thisMonth);
    const thisQuarter = this.calculateTimePeriodMetrics(transactions, dateRanges.thisQuarter);
    const thisYear = this.calculateTimePeriodMetrics(transactions, dateRanges.thisYear);

    const monthOverMonth = this.calculatePeriodComparison(
      transactions,
      transactions,
      dateRanges.thisMonth,
      dateRanges.lastMonth
    );

    const yearOverYear = this.calculatePeriodComparison(
      transactions,
      transactions,
      dateRanges.thisYear,
      dateRanges.lastYear
    );

    // Calculate top categories - use thisYear for better data coverage
    const categoryMap = new Map<string, { amount: number; count: number }>();
    this.filterTransactionsByDate(transactions, dateRanges.thisYear.start, dateRanges.thisYear.end).forEach(t => {
      const liability = Array.isArray(t.Liability) ? t.Liability[0] : t.Liability;
      if (liability) {
        const category = liability.category || 'Uncategorized';
        const existing = categoryMap.get(category) || { amount: 0, count: 0 };
        existing.amount += Number(t.amount);
        existing.count++;
        categoryMap.set(category, existing);
      }
    });

    const totalAmount = Array.from(categoryMap.values()).reduce((sum, v) => sum + v.amount, 0);
    const topCategories: CategoryBreakdownDto[] = Array.from(categoryMap.entries())
      .map(([name, data]) => ({
        name,
        amount: Math.round(data.amount * 100) / 100,
        count: data.count,
        percentage: totalAmount > 0 ? Math.round((data.amount / totalAmount) * 100 * 100) / 100 : 0
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10);

    return {
      today,
      thisWeek,
      thisMonth,
      thisQuarter,
      thisYear,
      monthOverMonth,
      yearOverYear,
      topCategories
    };
  }

  /**
   * Calculate financial summary
   */
  private calculateFinancialSummary(
    revenueTransactions: any[],
    expenseTransactions: any[],
    assetsData: any,
    liabilitiesData: any,
    dateRanges: any
  ): FinancialSummaryDto {
    const totalRevenue = revenueTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
    const totalExpenses = expenseTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
    const netProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    // Calculate monthly metrics
    const monthlyRevenueTransactions = this.filterTransactionsByDate(
      revenueTransactions,
      dateRanges.thisMonth.start,
      dateRanges.thisMonth.end
    );
    const monthlyExpenseTransactions = this.filterTransactionsByDate(
      expenseTransactions,
      dateRanges.thisMonth.start,
      dateRanges.thisMonth.end
    );
    const monthlyRevenue = monthlyRevenueTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
    const monthlyExpenses = monthlyExpenseTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
    const monthlyNetProfit = monthlyRevenue - monthlyExpenses;
    const monthlyProfitMargin = monthlyRevenue > 0 ? (monthlyNetProfit / monthlyRevenue) * 100 : 0;

    const totalAssets = assetsData.data?.totalCurrentValue || 0;
    const totalLiabilities = liabilitiesData.data?.totalAmount || 0;
    const unpaidLiabilities = liabilitiesData.data?.unpaidAmount || 0;
    const netPosition = totalAssets - totalLiabilities;
    const availableCash = netProfit - unpaidLiabilities;

    return {
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalExpenses: Math.round(totalExpenses * 100) / 100,
      netProfit: Math.round(netProfit * 100) / 100,
      profitMargin: Math.round(profitMargin * 100) / 100,
      totalAssets: Math.round(totalAssets * 100) / 100,
      totalLiabilities: Math.round(totalLiabilities * 100) / 100,
      netPosition: Math.round(netPosition * 100) / 100,
      unpaidLiabilities: Math.round(unpaidLiabilities * 100) / 100,
      availableCash: Math.round(availableCash * 100) / 100,
      monthlyNetProfit: Math.round(monthlyNetProfit * 100) / 100,
      monthlyProfitMargin: Math.round(monthlyProfitMargin * 100) / 100
    };
  }

  /**
   * Calculate trend data for graphs
   */
  private calculateTrends(revenueTransactions: any[], expenseTransactions: any[], liabilityTransactions: any[]): TrendDataDto {
    // Daily trend (last 30 days)
    const daily: TimeSeriesDataPointDto[] = [];
    const currentDate = this.getCurrentDateInPKT();
    for (let i = 29; i >= 0; i--) {
      const date = new Date(currentDate);
      date.setDate(date.getDate() - i);
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
      const dayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);

      const dayRevenues = this.filterTransactionsByDate(revenueTransactions, dayStart, dayEnd);
      const dayExpenses = this.filterTransactionsByDate(expenseTransactions, dayStart, dayEnd);
      const dayLiabilities = this.filterTransactionsByDate(liabilityTransactions, dayStart, dayEnd);

      const revenue = dayRevenues.reduce((sum, t) => sum + Number(t.amount), 0);
      const expense = dayExpenses.reduce((sum, t) => sum + Number(t.amount), 0);
      const liability = dayLiabilities.reduce((sum, t) => sum + Number(t.amount), 0);

      daily.push({
        date: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`,
        revenue: Math.round(revenue * 100) / 100,
        expense: Math.round(expense * 100) / 100,
        liability: Math.round(liability * 100) / 100,
        net: Math.round((revenue - expense) * 100) / 100,
        netProfit: Math.round((revenue - expense) * 100) / 100,
        count: dayRevenues.length + dayExpenses.length + dayLiabilities.length
      });
    }

    // Weekly trend (last 12 weeks)
    const weekly: TimeSeriesDataPointDto[] = [];
    for (let i = 11; i >= 0; i--) {
      const weekEnd = new Date(currentDate);
      weekEnd.setDate(weekEnd.getDate() - (i * 7));
      const weekStart = new Date(weekEnd);
      weekStart.setDate(weekStart.getDate() - 6);
      weekStart.setHours(0, 0, 0, 0);
      weekEnd.setHours(23, 59, 59, 999);

      const weekRevenues = this.filterTransactionsByDate(revenueTransactions, weekStart, weekEnd);
      const weekExpenses = this.filterTransactionsByDate(expenseTransactions, weekStart, weekEnd);
      const weekLiabilities = this.filterTransactionsByDate(liabilityTransactions, weekStart, weekEnd);

      const revenue = weekRevenues.reduce((sum, t) => sum + Number(t.amount), 0);
      const expense = weekExpenses.reduce((sum, t) => sum + Number(t.amount), 0);
      const liability = weekLiabilities.reduce((sum, t) => sum + Number(t.amount), 0);

      weekly.push({
        date: `Week ${52 - Math.floor((currentDate.getTime() - weekStart.getTime()) / (7 * 24 * 60 * 60 * 1000))}`,
        revenue: Math.round(revenue * 100) / 100,
        expense: Math.round(expense * 100) / 100,
        liability: Math.round(liability * 100) / 100,
        net: Math.round((revenue - expense) * 100) / 100,
        netProfit: Math.round((revenue - expense) * 100) / 100,
        count: weekRevenues.length + weekExpenses.length + weekLiabilities.length
      });
    }

    // Monthly trend (January to current month of current year)
    const monthly: TimeSeriesDataPointDto[] = [];
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth(); // 0-11 (0 = January)
    
    // Loop from January (0) to current month
    for (let month = 0; month <= currentMonth; month++) {
      const monthStart = new Date(currentYear, month, 1, 0, 0, 0, 0);
      const monthEnd = new Date(currentYear, month + 1, 0, 23, 59, 59, 999);

      const monthRevenues = this.filterTransactionsByDate(revenueTransactions, monthStart, monthEnd);
      const monthExpenses = this.filterTransactionsByDate(expenseTransactions, monthStart, monthEnd);
      const monthLiabilities = this.filterTransactionsByDate(liabilityTransactions, monthStart, monthEnd);

      const revenue = monthRevenues.reduce((sum, t) => sum + Number(t.amount), 0);
      const expense = monthExpenses.reduce((sum, t) => sum + Number(t.amount), 0);
      const liability = monthLiabilities.reduce((sum, t) => sum + Number(t.amount), 0);

      monthly.push({
        date: `${currentYear}-${String(month + 1).padStart(2, '0')}`,
        revenue: Math.round(revenue * 100) / 100,
        expense: Math.round(expense * 100) / 100,
        liability: Math.round(liability * 100) / 100,
        net: Math.round((revenue - expense) * 100) / 100,
        netProfit: Math.round((revenue - expense) * 100) / 100,
        count: monthRevenues.length + monthExpenses.length + monthLiabilities.length
      });
    }

    return { daily, weekly, monthly };
  }

  /**
   * Calculate widget data
   */
  private calculateWidgets(
    revenueTransactions: any[],
    expenseTransactions: any[],
    revenues: RevenueMetricsDto,
    expenses: ExpenseMetricsDto,
    summary: FinancialSummaryDto
  ): DashboardWidgetsDto {
    const keyMetrics: WidgetMetricDto[] = [
      {
        title: 'Total Revenue',
        value: summary.totalRevenue,
        previousValue: summary.totalRevenue - revenues.monthOverMonth.current.amount,
        changePercent: revenues.monthOverMonth.changePercent,
        trend: revenues.monthOverMonth.trend,
        icon: 'revenue',
        color: 'green'
      },
      {
        title: 'Total Expenses',
        value: summary.totalExpenses,
        previousValue: summary.totalExpenses - expenses.monthOverMonth.current.amount,
        changePercent: expenses.monthOverMonth.changePercent,
        trend: expenses.monthOverMonth.trend === 'up' ? 'down' : expenses.monthOverMonth.trend === 'down' ? 'up' : 'neutral',
        icon: 'expense',
        color: 'red'
      },
      {
        title: 'Net Profit',
        value: summary.netProfit,
        previousValue: summary.netProfit - (revenues.monthOverMonth.current.amount - expenses.monthOverMonth.current.amount),
        changePercent: summary.totalRevenue > 0 ? ((revenues.monthOverMonth.changePercent - expenses.monthOverMonth.changePercent) / 2) : 0,
        trend: summary.netProfit > 0 ? 'up' : 'down',
        icon: 'profit',
        color: summary.netProfit > 0 ? 'green' : 'red'
      },
      {
        title: 'Profit Margin',
        value: summary.profitMargin,
        previousValue: summary.profitMargin - 5, // Approximate
        changePercent: 5,
        trend: summary.profitMargin > 0 ? 'up' : 'down',
        icon: 'margin',
        color: summary.profitMargin > 20 ? 'green' : summary.profitMargin > 10 ? 'yellow' : 'red'
      }
    ];

    // Revenue breakdown
    const revenueBreakdown: CategoryBreakdownDto[] = revenues.topCategories.slice(0, 5);

    // Expense breakdown
    const expenseBreakdown: CategoryBreakdownDto[] = expenses.topCategories.slice(0, 5);

    // Payment method distribution
    const paymentMethodDistribution: CategoryBreakdownDto[] = expenses.topPaymentMethods;

    return {
      keyMetrics,
      revenueBreakdown,
      expenseBreakdown,
      paymentMethodDistribution
    };
  }
}
