import {
  Body,
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Param,
  Query,
  UseGuards,
  Request,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { AccountantService } from '../services/accountant.service';
import {
  CreateAccountantDto,
  UpdateAccountantDto,
  AccountantResponseDto,
  AccountantListResponseDto,
} from '../dto/accountant.dto';
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

@ApiTags('HR - Accountants')
@ApiBearerAuth()
@Controller('hr/accountants')
export class AccountantController {
  constructor(private readonly accountantService: AccountantService) {}

  /**
   * Create a new accountant record
   */
  @Post()
  @ApiOperation({ summary: 'Create a new accountant record' })
  @ApiBody({ type: CreateAccountantDto })
  @ApiResponse({
    status: 201,
    description: 'Accountant created successfully',
    type: AccountantResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @UseGuards(JwtAuthGuard, RolesGuard, DepartmentsGuard, PermissionsGuard)
  @Departments('HR')
  @Permissions(PermissionName.employee_add_permission)
  async createAccountant(
    @Body() dto: CreateAccountantDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<AccountantResponseDto> {
    return await this.accountantService.createAccountant(dto, req.user.id);
  }

  /**
   * Get all accountant records or filter by employee ID
   */
  @Get()
  @ApiOperation({
    summary: 'Get all accountant records or filter by employee ID',
  })
  @ApiQuery({
    name: 'employeeId',
    required: false,
    type: String,
    description: 'Filter by employee ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Accountants retrieved successfully',
    type: AccountantListResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @UseGuards(JwtAuthGuard, RolesGuard, DepartmentsGuard, PermissionsGuard)
  @Departments('HR')
  @Permissions(PermissionName.employee_add_permission)
  async getAllAccountants(
    @Query('employeeId') employeeId?: string,
    @Request() req?: AuthenticatedRequest,
  ): Promise<AccountantListResponseDto> {
    const parsedEmployeeId = employeeId ? parseInt(employeeId, 10) : undefined;
    return await this.accountantService.getAllAccountants(parsedEmployeeId);
  }

  /**
   * Get accountant record by ID
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get accountant record by ID' })
  @ApiParam({ name: 'id', type: 'number', description: 'Accountant ID' })
  @ApiResponse({
    status: 200,
    description: 'Accountant retrieved successfully',
    type: AccountantResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Accountant not found' })
  @UseGuards(JwtAuthGuard, RolesGuard, DepartmentsGuard, PermissionsGuard)
  @Departments('HR')
  @Permissions(PermissionName.employee_add_permission)
  async getAccountantById(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: AuthenticatedRequest,
  ): Promise<AccountantResponseDto> {
    return await this.accountantService.getAccountantById(id);
  }

  /**
   * Update accountant record
   */
  @Put(':id')
  @ApiOperation({ summary: 'Update accountant record' })
  @ApiParam({ name: 'id', type: 'number', description: 'Accountant ID' })
  @ApiBody({ type: UpdateAccountantDto })
  @ApiResponse({
    status: 200,
    description: 'Accountant updated successfully',
    type: AccountantResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Accountant not found' })
  @UseGuards(JwtAuthGuard, RolesGuard, DepartmentsGuard, PermissionsGuard)
  @Departments('HR')
  @Permissions(PermissionName.employee_add_permission)
  async updateAccountant(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAccountantDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<AccountantResponseDto> {
    return await this.accountantService.updateAccountant(id, dto, req.user.id);
  }

  /**
   * Delete accountant record
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Delete accountant record' })
  @ApiParam({ name: 'id', type: 'number', description: 'Accountant ID' })
  @ApiResponse({
    status: 200,
    description: 'Accountant deleted successfully',
    schema: { type: 'object', properties: { message: { type: 'string' } } },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Accountant not found' })
  @UseGuards(JwtAuthGuard, RolesGuard, DepartmentsGuard, PermissionsGuard)
  @Departments('HR')
  @Permissions(PermissionName.employee_add_permission)
  async deleteAccountant(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: AuthenticatedRequest,
  ): Promise<{ message: string }> {
    return await this.accountantService.deleteAccountant(id, req.user.id);
  }
}
