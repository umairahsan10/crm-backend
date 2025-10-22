import { Body, Controller, Post, Get, Put, Delete, Param, UseGuards, Request, ParseIntPipe, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { AdminRequestsService } from '../services/admin-requests.service';
import { 
  CreateAdminRequestDto, 
  UpdateAdminRequestDto, 
  UpdateAdminRequestStatusDto,
  AdminRequestResponseDto, 
  AdminRequestListResponseDto 
} from '../dto/admin-requests.dto';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../common/guards/roles.guard';
import { DepartmentsGuard } from '../../../../common/guards/departments.guard';
import { PermissionsGuard } from '../../../../common/guards/permissions.guard';
import { Departments } from '../../../../common/decorators/departments.decorator';
import { Permissions } from '../../../../common/decorators/permissions.decorator';
import { PermissionName } from '../../../../common/constants/permission.enum';
import { Roles } from 'src/common/decorators/roles.decorator';

interface AuthenticatedRequest extends Request {
  user: {
    id: number;
    [key: string]: any;
  };
}

@ApiTags('Admin Requests')
@ApiBearerAuth()
@Controller('hr/admin-requests')
export class AdminRequestsController {
  constructor(private readonly adminRequestsService: AdminRequestsService) {}

  /**
   * Create a new admin request (HR only)
   */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard, DepartmentsGuard, PermissionsGuard)
  @Departments('HR')
  @Permissions(PermissionName.employee_add_permission)
  @ApiOperation({ summary: 'Create a new admin request (HR only)' })
  @ApiBody({ type: CreateAdminRequestDto })
  @ApiResponse({ status: 201, description: 'Admin request created successfully', type: AdminRequestResponseDto })
  async createAdminRequest(
    @Body() dto: CreateAdminRequestDto, 
    @Request() req: AuthenticatedRequest
  ): Promise<AdminRequestResponseDto> {
    return await this.adminRequestsService.createAdminRequest(dto, req.user.id);
  }

  /**
   * Get all admin requests
   */
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard, DepartmentsGuard, PermissionsGuard)
  @Departments('HR')
  @ApiOperation({ summary: 'Get all admin requests' })
  @ApiResponse({ status: 200, description: 'List of admin requests', type: AdminRequestListResponseDto })
  async getAllAdminRequests(): Promise<AdminRequestListResponseDto> {
    return await this.adminRequestsService.getAllAdminRequests();
  }

  /**
   * Get admin requests by HR ID (HR can view their own requests)
   */
  @Get('my-requests')
  @UseGuards(JwtAuthGuard, RolesGuard, DepartmentsGuard, PermissionsGuard)
  @Departments('HR')
  async getMyAdminRequests(
    @Query('hrId', ParseIntPipe) hrId: number,
    @Request() req: AuthenticatedRequest
  ): Promise<AdminRequestListResponseDto> {
    return await this.adminRequestsService.getAdminRequestsByHrId(hrId);
  }

  /**
   * Get admin request statistics
   */
  @Get('stats')
  @UseGuards(JwtAuthGuard, RolesGuard, DepartmentsGuard, PermissionsGuard)
  @Departments('HR')
  @ApiOperation({ summary: 'Get admin request statistics overview' })
  @ApiResponse({ status: 200, description: 'Admin request statistics retrieved successfully' })
  async getAdminRequestStats(): Promise<any> {
    return await this.adminRequestsService.getAdminRequestStats();
  }

  /**
   * Get admin requests by status (Admin only)
   */
  @Get('status/:status')
  @UseGuards(JwtAuthGuard, RolesGuard, DepartmentsGuard, PermissionsGuard)
  @Roles('admin' as any)
  @ApiOperation({ summary: 'Get admin requests filtered by status (Admin only)' })
  @ApiParam({ name: 'status', description: 'Status to filter admin requests' })
  @ApiResponse({ status: 200, description: 'Filtered list of admin requests', type: AdminRequestListResponseDto })
  async getAdminRequestsByStatus(
    @Param('status') status: string,
    @Request() req: AuthenticatedRequest
  ): Promise<AdminRequestListResponseDto> {
    return await this.adminRequestsService.getAdminRequestsByStatus(status);
  }

  /**
   * Get admin request by ID
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, DepartmentsGuard, PermissionsGuard)
  @Departments('HR')
  @ApiOperation({ summary: 'Get a specific admin request by ID' })
  @ApiParam({ name: 'id', description: 'Admin request ID' })
  @ApiResponse({ status: 200, description: 'Admin request details', type: AdminRequestResponseDto })
  async getAdminRequestById(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: AuthenticatedRequest
  ): Promise<AdminRequestResponseDto> {
    return await this.adminRequestsService.getAdminRequestById(id);
  }

  /**
   * Update admin request (HR only, pending status only)
   */
  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, DepartmentsGuard, PermissionsGuard)
  @Departments('HR')
  @Permissions(PermissionName.employee_add_permission)
  @ApiOperation({ summary: 'Update an admin request (HR only, pending status)' })
  @ApiParam({ name: 'id', description: 'Admin request ID' })
  @ApiBody({ type: UpdateAdminRequestDto })
  @ApiResponse({ status: 200, description: 'Updated admin request', type: AdminRequestResponseDto })
  async updateAdminRequest(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAdminRequestDto,
    @Request() req: AuthenticatedRequest
  ): Promise<AdminRequestResponseDto> {
    return await this.adminRequestsService.updateAdminRequest(id, dto, req.user.id);
  }

  /**
   * Delete admin request (HR only, pending status only)
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, DepartmentsGuard, PermissionsGuard)
  @Departments('HR')
  @Permissions(PermissionName.employee_add_permission)
  @ApiOperation({ summary: 'Delete an admin request (HR only, pending status)' })
  @ApiParam({ name: 'id', description: 'Admin request ID' })
  @ApiResponse({ status: 200, description: 'Deletion confirmation message' })
  async deleteAdminRequest(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: AuthenticatedRequest
  ): Promise<{ message: string }> {
    return await this.adminRequestsService.deleteAdminRequest(id, req.user.id);
  }

  /**
   * Update admin request status (Admin only)
   */
  @Put(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard, DepartmentsGuard, PermissionsGuard)
  @Departments('HR')
  @Permissions(PermissionName.employee_add_permission)
  @ApiOperation({ summary: 'Update the status of an admin request (Admin only)' })
  @ApiParam({ name: 'id', description: 'Admin request ID' })
  @ApiBody({ type: UpdateAdminRequestStatusDto })
  @ApiResponse({ status: 200, description: 'Updated admin request with new status', type: AdminRequestResponseDto })
  async updateAdminRequestStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAdminRequestStatusDto,
    @Request() req: AuthenticatedRequest
  ): Promise<AdminRequestResponseDto> {
    return await this.adminRequestsService.updateAdminRequestStatus(id, dto, req.user.id);
  }
}