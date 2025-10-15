import { Body, Controller, Post, Get, Put, Delete, Param, Query, UseGuards, Request, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam } from '@nestjs/swagger';
import { ProductionService } from '../services/production.service';
import { CreateProductionDto, UpdateProductionDto, ProductionResponseDto, ProductionsListResponseDto } from '../dto/production.dto';
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

@ApiTags('Production')
@Controller('hr/production')
export class ProductionController {
  constructor(private readonly productionService: ProductionService) {}

  /**
   * Create a new production record
   */
  @Post()
  @ApiOperation({ summary: 'Create a new production record' })
  @ApiResponse({ status: 201, description: 'Production record created', type: ProductionResponseDto })
  @UseGuards(JwtAuthGuard, RolesGuard, DepartmentsGuard, PermissionsGuard)
  @Departments('HR')
  @Permissions(PermissionName.employee_add_permission)
  async createProduction(@Body() dto: CreateProductionDto, @Request() req: AuthenticatedRequest): Promise<ProductionResponseDto> {
    return await this.productionService.createProduction(dto, req.user.id);
  }

  /**
   * Get all production records or filter by employee ID
   */
  @Get()
  @ApiOperation({ summary: 'Get all production records or filter by employee ID' })
  @ApiQuery({ name: 'employeeId', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'List of production records', type: ProductionsListResponseDto })
  @UseGuards(JwtAuthGuard, RolesGuard, DepartmentsGuard, PermissionsGuard)
  @Departments('HR')
  @Permissions(PermissionName.employee_add_permission)
  async getAllProductions(
    @Query('employeeId') employeeId?: string,
    @Request() req?: AuthenticatedRequest
  ): Promise<ProductionsListResponseDto> {
    const parsedEmployeeId = employeeId ? parseInt(employeeId, 10) : undefined;
    return await this.productionService.getAllProductions(parsedEmployeeId);
  }

  /**
   * Get production record by ID
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get production record by ID' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Production record details', type: ProductionResponseDto })
  @UseGuards(JwtAuthGuard, RolesGuard, DepartmentsGuard, PermissionsGuard)
  @Departments('HR')
  @Permissions(PermissionName.employee_add_permission)
  async getProductionById(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: AuthenticatedRequest
  ): Promise<ProductionResponseDto> {
    return await this.productionService.getProductionById(id);
  }

  /**
   * Update production record
   */
  @Put(':id')
  @ApiOperation({ summary: 'Update a production record' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Updated production record', type: ProductionResponseDto })
  @UseGuards(JwtAuthGuard, RolesGuard, DepartmentsGuard, PermissionsGuard)
  @Departments('HR')
  @Permissions(PermissionName.employee_add_permission)
  async updateProduction(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProductionDto,
    @Request() req: AuthenticatedRequest
  ): Promise<ProductionResponseDto> {
    return await this.productionService.updateProduction(id, dto, req.user.id);
  }

  /**
   * Delete production record
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a production record' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Deletion confirmation message' })
  @UseGuards(JwtAuthGuard, RolesGuard, DepartmentsGuard, PermissionsGuard)
  @Departments('HR')
  @Permissions(PermissionName.employee_add_permission)
  async deleteProduction(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: AuthenticatedRequest
  ): Promise<{ message: string }> {
    return await this.productionService.deleteProduction(id, req.user.id);
  }
} 