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
import { DepartmentsService } from './departments.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import {
  AdminDepartmentResponseDto,
  AdminDepartmentsListResponseDto,
} from './dto/department-response.dto';
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

@ApiTags('Admin Settings - Departments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('admin/settings/departments')
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  /**
   * Get all departments (admin only)
   */
  @Get()
  @ApiOperation({
    summary: 'Get all departments',
    description:
      'Retrieve all departments with pagination and search. Admin only.',
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
    name: 'search',
    required: false,
    example: 'HR',
    description: 'Search by name or description',
  })
  @ApiOkResponse({
    type: AdminDepartmentsListResponseDto,
    description: 'List of departments retrieved successfully.',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized: Invalid or missing token.',
  })
  @ApiForbiddenResponse({
    description: 'Forbidden: Only admins can access this endpoint.',
  })
  async getAllDepartments(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('search') search?: string,
  ): Promise<AdminDepartmentsListResponseDto> {
    return this.departmentsService.getAllDepartments(page, limit, search);
  }

  /**
   * Get department by ID (admin only)
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get department by ID',
    description: 'Retrieve a specific department by ID. Admin only.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    example: 1,
    description: 'Department ID',
  })
  @ApiOkResponse({
    type: AdminDepartmentResponseDto,
    description: 'Department retrieved successfully.',
  })
  @ApiNotFoundResponse({ description: 'Department not found.' })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized: Invalid or missing token.',
  })
  @ApiForbiddenResponse({
    description: 'Forbidden: Only admins can access this endpoint.',
  })
  async getDepartmentById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<AdminDepartmentResponseDto> {
    return this.departmentsService.getDepartmentById(id);
  }

  /**
   * Create a new department (admin only)
   */
  @Post()
  @ApiOperation({
    summary: 'Create a new department',
    description: 'Create a new department. Admin only.',
  })
  @ApiBody({ type: CreateDepartmentDto })
  @ApiCreatedResponse({
    type: AdminDepartmentResponseDto,
    description: 'Department created successfully.',
  })
  @ApiBadRequestResponse({
    description:
      'Bad Request: Validation error or department name already exists.',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized: Invalid or missing token.',
  })
  @ApiForbiddenResponse({
    description: 'Forbidden: Only admins can access this endpoint.',
  })
  async createDepartment(
    @Body() dto: CreateDepartmentDto,
  ): Promise<AdminDepartmentResponseDto> {
    return this.departmentsService.createDepartment(dto);
  }

  /**
   * Update department (admin only)
   */
  @Put(':id')
  @ApiOperation({
    summary: 'Update department',
    description: 'Update a department by ID. Admin only.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    example: 1,
    description: 'Department ID',
  })
  @ApiBody({ type: UpdateDepartmentDto })
  @ApiOkResponse({
    type: AdminDepartmentResponseDto,
    description: 'Department updated successfully.',
  })
  @ApiBadRequestResponse({
    description: 'Bad Request: Validation error or update failed.',
  })
  @ApiNotFoundResponse({ description: 'Department not found.' })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized: Invalid or missing token.',
  })
  @ApiForbiddenResponse({
    description: 'Forbidden: Only admins can access this endpoint.',
  })
  async updateDepartment(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateDepartmentDto,
  ): Promise<AdminDepartmentResponseDto> {
    return this.departmentsService.updateDepartment(id, dto);
  }

  /**
   * Delete department (admin only)
   */
  @Delete(':id')
  @ApiOperation({
    summary: 'Delete department',
    description:
      'Delete a department by ID. Cannot delete if department has employees. Admin only.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    example: 1,
    description: 'Department ID',
  })
  @ApiOkResponse({
    description: 'Department deleted successfully.',
    schema: { example: { message: 'Department deleted successfully' } },
  })
  @ApiBadRequestResponse({
    description: 'Bad Request: Department has employees or deletion failed.',
  })
  @ApiNotFoundResponse({ description: 'Department not found.' })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized: Invalid or missing token.',
  })
  @ApiForbiddenResponse({
    description: 'Forbidden: Only admins can access this endpoint.',
  })
  async deleteDepartment(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ message: string }> {
    return this.departmentsService.deleteDepartment(id);
  }
}
