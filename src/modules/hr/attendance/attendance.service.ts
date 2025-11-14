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
import { BulkCheckoutDto } from './dto/bulk-checkout.dto';
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

      // Derive initial business date (YYYY-MM-DD) from local time
      const localDateStr = `${checkinLocal.getUTCFullYear()}-${String(checkinLocal.getUTCMonth() + 1).padStart(2, '0')}-${String(checkinLocal.getUTCDate()).padStart(2, '0')}`;
      let initialBusinessDate = new Date(localDateStr);

      // Use computed local time for storage and calculations
      const checkinTimeForStorage = checkinLocal;
      const checkinTimeForCalculation = checkinLocal;

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

      // Determine the correct business date for this employee (same logic as bulk-mark-present)
      // For night shifts (shiftEnd < shiftStart), if current time is before shift end,
      // the business date should be the previous day (when the shift started)
      let checkinDatePKT = new Date(initialBusinessDate);
      const currentHour = checkinTimeForCalculation.getUTCHours();
      const currentMinute = checkinTimeForCalculation.getUTCMinutes();
      
      // If it's a night shift (crosses midnight)
      if (shiftEndHour < shiftStartHour) {
        // If current time is before shift end (e.g., 01:00 AM when shift end is 05:00 AM)
        // then this is the previous day's shift
        if (currentHour < shiftEndHour || (currentHour === shiftEndHour && currentMinute <= shiftEndMinute)) {
          // Use previous day as business date
          checkinDatePKT = new Date(initialBusinessDate);
          checkinDatePKT.setDate(checkinDatePKT.getDate() - 1);
          console.log(`Night shift: Using previous day (${checkinDatePKT.toISOString().split('T')[0]}) for employee ${employeeId}`);
        }
      }

      // Check if already checked in for this business date
      // Also check adjacent dates for night shifts (before and after the calculated date)
      const prevDate = new Date(checkinDatePKT);
      prevDate.setDate(prevDate.getDate() - 1);
      const nextDate = new Date(checkinDatePKT);
      nextDate.setDate(nextDate.getDate() + 1);
      
      const existingCheckin = await this.prisma.attendanceLog.findFirst({
        where: {
          employeeId,
          OR: [
            { date: checkinDatePKT },
            { date: prevDate },
            { date: nextDate }
          ]
        }
      });

      if (existingCheckin && existingCheckin.checkin) {
        throw new BadRequestException('Employee already checked in for this date');
      }
      
      // Check if there's an absent log that needs to be converted to half-day
      // This happens when employee was marked absent by cron but checks in late (within half-time threshold)
      const wasAbsent = existingCheckin && existingCheckin.status === 'absent' && !existingCheckin.checkin;

      // Create expected shift start for the correct business date
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
      
      // Handle night shifts that cross midnight (adjust calculation if needed)
      if (shiftEndHour < shiftStartHour) {
        // If we're using previous day's date and minutesLate is negative, add 24 hours
        // This means the shift started yesterday and we're calculating from today's time
        if (minutesLate < 0) {
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

      // Handle absent → half-day conversion if needed
      // If employee was marked absent by cron but is checking in within half-time threshold, convert to half-day
      // This must be done in a transaction to ensure data consistency and handle night shifts correctly
      if (wasAbsent && status === 'half_day') {
        console.log(`Converting absent log to half-day for employee ${employeeId} on ${checkinDatePKT.toISOString().split('T')[0]}`);
        
        return await this.prisma.$transaction(async (tx) => {
          // Delete the absent log (use the date from existingCheckin to handle night shifts correctly)
          const absentLogDate = existingCheckin.date instanceof Date 
            ? existingCheckin.date 
            : (existingCheckin.date ? new Date(existingCheckin.date) : checkinDatePKT);
          
          await tx.attendanceLog.delete({
            where: { id: existingCheckin.id }
          });
          
          // Update counters: decrement absent, increment half-day
          await this.updateAttendanceCountersForStatusChange(tx, employeeId, 'absent', 'half_day');
          await this.updateMonthlyAttendanceSummaryForStatusChange(tx, employeeId, absentLogDate, 'absent', 'half_day');
          
          // Create new half-day log with check-in (use checkinDatePKT which is correctly calculated)
          const attendanceLog = await tx.attendanceLog.create({
            data: {
              employeeId,
              date: checkinDatePKT,
              checkin: checkinTimeForStorage,
              mode: mode || null,
              status: 'half_day'
            }
          });
          
          // Create half-day log entry
          const checkinTimeString = checkin.split('T')[1];
          const timeParts = checkinTimeString.split(':');
          const hours = parseInt(timeParts[0], 10);
          const minutes = parseInt(timeParts[1], 10);
          const actualTimeIn = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
          
          await tx.halfDayLog.create({
            data: {
              empId: employeeId,
              date: checkinDatePKT,
              scheduledTimeIn: shiftStart,
              actualTimeIn: actualTimeIn,
              minutesLate: minutesLate,
              reason: null,
              actionTaken: 'Created',
              halfDayType: null,
              justified: null
            }
          });
          
          console.log(`Successfully converted absent to half-day for employee ${employeeId} on ${checkinDatePKT.toISOString().split('T')[0]}`);
          
          return {
            id: attendanceLog.id,
            employee_id: attendanceLog.employeeId,
            date: attendanceLog.date?.toISOString().split('T')[0] || null,
            checkin: attendanceLog.checkin?.toISOString() || null,
            checkin_local: checkinTimeForCalculation?.toISOString() || null,
            mode: attendanceLog.mode,
            status: 'half_day' as const,
            late_details: lateDetails,
            timezone: timezone || 'Asia/Karachi',
            offset_minutes: effectiveOffsetMinutes,
            local_date: localDateStr,
            created_at: attendanceLog.createdAt.toISOString(),
            updated_at: attendanceLog.updatedAt.toISOString()
          };
        });
      }

      // Normal check-in flow (no absent conversion)
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
        const localDateStr = `${checkoutLocal.getUTCFullYear()}-${String(checkoutLocal.getUTCMonth() + 1).padStart(2, '0')}-${String(checkoutLocal.getUTCDate()).padStart(2, '0')}`;
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
      const checkoutTimeForStorage = checkoutLocal;

      // Calculate total hours worked using the stored times
      const checkinTime = existingAttendance.checkin;
      const totalMilliseconds = checkoutTimeForStorage.getTime() - checkinTime.getTime();
      const totalHoursWorked = Math.round((totalMilliseconds / (1000 * 60 * 60)) * 100) / 100; // Round to 2 decimal places

      // Get local date string for response
      const localDateStr = `${checkoutLocal.getUTCFullYear()}-${String(checkoutLocal.getUTCMonth() + 1).padStart(2, '0')}-${String(checkoutLocal.getUTCDate()).padStart(2, '0')}`;

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
    const { date, employee_ids, reason } = bulkMarkData;

    // Get current time in PKT (following checkin pattern)
    const now = new Date();
    const nowPkt = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Karachi' }));
    
    // Compute local time using PKT offset (+300 minutes = UTC+5)
    const effectiveOffsetMinutes = 300; // PKT UTC+5
    const currentTimeLocal = new Date(now.getTime() + effectiveOffsetMinutes * 60 * 1000);
    
    // Derive local business date (YYYY-MM-DD) from local time (following checkin pattern)
    const localDateStr = `${currentTimeLocal.getUTCFullYear()}-${String(currentTimeLocal.getUTCMonth() + 1).padStart(2, '0')}-${String(currentTimeLocal.getUTCDate()).padStart(2, '0')}`;
    const businessDateLocal = new Date(localDateStr);
    
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
      // Use current PKT business date as default
      targetBusinessDate = new Date(businessDateLocal);
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
    // Use current PKT time as checkin time for bulk operations
    // Note: For past dates, this represents when the bulk mark operation is performed, not the actual checkin time
    const checkinTimeForStorage = currentTimeLocal;
    
    console.log(`Starting bulk checkin operation for ${employees.length} employee(s) on ${dateStr} at ${checkinTimeForStorage.toISOString()}`);
    
    // OPTIMIZATION: Pre-process all employees to calculate their data upfront
    const currentHour = checkinTimeForStorage.getUTCHours();
    const currentMinute = checkinTimeForStorage.getUTCMinutes();
    const employeeIds = employees.map(emp => emp.id);
    
    // Pre-calculate all employee data (status, dates, minutes late)
    interface EmployeeProcessData {
      employee: typeof employees[0];
      businessDate: Date;
      status: 'present' | 'late' | 'half_day' | 'absent';
      minutesLate: number;
      shiftStart: string;
      actualTimeIn: string;
    }
    
    const employeeDataMap = new Map<number, EmployeeProcessData>();
    
    for (const employee of employees) {
      try {
        const shiftStart = employee.shiftStart || '09:00';
        const shiftEnd = employee.shiftEnd || '17:00';
        
        // Handle shift times that might be stored as just hours
        const shiftStartParts = shiftStart.split(':');
        const shiftEndParts = shiftEnd.split(':');
        const shiftStartHour = parseInt(shiftStartParts[0], 10);
        const shiftStartMinute = shiftStartParts[1] ? parseInt(shiftStartParts[1], 10) : 0;
        const shiftEndHour = parseInt(shiftEndParts[0], 10);
        const shiftEndMinute = shiftEndParts[1] ? parseInt(shiftEndParts[1], 10) : 0;
        
        // Determine the correct business date for this employee
        let employeeBusinessDate = new Date(targetBusinessDate);
        
        if (date) {
          // User provided an explicit date - use it as-is
          employeeBusinessDate = new Date(targetBusinessDate);
        } else {
          // No explicit date provided - apply night shift logic
          if (shiftEndHour < shiftStartHour) {
            if (currentHour < shiftEndHour || (currentHour === shiftEndHour && currentMinute <= shiftEndMinute)) {
              employeeBusinessDate = new Date(Date.UTC(
                targetBusinessDate.getUTCFullYear(),
                targetBusinessDate.getUTCMonth(),
                targetBusinessDate.getUTCDate() - 1
              ));
            }
          }
        }
        
        // Create expected shift start for the employee's business date
        const expectedShiftStart = new Date(employeeBusinessDate);
        expectedShiftStart.setUTCHours(shiftStartHour, shiftStartMinute, 0, 0);
        
        // Calculate minutes late from shift start
        let minutesLate = Math.floor((checkinTimeForStorage.getTime() - expectedShiftStart.getTime()) / (1000 * 60));
        
        // Handle night shifts that cross midnight
        if (shiftEndHour < shiftStartHour && minutesLate < 0) {
          minutesLate = minutesLate + (24 * 60);
        }
        
        // Normalize negative minutes
        if (minutesLate < 0) {
          minutesLate = 0;
        }
        
        // Determine status based on company policy
        let status: 'present' | 'late' | 'half_day' | 'absent' = 'present';
        if (minutesLate === 0) {
          status = 'present';
        } else if (minutesLate > 0) {
          if (minutesLate <= lateTime) {
            status = 'present';
          } else if (minutesLate > lateTime && minutesLate <= halfTime) {
            status = 'late';
          } else if (minutesLate > halfTime && minutesLate <= absentTime) {
            status = 'half_day';
          } else {
            status = 'absent';
          }
        }
        
        const actualTimeIn = `${checkinTimeForStorage.getUTCHours().toString().padStart(2, '0')}:${checkinTimeForStorage.getUTCMinutes().toString().padStart(2, '0')}`;
        
        employeeDataMap.set(employee.id, {
          employee,
          businessDate: employeeBusinessDate,
          status,
          minutesLate,
          shiftStart,
          actualTimeIn
        });
      } catch (error) {
        console.error(`Error pre-processing employee ${employee.id}:`, error);
        errors++;
      }
    }
    
    // OPTIMIZATION: Pre-fetch all existing logs in ONE query instead of per-employee
    // Get all unique business dates to query (use date range to handle all dates)
    const allBusinessDates = Array.from(employeeDataMap.values()).map(d => d.businessDate);
    const minDate = new Date(Math.min(...allBusinessDates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...allBusinessDates.map(d => d.getTime())));
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
        const logKey = `${employeeId}_${empData.businessDate.getTime()}`;
        const existingLog = existingLogsMap.get(logKey);
        
        if (existingLog) {
          // Check if we should skip (already has checkin and same status)
          if (existingLog.checkin && existingLog.status === empData.status) {
            skipped++;
            continue;
          }
          
          // Update existing log
          logsToUpdate.push({
            id: existingLog.id,
            checkin: checkinTimeForStorage,
            status: empData.status
          });
          
          const wasAbsent = existingLog.status === 'absent';
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
          
          // Create new log
          logsToCreate.push({
            employeeId,
            date: empData.businessDate,
            checkin: checkinTimeForStorage,
            checkout: null,
            mode: 'onsite',
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
        const logKey = `${update.employeeId}_${update.businessDate.getTime()}`;
        const existingLog = existingLogsMap.get(logKey);
        if (existingLog) {
          batchLogIds.add(existingLog.id);
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
                    mode: 'onsite',
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
    const { date, employee_ids, reason, timezone, offset_minutes } = bulkCheckoutData;

    // Get current time in PKT (following checkout pattern)
    const now = new Date();
    const effectiveOffsetMinutes = Number.isFinite(offset_minutes as any)
      ? Number(offset_minutes)
      : 300; // Default to PKT UTC+5
    
    const checkoutTimeLocal = new Date(now.getTime() + effectiveOffsetMinutes * 60 * 1000);
    
    // Derive local business date (YYYY-MM-DD) from local time
    const localDateStr = `${checkoutTimeLocal.getUTCFullYear()}-${String(checkoutTimeLocal.getUTCMonth() + 1).padStart(2, '0')}-${String(checkoutTimeLocal.getUTCDate()).padStart(2, '0')}`;
    const businessDateLocal = new Date(localDateStr);
    
    // Determine target date: use provided date or default to current PKT business date
    let targetBusinessDate: Date;
    if (date) {
      // Parse the date string and create a date at midnight in local timezone
      // This ensures we match dates stored in the database correctly
      const dateParts = date.split('-');
      if (dateParts.length !== 3) {
        throw new BadRequestException('Invalid date format. Expected YYYY-MM-DD');
      }
      // Create date in local timezone (PKT) to match database storage
      targetBusinessDate = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
      targetBusinessDate.setHours(0, 0, 0, 0);
    } else {
      targetBusinessDate = new Date(businessDateLocal);
    }

    // Build query to find attendance logs with checkin but no checkout
    // Query by date range to handle timezone differences
    const dateStart = new Date(targetBusinessDate);
    dateStart.setHours(0, 0, 0, 0);
    const dateEnd = new Date(targetBusinessDate);
    dateEnd.setHours(23, 59, 59, 999);
    
    const attendanceWhere: any = {
      checkin: { not: null },
      checkout: null,
      date: {
        gte: dateStart,
        lte: dateEnd
      }
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
        ? `No employees found with active check-ins for the provided employee IDs: ${employee_ids.join(', ')} on ${targetBusinessDate.toISOString().split('T')[0]}`
        : `No employees found with active check-ins on ${targetBusinessDate.toISOString().split('T')[0]}`;
      throw new NotFoundException(message);
    }

    console.log(`Bulk checkout: Processing ${attendanceLogs.length} employee(s) for date ${targetBusinessDate.toISOString().split('T')[0]}`);

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
      const date = log.date || targetBusinessDate;
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
    const dateStr = targetBusinessDate.toISOString().split('T')[0];
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
            // Create shift start and end dates for calculation
            const shiftStartDate = new Date(targetBusinessDate);
            shiftStartDate.setUTCHours(shiftStartHour, shiftStartMinute, 0, 0);
            
            const shiftEndDate = new Date(targetBusinessDate);
            shiftEndDate.setUTCHours(shiftEndHour, shiftEndMinute, 0, 0);
            
            // Handle night shifts (crossing midnight)
            if (shiftEndHour < shiftStartHour || (shiftEndHour === shiftStartHour && shiftEndMinute < shiftStartMinute)) {
              shiftEndDate.setDate(shiftEndDate.getDate() + 1);
            }

            const shiftDurationMs = shiftEndDate.getTime() - shiftStartDate.getTime();
            const shiftDurationHours = shiftDurationMs / (1000 * 60 * 60);

            // Calculate worked hours from checkin to checkout
            const checkinTime = log.checkin!;
            const checkoutTimeForStorage = checkoutTimeLocal;
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
              const logDate = log.date || targetBusinessDate;
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
   * Helper method to update attendance table for bulk mark present
   * Handles status-based updates and absent->present conversion
   */
  private async updateAttendanceForBulkMarkPresent(
    tx: any, 
    employeeId: number, 
    date: Date, 
    wasAbsent: boolean = false,
    status: 'present' | 'late' | 'half_day' | 'absent' = 'present'
  ): Promise<void> {
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

    // Update counters based on status
    const updateData: any = {};

    // Handle status-specific counters
    if (status === 'absent') {
      // If marking as absent, increment absent days
      updateData.absentDays = (attendance.absentDays || 0) + 1;
      // Don't increment present days for absent status
    } else {
      // For present/late/half_day, increment present days
      updateData.presentDays = (attendance.presentDays || 0) + 1;
      
      if (status === 'late') {
        updateData.lateDays = (attendance.lateDays || 0) + 1;
        // Decrement monthly lates if available (following checkin pattern)
        if ((attendance.monthlyLates ?? 0) > 0) {
          updateData.monthlyLates = Math.max(0, (attendance.monthlyLates ?? 0) - 1);
        }
      } else if (status === 'half_day') {
        updateData.halfDays = (attendance.halfDays || 0) + 1;
      }
      
      // Only decrement absent days if the employee was actually marked absent for this date
      // and we're now marking them as present/late/half_day
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
   * Helper method to update monthly attendance summary for bulk mark present
   * Handles status-based updates and absent->present conversion
   */
  private async updateMonthlyAttendanceForBulkMarkPresent(
    tx: any, 
    employeeId: number, 
    date: Date, 
    wasAbsent: boolean = false,
    status: 'present' | 'late' | 'half_day' | 'absent' = 'present'
  ): Promise<void> {
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

    // Update monthly summary based on status
    const updateData: any = {};

    // Handle status-specific counters
    if (status === 'absent') {
      // If marking as absent, increment absent count
      updateData.totalAbsent = (monthlySummary.totalAbsent || 0) + 1;
      // Don't increment present count for absent status
    } else {
      // For present/late/half_day, increment present count
      updateData.totalPresent = (monthlySummary.totalPresent || 0) + 1;
      
      if (status === 'late') {
        updateData.totalLateDays = (monthlySummary.totalLateDays || 0) + 1;
      } else if (status === 'half_day') {
        updateData.totalHalfDays = (monthlySummary.totalHalfDays || 0) + 1;
      }
      
      // Only decrement absent count if the employee was actually marked absent for this date
      // and we're now marking them as present/late/half_day
      if (wasAbsent && monthlySummary.totalAbsent && monthlySummary.totalAbsent > 0) {
        updateData.totalAbsent = Math.max(0, monthlySummary.totalAbsent - 1);
      }
    }

    await tx.monthlyAttendanceSummary.update({
      where: { id: monthlySummary.id },
      data: updateData
    });
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

  /**
   * Creates a shift datetime from date and time string, handling PKT timezone consistently
   * with check-in logic. Uses UTC setters to ensure proper date/time handling.
   */
  private createShiftDateTime(date: Date, timeString: string): Date {
    // Handle time strings that might be just hours (e.g., '21' instead of '21:00')
    const timeParts = timeString.split(':');
    const hours = parseInt(timeParts[0], 10);
    const minutes = timeParts[1] ? parseInt(timeParts[1], 10) : 0;
    
    if (isNaN(hours) || hours < 0 || hours > 23 || isNaN(minutes) || minutes < 0 || minutes > 59) {
      throw new Error(`Invalid time format: ${timeString}. Expected format: HH:MM or HH`);
    }

    // Create datetime using UTC setters for consistency with check-in logic
    // This ensures the time is set correctly regardless of server timezone
    const shiftDateTime = new Date(date);
    shiftDateTime.setUTCHours(hours, minutes, 0, 0);

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
