import { Controller, Post, Get, Delete, Put, Param, Body, UseGuards, ParseIntPipe, Request, BadRequestException, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiQuery, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { TeamsService } from './teams.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesWithServiceGuard } from '../../../common/guards/roles-with-service.guard';
import { Departments } from '../../../common/decorators/departments.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { DepartmentsGuard } from '../../../common/guards/departments.guard';
import { CreateTeamDto } from './dto/create-team.dto';
import { ReplaceTeamLeadDto } from './dto/replace-team-lead.dto';
import { AddEmployeeDto } from './dto/add-employee.dto';
import { AssignTeamDto } from './dto/assign-team.dto';

@ApiTags('Teams')
@ApiBearerAuth()
@Controller('sales/teams')
@UseGuards(JwtAuthGuard, RolesWithServiceGuard, DepartmentsGuard)
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  // 1. Create Team
  @Post('create')
  @Roles('dep_manager', 'unit_head')
  @Departments('Sales')
  @ApiOperation({ summary: 'Create a new sales team' })
  @ApiBody({ type: CreateTeamDto })
  @ApiResponse({ status: 201, description: 'Team created successfully' })
  async createTeam(@Body() createTeamDto: CreateTeamDto) {
    return this.teamsService.createTeam(
      createTeamDto.name,
      createTeamDto.salesUnitId,
      createTeamDto.teamLeadId
    );
  }

  // 2. Replace Team Lead
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

  // 3. Add Employee to Team
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

  // 4. Remove Employee from Team
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

  // 5. Unassign All From Team
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

  // 7. Get All Sales Teams (with optional unit filtering)
  @Get('all')
  @Roles('dep_manager', 'unit_head')
  @Departments('Sales')
  @ApiOperation({ summary: 'Get all sales teams (optional unit filter)' })
  @ApiQuery({ name: 'salesUnitId', required: false, type: Number, description: 'Filter by Sales Unit ID' })
  async getAllTeams(@Query('salesUnitId') salesUnitId?: string) {
    const unitId = salesUnitId ? parseInt(salesUnitId, 10) : undefined;
    if (salesUnitId && unitId !== undefined && isNaN(unitId)) {
      throw new BadRequestException('salesUnitId must be a valid number');
    }
    return this.teamsService.getAllTeams(unitId);
  }

  // 8. Get Available Teams
  @Get('available')
  @Roles('dep_manager')
  @Departments('Sales')
  @ApiOperation({ summary: 'Get all available teams' })
  async getAvailableTeams() {
    return this.teamsService.getAvailableTeams();
  }

  // 9. Get Teams in Sales Unit (existing method, updated)
  @Get('unit/:id')
  @Roles('dep_manager', 'unit_head')
  @Departments('Sales')
  @ApiOperation({ summary: 'Get teams in a sales unit' })
  @ApiParam({ name: 'id', description: 'Sales Unit ID', type: Number })
  async getTeamsInUnit(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.teamsService.getTeamsInUnit(id, req.user);
  }

  // 10. Get Team Details
  @Get(':teamId')
  @Roles('dep_manager', 'unit_head', 'team_lead', 'senior', 'junior')
  @Departments('Sales')
  @ApiOperation({ summary: 'Get details of a team' })
  @ApiParam({ name: 'teamId', description: 'Team ID', type: Number })
  async getTeamDetails(@Param('teamId', ParseIntPipe) teamId: number) {
    return this.teamsService.getTeamDetails(teamId);
  }

  // 11. Get Employee's Team
  @Get('employee/:employeeId')
  @Roles('dep_manager', 'unit_head', 'team_lead', 'senior', 'junior')
  @Departments('Sales')
  @ApiOperation({ summary: 'Get the team of a specific employee' })
  @ApiParam({ name: 'employeeId', description: 'Employee ID', type: Number })
  async getEmployeeTeam(@Param('employeeId', ParseIntPipe) employeeId: number) {
    return this.teamsService.getEmployeeTeam(employeeId);
  }

  // 12. Assign Team to Sales Unit
  @Post('assign')
  @Roles('dep_manager')
  @Departments('Sales')
  @ApiOperation({ summary: 'Assign a team to a sales unit' })
  @ApiBody({ type: AssignTeamDto })
  async assignTeamToUnit(@Body() assignTeamDto: AssignTeamDto) {
    if (!assignTeamDto || !assignTeamDto.teamId || !assignTeamDto.salesUnitId) {
      throw new BadRequestException('Request body must contain teamId and salesUnitId');
    }
    return this.teamsService.assignTeamToUnit(assignTeamDto.teamId, assignTeamDto.salesUnitId);
  }

  // 13. Delete Team
  @Delete(':teamId')
  @Roles('dep_manager')
  @Departments('Sales')
  @ApiOperation({ summary: 'Delete a team' })
  @ApiParam({ name: 'teamId', description: 'Team ID', type: Number })
  async deleteTeam(@Param('teamId', ParseIntPipe) teamId: number) {
    return this.teamsService.deleteTeam(teamId);
  }

  // 14. Unassign Team from Sales Unit
  @Delete('unassign/:teamId')
  @Roles('dep_manager')
  @Departments('Sales')
  @ApiOperation({ summary: 'Unassign a team from a sales unit' })
  @ApiParam({ name: 'teamId', description: 'Team ID', type: Number })
  unassignTeamFromUnit(@Param('teamId', ParseIntPipe) teamId: number) {
    return this.teamsService.unassignTeamFromUnit(teamId);
  }


} 