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
import { BulkMarkPresentDto } from './dto/bulk-mark-present.dto';
import { BulkCheckoutDto } from './dto/bulk-checkout.dto';
import { UpdateAttendanceLogStatusDto } from './dto/update-attendance-log-status.dto';
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

}
