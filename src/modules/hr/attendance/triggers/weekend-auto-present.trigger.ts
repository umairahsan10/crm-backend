import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../../../../prisma/prisma.service';

@Injectable()
export class WeekendAutoPresentTrigger {
  private readonly logger = new Logger(WeekendAutoPresentTrigger.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Check database connection and retry if needed
   */
  private async checkDatabaseConnection(): Promise<boolean> {
    try {
      const isHealthy = await this.prisma.isConnectionHealthy();
      if (!isHealthy) {
        this.logger.warn(
          'Database connection is unhealthy, attempting to reconnect...',
        );
        const reconnected = await this.prisma.reconnectIfNeeded();
        if (!reconnected) {
          this.logger.warn(
            'Failed to reconnect to database, skipping this execution',
          );
          return false;
        }
      }
      return true;
    } catch (error) {
      this.logger.warn(
        `Database connection check failed, skipping this execution: ${error.message}`,
      );
      return false;
    }
  }

  /**
   * Trigger that runs once at 9:00 PM PKT (21:00) on Saturday and Sunday only
   * Automatically marks employees as present on weekends, following checkin logic for date/time
   * Cron: '0 21 * * 6,0' = At 21:00 (9:00 PM) only on Saturday (6) and Sunday (0)
   */
  @Cron('0 21 * * 6,0', {
    name: 'weekend-auto-present',
    timeZone: 'Asia/Karachi', // PKT timezone
  })
  async autoMarkWeekendPresent(): Promise<{
    marked_present: number;
    errors: number;
  }> {
    try {
      // Check database connection first
      const isConnected = await this.checkDatabaseConnection();
      if (!isConnected) {
        return { marked_present: 0, errors: 0 };
      }

      this.logger.log('Starting weekend auto-present check...');

      // Get current date and time in PKT
      const now = new Date();
      const pktDate = new Date(
        now.toLocaleString('en-US', { timeZone: 'Asia/Karachi' }),
      );

      // Use checkin logic for business date
      pktDate.setHours(0, 0, 0, 0);
      const dayOfWeek = pktDate.getDay(); // 0 = Sunday, 6 = Saturday
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        this.logger.debug('Not a weekend, skipping auto-present check');
        return { marked_present: 0, errors: 0 };
      }

      this.logger.log(
        `Weekend detected (Day ${dayOfWeek}), running auto-present for all active employees...`,
      );

      // Find all active employees with their shift start times
      const employees = await this.prisma.employee.findMany({
        where: {
          status: 'active',
          shiftStart: {
            not: null,
          },
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          shiftStart: true,
          shiftEnd: true,
        },
      });

      let markedPresent = 0;
      let errors = 0;

      const employeeIds = employees.map((emp) => emp.id);

      // Pre-fetch all existing logs for this business date
      const existingLogs = await this.prisma.attendanceLog.findMany({
        where: {
          employeeId: { in: employeeIds },
          date: pktDate,
        },
      });

      const existingLogsMap = new Map<number, (typeof existingLogs)[0]>();
      for (const log of existingLogs) {
        existingLogsMap.set(log.employeeId, log);
      }

      // Group operations
      const logsToCreate: Array<{
        employeeId: number;
        date: Date;
        checkin: Date;
        checkout: Date;
        mode: 'onsite';
        status: 'present';
      }> = [];

      const employeesToUpdateCounters: number[] = [];

      // Process all employees and group operations
      for (const employee of employees) {
        try {
          const existingLog = existingLogsMap.get(employee.id);
          if (!existingLog) {
            // Use checkin logic for shift start/end
            const shiftStartDateTime = this.createShiftDateTime(pktDate, employee.shiftStart!);
            const shiftEndDateTime = this.createShiftDateTime(pktDate, employee.shiftEnd!);
            logsToCreate.push({
              employeeId: employee.id,
              date: pktDate,
              checkin: shiftStartDateTime,
              checkout: shiftEndDateTime,
              mode: 'onsite',
              status: 'present',
            });
            employeesToUpdateCounters.push(employee.id);
            markedPresent++;
            const totalHours = this.calculateShiftHours(shiftStartDateTime, shiftEndDateTime);
            this.logger.log(`Auto-marked present: ${employee.firstName} ${employee.lastName} (ID: ${employee.id}) on weekend - Shift: ${employee.shiftStart}-${employee.shiftEnd}, Hours: ${totalHours}`);
          } else {
            this.logger.debug(`Attendance log already exists for ${employee.firstName} ${employee.lastName} on ${pktDate.toDateString()}`);
          }
        } catch (error) {
          this.logger.error(`Error processing employee ${employee.id}:`, error);
          errors++;
        }
      }

      // OPTIMIZATION: Execute all bulk operations in a single transaction
      if (logsToCreate.length > 0) {
        try {
          await this.prisma.$transaction(
            async (tx) => {
              // Bulk create new logs
              await tx.attendanceLog.createMany({
                data: logsToCreate,
                skipDuplicates: true,
              });

              // Update attendance counters (parallel execution)
              // Pre-fetch all attendance records
              const attendanceRecords = await tx.attendance.findMany({
                where: { employeeId: { in: employeesToUpdateCounters } },
              });
              const attendanceMap = new Map(
                attendanceRecords.map((att) => [att.employeeId, att]),
              );

              // Pre-fetch all monthly summaries
              const monthKey = `${pktDate.getFullYear()}-${String(pktDate.getMonth() + 1).padStart(2, '0')}`;
              const monthlySummaries =
                await tx.monthlyAttendanceSummary.findMany({
                  where: {
                    empId: { in: employeesToUpdateCounters },
                    month: monthKey,
                  },
                });
              const summaryMap = new Map(
                monthlySummaries.map((sum) => [sum.empId, sum]),
              );

              await Promise.all(
                employeesToUpdateCounters.map(async (empId) => {
                  // Update attendance record
                  const attendance = attendanceMap.get(empId);
                  if (attendance) {
                    await tx.attendance.update({
                      where: { id: attendance.id },
                      data: {
                        presentDays: { increment: 1 },
                      },
                    });
                  } else {
                    // Carry forward unused leaves and add monthly accrual
                    const prevAttendance = await tx.attendance.findFirst({
                      where: { employeeId: empId },
                      orderBy: { id: 'desc' },
                    });
                    let prevLeaves = prevAttendance?.availableLeaves ?? 0;
                    const company = await tx.company.findFirst();
                    const monthlyAccrual = company?.monthlyLeavesAccrual ?? 2;
                    await tx.attendance.create({
                      data: {
                        employeeId: empId,
                        presentDays: 1,
                        absentDays: 0,
                        lateDays: 0,
                        leaveDays: 0,
                        remoteDays: 0,
                        availableLeaves: prevLeaves + monthlyAccrual,
                        monthlyLates: 0,
                        halfDays: 0,
                      },
                    });
                  }

                  // Update monthly summary
                  const summary = summaryMap.get(empId);
                  if (summary) {
                    await tx.monthlyAttendanceSummary.update({
                      where: { id: summary.id },
                      data: {
                        totalPresent: { increment: 1 },
                      },
                    });
                  } else {
                    await tx.monthlyAttendanceSummary.create({
                      data: {
                        empId: empId,
                        month: monthKey,
                        totalPresent: 1,
                        totalAbsent: 0,
                        totalLeaveDays: 0,
                        totalLateDays: 0,
                        totalHalfDays: 0,
                        totalRemoteDays: 0,
                      },
                    });
                  }
                }),
              );
            },
            {
              timeout: 60000,
              maxWait: 15000,
            },
          );
        } catch (transactionError) {
          this.logger.error(
            `Error in bulk transaction: ${transactionError.message}`,
          );
          errors += employeesToUpdateCounters.length;
        }
      }

      if (markedPresent > 0) {
        this.logger.log(
          `Weekend auto-present completed: ${markedPresent} employees marked present, ${errors} errors`,
        );
      }

      return { marked_present: markedPresent, errors };
    } catch (error) {
      // Only log as error if it's not a connection issue
      if (
        error.message?.includes("Can't reach database server") ||
        error.code === 'P1001'
      ) {
        this.logger.warn(
          `Database connection issue in weekend auto-present trigger: ${error.message}`,
        );
      } else {
        this.logger.error(
          `Error in weekend auto-present trigger: ${error.message}`,
        );
      }
      return { marked_present: 0, errors: 1 };
    }
  }

  /**
   * Check if current time matches shift start time (with 5-minute grace period)
   */
  private isShiftStartTime(
    currentTime: string,
    shiftStartTime: string,
  ): boolean {
    try {
      const [currentHour, currentMinute] = currentTime.split(':').map(Number);
      const [shiftHour, shiftMinute] = shiftStartTime.split(':').map(Number);

      const currentTotalMinutes = currentHour * 60 + currentMinute;
      const shiftTotalMinutes = shiftHour * 60 + shiftMinute;

      // Allow 5-minute grace period before and after shift start time
      const gracePeriod = 5;

      return Math.abs(currentTotalMinutes - shiftTotalMinutes) <= gracePeriod;
    } catch (error) {
      this.logger.error(
        `Error parsing time: currentTime=${currentTime}, shiftStartTime=${shiftStartTime}`,
        error,
      );
      return false;
    }
  }

  /**
   * Create DateTime object for shift time on a specific date
   * Handles night shifts that cross midnight
   */
  private createShiftDateTime(date: Date, shiftTime: string): Date {
    try {
      const [hours, minutes] = shiftTime.split(':').map(Number);

      // Create a new date object for the shift
      const shiftDate = new Date(date);
      shiftDate.setHours(hours, minutes, 0, 0);

      // Handle night shifts that cross midnight (9 PM - 5 AM)
      if (hours >= 21) {
        // 9 PM or later
        // Night shift start (9 PM) - same day
        return shiftDate;
      } else if (hours < 6) {
        // Before 6 AM
        // Night shift end (5 AM) - same day (for the shift that started the previous day)
        return shiftDate;
      } else {
        // Regular day shift
        return shiftDate;
      }
    } catch (error) {
      this.logger.error(
        `Error creating shift DateTime: shiftTime=${shiftTime}`,
        error,
      );
      // Fallback to current date/time if parsing fails
      return date;
    }
  }

  /**
   * Calculate total hours worked for a shift
   */
  private calculateShiftHours(startDateTime: Date, endDateTime: Date): number {
    try {
      const start = new Date(startDateTime);
      const end = new Date(endDateTime);

      // If end time is before start time, it means the shift crosses midnight
      // For example, if shift starts at 21:00 and ends at 05:00, it's 8 hours.
      if (end < start) {
        end.setDate(end.getDate() + 1); // Move end date to the next day
      }

      const diffInMilliseconds = end.getTime() - start.getTime();
      const diffInHours = diffInMilliseconds / (1000 * 60 * 60);

      return diffInHours;
    } catch (error) {
      this.logger.error(
        `Error calculating shift hours: startDateTime=${startDateTime}, endDateTime=${endDateTime}`,
        error,
      );
      return 0;
    }
  }

  /**
   * Get day of week (Monday = 1, Sunday = 7)
   */
  private getDayOfWeek(date: Date): number {
    const day = date.getDay();
    return day === 0 ? 7 : day; // Sunday = 7, Monday = 1
  }

  /**
   * Check if it's weekend (Saturday = 6, Sunday = 7)
   */
  private isWeekend(dayOfWeek: number): boolean {
    return dayOfWeek === 6 || dayOfWeek === 7;
  }

  /**
   * Update attendance summary for the employee
   * Updates both attendance and monthly_attendance_summary tables
   */
  private async updateAttendanceSummary(
    employeeId: number,
    date: Date,
  ): Promise<void> {
    try {
      // 1. Update or create attendance record
      let attendance = await this.prisma.attendance.findFirst({
        where: { employeeId },
      });

      if (!attendance) {
        // Create new attendance record if it doesn't exist
        attendance = await this.prisma.attendance.create({
          data: {
            employeeId,
            presentDays: 0,
            absentDays: 0,
            lateDays: 0,
            leaveDays: 0,
            remoteDays: 0,
            availableLeaves: 0,
            monthlyLates: 3,
            halfDays: 0,
          },
        });
      }

      // Update present days
      await this.prisma.attendance.update({
        where: { id: attendance.id },
        data: {
          presentDays: (attendance.presentDays || 0) + 1,
        },
      });

      // 2. Update monthly attendance summary
      const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      let monthlySummary = await this.prisma.monthlyAttendanceSummary.findFirst(
        {
          where: {
            empId: employeeId,
            month: monthYear,
          },
        },
      );

      if (!monthlySummary) {
        // Create new monthly summary if it doesn't exist
        monthlySummary = await this.prisma.monthlyAttendanceSummary.create({
          data: {
            empId: employeeId,
            month: monthYear,
            totalPresent: 0,
            totalAbsent: 0,
            totalLeaveDays: 0,
            totalLateDays: 0,
            totalHalfDays: 0,
            totalRemoteDays: 0,
          },
        });
      }

      // Update monthly summary
      await this.prisma.monthlyAttendanceSummary.update({
        where: { id: monthlySummary.id },
        data: {
          totalPresent: (monthlySummary.totalPresent || 0) + 1,
        },
      });

      this.logger.log(
        `Successfully updated attendance summary for employee ${employeeId}`,
      );
    } catch (error) {
      this.logger.error(
        `Error updating attendance summary for employee ${employeeId}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * True manual override - bypasses weekend check for testing
   * Use this when you want to test the system regardless of day
   */
  async manualOverride(): Promise<{ marked_present: number; errors: number }> {
    this.logger.log(
      'Manual override activated - bypassing weekend check for testing',
    );

    try {
      // Get current date and time in PKT
      const now = new Date();
      const pktDate = new Date(
        now.toLocaleString('en-US', { timeZone: 'Asia/Karachi' }),
      );

      this.logger.log(
        `Manual override: Processing employees for ${pktDate.toDateString()}`,
      );

      // Find all active employees with their shift start times
      const employees = await this.prisma.employee.findMany({
        where: {
          status: 'active',
          shiftStart: {
            not: null,
          },
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          shiftStart: true,
          shiftEnd: true,
        },
      });

      let markedPresent = 0;
      let errors = 0;

      this.logger.log(
        `Manual override: Found ${employees.length} employees to process`,
      );

      for (const employee of employees) {
        try {
          // Check if attendance log already exists for today
          const existingLog = await this.prisma.attendanceLog.findFirst({
            where: {
              employeeId: employee.id,
              date: pktDate,
            },
          });

          if (!existingLog) {
            // Create attendance log with shift times (not current time)
            const shiftStartDateTime = this.createShiftDateTime(
              pktDate,
              employee.shiftStart!,
            );
            const shiftEndDateTime = this.createShiftDateTime(
              pktDate,
              employee.shiftEnd!,
            );

            // Calculate total hours for the shift
            const totalHours = this.calculateShiftHours(
              shiftStartDateTime,
              shiftEndDateTime,
            );

            // Create attendance log
            await this.prisma.attendanceLog.create({
              data: {
                employeeId: employee.id,
                date: pktDate,
                checkin: shiftStartDateTime, // Employee's actual shift start time
                checkout: shiftEndDateTime, // Employee's actual shift end time
                mode: 'onsite',
                status: 'present',
              },
            });

            // Update attendance summary
            await this.updateAttendanceSummary(employee.id, pktDate);

            this.logger.log(
              `Manual override: Marked present: ${employee.firstName} ${employee.lastName} (ID: ${employee.id}) - Shift: ${employee.shiftStart}-${employee.shiftEnd}, Hours: ${totalHours}`,
            );
            markedPresent++;
          } else {
            this.logger.debug(
              `Manual override: Attendance log already exists for ${employee.firstName} ${employee.lastName} on ${pktDate.toDateString()}`,
            );
          }
        } catch (error) {
          this.logger.error(`Error processing employee ${employee.id}:`, error);
          errors++;
        }
      }

      if (markedPresent > 0) {
        this.logger.log(
          `Manual override completed: ${markedPresent} employees marked present, ${errors} errors`,
        );
      } else {
        this.logger.log(
          `Manual override: No new employees processed. All employees already have attendance records for today.`,
        );
      }

      return { marked_present: markedPresent, errors };
    } catch (error) {
      this.logger.error('Error in manual override:', error);
      throw error;
    }
  }

  /**
   * Get current weekend status
   */
  async getWeekendStatus(): Promise<{
    isWeekend: boolean;
    dayOfWeek: number;
    dayName: string;
    currentTime: string;
    activeEmployees: number;
  }> {
    const now = new Date();
    const pktDate = new Date(
      now.toLocaleString('en-US', { timeZone: 'Asia/Karachi' }),
    );
    const dayOfWeek = this.getDayOfWeek(pktDate);
    const isWeekend = this.isWeekend(dayOfWeek);
    const currentTime = pktDate.toTimeString().slice(0, 5);

    const dayNames = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ];
    const dayName = dayNames[dayOfWeek - 1] || 'Unknown';

    const activeEmployees = await this.prisma.employee.count({
      where: {
        status: 'active',
        shiftStart: {
          not: null,
        },
      },
    });

    return {
      isWeekend,
      dayOfWeek,
      dayName,
      currentTime,
      activeEmployees,
    };
  }
}
