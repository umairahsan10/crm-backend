import { Controller, Get, Post, Put, Patch, Delete, Body, Param, UseGuards, Request, ParseIntPipe } from '@nestjs/common';
import { AccountsService } from '../services/accounts.service';
import { CreateAccountDto, UpdateAccountDto } from '../dto/accounts.dto';
import { UpdateBaseSalaryDto } from '../dto/update-base-salary.dto';
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

@Controller('hr/accounts')
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard, DepartmentsGuard, PermissionsGuard)
  @Departments('HR')
  @Permissions(PermissionName.employee_add_permission)
  async getAllAccountRecords() {
    return await this.accountsService.getAllAccountRecords();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, DepartmentsGuard, PermissionsGuard)
  @Departments('HR')
  @Permissions(PermissionName.employee_add_permission)
  async getAccountRecordById(@Param('id') id: string) {
    return await this.accountsService.getAccountRecordById(+id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard, DepartmentsGuard, PermissionsGuard)
  @Departments('HR')
  @Permissions(PermissionName.employee_add_permission)
  async createAccountRecord(@Body() dto: CreateAccountDto, @Request() req: AuthenticatedRequest) {
    return await this.accountsService.createAccountRecord(dto, req.user.id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, DepartmentsGuard, PermissionsGuard)
  @Departments('HR')
  @Permissions(PermissionName.employee_add_permission)
  async updateAccountRecord(@Param('id') id: string, @Body() dto: UpdateAccountDto, @Request() req: AuthenticatedRequest) {
    return await this.accountsService.updateAccountRecord(+id, dto, req.user.id);
  }

  /**
   * Update account base salary
   */
  @Patch(':id/base-salary')
  @UseGuards(JwtAuthGuard, RolesGuard, DepartmentsGuard, PermissionsGuard)
  @Departments('HR')
  @Permissions(PermissionName.salary_permission)
  async updateBaseSalary(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateBaseSalaryDto,
    @Request() req: AuthenticatedRequest
  ) {
    return await this.accountsService.updateBaseSalary(id, dto.baseSalary, req.user.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, DepartmentsGuard, PermissionsGuard)
  @Departments('HR')
  @Permissions(PermissionName.employee_add_permission)
  async deleteAccountRecord(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    return await this.accountsService.deleteAccountRecord(+id, req.user.id);
  }
} 