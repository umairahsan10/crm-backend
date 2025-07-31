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

