import { Controller, Post, Get, Delete, Param, Body, UseGuards, ParseIntPipe } from '@nestjs/common';
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

  @Post('assign')
  @Roles('dep_manager')
  @Departments('Production')
  async assignTeamToUnit(
    @Body() body: { teamId: number; productionUnitId: number }
  ) {
    return this.teamsService.assignTeamToUnit(body.teamId, body.productionUnitId);
  }

  @Delete('unassign/:teamId')
  @Roles('dep_manager')
  @Departments('Production')
  async unassignTeamFromUnit(@Param('teamId', ParseIntPipe) teamId: number) {
    return this.teamsService.unassignTeamFromUnit(teamId);
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
} 