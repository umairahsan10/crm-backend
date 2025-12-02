import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { CreateAdminDto } from './dto/create-admin.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';
import {
  AdminResponseDto,
  AdminListResponseDto,
} from './dto/admin-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from './guards/admin.guard';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiOkResponse,
  ApiParam,
  ApiQuery,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiBody,
  ApiCreatedResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';

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
  @ApiOperation({
    summary: 'Get all admins',
    description: 'Fetch paginated list of admin users (admin only).',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    example: 1,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    example: 10,
    description: 'Items per page (default: 10)',
  })
  @ApiOkResponse({
    type: AdminListResponseDto,
    description: 'List of admins retrieved successfully.',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized: Invalid or missing token.',
  })
  @ApiForbiddenResponse({
    description: 'Forbidden: Only admins can access this endpoint.',
  })
  async getAllAdmins(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ): Promise<AdminListResponseDto> {
    return this.adminService.getAllAdmins(page, limit);
  }

  /**
   * Create a new admin (admin only)
   */
  @Post()
  @ApiOperation({
    summary: 'Create a new admin',
    description: 'Create a new admin user (admin only).',
  })
  @ApiBody({ type: CreateAdminDto })
  @ApiCreatedResponse({
    type: AdminResponseDto,
    description: 'Admin created successfully.',
  })
  @ApiBadRequestResponse({
    description: 'Bad Request: Validation error or email already exists.',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized: Invalid or missing token.',
  })
  @ApiForbiddenResponse({
    description: 'Forbidden: Only admins can access this endpoint.',
  })
  async createAdmin(@Body() dto: CreateAdminDto): Promise<AdminResponseDto> {
    return this.adminService.createAdmin(dto);
  }

  /**
   * Get specific admin by ID (admin only)
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get admin by ID',
    description: 'Fetch details of a specific admin by ID (admin only).',
  })
  @ApiParam({ name: 'id', type: Number, example: 5, description: 'Admin ID' })
  @ApiOkResponse({
    type: AdminResponseDto,
    description: 'Admin record retrieved successfully.',
  })
  @ApiNotFoundResponse({ description: 'Admin not found.' })
  async getAdminById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<AdminResponseDto> {
    return this.adminService.getAdminById(id);
  }

  /**
   * Update specific admin by ID (admin only)
   */
  @Put(':id')
  @ApiOperation({
    summary: 'Update admin by ID',
    description: "Allows admins to update another admin's details by ID.",
  })
  @ApiParam({
    name: 'id',
    type: Number,
    example: 5,
    description: 'Admin ID to update',
  })
  @ApiBody({ type: UpdateAdminDto })
  @ApiOkResponse({
    type: AdminResponseDto,
    description: 'Admin updated successfully.',
  })
  @ApiNotFoundResponse({ description: 'Admin not found.' })
  async updateAdmin(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAdminDto,
  ): Promise<AdminResponseDto> {
    return this.adminService.updateAdmin(id, dto);
  }

  /**
   * Delete an admin by ID (admin only)
   */
  @Delete(':id')
  @ApiOperation({
    summary: 'Delete admin by ID',
    description:
      'Delete an admin user by ID (admin only). Cannot delete yourself or the last admin.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    example: 5,
    description: 'Admin ID to delete',
  })
  @ApiOkResponse({
    description: 'Admin deleted successfully.',
    schema: { example: { message: 'Admin with ID 5 deleted successfully' } },
  })
  @ApiBadRequestResponse({
    description: 'Bad Request: Cannot delete yourself or the last admin.',
  })
  @ApiNotFoundResponse({ description: 'Admin not found.' })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized: Invalid or missing token.',
  })
  @ApiForbiddenResponse({
    description: 'Forbidden: Only admins can access this endpoint.',
  })
  async deleteAdmin(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: AuthenticatedRequest,
  ): Promise<{ message: string }> {
    return this.adminService.deleteAdmin(id, req.user.id);
  }
}
