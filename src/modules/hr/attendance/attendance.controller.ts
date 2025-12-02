import {
  Controller,
  Get,
  Post,
  Put,
  Query,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Param,
  BadRequestException,
  Logger,
  Res,
  Request,
} from '@nestjs/common';
import { Response, Request as ExpressRequest } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { AttendanceService } from './attendance.service';
import { GetAttendanceLogsDto } from './dto/get-attendance-logs.dto';
import { GetMyAttendanceLogsDto } from './dto/get-my-attendance-logs.dto';
import { AttendanceLogResponseDto } from './dto/attendance-log-response.dto';
import { CheckinDto } from './dto/checkin.dto';
import { CheckinResponseDto } from './dto/checkin-response.dto';
import { CheckoutDto } from './dto/checkout.dto';
import { CheckoutResponseDto } from './dto/checkout-response.dto';
import { AttendanceListResponseDto } from './dto/attendance-list-response.dto';
import { MonthlyAttendanceResponseDto } from './dto/monthly-attendance-response.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';
import { UpdateMonthlyAttendanceDto } from './dto/update-monthly-attendance.dto';
import { SubmitLateReasonDto } from './dto/submit-late-reason.dto';
import { LateLogResponseDto } from './dto/late-log-response.dto';
import { GetLateLogsDto } from './dto/get-late-logs.dto';
import { LateLogsListResponseDto } from './dto/late-logs-list-response.dto';
import { GetHalfDayLogsDto } from './dto/get-half-day-logs.dto';
import { HalfDayLogsListResponseDto } from './dto/half-day-logs-list-response.dto';
import { SubmitHalfDayReasonDto } from './dto/submit-half-day-reason.dto';
import { HalfDayLogResponseDto } from './dto/half-day-log-response.dto';
import { GetLeaveLogsDto } from './dto/get-leave-logs.dto';
import { LeaveLogsListResponseDto } from './dto/leave-logs-list-response.dto';
import { CreateLeaveLogDto } from './dto/create-leave-log.dto';
import { LeaveLogResponseDto } from './dto/leave-log-response.dto';
import { ProcessLeaveActionDto } from './dto/process-leave-action.dto';
import { BulkMarkPresentDto } from './dto/bulk-mark-present.dto';
import { BulkCheckoutDto } from './dto/bulk-checkout.dto';
import { UpdateAttendanceLogStatusDto } from './dto/update-attendance-log-status.dto';
import { ExportLeaveLogsDto } from './dto/export-leave-logs.dto';
import {
  LeaveLogsStatsDto,
  LeaveLogsStatsResponseDto,
} from './dto/leave-logs-stats.dto';
import { ExportLateLogsDto } from './dto/export-late-logs.dto';
import {
  LateLogsStatsDto,
  LateLogsStatsResponseDto,
} from './dto/late-logs-stats.dto';
import { ExportHalfDayLogsDto } from './dto/export-half-day-logs.dto';
import {
  HalfDayLogsStatsDto,
  HalfDayLogsStatsResponseDto,
} from './dto/half-day-logs-stats.dto';
import { GetProjectLogsDto } from './dto/get-project-logs.dto';
import { ProjectLogsListResponseDto } from './dto/project-logs-list-response.dto';
import { ExportProjectLogsDto } from '../../projects/Projects-Logs/dto/export-project-logs.dto';
import {
  ProjectLogsStatsDto,
  ProjectLogsStatsResponseDto,
} from '../../projects/Projects-Logs/dto/project-logs-stats.dto';
import { MonthlyLatesResetTrigger } from './triggers/monthly-lates-reset.trigger';
import { QuarterlyLeavesUpdateTrigger } from './triggers/quarterly-leaves-update.trigger';
import { WeekendAutoPresentTrigger } from './triggers/weekend-auto-present.trigger';
import { FutureHolidayTrigger } from './triggers/future-holiday-trigger';
import { Permissions } from '../../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { PermissionName } from '../../../common/constants/permission.enum';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { log } from 'console';

interface AuthenticatedRequest extends ExpressRequest {
  user: {
    id: number;
    role: string | number;
    type: string;
    department?: string;
    permissions?: any;
  };
}

@ApiTags('HR - Attendance')
@ApiBearerAuth()
@Controller('hr/attendance')
export class AttendanceController {
  private readonly logger = new Logger(AttendanceController.name);

  constructor(
    private readonly attendanceService: AttendanceService,
    private readonly monthlyLatesResetTrigger: MonthlyLatesResetTrigger,
    private readonly quarterlyLeavesUpdateTrigger: QuarterlyLeavesUpdateTrigger,
    private readonly weekendAutoPresentTrigger: WeekendAutoPresentTrigger,
    private readonly futureHolidayTrigger: FutureHolidayTrigger,
  ) {}

  @Get('logs')
  @ApiOperation({ summary: 'Get attendance logs with filtering' })
  @ApiQuery({ type: GetAttendanceLogsDto })
  @ApiResponse({
    status: 200,
    description: 'Attendance logs retrieved successfully',
    type: AttendanceLogResponseDto,
    isArray: true,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PermissionName.attendance_permission)
  async getAttendanceLogs(
    @Query() query: GetAttendanceLogsDto,
  ): Promise<AttendanceLogResponseDto[]> {
    return this.attendanceService.getAttendanceLogs(query);
  }

  @Get('my-logs')
  @ApiOperation({ summary: 'Get my attendance logs (self-service)' })
  @ApiQuery({ type: GetMyAttendanceLogsDto })
  @ApiResponse({
    status: 200,
    description: 'My attendance logs retrieved successfully',
    type: AttendanceLogResponseDto,
    isArray: true,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @UseGuards(JwtAuthGuard)
  async getMyAttendanceLogs(
    @Query() query: GetAttendanceLogsDto,
  ): Promise<AttendanceLogResponseDto[]> {
    return this.attendanceService.getAttendanceLogs(query);
  }

  @Post('checkin')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Employee check-in' })
  @ApiBody({ type: CheckinDto })
  @ApiResponse({
    status: 201,
    description: 'Check-in successful',
    type: CheckinResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @UseGuards(JwtAuthGuard)
  async checkin(@Body() checkinData: CheckinDto): Promise<CheckinResponseDto> {
    return this.attendanceService.checkin(checkinData);
  }

  @Post('checkout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Employee check-out' })
  @ApiBody({ type: CheckoutDto })
  @ApiResponse({
    status: 200,
    description: 'Check-out successful',
    type: CheckoutResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @UseGuards(JwtAuthGuard)
  async checkout(
    @Body() checkoutData: CheckoutDto,
  ): Promise<CheckoutResponseDto> {
    return this.attendanceService.checkout(checkoutData);
  }

  @Get('late-logs')
  @ApiOperation({ summary: 'Get late logs with filtering' })
  @ApiQuery({ type: GetLateLogsDto })
  @ApiResponse({
    status: 200,
    description: 'Late logs retrieved successfully',
    type: LateLogsListResponseDto,
    isArray: true,
  })
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PermissionName.attendance_permission)
  async getLateLogs(
    @Query() query: GetLateLogsDto,
  ): Promise<LateLogsListResponseDto[]> {
    return this.attendanceService.getLateLogs(query);
  }

  @Get('late-logs/employee/:emp_id')
  @ApiOperation({ summary: 'Get late logs for a specific employee' })
  @ApiParam({ name: 'emp_id', type: String })
  @ApiResponse({
    status: 200,
    description: 'Late logs for employee retrieved successfully',
    type: LateLogsListResponseDto,
    isArray: true,
  })
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PermissionName.attendance_permission)
  async getLateLogsByEmployee(
    @Param('emp_id') empId: string,
  ): Promise<LateLogsListResponseDto[]> {
    const employeeId = Number(empId);
    if (isNaN(employeeId)) {
      throw new BadRequestException('Invalid employee ID');
    }
    return this.attendanceService.getLateLogsByEmployee(employeeId);
  }

  @Put('late-logs')
  @ApiOperation({ summary: 'Submit late reason' })
  @ApiBody({ type: SubmitLateReasonDto })
  @ApiResponse({
    status: 200,
    description: 'Late reason submitted successfully',
    type: LateLogResponseDto,
  })
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async submitLateReason(
    @Body() lateData: SubmitLateReasonDto,
  ): Promise<LateLogResponseDto> {
    return this.attendanceService.submitLateReason(lateData);
  }

  @Put('late-logs/:id/action')
  @ApiOperation({ summary: 'Process late log action' })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['Pending', 'Completed'] },
        reviewer_id: { type: 'number' },
        late_type: { type: 'string', enum: ['paid', 'unpaid'] },
      },
      required: ['action', 'reviewer_id'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Late log action processed successfully',
    type: LateLogResponseDto,
  })
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PermissionName.monthly_request_approvals)
  async processLateAction(
    @Param('id') id: string,
    @Body()
    actionData: {
      action: 'Pending' | 'Completed';
      reviewer_id: number;
      late_type?: 'paid' | 'unpaid';
    },
  ): Promise<LateLogResponseDto> {
    const lateLogId = Number(id);
    if (isNaN(lateLogId)) {
      throw new BadRequestException('Invalid late log ID');
    }
    return this.attendanceService.processLateAction(
      lateLogId,
      actionData.action,
      actionData.reviewer_id,
      actionData.late_type,
    );
  }

  @Get('half-day-logs')
  @ApiOperation({ summary: 'Get half-day logs with filtering' })
  @ApiQuery({ type: GetHalfDayLogsDto })
  @ApiResponse({
    status: 200,
    description: 'Half-day logs retrieved successfully',
    type: HalfDayLogsListResponseDto,
    isArray: true,
  })
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PermissionName.attendance_permission)
  async getHalfDayLogs(
    @Query() query: GetHalfDayLogsDto,
  ): Promise<HalfDayLogsListResponseDto[]> {
    return this.attendanceService.getHalfDayLogs(query);
  }

  @Get('half-day-logs/employee/:emp_id')
  @ApiOperation({ summary: 'Get half-day logs for a specific employee' })
  @ApiParam({ name: 'emp_id', type: String })
  @ApiResponse({
    status: 200,
    description: 'Half-day logs for employee retrieved successfully',
    type: HalfDayLogsListResponseDto,
    isArray: true,
  })
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PermissionName.attendance_permission)
  async getHalfDayLogsByEmployee(
    @Param('emp_id') empId: string,
  ): Promise<HalfDayLogsListResponseDto[]> {
    const employeeId = Number(empId);
    if (isNaN(employeeId)) {
      throw new BadRequestException('Invalid employee ID');
    }
    return this.attendanceService.getHalfDayLogsByEmployee(employeeId);
  }

  @Put('half-day-logs')
  @ApiOperation({ summary: 'Submit half-day reason' })
  @ApiBody({ type: SubmitHalfDayReasonDto })
  @ApiResponse({
    status: 200,
    description: 'Half-day reason submitted successfully',
    type: HalfDayLogResponseDto,
  })
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async submitHalfDayReason(
    @Body() halfDayData: SubmitHalfDayReasonDto,
  ): Promise<HalfDayLogResponseDto> {
    return this.attendanceService.submitHalfDayReason(halfDayData);
  }

  @Put('half-day-logs/:id/action')
  @ApiOperation({ summary: 'Process half-day log action' })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['Pending', 'Completed'] },
        reviewer_id: { type: 'number' },
        half_day_type: { type: 'string', enum: ['paid', 'unpaid'] },
      },
      required: ['action', 'reviewer_id'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Half-day log action processed successfully',
    type: HalfDayLogResponseDto,
  })
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PermissionName.monthly_request_approvals)
  async processHalfDayAction(
    @Param('id') id: string,
    @Body()
    actionData: {
      action: 'Pending' | 'Completed';
      reviewer_id: number;
      half_day_type?: 'paid' | 'unpaid';
    },
  ): Promise<HalfDayLogResponseDto> {
    const halfDayLogId = Number(id);
    if (isNaN(halfDayLogId)) {
      throw new BadRequestException('Invalid half-day log ID');
    }
    return this.attendanceService.processHalfDayAction(
      halfDayLogId,
      actionData.action,
      actionData.reviewer_id,
      actionData.half_day_type,
    );
  }

  @Get('leave-logs')
  @ApiOperation({ summary: 'Get leave logs with filtering' })
  @ApiQuery({ type: GetLeaveLogsDto })
  @ApiResponse({
    status: 200,
    description: 'Leave logs retrieved successfully',
    type: LeaveLogsListResponseDto,
    isArray: true,
  })
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PermissionName.attendance_permission)
  async getLeaveLogs(
    @Query() query: GetLeaveLogsDto,
  ): Promise<LeaveLogsListResponseDto[]> {
    return this.attendanceService.getLeaveLogs(query);
  }

  @Get('leave-logs/employee/:emp_id')
  @ApiOperation({ summary: 'Get leave logs for a specific employee' })
  @ApiParam({ name: 'emp_id', type: String })
  @ApiResponse({
    status: 200,
    description: 'Leave logs for employee retrieved successfully',
    type: LeaveLogsListResponseDto,
    isArray: true,
  })
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PermissionName.attendance_permission)
  async getLeaveLogsByEmployee(
    @Param('emp_id') empId: string,
  ): Promise<LeaveLogsListResponseDto[]> {
    const employeeId = Number(empId);
    if (isNaN(employeeId)) {
      throw new BadRequestException('Invalid employee ID');
    }
    return this.attendanceService.getLeaveLogsByEmployee(employeeId);
  }

  @Post('leave-logs')
  @ApiOperation({ summary: 'Create leave log' })
  @ApiBody({ type: CreateLeaveLogDto })
  @ApiResponse({
    status: 201,
    description: 'Leave log created successfully',
    type: LeaveLogResponseDto,
  })
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard)
  async createLeaveLog(
    @Body() leaveData: CreateLeaveLogDto,
  ): Promise<LeaveLogResponseDto> {
    return this.attendanceService.createLeaveLog(leaveData);
  }

  @Put('leave-logs/:id/action')
  @ApiOperation({ summary: 'Process leave log action' })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: ProcessLeaveActionDto })
  @ApiResponse({
    status: 200,
    description: 'Leave log action processed successfully',
    type: LeaveLogResponseDto,
  })
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PermissionName.monthly_request_approvals)
  async processLeaveAction(
    @Param('id') id: string,
    @Body() actionData: ProcessLeaveActionDto,
  ): Promise<LeaveLogResponseDto> {
    const leaveLogId = Number(id);
    if (isNaN(leaveLogId)) {
      throw new BadRequestException('Invalid leave log ID');
    }
    return this.attendanceService.processLeaveAction(
      leaveLogId,
      actionData.action,
      actionData.reviewer_id,
      actionData.confirmation_reason,
    );
  }

  @Get('month/:emp_id')
  @ApiOperation({ summary: 'Get monthly attendance for a specific employee' })
  @ApiParam({ name: 'emp_id', type: String })
  @ApiQuery({ name: 'month', type: String, required: false })
  @ApiResponse({
    status: 200,
    description: 'Monthly attendance for employee retrieved successfully',
    type: MonthlyAttendanceResponseDto,
  })
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PermissionName.attendance_permission)
  async getMonthlyAttendanceByEmployee(
    @Param('emp_id') empId: string,
    @Query('month') month?: string,
  ): Promise<MonthlyAttendanceResponseDto | null> {
    const employeeId = Number(empId);
    if (isNaN(employeeId)) {
      throw new BadRequestException('Invalid employee ID');
    }
    return this.attendanceService.getMonthlyAttendanceByEmployee(
      employeeId,
      month,
    );
  }

  @Put('update/:id/status')
  @ApiOperation({ summary: 'Update attendance' })
  @ApiBody({ type: UpdateAttendanceDto })
  @ApiResponse({
    status: 200,
    description: 'Attendance updated successfully',
    type: AttendanceLogResponseDto,
  })
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PermissionName.attendance_permission)
  async updateAttendance(
    @Param() id: string,
    @Body() updateData: UpdateAttendanceLogStatusDto,
  ): Promise<AttendanceLogResponseDto> {
    const logId = Number(id);
    if (isNaN(logId)) {
      throw new BadRequestException('Invalid attendance log ID');
    }
    return this.attendanceService.updateAttendanceLogStatus(
      logId,
      updateData.status,
      updateData.reason,
      updateData.reviewer_id,
      updateData.checkin,
      updateData.checkout,
    );
  }

  @Post('bulk-mark-present')
  @ApiOperation({ summary: 'Bulk mark all employees present' })
  @ApiBody({ type: BulkMarkPresentDto })
  @ApiResponse({
    status: 200,
    description: 'Bulk mark present processed',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        marked_present: { type: 'number' },
        errors: { type: 'number' },
        skipped: { type: 'number' },
      },
    },
  })
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PermissionName.attendance_permission)
  async bulkMarkPresent(@Body() bulkMarkData: BulkMarkPresentDto): Promise<{
    message: string;
    marked_present: number;
    errors: number;
    skipped: number;
  }> {
    return this.attendanceService.bulkMarkAllEmployeesPresent(bulkMarkData);
  }

  @Post('bulk-checkout')
  @ApiOperation({ summary: 'Bulk checkout employees with active check-ins' })
  @ApiBody({ type: BulkCheckoutDto })
  @ApiResponse({
    status: 200,
    description: 'Bulk checkout processed',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        checked_out: { type: 'number' },
        errors: { type: 'number' },
        skipped: { type: 'number' },
      },
    },
  })
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PermissionName.attendance_permission)
  async bulkCheckout(@Body() bulkCheckoutData: BulkCheckoutDto): Promise<{
    message: string;
    checked_out: number;
    errors: number;
    skipped: number;
  }> {
    return this.attendanceService.bulkCheckoutEmployees(bulkCheckoutData);
  }

  /**
   * Export Leave Logs
   * GET /hr/attendance/leave-logs/export
   */
  @Get('leave-logs/export')
  @ApiOperation({ summary: 'Export leave logs' })
  @ApiQuery({ type: ExportLeaveLogsDto })
  @ApiResponse({ status: 200, description: 'Leave logs exported successfully' })
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PermissionName.attendance_permission)
  async exportLeaveLogs(
    @Res() res: Response,
    @Query() query: ExportLeaveLogsDto,
  ) {
    const { format = 'csv', ...filterQuery } = query;
    const data =
      await this.attendanceService.getLeaveLogsForExport(filterQuery);
    const filename = `leave-logs-${new Date().toISOString().split('T')[0]}.${format}`;

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${filename}"`,
      );
      res.send(this.attendanceService.convertLeaveLogsToCSV(data, query));
    } else if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${filename}"`,
      );
      res.json(data);
    } else {
      res.status(400).json({ message: 'Unsupported format. Use csv or json.' });
    }
  }

  /**
   * Get Leave Logs Statistics
   * GET /hr/attendance/leave-logs/stats
   */
  @Get('leave-logs/stats')
  @ApiOperation({ summary: 'Get leave logs statistics' })
  @ApiQuery({ type: LeaveLogsStatsDto })
  @ApiResponse({
    status: 200,
    description: 'Leave logs statistics retrieved successfully',
    type: LeaveLogsStatsResponseDto,
  })
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PermissionName.attendance_permission)
  async getLeaveLogsStats(
    @Query() query: LeaveLogsStatsDto,
  ): Promise<LeaveLogsStatsResponseDto> {
    return this.attendanceService.getLeaveLogsStats(query);
  }

  /**
   * Export Late Logs
   * GET /hr/attendance/late-logs/export
   */
  @Get('late-logs/export')
  @ApiOperation({ summary: 'Export late logs' })
  @ApiQuery({ type: ExportLateLogsDto })
  @ApiResponse({ status: 200, description: 'Late logs exported successfully' })
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PermissionName.attendance_permission)
  async exportLateLogs(
    @Res() res: Response,
    @Query() query: ExportLateLogsDto,
  ) {
    const { format = 'csv', ...filterQuery } = query;
    const data = await this.attendanceService.getLateLogsForExport(filterQuery);
    const filename = `late-logs-${new Date().toISOString().split('T')[0]}.${format}`;

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${filename}"`,
      );
      res.send(this.attendanceService.convertLateLogsToCSV(data, query));
    } else if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${filename}"`,
      );
      res.json(data);
    } else {
      res.status(400).json({ message: 'Unsupported format. Use csv or json.' });
    }
  }

  /**
   * Get Late Logs Statistics
   * GET /hr/attendance/late-logs/stats
   */
  @Get('late-logs/stats')
  @ApiOperation({ summary: 'Get late logs statistics' })
  @ApiQuery({ type: LateLogsStatsDto })
  @ApiResponse({
    status: 200,
    description: 'Late logs statistics retrieved successfully',
    type: LateLogsStatsResponseDto,
  })
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PermissionName.attendance_permission)
  async getLateLogsStats(
    @Query() query: LateLogsStatsDto,
  ): Promise<LateLogsStatsResponseDto> {
    return this.attendanceService.getLateLogsStats(query);
  }

  /**
   * Export Half Day Logs
   * GET /hr/attendance/half-day-logs/export
   */
  @Get('half-day-logs/export')
  @ApiOperation({ summary: 'Export half-day logs' })
  @ApiQuery({ type: ExportHalfDayLogsDto })
  @ApiResponse({
    status: 200,
    description: 'Half-day logs exported successfully',
  })
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PermissionName.attendance_permission)
  async exportHalfDayLogs(
    @Res() res: Response,
    @Query() query: ExportHalfDayLogsDto,
  ) {
    const { format = 'csv', ...filterQuery } = query;
    const data =
      await this.attendanceService.getHalfDayLogsForExport(filterQuery);
    const filename = `half-day-logs-${new Date().toISOString().split('T')[0]}.${format}`;

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${filename}"`,
      );
      res.send(this.attendanceService.convertHalfDayLogsToCSV(data, query));
    } else if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${filename}"`,
      );
      res.json(data);
    } else {
      res.status(400).json({ message: 'Unsupported format. Use csv or json.' });
    }
  }

  /**
   * Get Half Day Logs Statistics
   * GET /hr/attendance/half-day-logs/stats
   */
  @Get('half-day-logs/stats')
  @ApiOperation({ summary: 'Get half-day logs statistics' })
  @ApiQuery({ type: HalfDayLogsStatsDto })
  @ApiResponse({
    status: 200,
    description: 'Half-day logs statistics retrieved successfully',
    type: HalfDayLogsStatsResponseDto,
  })
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PermissionName.attendance_permission)
  async getHalfDayLogsStats(
    @Query() query: HalfDayLogsStatsDto,
  ): Promise<HalfDayLogsStatsResponseDto> {
    return this.attendanceService.getHalfDayLogsStats(query);
  }

  /**
   * Get Project Logs
   * GET /hr/attendance/project-logs
   */
  @Get('project-logs')
  @ApiOperation({ summary: 'Get project logs with filtering' })
  @ApiQuery({ type: GetProjectLogsDto })
  @ApiResponse({
    status: 200,
    description: 'Project logs retrieved successfully',
    type: ProjectLogsListResponseDto,
    isArray: true,
  })
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PermissionName.attendance_permission)
  async getProjectLogs(
    @Query() query: GetProjectLogsDto,
  ): Promise<ProjectLogsListResponseDto[]> {
    return this.attendanceService.getProjectLogs(query);
  }

  /**
   * Export Project Logs
   * GET /hr/attendance/project-logs/export
   */
  @Get('project-logs/export')
  @ApiOperation({ summary: 'Export project logs' })
  @ApiQuery({ type: ExportProjectLogsDto })
  @ApiResponse({
    status: 200,
    description: 'Project logs exported successfully',
  })
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PermissionName.attendance_permission)
  async exportProjectLogs(
    @Res() res: Response,
    @Query() query: ExportProjectLogsDto,
  ) {
    const { format = 'csv', ...filterQuery } = query;
    const data =
      await this.attendanceService.getProjectLogsForExportHR(filterQuery);
    const filename = `project-logs-${new Date().toISOString().split('T')[0]}.${format}`;

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${filename}"`,
      );
      res.send(this.attendanceService.convertProjectLogsToCSVHR(data, query));
    } else if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${filename}"`,
      );
      res.json(data);
    } else {
      res.status(400).json({ message: 'Unsupported format. Use csv or json.' });
    }
  }

  /**
   * Get Project Logs Statistics
   * GET /hr/attendance/project-logs/stats
   */
  @Get('project-logs/stats')
  @ApiOperation({ summary: 'Get project logs statistics' })
  @ApiQuery({ type: ProjectLogsStatsDto })
  @ApiResponse({
    status: 200,
    description: 'Project logs statistics retrieved successfully',
    type: ProjectLogsStatsResponseDto,
  })
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PermissionName.attendance_permission)
  async getProjectLogsStats(
    @Query() query: ProjectLogsStatsDto,
  ): Promise<ProjectLogsStatsResponseDto> {
    return this.attendanceService.getProjectLogsStatsHR(query);
  }
}
