import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Patch,
  Param, 
  Body, 
  Query, 
  UseGuards, 
  Request,
  ParseIntPipe,
  HttpCode,
  HttpStatus
} from '@nestjs/common';
import { ProjectTasksService } from './project-tasks.service';
import { CreateProjectTaskDto } from './dto/create-project-task.dto';
import { UpdateProjectTaskDto } from './dto/update-project-task.dto';
import { UpdateTaskStatusDto } from './dto/update-task-status.dto';
import { TaskQueryDto } from './dto/task-query.dto';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { DepartmentsGuard } from '../../../common/guards/departments.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Departments } from '../../../common/decorators/departments.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Controller('projects/:projectId/tasks')
@UseGuards(JwtAuthGuard, DepartmentsGuard)
@Departments('Production')
export class ProjectTasksController {
  constructor(private readonly projectTasksService: ProjectTasksService) {}

  // 1. Create Project Task
  @Post()
  @UseGuards(RolesGuard)
  @Roles('dep_manager', 'unit_head', 'team_lead')
  @HttpCode(HttpStatus.CREATED)
  async createTask(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Body() dto: CreateProjectTaskDto,
    @Request() req
  ) {
    return this.projectTasksService.createTask(projectId, dto, req.user);
  }

  // 2. Get All Tasks for Project
  @Get()
  @UseGuards(RolesGuard)
  @Roles('dep_manager', 'unit_head', 'team_lead', 'senior', 'junior')
  async getProjectTasks(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Request() req,
    @Query() query: TaskQueryDto
  ) {
    return this.projectTasksService.getProjectTasks(projectId, req.user, query);
  }

  // 3. Get Task by ID
  @Get(':taskId')
  @UseGuards(RolesGuard)
  @Roles('dep_manager', 'unit_head', 'team_lead', 'senior', 'junior')
  async getTaskById(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('taskId', ParseIntPipe) taskId: number,
    @Request() req
  ) {
    return this.projectTasksService.getTaskById(projectId, taskId, req.user);
  }

  // 4. Update Task Details
  @Put(':taskId')
  @UseGuards(RolesGuard)
  @Roles('dep_manager', 'unit_head', 'team_lead')
  async updateTask(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('taskId', ParseIntPipe) taskId: number,
    @Body() dto: UpdateProjectTaskDto,
    @Request() req
  ) {
    return this.projectTasksService.updateTask(projectId, taskId, dto, req.user);
  }

  // 5. Update Task Status
  @Patch(':taskId/status')
  @UseGuards(RolesGuard)
  @Roles('dep_manager', 'unit_head', 'team_lead', 'senior', 'junior')
  async updateTaskStatus(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('taskId', ParseIntPipe) taskId: number,
    @Body() dto: UpdateTaskStatusDto,
    @Request() req
  ) {
    return this.projectTasksService.updateTaskStatus(projectId, taskId, dto, req.user);
  }
}
