import { Controller, Get, Post, Put, Patch, Delete, Body, Param, UseGuards, Request, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
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

@ApiTags('HR - Accounts')
@ApiBearerAuth()
@Controller('hr/accounts')
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all account records' })
  @ApiResponse({ status: 200, description: 'Account records retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @UseGuards(JwtAuthGuard, RolesGuard, DepartmentsGuard, PermissionsGuard)
  @Departments('HR')
  @Permissions(PermissionName.employee_add_permission)
  async getAllAccountRecords() {
    return await this.accountsService.getAllAccountRecords();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get account record by ID' })
  @ApiParam({ name: 'id', type: 'string', description: 'Account record ID' })
  @ApiResponse({ status: 200, description: 'Account record retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Account record not found' })
  @UseGuards(JwtAuthGuard, RolesGuard, DepartmentsGuard, PermissionsGuard)
  @Departments('HR')
  @Permissions(PermissionName.employee_add_permission)
  async getAccountRecordById(@Param('id') id: string) {
    return await this.accountsService.getAccountRecordById(+id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new account record' })
  @ApiBody({ type: CreateAccountDto })
  @ApiResponse({ status: 201, description: 'Account record created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @UseGuards(JwtAuthGuard, RolesGuard, DepartmentsGuard, PermissionsGuard)
  @Departments('HR')
  @Permissions(PermissionName.employee_add_permission)
  async createAccountRecord(@Body() dto: CreateAccountDto, @Request() req: AuthenticatedRequest) {
    return await this.accountsService.createAccountRecord(dto, req.user.id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update account record' })
  @ApiParam({ name: 'id', type: 'string', description: 'Account record ID' })
  @ApiBody({ type: UpdateAccountDto })
  @ApiResponse({ status: 200, description: 'Account record updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Account record not found' })
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
  @ApiOperation({ summary: 'Update account base salary' })
  @ApiParam({ name: 'id', type: 'number', description: 'Account record ID' })
  @ApiBody({ type: UpdateBaseSalaryDto })
  @ApiResponse({ status: 200, description: 'Base salary updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Account record not found' })
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
  @ApiOperation({ summary: 'Delete account record' })
  @ApiParam({ name: 'id', type: 'string', description: 'Account record ID' })
  @ApiResponse({ status: 200, description: 'Account record deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Account record not found' })
  @UseGuards(JwtAuthGuard, RolesGuard, DepartmentsGuard, PermissionsGuard)
  @Departments('HR')
  @Permissions(PermissionName.employee_add_permission)
  async deleteAccountRecord(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    return await this.accountsService.deleteAccountRecord(+id, req.user.id);
  }
} 