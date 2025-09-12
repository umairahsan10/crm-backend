import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete,
  Param, 
  Body, 
  Query, 
  UseGuards, 
  Request,
  ParseIntPipe,
  HttpCode,
  HttpStatus
} from '@nestjs/common';
import { ProjectLogsService } from './project-logs.service';
import { CreateProjectLogDto } from './dto/create-project-log.dto';
import { UpdateProjectLogDto } from './dto/update-project-log.dto';
import { ProjectLogQueryDto } from './dto/project-log-query.dto';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { DepartmentsGuard } from '../../../common/guards/departments.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Departments } from '../../../common/decorators/departments.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Controller('projects/:projectId/logs')
@UseGuards(JwtAuthGuard, DepartmentsGuard)
@Departments('Production')
export class ProjectLogsController {
  constructor(private readonly projectLogsService: ProjectLogsService) {}

  // 1. Create Project Log
  @Post()
  @UseGuards(RolesGuard)
  @Roles('dep_manager', 'unit_head', 'team_lead', 'senior', 'junior')
  @HttpCode(HttpStatus.CREATED)
  async createLog(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Body() dto: CreateProjectLogDto,
    @Request() req
  ) {
    return this.projectLogsService.createLog(projectId, dto, req.user);
  }

  // 2. Get All Project Logs
  @Get()
  @UseGuards(RolesGuard)
  @Roles('dep_manager', 'unit_head', 'team_lead', 'senior', 'junior')
  async getProjectLogs(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Request() req,
    @Query() query: ProjectLogQueryDto
  ) {
    return this.projectLogsService.getProjectLogs(projectId, req.user, query);
  }

  // 3. Get Project Employees
  @Get('employees')
  @UseGuards(RolesGuard)
  @Roles('dep_manager', 'unit_head', 'team_lead', 'senior', 'junior')
  async getProjectEmployees(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Request() req
  ) {
    return this.projectLogsService.getProjectEmployees(projectId, req.user);
  }

  // 4. Get Log Statistics
  @Get('statistics')
  @UseGuards(RolesGuard)
  @Roles('dep_manager', 'unit_head', 'team_lead', 'senior', 'junior')
  async getLogStatistics(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Request() req
  ) {
    return this.projectLogsService.getLogStatistics(projectId, req.user);
  }

  // 5. Get Log by ID
  @Get(':logId')
  @UseGuards(RolesGuard)
  @Roles('dep_manager', 'unit_head', 'team_lead', 'senior', 'junior')
  async getLogById(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('logId', ParseIntPipe) logId: number,
    @Request() req
  ) {
    return this.projectLogsService.getLogById(projectId, logId, req.user);
  }

  // 6. Update Log
  @Put(':logId')
  @UseGuards(RolesGuard)
  @Roles('dep_manager', 'unit_head', 'team_lead', 'senior', 'junior')
  async updateLog(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('logId', ParseIntPipe) logId: number,
    @Body() dto: UpdateProjectLogDto,
    @Request() req
  ) {
    return this.projectLogsService.updateLog(projectId, logId, dto, req.user);
  }

  // 7. Delete Log
  @Delete(':logId')
  @UseGuards(RolesGuard)
  @Roles('dep_manager', 'unit_head', 'team_lead', 'senior', 'junior')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteLog(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('logId', ParseIntPipe) logId: number,
    @Request() req
  ) {
    return this.projectLogsService.deleteLog(projectId, logId, req.user);
  }
}
