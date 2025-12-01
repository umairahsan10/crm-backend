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
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { AdminRoleResponseDto, AdminRolesListResponseDto } from './dto/role-response.dto';
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

@ApiTags('Admin Settings - Roles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('admin/settings/roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  /**
   * Get all roles (admin only)
   */
  @Get()
  @ApiOperation({ summary: 'Get all roles', description: 'Retrieve all roles with pagination and search. Admin only.' })
  @ApiQuery({ name: 'page', required: false, example: 1, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, example: 10, description: 'Items per page (default: 10)' })
  @ApiQuery({ name: 'search', required: false, example: 'manager', description: 'Search by name or description' })
  @ApiOkResponse({ type: AdminRolesListResponseDto, description: 'List of roles retrieved successfully.' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized: Invalid or missing token.' })
  @ApiForbiddenResponse({ description: 'Forbidden: Only admins can access this endpoint.' })
  async getAllRoles(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('search') search?: string,
  ): Promise<AdminRolesListResponseDto> {
    return this.rolesService.getAllRoles(page, limit, search);
  }

  /**
   * Get role by ID (admin only)
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get role by ID', description: 'Retrieve a specific role by ID. Admin only.' })
  @ApiParam({ name: 'id', type: Number, example: 1, description: 'Role ID' })
  @ApiOkResponse({ type: AdminRoleResponseDto, description: 'Role retrieved successfully.' })
  @ApiNotFoundResponse({ description: 'Role not found.' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized: Invalid or missing token.' })
  @ApiForbiddenResponse({ description: 'Forbidden: Only admins can access this endpoint.' })
  async getRoleById(@Param('id', ParseIntPipe) id: number): Promise<AdminRoleResponseDto> {
    return this.rolesService.getRoleById(id);
  }

  /**
   * Create a new role (admin only)
   */
  @Post()
  @ApiOperation({ summary: 'Create a new role', description: 'Create a new role. Admin only.' })
  @ApiBody({ type: CreateRoleDto })
  @ApiCreatedResponse({ type: AdminRoleResponseDto, description: 'Role created successfully.' })
  @ApiBadRequestResponse({ description: 'Bad Request: Validation error or role name already exists.' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized: Invalid or missing token.' })
  @ApiForbiddenResponse({ description: 'Forbidden: Only admins can access this endpoint.' })
  async createRole(@Body() dto: CreateRoleDto): Promise<AdminRoleResponseDto> {
    return this.rolesService.createRole(dto);
  }

  /**
   * Update role (admin only)
   */
  @Put(':id')
  @ApiOperation({ summary: 'Update role', description: 'Update a role by ID. Admin only.' })
  @ApiParam({ name: 'id', type: Number, example: 1, description: 'Role ID' })
  @ApiBody({ type: UpdateRoleDto })
  @ApiOkResponse({ type: AdminRoleResponseDto, description: 'Role updated successfully.' })
  @ApiBadRequestResponse({ description: 'Bad Request: Validation error or update failed.' })
  @ApiNotFoundResponse({ description: 'Role not found.' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized: Invalid or missing token.' })
  @ApiForbiddenResponse({ description: 'Forbidden: Only admins can access this endpoint.' })
  async updateRole(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateRoleDto,
  ): Promise<AdminRoleResponseDto> {
    return this.rolesService.updateRole(id, dto);
  }

  /**
   * Delete role (admin only)
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Delete role', description: 'Delete a role by ID. Cannot delete if role has employees. Admin only.' })
  @ApiParam({ name: 'id', type: Number, example: 1, description: 'Role ID' })
  @ApiOkResponse({ description: 'Role deleted successfully.', schema: { example: { message: 'Role deleted successfully' } } })
  @ApiBadRequestResponse({ description: 'Bad Request: Role has employees or deletion failed.' })
  @ApiNotFoundResponse({ description: 'Role not found.' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized: Invalid or missing token.' })
  @ApiForbiddenResponse({ description: 'Forbidden: Only admins can access this endpoint.' })
  async deleteRole(@Param('id', ParseIntPipe) id: number): Promise<{ message: string }> {
    return this.rolesService.deleteRole(id);
  }
}

