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
import { ApiTags, ApiOperation, ApiBearerAuth, ApiOkResponse, ApiParam, ApiQuery, ApiUnauthorizedResponse, ApiForbiddenResponse, ApiNotFoundResponse, ApiBody } from '@nestjs/swagger';

interface AuthenticatedRequest extends Request {
  user: {
    id: number;
    role: string | number;
    type: string;
    email?: string;
  };
}

@ApiTags('Admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  /**
   * Get all admins (admin only)
   */
  @Get()
  @ApiOperation({ summary: 'Get all admins', description: 'Fetch paginated list of admin users (admin only).' })
  @ApiQuery({ name: 'page', required: false, example: 1, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, example: 10, description: 'Items per page (default: 10)' })
  @ApiOkResponse({ type: AdminListResponseDto, description: 'List of admins retrieved successfully.' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized: Invalid or missing token.' })
  @ApiForbiddenResponse({ description: 'Forbidden: Only admins can access this endpoint.' })
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
  @ApiOperation({ summary: 'Get current admin profile', description: 'Returns the profile of the authenticated admin.' })
  @ApiOkResponse({ type: AdminResponseDto, description: 'Current admin profile retrieved successfully.' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized: Invalid or missing token.' })
  async getMyProfile(@Request() req: AuthenticatedRequest): Promise<AdminResponseDto> {
    return this.adminService.getMyProfile(req.user.id);
  }

  /**
   * Get specific admin by ID (admin only)
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get admin by ID', description: 'Fetch details of a specific admin by ID (admin only).' })
  @ApiParam({ name: 'id', type: Number, example: 5, description: 'Admin ID' })
  @ApiOkResponse({ type: AdminResponseDto, description: 'Admin record retrieved successfully.' })
  @ApiNotFoundResponse({ description: 'Admin not found.' })
  async getAdminById(@Param('id', ParseIntPipe) id: number): Promise<AdminResponseDto> {
    return this.adminService.getAdminById(id);
  }

  /**
   * Get admin by email (admin only)
   */
  @Get('email/:email')
  @ApiOperation({ summary: 'Get admin by email', description: 'Fetch admin details by email address (admin only).' })
  @ApiParam({ name: 'email', type: String, example: 'john.doe@example.com', description: 'Admin email address' })
  @ApiOkResponse({ type: AdminResponseDto, description: 'Admin record retrieved successfully.' })
  @ApiNotFoundResponse({ description: 'Admin not found.' })
  async getAdminByEmail(@Param('email') email: string): Promise<AdminResponseDto> {
    return this.adminService.getAdminByEmail(email);
  }

  /**
   * Update current admin profile
   */
  @Put('my-profile')
  @ApiOperation({ summary: 'Update current admin profile', description: 'Allows the authenticated admin to update their profile information.' })
  @ApiBody({ type: UpdateAdminDto })
  @ApiOkResponse({ type: AdminResponseDto, description: 'Admin profile updated successfully.' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized: Invalid or missing token.' })
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
  @ApiOperation({ summary: 'Update admin by ID', description: 'Allows admins to update another admin’s details by ID.' })
  @ApiParam({ name: 'id', type: Number, example: 5, description: 'Admin ID to update' })
  @ApiBody({ type: UpdateAdminDto })
  @ApiOkResponse({ type: AdminResponseDto, description: 'Admin updated successfully.' })
  @ApiNotFoundResponse({ description: 'Admin not found.' })
  async updateAdmin(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAdminDto
  ): Promise<AdminResponseDto> {
    return this.adminService.updateAdmin(id, dto);
  }
}
