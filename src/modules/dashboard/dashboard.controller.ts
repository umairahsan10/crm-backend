import { Controller, Get, UseGuards, Request, Query } from '@nestjs/common';
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
}

