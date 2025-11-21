import { Controller, Get, UseGuards, Request, Query, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DepartmentsGuard } from '../../common/guards/departments.guard';
import { Departments } from '../../common/decorators/departments.decorator';
import { DashboardService } from './dashboard.service';
import { MetricGridResponseDto } from './dto/metric-grid-response.dto';
import { ActivityFeedResponseDto } from './dto/activity-feed-response.dto';
import { HrRequestsResponseDto } from './dto/hr-request.dto';
import { AttendanceTrendsResponseDto } from './dto/attendance-trends-response.dto';
import { EmployeeCountByDepartmentResponseDto } from './dto/employee-count-by-department.dto';
import { ProjectsResponseDto } from './dto/project-response.dto';
import { SalesTrendsResponseDto } from './dto/sales-trends-response.dto';
import { TopPerformersResponseDto } from './dto/top-performers-response.dto';
import { CrossDepartmentTopPerformersResponseDto } from './dto/cross-department-top-performers-response.dto';

@ApiTags('Dashboard')
@ApiBearerAuth()
@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @Get('metric-grid')
  @ApiOperation({ summary: 'Get metric grid - Returns 4 cards based on user department and role' })
  @ApiResponse({ status: 200, description: 'Metric grid retrieved successfully', type: MetricGridResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMetricGrid(@Request() req: any): Promise<MetricGridResponseDto> {
    return await this.dashboardService.getMetricGrid(req.user.id, req.user.type);
  }

  @Get('activity-feed')
  @ApiOperation({ summary: 'Get activity feed - Returns recent activities done by employees in user\'s department' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of activities to return (default: 20)' })
  @ApiResponse({ status: 200, description: 'Activity feed retrieved successfully', type: ActivityFeedResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getActivityFeed(
    @Request() req: any,
    @Query('limit') limit?: number
  ): Promise<ActivityFeedResponseDto> {
    const limitNum = limit ? parseInt(limit.toString()) : 20;
    
    // Use JWT token data directly - no database query needed!
    return await this.dashboardService.getActivityFeed(
      req.user.id,
      req.user.department,  // From JWT token
      req.user.role,         // From JWT token
      req.user.type,         // From JWT token (for Admin check)
      limitNum
    );
  }

  @Get('hr-requests')
  @ApiOperation({ summary: 'Get HR requests - Returns recent HR requests based on user role and department. For Admin: includes both HR-to-Admin and Employee-to-HR requests' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of requests to return (default: 10)' })
  @ApiResponse({ status: 200, description: 'HR requests retrieved successfully', type: HrRequestsResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getHrRequests(
    @Request() req: any,
    @Query('limit') limit?: number
  ): Promise<HrRequestsResponseDto> {
    const limitNum = limit ? parseInt(limit.toString()) : 10;
    
    return await this.dashboardService.getHrRequests(
      req.user.id,
      req.user.department,  // From JWT token
      req.user.role,         // From JWT token
      req.user.type,         // From JWT token (for Admin check)
      limitNum
    );
  }

  @Get('attendance-trends')
  @ApiOperation({ summary: 'Get attendance trends - Returns daily or monthly attendance trends with summary statistics' })
  @ApiQuery({ name: 'period', required: false, type: String, description: 'Period type: daily or monthly (default: daily)', enum: ['daily', 'monthly'] })
  @ApiQuery({ name: 'department', required: false, type: String, description: 'Filter by department (optional, Admin only)' })
  @ApiResponse({ status: 200, description: 'Attendance trends retrieved successfully', type: AttendanceTrendsResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getAttendanceTrends(
    @Request() req: any,
    @Query('period') period?: string,
    @Query('department') department?: string
  ): Promise<AttendanceTrendsResponseDto> {
    const periodType = (period === 'monthly' ? 'monthly' : 'daily') as 'daily' | 'monthly';
    
    return await this.dashboardService.getAttendanceTrends(
      req.user.id,
      req.user.department,  // From JWT token
      req.user.role,         // From JWT token
      req.user.type,         // From JWT token (for Admin check)
      periodType,
      department
    );
  }

  @Get('employee-count-by-department')
  @ApiOperation({ summary: 'Get employee count by department - Returns number of employees in each department' })
  @ApiResponse({ status: 200, description: 'Employee counts retrieved successfully', type: EmployeeCountByDepartmentResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getEmployeeCountByDepartment(): Promise<EmployeeCountByDepartmentResponseDto> {
    return await this.dashboardService.getEmployeeCountByDepartment();
  }

  @Get('current-projects')
  @UseGuards(DepartmentsGuard)
  @Departments('Production')
  @ApiOperation({ summary: 'Get current projects - Returns up to 5 projects: running projects first, then completed projects to fill remaining slots. Accessible by Production department and Admin only.' })
  @ApiResponse({ status: 200, description: 'Projects retrieved successfully', type: ProjectsResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Only Production department and Admin can access this endpoint' })
  async getCurrentProjects(@Request() req: any): Promise<ProjectsResponseDto> {
    return await this.dashboardService.getCurrentProjects(
      req.user.id,
      req.user.role,
      req.user.department,
      req.user.type
    );
  }

  @Get('sales-trends')
  @ApiOperation({ 
    summary: 'Get sales trends - Returns monthly sales trend data based on user role and department',
    description: 'Fetches sales trend data with role-based access control. Sales department managers see all data, unit heads see their unit, team leads see their team, and employees see only their own data.'
  })
  @ApiQuery({ name: 'period', required: false, type: String, description: 'Time period: daily, weekly, monthly, quarterly, yearly (default: monthly)', enum: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'] })
  @ApiQuery({ name: 'fromDate', required: false, type: String, description: 'Start date in ISO 8601 format (YYYY-MM-DD). Default: last 12 months for monthly period' })
  @ApiQuery({ name: 'toDate', required: false, type: String, description: 'End date in ISO 8601 format (YYYY-MM-DD). Default: current date' })
  @ApiQuery({ name: 'unit', required: false, type: String, description: 'Filter by specific sales unit name (only for department managers)' })
  @ApiResponse({ status: 200, description: 'Sales trends retrieved successfully', type: SalesTrendsResponseDto })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid query parameters' })
  @ApiResponse({ status: 401, description: 'Unauthorized - JWT token required' })
  @ApiResponse({ status: 403, description: 'Forbidden - User does not have access to sales data' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getSalesTrends(
    @Request() req: any,
    @Query('period') period?: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
    @Query('unit') unit?: string
  ): Promise<SalesTrendsResponseDto> {
    // Validate period
    const validPeriods = ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'];
    const periodType = (period && validPeriods.includes(period) ? period : 'monthly') as 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';

    // Validate date range if provided
    if (fromDate && toDate) {
      const from = new Date(fromDate);
      const to = new Date(toDate);
      if (isNaN(from.getTime()) || isNaN(to.getTime())) {
        throw new BadRequestException('Invalid date format. Dates must be in ISO 8601 format (YYYY-MM-DD)');
      }
      if (from > to) {
        throw new BadRequestException('fromDate must be before toDate');
      }
    }

    return await this.dashboardService.getSalesTrends(
      req.user.id,
      req.user.department,
      req.user.role,
      req.user.type,
      periodType,
      fromDate,
      toDate,
      unit
    );
  }

  @Get('top-performers')
  @ApiOperation({ 
    summary: 'Get top performers - Returns top performing team members based on user role and department',
    description: 'Fetches top performing employees with role-based access control. Sales department managers see top performers across all units, unit heads see their unit, team leads see their team, and employees see only their own performance.'
  })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of top performers to return (default: 5, max: 20)' })
  @ApiQuery({ name: 'period', required: false, type: String, description: 'Time period: daily, weekly, monthly, quarterly, yearly (default: monthly)', enum: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'] })
  @ApiQuery({ name: 'fromDate', required: false, type: String, description: 'Start date in ISO 8601 format (YYYY-MM-DD). Default: current period start' })
  @ApiQuery({ name: 'toDate', required: false, type: String, description: 'End date in ISO 8601 format (YYYY-MM-DD). Default: current date' })
  @ApiQuery({ name: 'unit', required: false, type: String, description: 'Filter by specific sales unit name (only for department managers)' })
  @ApiQuery({ name: 'metric', required: false, type: String, description: 'Performance metric for ranking: deals, revenue, conversion_rate, leads (default: deals)', enum: ['deals', 'revenue', 'conversion_rate', 'leads'] })
  @ApiResponse({ status: 200, description: 'Top performers retrieved successfully', type: TopPerformersResponseDto })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid query parameters' })
  @ApiResponse({ status: 401, description: 'Unauthorized - JWT token required' })
  @ApiResponse({ status: 403, description: 'Forbidden - User does not have access to sales performance data' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getTopPerformers(
    @Request() req: any,
    @Query('limit') limit?: number,
    @Query('period') period?: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
    @Query('unit') unit?: string,
    @Query('metric') metric?: string
  ): Promise<TopPerformersResponseDto> {
    // Validate and parse limit
    const limitNum = limit ? parseInt(limit.toString()) : 5;
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 20) {
      throw new BadRequestException('Limit must be a number between 1 and 20');
    }

    // Validate period
    const validPeriods = ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'];
    const periodType = (period && validPeriods.includes(period) ? period : 'monthly') as 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';

    // Validate metric
    const validMetrics = ['deals', 'revenue', 'conversion_rate', 'leads'];
    const metricType = (metric && validMetrics.includes(metric) ? metric : 'deals') as 'deals' | 'revenue' | 'conversion_rate' | 'leads';

    // Validate date range if provided
    if (fromDate && toDate) {
      const from = new Date(fromDate);
      const to = new Date(toDate);
      if (isNaN(from.getTime()) || isNaN(to.getTime())) {
        throw new BadRequestException('Invalid date format. Dates must be in ISO 8601 format (YYYY-MM-DD)');
      }
      if (from > to) {
        throw new BadRequestException('fromDate must be before toDate');
      }
    }

    return await this.dashboardService.getTopPerformers(
      req.user.id,
      req.user.department,
      req.user.role,
      req.user.type,
      limitNum,
      periodType,
      fromDate,
      toDate,
      unit,
      metricType
    );
  }

  @Get('cross-department-top-performers')
  @ApiOperation({ 
    summary: 'Get cross-department top performers - Returns top performer from each department',
    description: 'Fetches the top performing employee from each department (Sales, Marketing, Production, HR, Accounting) based on department-specific metrics. Results are ranked by overall performance percentage.'
  })
  @ApiQuery({ name: 'period', required: false, type: String, description: 'Time period: daily, weekly, monthly, quarterly, yearly (default: monthly)', enum: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'] })
  @ApiQuery({ name: 'fromDate', required: false, type: String, description: 'Start date in ISO 8601 format (YYYY-MM-DD). Default: current period start' })
  @ApiQuery({ name: 'toDate', required: false, type: String, description: 'End date in ISO 8601 format (YYYY-MM-DD). Default: current date' })
  @ApiResponse({ status: 200, description: 'Cross-department top performers retrieved successfully', type: CrossDepartmentTopPerformersResponseDto })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid query parameters' })
  @ApiResponse({ status: 401, description: 'Unauthorized - JWT token required' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getCrossDepartmentTopPerformers(
    @Request() req: any,
    @Query('period') period?: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string
  ): Promise<CrossDepartmentTopPerformersResponseDto> {
    // Validate period
    const validPeriods = ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'];
    const periodType = (period && validPeriods.includes(period) ? period : 'monthly') as 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';

    // Validate date range if provided
    if (fromDate && toDate) {
      const from = new Date(fromDate);
      const to = new Date(toDate);
      if (isNaN(from.getTime()) || isNaN(to.getTime())) {
        throw new BadRequestException('Invalid date format. Dates must be in ISO 8601 format (YYYY-MM-DD)');
      }
      if (from > to) {
        throw new BadRequestException('fromDate must be before toDate');
      }
    }

    return await this.dashboardService.getCrossDepartmentTopPerformers(
      periodType,
      fromDate,
      toDate
    );
  }
}

