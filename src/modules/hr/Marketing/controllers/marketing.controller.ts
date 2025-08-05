import { Controller, Get, Post, Put, Delete, Param, ParseIntPipe, UseGuards, Request, Body } from '@nestjs/common';
import { MarketingService } from '../services/marketing.service';
import { CreateMarketingDto, UpdateMarketingDto } from '../dto/marketing.dto';
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

@Controller('hr/marketing')
export class MarketingController {
  constructor(private readonly marketingService: MarketingService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard, DepartmentsGuard, PermissionsGuard)
  @Departments('HR')
  @Permissions(PermissionName.employee_add_permission)
  async getAllMarketingRecords(@Request() req: AuthenticatedRequest) {
    return await this.marketingService.getAllMarketingRecords();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, DepartmentsGuard, PermissionsGuard)
  @Departments('HR')
  @Permissions(PermissionName.employee_add_permission)
  async getMarketingRecordById(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: AuthenticatedRequest
  ) {
    return await this.marketingService.getMarketingRecordById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard, DepartmentsGuard, PermissionsGuard)
  @Departments('HR')
  @Permissions(PermissionName.employee_add_permission)
  async createMarketingRecord(
    @Body() dto: CreateMarketingDto,
    @Request() req: AuthenticatedRequest
  ) {
    return await this.marketingService.createMarketingRecord(dto, req.user.id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, DepartmentsGuard, PermissionsGuard)
  @Departments('HR')
  @Permissions(PermissionName.employee_add_permission)
  async updateMarketingRecord(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateMarketingDto,
    @Request() req: AuthenticatedRequest
  ) {
    return await this.marketingService.updateMarketingRecord(id, dto, req.user.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, DepartmentsGuard, PermissionsGuard)
  @Departments('HR')
  @Permissions(PermissionName.employee_add_permission)
  async deleteMarketingRecord(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: AuthenticatedRequest
  ) {
    return await this.marketingService.deleteMarketingRecord(id, req.user.id);
  }
} 