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
  HttpStatus,
  Res
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { ProjectLogsService } from './project-logs.service';
import { CreateProjectLogDto } from './dto/create-project-log.dto';
import { UpdateProjectLogDto } from './dto/update-project-log.dto';
import { ProjectLogQueryDto } from './dto/project-log-query.dto';
import { ExportProjectLogsDto } from './dto/export-project-logs.dto';
import { ProjectLogsStatsDto, ProjectLogsStatsResponseDto } from './dto/project-logs-stats.dto';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { DepartmentsGuard } from '../../../common/guards/departments.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Departments } from '../../../common/decorators/departments.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@ApiTags('Project Logs')
@ApiBearerAuth()
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

  /**
   * Export Project Logs
   * GET /projects/:projectId/logs/export
   */
  @Get('export')
  @ApiOperation({ summary: 'Export project logs' })
  @ApiQuery({ type: ExportProjectLogsDto })
  @ApiResponse({ status: 200, description: 'Project logs exported successfully' })
  @UseGuards(RolesGuard)
  @Roles('dep_manager', 'unit_head', 'team_lead', 'senior', 'junior')
  async exportProjectLogs(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Res() res: Response,
    @Query() query: ExportProjectLogsDto,
    @Request() req
  ) {
    // Set project_id from route parameter
    const exportQuery = { ...query, project_id: projectId };
    const { format = 'csv', ...filterQuery } = exportQuery;
    const data = await this.projectLogsService.getProjectLogsForExport(filterQuery);
    const filename = `project-logs-${projectId}-${new Date().toISOString().split('T')[0]}.${format}`;
    
    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(this.projectLogsService.convertProjectLogsToCSV(data, exportQuery));
    } else if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.json(data);
    } else {
      res.status(400).json({ message: 'Unsupported format. Use csv or json.' });
    }
  }

  /**
   * Get Project Logs Statistics
   * GET /projects/:projectId/logs/stats
   */
  @Get('stats')
  @ApiOperation({ summary: 'Get project logs statistics' })
  @ApiQuery({ type: ProjectLogsStatsDto })
  @ApiResponse({ status: 200, description: 'Project logs statistics retrieved successfully', type: ProjectLogsStatsResponseDto })
  @UseGuards(RolesGuard)
  @Roles('dep_manager', 'unit_head', 'team_lead', 'senior', 'junior')
  async getProjectLogsStats(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Query() query: ProjectLogsStatsDto,
    @Request() req
  ): Promise<ProjectLogsStatsResponseDto> {
    // Set project_id from route parameter
    const statsQuery = { ...query, project_id: projectId };
    return this.projectLogsService.getProjectLogsStats(statsQuery);
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
