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
import { RolesService } from '../services/roles.service';
import { CreateRoleDto } from '../dto/create-role.dto';
import { UpdateRoleDto } from '../dto/update-role.dto';
import { GetRolesDto } from '../dto/get-roles.dto';
import {
  RoleResponseDto,
  RolesListResponseDto,
} from '../dto/role-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { DepartmentsGuard } from '../../../common/guards/departments.guard';
import { Departments } from '../../../common/decorators/departments.decorator';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';

interface AuthenticatedRequest extends Request {
  user: {
    id: number;
    [key: string]: any;
  };
}

@ApiTags('Roles')
@ApiBearerAuth()
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  /**
   * Create a new role
   */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard, DepartmentsGuard)
  @Departments('HR', 'Admin')
  @ApiOperation({ summary: 'Create a new role' })
  @ApiResponse({
    status: 201,
    description: 'Role successfully created',
    type: RoleResponseDto,
  })
  async createRole(
    @Body() dto: CreateRoleDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<RoleResponseDto> {
    return await this.rolesService.createRole(dto);
  }

  /**
   * Get all roles with filters and pagination
   */
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard, DepartmentsGuard)
  @Departments('HR', 'Admin')
  @ApiOperation({
    summary: 'Get all roles with optional filters and pagination',
  })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'List of roles',
    type: RolesListResponseDto,
  })
  async getRoles(
    @Query() query: GetRolesDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<RolesListResponseDto> {
    return await this.rolesService.getRoles(query);
  }

  /**
   * Get a specific role by ID
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, DepartmentsGuard)
  @Departments('HR', 'Admin')
  @ApiOperation({ summary: 'Get role by ID' })
  @ApiParam({ name: 'id', type: Number, description: 'Role ID' })
  @ApiResponse({
    status: 200,
    description: 'Role found',
    type: RoleResponseDto,
  })
  async getRoleById(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: AuthenticatedRequest,
  ): Promise<RoleResponseDto> {
    return await this.rolesService.getRoleById(id);
  }

  /**
   * Update a role
   */
  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, DepartmentsGuard)
  @Departments('HR', 'Admin')
  @ApiOperation({ summary: 'Update a role' })
  @ApiParam({ name: 'id', type: Number, description: 'Role ID' })
  @ApiResponse({
    status: 200,
    description: 'Role updated successfully',
    type: RoleResponseDto,
  })
  async updateRole(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateRoleDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<RoleResponseDto> {
    return await this.rolesService.updateRole(id, dto);
  }

  /**
   * Delete a role
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, DepartmentsGuard)
  @Departments('HR', 'Admin')
  @ApiOperation({ summary: 'Delete a role' })
  @ApiParam({ name: 'id', type: Number, description: 'Role ID' })
  @ApiResponse({
    status: 200,
    description: 'Role deleted successfully',
    schema: { example: { message: 'Role deleted successfully' } },
  })
  async deleteRole(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: AuthenticatedRequest,
  ): Promise<{ message: string }> {
    return await this.rolesService.deleteRole(id);
  }
}
