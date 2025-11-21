import { Controller, Post, Get, Patch, Delete, Body, Param, UseGuards, ParseIntPipe, Request, Query, BadRequestException } from '@nestjs/common';
import { UnitsService } from './units.service';
import { CreateProductionUnitDto } from './dto/create-unit.dto';
import { UpdateProductionUnitDto } from './dto/update-unit.dto';
import { UnitsQueryDto } from './dto/units-query.dto';
import { AddTeamToProductionUnitDto } from './dto/add-team.dto';
import { RemoveTeamDto } from './dto/remove-team.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesWithServiceGuard } from '../../../common/guards/roles-with-service.guard';
import { DepartmentsGuard } from '../../../common/guards/departments.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Departments } from '../../../common/decorators/departments.decorator';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam, ApiBody, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Production Units')
@ApiBearerAuth()
@Controller('production/units')
@UseGuards(JwtAuthGuard, RolesWithServiceGuard, DepartmentsGuard)
export class UnitsController {
  constructor(private readonly unitsService: UnitsService) {}

  @Post()
  @Roles('dep_manager')
  @Departments('Production')
  @ApiOperation({ summary: 'Create a new production unit' })
  @ApiBody({ type: CreateProductionUnitDto })
  @ApiResponse({ status: 201, description: 'Unit created successfully' })
  async createUnit(
    @Body() createUnitDto: CreateProductionUnitDto,
    @Query() query: any
  ) {
    // Check if any query parameters are provided
    if (Object.keys(query).length > 0) {
      throw new BadRequestException(
        'Query parameters are not allowed for creating units. Use POST /production/units with request body only.'
      );
    }
    return this.unitsService.createUnit(createUnitDto);
  }

  @Get()
  @Roles('dep_manager', 'unit_head', 'team_lead', 'senior', 'junior')
  @Departments('Production')
  @ApiOperation({ summary: 'Get production units with role-based access and filtering' })
  @ApiQuery({ name: 'unitId', required: false, description: 'Get specific unit by ID' })
  @ApiQuery({ name: 'include', required: false, description: 'Include related data (comma-separated: employees,projects,teams,head)' })
  @ApiQuery({ name: 'hasHead', required: false, description: 'Filter units that have heads assigned' })
  @ApiQuery({ name: 'hasTeams', required: false, description: 'Filter units that have teams assigned' })
  @ApiQuery({ name: 'hasProjects', required: false, description: 'Filter units that have projects' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number for pagination' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of items per page' })
  @ApiQuery({ name: 'sortBy', required: false, description: 'Sort by field (name, createdAt, updatedAt)' })
  @ApiQuery({ name: 'sortOrder', required: false, description: 'Sort order (asc, desc)' })
  @ApiQuery({ name: 'headEmail', required: false, description: 'Filter by unit head email' })
  @ApiQuery({ name: 'headName', required: false, description: 'Filter by unit head name (firstName or lastName)' })
  @ApiQuery({ name: 'unitName', required: false, description: 'Filter by unit name (partial match)' })
  @ApiQuery({ name: 'minTeams', required: false, description: 'Minimum number of teams' })
  @ApiQuery({ name: 'maxTeams', required: false, description: 'Maximum number of teams' })
  @ApiQuery({ name: 'minProjects', required: false, description: 'Minimum number of projects' })
  @ApiQuery({ name: 'maxProjects', required: false, description: 'Maximum number of projects' })
  @ApiResponse({ status: 200, description: 'List of units based on user role and permissions' })
  async getAllUnits(@Request() req, @Query() query: UnitsQueryDto) {
    return this.unitsService.getAllUnits(req.user, query);
  }

  @Patch(':id')
  @Roles('dep_manager', 'unit_head')
  @Departments('Production')
  @ApiOperation({ summary: 'Update a production unit by ID' })
  @ApiParam({ name: 'id', type: Number, description: 'Unit ID' })
  @ApiBody({ type: UpdateProductionUnitDto })
  @ApiResponse({ status: 200, description: 'Unit updated successfully' })
  async updateUnit(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUnitDto: UpdateProductionUnitDto,
    @Request() req,
    @Query() query: any
  ) {
    // Check if any query parameters are provided
    if (Object.keys(query).length > 0) {
      throw new BadRequestException(
        'Query parameters are not allowed for updating units. Use PATCH /production/units/:id with request body only.'
      );
    }
    return this.unitsService.updateUnit(id, updateUnitDto, req.user);
  }



  @Delete(':id')
  @Roles('dep_manager')
  @Departments('Production')
  @ApiOperation({ summary: 'Delete a production unit by ID' })
  @ApiParam({ name: 'id', type: Number, description: 'Unit ID' })
  @ApiResponse({ status: 200, description: 'Unit deleted successfully' })
  async deleteUnit(@Param('id', ParseIntPipe) id: number, @Query() query: any) {
    // Check if any query parameters are provided
    if (Object.keys(query).length > 0) {
      throw new BadRequestException(
        'Query parameters are not allowed for deleting units. Use DELETE /production/units/:id only.'
      );
    }
    return this.unitsService.deleteUnit(id);
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

  @Get('available-teams')
  @Roles('dep_manager', 'unit_head')
  @Departments('Production')
  @ApiOperation({ summary: 'Get available teams to assign to production units' })
  @ApiQuery({ name: 'assigned', required: false, description: 'Filter by already assigned teams (true/false)' })
  @ApiResponse({ status: 200, description: 'List of available teams' })
  async getAvailableTeams(@Query('assigned') assigned?: string) {
    // Convert string query parameter to boolean
    let assignedBoolean: boolean | undefined;
    if (assigned === 'true') assignedBoolean = true;
    else if (assigned === 'false') assignedBoolean = false;
    
    return this.unitsService.getAvailableTeams(assignedBoolean);
  }

  @Get(':id')
  @Roles('dep_manager', 'unit_head', 'team_lead', 'senior', 'junior')
  @Departments('Production')
  @ApiOperation({ summary: 'Get production unit by ID with full details' })
  @ApiParam({ name: 'id', type: Number, description: 'Unit ID' })
  @ApiResponse({ status: 200, description: 'Unit details with teams and projects' })
  async getUnitById(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.unitsService.getUnit(id, req.user);
  }

  @Post(':id/teams')
  @Roles('dep_manager', 'unit_head')
  @Departments('Production')
  @ApiOperation({ summary: 'Add team to production unit' })
  @ApiParam({ name: 'id', type: Number, description: 'Unit ID' })
  @ApiBody({ type: AddTeamToProductionUnitDto })
  @ApiResponse({ status: 201, description: 'Team added to unit successfully' })
  async addTeamToUnit(
    @Param('id', ParseIntPipe) unitId: number,
    @Body() addTeamDto: AddTeamToProductionUnitDto
  ) {
    return this.unitsService.addTeamToUnit(unitId, addTeamDto.teamId);
  }

  @Delete(':id/teams/:teamId')
  @Roles('dep_manager', 'unit_head')
  @Departments('Production')
  @ApiOperation({ summary: 'Remove team from production unit' })
  @ApiParam({ name: 'id', type: Number, description: 'Unit ID' })
  @ApiParam({ name: 'teamId', type: Number, description: 'Team ID' })
  @ApiResponse({ status: 200, description: 'Team removed from unit successfully' })
  async removeTeamFromUnit(
    @Param('id', ParseIntPipe) unitId: number,
    @Param('teamId', ParseIntPipe) teamId: number
  ) {
    return this.unitsService.removeTeamFromUnit(unitId, teamId);
  }
} 