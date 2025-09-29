import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../../../../prisma/prisma.service';

@Injectable()
export class FutureHolidayTrigger {
  private readonly logger = new Logger(FutureHolidayTrigger.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Check database connection and retry if needed
   */
  private async checkDatabaseConnection(): Promise<boolean> {
    try {
      const isHealthy = await this.prisma.isConnectionHealthy();
      if (!isHealthy) {
        this.logger.warn('Database connection is unhealthy, attempting to reconnect...');
        const reconnected = await this.prisma.reconnectIfNeeded();
        if (!reconnected) {
          this.logger.warn('Failed to reconnect to database, skipping this execution');
          return false;
        }
      }
      return true;
    } catch (error) {
      this.logger.warn(`Database connection check failed, skipping this execution: ${error.message}`);
      return false;
    }
  }

  /**
   * Cron job that runs every 30 minutes to check for holidays and mark employees present
   * This trigger activates when a holiday date arrives and it's time for employee shifts to start
   */
  @Cron('*/30 * * * *', { name: 'future-holiday-trigger', timeZone: 'Asia/Karachi' })
  async checkAndMarkHolidayAttendance(): Promise<void> {
    try {
      // Check database connection first
      const isConnected = await this.checkDatabaseConnection();
      if (!isConnected) {
        return;
      }
      
      const now = new Date();
      const currentDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const currentTime = now.toTimeString().slice(0, 5); // HH:MM format

      this.logger.debug(`Checking for holidays on ${currentDate.toDateString()} at ${currentTime}`);

      // Check if today is a holiday
      const todayHoliday = await this.prisma.holiday.findFirst({
        where: {
          holidayDate: currentDate
        }
      });

      if (!todayHoliday) {
        this.logger.debug('No holiday today, skipping attendance marking');
        return;
      }

      this.logger.log(`Holiday detected: ${todayHoliday.holidayName}. Checking for employees whose shifts are starting...`);

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

      let markedPresent = 0;
      let skipped = 0;
      let errors = 0;

      for (const employee of activeEmployees) {
        try {
          // Check if this employee's shift is starting now (within 5-minute window)
          if (employee.shiftStart && this.isShiftStartTime(currentTime, employee.shiftStart)) {
            // Check if attendance log already exists for today
            const existingLog = await this.prisma.attendanceLog.findFirst({
              where: {
                employeeId: employee.id,
                date: currentDate
              }
            });

            if (existingLog) {
              // Update existing log to mark as present
              await this.prisma.attendanceLog.update({
                where: { id: existingLog.id },
                data: {
                  status: 'present',
                  checkin: this.createShiftDateTime(currentDate, employee.shiftStart!),
                  checkout: this.createShiftDateTime(currentDate, employee.shiftEnd!),
                  mode: 'onsite'
                }
              });
            } else {
              // Create new attendance log
              await this.prisma.attendanceLog.create({
                data: {
                  employeeId: employee.id,
                  date: currentDate,
                  status: 'present',
                  checkin: this.createShiftDateTime(currentDate, employee.shiftStart!),
                  checkout: this.createShiftDateTime(currentDate, employee.shiftEnd!),
                  mode: 'onsite'
                }
              });
            }

            // Update attendance record
            await this.updateAttendanceRecord(employee.id, currentDate);

            // Update monthly attendance summary
            await this.updateMonthlyAttendanceSummary(employee.id, currentDate);

            markedPresent++;
            this.logger.debug(`Marked employee ${employee.firstName} ${employee.lastName} as present for holiday: ${todayHoliday.holidayName}`);
          } else {
            skipped++;
          }
        } catch (error) {
          this.logger.error(`Failed to mark employee ${employee.id} as present: ${error.message}`);
          errors++;
        }
      }

      if (markedPresent > 0) {
        this.logger.log(`Holiday attendance marked: ${markedPresent} employees marked present, ${skipped} skipped, ${errors} errors for holiday: ${todayHoliday.holidayName}`);
      }
    } catch (error) {
      // Only log as error if it's not a connection issue
      if (error.message?.includes("Can't reach database server") || error.code === 'P1001') {
        this.logger.warn(`Database connection issue in future holiday trigger: ${error.message}`);
      } else {
        this.logger.error(`Error in future holiday trigger: ${error.message}`);
      }
    }
  }

  /**
   * Check if the current time matches the employee's shift start time (with 5-minute grace period)
   */
  private isShiftStartTime(currentTime: string, shiftStartTime: string): boolean {
    if (!shiftStartTime) return false;

    const [currentHour, currentMinute] = currentTime.split(':').map(Number);
    const [shiftHour, shiftMinute] = shiftStartTime.split(':').map(Number);

    const currentTotalMinutes = currentHour * 60 + currentMinute;
    const shiftTotalMinutes = shiftHour * 60 + shiftMinute;

    // Allow 5-minute grace period (before and after shift start time)
    const gracePeriod = 5;
    const timeDifference = Math.abs(currentTotalMinutes - shiftTotalMinutes);

    return timeDifference <= gracePeriod;
  }

  /**
   * Create a DateTime object for the shift time on a specific date
   */
  private createShiftDateTime(date: Date, shiftTime: string): Date {
    const [hours, minutes] = shiftTime.split(':').map(Number);
    const shiftDateTime = new Date(date);
    shiftDateTime.setHours(hours, minutes, 0, 0);
    return shiftDateTime;
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
   * Manual trigger for testing - mark all employees present for a specific holiday date
   */
  async manualTriggerForDate(holidayDate: string): Promise<{ marked_present: number; errors: number; message: string }> {
    try {
      // Parse date more robustly to avoid timezone issues
      const [year, month, day] = holidayDate.split('-').map(Number);
      const targetDate = new Date(year, month - 1, day); // month is 0-indexed

      // Debug: Log the parsed date
      this.logger.debug(`Parsed date: ${targetDate.toISOString()}, Original: ${holidayDate}`);

      // Check if the specified date is a holiday
      // Use date range to avoid timezone precision issues
      const startOfDay = new Date(holidayDate + 'T00:00:00');
      const endOfDay = new Date(holidayDate + 'T23:59:59');
      
      const holiday = await this.prisma.holiday.findFirst({
        where: {
          holidayDate: {
            gte: startOfDay,
            lte: endOfDay
          }
        }
      });

      // Debug: Log the query result
      this.logger.debug(`Holiday query result: ${holiday ? 'Found' : 'Not found'}`);

      if (!holiday) {
        return {
          marked_present: 0,
          errors: 0,
          message: `No holiday found for date ${holidayDate}`
        };
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

      let markedPresent = 0;
      let errors = 0;

      for (const employee of activeEmployees) {
        try {
          // Check if attendance log already exists for this date
          const existingLog = await this.prisma.attendanceLog.findFirst({
            where: {
              employeeId: employee.id,
              date: targetDate
            }
          });

          if (existingLog) {
            // Update existing log to mark as present
            await this.prisma.attendanceLog.update({
              where: { id: existingLog.id },
              data: {
                status: 'present',
                checkin: this.createShiftDateTime(targetDate, employee.shiftStart || '09:00'),
                checkout: this.createShiftDateTime(targetDate, employee.shiftEnd || '17:00'),
                mode: 'onsite'
              }
            });
          } else {
            // Create new attendance log
            await this.prisma.attendanceLog.create({
              data: {
                employeeId: employee.id,
                date: targetDate,
                status: 'present',
                checkin: this.createShiftDateTime(targetDate, employee.shiftStart || '09:00'),
                checkout: this.createShiftDateTime(targetDate, employee.shiftEnd || '17:00'),
                mode: 'onsite'
              }
            });
          }

          // Update attendance record
          await this.updateAttendanceRecord(employee.id, targetDate);

          // Update monthly attendance summary
          await this.updateMonthlyAttendanceSummary(employee.id, targetDate);

          markedPresent++;
        } catch (error) {
          this.logger.error(`Failed to mark employee ${employee.id} as present: ${error.message}`);
          errors++;
        }
      }

      return {
        marked_present: markedPresent,
        errors,
        message: `Successfully marked ${markedPresent} employees as present for holiday: ${holiday.holidayName} on ${holidayDate}`
      };
    } catch (error) {
      this.logger.error(`Error in manual trigger: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get status of future holiday trigger
   */
  async getTriggerStatus(): Promise<{
    isActive: boolean;
    nextCheck: string;
    todayHoliday?: string;
    activeEmployees: number;
  }> {
    try {
      const now = new Date();
      const currentDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      // Check if today is a holiday
      const todayHoliday = await this.prisma.holiday.findFirst({
        where: {
          holidayDate: currentDate
        }
      });

      // Count active employees
      const activeEmployees = await this.prisma.employee.count({
        where: {
          status: 'active'
        }
      });

      return {
        isActive: true,
        nextCheck: new Date(now.getTime() + 60000).toISOString(), // Next minute
        todayHoliday: todayHoliday?.holidayName || undefined,
        activeEmployees
      };
    } catch (error) {
      this.logger.error(`Error getting trigger status: ${error.message}`);
      return {
        isActive: false,
        nextCheck: 'Error',
        activeEmployees: 0
      };
    }
  }
}
