import { Controller, Post, Get, Patch, Delete, Body, Param, UseGuards, ParseIntPipe, Request, Query } from '@nestjs/common';
import { UnitsService } from './units.service';
import { CreateUnitDto } from './dto/create-unit.dto';
import { UpdateUnitDto } from './dto/update-unit.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesWithServiceGuard } from '../../../common/guards/roles-with-service.guard';
import { DepartmentsGuard } from '../../../common/guards/departments.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Departments } from '../../../common/decorators/departments.decorator';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam, ApiBody } from '@nestjs/swagger';

@ApiTags('Production Units')
@Controller('production/units')
@UseGuards(JwtAuthGuard, RolesWithServiceGuard, DepartmentsGuard)
export class UnitsController {
  constructor(private readonly unitsService: UnitsService) {}

  @Post('create')
  @Roles('dep_manager')
  @Departments('Production')
  @ApiOperation({ summary: 'Create a new production unit' })
  @ApiBody({ type: CreateUnitDto })
  @ApiResponse({ status: 201, description: 'Unit created successfully' })
  async createUnit(@Body() createUnitDto: CreateUnitDto) {
    return this.unitsService.createUnit(createUnitDto);
  }

  @Get()
  @Roles('dep_manager')
  @Departments('Production')
  @ApiOperation({ summary: 'Get all production units' })
  @ApiResponse({ status: 200, description: 'List of all units' })
  async getAllUnits() {
    return this.unitsService.getAllUnits();
  }

  @Patch('update/:id')
  @Roles('dep_manager')
  @Departments('Production')
  @ApiOperation({ summary: 'Update a production unit by ID' })
  @ApiParam({ name: 'id', type: Number, description: 'Unit ID' })
  @ApiBody({ type: UpdateUnitDto })
  @ApiResponse({ status: 200, description: 'Unit updated successfully' })
  async updateUnit(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUnitDto: UpdateUnitDto
  ) {
    return this.unitsService.updateUnit(id, updateUnitDto);
  }

  @Get('get/:id')
  @Roles('dep_manager')
  @Departments('Production')
  @ApiOperation({ summary: 'Get a production unit by ID' })
  @ApiParam({ name: 'id', type: Number, description: 'Unit ID' })
  @ApiResponse({ status: 200, description: 'Unit details' })
  async getUnit(@Param('id', ParseIntPipe) id: number) {
    return this.unitsService.getUnit(id);
  }

  @Get(':id/employees')
  @Roles('dep_manager', 'unit_head')
  @Departments('Production')
  @ApiOperation({ summary: 'Get employees in a production unit' })
  @ApiParam({ name: 'id', type: Number, description: 'Unit ID' })
  @ApiResponse({ status: 200, description: 'List of employees in unit' })
  async getEmployeesInUnit(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.unitsService.getEmployeesInUnit(id, req.user);
  }

  @Get(':id/projects')
  @Roles('dep_manager', 'unit_head')
  @Departments('Production')
  @ApiOperation({ summary: 'Get projects in a production unit' })
  @ApiParam({ name: 'id', type: Number, description: 'Unit ID' })
  @ApiResponse({ status: 200, description: 'List of projects in unit' })
  async getProjectsInUnit(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.unitsService.getProjectsInUnit(id, req.user);
  }

  @Delete('delete/:id')
  @Roles('dep_manager')
  @Departments('Production')
  @ApiOperation({ summary: 'Delete a production unit by ID' })
  @ApiParam({ name: 'id', type: Number, description: 'Unit ID' })
  @ApiResponse({ status: 200, description: 'Unit deleted successfully' })
  async deleteUnit(@Param('id', ParseIntPipe) id: number) {
    return this.unitsService.deleteUnit(id);
  }

  @Get('deleted/completed-projects')
  @Roles('dep_manager')
  @Departments('Production')
  @ApiOperation({ summary: 'Get completed projects from deleted units' })
  @ApiResponse({ status: 200, description: 'List of completed projects from deleted units' })
  async getCompletedProjectsFromDeletedUnits() {
    return this.unitsService.getCompletedProjectsFromDeletedUnits();
  }

  @Get('available-heads')
  @Roles('dep_manager')
  @Departments('Production')
  @ApiOperation({ summary: 'Get available employees to assign as unit heads' })
  @ApiQuery({ name: 'assigned', required: false, description: 'Filter by already assigned heads (true/false)' })
  @ApiResponse({ status: 200, description: 'List of available heads' })
  async getAvailableHeads(@Query('assigned') assigned?: string) {
    // Convert string query parameter to boolean
    let assignedBoolean: boolean | undefined;
    if (assigned === 'true') assignedBoolean = true;
    else if (assigned === 'false') assignedBoolean = false;
    
    return this.unitsService.getAvailableHeads(assignedBoolean);
  }
} 