import { Controller, Get, Post, Put, Query, Body, UseGuards, HttpCode, HttpStatus, Param, BadRequestException, Logger, Res } from '@nestjs/common';
import { Response } from 'express';
import { AttendanceService } from './attendance.service';
import { GetAttendanceLogsDto } from './dto/get-attendance-logs.dto';
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
import { UpdateAttendanceLogStatusDto } from './dto/update-attendance-log-status.dto';
import { ExportLeaveLogsDto } from './dto/export-leave-logs.dto';
import { LeaveLogsStatsDto, LeaveLogsStatsResponseDto } from './dto/leave-logs-stats.dto';
import { ExportLateLogsDto } from './dto/export-late-logs.dto';
import { LateLogsStatsDto, LateLogsStatsResponseDto } from './dto/late-logs-stats.dto';
import { ExportHalfDayLogsDto } from './dto/export-half-day-logs.dto';
import { HalfDayLogsStatsDto, HalfDayLogsStatsResponseDto } from './dto/half-day-logs-stats.dto';
import { MonthlyLatesResetTrigger } from './triggers/monthly-lates-reset.trigger';
import { QuarterlyLeavesUpdateTrigger } from './triggers/quarterly-leaves-update.trigger';
import { WeekendAutoPresentTrigger } from './triggers/weekend-auto-present.trigger';
import { FutureHolidayTrigger } from './triggers/future-holiday-trigger';
import { Permissions } from '../../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { PermissionName } from '../../../common/constants/permission.enum';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Controller('hr/attendance')
export class AttendanceController {
  private readonly logger = new Logger(AttendanceController.name);

  constructor(
    private readonly attendanceService: AttendanceService,
    private readonly monthlyLatesResetTrigger: MonthlyLatesResetTrigger,
    private readonly quarterlyLeavesUpdateTrigger: QuarterlyLeavesUpdateTrigger,
    private readonly weekendAutoPresentTrigger: WeekendAutoPresentTrigger,
    private readonly futureHolidayTrigger: FutureHolidayTrigger
  ) { }

  @Get('logs')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PermissionName.attendance_permission)
  async getAttendanceLogs(
    @Query() query: GetAttendanceLogsDto
  ): Promise<AttendanceLogResponseDto[]> {
    return this.attendanceService.getAttendanceLogs(query);
  }

  @Post('checkin')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard)
  async checkin(
    @Body() checkinData: CheckinDto
  ): Promise<CheckinResponseDto> {
    return this.attendanceService.checkin(checkinData);
  }

  @Post('checkout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async checkout(
    @Body() checkoutData: CheckoutDto
  ): Promise<CheckoutResponseDto> {
    return this.attendanceService.checkout(checkoutData);
  }

  @Get('late-logs')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PermissionName.attendance_permission)
  async getLateLogs(
    @Query() query: GetLateLogsDto
  ): Promise<LateLogsListResponseDto[]> {
    return this.attendanceService.getLateLogs(query);
  }

  @Get('late-logs/employee/:emp_id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PermissionName.attendance_permission)
  async getLateLogsByEmployee(
    @Param('emp_id') empId: string
  ): Promise<LateLogsListResponseDto[]> {
    const employeeId = Number(empId);
    if (isNaN(employeeId)) {
      throw new BadRequestException('Invalid employee ID');
    }
    return this.attendanceService.getLateLogsByEmployee(employeeId);
  }

  @Put('late-logs')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async submitLateReason(
    @Body() lateData: SubmitLateReasonDto
  ): Promise<LateLogResponseDto> {
    return this.attendanceService.submitLateReason(lateData);
  }

  @Put('late-logs/:id/action')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PermissionName.monthly_request_approvals)
  async processLateAction(
    @Param('id') id: string,
    @Body() actionData: { action: 'Pending' | 'Completed'; reviewer_id: number; late_type?: 'paid' | 'unpaid' }
  ): Promise<LateLogResponseDto> {
    const lateLogId = Number(id);
    if (isNaN(lateLogId)) {
      throw new BadRequestException('Invalid late log ID');
    }
    return this.attendanceService.processLateAction(
      lateLogId,
      actionData.action,
      actionData.reviewer_id,
      actionData.late_type
    );
  }

  @Get('half-day-logs')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PermissionName.attendance_permission)
  async getHalfDayLogs(
    @Query() query: GetHalfDayLogsDto
  ): Promise<HalfDayLogsListResponseDto[]> {
    return this.attendanceService.getHalfDayLogs(query);
  }

  @Get('half-day-logs/employee/:emp_id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PermissionName.attendance_permission)
  async getHalfDayLogsByEmployee(
    @Param('emp_id') empId: string
  ): Promise<HalfDayLogsListResponseDto[]> {
    const employeeId = Number(empId);
    if (isNaN(employeeId)) {
      throw new BadRequestException('Invalid employee ID');
    }
    return this.attendanceService.getHalfDayLogsByEmployee(employeeId);
  }

  @Put('half-day-logs')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async submitHalfDayReason(
    @Body() halfDayData: SubmitHalfDayReasonDto
  ): Promise<HalfDayLogResponseDto> {
    return this.attendanceService.submitHalfDayReason(halfDayData);
  }

  @Put('half-day-logs/:id/action')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PermissionName.monthly_request_approvals)
  async processHalfDayAction(
    @Param('id') id: string,
    @Body() actionData: { action: 'Pending' | 'Completed'; reviewer_id: number; half_day_type?: 'paid' | 'unpaid' }
  ): Promise<HalfDayLogResponseDto> {
    const halfDayLogId = Number(id);
    if (isNaN(halfDayLogId)) {
      throw new BadRequestException('Invalid half-day log ID');
    }
    return this.attendanceService.processHalfDayAction(
      halfDayLogId,
      actionData.action,
      actionData.reviewer_id,
      actionData.half_day_type
    );
  }

  @Get('leave-logs')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PermissionName.attendance_permission)
  async getLeaveLogs(
    @Query() query: GetLeaveLogsDto
  ): Promise<LeaveLogsListResponseDto[]> {
    return this.attendanceService.getLeaveLogs(query);
  }

  @Get('leave-logs/employee/:emp_id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PermissionName.attendance_permission)
  async getLeaveLogsByEmployee(
    @Param('emp_id') empId: string
  ): Promise<LeaveLogsListResponseDto[]> {
    const employeeId = Number(empId);
    if (isNaN(employeeId)) {
      throw new BadRequestException('Invalid employee ID');
    }
    return this.attendanceService.getLeaveLogsByEmployee(employeeId);
  }

  @Post('leave-logs')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard)
  async createLeaveLog(
    @Body() leaveData: CreateLeaveLogDto
  ): Promise<LeaveLogResponseDto> {
    return this.attendanceService.createLeaveLog(leaveData);
  }

  @Put('leave-logs/:id/action')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PermissionName.monthly_request_approvals)
  async processLeaveAction(
    @Param('id') id: string,
    @Body() actionData: ProcessLeaveActionDto
  ): Promise<LeaveLogResponseDto> {
    const leaveLogId = Number(id);
    if (isNaN(leaveLogId)) {
      throw new BadRequestException('Invalid leave log ID');
    }
    return this.attendanceService.processLeaveAction(
      leaveLogId,
      actionData.action,
      actionData.reviewer_id,
      actionData.confirmation_reason
    );
  }

  @Get('list')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PermissionName.attendance_permission)
  async getAttendanceList(): Promise<AttendanceListResponseDto[]> {
    return this.attendanceService.getAttendanceList();
  }

  @Get('list/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PermissionName.attendance_permission)
  async getAttendanceById(@Param('id') id: string): Promise<AttendanceListResponseDto | null> {
    const employeeId = Number(id);
    if (isNaN(employeeId)) {
      throw new BadRequestException('Invalid employee ID');
    }
    return this.attendanceService.getAttendanceById(employeeId);
  }

  @Get('month')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PermissionName.attendance_permission)
  async getMonthlyAttendanceList(@Query('month') month?: string): Promise<MonthlyAttendanceResponseDto[]> {
    return this.attendanceService.getMonthlyAttendanceList(month);
  }

  @Get('month/:emp_id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PermissionName.attendance_permission)
  async getMonthlyAttendanceByEmployee(
    @Param('emp_id') empId: string,
    @Query('month') month?: string
  ): Promise<MonthlyAttendanceResponseDto | null> {
    const employeeId = Number(empId);
    if (isNaN(employeeId)) {
      throw new BadRequestException('Invalid employee ID');
    }
    return this.attendanceService.getMonthlyAttendanceByEmployee(employeeId, month);
  }

  @Put('update')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PermissionName.attendance_permission)
  async updateAttendance(@Body() updateData: UpdateAttendanceDto): Promise<AttendanceListResponseDto> {
    return this.attendanceService.updateAttendance(updateData);
  }

  @Put('logs/:id/status')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PermissionName.attendance_permission)
  async updateAttendanceLogStatus(
    @Param('id') id: string,
    @Body() statusData: UpdateAttendanceLogStatusDto
  ): Promise<AttendanceLogResponseDto> {
    const logId = Number(id);
    if (isNaN(logId)) {
      throw new BadRequestException('Invalid attendance log ID');
    }
    return this.attendanceService.updateAttendanceLogStatus(
      logId,
      statusData.status,
      statusData.reason,
      statusData.reviewer_id,
      statusData.checkin,
      statusData.checkout
    );
  }

  @Put('monthly/update')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PermissionName.attendance_permission)
  async updateMonthlyAttendance(@Body() updateData: UpdateMonthlyAttendanceDto): Promise<MonthlyAttendanceResponseDto> {
    return this.attendanceService.updateMonthlyAttendance(updateData);
  }

  @Post('triggers/monthly-lates-reset')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PermissionName.attendance_permission)
  async triggerMonthlyLatesReset(): Promise<{ message: string; updated_count: number }> {
    const updatedCount = await this.monthlyLatesResetTrigger.manualReset();
    return {
      message: 'Monthly lates reset triggered successfully',
      updated_count: updatedCount
    };
  }

  @Post('triggers/quarterly-leaves-add')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PermissionName.attendance_permission)
  async triggerQuarterlyLeavesAdd(): Promise<{ message: string; updated_count: number }> {
    const updatedCount = await this.quarterlyLeavesUpdateTrigger.manualAddQuarterlyLeaves();
    return {
      message: 'Quarterly leaves add triggered successfully',
      updated_count: updatedCount
    };
  }

  @Post('triggers/quarterly-leaves-reset')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PermissionName.attendance_permission)
  async triggerQuarterlyLeavesReset(): Promise<{ message: string; updated_count: number }> {
    const updatedCount = await this.quarterlyLeavesUpdateTrigger.manualResetQuarterlyLeaves();
    return {
      message: 'Quarterly leaves reset triggered successfully',
      updated_count: updatedCount
    };
  }

  @Post('triggers/auto-mark-absent')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PermissionName.attendance_permission)
  async triggerAutoMarkAbsent(): Promise<{ message: string; absent_marked: number; leave_applied: number }> {
    return this.attendanceService.autoMarkAbsent();
  }

  @Post('triggers/weekend-auto-present/override')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PermissionName.attendance_permission)
  async triggerWeekendAutoPresentOverride(): Promise<{ message: string; marked_present: number; errors: number }> {
    const result = await this.weekendAutoPresentTrigger.manualOverride();
    return {
      message: 'Weekend auto-present override activated successfully (bypassing weekend check)',
      marked_present: result.marked_present,
      errors: result.errors
    };
  }

  @Get('triggers/weekend-status')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PermissionName.attendance_permission)
  async getWeekendStatus(): Promise<{
    isWeekend: boolean;
    dayOfWeek: number;
    dayName: string;
    currentTime: string;
    activeEmployees: number;
  }> {
    return this.weekendAutoPresentTrigger.getWeekendStatus();
  }

  // ==================== FUTURE HOLIDAY TRIGGER ENDPOINTS ====================

  /**
   * Get status of future holiday trigger
   * Shows if trigger is active, next check time, and today's holiday status
   */
  @Get('triggers/future-holiday-status')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PermissionName.attendance_permission)
  async getFutureHolidayTriggerStatus(): Promise<{
    isActive: boolean;
    nextCheck: string;
    todayHoliday?: string;
    activeEmployees: number;
  }> {
    return this.futureHolidayTrigger.getTriggerStatus();
  }

  /**
   * Manually trigger future holiday attendance marking for a specific date
   * Useful for testing or immediate processing
   */
  @Post('triggers/future-holiday-manual/:date')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PermissionName.attendance_permission)
  async manualTriggerFutureHoliday(@Param('date') date: string): Promise<{
    marked_present: number;
    errors: number;
    message: string;
  }> {
    try {
      // Validate date format (YYYY-MM-DD)
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(date)) {
        throw new BadRequestException('Date must be in YYYY-MM-DD format');
      }

      return await this.futureHolidayTrigger.manualTriggerForDate(date);
    } catch (error) {
      this.logger.error(`Error in manual future holiday trigger: ${error.message}`);
      throw error;
    }
  }

  @Post('bulk-mark-present')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PermissionName.attendance_permission)
  async bulkMarkPresent(@Body() bulkMarkData: BulkMarkPresentDto): Promise<{ message: string; marked_present: number; errors: number; skipped: number }> {
    return this.attendanceService.bulkMarkAllEmployeesPresent(bulkMarkData);
  }

  /**
   * Export Leave Logs
   * GET /hr/attendance/leave-logs/export
   */
  @Get('leave-logs/export')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PermissionName.attendance_permission)
  async exportLeaveLogs(
    @Res() res: Response,
    @Query() query: ExportLeaveLogsDto
  ) {
    const { format = 'csv', ...filterQuery } = query;
    const data = await this.attendanceService.getLeaveLogsForExport(filterQuery);
    const filename = `leave-logs-${new Date().toISOString().split('T')[0]}.${format}`;
    
    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(this.attendanceService.convertLeaveLogsToCSV(data, query));
    } else if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
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
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PermissionName.attendance_permission)
  async getLeaveLogsStats(
    @Query() query: LeaveLogsStatsDto
  ): Promise<LeaveLogsStatsResponseDto> {
    return this.attendanceService.getLeaveLogsStats(query);
  }

  /**
   * Export Late Logs
   * GET /hr/attendance/late-logs/export
   */
  @Get('late-logs/export')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PermissionName.attendance_permission)
  async exportLateLogs(
    @Res() res: Response,
    @Query() query: ExportLateLogsDto
  ) {
    const { format = 'csv', ...filterQuery } = query;
    const data = await this.attendanceService.getLateLogsForExport(filterQuery);
    const filename = `late-logs-${new Date().toISOString().split('T')[0]}.${format}`;
    
    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(this.attendanceService.convertLateLogsToCSV(data, query));
    } else if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
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
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PermissionName.attendance_permission)
  async getLateLogsStats(
    @Query() query: LateLogsStatsDto
  ): Promise<LateLogsStatsResponseDto> {
    return this.attendanceService.getLateLogsStats(query);
  }

  /**
   * Export Half Day Logs
   * GET /hr/attendance/half-day-logs/export
   */
  @Get('half-day-logs/export')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PermissionName.attendance_permission)
  async exportHalfDayLogs(
    @Res() res: Response,
    @Query() query: ExportHalfDayLogsDto
  ) {
    const { format = 'csv', ...filterQuery } = query;
    const data = await this.attendanceService.getHalfDayLogsForExport(filterQuery);
    const filename = `half-day-logs-${new Date().toISOString().split('T')[0]}.${format}`;
    
    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(this.attendanceService.convertHalfDayLogsToCSV(data, query));
    } else if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
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
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PermissionName.attendance_permission)
  async getHalfDayLogsStats(
    @Query() query: HalfDayLogsStatsDto
  ): Promise<HalfDayLogsStatsResponseDto> {
    return this.attendanceService.getHalfDayLogsStats(query);
  }
}