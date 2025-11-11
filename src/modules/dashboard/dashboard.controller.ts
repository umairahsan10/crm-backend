import { Controller, Get, UseGuards, Request, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DashboardService } from './dashboard.service';
import { MetricGridResponseDto } from './dto/metric-grid-response.dto';
import { ActivityFeedResponseDto } from './dto/activity-feed-response.dto';
import { HrRequestsResponseDto } from './dto/hr-request.dto';

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
    return await this.dashboardService.getMetricGrid(req.user.id);
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
      limitNum
    );
  }

  @Get('hr-requests')
  @ApiOperation({ summary: 'Get HR requests - Returns recent HR requests based on user role and department' })
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
      limitNum
    );
  }
}

