import { Body, Controller, Post, Get, Put, Delete, Param, Query, UseGuards, Request, ParseIntPipe } from '@nestjs/common';
import { DepartmentsService } from '../services/departments.service';
import { CreateDepartmentDto } from '../dto/create-department.dto';
import { UpdateDepartmentDto } from '../dto/update-department.dto';
import { GetDepartmentsDto } from '../dto/get-departments.dto';
import { DepartmentResponseDto, DepartmentsListResponseDto } from '../dto/department-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { DepartmentsGuard } from '../../../common/guards/departments.guard';
import { Departments } from '../../../common/decorators/departments.decorator';

interface AuthenticatedRequest extends Request {
  user: {
    id: number;
    [key: string]: any;
  };
}

@Controller('departments')
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  /**
   * Create a new department
   */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard, DepartmentsGuard)
  @Departments('HR', 'Admin')
  async createDepartment(@Body() dto: CreateDepartmentDto, @Request() req: AuthenticatedRequest): Promise<DepartmentResponseDto> {
    return await this.departmentsService.createDepartment(dto);
  }

  /**
   * Get all departments with filters and pagination
   */
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard, DepartmentsGuard)
  @Departments('HR', 'Admin')
  async getDepartments(@Query() query: GetDepartmentsDto, @Request() req: AuthenticatedRequest): Promise<DepartmentsListResponseDto> {
    return await this.departmentsService.getDepartments(query);
  }

  /**
   * Get a specific department by ID
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, DepartmentsGuard)
  @Departments('HR', 'Admin')
  async getDepartmentById(@Param('id', ParseIntPipe) id: number, @Request() req: AuthenticatedRequest): Promise<DepartmentResponseDto> {
    return await this.departmentsService.getDepartmentById(id);
  }

  /**
   * Update a department
   */
  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, DepartmentsGuard)
  @Departments('HR', 'Admin')
  async updateDepartment(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateDepartmentDto,
    @Request() req: AuthenticatedRequest
  ): Promise<DepartmentResponseDto> {
    return await this.departmentsService.updateDepartment(id, dto);
  }

  /**
   * Delete a department
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, DepartmentsGuard)
  @Departments('HR', 'Admin')
  async deleteDepartment(@Param('id', ParseIntPipe) id: number, @Request() req: AuthenticatedRequest): Promise<{ message: string }> {
    return await this.departmentsService.deleteDepartment(id);
  }
}
