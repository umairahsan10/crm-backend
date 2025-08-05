import { Body, Controller, Post, Get, Put, Delete, Param, Query, UseGuards, Request, ParseIntPipe } from '@nestjs/common';
import { HrManagementService } from '../services/hr-management.service';
import { CreateHrDto, UpdateHrDto, HrResponseDto, HrListResponseDto } from '../dto/hr-management.dto';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../common/guards/roles.guard';
import { DepartmentsGuard } from '../../../../common/guards/departments.guard';
import { PermissionsGuard } from '../../../../common/guards/permissions.guard';
import { Departments } from '../../../../common/decorators/departments.decorator';
import { Permissions } from '../../../../common/decorators/permissions.decorator';
import { PermissionName } from '../../../../common/constants/permission.enum';

interface AuthenticatedRequest extends Request {
  user: {
    id: number;
    [key: string]: any;
  };
}

@Controller('hr/management')
export class HrManagementController {
  constructor(private readonly hrManagementService: HrManagementService) {}

  /**
   * Create a new HR record
   */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard, DepartmentsGuard, PermissionsGuard)
  @Departments('HR')
  @Permissions(PermissionName.employee_add_permission)
  async createHr(@Body() dto: CreateHrDto, @Request() req: AuthenticatedRequest): Promise<HrResponseDto> {
    return await this.hrManagementService.createHr(dto);
  }

  /**
   * Get all HR records or filter by employee ID
   */
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard, DepartmentsGuard, PermissionsGuard)
  @Departments('HR')
  @Permissions(PermissionName.employee_add_permission)
  async getAllHr(
    @Query('employeeId') employeeId?: string,
    @Request() req?: AuthenticatedRequest
  ): Promise<HrListResponseDto> {
    const parsedEmployeeId = employeeId ? parseInt(employeeId, 10) : undefined;
    return await this.hrManagementService.getAllHr(parsedEmployeeId);
  }

  /**
   * Get HR record by ID
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, DepartmentsGuard, PermissionsGuard)
  @Departments('HR')
  @Permissions(PermissionName.employee_add_permission)
  async getHrById(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: AuthenticatedRequest
  ): Promise<HrResponseDto> {
    return await this.hrManagementService.getHrById(id);
  }

  /**
   * Update HR record
   */
  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, DepartmentsGuard, PermissionsGuard)
  @Departments('HR')
  @Permissions(PermissionName.employee_add_permission)
  async updateHr(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateHrDto,
    @Request() req: AuthenticatedRequest
  ): Promise<HrResponseDto> {
    return await this.hrManagementService.updateHr(id, dto);
  }

  /**
   * Delete HR record
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, DepartmentsGuard, PermissionsGuard)
  @Departments('HR')
  @Permissions(PermissionName.employee_add_permission)
  async deleteHr(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: AuthenticatedRequest
  ): Promise<{ message: string }> {
    return await this.hrManagementService.deleteHr(id);
  }
} 