import { Body, Controller, Post, Get, Put, Delete, Param, Query, UseGuards, Request, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';
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

@ApiTags('HR Management')
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
  @ApiOperation({ summary: 'Create a new HR record' })
  @ApiBody({ type: CreateHrDto })
  @ApiResponse({ status: 201, description: 'HR record created successfully', type: HrResponseDto })
  async createHr(@Body() dto: CreateHrDto, @Request() req: AuthenticatedRequest): Promise<HrResponseDto> {
    return await this.hrManagementService.createHr(dto, req.user.id);
  }

  /**
   * Get all HR records or filter by employee ID
   */
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard, DepartmentsGuard, PermissionsGuard)
  @Departments('HR')
  @Permissions(PermissionName.employee_add_permission)
  @ApiOperation({ summary: 'Get all HR records, optionally filtered by employee ID' })
  @ApiQuery({ name: 'employeeId', required: false, description: 'Filter HR records by employee ID', type: Number })
  @ApiResponse({ status: 200, description: 'List of HR records', type: HrListResponseDto })
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
  @ApiOperation({ summary: 'Get a specific HR record by ID' })
  @ApiParam({ name: 'id', description: 'HR record ID' })
  @ApiResponse({ status: 200, description: 'HR record details', type: HrResponseDto })
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
  @ApiOperation({ summary: 'Update an existing HR record' })
  @ApiParam({ name: 'id', description: 'HR record ID' })
  @ApiBody({ type: UpdateHrDto })
  @ApiResponse({ status: 200, description: 'Updated HR record', type: HrResponseDto })
  async updateHr(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateHrDto,
    @Request() req: AuthenticatedRequest
  ): Promise<HrResponseDto> {
    return await this.hrManagementService.updateHr(id, dto, req.user.id);
  }

  /**
   * Delete HR record
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, DepartmentsGuard, PermissionsGuard)
  @Departments('HR')
  @Permissions(PermissionName.employee_add_permission)
  @ApiOperation({ summary: 'Delete an HR record' })
  @ApiParam({ name: 'id', description: 'HR record ID' })
  @ApiResponse({ status: 200, description: 'Deletion confirmation message' })
  async deleteHr(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: AuthenticatedRequest
  ): Promise<{ message: string }> {
    return await this.hrManagementService.deleteHr(id, req.user.id);
  }
}