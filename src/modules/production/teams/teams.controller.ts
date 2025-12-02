import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  ParseIntPipe,
  Request,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { TeamsService } from './teams.service';
import { CreateProductionTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { TeamsQueryDto } from './dto/teams-query.dto';
import { AddMembersDto } from './dto/add-members.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesWithServiceGuard } from '../../../common/guards/roles-with-service.guard';
import { DepartmentsGuard } from '../../../common/guards/departments.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Departments } from '../../../common/decorators/departments.decorator';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';

@ApiTags('Production Teams')
@ApiBearerAuth()
@Controller('production/teams')
@UseGuards(JwtAuthGuard, RolesWithServiceGuard, DepartmentsGuard)
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Post()
  @Roles('dep_manager', 'unit_head')
  @Departments('Production')
  @ApiOperation({
    summary: 'Create a new production team',
    description: 'Creates a new production team with team lead assignment',
  })
  @ApiBody({ type: CreateProductionTeamDto })
  @ApiResponse({ status: 201, description: 'Team created successfully' })
  async createTeam(
    @Body() createTeamDto: CreateProductionTeamDto,
    @Request() req,
    @Query() query: any,
  ) {
    // Check if any query parameters are provided
    if (Object.keys(query).length > 0) {
      throw new BadRequestException(
        'Query parameters are not allowed for creating teams. Use POST /production/teams with request body only.',
      );
    }
    return this.teamsService.createTeam(createTeamDto, req.user);
  }

  @Get()
  @Roles('dep_manager', 'unit_head', 'team_lead', 'senior', 'junior')
  @Departments('Production')
  @ApiOperation({
    summary: 'Get production teams with role-based access and filtering',
  })
  @ApiQuery({
    name: 'teamId',
    required: false,
    description: 'Get specific team by ID',
  })
  @ApiQuery({
    name: 'unitId',
    required: false,
    description: 'Get teams by production unit ID',
  })
  @ApiQuery({
    name: 'include',
    required: false,
    description:
      'Include related data (comma-separated: members,projects,unit,lead)',
  })
  @ApiQuery({
    name: 'hasLead',
    required: false,
    description: 'Filter teams that have leads assigned',
  })
  @ApiQuery({
    name: 'hasMembers',
    required: false,
    description: 'Filter teams that have members',
  })
  @ApiQuery({
    name: 'hasProjects',
    required: false,
    description: 'Filter teams that have projects',
  })
  @ApiQuery({
    name: 'teamName',
    required: false,
    description: 'Filter by team name (partial match)',
  })
  @ApiQuery({
    name: 'leadEmail',
    required: false,
    description: 'Filter by team lead email',
  })
  @ApiQuery({
    name: 'leadName',
    required: false,
    description: 'Filter by team lead name (firstName or lastName)',
  })
  @ApiQuery({
    name: 'unitName',
    required: false,
    description: 'Filter by production unit name',
  })
  @ApiQuery({
    name: 'minMembers',
    required: false,
    description: 'Minimum number of members',
  })
  @ApiQuery({
    name: 'maxMembers',
    required: false,
    description: 'Maximum number of members',
  })
  @ApiQuery({
    name: 'minProjects',
    required: false,
    description: 'Minimum number of projects',
  })
  @ApiQuery({
    name: 'maxProjects',
    required: false,
    description: 'Maximum number of projects',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number for pagination',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of items per page',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    description: 'Sort by field (name, createdAt, updatedAt, employeeCount)',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    description: 'Sort order (asc, desc)',
  })
  @ApiResponse({
    status: 200,
    description: 'List of teams based on user role and permissions',
  })
  async getAllTeams(@Request() req, @Query() query: TeamsQueryDto) {
    return this.teamsService.getAllTeams(req.user, query);
  }

  @Get('available-leads')
  @Roles('dep_manager', 'unit_head')
  @Departments('Production')
  @ApiOperation({ summary: 'Get available employees to assign as team leads' })
  @ApiQuery({
    name: 'assigned',
    required: false,
    description: 'Filter by already assigned leads (true/false)',
  })
  @ApiResponse({ status: 200, description: 'List of available team leads' })
  async getAvailableLeads(@Query('assigned') assigned?: string) {
    // Convert string query parameter to boolean
    let assignedBoolean: boolean | undefined;
    if (assigned === 'true') assignedBoolean = true;
    else if (assigned === 'false') assignedBoolean = false;

    return this.teamsService.getAvailableLeads(assignedBoolean);
  }

  @Get('available-employees')
  @Roles('dep_manager', 'unit_head', 'team_lead')
  @Departments('Production')
  @ApiOperation({ summary: 'Get available employees to add to teams' })
  @ApiQuery({
    name: 'assigned',
    required: false,
    description: 'Filter by already assigned employees (true/false)',
  })
  @ApiResponse({ status: 200, description: 'List of available employees' })
  async getAvailableEmployees(@Query('assigned') assigned?: string) {
    // Convert string query parameter to boolean
    let assignedBoolean: boolean | undefined;
    if (assigned === 'true') assignedBoolean = true;
    else if (assigned === 'false') assignedBoolean = false;

    return this.teamsService.getAvailableEmployees(assignedBoolean);
  }

  @Get(':id')
  @Roles('dep_manager', 'unit_head', 'team_lead', 'senior', 'junior')
  @Departments('Production')
  @ApiOperation({ summary: 'Get production team by ID with full details' })
  @ApiParam({ name: 'id', type: Number, description: 'Team ID' })
  @ApiResponse({
    status: 200,
    description: 'Team details with members and projects',
  })
  async getTeamById(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.teamsService.getTeam(id, req.user);
  }

  @Patch(':id')
  @Roles('dep_manager', 'unit_head', 'team_lead')
  @Departments('Production')
  @ApiOperation({ summary: 'Update a production team by ID' })
  @ApiParam({ name: 'id', type: Number, description: 'Team ID' })
  @ApiBody({ type: UpdateTeamDto })
  @ApiResponse({ status: 200, description: 'Team updated successfully' })
  async updateTeam(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTeamDto: UpdateTeamDto,
    @Request() req,
    @Query() query: any,
  ) {
    // Check if any query parameters are provided
    if (Object.keys(query).length > 0) {
      throw new BadRequestException(
        'Query parameters are not allowed for updating teams. Use PATCH /production/teams/:id with request body only.',
      );
    }
    return this.teamsService.updateTeam(id, updateTeamDto, req.user);
  }

  @Delete(':id')
  @Roles('dep_manager')
  @Departments('Production')
  @ApiOperation({ summary: 'Delete a production team by ID' })
  @ApiParam({ name: 'id', type: Number, description: 'Team ID' })
  @ApiResponse({ status: 200, description: 'Team deleted successfully' })
  async deleteTeam(@Param('id', ParseIntPipe) id: number, @Query() query: any) {
    // Check if any query parameters are provided
    if (Object.keys(query).length > 0) {
      throw new BadRequestException(
        'Query parameters are not allowed for deleting teams. Use DELETE /production/teams/:id only.',
      );
    }
    return this.teamsService.deleteTeam(id);
  }

  @Post(':id/members')
  @Roles('dep_manager', 'unit_head', 'team_lead')
  @Departments('Production')
  @ApiOperation({ summary: 'Add members to production team (bulk operation)' })
  @ApiParam({ name: 'id', type: Number, description: 'Team ID' })
  @ApiBody({ type: AddMembersDto })
  @ApiResponse({
    status: 201,
    description: 'Members added to team successfully',
  })
  async addMembersToTeam(
    @Param('id', ParseIntPipe) teamId: number,
    @Body() addMembersDto: AddMembersDto,
    @Request() req,
  ) {
    return this.teamsService.addMembersToTeam(teamId, addMembersDto, req.user);
  }

  @Delete(':id/members/:employeeId')
  @Roles('dep_manager', 'unit_head', 'team_lead')
  @Departments('Production')
  @ApiOperation({ summary: 'Remove member from production team' })
  @ApiParam({ name: 'id', type: Number, description: 'Team ID' })
  @ApiParam({
    name: 'employeeId',
    type: Number,
    description: 'Employee ID to remove',
  })
  @ApiResponse({
    status: 200,
    description: 'Member removed from team successfully',
  })
  async removeMemberFromTeam(
    @Param('id', ParseIntPipe) teamId: number,
    @Param('employeeId', ParseIntPipe) employeeId: number,
    @Request() req,
  ) {
    return this.teamsService.removeMemberFromTeam(teamId, employeeId, req.user);
  }
}
