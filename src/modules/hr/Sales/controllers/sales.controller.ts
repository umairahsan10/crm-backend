import { Controller, Get, Post, Put, Delete, Param, ParseIntPipe, UseGuards, Request, Body } from '@nestjs/common';
import { SalesService } from '../services/sales.service';
import { CreateSalesDepartmentDto, UpdateSalesDepartmentDto } from '../dto/sales.dto';
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

@Controller('hr/sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard, DepartmentsGuard, PermissionsGuard)
  @Departments('HR')
  @Permissions(PermissionName.employee_add_permission)
  async getAllSalesDepartments(@Request() req: AuthenticatedRequest) {
    return await this.salesService.getAllSalesDepartments();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, DepartmentsGuard, PermissionsGuard)
  @Departments('HR')
  @Permissions(PermissionName.employee_add_permission)
  async getSalesDepartmentById(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: AuthenticatedRequest
  ) {
    return await this.salesService.getSalesDepartmentById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard, DepartmentsGuard, PermissionsGuard)
  @Departments('HR')
  @Permissions(PermissionName.employee_add_permission)
  async createSalesDepartment(
    @Body() dto: CreateSalesDepartmentDto,
    @Request() req: AuthenticatedRequest
  ) {
    return await this.salesService.createSalesDepartment(dto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, DepartmentsGuard, PermissionsGuard)
  @Departments('HR')
  @Permissions(PermissionName.employee_add_permission)
  async updateSalesDepartment(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSalesDepartmentDto,
    @Request() req: AuthenticatedRequest
  ) {
    return await this.salesService.updateSalesDepartment(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, DepartmentsGuard, PermissionsGuard)
  @Departments('HR')
  @Permissions(PermissionName.employee_add_permission)
  async deleteSalesDepartment(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: AuthenticatedRequest
  ) {
    return await this.salesService.deleteSalesDepartment(id);
  }
} 