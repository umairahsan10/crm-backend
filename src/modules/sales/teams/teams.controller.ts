import { Controller, Post, Get, Delete, Put, Param, Body, UseGuards, ParseIntPipe, Request, BadRequestException, Query } from '@nestjs/common';
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

@Controller('sales/teams')
@UseGuards(JwtAuthGuard, RolesWithServiceGuard, DepartmentsGuard)
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  // 1. Create Team
  @Post('create')
  @Roles('dep_manager', 'unit_head')
  @Departments('Sales')
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
  async unassignEmployeesFromTeam(
    @Param('teamId', ParseIntPipe) teamId: number
  ) {
    return this.teamsService.unassignEmployeesFromTeam(teamId);
  }

  // 7. Get Team Details
  @Get(':teamId')
  @Roles('dep_manager', 'unit_head', 'team_lead', 'senior', 'junior')
  @Departments('Sales')
  async getTeamDetails(@Param('teamId', ParseIntPipe) teamId: number) {
    return this.teamsService.getTeamDetails(teamId);
  }

  // 8. Get Employee's Team
  @Get('employee/:employeeId')
  @Roles('dep_manager', 'unit_head', 'team_lead', 'senior', 'junior')
  @Departments('Sales')
  async getEmployeeTeam(@Param('employeeId', ParseIntPipe) employeeId: number) {
    return this.teamsService.getEmployeeTeam(employeeId);
  }

  // 9. Get All Sales Teams (with optional unit filtering)
  @Get('all')
  @Roles('dep_manager', 'unit_head')
  @Departments('Sales')
  async getAllTeams(@Query('salesUnitId') salesUnitId?: string) {
    const unitId = salesUnitId ? parseInt(salesUnitId, 10) : undefined;
    if (salesUnitId && unitId !== undefined && isNaN(unitId)) {
      throw new BadRequestException('salesUnitId must be a valid number');
    }
    return this.teamsService.getAllTeams(unitId);
  }

  // 10. Assign Team to Sales Unit
  @Post('assign')
  @Roles('dep_manager')
  @Departments('Sales')
  async assignTeamToUnit(@Body() assignTeamDto: AssignTeamDto) {
    if (!assignTeamDto || !assignTeamDto.teamId || !assignTeamDto.salesUnitId) {
      throw new BadRequestException('Request body must contain teamId and salesUnitId');
    }
    return this.teamsService.assignTeamToUnit(assignTeamDto.teamId, assignTeamDto.salesUnitId);
  }

  // 12. Get Teams in Sales Unit (existing method, updated)
  @Get('unit/:id')
  @Roles('dep_manager', 'unit_head')
  @Departments('Sales')
  async getTeamsInUnit(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.teamsService.getTeamsInUnit(id, req.user);
  }

  // 13. Get Available Teams
  @Get('available')
  @Roles('dep_manager')
  @Departments('Sales')
  async getAvailableTeams() {
    return this.teamsService.getAvailableTeams();
  }

  // Sync completed leads counter for a team
  @Post(':teamId/sync-completed-leads')
  @UseGuards(JwtAuthGuard, RolesWithServiceGuard, DepartmentsGuard)
  @Roles('dep_manager', 'unit_head')
  @Departments('Sales')
  async syncCompletedLeadsCounter(@Param('teamId') teamId: string) {
    const id = parseInt(teamId, 10);
    if (isNaN(id)) {
      throw new BadRequestException('teamId must be a valid number');
    }
    return this.teamsService.syncCompletedLeadsCounter(id);
  }

  // Update completed leads counter (for internal use when lead status changes)
  @Post('update-completed-leads-counter')
  @UseGuards(JwtAuthGuard, RolesWithServiceGuard, DepartmentsGuard)
  @Roles('dep_manager', 'unit_head')
  @Departments('Sales')
  async updateCompletedLeadsCounter(
    @Body() body: { salesUnitId: number; increment: boolean }
  ) {
    return this.teamsService.updateCompletedLeadsCounter(body.salesUnitId, body.increment);
  }
} 