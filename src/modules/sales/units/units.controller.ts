import { Controller, Post, Get, Patch, Body, Param, UseGuards, ParseIntPipe } from '@nestjs/common';
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

  @Get()
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
}
