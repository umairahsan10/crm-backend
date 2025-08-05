import { Body, Controller, Post, Get, Put, Delete, Param, Query, UseGuards, Request, ParseIntPipe } from '@nestjs/common';
import { AccountantService } from '../services/accountant.service';
import { CreateAccountantDto, UpdateAccountantDto, AccountantResponseDto, AccountantListResponseDto } from '../dto/accountant.dto';
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

@Controller('hr/accountants')
export class AccountantController {
  constructor(private readonly accountantService: AccountantService) {}

  /**
   * Create a new accountant record
   */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard, DepartmentsGuard, PermissionsGuard)
  @Departments('HR')
  @Permissions(PermissionName.employee_add_permission)
  async createAccountant(@Body() dto: CreateAccountantDto, @Request() req: AuthenticatedRequest): Promise<AccountantResponseDto> {
    return await this.accountantService.createAccountant(dto);
  }

  /**
   * Get all accountant records or filter by employee ID
   */
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard, DepartmentsGuard, PermissionsGuard)
  @Departments('HR')
  @Permissions(PermissionName.employee_add_permission)
  async getAllAccountants(
    @Query('employeeId') employeeId?: string,
    @Request() req?: AuthenticatedRequest
  ): Promise<AccountantListResponseDto> {
    const parsedEmployeeId = employeeId ? parseInt(employeeId, 10) : undefined;
    return await this.accountantService.getAllAccountants(parsedEmployeeId);
  }

  /**
   * Get accountant record by ID
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, DepartmentsGuard, PermissionsGuard)
  @Departments('HR')
  @Permissions(PermissionName.employee_add_permission)
  async getAccountantById(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: AuthenticatedRequest
  ): Promise<AccountantResponseDto> {
    return await this.accountantService.getAccountantById(id);
  }

  /**
   * Update accountant record
   */
  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, DepartmentsGuard, PermissionsGuard)
  @Departments('HR')
  @Permissions(PermissionName.employee_add_permission)
  async updateAccountant(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAccountantDto,
    @Request() req: AuthenticatedRequest
  ): Promise<AccountantResponseDto> {
    return await this.accountantService.updateAccountant(id, dto);
  }

  /**
   * Delete accountant record
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, DepartmentsGuard, PermissionsGuard)
  @Departments('HR')
  @Permissions(PermissionName.employee_add_permission)
  async deleteAccountant(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: AuthenticatedRequest
  ): Promise<{ message: string }> {
    return await this.accountantService.deleteAccountant(id);
  }
} 