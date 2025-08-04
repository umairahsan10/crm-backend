import { Controller, Post, Get, Patch, Delete, Body, Param, UseGuards, ParseIntPipe, Request } from '@nestjs/common';
import { UnitsService } from './units.service';
import { CreateUnitDto } from './dto/create-unit.dto';
import { UpdateUnitDto } from './dto/update-unit.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesWithServiceGuard } from '../../../common/guards/roles-with-service.guard';
import { DepartmentsGuard } from '../../../common/guards/departments.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Departments } from '../../../common/decorators/departments.decorator';

@Controller('sales/units')
@UseGuards(JwtAuthGuard, RolesWithServiceGuard, DepartmentsGuard)
export class UnitsController {
  constructor(private readonly unitsService: UnitsService) {}

  @Post('create')
  @Roles('dep_manager')
  @Departments('Sales')
  async createUnit(@Body() createUnitDto: CreateUnitDto) {
    return this.unitsService.createUnit(createUnitDto);
  }

  @Get('get')
  @Roles('dep_manager')
  @Departments('Sales')
  async getAllUnits() {
    return this.unitsService.getAllUnits();
  }

  @Patch('update/:id')
  @Roles('dep_manager')
  @Departments('Sales')
  async updateUnit(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUnitDto: UpdateUnitDto
  ) {
    return this.unitsService.updateUnit(id, updateUnitDto);
  }

  @Get('get/:id')
  @Roles('dep_manager')
  @Departments('Sales')
  async getUnit(@Param('id', ParseIntPipe) id: number) {
    return this.unitsService.getUnit(id);
  }

  @Get(':id/teams')
  @Roles('dep_manager', 'unit_head')
  @Departments('Sales')
  async getTeamsInUnit(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.unitsService.getTeamsInUnit(id, req.user);
  }

  @Get(':id/employees')
  @Roles('dep_manager', 'unit_head')
  @Departments('Sales')
  async getEmployeesInUnit(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.unitsService.getEmployeesInUnit(id, req.user);
  }

  @Get(':id/leads')
  @Roles('dep_manager', 'unit_head')
  @Departments('Sales')
  async getLeadsInUnit(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.unitsService.getLeadsInUnit(id, req.user);
  }

  @Get('deleted/archive-leads')
  @Roles('dep_manager')
  @Departments('Sales')
  async getArchiveLeadsFromDeletedUnits(@Request() req) {
    return this.unitsService.getArchiveLeadsFromDeletedUnits(req.user);
  }

  @Get(':id/archive-leads')
  @Roles('dep_manager', 'unit_head')
  @Departments('Sales')
  async getArchiveLeadsInUnit(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.unitsService.getArchiveLeadsInUnit(id, req.user);
  }

  @Delete('delete/:id')
  @Roles('dep_manager')
  @Departments('Sales')
  async deleteUnit(@Param('id', ParseIntPipe) id: number) {
    return this.unitsService.deleteUnit(id);
  }
}
