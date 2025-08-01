import { Controller, Get, Post, Put, Query, Body, UseGuards, HttpCode, HttpStatus, Param, BadRequestException, Logger } from '@nestjs/common';
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
import { MonthlyLatesResetTrigger } from './triggers/monthly-lates-reset.trigger';
import { QuarterlyLeavesUpdateTrigger } from './triggers/quarterly-leaves-update.trigger';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { PermissionName } from '../../common/constants/permission.enum';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('attendance')
export class AttendanceController {
  private readonly logger = new Logger(AttendanceController.name);

  constructor(
    private readonly attendanceService: AttendanceService,
    private readonly monthlyLatesResetTrigger: MonthlyLatesResetTrigger,
    private readonly quarterlyLeavesUpdateTrigger: QuarterlyLeavesUpdateTrigger
  ) {}

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
  @Permissions(PermissionName.attendance_permission)
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
  @Permissions(PermissionName.attendance_permission)
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
  @Permissions(PermissionName.attendance_permission)
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


}

