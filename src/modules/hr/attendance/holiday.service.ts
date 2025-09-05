import { Injectable, BadRequestException, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { CreateHolidayDto } from './dto/create-holiday.dto';
import { HolidayResponseDto } from './dto/holiday-response.dto';
import { HolidayCreationResponseDto } from './dto/holiday-creation-response.dto';

@Injectable()
export class HolidayService {
  private readonly logger = new Logger(HolidayService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new holiday
   * Only HR and Admin can create holidays
   */
  async createHoliday(createHolidayDto: CreateHolidayDto, userId: number, userType: string): Promise<HolidayCreationResponseDto> {
    try {
      // Check if holiday already exists on the same date
      const existingHoliday = await this.prisma.holiday.findFirst({
        where: {
          holidayDate: new Date(createHolidayDto.holidayDate)
        }
      });

      if (existingHoliday) {
        throw new ConflictException(`Holiday already exists on ${createHolidayDto.holidayDate}`);
      }

      // Create the holiday
      const holiday = await this.prisma.holiday.create({
        data: {
          holidayName: createHolidayDto.holidayName,
          holidayDate: new Date(createHolidayDto.holidayDate),
          description: createHolidayDto.description
        }
      });

      // Check if this is a past date holiday (emergency/sudden holiday)
      const holidayDate = new Date(createHolidayDto.holidayDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      holidayDate.setHours(0, 0, 0, 0);

      if (holidayDate <= today) {
        // This is a past date holiday - need to adjust attendance records
        await this.adjustAttendanceForPastHoliday(holidayDate, userId, userType);
      }

      // Create HR log entry only for HR users
      if (userType === 'hr') {
        await this.createHrLog(userId, 'holiday_created', null, `Holiday "${createHolidayDto.holidayName}" created for ${createHolidayDto.holidayDate}${holidayDate <= today ? ' (Past date - attendance adjusted)' : ''}`);
      }

      // Return response with attendance adjustment info
      const response = this.mapToResponseDto(holiday);
      if (holidayDate <= today) {
        // Add attendance adjustment information
        const activeEmployees = await this.prisma.employee.count({
          where: { status: 'active' }
        });
        return {
          ...response,
          attendanceAdjusted: true,
          employeesAffected: activeEmployees,
          message: `Holiday created and attendance adjusted for ${activeEmployees} active employees`
        };
      }

      return response;
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new BadRequestException('Failed to create holiday');
    }
  }

  /**
   * Get all holidays with optional filtering
   * All employees can view holidays
   */
  async getAllHolidays(
    year?: number,
    month?: number
  ): Promise<HolidayResponseDto[]> {
    try {
      let whereClause: any = {};

      // Filter by year if provided
      if (year) {
        whereClause.holidayDate = {
          gte: new Date(year, 0, 1), // January 1st of the year
          lt: new Date(year + 1, 0, 1) // January 1st of next year
        };
      }

      // Filter by month if provided (requires year to be provided)
      if (month && year) {
        whereClause.holidayDate = {
          gte: new Date(year, month - 1, 1), // First day of the month
          lt: new Date(year, month, 1) // First day of next month
        };
      }

      const holidays = await this.prisma.holiday.findMany({
        where: whereClause,
        orderBy: {
          holidayDate: 'asc'
        }
      });

      return holidays.map(holiday => this.mapToResponseDto(holiday));
    } catch (error) {
      throw new BadRequestException('Failed to fetch holidays');
    }
  }

  /**
   * Get a specific holiday by ID
   * All employees can view individual holidays
   */
  async getHolidayById(holidayId: number): Promise<HolidayResponseDto> {
    try {
      const holiday = await this.prisma.holiday.findUnique({
        where: { holidayId }
      });

      if (!holiday) {
        throw new NotFoundException(`Holiday with ID ${holidayId} not found`);
      }

      return this.mapToResponseDto(holiday);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to fetch holiday');
    }
  }

  /**
   * Get upcoming holidays
   * All employees can view upcoming holidays
   */
  async getUpcomingHolidays(limit: number = 10): Promise<HolidayResponseDto[]> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const upcomingHolidays = await this.prisma.holiday.findMany({
        where: {
          holidayDate: {
            gte: today
          }
        },
        orderBy: {
          holidayDate: 'asc'
        },
        take: limit
      });

      return upcomingHolidays.map(holiday => this.mapToResponseDto(holiday));
    } catch (error) {
      throw new BadRequestException('Failed to fetch upcoming holidays');
    }
  }

  /**
   * Check if a specific date is a holiday
   * All employees can check holiday status
   */
  async isHoliday(date: string): Promise<{ isHoliday: boolean; holiday?: HolidayResponseDto }> {
    try {
      const checkDate = new Date(date);
      checkDate.setHours(0, 0, 0, 0);

      const holiday = await this.prisma.holiday.findFirst({
        where: {
          holidayDate: checkDate
        }
      });

      if (holiday) {
        return {
          isHoliday: true,
          holiday: this.mapToResponseDto(holiday)
        };
      }

      return {
        isHoliday: false
      };
    } catch (error) {
      throw new BadRequestException('Failed to check holiday status');
    }
  }

  /**
   * Check if a specific date is a holiday (Date object version)
   * Internal method for use by other services
   */
  async isHolidayDate(date: Date): Promise<{ isHoliday: boolean; holiday?: HolidayResponseDto }> {
    try {
      const checkDate = new Date(date);
      checkDate.setHours(0, 0, 0, 0);

      const holiday = await this.prisma.holiday.findFirst({
        where: {
          holidayDate: checkDate
        }
      });

      if (holiday) {
        return {
          isHoliday: true,
          holiday: this.mapToResponseDto(holiday)
        };
      }

      return {
        isHoliday: false
      };
    } catch (error) {
      this.logger.error(`Failed to check holiday status for date ${date}: ${error.message}`);
      return { isHoliday: false };
    }
  }



  /**
   * Delete a holiday
   * Only HR and Admin can delete holidays
   * Restrictions:
   * - Only future holidays can be deleted
   * - Deletion is not allowed on the same day as the holiday (due to trigger activation)
   * - Past holidays cannot be deleted as tables have already been updated
   * - Emergency holidays cannot be deleted after creation
   */
  async deleteHoliday(holidayId: number, userId: number, userType: string): Promise<{ message: string }> {
    try {
      // Check if holiday exists
      const existingHoliday = await this.prisma.holiday.findUnique({
        where: { holidayId }
      });

      if (!existingHoliday) {
        throw new NotFoundException(`Holiday with ID ${holidayId} not found`);
      }

      // Get current date (start of day)
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Get holiday date (start of day)
      const holidayDate = new Date(existingHoliday.holidayDate);
      holidayDate.setHours(0, 0, 0, 0);

      // Check if holiday is in the past
      if (holidayDate < today) {
        throw new BadRequestException(
          `Cannot delete past holiday "${existingHoliday.holidayName}" (${existingHoliday.holidayDate.toDateString()}). Past holidays cannot be deleted as attendance tables have already been updated.`
        );
      }

      // Check if holiday is today (same day)
      if (holidayDate.getTime() === today.getTime()) {
        throw new BadRequestException(
          `Cannot delete holiday "${existingHoliday.holidayName}" on the same day (${existingHoliday.holidayDate.toDateString()}). Deletion is not allowed on the same day as the holiday due to trigger activation.`
        );
      }

      // Check if holiday is tomorrow (one day before)
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      if (holidayDate.getTime() === tomorrow.getTime()) {
        throw new BadRequestException(
          `Cannot delete holiday "${existingHoliday.holidayName}" one day before (${existingHoliday.holidayDate.toDateString()}). Deletion is only allowed for holidays that are at least 2 days in the future.`
        );
      }

      // Check if this is an emergency holiday (created on or after the holiday date)
      const holidayCreatedDate = new Date(existingHoliday.createdAt);
      holidayCreatedDate.setHours(0, 0, 0, 0);

      if (holidayCreatedDate >= holidayDate) {
        throw new BadRequestException(
          `Cannot delete emergency holiday "${existingHoliday.holidayName}" (${existingHoliday.holidayDate.toDateString()}). Emergency holidays created on or after the holiday date cannot be deleted.`
        );
      }

      // Delete the holiday
      await this.prisma.holiday.delete({
        where: { holidayId }
      });

      // Create HR log entry only for HR users
      if (userType === 'hr') {
        const logDescription = `Holiday "${existingHoliday.holidayName}" (${existingHoliday.holidayDate.toDateString()}) deleted`;
        await this.createHrLog(userId, 'holiday_deleted', null, logDescription);
      }

      return {
        message: `Holiday "${existingHoliday.holidayName}" deleted successfully`
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to delete holiday');
    }
  }



  /**
   * Get holidays statistics
   * All employees can view holiday statistics
   */
  async getHolidayStats(year?: number): Promise<{
    totalHolidays: number;
    holidaysThisYear: number;
    upcomingHolidays: number;
    holidaysByMonth: { month: string; count: number }[];
  }> {
    try {
      const currentYear = year || new Date().getFullYear();
      const yearStart = new Date(currentYear, 0, 1);
      const yearEnd = new Date(currentYear + 1, 0, 1);
      const today = new Date();

      // Total holidays
      const totalHolidays = await this.prisma.holiday.count();

      // Holidays this year
      const holidaysThisYear = await this.prisma.holiday.count({
        where: {
          holidayDate: {
            gte: yearStart,
            lt: yearEnd
          }
        }
      });

      // Upcoming holidays
      const upcomingHolidays = await this.prisma.holiday.count({
        where: {
          holidayDate: {
            gte: today
          }
        }
      });

      // Holidays by month for the specified year
      const holidaysByMonth = await this.prisma.holiday.groupBy({
        by: ['holidayDate'],
        where: {
          holidayDate: {
            gte: yearStart,
            lt: yearEnd
          }
        },
        _count: true
      });

      // Group by month
      const monthCounts = new Map<string, number>();
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];

      holidaysByMonth.forEach(holiday => {
        const month = monthNames[holiday.holidayDate.getMonth()];
        monthCounts.set(month, (monthCounts.get(month) || 0) + 1);
      });

      const holidaysByMonthArray = Array.from(monthCounts.entries()).map(([month, count]) => ({
        month,
        count
      }));

      return {
        totalHolidays,
        holidaysThisYear,
        upcomingHolidays,
        holidaysByMonth: holidaysByMonthArray
      };
    } catch (error) {
      throw new BadRequestException('Failed to fetch holiday statistics');
    }
  }

  /**
   * Helper method to map database result to response DTO
   */
  private mapToResponseDto(holiday: any): HolidayResponseDto {
    return {
      holidayId: holiday.holidayId,
      holidayName: holiday.holidayName,
      holidayDate: holiday.holidayDate,
      description: holiday.description,
      createdAt: holiday.createdAt,
      updatedAt: holiday.updatedAt
    };
  }

  /**
   * Helper method to create HR log entries
   */
  private async createHrLog(hrEmployeeId: number, actionType: string, affectedEmployeeId: number | null, description: string) {
    try {
      // Find the HR record for the employee
      const hrRecord = await this.prisma.hR.findUnique({
        where: { employeeId: hrEmployeeId },
      });

      if (hrRecord) {
        await this.prisma.hRLog.create({
          data: {
            hrId: hrRecord.id,
            actionType,
            affectedEmployeeId,
            description,
          },
        });
      }
    } catch (error) {
      this.logger.error(`Failed to create HR log: ${error.message}`);
      // Don't fail the main operation if log creation fails
    }
  }

  /**
   * Adjust attendance records for a past date holiday
   * This method is called when HR or Admin creates a holiday for a past date
   * It marks all employees as present for that date and updates all relevant tables
   */
  private async adjustAttendanceForPastHoliday(holidayDate: Date, userId: number, userType: string): Promise<void> {
    try {
      this.logger.log(`Adjusting attendance for past holiday on ${holidayDate.toDateString()}`);

      // Validate holiday date is not in the future
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const checkDate = new Date(holidayDate);
      checkDate.setHours(0, 0, 0, 0);

      if (checkDate > today) {
        throw new BadRequestException('Cannot adjust attendance for future dates');
      }

      // Get all active employees
      const activeEmployees = await this.prisma.employee.findMany({
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

      if (activeEmployees.length === 0) {
        this.logger.warn('No active employees found for attendance adjustment');
        return;
      }

      let adjustedCount = 0;
      let errors = 0;
      const errorDetails: string[] = [];

      for (const employee of activeEmployees) {
        try {
          // Check if attendance log already exists for this date
          const existingLog = await this.prisma.attendanceLog.findFirst({
            where: {
              employeeId: employee.id,
              date: holidayDate
            }
          });

          if (existingLog) {
            // Update existing log to mark as present
            await this.prisma.attendanceLog.update({
              where: { id: existingLog.id },
              data: {
                status: 'present',
                checkin: this.createShiftDateTime(holidayDate, employee.shiftStart || '09:00'),
                checkout: this.createShiftDateTime(holidayDate, employee.shiftEnd || '17:00'),
                mode: 'onsite'
              }
            });
          } else {
            // Create new attendance log
            await this.prisma.attendanceLog.create({
              data: {
                employeeId: employee.id,
                date: holidayDate,
                status: 'present',
                checkin: this.createShiftDateTime(holidayDate, employee.shiftStart || '09:00'),
                checkout: this.createShiftDateTime(holidayDate, employee.shiftEnd || '17:00'),
                mode: 'onsite'
              }
            });
          }

          // Update or create attendance record
          await this.updateAttendanceRecord(employee.id, holidayDate);

          // Update monthly attendance summary
          await this.updateMonthlyAttendanceSummary(employee.id, holidayDate);

          adjustedCount++;
        } catch (error) {
          const errorMsg = `Employee ${employee.id} (${employee.firstName} ${employee.lastName}): ${error.message}`;
          this.logger.error(errorMsg);
          errorDetails.push(errorMsg);
          errors++;
        }
      }

      // Create HR log for the bulk attendance adjustment only for HR users
      if (userType === 'hr') {
        await this.createHrLog(
          userId, 
          'holiday_attendance_adjusted', 
          null, 
          `Attendance adjusted for ${adjustedCount} employees for holiday on ${holidayDate.toDateString()}${errors > 0 ? ` (${errors} errors: ${errorDetails.slice(0, 3).join('; ')}${errorDetails.length > 3 ? '...' : ''})` : ''}`
        );
      }

      this.logger.log(`Successfully adjusted attendance for ${adjustedCount} employees for holiday on ${holidayDate.toDateString()}`);
      
      if (errors > 0) {
        this.logger.warn(`${errors} employees had errors during attendance adjustment`);
      }
    } catch (error) {
      this.logger.error(`Failed to adjust attendance for past holiday: ${error.message}`);
      throw new BadRequestException('Failed to adjust attendance for past holiday');
    }
  }

  /**
   * Update attendance record for an employee
   */
  private async updateAttendanceRecord(employeeId: number, holidayDate: Date): Promise<void> {
    try {
      // Check if attendance record exists for this employee
      let attendanceRecord = await this.prisma.attendance.findFirst({
        where: {
          employeeId
        }
      });

      if (attendanceRecord) {
        // Update existing record
        await this.prisma.attendance.update({
          where: { id: attendanceRecord.id },
          data: {
            presentDays: (attendanceRecord.presentDays || 0) + 1,
            absentDays: Math.max(0, (attendanceRecord.absentDays || 0) - 1)
          }
        });
      } else {
        // Create new attendance record for this employee
        await this.prisma.attendance.create({
          data: {
            employeeId,
            presentDays: 1,
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
    } catch (error) {
      this.logger.error(`Failed to update attendance record for employee ${employeeId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update monthly attendance summary for an employee
   */
  private async updateMonthlyAttendanceSummary(employeeId: number, holidayDate: Date): Promise<void> {
    try {
      // Get current month in YYYY-MM format
      const month = holidayDate.toISOString().slice(0, 7);

      // Check if monthly summary exists for this month
      let monthlySummary = await this.prisma.monthlyAttendanceSummary.findFirst({
        where: {
          empId: employeeId,
          month
        }
      });

      if (monthlySummary) {
        // Update existing summary
        await this.prisma.monthlyAttendanceSummary.update({
          where: { id: monthlySummary.id },
          data: {
            totalPresent: (monthlySummary.totalPresent || 0) + 1,
            totalAbsent: Math.max(0, (monthlySummary.totalAbsent || 0) - 1)
          }
        });
      } else {
        // Create new monthly summary for this month
        await this.prisma.monthlyAttendanceSummary.create({
          data: {
            empId: employeeId,
            month,
            totalPresent: 1,
            totalAbsent: 0,
            totalLeaveDays: 0,
            totalLateDays: 0,
            totalHalfDays: 0,
            totalRemoteDays: 0
          }
        });
      }
    } catch (error) {
      this.logger.error(`Failed to update monthly attendance summary for employee ${employeeId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Helper method to create shift date time
   */
  private createShiftDateTime(date: Date, shiftTime: string): Date {
    const [hours, minutes] = shiftTime.split(':').map(Number);
    const shiftDateTime = new Date(date);
    shiftDateTime.setHours(hours, minutes, 0, 0);
    return shiftDateTime;
  }
}
