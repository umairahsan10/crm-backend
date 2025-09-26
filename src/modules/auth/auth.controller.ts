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

interface AuthenticatedRequest extends Request {
  user: {
    id: number;
    role: string | number;
    type: string;
    department?: string;
    permissions?: any;
  };
}

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto, @Request() req: ExpressRequest) {
    return this.authService.login(loginDto.email, loginDto.password, req);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req: AuthenticatedRequest) {
    return req.user;
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@Request() req: AuthenticatedRequest) {
    return this.authService.logout(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('access-logs')
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
  async getAccessLogsStats() {
    return this.authService.getAccessLogsStats();
  }

  @UseGuards(JwtAuthGuard)
  @Get('access-logs/export')
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
