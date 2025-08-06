import { Body, Controller, Post, Get, Put, Delete, Param, UseGuards, Request, ParseIntPipe } from '@nestjs/common';
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
  async getAllAdminRequests(): Promise<AdminRequestListResponseDto> {
    return await this.adminRequestsService.getAllAdminRequests();
  }

  /**
   * Get admin requests by status (Admin only)
   */
  @Get('status/:status')
  @UseGuards(JwtAuthGuard, RolesGuard, DepartmentsGuard, PermissionsGuard)
  @Roles('admin' as any)
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
  async updateAdminRequestStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAdminRequestStatusDto,
    @Request() req: AuthenticatedRequest
  ): Promise<AdminRequestResponseDto> {
    return await this.adminRequestsService.updateAdminRequestStatus(id, dto, req.user.id);
  }
} 