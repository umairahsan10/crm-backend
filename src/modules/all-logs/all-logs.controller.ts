import { Controller, Get, Post, Put, Query, Body, Res, UseGuards, HttpCode, HttpStatus, Param, BadRequestException } from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { LateLogsService } from '../hr/view_logs/late-logs.service';
import { HalfDayLogsService } from '../hr/view_logs/half-day-logs.service';
import { LeaveLogsService } from '../hr/view_logs/leave-logs.service';
import { ProjectLogsService } from '../hr/view_logs/project-logs.service';
import { GetLateLogsDto } from '../hr/attendance/dto/get-late-logs.dto';
import { LateLogsListResponseDto } from '../hr/attendance/dto/late-logs-list-response.dto';
import { GetHalfDayLogsDto } from '../hr/attendance/dto/get-half-day-logs.dto';
import { HalfDayLogsListResponseDto } from '../hr/attendance/dto/half-day-logs-list-response.dto';
import { GetLeaveLogsDto } from '../hr/attendance/dto/get-leave-logs.dto';
import { LeaveLogsListResponseDto } from '../hr/attendance/dto/leave-logs-list-response.dto';
import { GetProjectLogsDto } from '../hr/attendance/dto/get-project-logs.dto';
import { ProjectLogsListResponseDto } from '../hr/attendance/dto/project-logs-list-response.dto';
import { ExportLateLogsDto } from '../hr/attendance/dto/export-late-logs.dto';
import { LateLogsStatsDto, LateLogsStatsResponseDto } from '../hr/attendance/dto/late-logs-stats.dto';
import { ExportHalfDayLogsDto } from '../hr/attendance/dto/export-half-day-logs.dto';
import { HalfDayLogsStatsDto, HalfDayLogsStatsResponseDto } from '../hr/attendance/dto/half-day-logs-stats.dto';
import { ExportLeaveLogsDto } from '../hr/attendance/dto/export-leave-logs.dto';
import { LeaveLogsStatsDto, LeaveLogsStatsResponseDto } from '../hr/attendance/dto/leave-logs-stats.dto';
import { ExportProjectLogsDto } from '../projects/Projects-Logs/dto/export-project-logs.dto';
import { ProjectLogsStatsDto, ProjectLogsStatsResponseDto } from '../projects/Projects-Logs/dto/project-logs-stats.dto';
import { SubmitLateReasonDto } from '../hr/attendance/dto/submit-late-reason.dto';
import { LateLogResponseDto } from '../hr/attendance/dto/late-log-response.dto';
import { SubmitHalfDayReasonDto } from '../hr/attendance/dto/submit-half-day-reason.dto';
import { HalfDayLogResponseDto } from '../hr/attendance/dto/half-day-log-response.dto';
import { CreateLeaveLogDto } from '../hr/attendance/dto/create-leave-log.dto';
import { LeaveLogResponseDto } from '../hr/attendance/dto/leave-log-response.dto';
import { ProcessLeaveActionDto } from '../hr/attendance/dto/process-leave-action.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PermissionName } from '../../common/constants/permission.enum';

@ApiTags('All Logs')
@ApiBearerAuth()
@Controller('all-logs')
@UseGuards(JwtAuthGuard)
export class AllLogsController {
  @Get()
  @ApiOperation({ summary: 'Get all logs overview' })
  @ApiResponse({ status: 200, description: 'All logs overview retrieved successfully' })
  async getAllLogs() {
    return {
      message: 'All logs endpoint - This aggregates logs from different modules',
      availableEndpoints: {
        attendance: {
          lateLogs: '/all-logs/late-logs',
          halfDayLogs: '/all-logs/half-day-logs',
          leaveLogs: '/all-logs/leave-logs',
        },
        projects: {
          projectLogs: '/all-logs/project-logs',
        },
      },
    };
  }
  constructor(
    private readonly lateLogsService: LateLogsService,
    private readonly halfDayLogsService: HalfDayLogsService,
    private readonly leaveLogsService: LeaveLogsService,
    private readonly projectLogsService: ProjectLogsService
  ) { }

  // Late Logs Endpoints
  @Get('late-logs')
  @ApiOperation({ summary: 'Get late logs with filtering' })
  @ApiQuery({ type: GetLateLogsDto })
  @ApiResponse({ status: 200, description: 'Late logs retrieved successfully', type: LateLogsListResponseDto, isArray: true })
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PermissionName.attendance_permission)
  async getLateLogs(@Query() query: GetLateLogsDto): Promise<LateLogsListResponseDto[]> {
    return this.lateLogsService.getLateLogs(query);
  }

  @Get('late-logs/employee/:emp_id')
  @ApiOperation({ summary: 'Get late logs for a specific employee' })
  @ApiParam({ name: 'emp_id', type: String })
  @ApiResponse({ status: 200, description: 'Late logs for employee retrieved successfully', type: LateLogsListResponseDto, isArray: true })
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PermissionName.attendance_permission)
  async getLateLogsByEmployee(@Param('emp_id') empId: string): Promise<LateLogsListResponseDto[]> {
    const employeeId = Number(empId);
    if (isNaN(employeeId)) {
      throw new BadRequestException('Invalid employee ID');
    }
    return this.lateLogsService.getLateLogsByEmployee(employeeId);
  }

  @Get('late-logs/export')
  @ApiOperation({ summary: 'Export late logs' })
  @ApiQuery({ type: ExportLateLogsDto })
  @ApiResponse({ status: 200, description: 'Late logs exported successfully' })
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PermissionName.attendance_permission)
  async exportLateLogs(@Res() res: Response, @Query() query: ExportLateLogsDto) {
    const { format = 'csv', ...filterQuery } = query;
    const data = await this.lateLogsService.getLateLogsForExport(filterQuery);
    const filename = `late-logs-${new Date().toISOString().split('T')[0]}.${format}`;
    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(this.lateLogsService.convertLateLogsToCSV(data, query));
    } else if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.json(data);
    } else {
      res.status(400).json({ message: 'Unsupported format. Use csv or json.' });
    }
  }

  @Get('late-logs/stats')
  @ApiOperation({ summary: 'Get late logs statistics' })
  @ApiQuery({ type: LateLogsStatsDto })
  @ApiResponse({ status: 200, description: 'Late logs statistics retrieved successfully', type: LateLogsStatsResponseDto })
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PermissionName.attendance_permission)
  async getLateLogsStats(@Query() query: LateLogsStatsDto): Promise<LateLogsStatsResponseDto> {
    return this.lateLogsService.getLateLogsStats(query);
  }

  @Put('late-logs')
  @ApiOperation({ summary: 'Submit late reason' })
  @ApiBody({ type: SubmitLateReasonDto })
  @ApiResponse({ status: 200, description: 'Late reason submitted successfully', type: LateLogResponseDto })
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async submitLateReason(@Body() lateData: SubmitLateReasonDto): Promise<LateLogResponseDto> {
    return this.lateLogsService.submitLateReason(lateData);
  }

  @Put('late-logs/:id/action')
  @ApiOperation({ summary: 'Process late log action' })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ schema: { type: 'object', properties: { action: { type: 'string', enum: ['Pending', 'Completed'] }, reviewer_id: { type: 'number' }, late_type: { type: 'string', enum: ['paid', 'unpaid'] } }, required: ['action', 'reviewer_id'] } })
  @ApiResponse({ status: 200, description: 'Late log action processed successfully', type: LateLogResponseDto })
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PermissionName.monthly_request_approvals)
  async processLateAction(@Param('id') id: string, @Body() actionData: { action: 'Pending' | 'Completed'; reviewer_id: number; late_type?: 'paid' | 'unpaid' }): Promise<LateLogResponseDto> {
    const lateLogId = Number(id);
    if (isNaN(lateLogId)) {
      throw new BadRequestException('Invalid late log ID');
    }
    return this.lateLogsService.processLateAction(lateLogId, actionData.action, actionData.reviewer_id, actionData.late_type);
  }

  // Half Day Logs Endpoints
  @Get('half-day-logs')
  @ApiOperation({ summary: 'Get half-day logs with filtering' })
  @ApiQuery({ type: GetHalfDayLogsDto })
  @ApiResponse({ status: 200, description: 'Half-day logs retrieved successfully', type: HalfDayLogsListResponseDto, isArray: true })
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PermissionName.attendance_permission)
  async getHalfDayLogs(@Query() query: GetHalfDayLogsDto): Promise<HalfDayLogsListResponseDto[]> {
    return this.halfDayLogsService.getHalfDayLogs(query);
  }

  @Get('half-day-logs/employee/:emp_id')
  @ApiOperation({ summary: 'Get half-day logs for a specific employee' })
  @ApiParam({ name: 'emp_id', type: String })
  @ApiResponse({ status: 200, description: 'Half-day logs for employee retrieved successfully', type: HalfDayLogsListResponseDto, isArray: true })
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PermissionName.attendance_permission)
  async getHalfDayLogsByEmployee(@Param('emp_id') empId: string): Promise<HalfDayLogsListResponseDto[]> {
    const employeeId = Number(empId);
    if (isNaN(employeeId)) {
      throw new BadRequestException('Invalid employee ID');
    }
    return this.halfDayLogsService.getHalfDayLogsByEmployee(employeeId);
  }

  @Get('half-day-logs/export')
  @ApiOperation({ summary: 'Export half-day logs' })
  @ApiQuery({ type: ExportHalfDayLogsDto })
  @ApiResponse({ status: 200, description: 'Half-day logs exported successfully' })
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PermissionName.attendance_permission)
  async exportHalfDayLogs(@Res() res: Response, @Query() query: ExportHalfDayLogsDto) {
    const { format = 'csv', ...filterQuery } = query;
    const data = await this.halfDayLogsService.getHalfDayLogsForExport(filterQuery);
    const filename = `half-day-logs-${new Date().toISOString().split('T')[0]}.${format}`;
    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(this.halfDayLogsService.convertHalfDayLogsToCSV(data, query));
    } else if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.json(data);
    } else {
      res.status(400).json({ message: 'Unsupported format. Use csv or json.' });
    }
  }

  @Get('half-day-logs/stats')
  @ApiOperation({ summary: 'Get half-day logs statistics' })
  @ApiQuery({ type: HalfDayLogsStatsDto })
  @ApiResponse({ status: 200, description: 'Half-day logs statistics retrieved successfully', type: HalfDayLogsStatsResponseDto })
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PermissionName.attendance_permission)
  async getHalfDayLogsStats(@Query() query: HalfDayLogsStatsDto): Promise<HalfDayLogsStatsResponseDto> {
    return this.halfDayLogsService.getHalfDayLogsStats(query);
  }

  @Put('half-day-logs')
  @ApiOperation({ summary: 'Submit half-day reason' })
  @ApiBody({ type: SubmitHalfDayReasonDto })
  @ApiResponse({ status: 200, description: 'Half-day reason submitted successfully', type: HalfDayLogResponseDto })
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async submitHalfDayReason(@Body() halfDayData: SubmitHalfDayReasonDto): Promise<HalfDayLogResponseDto> {
    return this.halfDayLogsService.submitHalfDayReason(halfDayData);
  }

  @Put('half-day-logs/:id/action')
  @ApiOperation({ summary: 'Process half-day log action' })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ schema: { type: 'object', properties: { action: { type: 'string', enum: ['Pending', 'Completed'] }, reviewer_id: { type: 'number' }, half_day_type: { type: 'string', enum: ['paid', 'unpaid'] } }, required: ['action', 'reviewer_id'] } })
  @ApiResponse({ status: 200, description: 'Half-day log action processed successfully', type: HalfDayLogResponseDto })
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PermissionName.monthly_request_approvals)
  async processHalfDayAction(@Param('id') id: string, @Body() actionData: { action: 'Pending' | 'Completed'; reviewer_id: number; half_day_type?: 'paid' | 'unpaid' }): Promise<HalfDayLogResponseDto> {
    const halfDayLogId = Number(id);
    if (isNaN(halfDayLogId)) {
      throw new BadRequestException('Invalid half-day log ID');
    }
    return this.halfDayLogsService.processHalfDayAction(halfDayLogId, actionData.action, actionData.reviewer_id, actionData.half_day_type);
  }

  // Leave Logs Endpoints
  @Get('leave-logs')
  @ApiOperation({ summary: 'Get leave logs with filtering' })
  @ApiQuery({ type: GetLeaveLogsDto })
  @ApiResponse({ status: 200, description: 'Leave logs retrieved successfully', type: LeaveLogsListResponseDto, isArray: true })
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PermissionName.attendance_permission)
  async getLeaveLogs(@Query() query: GetLeaveLogsDto): Promise<LeaveLogsListResponseDto[]> {
    return this.leaveLogsService.getLeaveLogs(query);
  }

  @Get('leave-logs/employee/:emp_id')
  @ApiOperation({ summary: 'Get leave logs for a specific employee' })
  @ApiParam({ name: 'emp_id', type: String })
  @ApiResponse({ status: 200, description: 'Leave logs for employee retrieved successfully', type: LeaveLogsListResponseDto, isArray: true })
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PermissionName.attendance_permission)
  async getLeaveLogsByEmployee(@Param('emp_id') empId: string): Promise<LeaveLogsListResponseDto[]> {
    const employeeId = Number(empId);
    if (isNaN(employeeId)) {
      throw new BadRequestException('Invalid employee ID');
    }
    return this.leaveLogsService.getLeaveLogsByEmployee(employeeId);
  }

  @Get('leave-logs/export')
  @ApiOperation({ summary: 'Export leave logs' })
  @ApiQuery({ type: ExportLeaveLogsDto })
  @ApiResponse({ status: 200, description: 'Leave logs exported successfully' })
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PermissionName.attendance_permission)
  async exportLeaveLogs(@Res() res: Response, @Query() query: ExportLeaveLogsDto) {
    const { format = 'csv', ...filterQuery } = query;
    const data = await this.leaveLogsService.getLeaveLogsForExport(filterQuery);
    const filename = `leave-logs-${new Date().toISOString().split('T')[0]}.${format}`;
    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(this.leaveLogsService.convertLeaveLogsToCSV(data, query));
    } else if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.json(data);
    } else {
      res.status(400).json({ message: 'Unsupported format. Use csv or json.' });
    }
  }

  @Get('leave-logs/stats')
  @ApiOperation({ summary: 'Get leave logs statistics' })
  @ApiQuery({ type: LeaveLogsStatsDto })
  @ApiResponse({ status: 200, description: 'Leave logs statistics retrieved successfully', type: LeaveLogsStatsResponseDto })
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PermissionName.attendance_permission)
  async getLeaveLogsStats(@Query() query: LeaveLogsStatsDto): Promise<LeaveLogsStatsResponseDto> {
    return this.leaveLogsService.getLeaveLogsStats(query);
  }

  @Post('leave-logs')
  @ApiOperation({ summary: 'Create leave log' })
  @ApiBody({ type: CreateLeaveLogDto })
  @ApiResponse({ status: 201, description: 'Leave log created successfully', type: LeaveLogResponseDto })
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard)
  async createLeaveLog(@Body() leaveData: CreateLeaveLogDto): Promise<LeaveLogResponseDto> {
    return this.leaveLogsService.createLeaveLog(leaveData);
  }

  @Put('leave-logs/:id/action')
  @ApiOperation({ summary: 'Process leave log action' })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: ProcessLeaveActionDto })
  @ApiResponse({ status: 200, description: 'Leave log action processed successfully', type: LeaveLogResponseDto })
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PermissionName.monthly_request_approvals)
  async processLeaveAction(@Param('id') id: string, @Body() actionData: ProcessLeaveActionDto): Promise<LeaveLogResponseDto> {
    const leaveLogId = Number(id);
    if (isNaN(leaveLogId)) {
      throw new BadRequestException('Invalid leave log ID');
    }
    return this.leaveLogsService.processLeaveAction(leaveLogId, actionData.action, actionData.reviewer_id, actionData.confirmation_reason);
  }

  // Project Logs Endpoints
  @Get('project-logs')
  @ApiOperation({ summary: 'Get project logs with filtering' })
  @ApiQuery({ type: GetProjectLogsDto })
  @ApiResponse({ status: 200, description: 'Project logs retrieved successfully', type: ProjectLogsListResponseDto, isArray: true })
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PermissionName.attendance_permission)
  async getProjectLogs(@Query() query: GetProjectLogsDto): Promise<ProjectLogsListResponseDto[]> {
    return this.projectLogsService.getProjectLogs(query);
  }

  @Get('project-logs/export')
  @ApiOperation({ summary: 'Export project logs' })
  @ApiQuery({ type: ExportProjectLogsDto })
  @ApiResponse({ status: 200, description: 'Project logs exported successfully' })
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PermissionName.attendance_permission)
  async exportProjectLogs(@Res() res: Response, @Query() query: ExportProjectLogsDto) {
    const { format = 'csv', ...filterQuery } = query;
    const data = await this.projectLogsService.getProjectLogsForExportHR(filterQuery);
    const filename = `project-logs-${new Date().toISOString().split('T')[0]}.${format}`;
    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(this.projectLogsService.convertProjectLogsToCSVHR(data, query));
    } else if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.json(data);
    } else {
      res.status(400).json({ message: 'Unsupported format. Use csv or json.' });
    }
  }

  @Get('project-logs/stats')
  @ApiOperation({ summary: 'Get project logs statistics' })
  @ApiQuery({ type: ProjectLogsStatsDto })
  @ApiResponse({ status: 200, description: 'Project logs statistics retrieved successfully', type: ProjectLogsStatsResponseDto })
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PermissionName.attendance_permission)
  async getProjectLogsStats(@Query() query: ProjectLogsStatsDto): Promise<ProjectLogsStatsResponseDto> {
    return this.projectLogsService.getProjectLogsStatsHR(query);
  }
}
