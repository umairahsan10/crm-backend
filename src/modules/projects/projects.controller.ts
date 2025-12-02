import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ProjectsService } from './projects.service';
import { CreateProjectFromPaymentDto } from './dto/create-project-from-payment.dto';
import { CreateCompanyProjectDto } from './dto/create-company-project.dto';
import { AssignUnitHeadDto } from './dto/assign-unit-head.dto';
import { UpdateProjectDetailsDto } from './dto/update-project-details.dto';
import { AssignProjectTeamDto } from './dto/assign-team.dto';
import { ProjectQueryDto } from './dto/project-query.dto';
import { UnifiedUpdateProjectDto } from './dto/unified-update-project.dto';
import { RolesGuard } from '../../common/guards/roles.guard';
import { DepartmentsGuard } from '../../common/guards/departments.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Departments } from '../../common/decorators/departments.decorator';
import { ProjectAccessGuard } from './guards/project-access.guard';
import { ProjectAssignmentGuard } from './guards/project-assignment.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Projects')
@ApiBearerAuth()
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  // 1. Create Project from Payment (Internal & External API)
  @Post('create-from-payment')
  @UseGuards(JwtAuthGuard, DepartmentsGuard, RolesGuard)
  @Departments('Production')
  @Roles('dep_manager', 'unit_head') // Manager and Unit Head can create projects
  @HttpCode(HttpStatus.CREATED)
  async createFromPayment(
    @Body() dto: CreateProjectFromPaymentDto,
    @Request() req,
  ) {
    return this.projectsService.createFromPayment(dto, req.user);
  }

  // 1.5. Create Company-Owned Project (Internal projects without client/payment)
  @Post('create-company-project')
  @UseGuards(JwtAuthGuard, DepartmentsGuard, RolesGuard)
  @Departments('Production')
  @Roles('dep_manager', 'unit_head') // Manager and Unit Head can create projects
  @HttpCode(HttpStatus.CREATED)
  async createCompanyProject(
    @Body() dto: CreateCompanyProjectDto,
    @Request() req,
  ) {
    return this.projectsService.createCompanyProject(dto, req.user);
  }

  // 2. Get Projects (Unified with multiple filtering options)
  @Get()
  @UseGuards(JwtAuthGuard, DepartmentsGuard, RolesGuard)
  @Departments('Production')
  @Roles('dep_manager', 'unit_head', 'team_lead', 'senior', 'junior') // All roles can access projects (with different filtering)
  async getProjects(@Request() req, @Query() query: ProjectQueryDto) {
    return this.projectsService.getProjects(req.user, query);
  }

  // 2.5. Get Available Teams for Project Assignment
  @Get('available-teams')
  @UseGuards(JwtAuthGuard, DepartmentsGuard, RolesGuard)
  @Departments('Production')
  @Roles('dep_manager', 'unit_head') // Manager and Unit Head can view available teams
  async getAvailableTeams() {
    return this.projectsService.getAvailableTeams();
  }

  // 3. Get Project Details
  @Get(':id')
  @UseGuards(JwtAuthGuard, DepartmentsGuard, ProjectAccessGuard)
  @Departments('Production')
  async getProjectById(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.projectsService.getProjectById(id, req.user);
  }

  // 4. Assign Unit Head (Manager Only)
  @Put(':id/assign-unit-head')
  @UseGuards(JwtAuthGuard, DepartmentsGuard, RolesGuard, ProjectAssignmentGuard)
  @Departments('Production')
  @Roles('dep_manager') // Manager only
  async assignUnitHead(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AssignUnitHeadDto,
    @Request() req,
  ) {
    return this.projectsService.assignUnitHead(id, dto, req.user);
  }

  // 4.5. Assign Team (Manager and Unit Head)
  @Put(':id/assign-team')
  @UseGuards(JwtAuthGuard, DepartmentsGuard, RolesGuard, ProjectAssignmentGuard)
  @Departments('Production')
  @Roles('dep_manager', 'unit_head') // Manager and Unit Head can assign teams
  async assignTeam(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AssignProjectTeamDto,
    @Request() req,
  ) {
    return this.projectsService.assignTeam(id, dto, req.user);
  }

  // 5. Unified Update Project (Role-based permissions)
  @Put(':id')
  @UseGuards(JwtAuthGuard, DepartmentsGuard, ProjectAccessGuard)
  @Departments('Production')
  async updateProject(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UnifiedUpdateProjectDto,
    @Request() req,
  ) {
    return this.projectsService.updateProject(id, dto, req.user);
  }
}
