import { Controller, Post, Get, Delete, Put, Param, Body, UseGuards, ParseIntPipe, BadRequestException } from '@nestjs/common';
import { TeamsService } from './teams.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesWithServiceGuard } from '../../../common/guards/roles-with-service.guard';
import { DepartmentsGuard } from '../../../common/guards/departments.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Departments } from '../../../common/decorators/departments.decorator';

@Controller('production/teams')
@UseGuards(JwtAuthGuard, RolesWithServiceGuard, DepartmentsGuard)
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  // New APIs
  @Post('create')
  @Roles('dep_manager', 'unit_head')
  @Departments('Production')
  async createTeam(
    @Body() body: { name: string; productionUnitId: number; teamLeadId: number }
  ) {
    return this.teamsService.createTeam(body.name, body.productionUnitId, body.teamLeadId);
  }

  @Put(':teamId/replace-lead')
  @Roles('dep_manager', 'unit_head')
  @Departments('Production')
  async replaceTeamLead(
    @Param('teamId', ParseIntPipe) teamId: number,
    @Body() body: { newTeamLeadId: number }
  ) {
    return this.teamsService.replaceTeamLead(teamId, body.newTeamLeadId);
  }

  @Post(':teamId/add-employee')
  @Roles('dep_manager', 'unit_head')
  @Departments('Production')
  async addEmployeeToTeam(
    @Param('teamId', ParseIntPipe) teamId: number,
    @Body() body: { employeeId: number }
  ) {
    return this.teamsService.addEmployeeToTeam(teamId, body.employeeId);
  }

  @Delete(':teamId/remove-employee/:employeeId')
  @Roles('dep_manager', 'unit_head')
  @Departments('Production')
  async removeEmployeeFromTeam(
    @Param('teamId', ParseIntPipe) teamId: number,
    @Param('employeeId', ParseIntPipe) employeeId: number
  ) {
    return this.teamsService.removeEmployeeFromTeam(teamId, employeeId);
  }

  @Post(':teamId/unassign-employees')
  @Roles('dep_manager', 'unit_head')
  @Departments('Production')
  async unassignEmployeesFromTeam(
    @Param('teamId', ParseIntPipe) teamId: number
  ) {
    return this.teamsService.unassignEmployeesFromTeam(teamId);
  }

  @Delete(':teamId')
  @Roles('dep_manager', 'unit_head')
  @Departments('Production')
  async deleteTeam(@Param('teamId', ParseIntPipe) teamId: number) {
    return this.teamsService.deleteTeam(teamId);
  }

  @Get('all')
  @Roles('dep_manager', 'unit_head')
  @Departments('Production')
  async getAllTeams() {
    return this.teamsService.getAllTeams();
  }

  @Get('employee/:employeeId')
  @Roles('dep_manager', 'unit_head', 'team_lead', 'senior', 'junior')
  @Departments('Production')
  async getEmployeeTeam(@Param('employeeId', ParseIntPipe) employeeId: number) {
    return this.teamsService.getEmployeeTeam(employeeId);
  }

  @Get('unit/:productionUnitId')
  @Roles('dep_manager', 'unit_head')
  @Departments('Production')
  async getTeamsInProductionUnit(@Param('productionUnitId', ParseIntPipe) productionUnitId: number) {
    return this.teamsService.getTeamsInProductionUnit(productionUnitId);
  }

  @Get('available')
  @Roles('dep_manager')
  @Departments('Production')
  async getAvailableTeams() {
    return this.teamsService.getAvailableTeams();
  }

  @Get(':teamId')
  @Roles('dep_manager', 'unit_head', 'team_lead', 'senior', 'junior')
  @Departments('Production')
  async getTeamDetails(@Param('teamId', ParseIntPipe) teamId: number) {
    return this.teamsService.getTeamDetails(teamId);
  }

  // Existing APIs
  @Post('assign')
  @Roles('dep_manager')
  @Departments('Production')
  async assignTeamToUnit(
    @Body() body: { teamId: number; productionUnitId: number }
  ) {
    if (!body || !body.teamId || !body.productionUnitId) {
      throw new BadRequestException('Request body must contain teamId and productionUnitId');
    }
    return this.teamsService.assignTeamToUnit(body.teamId, body.productionUnitId);
  }

  @Delete('unassign/:teamId')
  @Roles('dep_manager')
  @Departments('Production')
  async unassignTeamFromUnit(@Param('teamId', ParseIntPipe) teamId: number) {
    return this.teamsService.unassignTeamFromUnit(teamId);
  }
} 