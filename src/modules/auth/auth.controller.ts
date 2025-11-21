import {
  Body,
  Controller,
  Post,
  Get,
  UseGuards,
  Request,
  Query,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { Request as ExpressRequest } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import {
  ApiTags,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';

interface AuthenticatedRequest extends Request {
  user: {
    id: number;
    role: string | number;
    type: string;
    department?: string;
    permissions?: any;
  };
}

@ApiTags('Auth') // Groups all endpoints under "Auth" in Swagger UI
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Authenticate user and return JWT token' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'Successfully authenticated',
    schema: {
      example: {
        access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        user: {
          id: 1,
          email: 'admin@example.com',
          role: 'ADMIN',
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() loginDto: LoginDto, @Request() req: ExpressRequest) {
    return this.authService.login(loginDto.email, loginDto.password, req);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @ApiOperation({ summary: 'Get profile of currently logged-in user' })
  @ApiBearerAuth() 
  @ApiResponse({
    status: 200,
    description: 'Returns authenticated user profile',
    schema: {
      example: {
        id: 1,
        email: 'admin@example.com',
        role: 'ADMIN',
        department: 'HR',
      },
    },
  })
  getProfile(@Request() req: AuthenticatedRequest) {
    return req.user;
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @ApiOperation({ summary: 'Logout the currently logged-in user' })
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: 'User logged out successfully',
    schema: { example: { message: 'Logout successful' } },
  })
  async logout(@Request() req: AuthenticatedRequest) {
    return this.authService.logout(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('access-logs')
  @ApiOperation({ summary: 'Fetch access logs for login attempts' })
  @ApiBearerAuth()
  @ApiQuery({ name: 'employeeId', required: false, type: String })
  @ApiQuery({ name: 'success', required: false, type: String })
  @ApiQuery({ name: 'limit', required: false, type: String, example: 50 })
  async getAccessLogs(
    @Query('employeeId') employeeId?: string,
    @Query('success') success?: string,
    @Query('limit') limit?: string,
  ) {
    return this.authService.getAccessLogs(
      employeeId ? parseInt(employeeId) : undefined,
      success ? success === 'true' : undefined,
      limit ? parseInt(limit) : 50,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('access-logs/stats')
  @ApiOperation({ summary: 'Get statistics from access logs' })
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: 'Access logs statistics',
    schema: {
      example: {
        totalAttempts: 120,
        successfulLogins: 90,
        failedLogins: 30,
        lastLogin: '2025-10-14T09:45:00Z',
      },
    },
  })
  async getAccessLogsStats() {
    return this.authService.getAccessLogsStats();
  }

  @UseGuards(JwtAuthGuard)
  @Get('access-logs/export')
  @ApiOperation({ summary: 'Export access logs as CSV or JSON' })
  @ApiBearerAuth()
  @ApiQuery({ name: 'format', required: false, enum: ['csv', 'json'], example: 'csv' })
  @ApiQuery({ name: 'employeeId', required: false, type: String })
  @ApiQuery({ name: 'success', required: false, type: String })
  @ApiQuery({ name: 'startDate', required: false, type: String, example: '2025-01-01' })
  @ApiQuery({ name: 'endDate', required: false, type: String, example: '2025-01-31' })
  async exportAccessLogs(
    @Res() res: Response,
    @Query('format') format: string = 'csv',
    @Query('employeeId') employeeId?: string,
    @Query('success') success?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const data = await this.authService.getAccessLogsForExport(
      employeeId ? parseInt(employeeId) : undefined,
      success ? success === 'true' : undefined,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );

    const filename = `access-logs-${new Date().toISOString().split('T')[0]}.${format}`;

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(this.authService.convertToCSV(data));
    } else if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.json(data);
    } else {
      res.status(400).json({ message: 'Unsupported format. Use csv or json.' });
    }
  }
}
