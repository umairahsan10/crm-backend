import { Controller, Post, Get, Delete, Body, Param, UseGuards, ParseIntPipe, Request, Query } from '@nestjs/common';
import { UnitsService } from './units.service';
import { CreateProductionUnitDto } from './dto/create-unit.dto';
import { UnitsQueryDto } from './dto/units-query.dto';
import { CreateUnitResponseDto } from './dto/create-unit-response.dto';
import { UnitListResponseDto, UnitDetailResponseDto } from './dto/unit-response.dto';
import { DeleteUnitSuccessResponseDto, DeleteUnitErrorResponseDto } from './dto/delete-unit-response.dto';
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
  @ApiOperation({ 
    summary: 'Create a new production unit with promotion scenarios',
    description: `
    Creates a new production unit with two possible scenarios:
    1. Team Lead Promotion: Provide name, headId (team lead), and newTeamLeadId (senior/junior)
    2. Direct Promotion: Provide name and headId (senior/junior) - newTeamLeadId is optional
    `
  })
  @ApiBody({ type: CreateProductionUnitDto })
  @ApiResponse({ 
    status: 201, 
    description: 'Unit created successfully with promotion details',
    type: CreateUnitResponseDto
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Bad request - validation errors or business logic violations',
    schema: {
      example: {
        statusCode: 400,
        message: "Employee must be a team lead for team lead promotion scenario",
        error: "Bad Request"
      }
    }
  })
  @ApiResponse({ 
    status: 409, 
    description: 'Conflict - unit name already exists',
    schema: {
      example: {
        statusCode: 409,
        message: "Unit name already exists",
        error: "Conflict"
      }
    }
  })
  async createUnit(@Body() createUnitDto: CreateProductionUnitDto) {
    return this.unitsService.createUnit(createUnitDto);
  }

  @Get()
  @Roles('dep_manager', 'unit_head', 'team_lead', 'senior', 'junior')
  @Departments('Production')
  @ApiOperation({ 
    summary: 'Get production units with role-based access and filtering',
    description: `
    Get production units with two modes:
    1. List Mode: Get all units with limited details (teams count, projects count, employees count)
    2. Detail Mode: Get single unit with full details (all teams and projects)
    
    Use ?unitId=123 for single unit details
    `
  })
  @ApiQuery({ name: 'unitId', required: false, description: 'Get single unit with full details' })
  @ApiQuery({ name: 'hasHead', required: false, description: 'Filter by units with/without heads' })
  @ApiQuery({ name: 'hasTeams', required: false, description: 'Filter by units with/without teams' })
  @ApiQuery({ name: 'hasProjects', required: false, description: 'Filter by units with/without projects' })
  @ApiQuery({ name: 'sortBy', required: false, description: 'Sort field (name, createdAt, updatedAt)' })
  @ApiQuery({ name: 'sortOrder', required: false, description: 'Sort order (asc, desc)' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number for pagination' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  @ApiResponse({ 
    status: 200, 
    description: 'Units retrieved successfully',
    type: UnitListResponseDto
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Single unit with full details',
    type: UnitDetailResponseDto
  })
  async getAllUnits(@Request() req, @Query() query: UnitsQueryDto) {
    return this.unitsService.getAllUnits(req.user, query);
  }




  @Delete(':id')
  @Roles('dep_manager')
  @Departments('Production')
  @ApiOperation({ summary: 'Delete a production unit by ID' })
  @ApiParam({ name: 'id', type: Number, description: 'Unit ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Unit deleted successfully',
    type: DeleteUnitSuccessResponseDto
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Cannot delete unit due to dependencies',
    type: DeleteUnitErrorResponseDto
  })
  async deleteUnit(@Param('id', ParseIntPipe) id: number) {
    return this.unitsService.deleteUnit(id);
  }


} 