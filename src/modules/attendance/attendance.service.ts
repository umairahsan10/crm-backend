import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
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
             date: new Date(date),
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
             const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
             await this.prisma.monthlyAttendanceSummary.updateMany({
               where: {
                 empId: halfDayLog.empId,
                 month: currentMonth
               },
               data: {
                 totalHalfDays: {
                   decrement: 1
                 }
               }
             });

             // Include the updated attendance values in response
             attendanceUpdates = {
               half_days: updatedAttendance.halfDays || 0,
               monthly_half_days: 0 // Not tracked in Attendance model, only in MonthlyAttendanceSummary
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
           status: log.status,
           applied_on: log.appliedOn.toISOString(),
           reviewed_by: log.reviewedBy,
           reviewer_name: log.reviewer ? `${log.reviewer.firstName} ${log.reviewer.lastName}` : null,
           reviewed_on: log.reviewedOn ? log.reviewedOn.toISOString() : null,
           confirmation_reason: log.confirmationReason,
           is_half_day: log.isHalfDay,
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
           status: log.status,
           applied_on: log.appliedOn.toISOString(),
           reviewed_by: log.reviewedBy,
           reviewer_name: log.reviewer ? `${log.reviewer.firstName} ${log.reviewer.lastName}` : null,
           reviewed_on: log.reviewedOn ? log.reviewedOn.toISOString() : null,
           confirmation_reason: log.confirmationReason,
           is_half_day: log.isHalfDay,
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

         // Create the leave log with status automatically set to 'Pending'
         const leaveLog = await this.prisma.leaveLog.create({
           data: {
             empId: leaveData.emp_id,
             leaveType: leaveData.leave_type,
             startDate: startDate,
             endDate: endDate,
             reason: leaveData.reason,
             status: 'Pending', // Automatically set to pending
             isHalfDay: leaveData.is_half_day,
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
           status: leaveLog.status,
           applied_on: leaveLog.appliedOn.toISOString(),
           reviewed_by: leaveLog.reviewedBy,
           reviewer_name: leaveLog.reviewer ? `${leaveLog.reviewer.firstName} ${leaveLog.reviewer.lastName}` : null,
           reviewed_on: leaveLog.reviewedOn ? leaveLog.reviewedOn.toISOString() : null,
           confirmation_reason: leaveLog.confirmationReason,
           is_half_day: leaveLog.isHalfDay,
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

   }