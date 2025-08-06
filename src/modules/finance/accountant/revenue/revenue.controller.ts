import { Controller, Post, Get, Patch, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../common/guards/roles.guard';
import { DepartmentsGuard } from '../../../../common/guards/departments.guard';
import { PermissionsGuard } from '../../../../common/guards/permissions.guard';
import { Departments } from '../../../../common/decorators/departments.decorator';
import { Permissions } from '../../../../common/decorators/permissions.decorator';
import { PermissionName } from '../../../../common/constants/permission.enum';
import { RevenueService } from './revenue.service';
import { CreateRevenueDto } from './dto/create-revenue.dto';
import { UpdateRevenueDto } from './dto/update-revenue.dto';

interface AuthenticatedRequest extends Request {
  user: {
    id: number;
    email: string;
    role: string;
  };
}

@Controller('accountant/revenue')
export class RevenueController {
  constructor(private readonly revenueService: RevenueService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard, DepartmentsGuard, PermissionsGuard)
  @Departments('Accounts')
  @Permissions(PermissionName.revenues_permission)
  async createRevenue(
    @Body() dto: CreateRevenueDto,
    @Request() req: AuthenticatedRequest
  ): Promise<any> {
    const currentUserId = req.user.id;
    return await this.revenueService.createRevenue(dto, currentUserId);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard, DepartmentsGuard, PermissionsGuard)
  @Departments('Accounts')
  @Permissions(PermissionName.revenues_permission)
  async getAllRevenues(@Query() query: any): Promise<any> {
    return await this.revenueService.getAllRevenues(query);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, DepartmentsGuard, PermissionsGuard)
  @Departments('Accounts')
  @Permissions(PermissionName.revenues_permission)
  async getRevenueById(@Param('id') id: string): Promise<any> {
    const revenueId = parseInt(id);
    return await this.revenueService.getRevenueById(revenueId);
  }

  @Patch()
  @UseGuards(JwtAuthGuard, RolesGuard, DepartmentsGuard, PermissionsGuard)
  @Departments('Accounts')
  @Permissions(PermissionName.revenues_permission)
  async updateRevenue(@Body() dto: UpdateRevenueDto): Promise<any> {
    return await this.revenueService.updateRevenue(dto);
  }
}
