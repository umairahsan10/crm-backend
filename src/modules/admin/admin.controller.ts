import { 
  Controller, 
  Get, 
  Put, 
  Param, 
  Body, 
  Query, 
  UseGuards, 
  Request, 
  ParseIntPipe,
  DefaultValuePipe 
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { UpdateAdminDto } from './dto/update-admin.dto';
import { AdminResponseDto, AdminListResponseDto } from './dto/admin-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from './guards/admin.guard';

interface AuthenticatedRequest extends Request {
  user: {
    id: number;
    role: string | number;
    type: string;
    email?: string;
  };
}

@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  /**
   * Get all admins (admin only)
   */
  @Get()
  async getAllAdmins(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number
  ): Promise<AdminListResponseDto> {
    return this.adminService.getAllAdmins(page, limit);
  }

  /**
   * Get current admin profile
   */
  @Get('my-profile')
  async getMyProfile(@Request() req: AuthenticatedRequest): Promise<AdminResponseDto> {
    return this.adminService.getMyProfile(req.user.id);
  }

  /**
   * Get specific admin by ID (admin only)
   */
  @Get(':id')
  async getAdminById(@Param('id', ParseIntPipe) id: number): Promise<AdminResponseDto> {
    return this.adminService.getAdminById(id);
  }

  /**
   * Get admin by email (admin only)
   */
  @Get('email/:email')
  async getAdminByEmail(@Param('email') email: string): Promise<AdminResponseDto> {
    return this.adminService.getAdminByEmail(email);
  }

  /**
   * Update current admin profile
   */
  @Put('my-profile')
  async updateMyProfile(
    @Request() req: AuthenticatedRequest,
    @Body() dto: UpdateAdminDto
  ): Promise<AdminResponseDto> {
    return this.adminService.updateMyProfile(req.user.id, dto);
  }

  /**
   * Update specific admin by ID (admin only)
   */
  @Put(':id')
  async updateAdmin(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAdminDto
  ): Promise<AdminResponseDto> {
    return this.adminService.updateAdmin(id, dto);
  }
}
