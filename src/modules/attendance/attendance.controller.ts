import { Controller, Get, Post, Query, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { GetAttendanceLogsDto } from './dto/get-attendance-logs.dto';
import { AttendanceLogResponseDto } from './dto/attendance-log-response.dto';
import { CheckinDto } from './dto/checkin.dto';
import { CheckinResponseDto } from './dto/checkin-response.dto';
import { CheckoutDto } from './dto/checkout.dto';
import { CheckoutResponseDto } from './dto/checkout-response.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { PermissionName } from '../../common/constants/permission.enum';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

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
}
