import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Param,
  ParseIntPipe,
  UseGuards,
  Request,
  Body,
} from '@nestjs/common';
import { SalesService } from '../services/sales.service';
import {
  CreateSalesDepartmentDto,
  UpdateSalesDepartmentDto,
  UpdateCommissionRateDto,
  UpdateTargetAmountDto,
} from '../dto/sales.dto';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../common/guards/roles.guard';
import { DepartmentsGuard } from '../../../../common/guards/departments.guard';
import { PermissionsGuard } from '../../../../common/guards/permissions.guard';
import { Departments } from '../../../../common/decorators/departments.decorator';
import { Permissions } from '../../../../common/decorators/permissions.decorator';
import { PermissionName } from '../../../../common/constants/permission.enum';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';

interface AuthenticatedRequest extends Request {
  user: {
    id: number;
    [key: string]: any;
  };
}

@ApiTags('HR Sales Department')
@ApiBearerAuth()
@Controller('hr/sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all sales department records' })
  @ApiResponse({ status: 200, description: 'List of sales department records' })
  @UseGuards(JwtAuthGuard, RolesGuard, DepartmentsGuard, PermissionsGuard)
  @Departments('HR')
  @Permissions(PermissionName.employee_add_permission)
  async getAllSalesDepartments(@Request() req: AuthenticatedRequest) {
    return await this.salesService.getAllSalesDepartments();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get sales department record by ID' })
  @ApiParam({
    name: 'id',
    description: 'Sales department record ID',
    type: Number,
  })
  @ApiResponse({ status: 200, description: 'Sales department record details' })
  @UseGuards(JwtAuthGuard, RolesGuard, DepartmentsGuard, PermissionsGuard)
  @Departments('HR')
  @Permissions(PermissionName.employee_add_permission)
  async getSalesDepartmentById(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: AuthenticatedRequest,
  ) {
    return await this.salesService.getSalesDepartmentById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new sales department record' })
  @ApiBody({ type: CreateSalesDepartmentDto })
  @ApiResponse({
    status: 201,
    description: 'Sales department record created successfully',
  })
  @UseGuards(JwtAuthGuard, RolesGuard, DepartmentsGuard, PermissionsGuard)
  @Departments('HR')
  @Permissions(PermissionName.employee_add_permission)
  async createSalesDepartment(
    @Body() dto: CreateSalesDepartmentDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return await this.salesService.createSalesDepartment(dto, req.user.id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a sales department record' })
  @ApiParam({
    name: 'id',
    description: 'Sales department record ID',
    type: Number,
  })
  @ApiBody({ type: UpdateSalesDepartmentDto })
  @ApiResponse({
    status: 200,
    description: 'Sales department record updated successfully',
  })
  @UseGuards(JwtAuthGuard, RolesGuard, DepartmentsGuard, PermissionsGuard)
  @Departments('HR')
  @Permissions(PermissionName.employee_add_permission)
  async updateSalesDepartment(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSalesDepartmentDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return await this.salesService.updateSalesDepartment(id, dto, req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a sales department record' })
  @ApiParam({
    name: 'id',
    description: 'Sales department record ID',
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Sales department record deleted successfully',
  })
  @UseGuards(JwtAuthGuard, RolesGuard, DepartmentsGuard, PermissionsGuard)
  @Departments('HR')
  @Permissions(PermissionName.employee_add_permission)
  async deleteSalesDepartment(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: AuthenticatedRequest,
  ) {
    return await this.salesService.deleteSalesDepartment(id, req.user.id);
  }

  /**
   * Update commission rate for a sales department record
   * Requires commission permission
   */
  @Patch(':id/commission-rate')
  @ApiOperation({
    summary: 'Update commission rate for a sales department record',
  })
  @ApiParam({
    name: 'id',
    description: 'Sales department record ID',
    type: Number,
  })
  @ApiBody({ type: UpdateCommissionRateDto })
  @ApiResponse({
    status: 200,
    description: 'Commission rate updated successfully',
  })
  @UseGuards(JwtAuthGuard, RolesGuard, DepartmentsGuard, PermissionsGuard)
  @Departments('HR')
  @Permissions(PermissionName.commission_permission)
  async updateCommissionRate(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCommissionRateDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return await this.salesService.updateCommissionRate(id, dto, req.user.id);
  }

  /**
   * Update target amount for a sales department record
   * Requires targets set permission
   */
  @Patch(':id/target-amount')
  @ApiOperation({
    summary: 'Update target amount for a sales department record',
  })
  @ApiParam({
    name: 'id',
    description: 'Sales department record ID',
    type: Number,
  })
  @ApiBody({ type: UpdateTargetAmountDto })
  @ApiResponse({
    status: 200,
    description: 'Target amount updated successfully',
  })
  @UseGuards(JwtAuthGuard, RolesGuard, DepartmentsGuard, PermissionsGuard)
  @Departments('HR')
  @Permissions(PermissionName.targets_set)
  async updateTargetAmount(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTargetAmountDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return await this.salesService.updateTargetAmount(id, dto, req.user.id);
  }
}
