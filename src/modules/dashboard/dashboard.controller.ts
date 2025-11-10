import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DashboardService } from './dashboard.service';
import { MetricGridResponseDto } from './dto/metric-grid-response.dto';

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
}

