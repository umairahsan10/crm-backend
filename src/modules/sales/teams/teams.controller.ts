import { Controller, Post, Get, Put, Patch, Delete, Param, Body, UseGuards, ParseIntPipe, Request, BadRequestException, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiQuery, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { TeamsService } from './teams.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesWithServiceGuard } from '../../../common/guards/roles-with-service.guard';
import { Departments } from '../../../common/decorators/departments.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { DepartmentsGuard } from '../../../common/guards/departments.guard';
import { CreateSalesTeamDto } from './dto/create-team.dto';
import { ReplaceTeamLeadDto } from './dto/replace-team-lead.dto';
import { AddEmployeeDto } from './dto/add-employee.dto';
import { AssignSalesTeamDto } from './dto/assign-team.dto';
import { SalesTeamsQueryDto } from './dto/teams-query.dto';
import { SalesAddMembersDto } from './dto/add-members.dto';
import { UpdateSalesTeamDto } from './dto/update-team.dto';

@ApiTags('Teams')
@ApiBearerAuth()
@Controller('sales/teams')
@UseGuards(JwtAuthGuard, RolesWithServiceGuard, DepartmentsGuard)
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  // 1. Create Team
  @Post()
  @Roles('dep_manager', 'unit_head')
  @Departments('Sales')
  @ApiOperation({ 
    summary: 'Create a new sales team',
    description: 'Creates a new sales team with team lead assignment in a specific sales unit'
  })
  @ApiBody({ type: CreateSalesTeamDto })
  @ApiResponse({ status: 201, description: 'Team created successfully' })
  async createTeam(
    @Body() createTeamDto: CreateSalesTeamDto,
    @Request() req,
    @Query() query: any
  ) {
    // Check if any query parameters are provided
    if (Object.keys(query).length > 0) {
      throw new BadRequestException(
        'Query parameters are not allowed for creating teams. Use POST /sales/teams with request body only.'
      );
    }
    return this.teamsService.createTeam(
      createTeamDto.name,
      createTeamDto.salesUnitId,
      createTeamDto.teamLeadId,
      req.user
    );
  }

  // 2. Get All Sales Teams (Enhanced with Advanced Filtering)
  @Get()
  @Roles('dep_manager', 'unit_head', 'team_lead', 'senior', 'junior')
  @Departments('Sales')
  @ApiOperation({ summary: 'Get sales teams with role-based access and advanced filtering' })
  @ApiQuery({ name: 'teamId', required: false, description: 'Get specific team by ID' })
  @ApiQuery({ name: 'salesUnitId', required: false, description: 'Get teams by sales unit ID' })
  @ApiQuery({ name: 'include', required: false, description: 'Include related data (comma-separated: members,leads,unit,lead)' })
  @ApiQuery({ name: 'hasLead', required: false, description: 'Filter teams that have leads assigned' })
  @ApiQuery({ name: 'hasMembers', required: false, description: 'Filter teams that have members' })
  @ApiQuery({ name: 'hasLeads', required: false, description: 'Filter teams that have leads' })
  @ApiQuery({ name: 'teamName', required: false, description: 'Filter by team name (partial match)' })
  @ApiQuery({ name: 'leadEmail', required: false, description: 'Filter by team lead email' })
  @ApiQuery({ name: 'leadName', required: false, description: 'Filter by team lead name (firstName or lastName)' })
  @ApiQuery({ name: 'unitName', required: false, description: 'Filter by sales unit name' })
  @ApiQuery({ name: 'minMembers', required: false, description: 'Minimum number of members' })
  @ApiQuery({ name: 'maxMembers', required: false, description: 'Maximum number of members' })
  @ApiQuery({ name: 'minCompletedLeads', required: false, description: 'Minimum number of completed leads' })
  @ApiQuery({ name: 'maxCompletedLeads', required: false, description: 'Maximum number of completed leads' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number for pagination' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of items per page' })
  @ApiQuery({ name: 'sortBy', required: false, description: 'Sort by field (name, createdAt, updatedAt, employeeCount, completedLeads)' })
  @ApiQuery({ name: 'sortOrder', required: false, description: 'Sort order (asc, desc)' })
  @ApiQuery({ name: 'search', required: false, description: 'Search by team name, lead name, or unit name' })
  @ApiQuery({ name: 'assigned', required: false, description: 'Filter by assignment status (assigned/unassigned)' })
  @ApiResponse({ status: 200, description: 'List of teams based on user role and permissions' })
  async getAllTeams(@Request() req, @Query() query: SalesTeamsQueryDto) {
    return this.teamsService.getAllTeams(req.user, query);
  }

  // 3. Replace Team Lead (Preserved Sales Teams Feature)
  @Put(':teamId/replace-lead')
  @Roles('dep_manager', 'unit_head')
  @Departments('Sales')
  @ApiOperation({ summary: 'Replace a team lead' })
  @ApiParam({ name: 'teamId', description: 'ID of the team', type: Number })
  @ApiBody({ type: ReplaceTeamLeadDto })
  async replaceTeamLead(
    @Param('teamId', ParseIntPipe) teamId: number,
    @Body() replaceTeamLeadDto: ReplaceTeamLeadDto
  ) {
    return this.teamsService.replaceTeamLead(teamId, replaceTeamLeadDto.newTeamLeadId);
  }

  // 4. Get Available Team Leads
  @Get('available-leads')
  @Roles('dep_manager', 'unit_head')
  @Departments('Sales')
  @ApiOperation({ summary: 'Get available employees to assign as team leads' })
  @ApiQuery({ name: 'assigned', required: false, description: 'Filter by already assigned leads (true/false)' })
  @ApiResponse({ status: 200, description: 'List of available team leads' })
  async getAvailableLeads(@Query('assigned') assigned?: string) {
    let assignedBoolean: boolean | undefined;
    if (assigned === 'true') assignedBoolean = true;
    else if (assigned === 'false') assignedBoolean = false;
    
    return this.teamsService.getAvailableLeads(assignedBoolean);
  }

  // 5. Get Available Employees
  @Get('available-employees')
  @Roles('dep_manager', 'unit_head', 'team_lead')
  @Departments('Sales')
  @ApiOperation({ summary: 'Get available employees to add to teams' })
  @ApiQuery({ name: 'assigned', required: false, description: 'Filter by already assigned employees (true/false)' })
  @ApiResponse({ status: 200, description: 'List of available employees' })
  async getAvailableEmployees(@Query('assigned') assigned?: string) {
    let assignedBoolean: boolean | undefined;
    if (assigned === 'true') assignedBoolean = true;
    else if (assigned === 'false') assignedBoolean = false;
    
    return this.teamsService.getAvailableEmployees(assignedBoolean);
  }

  // 6. Get Team by ID (Enhanced)
  @Get(':id')
  @Roles('dep_manager', 'unit_head', 'team_lead', 'senior', 'junior')
  @Departments('Sales')
  @ApiOperation({ summary: 'Get sales team by ID with full details' })
  @ApiParam({ name: 'id', type: Number, description: 'Team ID' })
  @ApiResponse({ status: 200, description: 'Team details with members and leads' })
  async getTeamById(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.teamsService.getTeam(id, req.user);
  }

  // 7. Update Team (New Feature)
  @Patch(':id')
  @Roles('dep_manager', 'unit_head', 'team_lead')
  @Departments('Sales')
  @ApiOperation({ summary: 'Update a sales team by ID' })
  @ApiParam({ name: 'id', type: Number, description: 'Team ID' })
  @ApiBody({ type: UpdateSalesTeamDto })
  @ApiResponse({ status: 200, description: 'Team updated successfully' })
  async updateTeam(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTeamDto: UpdateSalesTeamDto,
    @Request() req,
    @Query() query: any
  ) {
    if (Object.keys(query).length > 0) {
      throw new BadRequestException(
        'Query parameters are not allowed for updating teams. Use PATCH /sales/teams/:id with request body only.'
      );
    }
    return this.teamsService.updateTeam(id, updateTeamDto, req.user);
  }

  // 8. Add Members to Team (Bulk Operation - New Feature)
  @Post(':id/members')
  @Roles('dep_manager', 'unit_head', 'team_lead')
  @Departments('Sales')
  @ApiOperation({ summary: 'Add members to sales team (bulk operation)' })
  @ApiParam({ name: 'id', type: Number, description: 'Team ID' })
  @ApiBody({ type: SalesAddMembersDto })
  @ApiResponse({ status: 201, description: 'Members added to team successfully' })
  async addMembersToTeam(
    @Param('id', ParseIntPipe) teamId: number,
    @Body() addMembersDto: SalesAddMembersDto,
    @Request() req
  ) {
    return this.teamsService.addMembersToTeam(teamId, addMembersDto, req.user);
  }

  // 9. Add Single Employee to Team (Preserved Sales Teams Feature)
  @Post(':teamId/add-employee')
  @Roles('dep_manager', 'unit_head')
  @Departments('Sales')
  @ApiOperation({ summary: 'Add an employee to a team' })
  @ApiParam({ name: 'teamId', description: 'ID of the team', type: Number })
  @ApiBody({ type: AddEmployeeDto })
  async addEmployeeToTeam(
    @Param('teamId', ParseIntPipe) teamId: number,
    @Body() addEmployeeDto: AddEmployeeDto
  ) {
    return this.teamsService.addEmployeeToTeam(teamId, addEmployeeDto.employeeId);
  }

  // 10. Remove Member from Team (Enhanced)
  @Delete(':id/members/:employeeId')
  @Roles('dep_manager', 'unit_head', 'team_lead')
  @Departments('Sales')
  @ApiOperation({ summary: 'Remove member from sales team' })
  @ApiParam({ name: 'id', type: Number, description: 'Team ID' })
  @ApiParam({ name: 'employeeId', type: Number, description: 'Employee ID to remove' })
  @ApiResponse({ status: 200, description: 'Member removed from team successfully' })
  async removeMemberFromTeam(
    @Param('id', ParseIntPipe) teamId: number,
    @Param('employeeId', ParseIntPipe) employeeId: number,
    @Request() req
  ) {
    return this.teamsService.removeMemberFromTeam(teamId, employeeId, req.user);
  }

  // 11. Remove Employee from Team (Preserved Sales Teams Feature)
  @Delete(':teamId/remove-employee/:employeeId')
  @Roles('dep_manager', 'unit_head')
  @Departments('Sales')
  @ApiOperation({ summary: 'Remove an employee from a team' })
  @ApiParam({ name: 'teamId', description: 'ID of the team', type: Number })
  @ApiParam({ name: 'employeeId', description: 'ID of the employee', type: Number })
  async removeEmployeeFromTeam(
    @Param('teamId', ParseIntPipe) teamId: number,
    @Param('employeeId', ParseIntPipe) employeeId: number
  ) {
    return this.teamsService.removeEmployeeFromTeam(teamId, employeeId);
  }

  // 12. Unassign All From Team (Preserved Sales Teams Feature)
  @Post(':teamId/unassign-employees')
  @Roles('dep_manager', 'unit_head')
  @Departments('Sales')
  @ApiOperation({ summary: 'Unassign all employees from a team' })
  @ApiParam({ name: 'teamId', description: 'ID of the team', type: Number })
  async unassignEmployeesFromTeam(
    @Param('teamId', ParseIntPipe) teamId: number
  ) {
    return this.teamsService.unassignEmployeesFromTeam(teamId);
  }

  // 13. Delete Team
  @Delete(':id')
  @Roles('dep_manager')
  @Departments('Sales')
  @ApiOperation({ summary: 'Delete a sales team by ID' })
  @ApiParam({ name: 'id', type: Number, description: 'Team ID' })
  @ApiResponse({ status: 200, description: 'Team deleted successfully' })
  async deleteTeam(@Param('id', ParseIntPipe) id: number, @Query() query: any) {
    if (Object.keys(query).length > 0) {
      throw new BadRequestException(
        'Query parameters are not allowed for deleting teams. Use DELETE /sales/teams/:id only.'
      );
    }
    return this.teamsService.deleteTeam(id);
  }

  // 14. Get Teams in Sales Unit (Preserved Sales Teams Feature)
  @Get('unit/:id')
  @Roles('dep_manager', 'unit_head')
  @Departments('Sales')
  @ApiOperation({ summary: 'Get teams in a sales unit' })
  @ApiParam({ name: 'id', description: 'Sales Unit ID', type: Number })
  async getTeamsInUnit(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.teamsService.getTeamsInUnit(id, req.user);
  }

  // 15. Get Team Details (Preserved Sales Teams Feature)
  @Get('details/:teamId')
  @Roles('dep_manager', 'unit_head', 'team_lead', 'senior', 'junior')
  @Departments('Sales')
  @ApiOperation({ summary: 'Get details of a team' })
  @ApiParam({ name: 'teamId', description: 'Team ID', type: Number })
  async getTeamDetails(@Param('teamId', ParseIntPipe) teamId: number) {
    return this.teamsService.getTeamDetails(teamId);
  }

  // 16. Get Employee's Team (Preserved Sales Teams Feature)
  @Get('employee/:employeeId')
  @Roles('dep_manager', 'unit_head', 'team_lead', 'senior', 'junior')
  @Departments('Sales')
  @ApiOperation({ summary: 'Get the team of a specific employee' })
  @ApiParam({ name: 'employeeId', description: 'Employee ID', type: Number })
  async getEmployeeTeam(@Param('employeeId', ParseIntPipe) employeeId: number) {
    return this.teamsService.getEmployeeTeam(employeeId);
  }

  // 17. Assign Team to Sales Unit (Preserved Sales Teams Feature)
  @Post('assign')
  @Roles('dep_manager')
  @Departments('Sales')
  @ApiOperation({ summary: 'Assign a team to a sales unit' })
  @ApiBody({ type: AssignSalesTeamDto })
  async assignTeamToUnit(@Body() assignTeamDto: AssignSalesTeamDto) {
    if (!assignTeamDto || !assignTeamDto.teamId || !assignTeamDto.salesUnitId) {
      throw new BadRequestException('Request body must contain teamId and salesUnitId');
    }
    return this.teamsService.assignTeamToUnit(assignTeamDto.teamId, assignTeamDto.salesUnitId);
  }

  // 18. Unassign Team from Sales Unit (Preserved Sales Teams Feature)
  @Delete('unassign/:teamId')
  @Roles('dep_manager')
  @Departments('Sales')
  @ApiOperation({ summary: 'Unassign a team from a sales unit' })
  @ApiParam({ name: 'teamId', description: 'Team ID', type: Number })
  unassignTeamFromUnit(@Param('teamId', ParseIntPipe) teamId: number) {
    return this.teamsService.unassignTeamFromUnit(teamId);
  }

  // 19. Get Available Teams (Preserved Sales Teams Feature)
  @Get('available')
  @Roles('dep_manager')
  @Departments('Sales')
  @ApiOperation({ summary: 'Get all available teams' })
  async getAvailableTeams() {
    return this.teamsService.getAvailableTeams();
  }


} 