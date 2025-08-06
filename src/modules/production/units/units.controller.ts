import { Controller, Post, Get, Patch, Delete, Body, Param, UseGuards, ParseIntPipe, Request } from '@nestjs/common';
import { UnitsService } from './units.service';
import { CreateUnitDto } from './dto/create-unit.dto';
import { UpdateUnitDto } from './dto/update-unit.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesWithServiceGuard } from '../../../common/guards/roles-with-service.guard';
import { DepartmentsGuard } from '../../../common/guards/departments.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Departments } from '../../../common/decorators/departments.decorator';

@Controller('production/units')
@UseGuards(JwtAuthGuard, RolesWithServiceGuard, DepartmentsGuard)
export class UnitsController {
  constructor(private readonly unitsService: UnitsService) {}

  @Post('create')
  @Roles('dep_manager')
  @Departments('Production')
  async createUnit(@Body() createUnitDto: CreateUnitDto) {
    return this.unitsService.createUnit(createUnitDto);
  }

  @Get()
  @Roles('dep_manager')
  @Departments('Production')
  async getAllUnits() {
    return this.unitsService.getAllUnits();
  }

  @Patch('update/:id')
  @Roles('dep_manager')
  @Departments('Production')
  async updateUnit(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUnitDto: UpdateUnitDto
  ) {
    return this.unitsService.updateUnit(id, updateUnitDto);
  }

  @Get('get/:id')
  @Roles('dep_manager')
  @Departments('Production')
  async getUnit(@Param('id', ParseIntPipe) id: number) {
    return this.unitsService.getUnit(id);
  }

  @Get(':id/teams')
  @Roles('dep_manager', 'unit_head')
  @Departments('Production')
  async getTeamsInUnit(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.unitsService.getTeamsInUnit(id, req.user);
  }

  @Get(':id/employees')
  @Roles('dep_manager', 'unit_head')
  @Departments('Production')
  async getEmployeesInUnit(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.unitsService.getEmployeesInUnit(id, req.user);
  }

  @Get(':id/projects')
  @Roles('dep_manager', 'unit_head')
  @Departments('Production')
  async getProjectsInUnit(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.unitsService.getProjectsInUnit(id, req.user);
  }

  @Delete('delete/:id')
  @Roles('dep_manager')
  @Departments('Production')
  async deleteUnit(@Param('id', ParseIntPipe) id: number) {
    return this.unitsService.deleteUnit(id);
  }
} 