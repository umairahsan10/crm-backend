import { Controller, Get, Param, UseGuards, ParseIntPipe, Request } from '@nestjs/common';
import { TeamsService } from './teams.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesWithServiceGuard } from '../../../common/guards/roles-with-service.guard';
import { Departments } from '../../../common/decorators/departments.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { DepartmentsGuard } from '../../../common/guards/departments.guard';

@Controller('sales/teams')
@UseGuards(JwtAuthGuard, RolesWithServiceGuard, DepartmentsGuard)
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Get('unit/:id')
  @Roles('dep_manager', 'unit_head')
  @Departments('Sales')
  async getTeamsInUnit(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.teamsService.getTeamsInUnit(id, req.user);
  }
} 