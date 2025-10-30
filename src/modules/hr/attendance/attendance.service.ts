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
import { BulkMarkPresentDto } from './dto/bulk-mark-present.dto';
import { ExportLeaveLogsDto } from './dto/export-leave-logs.dto';
import { LeaveLogsStatsDto, LeaveLogsStatsResponseDto, PeriodStatsDto, EmployeeLeaveStatsDto, LeaveTypeStatsDto, StatsPeriod } from './dto/leave-logs-stats.dto';
import { ExportLateLogsDto } from './dto/export-late-logs.dto';
import { LateLogsStatsDto, LateLogsStatsResponseDto, EmployeeLateStatsDto, ReasonStatsDto, PeriodStatsDto as LatePeriodStatsDto } from './dto/late-logs-stats.dto';
import { ExportHalfDayLogsDto } from './dto/export-half-day-logs.dto';
import { HalfDayLogsStatsDto, HalfDayLogsStatsResponseDto, EmployeeHalfDayStatsDto, ReasonStatsDto as HalfDayReasonStatsDto, PeriodStatsDto as HalfDayPeriodStatsDto } from './dto/half-day-logs-stats.dto';

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
      console.log('=== CHECKIN DEBUG START ===');
      console.log('Input data:', checkinData);
      
      const { employee_id, date, checkin, mode, timezone, offset_minutes } = checkinData;

      // Ensure employee_id is a number
      const employeeId = Number(employee_id);

      // Validate employee_id
      if (isNaN(employeeId) || employeeId <= 0) {
        throw new BadRequestException('Invalid employee ID');
      }

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

      // Compute local time using provided offset or default +300 (Asia/Karachi)
      const checkinUtc = new Date(checkin);
      if (isNaN(checkinUtc.getTime())) {
        throw new BadRequestException('Invalid checkin timestamp');
      }

      const effectiveOffsetMinutes = Number.isFinite(offset_minutes as any)
        ? Number(offset_minutes)
        : 300; // default PKT UTC+5

      const checkinLocal = new Date(checkinUtc.getTime() + effectiveOffsetMinutes * 60 * 1000);

      // Derive local business date (YYYY-MM-DD) from local time
      const localDateStr = `${checkinLocal.getUTCFullYear()}-${String(checkinLocal.getUTCMonth() + 1).padStart(2, '0')}-${String(checkinLocal.getUTCDate()).padStart(2, '0')}`;
      const businessDateLocal = new Date(localDateStr);

      // Check if already checked in for this local business date
      const existingCheckin = await this.prisma.attendanceLog.findFirst({
        where: {
          employeeId,
          date: businessDateLocal
        }
      });

      if (existingCheckin && existingCheckin.checkin) {
        throw new BadRequestException('Employee already checked in for this date');
      }

      // Use computed local time for storage and calculations
      const checkinTimeForStorage = checkinLocal;
      const checkinTimeForCalculation = checkinLocal;
      const checkinDatePKT = businessDateLocal; // local business date

      // Get employee's shift times (default to 9:00 AM - 5:00 PM if not set)
      const shiftStart = employee.shiftStart || '09:00';
      const shiftEnd = employee.shiftEnd || '17:00';
      console.log('Employee shift times:', { shiftStart, shiftEnd });
      
      // Handle shift times that might be stored as just hours (e.g., '21' instead of '21:00')
      const shiftStartParts = shiftStart.split(':');
      const shiftEndParts = shiftEnd.split(':');
      
      const shiftStartHour = parseInt(shiftStartParts[0], 10);
      const shiftStartMinute = shiftStartParts[1] ? parseInt(shiftStartParts[1], 10) : 0;
      
      const shiftEndHour = parseInt(shiftEndParts[0], 10);
      const shiftEndMinute = shiftEndParts[1] ? parseInt(shiftEndParts[1], 10) : 0;
      
      console.log('Parsed shift times:', { shiftStartHour, shiftStartMinute, shiftEndHour, shiftEndMinute });

      // Create expected shift start in the same local timeline (use UTC setters on businessDateLocal)
      console.log('Creating expected shift start...');
      const expectedShiftStart = new Date(checkinDatePKT);
      expectedShiftStart.setUTCHours(shiftStartHour, shiftStartMinute, 0, 0);
      console.log('Expected shift start created:', expectedShiftStart);

      console.log('Creating expected shift end...');
      const expectedShiftEnd = new Date(checkinDatePKT);
      expectedShiftEnd.setUTCHours(shiftEndHour, shiftEndMinute, 0, 0);
      console.log('Expected shift end created:', expectedShiftEnd);

      // Calculate minutes late from shift start using local calculation time
      let minutesLate = Math.floor((checkinTimeForCalculation.getTime() - expectedShiftStart.getTime()) / (1000 * 60));
      
      // Handle night shifts that cross midnight
      // If shift end is before shift start (e.g., 21:00 to 05:00), it's a night shift
      if (shiftEndHour < shiftStartHour) {
        // If check-in time is before shift start (e.g., 00:26 vs 21:00), 
        // it means employee is checking in late for the previous day's shift
        if (minutesLate < 0) {
          // Add 24 hours to get the correct late time
          minutesLate = minutesLate + (24 * 60);
          console.log('Night shift detected - adjusted minutes late:', minutesLate);
        }
      }

      // If minutesLate is negative (early/on-time), normalize to 0 to avoid misclassification
      if (minutesLate < 0) {
        minutesLate = 0;
      }
      
      // Debug logging
      console.log(`Check-in Debug Info:`);
      console.log(`- Input UTC time: ${checkin}`);
      console.log(`- Local time (offset ${effectiveOffsetMinutes}): ${checkinTimeForCalculation.toISOString()}`);
      console.log(`- Local business date: ${checkinDatePKT.toISOString().split('T')[0]}`);
      console.log(`- Shift start: ${expectedShiftStart.toISOString()}`);
      console.log(`- Minutes late: ${minutesLate}`);

      // Fetch company policy values from companies table
      const company = await this.prisma.company.findFirst();
      if (!company) {
        throw new BadRequestException('Company policy not found');
      }

      // Use dynamic values from companies table
      const lateTime = company.lateTime || 30; // Default to 30 minutes if not set
      const halfTime = company.halfTime || 90; // Default to 90 minutes if not set
      const absentTime = company.absentTime || 180; // Default to 180 minutes if not set

      // Determine status based on dynamic late policy rules
      let status: 'present' | 'late' | 'half_day' | 'absent' = 'present';
      let lateDetails: { minutes_late: number; requires_reason: boolean } | null = null;

      if (minutesLate > 0) {
        // Dynamic policy rules based on companies table:
        // 0 to lateTime: present
        // lateTime+1 to halfTime: late
        // halfTime+1 to absentTime: half-day
        // absentTime+1 onwards: absent

        if (minutesLate <= lateTime) {
          // Within late time limit: present
          status = 'present';
        } else if (minutesLate > lateTime && minutesLate <= halfTime) {
          // Exceeds late time but within half time: late
          status = 'late';
          lateDetails = {
            minutes_late: minutesLate,
            requires_reason: true
          };
        } else if (minutesLate > halfTime && minutesLate <= absentTime) {
          // Exceeds half time but within absent time: half-day
          status = 'half_day';
          lateDetails = {
            minutes_late: minutesLate,
            requires_reason: true
          };
        } else {
          // Exceeds absent time: absent
          status = 'absent';
          lateDetails = {
            minutes_late: minutesLate,
            requires_reason: true
          };
        }
      } else {
        // Explicitly set present when on-time or early
        status = 'present';
        lateDetails = null;
      }

      // Create or update attendance log using the local timezone-normalized time for storage
      const attendanceLog = await this.prisma.attendanceLog.upsert({
        where: {
          id: existingCheckin?.id || 0
        },
        update: {
          checkin: checkinTimeForStorage,
          mode: mode || null,
          status,
          updatedAt: new Date()
        },
        create: {
          employeeId,
          date: checkinDatePKT,
          checkin: checkinTimeForStorage,
          mode: mode || null,
          status
        }
      });

      // Update monthly attendance summary
      await this.updateMonthlyAttendanceSummary(employeeId, checkinDatePKT, status);

      // Update base attendance table (lifetime records)
      await this.updateBaseAttendance(employeeId, status);

      // Automatically create late log ONLY if employee is late (not half-day or absent)
      if (status === 'late') {
        // Parse checkin time to get actual time in format "HH:MM"
        const checkinTimeString = checkin.split('T')[1]; // "HH:MM:SS.sssZ"
        const timeParts = checkinTimeString.split(':');
        const hours = parseInt(timeParts[0], 10);
        const minutes = parseInt(timeParts[1], 10);
        const actualTimeIn = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

        // Always create a new late log entry (maintains log history)
        await this.prisma.lateLog.create({
          data: {
            empId: employeeId,
            date: checkinDatePKT, // Use the PKT date (which might be next day)
            scheduledTimeIn: shiftStart,
            actualTimeIn: actualTimeIn,
            minutesLate: minutesLate,
            reason: null, // Will be filled when employee submits reason
            actionTaken: 'Created', // Initial status when check-in creates late log
            lateType: null, // Will be set by HR
            justified: null // Will be set by HR
          }
        });
      }

      // Automatically create half-day log if employee is marked as half-day
      if (status === 'half_day') {
        // Parse checkin time to get actual time in format "HH:MM"
        const checkinTimeString = checkin.split('T')[1]; // "HH:MM:SS.sssZ"
        const timeParts = checkinTimeString.split(':');
        const hours = parseInt(timeParts[0], 10);
        const minutes = parseInt(timeParts[1], 10);
        const actualTimeIn = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

        // Always create a new half-day log entry (maintains log history)
        await this.prisma.halfDayLog.create({
          data: {
            empId: employeeId,
            date: checkinDatePKT, // Use the PKT date (which might be next day)
            scheduledTimeIn: shiftStart,
            actualTimeIn: actualTimeIn,
            minutesLate: minutesLate,
            reason: null, // Will be filled when employee submits reason
            actionTaken: 'Created', // Initial status when check-in creates half-day log
            halfDayType: null, // Will be set by HR
            justified: null // Will be set by HR
          }
        });
      }

      return {
        id: attendanceLog.id,
        employee_id: attendanceLog.employeeId,
        date: attendanceLog.date?.toISOString().split('T')[0] || null,
        checkin: attendanceLog.checkin?.toISOString() || null,
        checkin_local: checkinTimeForCalculation?.toISOString() || null,
        mode: attendanceLog.mode,
        status: attendanceLog.status as 'present' | 'late' | 'half_day' | 'absent' | null,
        late_details: lateDetails,
        timezone: timezone || 'Asia/Karachi',
        offset_minutes: effectiveOffsetMinutes,
        local_date: localDateStr,
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

      const checkoutLocal = new Date(checkoutUtc.getTime() + effectiveOffsetMinutes * 60 * 1000);
      const localDateStr = `${checkoutLocal.getUTCFullYear()}-${String(checkoutLocal.getUTCMonth() + 1).padStart(2, '0')}-${String(checkoutLocal.getUTCDate()).padStart(2, '0')}`;
      const businessDateLocal = new Date(localDateStr);

      // Check if employee has checked in for this local business date
      const existingAttendance = await this.prisma.attendanceLog.findFirst({
        where: {
          employeeId,
          date: businessDateLocal
        }
      });

      if (!existingAttendance || !existingAttendance.checkin) {
        throw new BadRequestException('Employee must check in before checking out');
      }

      if (existingAttendance.checkout) {
        throw new BadRequestException('Employee already checked out for this date');
      }

      // Use local time for storage
      const checkoutTimeForStorage = checkoutLocal;

      // Calculate total hours worked using the stored times
      const checkinTime = existingAttendance.checkin;
      const totalMilliseconds = checkoutTimeForStorage.getTime() - checkinTime.getTime();
      const totalHoursWorked = Math.round((totalMilliseconds / (1000 * 60 * 60)) * 100) / 100; // Round to 2 decimal places

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
        checkout_local: checkoutLocal.toISOString(),
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

  private async updateBaseAttendance(
    employeeId: number,
    status: 'present' | 'late' | 'half_day' | 'absent'
  ): Promise<void> {
    try {
      // Find existing attendance record or create new one
      let attendance = await this.prisma.attendance.findFirst({
        where: {
          employeeId: employeeId
        }
      });

      if (!attendance) {
        // Create new attendance record for the employee
        attendance = await this.prisma.attendance.create({
          data: {
            employeeId: employeeId,
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
      } else {
        // Fix NULL values by setting them to 0 if they're null
        const needsUpdate = attendance.presentDays === null ||
          attendance.absentDays === null ||
          attendance.lateDays === null ||
          attendance.halfDays === null;

        if (needsUpdate) {
          attendance = await this.prisma.attendance.update({
            where: { id: attendance.id },
            data: {
              presentDays: attendance.presentDays ?? 0,
              absentDays: attendance.absentDays ?? 0,
              lateDays: attendance.lateDays ?? 0,
              leaveDays: attendance.leaveDays ?? 0,
              remoteDays: attendance.remoteDays ?? 0,
              quarterlyLeaves: attendance.quarterlyLeaves ?? 0,
              monthlyLates: attendance.monthlyLates ?? 0,
              halfDays: attendance.halfDays ?? 0
            }
          });
        }
      }

      // Update counters based on status
      const updateData: any = {};

      switch (status) {
        case 'present':
          updateData.presentDays = { increment: 1 };
          break;
        case 'late':
          updateData.presentDays = { increment: 1 };
          updateData.lateDays = { increment: 1 };
          if ((attendance.monthlyLates ?? 0) > 0) {
            updateData.monthlyLates = { decrement: 1 }; // Decrement monthly lates when employee is late
          }
          break;
        case 'half_day':
          updateData.presentDays = { increment: 1 };
          updateData.halfDays = { increment: 1 };
          break;
        case 'absent':
          updateData.absentDays = { increment: 1 };
          break;
      }

      // Update the attendance record
      await this.prisma.attendance.update({
        where: { id: attendance.id },
        data: updateData
      });

    } catch (error) {
      console.error('Error updating base attendance:', error);
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

  async submitLateReason(lateData: SubmitLateReasonDto): Promise<LateLogResponseDto> {
    try {
      const { emp_id, date, scheduled_time_in, actual_time_in, minutes_late, reason } = lateData;

      // Check if employee exists
      const employee = await this.prisma.employee.findUnique({
        where: { id: emp_id }
      });

      if (!employee) {
        throw new BadRequestException('Employee not found');
      }

      // Find existing late log created by check-in for this employee and date
      const existingLateLog = await this.prisma.lateLog.findFirst({
        where: {
          empId: emp_id,
          date: new Date(date),
          actionTaken: 'Created' // Only update logs created by check-in
        },
        orderBy: {
          createdAt: 'desc' // Get the most recent one
        }
      });

      if (!existingLateLog) {
        throw new BadRequestException('No late log found for this employee and date. Please check-in first.');
      }

      // Update the existing late log with reason and change status to Pending
      const lateLog = await this.prisma.lateLog.update({
        where: { id: existingLateLog.id },
        data: {
          reason: reason,
          actionTaken: 'Pending', // Status when employee submits reason
          lateType: null, // Keep null, will be set by HR
          justified: null, // Keep null, will be set by HR
          updatedAt: new Date()
        }
      });

      return {
        late_log_id: lateLog.id,
        emp_id: lateLog.empId,
        date: lateLog.date.toISOString().split('T')[0],
        scheduled_time_in: lateLog.scheduledTimeIn,
        actual_time_in: lateLog.actualTimeIn,
        minutes_late: lateLog.minutesLate,
        reason: lateLog.reason || '',
        justified: lateLog.justified || false,
        late_type: lateLog.lateType || 'unpaid',
        action_taken: lateLog.actionTaken,
        reviewed_by: lateLog.reviewedBy,
        created_at: lateLog.createdAt.toISOString(),
        updated_at: lateLog.updatedAt.toISOString()
      };
    } catch (error) {
      console.error('Error in submitLateReason:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(`Failed to submit late reason: ${error.message}`);
    }
  }

  async processLateAction(lateLogId: number, action: 'Pending' | 'Completed', reviewerId: number, lateType?: 'paid' | 'unpaid'): Promise<LateLogResponseDto> {
    try {
      // Find the late log
      const lateLog = await this.prisma.lateLog.findUnique({
        where: { id: lateLogId }
      });

      if (!lateLog) {
        throw new BadRequestException('Late log not found');
      }

      // Update the late log with the action
      const updatedLateLog = await this.prisma.lateLog.update({
        where: { id: lateLogId },
        data: {
          actionTaken: action,
          lateType: lateType || null, // Let HR set this
          justified: action === 'Completed' ? (lateType === 'paid') : null, // Let HR set this
          reviewedBy: reviewerId,
          updatedAt: new Date()
        }
      });

      let attendanceUpdates: { late_days: number; monthly_lates: number; } | undefined = undefined;

      // If completed and marked as paid, update attendance records
      if (action === 'Completed' && lateType === 'paid') {
        // Find the attendance record for this employee
        const attendance = await this.prisma.attendance.findFirst({
          where: { employeeId: lateLog.empId }
        });

        if (attendance) {
          // Check if late_days is greater than 0 before decrementing
          const currentLateDays = attendance.lateDays || 0;
          const newLateDays = Math.max(0, currentLateDays - 1); // Prevent going below 0

          // Update attendance with safe decrement
          const updatedAttendance = await this.prisma.attendance.update({
            where: { id: attendance.id },
            data: {
              lateDays: newLateDays,
              monthlyLates: {
                increment: 1
              }
            }
          });

          // Update monthly attendance summary to reflect the change
          const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
          await this.prisma.monthlyAttendanceSummary.updateMany({
            where: {
              empId: lateLog.empId,
              month: currentMonth
            },
            data: {
              totalLateDays: {
                decrement: 1
              }
            }
          });

          // Include the updated attendance values in response
          attendanceUpdates = {
            late_days: updatedAttendance.lateDays || 0,
            monthly_lates: updatedAttendance.monthlyLates || 0
          };
        }
      }

      return {
        late_log_id: updatedLateLog.id,
        emp_id: updatedLateLog.empId,
        date: updatedLateLog.date.toISOString().split('T')[0],
        scheduled_time_in: updatedLateLog.scheduledTimeIn,
        actual_time_in: updatedLateLog.actualTimeIn,
        minutes_late: updatedLateLog.minutesLate,
        reason: updatedLateLog.reason || '',
        justified: updatedLateLog.justified || false,
        late_type: updatedLateLog.lateType || 'unpaid',
        action_taken: updatedLateLog.actionTaken,
        reviewed_by: updatedLateLog.reviewedBy,
        created_at: updatedLateLog.createdAt.toISOString(),
        updated_at: updatedLateLog.updatedAt.toISOString(),
        attendance_updates: attendanceUpdates
      };
    } catch (error) {
      console.error('Error in processLateAction:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(`Failed to process late action: ${error.message}`);
    }
  }

  async getLateLogs(query: GetLateLogsDto): Promise<LateLogsListResponseDto[]> {
    try {
      const { employee_id, start_date, end_date } = query;

      // Ensure employee_id is a number if provided
      const employeeId = employee_id ? Number(employee_id) : undefined;

      // Validate date range (within last 6 months)
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      if (start_date && new Date(start_date) < sixMonthsAgo) {
        throw new BadRequestException('Start date cannot be more than 6 months ago');
      }

      if (end_date && new Date(end_date) < sixMonthsAgo) {
        throw new BadRequestException('End date cannot be more than 6 months ago');
      }

      // Validate that start_date is not greater than end_date
      if (start_date && end_date && new Date(start_date) > new Date(end_date)) {
        throw new BadRequestException('Start date cannot be greater than end date');
      }

      // Build where clause
      const where: any = {};

      if (employeeId) {
        where.empId = employeeId;
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

      // Fetch late logs with employee and reviewer information
      const lateLogs = await this.prisma.lateLog.findMany({
        where,
        include: {
          employee: {
            select: {
              firstName: true,
              lastName: true
            }
          },
          reviewer: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        },
        orderBy: {
          date: 'desc'
        }
      });

      // Transform the data to match the response DTO
      return lateLogs.map(log => ({
        late_log_id: log.id,
        emp_id: log.empId,
        employee_name: `${log.employee.firstName} ${log.employee.lastName}`,
        date: log.date.toISOString().split('T')[0],
        scheduled_time_in: log.scheduledTimeIn,
        actual_time_in: log.actualTimeIn,
        minutes_late: log.minutesLate,
        reason: log.reason,
        justified: log.justified,
        late_type: log.lateType,
        action_taken: log.actionTaken,
        reviewed_by: log.reviewedBy,
        reviewer_name: log.reviewer ? `${log.reviewer.firstName} ${log.reviewer.lastName}` : null,
        created_at: log.createdAt.toISOString(),
        updated_at: log.updatedAt.toISOString()
      }));
    } catch (error) {
      console.error('Error in getLateLogs:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(`Failed to fetch late logs: ${error.message}`);
    }
  }

  async getLateLogsByEmployee(employeeId: number): Promise<LateLogsListResponseDto[]> {
    try {
      // Validate employee_id
      if (isNaN(employeeId) || employeeId <= 0) {
        throw new BadRequestException('Invalid employee ID');
      }

      // Check if employee exists
      const employee = await this.prisma.employee.findUnique({
        where: { id: employeeId }
      });

      if (!employee) {
        throw new BadRequestException('Employee not found');
      }

      // Fetch late logs for the specific employee
      const lateLogs = await this.prisma.lateLog.findMany({
        where: {
          empId: employeeId
        },
        include: {
          employee: {
            select: {
              firstName: true,
              lastName: true
            }
          },
          reviewer: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        },
        orderBy: {
          date: 'desc'
        }
      });

      // Transform the data to match the response DTO
      return lateLogs.map(log => ({
        late_log_id: log.id,
        emp_id: log.empId,
        employee_name: `${log.employee.firstName} ${log.employee.lastName}`,
        date: log.date.toISOString().split('T')[0],
        scheduled_time_in: log.scheduledTimeIn,
        actual_time_in: log.actualTimeIn,
        minutes_late: log.minutesLate,
        reason: log.reason,
        justified: log.justified,
        late_type: log.lateType,
        action_taken: log.actionTaken,
        reviewed_by: log.reviewedBy,
        reviewer_name: log.reviewer ? `${log.reviewer.firstName} ${log.reviewer.lastName}` : null,
        created_at: log.createdAt.toISOString(),
        updated_at: log.updatedAt.toISOString()
      }));
    } catch (error) {
      console.error('Error in getLateLogsByEmployee:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(`Failed to fetch late logs for employee: ${error.message}`);
    }
  }

  // Get Late Logs for Export (similar to HR logs pattern)
  async getLateLogsForExport(query: any) {
    const { 
      employee_id, 
      start_date, 
      end_date 
    } = query;

    // Build where clause (same logic as getLateLogs but without pagination)
    const where: any = {};

    if (employee_id) {
      where.empId = employee_id;
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

    return this.prisma.lateLog.findMany({
      where,
      include: {
        employee: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            id: true
          }
        },
        reviewer: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: {
        date: 'desc'
      }
    });
  }

  // Convert Late Logs to CSV (similar to HR logs pattern)
  convertLateLogsToCSV(lateLogs: any[], query: ExportLateLogsDto): string {
    const headers = [
      'Late Log ID',
      'Employee ID',
      'Employee Name',
      'Employee Email',
      'Date',
      'Scheduled Time In',
      'Actual Time In',
      'Minutes Late',
      'Reason',
      'Justified',
      'Action Taken'
    ];

    if (query.include_late_type) {
      headers.push('Late Type');
    }

    if (query.include_reviewer_details) {
      headers.push('Reviewed By', 'Reviewer Name', 'Reviewer Email', 'Reviewed On');
    }

    headers.push('Created At', 'Updated At');

    const csvRows = [headers.join(',')];

    lateLogs.forEach(log => {
      const row = [
        log.id,
        log.empId,
        `"${log.employee.firstName} ${log.employee.lastName}"`,
        log.employee.email,
        log.date.toISOString().split('T')[0],
        log.scheduledTimeIn,
        log.actualTimeIn,
        log.minutesLate,
        `"${log.reason || ''}"`,
        log.justified !== null ? log.justified : '',
        log.actionTaken
      ];

      if (query.include_late_type) {
        row.push(log.lateType || '');
      }

      if (query.include_reviewer_details) {
        row.push(
          log.reviewedBy || '',
          log.reviewer ? `"${log.reviewer.firstName} ${log.reviewer.lastName}"` : '',
          log.reviewer ? log.reviewer.email : '',
          log.reviewedOn ? log.reviewedOn.toISOString() : ''
        );
      }

      row.push(
        log.createdAt.toISOString(),
        log.updatedAt.toISOString()
      );

      csvRows.push(row.join(','));
    });

    return csvRows.join('\n');
  }

  // Get Late Logs Statistics
  async getLateLogsStats(query: LateLogsStatsDto): Promise<LateLogsStatsResponseDto> {
    try {
      // Build where clause
      const where: any = {};
      
      if (query.employee_id) {
        where.empId = query.employee_id;
      }

      if (query.start_date && query.end_date) {
        where.date = {
          gte: new Date(query.start_date),
          lte: new Date(query.end_date)
        };
      } else if (query.start_date) {
        where.date = {
          gte: new Date(query.start_date)
        };
      } else if (query.end_date) {
        where.date = {
          lte: new Date(query.end_date)
        };
      }

      // Get all late logs for statistics
      const lateLogs = await this.prisma.lateLog.findMany({
        where,
        include: {
          employee: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        }
      });

      // Calculate basic statistics
      const totalLateLogs = lateLogs.length;
      const pendingLateLogs = lateLogs.filter(log => log.actionTaken === 'Pending').length;
      const completedLateLogs = lateLogs.filter(log => log.actionTaken === 'Completed').length;

      // Calculate total minutes late
      const totalMinutesLate = lateLogs.reduce((sum, log) => sum + log.minutesLate, 0);
      const averageMinutesLate = totalLateLogs > 0 ? totalMinutesLate / totalLateLogs : 0;

      // Count paid vs unpaid
      const paidLateCount = lateLogs.filter(log => log.lateType === 'paid').length;
      const unpaidLateCount = lateLogs.filter(log => log.lateType === 'unpaid').length;

      // Find most common reason
      const reasonCounts = lateLogs.reduce((acc, log) => {
        const reason = log.reason || 'No reason provided';
        acc[reason] = (acc[reason] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const mostCommonReason = Object.keys(reasonCounts).length > 0 
        ? Object.keys(reasonCounts).reduce((a, b) => 
            reasonCounts[a] > reasonCounts[b] ? a : b
          )
        : 'N/A';

      // Generate period statistics
      const periodStats = this.generateLateLogsPeriodStats(lateLogs, query.period || StatsPeriod.MONTHLY);

      const response: LateLogsStatsResponseDto = {
        total_late_logs: totalLateLogs,
        pending_late_logs: pendingLateLogs,
        completed_late_logs: completedLateLogs,
        total_minutes_late: totalMinutesLate,
        average_minutes_late: Math.round(averageMinutesLate * 100) / 100,
        most_common_reason: mostCommonReason,
        paid_late_count: paidLateCount,
        unpaid_late_count: unpaidLateCount,
        period_stats: periodStats
      };

      // Add breakdowns if requested
      if (query.include_breakdown) {
        response.employee_breakdown = this.generateLateLogsEmployeeBreakdown(lateLogs);
        response.reason_breakdown = this.generateLateLogsReasonBreakdown(lateLogs);
      }

      return response;
    } catch (error) {
      console.error('Error in getLateLogsStats:', error);
      throw new InternalServerErrorException(`Failed to get late logs statistics: ${error.message}`);
    }
  }

  // Generate period statistics for late logs
  private generateLateLogsPeriodStats(lateLogs: any[], period: StatsPeriod): LatePeriodStatsDto[] {
    const stats: LatePeriodStatsDto[] = [];
    const groupedLogs = this.groupLateLogsByPeriod(lateLogs, period);

    Object.keys(groupedLogs).forEach(periodKey => {
      const logs = groupedLogs[periodKey];
      const totalLateLogs = logs.length;
      const pendingLateLogs = logs.filter(log => log.actionTaken === 'Pending').length;
      const completedLateLogs = logs.filter(log => log.actionTaken === 'Completed').length;
      const totalMinutes = logs.reduce((sum, log) => sum + log.minutesLate, 0);

      stats.push({
        period: periodKey,
        total_late_logs: totalLateLogs,
        completed_late_logs: completedLateLogs,
        pending_late_logs: pendingLateLogs,
        total_minutes: totalMinutes
      });
    });

    return stats.sort((a, b) => a.period.localeCompare(b.period));
  }

  // Group late logs by period
  private groupLateLogsByPeriod(lateLogs: any[], period: StatsPeriod): Record<string, any[]> {
    const grouped: Record<string, any[]> = {};

    lateLogs.forEach(log => {
      let periodKey: string;
      const date = new Date(log.date);

      switch (period) {
        case StatsPeriod.DAILY:
          periodKey = date.toISOString().split('T')[0];
          break;
        case StatsPeriod.WEEKLY:
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          periodKey = weekStart.toISOString().split('T')[0];
          break;
        case StatsPeriod.MONTHLY:
          periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        case StatsPeriod.YEARLY:
          periodKey = date.getFullYear().toString();
          break;
        default:
          periodKey = date.toISOString().split('T')[0];
      }

      if (!grouped[periodKey]) {
        grouped[periodKey] = [];
      }
      grouped[periodKey].push(log);
    });

    return grouped;
  }

  // Generate employee breakdown for late logs
  private generateLateLogsEmployeeBreakdown(lateLogs: any[]): EmployeeLateStatsDto[] {
    const employeeStats: Record<number, any> = {};

    lateLogs.forEach(log => {
      if (!employeeStats[log.empId]) {
        employeeStats[log.empId] = {
          employee_id: log.empId,
          employee_name: `${log.employee.firstName} ${log.employee.lastName}`,
          total_late_logs: 0,
          total_minutes: 0,
          completed_late_logs: 0,
          pending_late_logs: 0
        };
      }

      const stats = employeeStats[log.empId];
      stats.total_late_logs++;
      stats.total_minutes += log.minutesLate;

      if (log.actionTaken === 'Completed') stats.completed_late_logs++;
      else if (log.actionTaken === 'Pending') stats.pending_late_logs++;
    });

    return Object.values(employeeStats).map(stats => ({
      ...stats,
      average_minutes_late: stats.total_late_logs > 0 ? Math.round((stats.total_minutes / stats.total_late_logs) * 100) / 100 : 0
    })).sort((a, b) => b.total_late_logs - a.total_late_logs);
  }

  // Generate reason breakdown for late logs
  private generateLateLogsReasonBreakdown(lateLogs: any[]): ReasonStatsDto[] {
    const reasonStats: Record<string, any> = {};

    lateLogs.forEach(log => {
      const reason = log.reason || 'No reason provided';
      if (!reasonStats[reason]) {
        reasonStats[reason] = {
          reason: reason,
          count: 0,
          total_minutes: 0,
          completed_count: 0
        };
      }

      const stats = reasonStats[reason];
      stats.count++;
      stats.total_minutes += log.minutesLate;
      if (log.actionTaken === 'Completed') stats.completed_count++;
    });

    return Object.values(reasonStats).map(stats => ({
      reason: stats.reason,
      count: stats.count,
      total_minutes: stats.total_minutes,
      completion_rate: stats.count > 0 ? Math.round((stats.completed_count / stats.count) * 100) : 0
    })).sort((a, b) => b.count - a.count);
  }

  async getHalfDayLogs(query: GetHalfDayLogsDto): Promise<HalfDayLogsListResponseDto[]> {
    try {
      const { employee_id, start_date, end_date } = query;

      // Ensure employee_id is a number if provided
      const employeeId = employee_id ? Number(employee_id) : undefined;

      // Validate date range (within last 6 months)
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      if (start_date && new Date(start_date) < sixMonthsAgo) {
        throw new BadRequestException('Start date cannot be more than 6 months ago');
      }

      if (end_date && new Date(end_date) < sixMonthsAgo) {
        throw new BadRequestException('End date cannot be more than 6 months ago');
      }

      // Validate that start_date is not greater than end_date
      if (start_date && end_date && new Date(start_date) > new Date(end_date)) {
        throw new BadRequestException('Start date cannot be greater than end date');
      }

      // Build where clause
      const where: any = {};

      if (employeeId) {
        where.empId = employeeId;
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

      // Fetch half-day logs with employee and reviewer information
      const halfDayLogs = await this.prisma.halfDayLog.findMany({
        where,
        include: {
          employee: {
            select: {
              firstName: true,
              lastName: true
            }
          },
          reviewer: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        },
        orderBy: {
          date: 'desc'
        }
      });

      // Transform the data to match the response DTO
      return halfDayLogs.map(log => ({
        half_day_log_id: log.id,
        emp_id: log.empId,
        employee_name: `${log.employee.firstName} ${log.employee.lastName}`,
        date: log.date.toISOString().split('T')[0],
        scheduled_time_in: log.scheduledTimeIn,
        actual_time_in: log.actualTimeIn,
        minutes_late: log.minutesLate,
        reason: log.reason,
        justified: log.justified,
        half_day_type: log.halfDayType,
        action_taken: log.actionTaken,
        reviewed_by: log.reviewedBy,
        reviewer_name: log.reviewer ? `${log.reviewer.firstName} ${log.reviewer.lastName}` : null,
        created_at: log.createdAt.toISOString(),
        updated_at: log.updatedAt.toISOString()
      }));
    } catch (error) {
      console.error('Error in getHalfDayLogs:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(`Failed to fetch half-day logs: ${error.message}`);
    }
  }

  async getHalfDayLogsByEmployee(employeeId: number): Promise<HalfDayLogsListResponseDto[]> {
    try {
      // Validate employee_id
      if (isNaN(employeeId) || employeeId <= 0) {
        throw new BadRequestException('Invalid employee ID');
      }

      // Check if employee exists
      const employee = await this.prisma.employee.findUnique({
        where: { id: employeeId }
      });

      if (!employee) {
        throw new BadRequestException('Employee not found');
      }

      // Fetch half-day logs for the specific employee
      const halfDayLogs = await this.prisma.halfDayLog.findMany({
        where: {
          empId: employeeId
        },
        include: {
          employee: {
            select: {
              firstName: true,
              lastName: true
            }
          },
          reviewer: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        },
        orderBy: {
          date: 'desc'
        }
      });

      // Transform the data to match the response DTO
      return halfDayLogs.map(log => ({
        half_day_log_id: log.id,
        emp_id: log.empId,
        employee_name: `${log.employee.firstName} ${log.employee.lastName}`,
        date: log.date.toISOString().split('T')[0],
        scheduled_time_in: log.scheduledTimeIn,
        actual_time_in: log.actualTimeIn,
        minutes_late: log.minutesLate,
        reason: log.reason,
        justified: log.justified,
        half_day_type: log.halfDayType,
        action_taken: log.actionTaken,
        reviewed_by: log.reviewedBy,
        reviewer_name: log.reviewer ? `${log.reviewer.firstName} ${log.reviewer.lastName}` : null,
        created_at: log.createdAt.toISOString(),
        updated_at: log.updatedAt.toISOString()
      }));
    } catch (error) {
      console.error('Error in getHalfDayLogsByEmployee:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(`Failed to fetch half-day logs for employee: ${error.message}`);
    }
  }

  // Get Half Day Logs for Export (similar to HR logs pattern)
  async getHalfDayLogsForExport(query: any) {
    const { 
      employee_id, 
      start_date, 
      end_date 
    } = query;

    // Build where clause (same logic as getHalfDayLogs but without pagination)
    const where: any = {};

    if (employee_id) {
      where.empId = employee_id;
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

    return this.prisma.halfDayLog.findMany({
      where,
      include: {
        employee: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            id: true
          }
        },
        reviewer: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: {
        date: 'desc'
      }
    });
  }

  // Convert Half Day Logs to CSV (similar to HR logs pattern)
  convertHalfDayLogsToCSV(halfDayLogs: any[], query: ExportHalfDayLogsDto): string {
    const headers = [
      'Half Day Log ID',
      'Employee ID',
      'Employee Name',
      'Employee Email',
      'Date',
      'Scheduled Time In',
      'Actual Time In',
      'Minutes Late',
      'Reason',
      'Justified',
      'Action Taken'
    ];

    if (query.include_half_day_type) {
      headers.push('Half Day Type');
    }

    if (query.include_reviewer_details) {
      headers.push('Reviewed By', 'Reviewer Name', 'Reviewer Email', 'Reviewed On');
    }

    headers.push('Created At', 'Updated At');

    const csvRows = [headers.join(',')];

    halfDayLogs.forEach(log => {
      const row = [
        log.id,
        log.empId,
        `"${log.employee.firstName} ${log.employee.lastName}"`,
        log.employee.email,
        log.date.toISOString().split('T')[0],
        log.scheduledTimeIn,
        log.actualTimeIn,
        log.minutesLate,
        `"${log.reason || ''}"`,
        log.justified !== null ? log.justified : '',
        log.actionTaken
      ];

      if (query.include_half_day_type) {
        row.push(log.halfDayType || '');
      }

      if (query.include_reviewer_details) {
        row.push(
          log.reviewedBy || '',
          log.reviewer ? `"${log.reviewer.firstName} ${log.reviewer.lastName}"` : '',
          log.reviewer ? log.reviewer.email : '',
          log.reviewedOn ? log.reviewedOn.toISOString() : ''
        );
      }

      row.push(
        log.createdAt.toISOString(),
        log.updatedAt.toISOString()
      );

      csvRows.push(row.join(','));
    });

    return csvRows.join('\n');
  }

  // Get Half Day Logs Statistics
  async getHalfDayLogsStats(query: HalfDayLogsStatsDto): Promise<HalfDayLogsStatsResponseDto> {
    try {
      // Build where clause
      const where: any = {};
      
      if (query.employee_id) {
        where.empId = query.employee_id;
      }

      if (query.start_date && query.end_date) {
        where.date = {
          gte: new Date(query.start_date),
          lte: new Date(query.end_date)
        };
      } else if (query.start_date) {
        where.date = {
          gte: new Date(query.start_date)
        };
      } else if (query.end_date) {
        where.date = {
          lte: new Date(query.end_date)
        };
      }

      // Get all half day logs for statistics
      const halfDayLogs = await this.prisma.halfDayLog.findMany({
        where,
        include: {
          employee: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        }
      });

      // Calculate basic statistics
      const totalHalfDayLogs = halfDayLogs.length;
      const pendingHalfDayLogs = halfDayLogs.filter(log => log.actionTaken === 'Pending').length;
      const completedHalfDayLogs = halfDayLogs.filter(log => log.actionTaken === 'Completed').length;

      // Calculate total minutes late
      const totalMinutesLate = halfDayLogs.reduce((sum, log) => sum + log.minutesLate, 0);
      const averageMinutesLate = totalHalfDayLogs > 0 ? totalMinutesLate / totalHalfDayLogs : 0;

      // Count paid vs unpaid
      const paidHalfDayCount = halfDayLogs.filter(log => log.halfDayType === 'paid').length;
      const unpaidHalfDayCount = halfDayLogs.filter(log => log.halfDayType === 'unpaid').length;

      // Find most common reason
      const reasonCounts = halfDayLogs.reduce((acc, log) => {
        const reason = log.reason || 'No reason provided';
        acc[reason] = (acc[reason] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const mostCommonReason = Object.keys(reasonCounts).length > 0 
        ? Object.keys(reasonCounts).reduce((a, b) => 
            reasonCounts[a] > reasonCounts[b] ? a : b
          )
        : 'N/A';

      // Generate period statistics
      const periodStats = this.generateHalfDayLogsPeriodStats(halfDayLogs, query.period || StatsPeriod.MONTHLY);

      const response: HalfDayLogsStatsResponseDto = {
        total_half_day_logs: totalHalfDayLogs,
        pending_half_day_logs: pendingHalfDayLogs,
        completed_half_day_logs: completedHalfDayLogs,
        total_minutes_late: totalMinutesLate,
        average_minutes_late: Math.round(averageMinutesLate * 100) / 100,
        most_common_reason: mostCommonReason,
        paid_half_day_count: paidHalfDayCount,
        unpaid_half_day_count: unpaidHalfDayCount,
        period_stats: periodStats
      };

      // Add breakdowns if requested
      if (query.include_breakdown) {
        response.employee_breakdown = this.generateHalfDayLogsEmployeeBreakdown(halfDayLogs);
        response.reason_breakdown = this.generateHalfDayLogsReasonBreakdown(halfDayLogs);
      }

      return response;
    } catch (error) {
      console.error('Error in getHalfDayLogsStats:', error);
      throw new InternalServerErrorException(`Failed to get half day logs statistics: ${error.message}`);
    }
  }

  // Generate period statistics for half day logs
  private generateHalfDayLogsPeriodStats(halfDayLogs: any[], period: StatsPeriod): HalfDayPeriodStatsDto[] {
    const stats: HalfDayPeriodStatsDto[] = [];
    const groupedLogs = this.groupHalfDayLogsByPeriod(halfDayLogs, period);

    Object.keys(groupedLogs).forEach(periodKey => {
      const logs = groupedLogs[periodKey];
      const totalHalfDayLogs = logs.length;
      const pendingHalfDayLogs = logs.filter(log => log.actionTaken === 'Pending').length;
      const completedHalfDayLogs = logs.filter(log => log.actionTaken === 'Completed').length;
      const totalMinutes = logs.reduce((sum, log) => sum + log.minutesLate, 0);

      stats.push({
        period: periodKey,
        total_half_day_logs: totalHalfDayLogs,
        completed_half_day_logs: completedHalfDayLogs,
        pending_half_day_logs: pendingHalfDayLogs,
        total_minutes: totalMinutes
      });
    });

    return stats.sort((a, b) => a.period.localeCompare(b.period));
  }

  // Group half day logs by period
  private groupHalfDayLogsByPeriod(halfDayLogs: any[], period: StatsPeriod): Record<string, any[]> {
    const grouped: Record<string, any[]> = {};

    halfDayLogs.forEach(log => {
      let periodKey: string;
      const date = new Date(log.date);

      switch (period) {
        case StatsPeriod.DAILY:
          periodKey = date.toISOString().split('T')[0];
          break;
        case StatsPeriod.WEEKLY:
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          periodKey = weekStart.toISOString().split('T')[0];
          break;
        case StatsPeriod.MONTHLY:
          periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        case StatsPeriod.YEARLY:
          periodKey = date.getFullYear().toString();
          break;
        default:
          periodKey = date.toISOString().split('T')[0];
      }

      if (!grouped[periodKey]) {
        grouped[periodKey] = [];
      }
      grouped[periodKey].push(log);
    });

    return grouped;
  }

  // Generate employee breakdown for half day logs
  private generateHalfDayLogsEmployeeBreakdown(halfDayLogs: any[]): EmployeeHalfDayStatsDto[] {
    const employeeStats: Record<number, any> = {};

    halfDayLogs.forEach(log => {
      if (!employeeStats[log.empId]) {
        employeeStats[log.empId] = {
          employee_id: log.empId,
          employee_name: `${log.employee.firstName} ${log.employee.lastName}`,
          total_half_day_logs: 0,
          total_minutes: 0,
          completed_half_day_logs: 0,
          pending_half_day_logs: 0
        };
      }

      const stats = employeeStats[log.empId];
      stats.total_half_day_logs++;
      stats.total_minutes += log.minutesLate;

      if (log.actionTaken === 'Completed') stats.completed_half_day_logs++;
      else if (log.actionTaken === 'Pending') stats.pending_half_day_logs++;
    });

    return Object.values(employeeStats).map(stats => ({
      ...stats,
      average_minutes_late: stats.total_half_day_logs > 0 ? Math.round((stats.total_minutes / stats.total_half_day_logs) * 100) / 100 : 0
    })).sort((a, b) => b.total_half_day_logs - a.total_half_day_logs);
  }

  // Generate reason breakdown for half day logs
  private generateHalfDayLogsReasonBreakdown(halfDayLogs: any[]): HalfDayReasonStatsDto[] {
    const reasonStats: Record<string, any> = {};

    halfDayLogs.forEach(log => {
      const reason = log.reason || 'No reason provided';
      if (!reasonStats[reason]) {
        reasonStats[reason] = {
          reason: reason,
          count: 0,
          total_minutes: 0,
          completed_count: 0
        };
      }

      const stats = reasonStats[reason];
      stats.count++;
      stats.total_minutes += log.minutesLate;
      if (log.actionTaken === 'Completed') stats.completed_count++;
    });

    return Object.values(reasonStats).map(stats => ({
      reason: stats.reason,
      count: stats.count,
      total_minutes: stats.total_minutes,
      completion_rate: stats.count > 0 ? Math.round((stats.completed_count / stats.count) * 100) : 0
    })).sort((a, b) => b.count - a.count);
  }

  async submitHalfDayReason(halfDayData: SubmitHalfDayReasonDto): Promise<HalfDayLogResponseDto> {
    try {
      const { emp_id, date, scheduled_time_in, actual_time_in, minutes_late, reason } = halfDayData;

      // Check if employee exists
      const employee = await this.prisma.employee.findUnique({
        where: { id: emp_id }
      });

      if (!employee) {
        throw new BadRequestException('Employee not found');
      }

      // Find existing half-day log created by check-in for this employee and date
      const existingHalfDayLog = await this.prisma.halfDayLog.findFirst({
        where: {
          empId: emp_id,
          date: new Date(date),
          actionTaken: 'Created' // Only update logs created by check-in
        },
        orderBy: {
          createdAt: 'desc' // Get the most recent one
        }
      });

      if (!existingHalfDayLog) {
        throw new BadRequestException('No half-day log found for this employee and date. Please check-in first.');
      }

      // Update the existing half-day log with reason and change status to Pending
      const halfDayLog = await this.prisma.halfDayLog.update({
        where: { id: existingHalfDayLog.id },
        data: {
          reason: reason,
          actionTaken: 'Pending', // Status when employee submits reason
          halfDayType: null, // Keep null, will be set by HR
          justified: null, // Keep null, will be set by HR
          updatedAt: new Date()
        }
      });

      return {
        half_day_log_id: halfDayLog.id,
        emp_id: halfDayLog.empId,
        date: halfDayLog.date.toISOString().split('T')[0],
        scheduled_time_in: halfDayLog.scheduledTimeIn,
        actual_time_in: halfDayLog.actualTimeIn,
        minutes_late: halfDayLog.minutesLate,
        reason: halfDayLog.reason || '',
        justified: halfDayLog.justified || false,
        half_day_type: halfDayLog.halfDayType || 'unpaid',
        action_taken: halfDayLog.actionTaken,
        reviewed_by: halfDayLog.reviewedBy,
        created_at: halfDayLog.createdAt.toISOString(),
        updated_at: halfDayLog.updatedAt.toISOString()
      };
    } catch (error) {
      console.error('Error in submitHalfDayReason:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(`Failed to submit half-day reason: ${error.message}`);
    }
  }

  async processHalfDayAction(halfDayLogId: number, action: 'Pending' | 'Completed', reviewerId: number, halfDayType?: 'paid' | 'unpaid'): Promise<HalfDayLogResponseDto> {
    try {
      // Find the half-day log
      const halfDayLog = await this.prisma.halfDayLog.findUnique({
        where: { id: halfDayLogId }
      });

      if (!halfDayLog) {
        throw new BadRequestException('Half-day log not found');
      }

      // Update the half-day log with the action
      const updatedHalfDayLog = await this.prisma.halfDayLog.update({
        where: { id: halfDayLogId },
        data: {
          actionTaken: action,
          halfDayType: halfDayType || null, // Let HR set this
          justified: action === 'Completed' ? (halfDayType === 'paid') : null, // Let HR set this
          reviewedBy: reviewerId,
          updatedAt: new Date()
        }
      });

      let attendanceUpdates: { half_days: number; monthly_half_days: number; } | undefined = undefined;

      // If completed and marked as paid, update attendance records
      if (action === 'Completed' && halfDayType === 'paid') {
        // Find the attendance record for this employee
        const attendance = await this.prisma.attendance.findFirst({
          where: { employeeId: halfDayLog.empId }
        });

        if (attendance) {
          // Check if half_days is greater than 0 before decrementing
          const currentHalfDays = attendance.halfDays || 0;
          const newHalfDays = Math.max(0, currentHalfDays - 1); // Prevent going below 0

          // Update attendance with safe decrement
          const updatedAttendance = await this.prisma.attendance.update({
            where: { id: attendance.id },
            data: {
              halfDays: newHalfDays
            }
          });

          // Update monthly attendance summary to reflect the change
          // Use the month from the half-day log date, not current month
          const halfDayMonth = halfDayLog.date.toISOString().slice(0, 7); // YYYY-MM format
          await this.prisma.monthlyAttendanceSummary.updateMany({
            where: {
              empId: halfDayLog.empId,
              month: halfDayMonth
            },
            data: {
              totalHalfDays: {
                decrement: 1
              }
            }
          });

          // Get the updated monthly attendance summary to include in response
          const updatedMonthlySummary = await this.prisma.monthlyAttendanceSummary.findFirst({
            where: {
              empId: halfDayLog.empId,
              month: halfDayMonth
            }
          });

          // Include the updated attendance values in response
          attendanceUpdates = {
            half_days: updatedAttendance.halfDays || 0,
            monthly_half_days: updatedMonthlySummary?.totalHalfDays || 0
          };
        }
      }

      return {
        half_day_log_id: updatedHalfDayLog.id,
        emp_id: updatedHalfDayLog.empId,
        date: updatedHalfDayLog.date.toISOString().split('T')[0],
        scheduled_time_in: updatedHalfDayLog.scheduledTimeIn,
        actual_time_in: updatedHalfDayLog.actualTimeIn,
        minutes_late: updatedHalfDayLog.minutesLate,
        reason: updatedHalfDayLog.reason || '',
        justified: updatedHalfDayLog.justified || false,
        half_day_type: updatedHalfDayLog.halfDayType || 'unpaid',
        action_taken: updatedHalfDayLog.actionTaken,
        reviewed_by: updatedHalfDayLog.reviewedBy,
        created_at: updatedHalfDayLog.createdAt.toISOString(),
        updated_at: updatedHalfDayLog.updatedAt.toISOString(),
        attendance_updates: attendanceUpdates
      };
    } catch (error) {
      console.error('Error in processHalfDayAction:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(`Failed to process half-day action: ${error.message}`);
    }
  }

  async getLeaveLogs(query: GetLeaveLogsDto): Promise<LeaveLogsListResponseDto[]> {
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
        where.empId = employeeId;
      }

      if (start_date || end_date) {
        where.OR = [];

        if (start_date && end_date) {
          // Check if leave period overlaps with the date range
          where.OR.push({
            AND: [
              { startDate: { lte: new Date(end_date) } },
              { endDate: { gte: new Date(start_date) } }
            ]
          });
        } else if (start_date) {
          where.OR.push({
            endDate: { gte: new Date(start_date) }
          });
        } else if (end_date) {
          where.OR.push({
            startDate: { lte: new Date(end_date) }
          });
        }
      }

      const leaveLogs = await this.prisma.leaveLog.findMany({
        where,
        include: {
          employee: {
            select: {
              firstName: true,
              lastName: true
            }
          },
          reviewer: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        },
        orderBy: {
          appliedOn: 'desc'
        }
      });

      return leaveLogs.map(log => ({
        leave_log_id: log.id,
        emp_id: log.empId,
        employee_name: `${log.employee.firstName} ${log.employee.lastName}`,
        leave_type: log.leaveType,
        start_date: log.startDate.toISOString().split('T')[0],
        end_date: log.endDate.toISOString().split('T')[0],
        reason: log.reason,
        status: log.status || 'Pending',
        applied_on: log.appliedOn.toISOString(),
        reviewed_by: log.reviewedBy,
        reviewer_name: log.reviewer ? `${log.reviewer.firstName} ${log.reviewer.lastName}` : null,
        reviewed_on: log.reviewedOn ? log.reviewedOn.toISOString() : null,
        confirmation_reason: log.confirmationReason,
        created_at: log.createdAt.toISOString(),
        updated_at: log.updatedAt.toISOString()
      }));
    } catch (error) {
      console.error('Error in getLeaveLogs:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(`Failed to get leave logs: ${error.message}`);
    }
  }

  async getLeaveLogsByEmployee(employeeId: number): Promise<LeaveLogsListResponseDto[]> {
    try {
      if (!employeeId || isNaN(employeeId)) {
        throw new BadRequestException('Invalid employee ID');
      }

      const leaveLogs = await this.prisma.leaveLog.findMany({
        where: {
          empId: employeeId
        },
        include: {
          employee: {
            select: {
              firstName: true,
              lastName: true
            }
          },
          reviewer: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        },
        orderBy: {
          appliedOn: 'desc'
        }
      });

      return leaveLogs.map(log => ({
        leave_log_id: log.id,
        emp_id: log.empId,
        employee_name: `${log.employee.firstName} ${log.employee.lastName}`,
        leave_type: log.leaveType,
        start_date: log.startDate.toISOString().split('T')[0],
        end_date: log.endDate.toISOString().split('T')[0],
        reason: log.reason,
        status: log.status || 'Pending',
        applied_on: log.appliedOn.toISOString(),
        reviewed_by: log.reviewedBy,
        reviewer_name: log.reviewer ? `${log.reviewer.firstName} ${log.reviewer.lastName}` : null,
        reviewed_on: log.reviewedOn ? log.reviewedOn.toISOString() : null,
        confirmation_reason: log.confirmationReason,
        created_at: log.createdAt.toISOString(),
        updated_at: log.updatedAt.toISOString()
      }));
    } catch (error) {
      console.error('Error in getLeaveLogsByEmployee:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(`Failed to get leave logs by employee: ${error.message}`);
    }
  }

  // Get Leave Logs for Export (similar to HR logs pattern)
  async getLeaveLogsForExport(query: any) {
    const { 
      employee_id, 
      start_date, 
      end_date 
    } = query;

    // Build where clause (same logic as getLeaveLogs but without pagination)
    const where: any = {};

    if (employee_id) {
      where.empId = employee_id;
    }

    if (start_date && end_date) {
      where.appliedOn = {
        gte: new Date(start_date),
        lte: new Date(end_date)
      };
    } else if (start_date) {
      where.appliedOn = {
        gte: new Date(start_date)
      };
    } else if (end_date) {
      where.appliedOn = {
        lte: new Date(end_date)
      };
    }

    return this.prisma.leaveLog.findMany({
      where,
      include: {
        employee: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            id: true
          }
        },
        reviewer: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: {
        appliedOn: 'desc'
      }
    });
  }

  // Convert Leave Logs to CSV (similar to HR logs pattern)
  convertLeaveLogsToCSV(leaveLogs: any[], query: ExportLeaveLogsDto): string {
    const headers = [
      'Leave ID',
      'Employee ID',
      'Employee Name',
      'Employee Email',
      'Leave Type',
      'Start Date',
      'End Date',
      'Reason',
      'Status',
      'Applied On',
      'Total Days'
    ];

    if (query.include_reviewer_details) {
      headers.push('Reviewed By', 'Reviewer Name', 'Reviewer Email', 'Reviewed On');
    }

    if (query.include_confirmation_reason) {
      headers.push('Confirmation Reason');
    }

    headers.push('Created At', 'Updated At');

    const csvRows = [headers.join(',')];

    leaveLogs.forEach(log => {
      const row = [
        log.id,
        log.empId,
        `"${log.employee.firstName} ${log.employee.lastName}"`,
        log.employee.email,
        log.leaveType,
        log.startDate.toISOString().split('T')[0],
        log.endDate.toISOString().split('T')[0],
        `"${log.reason || ''}"`,
        log.status || 'Pending',
        log.appliedOn.toISOString(),
        this.calculateLeaveDays(log.startDate, log.endDate)
      ];

      if (query.include_reviewer_details) {
        row.push(
          log.reviewedBy || '',
          log.reviewer ? `"${log.reviewer.firstName} ${log.reviewer.lastName}"` : '',
          log.reviewer ? log.reviewer.email : '',
          log.reviewedOn ? log.reviewedOn.toISOString() : ''
        );
      }

      if (query.include_confirmation_reason) {
        row.push(`"${log.confirmationReason || ''}"`);
      }

      row.push(
        log.createdAt.toISOString(),
        log.updatedAt.toISOString()
      );

      csvRows.push(row.join(','));
    });

    return csvRows.join('\n');
  }

  async createLeaveLog(leaveData: CreateLeaveLogDto): Promise<LeaveLogResponseDto> {
    try {
      // Validate employee exists
      const employee = await this.prisma.employee.findUnique({
        where: { id: leaveData.emp_id },
        select: { id: true, firstName: true, lastName: true }
      });

      if (!employee) {
        throw new BadRequestException('Employee not found');
      }

      // Validate date range
      const startDate = new Date(leaveData.start_date);
      const endDate = new Date(leaveData.end_date);

      if (startDate > endDate) {
        throw new BadRequestException('Start date cannot be greater than end date');
      }

      // Check for existing leave requests for the same date range
      const existingLeave = await this.prisma.leaveLog.findFirst({
        where: {
          empId: leaveData.emp_id,
          OR: [
            // Check if there's any overlap with existing leave requests
            {
              AND: [
                { startDate: { lte: startDate } },
                { endDate: { gte: startDate } }
              ]
            },
            {
              AND: [
                { startDate: { lte: endDate } },
                { endDate: { gte: endDate } }
              ]
            },
            {
              AND: [
                { startDate: { gte: startDate } },
                { endDate: { lte: endDate } }
              ]
            }
          ],
          status: {
            in: ['Pending', 'Approved']
          }
        }
      });

      if (existingLeave) {
        throw new BadRequestException('Leave request already exists for the specified date range. Please check your existing leave requests.');
      }

      // Create the leave log with status automatically set to 'Pending'
      const leaveLog = await this.prisma.leaveLog.create({
        data: {
          empId: leaveData.emp_id,
          leaveType: leaveData.leave_type,
          startDate: startDate,
          endDate: endDate,
          reason: leaveData.reason,
          status: 'Pending', // Automatically set to pending
          appliedOn: new Date()
        },
        include: {
          employee: {
            select: {
              firstName: true,
              lastName: true
            }
          },
          reviewer: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        }
      });

      return {
        leave_log_id: leaveLog.id,
        emp_id: leaveLog.empId,
        employee_name: `${leaveLog.employee.firstName} ${leaveLog.employee.lastName}`,
        leave_type: leaveLog.leaveType,
        start_date: leaveLog.startDate.toISOString().split('T')[0],
        end_date: leaveLog.endDate.toISOString().split('T')[0],
        reason: leaveLog.reason,
        status: leaveLog.status || 'Pending',
        applied_on: leaveLog.appliedOn.toISOString(),
        reviewed_by: leaveLog.reviewedBy,
        reviewer_name: leaveLog.reviewer ? `${leaveLog.reviewer.firstName} ${leaveLog.reviewer.lastName}` : null,
        reviewed_on: leaveLog.reviewedOn ? leaveLog.reviewedOn.toISOString() : null,
        confirmation_reason: leaveLog.confirmationReason,
        created_at: leaveLog.createdAt.toISOString(),
        updated_at: leaveLog.updatedAt.toISOString()
      };
    } catch (error) {
      console.error('Error in createLeaveLog:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(`Failed to create leave log: ${error.message}`);
    }
  }

  async processLeaveAction(leaveLogId: number, action: 'Approved' | 'Rejected', reviewerId: number, confirmationReason?: string): Promise<LeaveLogResponseDto> {
    try {
      // Find the leave log
      const leaveLog = await this.prisma.leaveLog.findUnique({
        where: { id: leaveLogId },
        include: {
          employee: {
            select: {
              firstName: true,
              lastName: true
            }
          },
          reviewer: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        }
      });

      if (!leaveLog) {
        throw new BadRequestException('Leave log not found');
      }

      // Update the leave log with the action
      const updatedLeaveLog = await this.prisma.leaveLog.update({
        where: { id: leaveLogId },
        data: {
          status: action,
          reviewedBy: reviewerId,
          reviewedOn: new Date(),
          confirmationReason: confirmationReason || null,
          updatedAt: new Date()
        },
        include: {
          employee: {
            select: {
              firstName: true,
              lastName: true
            }
          },
          reviewer: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        }
      });

      // Process attendance updates based on the logic you specified
      if (action === 'Approved') {
        const currentDate = new Date();
        const startDate = leaveLog.startDate;
        const endDate = leaveLog.endDate;

        // Calculate the TOTAL number of days for this leave using proper day counting
        const totalLeaveDays = this.calculateLeaveDays(startDate, endDate);

        console.log(`Leave approved: Total days: ${totalLeaveDays}, Start: ${startDate.toISOString().split('T')[0]}, End: ${endDate.toISOString().split('T')[0]}`);

        // Condition 1: If endDate is less than current date (past leave)
        if (endDate < currentDate) {
          console.log(`Processing past leave - endDate ${endDate.toISOString().split('T')[0]} is before current date ${currentDate.toISOString().split('T')[0]}`);

          // Find the attendance record for this employee
          const attendance = await this.prisma.attendance.findFirst({
            where: { employeeId: leaveLog.empId }
          });

          if (attendance) {
            const currentAbsentDays = attendance.absentDays || 0;
            const currentLeaveDays = attendance.leaveDays || 0;
            const currentQuarterlyLeaves = attendance.quarterlyLeaves || 0;

            // 1. Update attendance table
            await this.prisma.attendance.update({
              where: { id: attendance.id },
              data: {
                absentDays: Math.max(0, currentAbsentDays - totalLeaveDays),
                leaveDays: currentLeaveDays + totalLeaveDays,
                quarterlyLeaves: Math.max(0, currentQuarterlyLeaves - totalLeaveDays)
              }
            });

            console.log(`Updated attendance: -${totalLeaveDays} absent, +${totalLeaveDays} leave, -${totalLeaveDays} quarterly`);

            // 2. Update monthly attendance summary table
            await this.updateMonthlyAttendanceForLeave(leaveLog.empId, startDate, endDate, totalLeaveDays, totalLeaveDays);

            // 3. Update attendance logs table - change status from absent to leave
            const currentDateForLogs = new Date(startDate);
            while (currentDateForLogs <= endDate) {
              const logDate = currentDateForLogs.toISOString().split('T')[0];

              // Check if attendance log exists for this date
              const existingLog = await this.prisma.attendanceLog.findFirst({
                where: {
                  employeeId: leaveLog.empId,
                  date: new Date(logDate)
                }
              });

              if (existingLog) {
                // Update existing log to leave status
                await this.prisma.attendanceLog.update({
                  where: { id: existingLog.id },
                  data: {
                    status: 'leave',
                    checkin: null,
                    checkout: null
                  }
                });
                console.log(`Updated existing log for ${logDate} to leave status`);
              } else {
                // Create new attendance log with leave status
                await this.prisma.attendanceLog.create({
                  data: {
                    employeeId: leaveLog.empId,
                    date: new Date(logDate),
                    checkin: null,
                    checkout: null,
                    mode: 'onsite',
                    status: 'leave'
                  }
                });
                console.log(`Created new leave log for ${logDate}`);
              }

              // Move to next day
              currentDateForLogs.setDate(currentDateForLogs.getDate() + 1);
            }
          }
        }
        // Condition 2: If startDate >= current date (future leave) - DO NOTHING
        else {
          console.log(`Future leave - startDate ${startDate.toISOString().split('T')[0]} is >= current date ${currentDate.toISOString().split('T')[0]}, doing nothing`);
        }
      }
      // If action is 'Rejected', no action needed as per your requirement

      return {
        leave_log_id: updatedLeaveLog.id,
        emp_id: updatedLeaveLog.empId,
        employee_name: `${updatedLeaveLog.employee.firstName} ${updatedLeaveLog.employee.lastName}`,
        leave_type: updatedLeaveLog.leaveType,
        start_date: updatedLeaveLog.startDate.toISOString().split('T')[0],
        end_date: updatedLeaveLog.endDate.toISOString().split('T')[0],
        reason: updatedLeaveLog.reason,
        status: updatedLeaveLog.status || 'Pending',
        applied_on: updatedLeaveLog.appliedOn.toISOString(),
        reviewed_by: updatedLeaveLog.reviewedBy,
        reviewer_name: updatedLeaveLog.reviewer ? `${updatedLeaveLog.reviewer.firstName} ${updatedLeaveLog.reviewer.lastName}` : null,
        reviewed_on: updatedLeaveLog.reviewedOn ? updatedLeaveLog.reviewedOn.toISOString() : null,
        confirmation_reason: updatedLeaveLog.confirmationReason,
        created_at: updatedLeaveLog.createdAt.toISOString(),
        updated_at: updatedLeaveLog.updatedAt.toISOString()
      };
    } catch (error) {
      console.error('Error in processLeaveAction:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(`Failed to process leave action: ${error.message}`);
    }
  }

  // Helper function to calculate leave days accurately by looping through dates
  private calculateLeaveDays(startDate: Date, endDate: Date): number {
    let count = 0;
    const currentDate = new Date(startDate);

    // Loop through each day from start to end (inclusive)
    while (currentDate <= endDate) {
      count++;
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return count;
  }

  // Helper function to update monthly attendance for cross-month leaves
  private async updateMonthlyAttendanceForLeave(empId: number, startDate: Date, endDate: Date, totalLeaveDays: number, allowedDaysForMonthly: number): Promise<void> {
    const monthlyDays = new Map<string, number>();

    // Count the actual days per month
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const monthKey = currentDate.toISOString().slice(0, 7); // YYYY-MM format
      monthlyDays.set(monthKey, (monthlyDays.get(monthKey) || 0) + 1);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    console.log(`Leave spans months:`, Object.fromEntries(monthlyDays));
    console.log(`Total leave days: ${totalLeaveDays}`);

    // Update each affected month with the actual days that fall in that month
    for (const [month, daysInMonth] of monthlyDays) {
      await this.prisma.monthlyAttendanceSummary.updateMany({
        where: {
          empId: empId,
          month: month
        },
        data: {
          totalAbsent: {
            decrement: daysInMonth
          },
          totalLeaveDays: {
            increment: daysInMonth
          }
        }
      });

      console.log(`Updated month ${month}: -${daysInMonth} absent, +${daysInMonth} leave days`);
    }
  }

  async autoMarkAbsent(): Promise<{ message: string; absent_marked: number; leave_applied: number }> {
    try {
      const currentDate = new Date();
      const today = currentDate.toISOString().split('T')[0]; // YYYY-MM-DD format
      const currentTime = currentDate.toTimeString().split(' ')[0]; // HH:MM:SS format

      console.log(`Auto-marking absent for date: ${today}, current time: ${currentTime}`);

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

      for (const employee of employees) {
        if (!employee.shiftStart) {
          console.log(`Employee ${employee.id} has no shift start time, skipping`);
          continue;
        }

        // Calculate deadline (shift start + absentTime from company settings)
        const shiftStartTime = employee.shiftStart;
        const [shiftHours, shiftMins] = shiftStartTime.split(':').map(Number);
        const deadlineTotalMinutes = shiftHours * 60 + shiftMins + absentTimeMinutes;
        const deadlineHours = Math.floor(deadlineTotalMinutes / 60);
        const deadlineMins = deadlineTotalMinutes % 60;
        
        // Handle midnight crossing: if deadline goes past 23:59, wrap to next day
        // For comparison, check if deadline has passed
        const deadlineHoursSameDay = deadlineHours % 24;
        const deadlineTime = `${deadlineHoursSameDay.toString().padStart(2, '0')}:${deadlineMins.toString().padStart(2, '0')}:00`;

        console.log(`Employee ${employee.id} (${employee.firstName} ${employee.lastName}) - Shift start: ${shiftStartTime}, AbsentTime: ${absentTimeMinutes}min, Deadline: ${deadlineTime}${deadlineHours >= 24 ? ' (next day)' : ''}`);

        // Check if current time is past the deadline
        // If deadline crossed midnight (deadlineHours >= 24), check if current time >= shiftStartTime (normalized to HH:MM:SS)
        // Otherwise, check if current time > deadlineTime
        const shiftStartTimeNormalized = shiftStartTime.includes(':') && shiftStartTime.split(':').length === 2 
          ? shiftStartTime + ':00' 
          : shiftStartTime;
        const hasDeadlinePassed = deadlineHours >= 24 
          ? currentTime >= shiftStartTimeNormalized 
          : currentTime > deadlineTime;
        
        if (hasDeadlinePassed) {
          // Check if employee already has attendance log for today
          const existingLog = await this.prisma.attendanceLog.findFirst({
            where: {
              employeeId: employee.id,
              date: new Date(today)
            }
          });

          if (existingLog) {
            console.log(`Employee ${employee.id} already has attendance log for today, skipping`);
            continue;
          }

          // Check if employee has approved leave for today
          const approvedLeave = await this.prisma.leaveLog.findFirst({
            where: {
              empId: employee.id,
              status: 'Approved',
              startDate: {
                lte: currentDate
              },
              endDate: {
                gte: currentDate
              }
            }
          });

          if (approvedLeave) {
            console.log(`Employee ${employee.id} has approved leave for today, applying leave instead of absent`);

            // Apply leave logic
            const attendance = await this.prisma.attendance.findFirst({
              where: { employeeId: employee.id }
            });

            if (attendance) {
              const currentLeaveDays = attendance.leaveDays || 0;
              const currentQuarterlyLeaves = attendance.quarterlyLeaves || 0;

              await this.prisma.attendance.update({
                where: { id: attendance.id },
                data: {
                  leaveDays: currentLeaveDays + 1,
                  quarterlyLeaves: Math.max(0, currentQuarterlyLeaves - 1)
                }
              });

              // Update monthly attendance summary
              const monthKey = today.substring(0, 7); // YYYY-MM format
              await this.prisma.monthlyAttendanceSummary.updateMany({
                where: {
                  empId: employee.id,
                  month: monthKey
                },
                data: {
                  totalLeaveDays: {
                    increment: 1
                  }
                }
              });

              // Create/update attendance log with leave status
              const existingLog = await this.prisma.attendanceLog.findFirst({
                where: {
                  employeeId: employee.id,
                  date: new Date(today)
                }
              });

              if (existingLog) {
                // Update existing log to leave status
                await this.prisma.attendanceLog.update({
                  where: { id: existingLog.id },
                  data: {
                    status: 'leave',
                    checkin: null,
                    checkout: null
                  }
                });
                console.log(`Updated existing log for employee ${employee.id} to leave status`);
              } else {
                // Create new attendance log with leave status
                await this.prisma.attendanceLog.create({
                  data: {
                    employeeId: employee.id,
                    date: new Date(today),
                    checkin: null,
                    checkout: null,
                    mode: 'onsite',
                    status: 'leave'
                  }
                });
                console.log(`Created new leave log for employee ${employee.id}`);
              }

              leaveApplied++;
              console.log(`Applied leave for employee ${employee.id}`);
            }
          } else {
            console.log(`Employee ${employee.id} has no approved leave, marking as absent`);

            // Mark as absent
            await this.prisma.attendanceLog.create({
              data: {
                employeeId: employee.id,
                date: new Date(today),
                checkin: null,
                checkout: null,
                mode: 'onsite',
                status: 'absent'
              }
            });

            // Update attendance table
            await this.updateBaseAttendance(employee.id, 'absent');

            // Update monthly attendance summary
            await this.updateMonthlyAttendanceSummary(employee.id, currentDate, 'absent');

            absentMarked++;
            console.log(`Marked absent for employee ${employee.id}`);
          }
        } else {
          console.log(`Employee ${employee.id} deadline not reached yet (${deadlineTime} > ${currentTime})`);
        }
      }

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
   * Bulk mark all active employees as present for a specific date
   * Updates attendance_logs, attendance, monthly_attendance_summary, and hr_logs tables
   */
  async bulkMarkAllEmployeesPresent(bulkMarkData: BulkMarkPresentDto): Promise<{ message: string; marked_present: number; errors: number; skipped: number }> {
    const { date, reason } = bulkMarkData;
    const targetDate = new Date(date);

    // Allow present and past dates, but not future dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    targetDate.setHours(0, 0, 0, 0);
    
    if (targetDate.getTime() > today.getTime()) {
      throw new BadRequestException('Bulk mark present is not allowed for future dates.');
    }

    // Get all active employees
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

    if (employees.length === 0) {
      throw new NotFoundException('No active employees found.');
    }

    let markedPresent = 0;
    let errors = 0;
    let skipped = 0;
    
    console.log(`Starting bulk mark present operation for ${employees.length} employees on ${date}`);
    
    const batchSize = 20; // Reduced from 50 to 20 for better performance
    console.log(`Processing ${employees.length} employees in batches of ${batchSize}`);
    
    for (let i = 0; i < employees.length; i += batchSize) {
      const batch = employees.slice(i, i + batchSize);
      const batchNumber = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(employees.length / batchSize);
      console.log(`Processing batch ${batchNumber}/${totalBatches} with ${batch.length} employees`);
    
      await this.prisma.$transaction(async (tx) => {
        for (const employee of batch) {
          try {
            const existingLog = await tx.attendanceLog.findFirst({
              where: {
                employeeId: employee.id,
                date: targetDate
              }
            });

            let wasAbsent = false; // Default to false for new records

            if (existingLog) {
              if (existingLog.status === 'present') {
                skipped++;
                continue;
              }
              wasAbsent = existingLog.status === 'absent';
              
              await tx.attendanceLog.update({
                where: { id: existingLog.id },
                data: {
                  status: 'present',
                  checkin: employee.shiftStart ? this.createShiftDateTime(targetDate, employee.shiftStart) : null,
                  checkout: employee.shiftEnd ? this.createShiftDateTime(targetDate, employee.shiftEnd) : null,
                  updatedAt: new Date()
                }
              });
                        } else {
              // For new records, check if this specific date was already counted as absent in the monthly summary
              // This handles cases where HR manually marked someone absent without creating an attendance log
              const monthYear = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}`;
              const monthlySummary = await tx.monthlyAttendanceSummary.findFirst({
                where: {
                  empId: employee.id,
                  month: monthYear
                }
              });
              
              if (monthlySummary && monthlySummary.totalAbsent > 0) {
                // Count actual absent records for this month
                const actualAbsentRecords = await tx.attendanceLog.count({
                  where: {
                    employeeId: employee.id,
                    status: 'absent',
                    date: {
                      gte: new Date(targetDate.getFullYear(), targetDate.getMonth(), 1),
                      lt: new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 1)
                    }
                  }
                });
                
                // If monthly summary shows more absents than actual records, this date was manually counted
                if (monthlySummary.totalAbsent > actualAbsentRecords) {
                  wasAbsent = true;
                }
              }
              
              await tx.attendanceLog.create({
                data: {
                  employeeId: employee.id,
                  date: targetDate,
                  status: 'present',
                  checkin: employee.shiftStart ? this.createShiftDateTime(targetDate, employee.shiftStart) : null,
                  checkout: employee.shiftEnd ? this.createShiftDateTime(targetDate, employee.shiftEnd) : null,
                  createdAt: new Date(),
                  updatedAt: new Date()
                }
              });
            }

            await this.updateAttendanceForBulkMarkPresent(tx, employee.id, targetDate, wasAbsent);
            await this.updateMonthlyAttendanceForBulkMarkPresent(tx, employee.id, targetDate, wasAbsent);
            
            markedPresent++;
          } catch (error) {
            console.error(`Error processing employee ${employee.id}:`, error);
            errors++;
          }
        }
      }, {
        timeout: 30000, // Increase timeout to 30 seconds
        maxWait: 10000  // Maximum wait time for transaction to start
      });
      
      // Add small delay between batches to prevent overwhelming the database
      if (i + batchSize < employees.length) {
        await new Promise(resolve => setTimeout(resolve, 100)); // 100ms delay
      }
    }
    
    console.log(`Bulk mark present operation completed. Marked: ${markedPresent}, Errors: ${errors}, Skipped: ${skipped}`);
    
    // Create a single HR log entry for the entire bulk operation
    await this.prisma.hRLog.create({
      data: {
        hrId: 1, // TODO: Get from authenticated user
        actionType: 'bulk_mark_present',
        affectedEmployeeId: null, // Set to null for bulk operations
        description: `Bulk marked ${markedPresent} employees present for ${date}${reason ? ` - Reason: ${reason}` : ''}`
      }
    });

    const message = `Bulk mark present completed for ${date}${reason ? ` - Reason: ${reason}` : ''}`;
    return { message, marked_present: markedPresent, errors, skipped };
  }

  /**
   * Helper method to update attendance table for bulk mark present
   */
  private async updateAttendanceForBulkMarkPresent(tx: any, employeeId: number, date: Date, wasAbsent: boolean = false): Promise<void> {
    // Find existing attendance record or create new one
    let attendance = await tx.attendance.findFirst({
      where: { employeeId }
    });

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
    }

    // Update present days and decrement absent days if any
    const updateData: any = {
      presentDays: (attendance.presentDays || 0) + 1
    };

    // Only decrement absent days if the employee was actually marked absent for this date
    if (wasAbsent && attendance.absentDays && attendance.absentDays > 0) {
      updateData.absentDays = Math.max(0, attendance.absentDays - 1);
    }

    await tx.attendance.update({
      where: { id: attendance.id },
      data: updateData
    });
  }

  /**
   * Helper method to update monthly attendance summary for bulk mark present
   */
  private async updateMonthlyAttendanceForBulkMarkPresent(tx: any, employeeId: number, date: Date, wasAbsent: boolean = false): Promise<void> {
    const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    // Find existing monthly summary or create new one
    let monthlySummary = await tx.monthlyAttendanceSummary.findFirst({
      where: {
        empId: employeeId,
        month: monthYear
      }
    });

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
    }

    // Update monthly summary (increment present, decrement absent if any)
    const updateData: any = {
      totalPresent: (monthlySummary.totalPresent || 0) + 1
    };

    // Only decrement absent count if the employee was actually marked absent for this date
    if (wasAbsent && monthlySummary.totalAbsent && monthlySummary.totalAbsent > 0) {
      updateData.totalAbsent = Math.max(0, monthlySummary.totalAbsent - 1);
    }

    await tx.monthlyAttendanceSummary.update({
      where: { id: monthlySummary.id },
      data: updateData
    });
  }

  /**
   * Helper method to create shift date time for a specific date
   */
  private createShiftDateTime(date: Date, timeString: string): Date {
    // Parse time string directly (e.g., "09:00" -> hours=9, minutes=0)
    const [hours, minutes] = timeString.split(':').map(Number);
    
    if (isNaN(hours) || isNaN(minutes)) {
      throw new Error(`Invalid time format: ${timeString}. Expected format: HH:MM`);
    }

    const shiftDateTime = new Date(date);
    shiftDateTime.setHours(hours, minutes, 0, 0);

    return shiftDateTime;
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

      console.log(`Created late log for employee ${employeeId} on ${logDate.toISOString().split('T')[0]}`);
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



  // Get Leave Logs Statistics
  async getLeaveLogsStats(query: LeaveLogsStatsDto): Promise<LeaveLogsStatsResponseDto> {
    try {
      // Build where clause
      const where: any = {};
      
      if (query.employee_id) {
        where.empId = query.employee_id;
      }

      if (query.start_date && query.end_date) {
        where.appliedOn = {
          gte: new Date(query.start_date),
          lte: new Date(query.end_date)
        };
      } else if (query.start_date) {
        where.appliedOn = {
          gte: new Date(query.start_date)
        };
      } else if (query.end_date) {
        where.appliedOn = {
          lte: new Date(query.end_date)
        };
      }

      // Get all leave logs for statistics
      const leaveLogs = await this.prisma.leaveLog.findMany({
        where,
        include: {
          employee: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        }
      });

      // Calculate basic statistics
      const totalLeaves = leaveLogs.length;
      const pendingLeaves = leaveLogs.filter(log => log.status === 'Pending').length;
      const approvedLeaves = leaveLogs.filter(log => log.status === 'Approved').length;
      const rejectedLeaves = leaveLogs.filter(log => log.status === 'Rejected').length;

      // Calculate total leave days
      const totalLeaveDays = leaveLogs.reduce((sum, log) => {
        return sum + this.calculateLeaveDays(log.startDate, log.endDate);
      }, 0);

      const averageLeaveDuration = totalLeaves > 0 ? totalLeaveDays / totalLeaves : 0;

      // Find most common leave type
      const leaveTypeCounts = leaveLogs.reduce((acc, log) => {
        const leaveType = log.leaveType || 'Unknown';
        acc[leaveType] = (acc[leaveType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const mostCommonLeaveType = Object.keys(leaveTypeCounts).length > 0 
        ? Object.keys(leaveTypeCounts).reduce((a, b) => 
            leaveTypeCounts[a] > leaveTypeCounts[b] ? a : b
          )
        : 'N/A';

      // Generate period statistics
      const periodStats = this.generatePeriodStats(leaveLogs, query.period || StatsPeriod.MONTHLY);

      const response: LeaveLogsStatsResponseDto = {
        total_leaves: totalLeaves,
        pending_leaves: pendingLeaves,
        approved_leaves: approvedLeaves,
        rejected_leaves: rejectedLeaves,
        total_leave_days: totalLeaveDays,
        average_leave_duration: Math.round(averageLeaveDuration * 100) / 100,
        most_common_leave_type: mostCommonLeaveType,
        period_stats: periodStats
      };

      // Add breakdowns if requested
      if (query.include_breakdown) {
        response.employee_breakdown = this.generateEmployeeBreakdown(leaveLogs);
        response.leave_type_breakdown = this.generateLeaveTypeBreakdown(leaveLogs);
      }

      return response;
    } catch (error) {
      console.error('Error in getLeaveLogsStats:', error);
      throw new InternalServerErrorException(`Failed to get leave logs statistics: ${error.message}`);
    }
  }

  // Generate period statistics
  private generatePeriodStats(leaveLogs: any[], period: StatsPeriod): PeriodStatsDto[] {
    const stats: PeriodStatsDto[] = [];
    const groupedLogs = this.groupLogsByPeriod(leaveLogs, period);

    Object.keys(groupedLogs).forEach(periodKey => {
      const logs = groupedLogs[periodKey];
      const totalLeaves = logs.length;
      const pendingLeaves = logs.filter(log => log.status === 'Pending').length;
      const approvedLeaves = logs.filter(log => log.status === 'Approved').length;
      const rejectedLeaves = logs.filter(log => log.status === 'Rejected').length;
      const totalDays = logs.reduce((sum, log) => sum + this.calculateLeaveDays(log.startDate, log.endDate), 0);

      stats.push({
        period: periodKey,
        total_leaves: totalLeaves,
        approved_leaves: approvedLeaves,
        rejected_leaves: rejectedLeaves,
        pending_leaves: pendingLeaves,
        total_days: totalDays
      });
    });

    return stats.sort((a, b) => a.period.localeCompare(b.period));
  }

  // Group logs by period
  private groupLogsByPeriod(leaveLogs: any[], period: StatsPeriod): Record<string, any[]> {
    const grouped: Record<string, any[]> = {};

    leaveLogs.forEach(log => {
      let periodKey: string;
      const date = new Date(log.appliedOn);

      switch (period) {
        case StatsPeriod.DAILY:
          periodKey = date.toISOString().split('T')[0];
          break;
        case StatsPeriod.WEEKLY:
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          periodKey = weekStart.toISOString().split('T')[0];
          break;
        case StatsPeriod.MONTHLY:
          periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        case StatsPeriod.YEARLY:
          periodKey = date.getFullYear().toString();
          break;
        default:
          periodKey = date.toISOString().split('T')[0];
      }

      if (!grouped[periodKey]) {
        grouped[periodKey] = [];
      }
      grouped[periodKey].push(log);
    });

    return grouped;
  }

  // Generate employee breakdown
  private generateEmployeeBreakdown(leaveLogs: any[]): EmployeeLeaveStatsDto[] {
    const employeeStats: Record<number, any> = {};

    leaveLogs.forEach(log => {
      if (!employeeStats[log.empId]) {
        employeeStats[log.empId] = {
          employee_id: log.empId,
          employee_name: `${log.employee.firstName} ${log.employee.lastName}`,
          total_leaves: 0,
          total_days: 0,
          approved_leaves: 0,
          rejected_leaves: 0,
          pending_leaves: 0
        };
      }

      const stats = employeeStats[log.empId];
      stats.total_leaves++;
      stats.total_days += this.calculateLeaveDays(log.startDate, log.endDate);

      if (log.status === 'Approved') stats.approved_leaves++;
      else if (log.status === 'Rejected') stats.rejected_leaves++;
      else stats.pending_leaves++;
    });

    return Object.values(employeeStats).sort((a, b) => b.total_leaves - a.total_leaves);
  }

  // Generate leave type breakdown
  private generateLeaveTypeBreakdown(leaveLogs: any[]): LeaveTypeStatsDto[] {
    const typeStats: Record<string, any> = {};

    leaveLogs.forEach(log => {
      const leaveType = log.leaveType || 'Unknown';
      if (!typeStats[leaveType]) {
        typeStats[leaveType] = {
          leave_type: leaveType,
          count: 0,
          total_days: 0,
          approved_count: 0
        };
      }

      const stats = typeStats[leaveType];
      stats.count++;
      stats.total_days += this.calculateLeaveDays(log.startDate, log.endDate);
      if (log.status === 'Approved') stats.approved_count++;
    });

    return Object.values(typeStats).map(stats => ({
      leave_type: stats.leave_type,
      count: stats.count,
      total_days: stats.total_days,
      approval_rate: stats.count > 0 ? Math.round((stats.approved_count / stats.count) * 100) : 0
    })).sort((a, b) => b.count - a.count);
  }
}
