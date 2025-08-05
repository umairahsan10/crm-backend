import { Body, Controller, Post, Get, Put, Delete, Param, Query, UseGuards, Request, ParseIntPipe } from '@nestjs/common';
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

@Controller('hr/production')
export class ProductionController {
  constructor(private readonly productionService: ProductionService) {}

  /**
   * Create a new production record
   */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard, DepartmentsGuard, PermissionsGuard)
  @Departments('HR')
  @Permissions(PermissionName.employee_add_permission)
  async createProduction(@Body() dto: CreateProductionDto, @Request() req: AuthenticatedRequest): Promise<ProductionResponseDto> {
    return await this.productionService.createProduction(dto);
  }

  /**
   * Get all production records or filter by employee ID
   */
  @Get()
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
  @UseGuards(JwtAuthGuard, RolesGuard, DepartmentsGuard, PermissionsGuard)
  @Departments('HR')
  @Permissions(PermissionName.employee_add_permission)
  async updateProduction(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProductionDto,
    @Request() req: AuthenticatedRequest
  ): Promise<ProductionResponseDto> {
    return await this.productionService.updateProduction(id, dto);
  }

  /**
   * Delete production record
   * 
   * This endpoint removes an employee from the production department.
   * It also handles cleanup of related data:
   * - If employee is head of any production unit, sets head_id to null
   * - If employee is team lead of any team, sets team_lead_id to null
   * 
   * @param id - Production record ID
   * @param req - Authenticated request containing HR employee details
   * @returns Success message confirming deletion
   * 
   * Required Permissions: employee_add_permission
   * Required Department: HR
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, DepartmentsGuard, PermissionsGuard)
  @Departments('HR')
  @Permissions(PermissionName.employee_add_permission)
  async deleteProduction(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: AuthenticatedRequest
  ): Promise<{ message: string }> {
    return await this.productionService.deleteProduction(id);
  }
} 