import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('All Logs')
@ApiBearerAuth()
@Controller('all-logs')
@UseGuards(JwtAuthGuard)
export class AllLogsController {
  @Get()
  @ApiOperation({ summary: 'Get all logs overview' })
  @ApiResponse({
    status: 200,
    description: 'All logs overview retrieved successfully',
  })
  async getAllLogs() {
    return {
      message:
        'All logs endpoint - This aggregates logs from different modules',
      availableEndpoints: {
        attendance: {
          lateLogs: '/hr/attendance/late-logs',
          halfDayLogs: '/hr/attendance/half-day-logs',
          leaveLogs: '/hr/attendance/leave-logs',
        },
        projects: {
          projectLogs: '/projects/:projectId/logs',
        },
      },
    };
  }
}
