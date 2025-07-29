import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { GetAttendanceLogsDto } from './dto/get-attendance-logs.dto';
import { AttendanceLogResponseDto } from './dto/attendance-log-response.dto';
import { CheckinDto } from './dto/checkin.dto';
import { CheckinResponseDto } from './dto/checkin-response.dto';
import { CheckoutDto } from './dto/checkout.dto';
import { CheckoutResponseDto } from './dto/checkout-response.dto';

@Injectable()
export class AttendanceService {
  constructor(private readonly prisma: PrismaService) {}

  async getAttendanceLogs(query: GetAttendanceLogsDto): Promise<AttendanceLogResponseDto[]> {
    try {
      const { employee_id, start_date, end_date } = query;

      // Ensure employee_id is a number
      const employeeId = employee_id ? Number(employee_id) : undefined;

      // Validate date range (within last 3 months)
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

      if (start_date && new Date(start_date) < threeMonthsAgo) {
        throw new BadRequestException('Start date cannot be more than 3 months ago');
      }

      if (end_date && new Date(end_date) < threeMonthsAgo) {
        throw new BadRequestException('End date cannot be more than 3 months ago');
      }

      // Validate that start_date is not less than end_date
      if (start_date && end_date && new Date(start_date) > new Date(end_date)) {
        throw new BadRequestException('Start date cannot be greater than end date');
      }

      // Build where clause
      const where: any = {};

      if (employeeId) {
        where.employeeId = employeeId;
      }

      if (start_date || end_date) {
        where.date = {};
        if (start_date) {
          where.date.gte = new Date(start_date);
        }
        if (end_date) {
          where.date.lte = new Date(end_date);
        }
      }

      // If no date filters provided, default to last 3 months
      if (!start_date && !end_date) {
        where.date = {
          gte: threeMonthsAgo
        };
      }

      const attendanceLogs = await this.prisma.attendanceLog.findMany({
        where,
        orderBy: {
          date: 'desc'
        },
        include: {
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          }
        }
      });

      return attendanceLogs.map(log => ({
        id: log.id,
        employee_id: log.employeeId,
        employee_first_name: log.employee.firstName,
        employee_last_name: log.employee.lastName,
        date: log.date?.toISOString().split('T')[0] || null,
        checkin: log.checkin?.toISOString() || null,
        checkout: log.checkout?.toISOString() || null,
        mode: log.mode,
        status: log.status,
        created_at: log.createdAt.toISOString(),
        updated_at: log.updatedAt.toISOString()
      }));
    } catch (error) {
      console.error('Error in getAttendanceLogs:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(`Failed to fetch attendance logs: ${error.message}`);
    }
  }

  async checkin(checkinData: CheckinDto): Promise<CheckinResponseDto> {
    try {
      const { employee_id, date, checkin, mode } = checkinData;

      // Ensure employee_id is a number
      const employeeId = Number(employee_id);

      // Check if employee exists
      const employee = await this.prisma.employee.findUnique({
        where: { id: employeeId },
        include: {
          department: true
        }
      });

      if (!employee) {
        throw new BadRequestException('Employee not found');
      }

      // Check if already checked in for this date
      const existingCheckin = await this.prisma.attendanceLog.findFirst({
        where: {
          employeeId,
          date: new Date(date)
        }
      });

      if (existingCheckin && existingCheckin.checkin) {
        throw new BadRequestException('Employee already checked in for this date');
      }

      // Parse check-in time and date (handle PKT timezone)
      // Assume the input time is in PKT local time, not UTC
      const checkinTimeInput = new Date(checkin);
      const checkinDateInput = new Date(date);
      
      // Create the actual PKT time by setting the time components directly
      const checkinTimePKT = new Date(checkinDateInput);
      checkinTimePKT.setHours(
        checkinTimeInput.getUTCHours(),
        checkinTimeInput.getUTCMinutes(),
        checkinTimeInput.getUTCSeconds(),
        0
      );
      
      const checkinDatePKT = new Date(checkinDateInput);
      
      // Get employee's shift times (default to 9:00 AM - 5:00 PM if not set)
      const shiftStart = employee.shiftStart || '09:00';
      const shiftEnd = employee.shiftEnd || '17:00';
      const [shiftStartHour, shiftStartMinute] = shiftStart.split(':').map(Number);
      const [shiftEndHour, shiftEndMinute] = shiftEnd.split(':').map(Number);
      
      // Create expected shift times for this date in PKT
      const expectedShiftStart = new Date(checkinDatePKT);
      expectedShiftStart.setHours(shiftStartHour, shiftStartMinute, 0, 0);
      
      const expectedShiftEnd = new Date(checkinDatePKT);
      expectedShiftEnd.setHours(shiftEndHour, shiftEndMinute, 0, 0);

      // Calculate minutes late from shift start
      const minutesLate = Math.floor((checkinTimePKT.getTime() - expectedShiftStart.getTime()) / (1000 * 60));

      // Determine status based on late policy rules
      let status: 'present' | 'late' | 'half_day' | 'absent' = 'present';
      let lateDetails: { minutes_late: number; requires_reason: boolean } | null = null;

      if (minutesLate > 0) {
        // Convert hours to minutes for comparison
        const halfHourMinutes = 30;
        const twoHoursMinutes = 120;
        const fourHoursMinutes = 240;

        if (minutesLate >= halfHourMinutes && minutesLate < twoHoursMinutes) {
          // 30 minutes to 2 hours late: present + late
          status = 'late';
          lateDetails = {
            minutes_late: minutesLate,
            requires_reason: true
          };
        } else if (minutesLate >= twoHoursMinutes && minutesLate < fourHoursMinutes) {
          // 2 hours to 4 hours late: present + half_day
          status = 'half_day';
          lateDetails = {
            minutes_late: minutesLate,
            requires_reason: true
          };
        } else if (minutesLate >= fourHoursMinutes || checkinTimePKT > expectedShiftEnd) {
          // 4+ hours late or after shift end: absent
          status = 'absent';
          lateDetails = {
            minutes_late: minutesLate,
            requires_reason: true
          };
        }
      }

      // Create or update attendance log
      const attendanceLog = await this.prisma.attendanceLog.upsert({
        where: {
          id: existingCheckin?.id || 0
        },
        update: {
          checkin: checkinTimePKT,
          mode: mode || null,
          status,
          updatedAt: new Date()
        },
        create: {
          employeeId,
          date: checkinDatePKT,
          checkin: checkinTimePKT,
          mode: mode || null,
          status
        }
      });

      // Update monthly attendance summary
      await this.updateMonthlyAttendanceSummary(employeeId, checkinDatePKT, status);

      return {
        id: attendanceLog.id,
        employee_id: attendanceLog.employeeId,
        date: attendanceLog.date?.toISOString().split('T')[0] || null,
        checkin: attendanceLog.checkin?.toISOString() || null,
        mode: attendanceLog.mode,
        status: attendanceLog.status as 'present' | 'late' | 'half_day' | 'absent' | null,
        late_details: lateDetails,
        created_at: attendanceLog.createdAt.toISOString(),
        updated_at: attendanceLog.updatedAt.toISOString()
      };
    } catch (error) {
      console.error('Error in checkin:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(`Failed to record check-in: ${error.message}`);
    }
  }

  async checkout(checkoutData: CheckoutDto): Promise<CheckoutResponseDto> {
    try {
      const { employee_id, date, checkout } = checkoutData;

      // Ensure employee_id is a number
      const employeeId = Number(employee_id);

      // Check if employee exists
      const employee = await this.prisma.employee.findUnique({
        where: { id: employeeId }
      });

      if (!employee) {
        throw new BadRequestException('Employee not found');
      }

      // Check if employee has checked in for this date
      const existingAttendance = await this.prisma.attendanceLog.findFirst({
        where: {
          employeeId,
          date: new Date(date)
        }
      });

      if (!existingAttendance || !existingAttendance.checkin) {
        throw new BadRequestException('Employee must check in before checking out');
      }

      if (existingAttendance.checkout) {
        throw new BadRequestException('Employee already checked out for this date');
      }

      // Parse checkout time (handle PKT timezone)
      const checkoutTimeInput = new Date(checkout);
      const checkoutDateInput = new Date(date);
      
      // Create the actual PKT time by setting the time components directly
      const checkoutTimePKT = new Date(checkoutDateInput);
      checkoutTimePKT.setHours(
        checkoutTimeInput.getUTCHours(),
        checkoutTimeInput.getUTCMinutes(),
        checkoutTimeInput.getUTCSeconds(),
        0
      );

      // Calculate total hours worked
      const checkinTime = existingAttendance.checkin;
      const totalMilliseconds = checkoutTimePKT.getTime() - checkinTime.getTime();
      const totalHoursWorked = Math.round((totalMilliseconds / (1000 * 60 * 60)) * 100) / 100; // Round to 2 decimal places

      // Update attendance log with checkout time
      const updatedAttendance = await this.prisma.attendanceLog.update({
        where: { id: existingAttendance.id },
        data: {
          checkout: checkoutTimePKT,
          updatedAt: new Date()
        }
      });

      return {
        id: updatedAttendance.id,
        employee_id: updatedAttendance.employeeId,
        date: updatedAttendance.date?.toISOString().split('T')[0] || null,
        checkin: updatedAttendance.checkin?.toISOString() || null,
        checkout: updatedAttendance.checkout?.toISOString() || null,
        mode: updatedAttendance.mode,
        status: updatedAttendance.status as 'present' | 'late' | 'half_day' | 'absent' | null,
        total_hours_worked: totalHoursWorked,
        created_at: updatedAttendance.createdAt.toISOString(),
        updated_at: updatedAttendance.updatedAt.toISOString()
      };
    } catch (error) {
      console.error('Error in checkout:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(`Failed to record check-out: ${error.message}`);
    }
  }

  private async updateMonthlyAttendanceSummary(
    employeeId: number, 
    checkinDate: Date, 
    status: 'present' | 'late' | 'half_day' | 'absent'
  ): Promise<void> {
    try {
      // Get month in YYYY-MM format
      const month = checkinDate.toISOString().slice(0, 7);

      // Find existing summary or create new one
      let summary = await this.prisma.monthlyAttendanceSummary.findFirst({
        where: {
          empId: employeeId,
          month: month
        }
      });

      if (!summary) {
        // Create new summary for the month
        summary = await this.prisma.monthlyAttendanceSummary.create({
          data: {
            empId: employeeId,
            month: month,
            totalPresent: 0,
            totalAbsent: 0,
            totalLeaveDays: 0,
            totalLateDays: 0,
            totalHalfDays: 0,
            totalRemoteDays: 0
          }
        });
      }

      // Update counters based on status
      const updateData: any = {};

      switch (status) {
        case 'present':
          updateData.totalPresent = { increment: 1 };
          break;
        case 'late':
          updateData.totalPresent = { increment: 1 };
          updateData.totalLateDays = { increment: 1 };
          break;
        case 'half_day':
          updateData.totalPresent = { increment: 1 };
          updateData.totalHalfDays = { increment: 1 };
          break;
        case 'absent':
          updateData.totalAbsent = { increment: 1 };
          break;
      }

      // Update the summary
      await this.prisma.monthlyAttendanceSummary.update({
        where: { id: summary.id },
        data: updateData
      });

    } catch (error) {
      console.error('Error updating monthly attendance summary:', error);
      // Don't throw error here to avoid failing the check-in
    }
  }
}
