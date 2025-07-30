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

  // Helper function to create PKT timezone-aware date for storage
  private createPKTDateForStorage(dateString: string, timeString: string): Date {
    // Parse the time input to get the time components
    const timeInput = new Date(timeString);
    const timeISOString = timeInput.toISOString();
    const timeMatch = timeISOString.match(/T(\d{2}):(\d{2}):(\d{2})/);
    
    if (!timeMatch) {
      throw new BadRequestException('Invalid time format');
    }
    
    const hours = parseInt(timeMatch[1], 10);
    const minutes = parseInt(timeMatch[2], 10);
    const seconds = parseInt(timeMatch[3], 10);
    
    // Create the date
    const date = new Date(dateString);
    
    // Set UTC time directly to ensure it stores as entered time
    // Since PKT is UTC+5, if we want to store 9:00 as 9:00, 
    // we set UTC time to 9:00 (which will display as 9:00)
    const pktDate = new Date(date);
    pktDate.setUTCHours(hours, minutes, seconds, 0);
    
    return pktDate;
  }

  // Helper function to create local time for calculations
  private createLocalTimeForCalculation(dateString: string, timeString: string): Date {
    const timeInput = new Date(timeString);
    const timeISOString = timeInput.toISOString();
    const timeMatch = timeISOString.match(/T(\d{2}):(\d{2}):(\d{2})/);
    
    if (!timeMatch) {
      throw new BadRequestException('Invalid time format');
    }
    
    const hours = parseInt(timeMatch[1], 10);
    const minutes = parseInt(timeMatch[2], 10);
    const seconds = parseInt(timeMatch[3], 10);
    
    // For calculations, we need to treat this as PKT time
    // So if input is 9:00, we want to compare it with shift times in PKT
    const date = new Date(dateString);
    date.setHours(hours, minutes, seconds, 0);
    
    return date;
  }

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

      // Create dates - one for storage (PKT timezone-aware) and one for calculations (local)
      const checkinTimeForStorage = this.createPKTDateForStorage(date, checkin);
      const checkinTimeForCalculation = this.createLocalTimeForCalculation(date, checkin);
      const checkinDatePKT = new Date(date);
      
      // Get employee's shift times (default to 9:00 AM - 5:00 PM if not set)
      const shiftStart = employee.shiftStart || '09:00';
      const shiftEnd = employee.shiftEnd || '17:00';
      const [shiftStartHour, shiftStartMinute] = shiftStart.split(':').map(Number);
      const [shiftEndHour, shiftEndMinute] = shiftEnd.split(':').map(Number);
      
      // Create expected shift times for this date (for calculation purposes)
      const expectedShiftStart = new Date(checkinDatePKT);
      expectedShiftStart.setHours(shiftStartHour, shiftStartMinute, 0, 0);
      
      const expectedShiftEnd = new Date(checkinDatePKT);
      expectedShiftEnd.setHours(shiftEndHour, shiftEndMinute, 0, 0);

      // Calculate minutes late from shift start using local calculation time
      const minutesLate = Math.floor((checkinTimeForCalculation.getTime() - expectedShiftStart.getTime()) / (1000 * 60));
      
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
      }

      // Create or update attendance log using the PKT timezone-aware time for storage
      const attendanceLog = await this.prisma.attendanceLog.upsert({
        where: {
          id: existingCheckin?.id || 0
        },
        update: {
          checkin: checkinTimeForStorage, // This will store as 9:00 if entered as 9:00
          mode: mode || null,
          status,
          updatedAt: new Date()
        },
        create: {
          employeeId,
          date: checkinDatePKT,
          checkin: checkinTimeForStorage, // This will store as 9:00 if entered as 9:00
          mode: mode || null,
          status
        }
      });

      // Update monthly attendance summary
      await this.updateMonthlyAttendanceSummary(employeeId, checkinDatePKT, status);

      // Update base attendance table (lifetime records)
      await this.updateBaseAttendance(employeeId, status);

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

      // Create checkout time for storage (PKT timezone-aware)
      const checkoutTimeForStorage = this.createPKTDateForStorage(date, checkout);

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
}