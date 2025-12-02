import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { AccountantPermissionsService } from './accountant-permissions.service';
import { CreateAccountantPermissionDto } from './dto/create-accountant-permission.dto';
import { UpdateAccountantPermissionDto } from './dto/update-accountant-permission.dto';
import {
  AccountantPermissionResponseDto,
  AccountantPermissionsListResponseDto,
} from './dto/accountant-permission-response.dto';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../../guards/admin.guard';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiBody,
  ApiParam,
  ApiQuery,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';

@ApiTags('Admin Settings - Accountant Permissions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('admin/settings/accountant-permissions')
export class AccountantPermissionsController {
  constructor(
    private readonly accountantPermissionsService: AccountantPermissionsService,
  ) {}

  /**
   * Get all accountant permissions (admin only)
   */
  @Get()
  @ApiOperation({
    summary: 'Get all accountant permissions',
    description:
      'Retrieve all accountant permission records with pagination. Admin only.',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    example: 1,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    example: 10,
    description: 'Items per page (default: 10)',
  })
  @ApiQuery({
    name: 'employeeId',
    required: false,
    example: 1,
    description: 'Filter by employee ID',
  })
  @ApiOkResponse({
    type: AccountantPermissionsListResponseDto,
    description: 'List of accountant permissions retrieved successfully.',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized: Invalid or missing token.',
  })
  @ApiForbiddenResponse({
    description: 'Forbidden: Only admins can access this endpoint.',
  })
  async getAllAccountantPermissions(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('employeeId') employeeId?: string,
  ): Promise<AccountantPermissionsListResponseDto> {
    const employeeIdNum = employeeId ? parseInt(employeeId, 10) : undefined;
    return this.accountantPermissionsService.getAllAccountantPermissions(
      page,
      limit,
      employeeIdNum,
    );
  }

  /**
   * Get accountant permission by ID (admin only)
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get accountant permission by ID',
    description:
      'Retrieve a specific accountant permission record by ID. Admin only.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    example: 1,
    description: 'Accountant record ID',
  })
  @ApiOkResponse({
    type: AccountantPermissionResponseDto,
    description: 'Accountant permission retrieved successfully.',
  })
  @ApiNotFoundResponse({ description: 'Accountant permission not found.' })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized: Invalid or missing token.',
  })
  @ApiForbiddenResponse({
    description: 'Forbidden: Only admins can access this endpoint.',
  })
  async getAccountantPermissionById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<AccountantPermissionResponseDto> {
    return this.accountantPermissionsService.getAccountantPermissionById(id);
  }

  /**
   * Create a new accountant permission (admin only)
   */
  @Post()
  @ApiOperation({
    summary: 'Create a new accountant permission',
    description: 'Create a new accountant permission record. Admin only.',
  })
  @ApiBody({ type: CreateAccountantPermissionDto })
  @ApiCreatedResponse({
    type: AccountantPermissionResponseDto,
    description: 'Accountant permission created successfully.',
  })
  @ApiBadRequestResponse({
    description:
      'Bad Request: Validation error or employee already an accountant.',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized: Invalid or missing token.',
  })
  @ApiForbiddenResponse({
    description: 'Forbidden: Only admins can access this endpoint.',
  })
  async createAccountantPermission(
    @Body() dto: CreateAccountantPermissionDto,
  ): Promise<AccountantPermissionResponseDto> {
    return this.accountantPermissionsService.createAccountantPermission(dto);
  }

  /**
   * Update accountant permission (admin only)
   */
  @Put(':id')
  @ApiOperation({
    summary: 'Update accountant permission',
    description: 'Update an accountant permission record by ID. Admin only.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    example: 1,
    description: 'Accountant record ID',
  })
  @ApiBody({ type: UpdateAccountantPermissionDto })
  @ApiOkResponse({
    type: AccountantPermissionResponseDto,
    description: 'Accountant permission updated successfully.',
  })
  @ApiBadRequestResponse({
    description: 'Bad Request: Validation error or update failed.',
  })
  @ApiNotFoundResponse({ description: 'Accountant permission not found.' })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized: Invalid or missing token.',
  })
  @ApiForbiddenResponse({
    description: 'Forbidden: Only admins can access this endpoint.',
  })
  async updateAccountantPermission(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAccountantPermissionDto,
  ): Promise<AccountantPermissionResponseDto> {
    return this.accountantPermissionsService.updateAccountantPermission(
      id,
      dto,
    );
  }

  /**
   * Delete accountant permission (admin only)
   */
  @Delete(':id')
  @ApiOperation({
    summary: 'Delete accountant permission',
    description: 'Delete an accountant permission record by ID. Admin only.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    example: 1,
    description: 'Accountant record ID',
  })
  @ApiOkResponse({
    description: 'Accountant permission deleted successfully.',
    schema: { example: { message: 'Accountant record deleted successfully' } },
  })
  @ApiBadRequestResponse({ description: 'Bad Request: Deletion failed.' })
  @ApiNotFoundResponse({ description: 'Accountant permission not found.' })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized: Invalid or missing token.',
  })
  @ApiForbiddenResponse({
    description: 'Forbidden: Only admins can access this endpoint.',
  })
  async deleteAccountantPermission(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ message: string }> {
    return this.accountantPermissionsService.deleteAccountantPermission(id);
  }
}
