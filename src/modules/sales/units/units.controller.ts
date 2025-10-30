import { Controller, Post, Get, Patch, Delete, Body, Param, UseGuards, ParseIntPipe, Request, Query, BadRequestException } from '@nestjs/common';
import { UnitsService } from './units.service';
import { CreateSalesUnitDto } from './dto/create-unit.dto';
import { UpdateSalesUnitDto } from './dto/update-unit.dto';
import { SalesUnitsQueryDto } from './dto/units-query.dto';
import { AddTeamDto } from './dto/add-team.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesWithServiceGuard } from '../../../common/guards/roles-with-service.guard';
import { Departments } from '../../../common/decorators/departments.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { DepartmentsGuard } from '../../../common/guards/departments.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam, ApiBearerAuth, ApiBody } from '@nestjs/swagger';

@ApiTags('Sales Units')
@ApiBearerAuth()
@Controller('sales/units')
@UseGuards(JwtAuthGuard, RolesWithServiceGuard, DepartmentsGuard)
export class UnitsController {
  constructor(private readonly unitsService: UnitsService) {}

  @Post()
  @Roles('dep_manager')
  @Departments('Sales')
  @ApiOperation({ summary: 'Create a new sales unit' })
  @ApiResponse({ status: 201, description: 'Unit successfully created' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  async createUnit(@Body() createUnitDto: CreateSalesUnitDto, @Query() query: any) {
    if (Object.keys(query).length > 0) {
      throw new BadRequestException(
        'Query parameters are not allowed for creating units. Use POST /sales/units with request body only.'
      );
    }
    return this.unitsService.createUnit(createUnitDto);
  }

  @Get()
  @Roles('dep_manager', 'unit_head', 'team_lead', 'senior', 'junior')
  @Departments('Sales')
  @ApiOperation({ summary: 'Get all sales units with advanced filtering and pagination' })
  @ApiQuery({ name: 'unitId', required: false, description: 'Get specific unit by ID' })
  @ApiQuery({ name: 'include', required: false, description: 'Include related data (comma-separated: employees,leads,teams,head)' })
  @ApiQuery({ name: 'hasHead', required: false, description: 'Filter units that have heads assigned' })
  @ApiQuery({ name: 'hasTeams', required: false, description: 'Filter units that have teams assigned' })
  @ApiQuery({ name: 'hasLeads', required: false, description: 'Filter units that have leads' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number for pagination' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of items per page' })
  @ApiQuery({ name: 'sortBy', required: false, description: 'Sort by field (name, createdAt, updatedAt)' })
  @ApiQuery({ name: 'sortOrder', required: false, description: 'Sort order (asc, desc)' })
  @ApiResponse({ status: 200, description: 'List of units with pagination and filtering' })
  async getAllUnits(@Request() req, @Query() query: SalesUnitsQueryDto) {
    return this.unitsService.getAllUnits(req.user, query);
  }

  @Get('available-heads')
  @Roles('dep_manager')
  @Departments('Sales')
  @ApiOperation({ summary: 'Get available heads for units' })
  @ApiQuery({ name: 'assigned', required: false, description: 'Filter by assigned heads (true/false)' })
  @ApiResponse({ status: 200, description: 'List of available heads' })
  async getAvailableUnitHeads(@Query('assigned') assigned?: string) {
    // Convert string query parameter to boolean
    let assignedBoolean: boolean | undefined;
    if (assigned !== undefined) {
      if (assigned === 'true') {
        assignedBoolean = true;
      } else if (assigned === 'false') {
        assignedBoolean = false;
      } else {
        throw new BadRequestException('assigned parameter must be true or false');
      }
    }
    
    return this.unitsService.getAvailableUnitHeads(assignedBoolean);
  }

  @Get('available-teams')
  @Roles('dep_manager')
  @Departments('Sales')
  @ApiOperation({ summary: 'Get available teams for assignment to sales units' })
  @ApiQuery({ name: 'assigned', required: false, description: 'Filter by assigned teams (true/false)' })
  @ApiResponse({ status: 200, description: 'List of available teams' })
  async getAvailableTeams(@Query('assigned') assigned?: string) {
    // Convert string query parameter to boolean
    let assignedBoolean: boolean | undefined;
    if (assigned !== undefined) {
      if (assigned === 'true') {
        assignedBoolean = true;
      } else if (assigned === 'false') {
        assignedBoolean = false;
      } else {
        throw new BadRequestException('assigned parameter must be true or false');
      }
    }
    
    return this.unitsService.getAvailableTeams(assignedBoolean);
  }

  @Post(':id/teams')
  @Roles('dep_manager', 'unit_head')
  @Departments('Sales')
  @ApiOperation({ summary: 'Add a team to a sales unit' })
  @ApiParam({ name: 'id', type: Number, description: 'Unit ID' })
  @ApiBody({ type: AddTeamDto })
  @ApiResponse({ status: 200, description: 'Team successfully assigned to unit' })
  @ApiResponse({ status: 400, description: 'Team already assigned or validation error' })
  @ApiResponse({ status: 404, description: 'Unit or team not found' })
  async addTeamToUnit(
    @Param('id', ParseIntPipe) unitId: number,
    @Body() addTeamDto: AddTeamDto
  ) {
    return this.unitsService.addTeamToUnit(unitId, addTeamDto.teamId);
  }

  @Delete(':id/teams/:teamId')
  @Roles('dep_manager', 'unit_head')
  @Departments('Sales')
  @ApiOperation({ summary: 'Remove a team from a sales unit' })
  @ApiParam({ name: 'id', type: Number, description: 'Unit ID' })
  @ApiParam({ name: 'teamId', type: Number, description: 'Team ID' })
  @ApiResponse({ status: 200, description: 'Team successfully removed from unit' })
  @ApiResponse({ status: 400, description: 'Team does not belong to unit' })
  @ApiResponse({ status: 404, description: 'Unit or team not found' })
  async removeTeamFromUnit(
    @Param('id', ParseIntPipe) unitId: number,
    @Param('teamId', ParseIntPipe) teamId: number
  ) {
    return this.unitsService.removeTeamFromUnit(unitId, teamId);
  }

  @Get('deleted/completed-leads')
  @Roles('dep_manager')
  @Departments('Sales')
  @ApiOperation({ summary: 'Get completed (cracked) leads from deleted units' })
  async getCompletedLeadsFromDeletedUnits(@Request() req) {
    return this.unitsService.getCompletedLeadsFromDeletedUnits(req.user);
  }

  @Get(':id')
  @Roles('dep_manager', 'unit_head', 'team_lead', 'senior', 'junior')
  @Departments('Sales')
  @ApiOperation({ summary: 'Get details of a specific unit by ID with comprehensive data' })
  @ApiParam({ name: 'id', type: Number, description: 'Unit ID' })
  @ApiResponse({ status: 200, description: 'Unit details with teams, employees, and leads based on user role' })
  @ApiResponse({ status: 404, description: 'Unit not found' })
  async getUnit(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.unitsService.getUnit(id, req.user);
  }

  @Patch(':id')
  @Roles('dep_manager', 'unit_head')
  @Departments('Sales')
  @ApiOperation({ summary: 'Update a sales unit' })
  @ApiParam({ name: 'id', type: Number, description: 'Unit ID' })
  async updateUnit(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUnitDto: UpdateSalesUnitDto,
    @Query() query: any
  ) {
    if (Object.keys(query).length > 0) {
      throw new BadRequestException(
        'Query parameters are not allowed for updating units. Use PATCH /sales/units/:id with request body only.'
      );
    }
    return this.unitsService.updateUnit(id, updateUnitDto);
  }

  @Delete(':id')
  @Roles('dep_manager')
  @Departments('Sales')
  @ApiOperation({ summary: 'Delete a sales unit' })
  @ApiParam({ name: 'id', type: Number, description: 'Unit ID' })
  async deleteUnit(@Param('id', ParseIntPipe) id: number, @Query() query: any) {
    if (Object.keys(query).length > 0) {
      throw new BadRequestException(
        'Query parameters are not allowed for deleting units. Use DELETE /sales/units/:id only.'
      );
    }
    return this.unitsService.deleteUnit(id);
  }
}
