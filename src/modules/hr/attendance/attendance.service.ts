import { Injectable, BadRequestException, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
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
import { BulkMarkPresentDto } from './dto/bulk-mark-present.dto';
import { BulkCheckoutDto } from './dto/bulk-checkout.dto';

@Injectable()
export class AttendanceService {
  constructor(private readonly prisma: PrismaService) { }

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
      var night_shift = false;
      const { employee_id, checkin, mode, timezone, offset_minutes } = checkinData;

      const employeeId = Number(employee_id);
      if (!employeeId || isNaN(employeeId) || employeeId <= 0) {
        throw new BadRequestException('Invalid employee ID');
      }

      // Fetch employee with shift info
      const employee = await this.prisma.employee.findUnique({
        where: { id: employeeId, status: 'active' },
        select: { departmentId: true, shiftStart: true, shiftEnd: true },
      });
      if (!employee) throw new BadRequestException('Employee not found');

      // Parse checkin as Date in employee's local timezone
      const effectiveOffsetMinutes = Number.isFinite(offset_minutes as any)
        ? Number(offset_minutes)
        : 300; // default PKT UTC+5

      const checkinLocal = new Date(
        new Date(checkin).toLocaleString("en-US", { timeZone: timezone || "Asia/Karachi" })
      );  

      // Normalize local date to midnight for business date calculations
      const checkinDatePKT = new Date(checkinLocal);
      checkinDatePKT.setHours(5, 0, 0, 0);

      // Parse shift start/end from varchar 24-hour format
      const [shiftStartHour, shiftStartMinute = 0] = (employee.shiftStart || '09:00').split(':').map(Number);
      const [shiftEndHour, shiftEndMinute = 0] = (employee.shiftEnd || '17:00').split(':').map(Number);

      const currentHour = checkinLocal.getHours();
      const currentMinute = checkinLocal.getMinutes();

      // Adjust business date for night shifts
      if (shiftEndHour < shiftStartHour) {
        if (currentHour < shiftEndHour || (currentHour === shiftEndHour && currentMinute <= shiftEndMinute)) {
          checkinDatePKT.setDate(checkinDatePKT.getDate() - 1);
          var night_shift = true;
          console.log(`Night shift: using previous day for employee ${employeeId}`);
        }
      }

      // Helper to format time as "HH:MM"
      const formatTime = (date: Date) =>
        `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;

      // Compute expected shift start/end for the business date
      const expectedShiftStart = new Date(checkinDatePKT);
      expectedShiftStart.setHours(shiftStartHour, shiftStartMinute, 0, 0);
      const expectedShiftEnd = new Date(checkinDatePKT);
      expectedShiftEnd.setHours(shiftEndHour, shiftEndMinute, 0, 0);
      if (shiftEndHour < shiftStartHour) expectedShiftEnd.setDate(expectedShiftEnd.getDate() + 1); // night shift

      // Compute minutes late
      let minutesLate = Math.floor((checkinLocal.getTime() - expectedShiftStart.getTime()) / (1000 * 60));
      if (shiftEndHour < shiftStartHour && minutesLate < 0) minutesLate += 24 * 60; // night shift adjustment
      if (minutesLate < 0) minutesLate = 0;

      // Fetch company policy
      const company = await this.prisma.company.findFirst({
        select: {
          lateTime: true,
          halfTime: true,
          absentTime: true,
        },
      });
      if (!company) throw new BadRequestException('Company policy not found');
      const lateTime = company.lateTime || 30;
      const halfTime = company.halfTime || 90;
      const absentTime = company.absentTime || 180;

      // Determine status based on minutes late
      let status: 'present' | 'late' | 'half_day' | 'absent' = 'present';
      let lateDetails: { minutes_late: number; requires_reason: boolean } | null = null;

      if (minutesLate > 0) {
        if (minutesLate <= lateTime) status = 'present';
        else if (minutesLate <= halfTime) { status = 'late'; lateDetails = { minutes_late: minutesLate, requires_reason: true }; }
        else if (minutesLate <= absentTime) { status = 'half_day'; lateDetails = { minutes_late: minutesLate, requires_reason: true }; }
        else { status = 'absent'; lateDetails = { minutes_late: minutesLate, requires_reason: true }; }
      }

      // Check if already checked in for this business date or night shift adjacent dates
      if (!night_shift) {
        const prevDate = new Date(checkinDatePKT); prevDate.setDate(prevDate.getDate() - 1);
        const nextDate = new Date(checkinDatePKT); nextDate.setDate(nextDate.getDate() + 1);
        var existingCheckin = await this.prisma.attendanceLog.findFirst({
          where: { employeeId, OR: [{ date: checkinDatePKT }, { date: prevDate }, { date: nextDate }] }
        });
      }
      else {
        var existingCheckin = await this.prisma.attendanceLog.findFirst({
          where: { employeeId, date: checkinDatePKT  }
        });
      }

      if (existingCheckin && existingCheckin.checkin) throw new BadRequestException('Employee already checked in for this date');

      // Create fresh attendance log
      const attendanceLog = await this.prisma.attendanceLog.create({
        data: {
          employeeId,
          date: checkinDatePKT,
          checkin: checkinLocal,
          mode: mode || 'onsite',
          status,
          createdAt: new Date(),
        }
      });

      // Update monthly summary & base attendance (methods remain unchanged)
      await this.updateMonthlyAttendanceSummary(employeeId, checkinDatePKT, status);

      // Create late log if needed
      if (status === 'late') {
        await this.prisma.lateLog.create({
          data: {
            empId: employeeId,
            date: checkinDatePKT,
            scheduledTimeIn: employee.shiftStart || '09:00',
            actualTimeIn: formatTime(checkinLocal),
            minutesLate,
            reason: null,
            actionTaken: 'Created',
            lateType: null,
            justified: null
          }
        });
      }

      // Create half-day log if needed
      if (status === 'half_day') {
        await this.prisma.halfDayLog.create({
          data: {
            empId: employeeId,
            date: checkinDatePKT,
            scheduledTimeIn: employee.shiftStart || '09:00',
            actualTimeIn: formatTime(checkinLocal),
            minutesLate,
            reason: null,
            actionTaken: 'Created',
            halfDayType: null,
            justified: null
          }
        });
      }

      return {
        id: attendanceLog.id,
        employee_id: attendanceLog.employeeId,
        date: attendanceLog.date?.toISOString().split('T')[0] || null,
        checkin: attendanceLog.checkin?.toISOString() || null,
        checkin_local: checkinLocal?.toISOString() || null,
        mode: attendanceLog.mode,
        status: attendanceLog.status as 'present' | 'late' | 'half_day' | 'absent' | null,
        late_details: lateDetails,
        timezone: timezone || 'Asia/Karachi',
        offset_minutes: effectiveOffsetMinutes,
        local_date: checkinDatePKT.toISOString().split('T')[0],
        created_at: attendanceLog.createdAt.toISOString(),
        updated_at: attendanceLog.updatedAt.toISOString()
      };
    } catch (error) {
      console.error('Error in checkin:', error);
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException(`Failed to record check-in: ${error.message}`);
    }
  }

  async checkout(checkoutData: CheckoutDto): Promise<CheckoutResponseDto> {
    try {
      const { employee_id, date, checkout, timezone, offset_minutes } = checkoutData;

      // Ensure employee_id is a number
      const employeeId = Number(employee_id);

      // Check if employee exists
      const employee = await this.prisma.employee.findUnique({
        where: { id: employeeId }
      });

      if (!employee) {
        throw new BadRequestException('Employee not found');
      }

      // Compute local time for checkout using provided offset (default +300 for PKT)
      const checkoutUtc = new Date(checkout);
      if (isNaN(checkoutUtc.getTime())) {
        throw new BadRequestException('Invalid checkout timestamp');
      }

      const effectiveOffsetMinutes = Number.isFinite(offset_minutes as any)
        ? Number(offset_minutes)
        : 300;

      // const checkoutLocal = new Date(checkoutUtc.getTime() + effectiveOffsetMinutes * 60 * 1000);

      // Determine business date: use provided date if available, otherwise calculate from checkout time
      let businessDateLocal: Date;
      if (date) {
        // Use provided date
        const inputDate = new Date(date + 'T00:00:00');
        if (isNaN(inputDate.getTime())) {
          throw new BadRequestException('Invalid date format. Expected YYYY-MM-DD');
        }
        businessDateLocal = new Date(inputDate);
        businessDateLocal.setHours(0, 0, 0, 0);
      } else {
        // Calculate from checkout time
        const localDateStr = `${checkoutUtc.getUTCFullYear()}-${String(checkoutUtc.getUTCMonth() + 1).padStart(2, '0')}-${String(checkoutUtc.getUTCDate()).padStart(2, '0')}`;
        businessDateLocal = new Date(localDateStr);
      }

      // Check if employee has checked in for this local business date
      // First try the provided/calculated date, then try adjacent dates for night shifts
      // Also try finding any log with checkin but no checkout (more flexible for night shifts)
      let existingAttendance = await this.prisma.attendanceLog.findFirst({
        where: {
          employeeId,
          date: businessDateLocal,
          checkin: { not: null },
          checkout: null
        }
      });

      // If not found, try previous day (for night shifts that cross midnight)
      if (!existingAttendance) {
        const prevDate = new Date(businessDateLocal);
        prevDate.setDate(prevDate.getDate() - 1);
        existingAttendance = await this.prisma.attendanceLog.findFirst({
          where: {
            employeeId,
            date: prevDate,
            checkin: { not: null },
            checkout: null
          }
        });
      }

      // If still not found, try next day
      if (!existingAttendance) {
        const nextDate = new Date(businessDateLocal);
        nextDate.setDate(nextDate.getDate() + 1);
        existingAttendance = await this.prisma.attendanceLog.findFirst({
          where: {
            employeeId,
            date: nextDate,
            checkin: { not: null },
            checkout: null
          }
        });
      }

      // Last resort: find the most recent log with checkin but no checkout for this employee
      // This handles edge cases where date calculation might be off
      if (!existingAttendance) {
        existingAttendance = await this.prisma.attendanceLog.findFirst({
          where: {
            employeeId,
            checkin: { not: null },
            checkout: null
          },
          orderBy: {
            createdAt: 'desc'
          }
        });
      }

      if (!existingAttendance || !existingAttendance.checkin) {
        throw new BadRequestException('Employee must check in before checking out');
      }

      if (existingAttendance.checkout) {
        throw new BadRequestException('Employee already checked out for this date');
      }

      // Use local time for storage
      const checkoutTimeForStorage = checkoutUtc;

      // Calculate total hours worked using the stored times
      const checkinTime = existingAttendance.checkin;
      const totalMilliseconds = checkoutTimeForStorage.getTime() - checkinTime.getTime();
      const totalHoursWorked = Math.round((totalMilliseconds / (1000 * 60 * 60)) * 100) / 100; // Round to 2 decimal places

      // Get local date string for response
      const localDateStr = `${checkoutUtc.getUTCFullYear()}-${String(checkoutUtc.getUTCMonth() + 1).padStart(2, '0')}-${String(checkoutUtc.getUTCDate()).padStart(2, '0')}`;

      // Update attendance log with checkout time
      const updatedAttendance = await this.prisma.attendanceLog.update({
        where: { id: existingAttendance.id },
        data: {
          checkout: checkoutTimeForStorage,
          updatedAt: new Date()
        }
      });

      return {
        id: updatedAttendance.id,
        employee_id: updatedAttendance.employeeId,
        date: updatedAttendance.date?.toISOString().split('T')[0] || null,
        checkin: updatedAttendance.checkin?.toISOString() || null,
        checkout: updatedAttendance.checkout?.toISOString() || null,
        checkout_local: checkoutUtc.toISOString(),
        mode: updatedAttendance.mode,
        status: updatedAttendance.status as 'present' | 'late' | 'half_day' | 'absent' | null,
        total_hours_worked: totalHoursWorked,
        timezone: timezone || 'Asia/Karachi',
        offset_minutes: effectiveOffsetMinutes,
        local_date: localDateStr,
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

  async getAttendanceList(): Promise<AttendanceListResponseDto[]> {
    try {
      const attendanceRecords = await this.prisma.attendance.findMany({
        include: {
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      return attendanceRecords.map(record => ({
        id: record.id,
        employee_id: record.employeeId,
        present_days: record.presentDays,
        absent_days: record.absentDays,
        late_days: record.lateDays,
        leave_days: record.leaveDays,
        remote_days: record.remoteDays,
        quarterly_leaves: record.quarterlyLeaves,
        monthly_lates: record.monthlyLates,
        half_days: record.halfDays,
        created_at: record.createdAt.toISOString(),
        updated_at: record.updatedAt.toISOString()
      }));
    } catch (error) {
      console.error('Error in getAttendanceList:', error);
      throw new InternalServerErrorException(`Failed to fetch attendance records: ${error.message}`);
    }
  }

  async getAttendanceById(employeeId: number): Promise<AttendanceListResponseDto | null> {
    try {
      const attendanceRecord = await this.prisma.attendance.findFirst({
        where: {
          employeeId: employeeId
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

      if (!attendanceRecord) {
        return null;
      }

      return {
        id: attendanceRecord.id,
        employee_id: attendanceRecord.employeeId,
        present_days: attendanceRecord.presentDays,
        absent_days: attendanceRecord.absentDays,
        late_days: attendanceRecord.lateDays,
        leave_days: attendanceRecord.leaveDays,
        remote_days: attendanceRecord.remoteDays,
        quarterly_leaves: attendanceRecord.quarterlyLeaves,
        monthly_lates: attendanceRecord.monthlyLates,
        half_days: attendanceRecord.halfDays,
        created_at: attendanceRecord.createdAt.toISOString(),
        updated_at: attendanceRecord.updatedAt.toISOString()
      };
    } catch (error) {
      console.error('Error in getAttendanceById:', error);
      throw new InternalServerErrorException(`Failed to fetch attendance record: ${error.message}`);
    }
  }

  async getMonthlyAttendanceList(month?: string): Promise<MonthlyAttendanceResponseDto[]> {
    try {
      // If no month provided, use current month
      const targetMonth = month || new Date().toISOString().slice(0, 7);

      // Validate month format (YYYY-MM)
      if (!/^\d{4}-\d{2}$/.test(targetMonth)) {
        throw new BadRequestException('Invalid month format. Use YYYY-MM format (e.g., 2025-01)');
      }

      const monthlyRecords = await this.prisma.monthlyAttendanceSummary.findMany({
        where: {
          month: targetMonth
        },
        include: {
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      return monthlyRecords.map(record => ({
        id: record.id,
        employee_id: record.empId,
        employee_first_name: record.employee.firstName,
        employee_last_name: record.employee.lastName,
        month: record.month,
        total_present: record.totalPresent,
        total_absent: record.totalAbsent,
        total_leave_days: record.totalLeaveDays,
        total_late_days: record.totalLateDays,
        total_half_days: record.totalHalfDays,
        total_remote_days: record.totalRemoteDays,
        generated_on: record.generatedOn.toISOString(),
        created_at: record.createdAt.toISOString(),
        updated_at: record.updatedAt.toISOString()
      }));
    } catch (error) {
      console.error('Error in getMonthlyAttendanceList:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(`Failed to fetch monthly attendance records: ${error.message}`);
    }
  }

  async getMonthlyAttendanceByEmployee(employeeId: number, month?: string): Promise<MonthlyAttendanceResponseDto | null> {
    try {
      // If no month provided, use current month
      const targetMonth = month || new Date().toISOString().slice(0, 7);

      // Validate month format (YYYY-MM)
      if (!/^\d{4}-\d{2}$/.test(targetMonth)) {
        throw new BadRequestException('Invalid month format. Use YYYY-MM format (e.g., 2025-01)');
      }

      const monthlyRecord = await this.prisma.monthlyAttendanceSummary.findFirst({
        where: {
          empId: employeeId,
          month: targetMonth
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

      if (!monthlyRecord) {
        return null;
      }

      return {
        id: monthlyRecord.id,
        employee_id: monthlyRecord.empId,
        employee_first_name: monthlyRecord.employee.firstName,
        employee_last_name: monthlyRecord.employee.lastName,
        month: monthlyRecord.month,
        total_present: monthlyRecord.totalPresent,
        total_absent: monthlyRecord.totalAbsent,
        total_leave_days: monthlyRecord.totalLeaveDays,
        total_late_days: monthlyRecord.totalLateDays,
        total_half_days: monthlyRecord.totalHalfDays,
        total_remote_days: monthlyRecord.totalRemoteDays,
        generated_on: monthlyRecord.generatedOn.toISOString(),
        created_at: monthlyRecord.createdAt.toISOString(),
        updated_at: monthlyRecord.updatedAt.toISOString()
      };
    } catch (error) {
      console.error('Error in getMonthlyAttendanceByEmployee:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(`Failed to fetch monthly attendance record: ${error.message}`);
    }
  }

  async updateAttendance(updateData: UpdateAttendanceDto): Promise<AttendanceListResponseDto> {
    try {
      const { employee_id, ...updateFields } = updateData;

      // Check if employee exists
      const employee = await this.prisma.employee.findUnique({
        where: { id: employee_id }
      });

      if (!employee) {
        throw new BadRequestException('Employee not found');
      }

      // Find existing attendance record
      const attendance = await this.prisma.attendance.findFirst({
        where: {
          employeeId: employee_id
        }
      });

      if (!attendance) {
        throw new BadRequestException('Attendance record not found for this employee');
      }

      // Prepare update data (only include fields that are provided)
      const dataToUpdate: any = {};

      if (updateFields.present_days !== undefined) dataToUpdate.presentDays = updateFields.present_days;
      if (updateFields.absent_days !== undefined) dataToUpdate.absentDays = updateFields.absent_days;
      if (updateFields.late_days !== undefined) dataToUpdate.lateDays = updateFields.late_days;
      if (updateFields.leave_days !== undefined) dataToUpdate.leaveDays = updateFields.leave_days;
      if (updateFields.remote_days !== undefined) dataToUpdate.remoteDays = updateFields.remote_days;
      if (updateFields.quarterly_leaves !== undefined) dataToUpdate.quarterlyLeaves = updateFields.quarterly_leaves;
      if (updateFields.monthly_lates !== undefined) dataToUpdate.monthlyLates = updateFields.monthly_lates;
      if (updateFields.half_days !== undefined) dataToUpdate.halfDays = updateFields.half_days;

      // Update the attendance record
      const updatedAttendance = await this.prisma.attendance.update({
        where: { id: attendance.id },
        data: dataToUpdate,
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

      return {
        id: updatedAttendance.id,
        employee_id: updatedAttendance.employeeId,
        present_days: updatedAttendance.presentDays,
        absent_days: updatedAttendance.absentDays,
        late_days: updatedAttendance.lateDays,
        leave_days: updatedAttendance.leaveDays,
        remote_days: updatedAttendance.remoteDays,
        quarterly_leaves: updatedAttendance.quarterlyLeaves,
        monthly_lates: updatedAttendance.monthlyLates,
        half_days: updatedAttendance.halfDays,
        created_at: updatedAttendance.createdAt.toISOString(),
        updated_at: updatedAttendance.updatedAt.toISOString()
      };
    } catch (error) {
      console.error('Error in updateAttendance:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(`Failed to update attendance record: ${error.message}`);
    }
  }

  async updateMonthlyAttendance(updateData: UpdateMonthlyAttendanceDto): Promise<MonthlyAttendanceResponseDto> {
    try {
      const { employee_id, month, ...updateFields } = updateData;

      // Check if employee exists
      const employee = await this.prisma.employee.findUnique({
        where: { id: employee_id }
      });

      if (!employee) {
        throw new BadRequestException('Employee not found');
      }

      // Find existing monthly attendance record
      const monthlyAttendance = await this.prisma.monthlyAttendanceSummary.findFirst({
        where: {
          empId: employee_id,
          month: month
        }
      });

      if (!monthlyAttendance) {
        throw new BadRequestException(`Monthly attendance record not found for employee ${employee_id} in month ${month}`);
      }

      // Prepare update data (only include fields that are provided)
      const dataToUpdate: any = {};

      if (updateFields.total_present !== undefined) dataToUpdate.totalPresent = updateFields.total_present;
      if (updateFields.total_absent !== undefined) dataToUpdate.totalAbsent = updateFields.total_absent;
      if (updateFields.total_leave_days !== undefined) dataToUpdate.totalLeaveDays = updateFields.total_leave_days;
      if (updateFields.total_late_days !== undefined) dataToUpdate.totalLateDays = updateFields.total_late_days;
      if (updateFields.total_half_days !== undefined) dataToUpdate.totalHalfDays = updateFields.total_half_days;
      if (updateFields.total_remote_days !== undefined) dataToUpdate.totalRemoteDays = updateFields.total_remote_days;

      // Update the monthly attendance record
      const updatedMonthlyAttendance = await this.prisma.monthlyAttendanceSummary.update({
        where: { id: monthlyAttendance.id },
        data: dataToUpdate,
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

      return {
        id: updatedMonthlyAttendance.id,
        employee_id: updatedMonthlyAttendance.empId,
        employee_first_name: updatedMonthlyAttendance.employee.firstName,
        employee_last_name: updatedMonthlyAttendance.employee.lastName,
        month: updatedMonthlyAttendance.month,
        total_present: updatedMonthlyAttendance.totalPresent,
        total_absent: updatedMonthlyAttendance.totalAbsent,
        total_leave_days: updatedMonthlyAttendance.totalLeaveDays,
        total_late_days: updatedMonthlyAttendance.totalLateDays,
        total_half_days: updatedMonthlyAttendance.totalHalfDays,
        total_remote_days: updatedMonthlyAttendance.totalRemoteDays,
        generated_on: updatedMonthlyAttendance.generatedOn.toISOString(),
        created_at: updatedMonthlyAttendance.createdAt.toISOString(),
        updated_at: updatedMonthlyAttendance.updatedAt.toISOString()
      };
    } catch (error) {
      console.error('Error in updateMonthlyAttendance:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(`Failed to update monthly attendance record: ${error.message}`);
    }
  }

  async updateAttendanceLogStatus(
    logId: number,
    newStatus: 'present' | 'late' | 'half_day' | 'absent',
    reason?: string,
    reviewerId?: number,
    checkin?: string,
    checkout?: string
  ): Promise<AttendanceLogResponseDto> {
    try {
      // Use transaction to ensure all updates succeed or fail together
      return await this.prisma.$transaction(async (tx) => {
        // 1. Get the current attendance log
        const currentLog = await tx.attendanceLog.findUnique({
          where: { id: logId },
          include: {
            employee: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                shiftStart: true,
                shiftEnd: true
              }
            }
          }
        });

        if (!currentLog) {
          throw new BadRequestException('Attendance log not found');
        }

        const oldStatus = currentLog.status;
        const employeeId = currentLog.employeeId;
        const logDate = currentLog.date ? new Date(currentLog.date) : new Date();

        // 2. Validate status change is allowed
        if (oldStatus === newStatus) {
          throw new BadRequestException('Status is already set to the requested value');
        }

        // 3. Update the attendance log
        const updateData: any = {
          status: newStatus,
          updatedAt: new Date()
        };

        if (checkin) {
          updateData.checkin = checkin;
        }
        if (checkout) {
          updateData.checkout = checkout;
        }

        const updatedLog = await tx.attendanceLog.update({
          where: { id: logId },
          data: updateData,
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

        // 4. Update attendance counters
        await this.updateAttendanceCountersForStatusChange(
          tx,
          employeeId,
          oldStatus || 'absent',
          newStatus
        );

        // 5. Update monthly attendance summary
        await this.updateMonthlyAttendanceSummaryForStatusChange(
          tx,
          employeeId,
          logDate,
          oldStatus || 'absent',
          newStatus
        );

        // 6. Create specific logs if needed
        if (newStatus === 'late') {
          await this.createLateLogForStatusChange(
            tx,
            employeeId,
            logDate,
            reason || 'Status changed to late',
            reviewerId
          );
        }

        if (newStatus === 'half_day') {
          await this.createHalfDayLogForStatusChange(
            tx,
            employeeId,
            logDate,
            reason || 'Status changed to half day',
            reviewerId
          );
        }

        // 7. Return updated log
        return {
          id: updatedLog.id,
          employee_id: updatedLog.employeeId,
          employee_first_name: updatedLog.employee.firstName,
          employee_last_name: updatedLog.employee.lastName,
          date: updatedLog.date?.toISOString().split('T')[0] || '',
          checkin: updatedLog.checkin?.toISOString() || null,
          checkout: updatedLog.checkout?.toISOString() || null,
          status: updatedLog.status,
          mode: updatedLog.mode || 'onsite',
          late_details: null, // Will be populated separately if needed
          created_at: updatedLog.createdAt.toISOString(),
          updated_at: updatedLog.updatedAt.toISOString()
        };
      });
    } catch (error) {
      console.error('Error in updateAttendanceLogStatus:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(`Failed to update attendance log status: ${error.message}`);
    }
  }


  async autoMarkAbsent(targetDate?: string): Promise<{ message: string; absent_marked: number; leave_applied: number }> {
    try {
      // Get current time in PKT (following checkin pattern)
      const now = new Date();
      const nowPkt = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Karachi' }));

      // Compute local time using PKT offset (+300 minutes = UTC+5)
      const effectiveOffsetMinutes = 300; // PKT UTC+5
      const currentTimeLocal = new Date(now.getTime() + effectiveOffsetMinutes * 60 * 1000);

      // Determine target business date: use provided date or calculate based on current time
      let todayPKT: Date;
      let localDateStr: string;

      if (targetDate) {
        // Use provided date
        const inputDate = new Date(targetDate + 'T00:00:00');
        if (isNaN(inputDate.getTime())) {
          throw new BadRequestException('Invalid date format. Expected YYYY-MM-DD');
        }
        todayPKT = new Date(inputDate);
        todayPKT.setHours(0, 0, 0, 0);
        localDateStr = targetDate;
      } else {
        // Derive local business date (YYYY-MM-DD) from local time
        localDateStr = `${currentTimeLocal.getUTCFullYear()}-${String(currentTimeLocal.getUTCMonth() + 1).padStart(2, '0')}-${String(currentTimeLocal.getUTCDate()).padStart(2, '0')}`;
        todayPKT = new Date(localDateStr);
      }

      // Get current time in HH:MM:SS format from PKT
      const currentHour = currentTimeLocal.getUTCHours();
      const currentMinute = currentTimeLocal.getUTCMinutes();
      const currentSecond = currentTimeLocal.getUTCSeconds();
      const currentTime = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}:${currentSecond.toString().padStart(2, '0')}`;

      // Convert current time to minutes since midnight for comparison
      const currentTimeMinutes = currentHour * 60 + currentMinute;

      console.log(`Auto-marking absent for date: ${localDateStr}, current time (PKT): ${currentTime}`);

      // Get company settings to retrieve absentTime configuration
      const company = await this.prisma.company.findFirst();
      if (!company) {
        throw new InternalServerErrorException('Company settings not found');
      }

      const absentTimeMinutes = company.absentTime || 180; // Default to 180 minutes (3 hours) if not set
      console.log(`Using company absentTime: ${absentTimeMinutes} minutes`);

      // Get all employees with their shift start times
      const employees = await this.prisma.employee.findMany({
        where: {
          status: 'active'
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          shiftStart: true,
          shiftEnd: true
        }
      });

      let absentMarked = 0;
      let leaveApplied = 0;

      // OPTIMIZATION: Pre-process all employees to determine who should be marked absent
      interface EmployeeAbsentData {
        employee: typeof employees[0];
        businessDate: Date;
        shouldMarkAbsent: boolean;
      }

      const employeesToProcess: EmployeeAbsentData[] = [];
      const employeeIds: number[] = [];

      for (const employee of employees) {
        if (!employee.shiftStart) {
          console.log(`Employee ${employee.id} has no shift start time, skipping`);
          continue;
        }

        // Calculate deadline (shift start + absentTime from company settings)
        const shiftStartTime = employee.shiftStart;
        const shiftStartParts = shiftStartTime.split(':');
        const shiftHours = parseInt(shiftStartParts[0], 10);
        let shiftMins = shiftStartParts[1] ? parseInt(shiftStartParts[1], 10) : 0;

        // Validate parsed values
        if (isNaN(shiftHours) || shiftHours < 0 || shiftHours > 23) {
          console.log(`Employee ${employee.id} has invalid shift start time: ${shiftStartTime}, skipping`);
          continue;
        }
        if (isNaN(shiftMins) || shiftMins < 0 || shiftMins > 59) {
          shiftMins = 0;
        }

        // Calculate shift start in minutes since midnight
        const shiftStartMinutes = shiftHours * 60 + shiftMins;

        // Calculate time since shift start (handles night shifts crossing midnight)
        let timeSinceShiftStart: number;
        if (currentTimeMinutes >= shiftStartMinutes) {
          timeSinceShiftStart = currentTimeMinutes - shiftStartMinutes;
        } else {
          // Shift started yesterday (night shift)
          timeSinceShiftStart = (1440 - shiftStartMinutes) + currentTimeMinutes;
        }

        // Determine the business date for this employee
        let businessDate = new Date(todayPKT);

        if (!targetDate) {
          // No target date provided - calculate based on current time and night shift logic
          const shiftEnd = employee.shiftEnd || '17:00';
          const shiftEndParts = shiftEnd.split(':');
          const shiftEndHour = parseInt(shiftEndParts[0], 10);
          const shiftEndMinute = shiftEndParts[1] ? parseInt(shiftEndParts[1], 10) : 0;

          // If it's a night shift (crosses midnight)
          if (shiftEndHour < shiftHours) {
            const shiftEndMinutes = shiftEndHour * 60 + shiftEndMinute;
            if (currentTimeMinutes < shiftEndMinutes) {
              businessDate = new Date(todayPKT);
              businessDate.setDate(businessDate.getDate() - 1);
            }
          }
        } else {
          // Target date provided - use it directly
          businessDate = new Date(todayPKT);
        }

        // Determine if employee should be marked as absent
        const shouldMarkAbsent = timeSinceShiftStart >= absentTimeMinutes;

        if (shouldMarkAbsent) {
          employeesToProcess.push({
            employee,
            businessDate,
            shouldMarkAbsent: true
          });
          employeeIds.push(employee.id);
        }
      }

      if (employeesToProcess.length === 0) {
        console.log('No employees need to be marked absent');
        return {
          message: 'Auto-mark absent process completed successfully',
          absent_marked: 0,
          leave_applied: 0
        };
      }

      // OPTIMIZATION: Pre-fetch all existing logs in ONE query
      const allBusinessDates = employeesToProcess.map(e => e.businessDate);
      const minDate = new Date(Math.min(...allBusinessDates.map(d => d.getTime())));
      const maxDate = new Date(Math.max(...allBusinessDates.map(d => d.getTime())));
      minDate.setHours(0, 0, 0, 0);
      maxDate.setHours(23, 59, 59, 999);

      const existingLogs = await this.prisma.attendanceLog.findMany({
        where: {
          employeeId: { in: employeeIds },
          date: {
            gte: minDate,
            lte: maxDate
          }
        }
      });

      // Create map for quick lookup
      const existingLogsMap = new Map<string, typeof existingLogs[0]>();
      for (const log of existingLogs) {
        if (log.date) {
          const key = `${log.employeeId}_${log.date.getTime()}`;
          existingLogsMap.set(key, log);
        }
      }

      // OPTIMIZATION: Pre-fetch all approved leaves in ONE query
      const allBusinessDatesForLeave = Array.from(new Set(allBusinessDates.map(d => d.getTime()))).map(t => new Date(t));
      const minLeaveDate = new Date(Math.min(...allBusinessDatesForLeave.map(d => d.getTime())));
      const maxLeaveDate = new Date(Math.max(...allBusinessDatesForLeave.map(d => d.getTime())));

      const approvedLeaves = await this.prisma.leaveLog.findMany({
        where: {
          empId: { in: employeeIds },
          status: 'Approved',
          startDate: { lte: maxLeaveDate },
          endDate: { gte: minLeaveDate }
        }
      });

      // Create map for quick lookup (check if date falls within leave range)
      const employeeLeavesMap = new Map<number, typeof approvedLeaves>();
      for (const leave of approvedLeaves) {
        if (!employeeLeavesMap.has(leave.empId)) {
          employeeLeavesMap.set(leave.empId, []);
        }
        employeeLeavesMap.get(leave.empId)!.push(leave);
      }

      // OPTIMIZATION: Pre-fetch all attendance records for leave updates
      const attendanceRecords = await this.prisma.attendance.findMany({
        where: {
          employeeId: { in: employeeIds }
        }
      });

      const attendanceMap = new Map<number, typeof attendanceRecords[0]>();
      for (const att of attendanceRecords) {
        attendanceMap.set(att.employeeId, att);
      }

      // Group operations
      const absentLogsToCreate: Array<{
        employeeId: number;
        date: Date;
        checkin: null;
        checkout: null;
        mode: 'onsite';
        status: 'absent';
      }> = [];

      const leaveLogsToCreate: Array<{
        employeeId: number;
        date: Date;
        checkin: null;
        checkout: null;
        mode: 'onsite';
        status: 'leave';
      }> = [];

      const leaveLogsToUpdate: Array<{
        id: number;
        status: 'leave';
      }> = [];

      interface LeaveUpdateData {
        employeeId: number;
        businessDate: Date;
      }
      const leaveUpdates: LeaveUpdateData[] = [];

      interface AbsentUpdateData {
        employeeId: number;
        businessDate: Date;
      }
      const absentUpdates: AbsentUpdateData[] = [];

      // Process all employees and group operations
      for (const empData of employeesToProcess) {
        const { employee, businessDate } = empData;
        const logKey = `${employee.id}_${businessDate.getTime()}`;
        const existingLog = existingLogsMap.get(logKey);

        if (existingLog) {
          console.log(`Employee ${employee.id} already has attendance log for ${businessDate.toISOString().split('T')[0]}, skipping`);
          continue;
        }

        // Check if employee has approved leave for this date
        const employeeLeaves = employeeLeavesMap.get(employee.id) || [];
        const hasApprovedLeave = employeeLeaves.some(leave => {
          const leaveStart = new Date(leave.startDate);
          const leaveEnd = new Date(leave.endDate);
          leaveStart.setHours(0, 0, 0, 0);
          leaveEnd.setHours(23, 59, 59, 999);
          return businessDate >= leaveStart && businessDate <= leaveEnd;
        });

        if (hasApprovedLeave) {
          console.log(`Employee ${employee.id} has approved leave for ${businessDate.toISOString().split('T')[0]}, applying leave instead of absent`);

          // Check if there's an existing log to update (shouldn't happen, but just in case)
          const existingLogForLeave = existingLogsMap.get(logKey);
          if (existingLogForLeave) {
            leaveLogsToUpdate.push({
              id: existingLogForLeave.id,
              status: 'leave'
            });
          } else {
            leaveLogsToCreate.push({
              employeeId: employee.id,
              date: businessDate,
              checkin: null,
              checkout: null,
              mode: 'onsite',
              status: 'leave'
            });
          }

          leaveUpdates.push({ employeeId: employee.id, businessDate });
          leaveApplied++;
        } else {
          console.log(`Employee ${employee.id} has no approved leave, marking as absent for ${businessDate.toISOString().split('T')[0]}`);

          absentLogsToCreate.push({
            employeeId: employee.id,
            date: businessDate,
            checkin: null,
            checkout: null,
            mode: 'onsite',
            status: 'absent'
          });

          absentUpdates.push({ employeeId: employee.id, businessDate });
          absentMarked++;
        }
      }

      // OPTIMIZATION: Execute all bulk operations in a single transaction
      await this.prisma.$transaction(async (tx) => {
        // Bulk create absent logs
        if (absentLogsToCreate.length > 0) {
          await tx.attendanceLog.createMany({
            data: absentLogsToCreate,
            skipDuplicates: true
          });
        }

        // Bulk create leave logs
        if (leaveLogsToCreate.length > 0) {
          await tx.attendanceLog.createMany({
            data: leaveLogsToCreate,
            skipDuplicates: true
          });
        }

        // Bulk update leave logs (if any existing logs need to be updated)
        if (leaveLogsToUpdate.length > 0) {
          await Promise.all(
            leaveLogsToUpdate.map(log =>
              tx.attendanceLog.update({
                where: { id: log.id },
                data: {
                  status: 'leave',
                  checkin: null,
                  checkout: null
                }
              })
            )
          );
        }

        // Update attendance counters for leaves (batch parallel execution)
        if (leaveUpdates.length > 0) {
          await Promise.all(
            leaveUpdates.map(async (update) => {
              const attendance = attendanceMap.get(update.employeeId);
              if (attendance) {
                const currentLeaveDays = attendance.leaveDays || 0;
                const currentQuarterlyLeaves = attendance.quarterlyLeaves || 0;

                await tx.attendance.update({
                  where: { id: attendance.id },
                  data: {
                    leaveDays: currentLeaveDays + 1,
                    quarterlyLeaves: Math.max(0, currentQuarterlyLeaves - 1)
                  }
                });

                // Update monthly attendance summary
                const monthKey = update.businessDate.toISOString().split('T')[0].substring(0, 7);
                await tx.monthlyAttendanceSummary.updateMany({
                  where: {
                    empId: update.employeeId,
                    month: monthKey
                  },
                  data: {
                    totalLeaveDays: { increment: 1 }
                  }
                });
              }
            })
          );
        }

        // Update attendance counters for absent (batch parallel execution)
        // Pre-fetch monthly summaries to avoid individual queries
        const uniqueMonths = Array.from(new Set(absentUpdates.map(u => u.businessDate.toISOString().slice(0, 7))));
        const absentEmployeeIds = absentUpdates.map(u => u.employeeId);
        const monthlySummariesForAbsent = await tx.monthlyAttendanceSummary.findMany({
          where: {
            empId: { in: absentEmployeeIds },
            month: { in: uniqueMonths }
          }
        });
        const monthlySummaryMapForAbsent = new Map<string, typeof monthlySummariesForAbsent[0]>();
        for (const summary of monthlySummariesForAbsent) {
          const key = `${summary.empId}_${summary.month}`;
          monthlySummaryMapForAbsent.set(key, summary);
        }

        if (absentUpdates.length > 0) {
          await Promise.all(
            absentUpdates.map(async (update) => {
              // Update base attendance
              const attendance = attendanceMap.get(update.employeeId);
              if (!attendance) {
                // Create new attendance record if it doesn't exist
                await tx.attendance.create({
                  data: {
                    employeeId: update.employeeId,
                    presentDays: 0,
                    absentDays: 1,
                    lateDays: 0,
                    leaveDays: 0,
                    remoteDays: 0,
                    quarterlyLeaves: 0,
                    monthlyLates: 0,
                    halfDays: 0
                  }
                });
              } else {
                await tx.attendance.update({
                  where: { id: attendance.id },
                  data: {
                    absentDays: { increment: 1 }
                  }
                });
              }

              // Update monthly attendance summary using pre-fetched data
              const month = update.businessDate.toISOString().slice(0, 7);
              const summaryKey = `${update.employeeId}_${month}`;
              let summary = monthlySummaryMapForAbsent.get(summaryKey);

              if (!summary) {
                summary = await tx.monthlyAttendanceSummary.create({
                  data: {
                    empId: update.employeeId,
                    month: month,
                    totalPresent: 0,
                    totalAbsent: 1,
                    totalLeaveDays: 0,
                    totalLateDays: 0,
                    totalHalfDays: 0,
                    totalRemoteDays: 0
                  }
                });
                monthlySummaryMapForAbsent.set(summaryKey, summary);
              } else {
                await tx.monthlyAttendanceSummary.update({
                  where: { id: summary.id },
                  data: {
                    totalAbsent: { increment: 1 }
                  }
                });
              }
            })
          );
        }
      }, {
        timeout: 60000,
        maxWait: 15000
      });

      return {
        message: 'Auto-mark absent process completed successfully',
        absent_marked: absentMarked,
        leave_applied: leaveApplied
      };

    } catch (error) {
      console.error('Error in autoMarkAbsent:', error);
      throw new InternalServerErrorException(`Failed to auto-mark absent: ${error.message}`);
    }
  }

  /**
   * Bulk mark employees as present - follows checkin logic pattern
   * Uses current PKT time as checkin time, calculates status based on company settings
   * Creates late/half-day logs as needed, supports cross-day scenarios
   * Updates attendance_logs, attendance, monthly_attendance_summary, and hr_logs tables
   */
  async bulkMarkAllEmployeesPresent(bulkMarkData: BulkMarkPresentDto): Promise<{ message: string; marked_present: number; errors: number; skipped: number }> {
    const { date, employee_ids, reason, checkin, mode, timezone, offset_minutes } = bulkMarkData;

    // Use checkin time from request or current time (following checkin pattern)
    const checkinTime = checkin ? new Date(checkin) : new Date();
    if (isNaN(checkinTime.getTime())) {
      throw new BadRequestException('Invalid checkin timestamp');
    }

    // Parse checkin as Date in employee's local timezone (following checkin pattern)
    const effectiveOffsetMinutes = Number.isFinite(offset_minutes as any)
      ? Number(offset_minutes)
      : 300; // default PKT UTC+5

    const checkinLocal = new Date(
      checkinTime.toLocaleString("en-US", { timeZone: timezone || "Asia/Karachi" })
    );

    // Normalize local date to midnight for business date calculations (following checkin pattern)
    const checkinDatePKT = new Date(checkinLocal);
    checkinDatePKT.setHours(5, 0, 0, 0);

    // Determine target date: use provided date or default to current PKT business date
    let targetBusinessDate: Date;
    if (date) {
      // Parse provided date string (YYYY-MM-DD format) as UTC to avoid timezone shifts
      // Split the date string to avoid timezone interpretation issues
      const dateParts = date.split('-');
      if (dateParts.length !== 3) {
        throw new BadRequestException('Invalid date format. Expected YYYY-MM-DD');
      }

      // Create date in UTC to avoid timezone conversion issues
      // This ensures "2025-11-14" stays as "2025-11-14" regardless of server timezone
      targetBusinessDate = new Date(Date.UTC(
        parseInt(dateParts[0], 10),
        parseInt(dateParts[1], 10) - 1, // Month is 0-indexed
        parseInt(dateParts[2], 10),
        0, 0, 0, 0
      ));

      if (isNaN(targetBusinessDate.getTime())) {
        throw new BadRequestException('Invalid date format. Expected YYYY-MM-DD');
      }

      // Get today in PKT for validation
      const nowPkt = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Karachi' }));
      const todayPKT = new Date(nowPkt);
      todayPKT.setHours(0, 0, 0, 0);

      // Allow present and past dates, but not future dates (based on PKT)
      // Compare dates by their date components only (ignore time)
      const targetDateOnly = new Date(targetBusinessDate.getUTCFullYear(), targetBusinessDate.getUTCMonth(), targetBusinessDate.getUTCDate());
      const todayDateOnly = new Date(todayPKT.getFullYear(), todayPKT.getMonth(), todayPKT.getDate());

      if (targetDateOnly.getTime() > todayDateOnly.getTime()) {
        throw new BadRequestException('Bulk mark present is not allowed for future dates.');
      }
    } else {
      // Use current PKT business date as default (following checkin pattern)
      targetBusinessDate = new Date(checkinDatePKT);
    }

    // Fetch company settings (required for status determination)
    const company = await this.prisma.company.findFirst();
    if (!company) {
      throw new InternalServerErrorException('Company settings not found');
    }

    // Get company policy values
    const lateTime = company.lateTime || 30;
    const halfTime = company.halfTime || 90;
    const absentTime = company.absentTime || 180;

    // Build employee query: filter by employee_ids if provided, otherwise get all active
    const employeeWhere: any = {
      status: 'active'
    };

    if (employee_ids && employee_ids.length > 0) {
      // Validate employee IDs are positive integers
      const invalidIds = employee_ids.filter(id => !Number.isInteger(id) || id <= 0);
      if (invalidIds.length > 0) {
        throw new BadRequestException(`Invalid employee IDs: ${invalidIds.join(', ')}. All IDs must be positive integers.`);
      }
      employeeWhere.id = { in: employee_ids };
    }

    // Get employees based on filter
    const employees = await this.prisma.employee.findMany({
      where: employeeWhere,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        shiftStart: true,
        shiftEnd: true
      }
    });

    if (employees.length === 0) {
      const message = employee_ids && employee_ids.length > 0
        ? `No active employees found with the provided employee IDs: ${employee_ids.join(', ')}`
        : 'No active employees found.';
      throw new NotFoundException(message);
    }

    // Validate that all requested employee IDs exist (if provided)
    if (employee_ids && employee_ids.length > 0) {
      const foundIds = employees.map(emp => emp.id);
      const missingIds = employee_ids.filter(id => !foundIds.includes(id));
      if (missingIds.length > 0) {
        throw new NotFoundException(`Employees not found or not active: ${missingIds.join(', ')}`);
      }
    }

    // Format date for logging (use UTC date components to avoid timezone shift)
    const logDateStr = date
      ? date // Use the original input date string
      : `${targetBusinessDate.getUTCFullYear()}-${String(targetBusinessDate.getUTCMonth() + 1).padStart(2, '0')}-${String(targetBusinessDate.getUTCDate()).padStart(2, '0')}`;
    console.log(`Bulk mark present: Using PKT date ${logDateStr} for ${employees.length} employee(s)`);

    let markedPresent = 0;
    let errors = 0;
    let skipped = 0;
    let markedLate = 0;
    let markedHalfDay = 0;

    // Format date string for logging and responses (use UTC date components to avoid timezone shift)
    const dateStr = date
      ? date // Use the original input date string
      : `${targetBusinessDate.getUTCFullYear()}-${String(targetBusinessDate.getUTCMonth() + 1).padStart(2, '0')}-${String(targetBusinessDate.getUTCDate()).padStart(2, '0')}`;
    // Use checkinLocal as checkin time for bulk operations (following checkin pattern)
    const checkinTimeForStorage = checkinLocal;

    console.log(`Starting bulk checkin operation for ${employees.length} employee(s) on ${dateStr} at ${checkinTimeForStorage.toISOString()}`);

    // OPTIMIZATION: Pre-process all employees to calculate their data upfront
    const currentHour = checkinLocal.getHours();
    const currentMinute = checkinLocal.getMinutes();
    const employeeIds = employees.map(emp => emp.id);

    // Pre-calculate all employee data (status, dates, minutes late)
    interface EmployeeProcessData {
      employee: typeof employees[0];
      businessDate: Date;
      status: 'present' | 'late' | 'half_day' | 'absent';
      minutesLate: number;
      shiftStart: string;
      actualTimeIn: string;
      night_shift: boolean;
    }

    const employeeDataMap = new Map<number, EmployeeProcessData>();

    // Helper to format time as "HH:MM" (following checkin pattern)
    const formatTime = (date: Date) =>
      `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;

    for (const employee of employees) {
      try {
        var night_shift = false;
        // Parse shift start/end from varchar 24-hour format (following checkin pattern)
        const [shiftStartHour, shiftStartMinute = 0] = (employee.shiftStart || '09:00').split(':').map(Number);
        const [shiftEndHour, shiftEndMinute = 0] = (employee.shiftEnd || '17:00').split(':').map(Number);

        // Determine the correct business date for this employee (following checkin pattern)
        // Start with the target business date (either provided date or calculated from checkin time)
        let employeeBusinessDate = new Date(targetBusinessDate);
        
        // Adjust business date for night shifts (following checkin pattern)
        // This applies regardless of whether a date was provided, matching checkin behavior
        if (shiftEndHour < shiftStartHour) {
          if (currentHour < shiftEndHour || (currentHour === shiftEndHour && currentMinute <= shiftEndMinute)) {
            employeeBusinessDate.setDate(employeeBusinessDate.getDate() - 1);
            var night_shift = true;
            console.log(`Night shift: using previous day for employee ${employee.id}`);
          }
        }

        // Compute expected shift start/end for the business date (following checkin pattern)
        const expectedShiftStart = new Date(employeeBusinessDate);
        expectedShiftStart.setHours(shiftStartHour, shiftStartMinute, 0, 0);
        const expectedShiftEnd = new Date(employeeBusinessDate);
        expectedShiftEnd.setHours(shiftEndHour, shiftEndMinute, 0, 0);
        if (shiftEndHour < shiftStartHour) expectedShiftEnd.setDate(expectedShiftEnd.getDate() + 1); // night shift

        // Compute minutes late (following checkin pattern)
        let minutesLate = Math.floor((checkinLocal.getTime() - expectedShiftStart.getTime()) / (1000 * 60));
        if (shiftEndHour < shiftStartHour && minutesLate < 0) minutesLate += 24 * 60; // night shift adjustment
        if (minutesLate < 0) minutesLate = 0;

        // Determine status based on minutes late (following checkin pattern)
        let status: 'present' | 'late' | 'half_day' | 'absent' = 'present';
        let lateDetails: { minutes_late: number; requires_reason: boolean } | null = null;

        if (minutesLate > 0) {
          if (minutesLate <= lateTime) status = 'present';
          else if (minutesLate <= halfTime) { status = 'late'; lateDetails = { minutes_late: minutesLate, requires_reason: true }; }
          else if (minutesLate <= absentTime) { status = 'half_day'; lateDetails = { minutes_late: minutesLate, requires_reason: true }; }
          else { status = 'absent'; lateDetails = { minutes_late: minutesLate, requires_reason: true }; }
        }

        const actualTimeIn = formatTime(checkinLocal);

        employeeDataMap.set(employee.id, {
          employee,
          businessDate: employeeBusinessDate,
          status,
          minutesLate,
          shiftStart: employee.shiftStart || '09:00',
          actualTimeIn,
          night_shift: night_shift
        });
      } catch (error) {
        console.error(`Error pre-processing employee ${employee.id}:`, error);
        errors++;
      }
    }

    // OPTIMIZATION: Pre-fetch all existing logs in ONE query instead of per-employee
    // Get all unique business dates to query (use date range to handle all dates, including night shift adjacent dates)
    const allBusinessDates = Array.from(employeeDataMap.values()).map(d => d.businessDate);
    const allDatesWithAdjacent = new Set<number>();
    for (const date of allBusinessDates) {
      allDatesWithAdjacent.add(date.getTime());
      // Add adjacent dates for night shift checking (following checkin pattern)
      const prevDate = new Date(date);
      prevDate.setDate(prevDate.getDate() - 1);
      allDatesWithAdjacent.add(prevDate.getTime());
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      allDatesWithAdjacent.add(nextDate.getTime());
    }
    const minDate = new Date(Math.min(...Array.from(allDatesWithAdjacent)));
    const maxDate = new Date(Math.max(...Array.from(allDatesWithAdjacent)));
    // Set to start and end of day to capture all dates
    minDate.setHours(0, 0, 0, 0);
    maxDate.setHours(23, 59, 59, 999);

    const existingLogs = await this.prisma.attendanceLog.findMany({
      where: {
        employeeId: { in: employeeIds },
        date: {
          gte: minDate,
          lte: maxDate
        }
      }
    });

    // Create a map of existing logs by employeeId and date for quick lookup
    const existingLogsMap = new Map<string, typeof existingLogs[0]>();
    for (const log of existingLogs) {
      if (log.date) {
        const key = `${log.employeeId}_${log.date.getTime()}`;
        existingLogsMap.set(key, log);
      }
    }

    // OPTIMIZATION: Pre-fetch monthly summaries in batch (for wasAbsent check only)
    const monthlySummariesForCheck = await this.prisma.monthlyAttendanceSummary.findMany({
      where: {
        empId: { in: employeeIds }
      }
    });

    const monthlySummaryMapForCheck = new Map<string, typeof monthlySummariesForCheck[0]>();
    for (const summary of monthlySummariesForCheck) {
      const key = `${summary.empId}_${summary.month}`;
      monthlySummaryMapForCheck.set(key, summary);
    }

    // Group operations: separates creates vs updates
    const logsToCreate: Array<{
      employeeId: number;
      date: Date;
      checkin: Date;
      checkout: null;
      mode: 'onsite' | 'remote';
      status: 'present' | 'late' | 'half_day' | 'absent';
    }> = [];

    const logsToUpdate: Array<{
      id: number;
      checkin: Date;
      status: 'present' | 'late' | 'half_day' | 'absent';
      mode: 'onsite' | 'remote';
    }> = [];

    const lateLogsToCreate: Array<{
      empId: number;
      date: Date;
      scheduledTimeIn: string;
      actualTimeIn: string;
      minutesLate: number;
      reason: null;
      actionTaken: 'Created';
      lateType: null;
      justified: null;
    }> = [];

    const halfDayLogsToCreate: Array<{
      empId: number;
      date: Date;
      scheduledTimeIn: string;
      actualTimeIn: string;
      minutesLate: number;
      reason: null;
      actionTaken: 'Created';
      halfDayType: null;
      justified: null;
    }> = [];

    // Track which employees need counter updates
    interface CounterUpdateData {
      employeeId: number;
      businessDate: Date;
      wasAbsent: boolean;
      status: 'present' | 'late' | 'half_day' | 'absent';
    }
    const counterUpdates: CounterUpdateData[] = [];

    // Process all employees and group operations
    for (const [employeeId, empData] of employeeDataMap.entries()) {
      try {
        // Check if already checked in for this business date or night shift adjacent dates (following checkin pattern)
        let existingCheckin: typeof existingLogs[0] | undefined;
        if (!empData.night_shift) {
          const prevDate = new Date(empData.businessDate);
          prevDate.setDate(prevDate.getDate() - 1);
          const nextDate = new Date(empData.businessDate);
          nextDate.setDate(nextDate.getDate() + 1);
          existingCheckin = existingLogs.find(
            log => log.employeeId === employeeId &&
              log.date &&
              (log.date.getTime() === empData.businessDate.getTime() ||
               log.date.getTime() === prevDate.getTime() ||
               log.date.getTime() === nextDate.getTime())
          );
        } else {
          const logKey = `${employeeId}_${empData.businessDate.getTime()}`;
          existingCheckin = existingLogsMap.get(logKey);
        }

        if (existingCheckin) {
          // Check if we should skip (already has checkin and same status)
          if (existingCheckin.checkin && existingCheckin.status === empData.status) {
            skipped++;
            continue;
          }

          // Update existing log (following checkin pattern)
          logsToUpdate.push({
            id: existingCheckin.id,
            checkin: checkinTimeForStorage,
            status: empData.status,
            mode: mode || 'onsite'
          });

          const wasAbsent = existingCheckin.status === 'absent';
          counterUpdates.push({
            employeeId,
            businessDate: empData.businessDate,
            wasAbsent,
            status: empData.status
          });
        } else {
          // Check if this date was manually counted as absent
          const monthYear = `${empData.businessDate.getFullYear()}-${String(empData.businessDate.getMonth() + 1).padStart(2, '0')}`;
          const summaryKey = `${employeeId}_${monthYear}`;
          const monthlySummary = monthlySummaryMapForCheck.get(summaryKey);

          let wasAbsent = false;
          if (monthlySummary && monthlySummary.totalAbsent > 0) {
            // Check actual absent records for this month
            const actualAbsentRecords = existingLogs.filter(log =>
              log.employeeId === employeeId &&
              log.status === 'absent' &&
              log.date &&
              log.date >= new Date(empData.businessDate.getFullYear(), empData.businessDate.getMonth(), 1) &&
              log.date < new Date(empData.businessDate.getFullYear(), empData.businessDate.getMonth() + 1, 1)
            ).length;

            if (monthlySummary.totalAbsent > actualAbsentRecords) {
              wasAbsent = true;
            }
          }

          // Create new log (following checkin pattern)
          logsToCreate.push({
            employeeId,
            date: empData.businessDate,
            checkin: checkinTimeForStorage,
            checkout: null,
            mode: mode || 'onsite',
            status: empData.status
          });

          counterUpdates.push({
            employeeId,
            businessDate: empData.businessDate,
            wasAbsent,
            status: empData.status
          });
        }

        // Add to late/half-day log creation lists
        if (empData.status === 'late') {
          lateLogsToCreate.push({
            empId: employeeId,
            date: empData.businessDate,
            scheduledTimeIn: empData.shiftStart,
            actualTimeIn: empData.actualTimeIn,
            minutesLate: empData.minutesLate,
            reason: null,
            actionTaken: 'Created',
            lateType: null,
            justified: null
          });
          markedLate++;
        } else if (empData.status === 'half_day') {
          halfDayLogsToCreate.push({
            empId: employeeId,
            date: empData.businessDate,
            scheduledTimeIn: empData.shiftStart,
            actualTimeIn: empData.actualTimeIn,
            minutesLate: empData.minutesLate,
            reason: null,
            actionTaken: 'Created',
            halfDayType: null,
            justified: null
          });
          markedHalfDay++;
        }

        markedPresent++;
      } catch (error) {
        console.error(`Error processing employee ${employeeId}:`, error);
        errors++;
      }
    }

    // OPTIMIZATION: Pre-fetch all attendance records and monthly summaries to avoid per-employee queries
    const allEmployeeIdsForUpdates = counterUpdates.map(u => u.employeeId);
    const uniqueEmployeeIds = Array.from(new Set(allEmployeeIdsForUpdates));

    const attendanceRecords = await this.prisma.attendance.findMany({
      where: { employeeId: { in: uniqueEmployeeIds } }
    });
    const attendanceMap = new Map(attendanceRecords.map(att => [att.employeeId, att]));

    // Get all unique month keys
    const uniqueMonthKeys = Array.from(new Set(counterUpdates.map(u => {
      const date = u.businessDate;
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    })));

    const monthlySummaries = await this.prisma.monthlyAttendanceSummary.findMany({
      where: {
        empId: { in: uniqueEmployeeIds },
        month: { in: uniqueMonthKeys }
      }
    });
    const monthlySummaryMap = new Map<string, typeof monthlySummaries[0]>();
    for (const summary of monthlySummaries) {
      const key = `${summary.empId}_${summary.month}`;
      monthlySummaryMap.set(key, summary);
    }

    // OPTIMIZATION: Process in batches to avoid transaction timeout
    // Group counter updates by employee ID for batching
    const batchSize = 15; // Process 15 employees per batch to avoid timeout
    const totalBatches = Math.ceil(counterUpdates.length / batchSize);

    console.log(`Processing ${counterUpdates.length} employees in ${totalBatches} batches of ${batchSize}`);

    for (let i = 0; i < counterUpdates.length; i += batchSize) {
      const batch = counterUpdates.slice(i, i + batchSize);
      const batchNumber = Math.floor(i / batchSize) + 1;

      // Get employee IDs in this batch
      const batchEmployeeIds = batch.map(update => update.employeeId);

      // Filter logs and updates for this batch
      const batchLogsToCreate = logsToCreate.filter(log => batchEmployeeIds.includes(log.employeeId));

      // Get the actual log IDs for this batch from existingLogs
      const batchLogIds = new Set<number>();
      for (const update of batch) {
        const empData = employeeDataMap.get(update.employeeId);
        if (empData) {
          // Find existing log using same logic as above
          let existingCheckin: typeof existingLogs[0] | undefined;
          if (!empData.night_shift) {
            const prevDate = new Date(empData.businessDate);
            prevDate.setDate(prevDate.getDate() - 1);
            const nextDate = new Date(empData.businessDate);
            nextDate.setDate(nextDate.getDate() + 1);
            existingCheckin = existingLogs.find(
              log => log.employeeId === update.employeeId &&
                log.date &&
                (log.date.getTime() === empData.businessDate.getTime() ||
                 log.date.getTime() === prevDate.getTime() ||
                 log.date.getTime() === nextDate.getTime())
            );
          } else {
            const logKey = `${update.employeeId}_${empData.businessDate.getTime()}`;
            existingCheckin = existingLogsMap.get(logKey);
          }
          if (existingCheckin) {
            batchLogIds.add(existingCheckin.id);
          }
        }
      }
      const batchLogsToUpdateFiltered = logsToUpdate.filter(log => batchLogIds.has(log.id));

      const batchLateLogsToCreate = lateLogsToCreate.filter(log => batchEmployeeIds.includes(log.empId));
      const batchHalfDayLogsToCreate = halfDayLogsToCreate.filter(log => batchEmployeeIds.includes(log.empId));

      try {
        await this.prisma.$transaction(async (tx) => {
          // Bulk create new attendance logs for this batch
          if (batchLogsToCreate.length > 0) {
            await tx.attendanceLog.createMany({
              data: batchLogsToCreate,
              skipDuplicates: true
            });
          }

          // Bulk update existing attendance logs for this batch
          if (batchLogsToUpdateFiltered.length > 0) {
            await Promise.all(
              batchLogsToUpdateFiltered.map(log =>
                tx.attendanceLog.update({
                  where: { id: log.id },
                  data: {
                    checkin: log.checkin,
                    status: log.status,
                    mode: log.mode,
                    updatedAt: new Date()
                  }
                })
              )
            );
          }

          // Bulk create late logs for this batch
          if (batchLateLogsToCreate.length > 0) {
            await tx.lateLog.createMany({
              data: batchLateLogsToCreate,
              skipDuplicates: true
            });
          }

          // Bulk create half-day logs for this batch
          if (batchHalfDayLogsToCreate.length > 0) {
            await tx.halfDayLog.createMany({
              data: batchHalfDayLogsToCreate,
              skipDuplicates: true
            });
          }

          // Update attendance counters for this batch (parallel execution)
          // Use pre-fetched data to avoid individual queries
          await Promise.all(
            batch.map(update =>
              Promise.all([
                this.updateMonthlyAttendanceForBulkMarkPresentOptimized(
                  tx,
                  update.employeeId,
                  update.businessDate,
                  update.wasAbsent,
                  update.status,
                  monthlySummaryMap
                ),
                this.updateAttendanceForBulkMarkPresentOptimized(
                  tx,
                  update.employeeId,
                  update.businessDate,
                  update.wasAbsent,
                  update.status,
                  attendanceMap
                )
              ])
            )
          );
        }, {
          timeout: 45000, // 45 seconds per batch
          maxWait: 10000
        });

        console.log(`Batch ${batchNumber}/${totalBatches} completed successfully`);
      } catch (batchError) {
        console.error(`Error in batch ${batchNumber}/${totalBatches}:`, batchError);
        errors += batch.length;
      }

      // Small delay between batches to prevent connection pool exhaustion
      if (i + batchSize < counterUpdates.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    console.log(`Bulk checkin operation completed. Marked: ${markedPresent} (${markedLate} late, ${markedHalfDay} half-day), Errors: ${errors}, Skipped: ${skipped}`);

    // Create a single HR log entry for the entire bulk operation
    // Format: "{count} employees - {reason}" or just "{count} employees" if no reason
    const description = reason
      ? `${markedPresent} employees - ${reason}`
      : `${markedPresent} employees`;

    await this.prisma.hRLog.create({
      data: {
        hrId: 1, // TODO: Get from authenticated user
        actionType: 'bulk_mark_present',
        affectedEmployeeId: null,
        description
      }
    });

    const employeeInfo = employee_ids ? ` for ${employee_ids.length} specified employee(s)` : '';
    const statusInfo = markedLate > 0 || markedHalfDay > 0 ? ` (${markedPresent - markedLate - markedHalfDay} present, ${markedLate} late, ${markedHalfDay} half-day)` : '';
    const message = `Bulk checkin completed${employeeInfo} for ${dateStr}${statusInfo}${reason ? ` - Reason: ${reason}` : ''}`;
    return { message, marked_present: markedPresent, errors, skipped };
  }

  /**
   * Bulk checkout employees - checks out all employees with active check-ins
   * Computes worked hours and updates status based on shift duration
   * If employee was initially marked as "absent", they remain "absent"
   * Otherwise, if worked_hours >= shift_time/2, marks as "half_day"
   * Returns worked hours in hh:mm:ss format
   */
  async bulkCheckoutEmployees(bulkCheckoutData: BulkCheckoutDto): Promise<{ message: string; checked_out: number; errors: number; skipped: number }> {
    const { date, employee_ids, reason, checkout, timezone, offset_minutes } = bulkCheckoutData;

    // Compute checkout time: use provided checkout timestamp or current time (following checkout pattern)
    let checkoutUtc: Date;
    if (checkout) {
      checkoutUtc = new Date(checkout);
      if (isNaN(checkoutUtc.getTime())) {
        throw new BadRequestException('Invalid checkout timestamp');
      }
    } else {
      checkoutUtc = new Date();
    }

    const effectiveOffsetMinutes = Number.isFinite(offset_minutes as any)
      ? Number(offset_minutes)
      : 300; // Default to PKT UTC+5

    // Determine business date: use provided date if available, otherwise calculate from checkout time (following checkout pattern)
    let businessDateLocal: Date;
    if (date) {
      // Use provided date
      const inputDate = new Date(date + 'T00:00:00');
      if (isNaN(inputDate.getTime())) {
        throw new BadRequestException('Invalid date format. Expected YYYY-MM-DD');
      }
      businessDateLocal = new Date(inputDate);
      businessDateLocal.setHours(0, 0, 0, 0);
    } else {
      // Calculate from checkout time
      const localDateStr = `${checkoutUtc.getUTCFullYear()}-${String(checkoutUtc.getUTCMonth() + 1).padStart(2, '0')}-${String(checkoutUtc.getUTCDate()).padStart(2, '0')}`;
      businessDateLocal = new Date(localDateStr);
    }

    // Use checkout time for storage (following checkout pattern)
    const checkoutTimeForStorage = checkoutUtc;

    // Build query to find attendance logs with checkin but no checkout
    // Check current date, previous day, and next day (following checkout pattern for night shifts)
    const prevDate = new Date(businessDateLocal);
    prevDate.setDate(prevDate.getDate() - 1);
    const nextDate = new Date(businessDateLocal);
    nextDate.setDate(nextDate.getDate() + 1);

    const attendanceWhere: any = {
      checkin: { not: null },
      checkout: null,
      OR: [
        { date: businessDateLocal },
        { date: prevDate },
        { date: nextDate }
      ]
    };

    if (employee_ids && employee_ids.length > 0) {
      const invalidIds = employee_ids.filter(id => !Number.isInteger(id) || id <= 0);
      if (invalidIds.length > 0) {
        throw new BadRequestException(`Invalid employee IDs: ${invalidIds.join(', ')}. All IDs must be positive integers.`);
      }
      attendanceWhere.employeeId = { in: employee_ids };
    }

    // Get attendance logs that need checkout
    const attendanceLogs = await this.prisma.attendanceLog.findMany({
      where: attendanceWhere,
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            shiftStart: true,
            shiftEnd: true
          }
        }
      }
    });

    if (attendanceLogs.length === 0) {
      const message = employee_ids && employee_ids.length > 0
        ? `No employees found with active check-ins for the provided employee IDs: ${employee_ids.join(', ')} on ${businessDateLocal.toISOString().split('T')[0]}`
        : `No employees found with active check-ins on ${businessDateLocal.toISOString().split('T')[0]}`;
      throw new NotFoundException(message);
    }

    console.log(`Bulk checkout: Processing ${attendanceLogs.length} employee(s) for date ${businessDateLocal.toISOString().split('T')[0]}`);

    let checkedOut = 0;
    let errors = 0;
    let skipped = 0;
    let statusUpdated = 0;

    // OPTIMIZATION: Pre-fetch all attendance records and monthly summaries to avoid per-employee queries
    const allEmployeeIds = attendanceLogs.map(log => log.employeeId);
    const uniqueEmployeeIds = Array.from(new Set(allEmployeeIds));

    const attendanceRecords = await this.prisma.attendance.findMany({
      where: { employeeId: { in: uniqueEmployeeIds } }
    });
    const attendanceMap = new Map(attendanceRecords.map(att => [att.employeeId, att]));

    // Get all unique month keys
    const uniqueMonthKeys = Array.from(new Set(attendanceLogs.map(log => {
      const date = log.date || businessDateLocal;
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    })));

    const monthlySummaries = await this.prisma.monthlyAttendanceSummary.findMany({
      where: {
        empId: { in: uniqueEmployeeIds },
        month: { in: uniqueMonthKeys }
      }
    });
    const monthlySummaryMap = new Map<string, typeof monthlySummaries[0]>();
    for (const summary of monthlySummaries) {
      const key = `${summary.empId}_${summary.month}`;
      monthlySummaryMap.set(key, summary);
    }

    // Reduced batch size to prevent transaction timeout and API failures
    // Smaller batches = more batches = better reliability
    const batchSize = 10; // Reduced from 20 to 10 for better reliability
    const dateStr = businessDateLocal.toISOString().split('T')[0];
    console.log(`Processing ${attendanceLogs.length} employees in batches of ${batchSize} (${Math.ceil(attendanceLogs.length / batchSize)} total batches)`);

    for (let i = 0; i < attendanceLogs.length; i += batchSize) {
      const batch = attendanceLogs.slice(i, i + batchSize);
      const batchNumber = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(attendanceLogs.length / batchSize);
      console.log(`Processing batch ${batchNumber}/${totalBatches} with ${batch.length} employees`);

      try {
        await this.prisma.$transaction(async (tx) => {
          for (const log of batch) {
            try {
              const employee = log.employee;
              const initialStatus = log.status as 'present' | 'late' | 'half_day' | 'absent' | null;
              const wasAbsent = initialStatus === 'absent';

              // Get employee's shift times
              const shiftStart = employee.shiftStart || '09:00';
              const shiftEnd = employee.shiftEnd || '17:00';

              // Parse shift times
              const shiftStartParts = shiftStart.split(':');
              const shiftEndParts = shiftEnd.split(':');
              const shiftStartHour = parseInt(shiftStartParts[0], 10);
              const shiftStartMinute = shiftStartParts[1] ? parseInt(shiftStartParts[1], 10) : 0;
              const shiftEndHour = parseInt(shiftEndParts[0], 10);
              const shiftEndMinute = shiftEndParts[1] ? parseInt(shiftEndParts[1], 10) : 0;

              // Calculate shift duration in hours
              // Use the log's date for shift calculation (following checkout pattern)
              const logDate = log.date || businessDateLocal;
              const shiftStartDate = new Date(logDate);
              shiftStartDate.setUTCHours(shiftStartHour, shiftStartMinute, 0, 0);

              const shiftEndDate = new Date(logDate);
              shiftEndDate.setUTCHours(shiftEndHour, shiftEndMinute, 0, 0);

              // Handle night shifts (crossing midnight)
              if (shiftEndHour < shiftStartHour || (shiftEndHour === shiftStartHour && shiftEndMinute < shiftStartMinute)) {
                shiftEndDate.setDate(shiftEndDate.getDate() + 1);
              }

              const shiftDurationMs = shiftEndDate.getTime() - shiftStartDate.getTime();
              const shiftDurationHours = shiftDurationMs / (1000 * 60 * 60);

              // Calculate worked hours from checkin to checkout
              const checkinTime = log.checkin!;
              const workedMs = checkoutTimeForStorage.getTime() - checkinTime.getTime();
              const workedHours = workedMs / (1000 * 60 * 60);

              // Format worked hours as hh:mm:ss
              const totalSeconds = Math.floor(workedMs / 1000);
              const hours = Math.floor(totalSeconds / 3600);
              const minutes = Math.floor((totalSeconds % 3600) / 60);
              const seconds = totalSeconds % 60;
              const workedHoursFormatted = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

              // Determine new status
              let newStatus: 'present' | 'late' | 'half_day' | 'absent' = initialStatus || 'present';

              if (wasAbsent) {
                // If initially absent, remain absent regardless of worked hours
                newStatus = 'absent';
              } else {
                // If worked_hours >= shift_time/2, mark as half_day
                if (workedHours >= shiftDurationHours / 2) {
                  newStatus = 'half_day';
                  if (initialStatus !== 'half_day') {
                    statusUpdated++;
                  }
                } else {
                  // If worked_hours < shift_time/2
                  if (initialStatus === 'present' || initialStatus === null) {
                    // If initial status was "present", mark as absent
                    newStatus = 'absent';
                    statusUpdated++;
                  } else {
                    // If initial status was "late" or "half_day", keep current status
                    newStatus = initialStatus;
                  }
                }
              }

              // Update attendance log
              await tx.attendanceLog.update({
                where: { id: log.id },
                data: {
                  checkout: checkoutTimeForStorage,
                  status: newStatus,
                  updatedAt: new Date()
                }
              });

              // Update attendance counters if status changed
              if (newStatus !== initialStatus && !wasAbsent) {
                // Status changed - need to update counters
                const logDate = log.date || businessDateLocal;
                const monthKey = `${logDate.getFullYear()}-${String(logDate.getMonth() + 1).padStart(2, '0')}`;
                const summaryKey = `${employee.id}_${monthKey}`;

                // Update attendance record using pre-fetched data
                let attendance = attendanceMap.get(employee.id);
                if (!attendance) {
                  attendance = await tx.attendance.create({
                    data: {
                      employeeId: employee.id,
                      presentDays: 0,
                      absentDays: 0,
                      lateDays: 0,
                      leaveDays: 0,
                      remoteDays: 0,
                      quarterlyLeaves: 0,
                      monthlyLates: 0,
                      halfDays: 0
                    }
                  });
                  attendanceMap.set(employee.id, attendance);
                }

                // Calculate counter changes
                const updateData: any = {};

                if (newStatus === 'half_day') {
                  // Changed to half_day: increment halfDays, decrement presentDays if was present
                  if (initialStatus === 'present') {
                    updateData.presentDays = { decrement: 1 };
                  }
                  updateData.halfDays = { increment: 1 };
                } else if (newStatus === 'absent') {
                  // Changed to absent: decrement presentDays, increment absentDays
                  if (initialStatus === 'present') {
                    updateData.presentDays = { decrement: 1 };
                  }
                  updateData.absentDays = { increment: 1 };
                }

                if (Object.keys(updateData).length > 0) {
                  await tx.attendance.update({
                    where: { id: attendance.id },
                    data: updateData
                  });
                }

                // Update monthly summary using pre-fetched data
                let monthlySummary = monthlySummaryMap.get(summaryKey);
                if (!monthlySummary) {
                  monthlySummary = await tx.monthlyAttendanceSummary.create({
                    data: {
                      empId: employee.id,
                      month: monthKey,
                      totalPresent: 0,
                      totalAbsent: 0,
                      totalLeaveDays: 0,
                      totalLateDays: 0,
                      totalHalfDays: 0,
                      totalRemoteDays: 0
                    }
                  });
                  monthlySummaryMap.set(summaryKey, monthlySummary);
                }

                const monthlyUpdateData: any = {};

                if (newStatus === 'half_day') {
                  if (initialStatus === 'present') {
                    monthlyUpdateData.totalPresent = { decrement: 1 };
                  }
                  monthlyUpdateData.totalHalfDays = { increment: 1 };
                } else if (newStatus === 'absent') {
                  if (initialStatus === 'present') {
                    monthlyUpdateData.totalPresent = { decrement: 1 };
                  }
                  monthlyUpdateData.totalAbsent = { increment: 1 };
                }

                if (Object.keys(monthlyUpdateData).length > 0) {
                  await tx.monthlyAttendanceSummary.update({
                    where: { id: monthlySummary.id },
                    data: monthlyUpdateData
                  });
                }

                console.log(`Employee ${employee.id}: Status updated from ${initialStatus} to ${newStatus} based on worked hours (${workedHoursFormatted})`);
              }

              checkedOut++;
            } catch (error) {
              console.error(`Error processing checkout for employee ${log.employeeId} (${log.employee.firstName} ${log.employee.lastName}):`, error);
              errors++;
            }
          }
        }, {
          timeout: 30000, // 30 seconds timeout per batch
          maxWait: 8000 // 8 seconds max wait (reduced from 10s)
        });
      } catch (batchError) {
        console.error(`Error processing batch ${batchNumber}/${totalBatches}:`, batchError);
        // Continue with next batch even if this one fails
        errors += batch.length; // Count all employees in failed batch as errors
      }

      // Add delay between batches to reduce database load and prevent connection pool exhaustion
      if (i + batchSize < attendanceLogs.length) {
        await new Promise(resolve => setTimeout(resolve, 200)); // Increased from 100ms to 200ms
      }
    }

    console.log(`Bulk checkout operation completed. Checked out: ${checkedOut}, Status updated: ${statusUpdated}, Errors: ${errors}, Skipped: ${skipped}`);

    // Create HR log entry
    const description = reason
      ? `${checkedOut} employees checked out - ${reason}`
      : `${checkedOut} employees checked out`;

    await this.prisma.hRLog.create({
      data: {
        hrId: 1, // TODO: Get from authenticated user
        actionType: 'bulk_checkout',
        affectedEmployeeId: null,
        description
      }
    });

    const employeeInfo = employee_ids ? ` for ${employee_ids.length} specified employee(s)` : '';
    const message = `Bulk checkout completed${employeeInfo} for ${dateStr}${reason ? ` - Reason: ${reason}` : ''}`;
    return { message, checked_out: checkedOut, errors, skipped };
  }


  /**
   * Optimized version that uses pre-fetched attendance records
   */
  private async updateAttendanceForBulkMarkPresentOptimized(
    tx: any,
    employeeId: number,
    date: Date,
    wasAbsent: boolean = false,
    status: 'present' | 'late' | 'half_day' | 'absent' = 'present',
    attendanceMap: Map<number, any>
  ): Promise<void> {
    // Use pre-fetched attendance record
    let attendance = attendanceMap.get(employeeId);

    if (!attendance) {
      // Create new attendance record
      attendance = await tx.attendance.create({
        data: {
          employeeId,
          presentDays: 0,
          absentDays: 0,
          lateDays: 0,
          leaveDays: 0,
          remoteDays: 0,
          quarterlyLeaves: 0,
          monthlyLates: 0,
          halfDays: 0
        }
      });
      // Update map for future use in same transaction
      attendanceMap.set(employeeId, attendance);
    }

    // Update counters based on status
    const updateData: any = {};

    // Handle status-specific counters
    if (status === 'absent') {
      updateData.absentDays = (attendance.absentDays || 0) + 1;
    } else {
      updateData.presentDays = (attendance.presentDays || 0) + 1;

      if (status === 'late') {
        updateData.lateDays = (attendance.lateDays || 0) + 1;
        if ((attendance.monthlyLates ?? 0) > 0) {
          updateData.monthlyLates = Math.max(0, (attendance.monthlyLates ?? 0) - 1);
        }
      } else if (status === 'half_day') {
        updateData.halfDays = (attendance.halfDays || 0) + 1;
      }

      if (wasAbsent && attendance.absentDays && attendance.absentDays > 0) {
        updateData.absentDays = Math.max(0, attendance.absentDays - 1);
      }
    }

    await tx.attendance.update({
      where: { id: attendance.id },
      data: updateData
    });
  }

  /**
   * Optimized version that uses pre-fetched monthly summaries
   */
  private async updateMonthlyAttendanceForBulkMarkPresentOptimized(
    tx: any,
    employeeId: number,
    date: Date,
    wasAbsent: boolean = false,
    status: 'present' | 'late' | 'half_day' | 'absent' = 'present',
    monthlySummaryMap: Map<string, any>
  ): Promise<void> {
    const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const summaryKey = `${employeeId}_${monthYear}`;

    // Use pre-fetched monthly summary
    let monthlySummary = monthlySummaryMap.get(summaryKey);

    if (!monthlySummary) {
      // Create new monthly summary
      monthlySummary = await tx.monthlyAttendanceSummary.create({
        data: {
          empId: employeeId,
          month: monthYear,
          totalPresent: 0,
          totalAbsent: 0,
          totalLeaveDays: 0,
          totalLateDays: 0,
          totalHalfDays: 0,
          totalRemoteDays: 0
        }
      });
      // Update map for future use in same transaction
      monthlySummaryMap.set(summaryKey, monthlySummary);
    }

    // Update monthly summary based on status
    const updateData: any = {};

    if (status === 'absent') {
      updateData.totalAbsent = (monthlySummary.totalAbsent || 0) + 1;
    } else {
      updateData.totalPresent = (monthlySummary.totalPresent || 0) + 1;

      if (status === 'late') {
        updateData.totalLateDays = (monthlySummary.totalLateDays || 0) + 1;
      } else if (status === 'half_day') {
        updateData.totalHalfDays = (monthlySummary.totalHalfDays || 0) + 1;
      }

      if (wasAbsent && monthlySummary.totalAbsent && monthlySummary.totalAbsent > 0) {
        updateData.totalAbsent = Math.max(0, monthlySummary.totalAbsent - 1);
      }
    }

    await tx.monthlyAttendanceSummary.update({
      where: { id: monthlySummary.id },
      data: updateData
    });
  }


  // Helper method to update attendance counters for status changes
  private async updateAttendanceCountersForStatusChange(
    tx: any,
    employeeId: number,
    oldStatus: string,
    newStatus: string
  ): Promise<void> {
    try {
      // Find existing attendance record
      const attendance = await tx.attendance.findFirst({
        where: { employeeId: employeeId }
      });

      if (!attendance) {
        console.warn(`No attendance record found for employee ${employeeId}`);
        return;
      }

      const updateData: any = {};

      // Decrease old status counter
      switch (oldStatus) {
        case 'present':
          updateData.presentDays = { decrement: 1 };
          break;
        case 'late':
          updateData.lateDays = { decrement: 1 };
          updateData.monthlyLates = { decrement: 1 };
          break;
        case 'half_day':
          updateData.halfDays = { decrement: 1 };
          updateData.presentDays = { decrement: 1 }; // half_day counts as present
          break;
        case 'absent':
          updateData.absentDays = { decrement: 1 };
          break;
      }

      // Increase new status counter
      switch (newStatus) {
        case 'present':
          updateData.presentDays = { increment: 1 };
          break;
        case 'late':
          updateData.lateDays = { increment: 1 };
          updateData.monthlyLates = { increment: 1 };
          break;
        case 'half_day':
          updateData.halfDays = { increment: 1 };
          updateData.presentDays = { increment: 1 }; // half_day counts as present
          break;
        case 'absent':
          updateData.absentDays = { increment: 1 };
          break;
      }

      // Update attendance record
      await tx.attendance.update({
        where: { id: attendance.id },
        data: updateData
      });

      console.log(`Updated attendance counters for employee ${employeeId}: ${oldStatus} -> ${newStatus}`);
    } catch (error) {
      console.error('Error updating attendance counters:', error);
      throw error;
    }
  }

  // Helper method to update monthly attendance summary for status changes
  private async updateMonthlyAttendanceSummaryForStatusChange(
    tx: any,
    employeeId: number,
    logDate: Date,
    oldStatus: string,
    newStatus: string
  ): Promise<void> {
    try {
      const month = logDate.toISOString().slice(0, 7); // YYYY-MM format

      // Find existing monthly summary
      let monthlySummary = await tx.monthlyAttendanceSummary.findFirst({
        where: {
          empId: employeeId,
          month: month
        }
      });

      if (!monthlySummary) {
        // Create new monthly summary if it doesn't exist
        monthlySummary = await tx.monthlyAttendanceSummary.create({
          data: {
            empId: employeeId,
            month: month,
            totalPresent: 0,
            totalAbsent: 0,
            totalLeaveDays: 0,
            totalLateDays: 0,
            totalHalfDays: 0,
            totalRemoteDays: 0,
            generatedOn: new Date()
          }
        });
      }

      const updateData: any = {};

      // Decrease old status counter
      switch (oldStatus) {
        case 'present':
          updateData.totalPresent = { decrement: 1 };
          break;
        case 'late':
          updateData.totalLateDays = { decrement: 1 };
          break;
        case 'half_day':
          updateData.totalHalfDays = { decrement: 1 };
          updateData.totalPresent = { decrement: 1 }; // half_day counts as present
          break;
        case 'absent':
          updateData.totalAbsent = { decrement: 1 };
          break;
      }

      // Increase new status counter
      switch (newStatus) {
        case 'present':
          updateData.totalPresent = { increment: 1 };
          break;
        case 'late':
          updateData.totalLateDays = { increment: 1 };
          break;
        case 'half_day':
          updateData.totalHalfDays = { increment: 1 };
          updateData.totalPresent = { increment: 1 }; // half_day counts as present
          break;
        case 'absent':
          updateData.totalAbsent = { increment: 1 };
          break;
      }

      // Update monthly summary
      await tx.monthlyAttendanceSummary.update({
        where: { id: monthlySummary.id },
        data: updateData
      });

      console.log(`Updated monthly summary for employee ${employeeId} in ${month}: ${oldStatus} -> ${newStatus}`);
    } catch (error) {
      console.error('Error updating monthly attendance summary:', error);
      throw error;
    }
  }

  // Helper method to create late log for status change
  private async createLateLogForStatusChange(
    tx: any,
    employeeId: number,
    logDate: Date,
    reason: string,
    reviewerId?: number
  ): Promise<void> {
    try {
      // Get employee shift times
      const employee = await tx.employee.findUnique({
        where: { id: employeeId },
        select: { shiftStart: true, shiftEnd: true }
      });

      if (!employee) {
        throw new BadRequestException('Employee not found');
      }

      // Calculate minutes late (simplified - you might want to enhance this)
      const scheduledTime = employee.shiftStart || '09:00';
      const actualTime = '10:00'; // Default or calculate from checkin time
      const minutesLate = 60; // Default or calculate

      await tx.lateLog.create({
        data: {
          empId: employeeId,
          date: logDate,
          scheduledTimeIn: scheduledTime,
          actualTimeIn: actualTime,
          minutesLate: minutesLate,
          reason: reason,
          actionTaken: 'Completed',
          reviewedBy: reviewerId || null,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });

      console.log(` Created late log for employee ${employeeId} on ${logDate.toISOString().split('T')[0]}`);
    } catch (error) {
      console.error('Error creating late log:', error);
      throw error;
    }
  }

  // Helper method to create half-day log for status change
  private async createHalfDayLogForStatusChange(
    tx: any,
    employeeId: number,
    logDate: Date,
    reason: string,
    reviewerId?: number
  ): Promise<void> {
    try {
      // Get employee shift times
      const employee = await tx.employee.findUnique({
        where: { id: employeeId },
        select: { shiftStart: true, shiftEnd: true }
      });

      if (!employee) {
        throw new BadRequestException('Employee not found');
      }

      // Calculate minutes late (simplified - you might want to enhance this)
      const scheduledTime = employee.shiftStart || '09:00';
      const actualTime = '10:30'; // Default or calculate from checkin time
      const minutesLate = 90; // Default or calculate

      await tx.halfDayLog.create({
        data: {
          empId: employeeId,
          date: logDate,
          scheduledTimeIn: scheduledTime,
          actualTimeIn: actualTime,
          minutesLate: minutesLate,
          reason: reason,
          actionTaken: 'Completed',
          reviewedBy: reviewerId || null,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });

      console.log(`Created half-day log for employee ${employeeId} on ${logDate.toISOString().split('T')[0]}`);
    } catch (error) {
      console.error('Error creating half-day log:', error);
      throw error;
    }
  }
}
