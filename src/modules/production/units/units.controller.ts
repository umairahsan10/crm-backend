import { Controller, Post, Get, Patch, Delete, Body, Param, UseGuards, ParseIntPipe, Request, Query } from '@nestjs/common';
import { UnitsService } from './units.service';
import { CreateProductionUnitDto } from './dto/create-unit.dto';
import { UpdateProductionUnitDto } from './dto/update-unit.dto';
import { UnitsQueryDto } from './dto/units-query.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesWithServiceGuard } from '../../../common/guards/roles-with-service.guard';
import { DepartmentsGuard } from '../../../common/guards/departments.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Departments } from '../../../common/decorators/departments.decorator';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam, ApiBody, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Production Units')
@ApiBearerAuth()
@Controller('production/units')
@UseGuards(JwtAuthGuard, RolesWithServiceGuard, DepartmentsGuard)
export class UnitsController {
  constructor(private readonly unitsService: UnitsService) {}

  @Post()
  @Roles('dep_manager')
  @Departments('Production')
  @ApiOperation({ summary: 'Create a new production unit' })
  @ApiBody({ type: CreateProductionUnitDto })
  @ApiResponse({ status: 201, description: 'Unit created successfully' })
  async createUnit(@Body() createUnitDto: CreateProductionUnitDto) {
    return this.unitsService.createUnit(createUnitDto);
  }

  @Get()
  @Roles('dep_manager', 'unit_head', 'team_lead', 'senior', 'junior')
  @Departments('Production')
  @ApiOperation({ summary: 'Get production units with role-based access and filtering' })
  @ApiResponse({ status: 200, description: 'List of units based on user role and permissions' })
  async getAllUnits(@Request() req, @Query() query: UnitsQueryDto) {
    return this.unitsService.getAllUnits(req.user, query);
  }

  @Patch(':id')
  @Roles('dep_manager', 'unit_head')
  @Departments('Production')
  @ApiOperation({ summary: 'Update a production unit by ID' })
  @ApiParam({ name: 'id', type: Number, description: 'Unit ID' })
  @ApiBody({ type: UpdateProductionUnitDto })
  @ApiResponse({ status: 200, description: 'Unit updated successfully' })
  async updateUnit(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUnitDto: UpdateProductionUnitDto,
    @Request() req
  ) {
    return this.unitsService.updateUnit(id, updateUnitDto, req.user);
  }



  @Delete(':id')
  @Roles('dep_manager')
  @Departments('Production')
  @ApiOperation({ summary: 'Delete a production unit by ID' })
  @ApiParam({ name: 'id', type: Number, description: 'Unit ID' })
  @ApiResponse({ status: 200, description: 'Unit deleted successfully' })
  async deleteUnit(@Param('id', ParseIntPipe) id: number) {
    return this.unitsService.deleteUnit(id);
  }


  @Get('available-heads')
  @Roles('dep_manager')
  @Departments('Production')
  @ApiOperation({ summary: 'Get available employees to assign as unit heads' })
  @ApiQuery({ name: 'assigned', required: false, description: 'Filter by already assigned heads (true/false)' })
  @ApiResponse({ status: 200, description: 'List of available heads' })
  async getAvailableHeads(@Query('assigned') assigned?: string) {
    // Convert string query parameter to boolean
    let assignedBoolean: boolean | undefined;
    if (assigned === 'true') assignedBoolean = true;
    else if (assigned === 'false') assignedBoolean = false;
    
    return this.unitsService.getAvailableHeads(assignedBoolean);
  }
} 