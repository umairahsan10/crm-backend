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
import { HrPermissionsService } from './hr-permissions.service';
import { CreateHrPermissionDto } from './dto/create-hr-permission.dto';
import { UpdateHrPermissionDto } from './dto/update-hr-permission.dto';
import {
  HrPermissionResponseDto,
  HrPermissionsListResponseDto,
} from './dto/hr-permission-response.dto';
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

@ApiTags('Admin Settings - HR Permissions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('admin/settings/hr-permissions')
export class HrPermissionsController {
  constructor(private readonly hrPermissionsService: HrPermissionsService) {}

  /**
   * Get all HR permissions (admin only)
   */
  @Get()
  @ApiOperation({
    summary: 'Get all HR permissions',
    description:
      'Retrieve all HR permission records with pagination. Admin only.',
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
    type: HrPermissionsListResponseDto,
    description: 'List of HR permissions retrieved successfully.',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized: Invalid or missing token.',
  })
  @ApiForbiddenResponse({
    description: 'Forbidden: Only admins can access this endpoint.',
  })
  async getAllHrPermissions(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('employeeId') employeeId?: string,
  ): Promise<HrPermissionsListResponseDto> {
    const employeeIdNum = employeeId ? parseInt(employeeId, 10) : undefined;
    return this.hrPermissionsService.getAllHrPermissions(
      page,
      limit,
      employeeIdNum,
    );
  }

  /**
   * Get HR permission by ID (admin only)
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get HR permission by ID',
    description: 'Retrieve a specific HR permission record by ID. Admin only.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    example: 1,
    description: 'HR record ID',
  })
  @ApiOkResponse({
    type: HrPermissionResponseDto,
    description: 'HR permission retrieved successfully.',
  })
  @ApiNotFoundResponse({ description: 'HR permission not found.' })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized: Invalid or missing token.',
  })
  @ApiForbiddenResponse({
    description: 'Forbidden: Only admins can access this endpoint.',
  })
  async getHrPermissionById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<HrPermissionResponseDto> {
    return this.hrPermissionsService.getHrPermissionById(id);
  }

  /**
   * Create a new HR permission (admin only)
   */
  @Post()
  @ApiOperation({
    summary: 'Create a new HR permission',
    description: 'Create a new HR permission record. Admin only.',
  })
  @ApiBody({ type: CreateHrPermissionDto })
  @ApiCreatedResponse({
    type: HrPermissionResponseDto,
    description: 'HR permission created successfully.',
  })
  @ApiBadRequestResponse({
    description: 'Bad Request: Validation error or employee already in HR.',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized: Invalid or missing token.',
  })
  @ApiForbiddenResponse({
    description: 'Forbidden: Only admins can access this endpoint.',
  })
  async createHrPermission(
    @Body() dto: CreateHrPermissionDto,
  ): Promise<HrPermissionResponseDto> {
    return this.hrPermissionsService.createHrPermission(dto);
  }

  /**
   * Update HR permission (admin only)
   */
  @Put(':id')
  @ApiOperation({
    summary: 'Update HR permission',
    description: 'Update an HR permission record by ID. Admin only.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    example: 1,
    description: 'HR record ID',
  })
  @ApiBody({ type: UpdateHrPermissionDto })
  @ApiOkResponse({
    type: HrPermissionResponseDto,
    description: 'HR permission updated successfully.',
  })
  @ApiBadRequestResponse({
    description: 'Bad Request: Validation error or update failed.',
  })
  @ApiNotFoundResponse({ description: 'HR permission not found.' })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized: Invalid or missing token.',
  })
  @ApiForbiddenResponse({
    description: 'Forbidden: Only admins can access this endpoint.',
  })
  async updateHrPermission(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateHrPermissionDto,
  ): Promise<HrPermissionResponseDto> {
    return this.hrPermissionsService.updateHrPermission(id, dto);
  }

  /**
   * Delete HR permission (admin only)
   */
  @Delete(':id')
  @ApiOperation({
    summary: 'Delete HR permission',
    description: 'Delete an HR permission record by ID. Admin only.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    example: 1,
    description: 'HR record ID',
  })
  @ApiOkResponse({
    description: 'HR permission deleted successfully.',
    schema: { example: { message: 'HR record deleted successfully' } },
  })
  @ApiBadRequestResponse({ description: 'Bad Request: Deletion failed.' })
  @ApiNotFoundResponse({ description: 'HR permission not found.' })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized: Invalid or missing token.',
  })
  @ApiForbiddenResponse({
    description: 'Forbidden: Only admins can access this endpoint.',
  })
  async deleteHrPermission(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ message: string }> {
    return this.hrPermissionsService.deleteHrPermission(id);
  }
}
