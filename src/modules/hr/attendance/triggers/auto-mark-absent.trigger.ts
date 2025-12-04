import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../../../../prisma/prisma.service';
import { AttendanceService } from '../attendance.service';

@Injectable()
export class AutoMarkAbsentTrigger {
  private readonly logger = new Logger(AutoMarkAbsentTrigger.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly attendanceService: AttendanceService,
  ) {}

  private async ensureDb(): Promise<boolean> {
    try {
      const healthy = await this.prisma.isConnectionHealthy();
      if (!healthy) {
        this.logger.warn('Database unhealthy, attempting reconnect...');
        const reconnected = await this.prisma.reconnectIfNeeded();
        if (!reconnected) {
          this.logger.warn('Reconnect failed, skipping auto-mark-absent run');
          return false;
        }
      }
      return true;
    } catch (err) {
      this.logger.warn(`DB health check failed: ${err.message}`);
      return false;
    }
  }

  /**
   * Automatically determine the attendance date based on current PKT time
   * - From 00:00 to 09:00: use previous day (yesterday)
   * - From 09:01 to 23:59: use current day (today)
   */
  private getAttendanceDate(): string {
    const now = new Date();
    // Get current time in PKT (UTC+5)
    const pktTime = new Date(
      now.toLocaleString('en-US', { timeZone: 'Asia/Karachi' }),
    );
    const currentHour = pktTime.getHours();
    const currentMinute = pktTime.getMinutes();

    const attendanceDate = new Date(pktTime);
    attendanceDate.setHours(0, 0, 0, 0);

    // If it's between 00:00 and 09:00, use previous day
    // Otherwise (09:01 to 23:59), use today's date
    if (currentHour < 9 || (currentHour === 9 && currentMinute === 0)) {
      attendanceDate.setDate(attendanceDate.getDate() - 1);
    }

    return attendanceDate.toISOString().split('T')[0];
  }

  /**
   * Auto-mark absent cron job.
   * Runs at 3 AM PKT every day.
   * Marks employees as absent if they haven't checked in and exceeded absentTime threshold.
   * Follows checkin/bulkMarkAllEmployeesPresent principles for date and log lookup.
   */
  @Cron('0 3 * * *', {
    name: 'auto-mark-absent',
    timeZone: 'Asia/Karachi', // PKT timezone
  })
  async autoMarkAbsent(): Promise<{
    message: string;
    absent_marked: number;
    leave_applied: number;
  } | null> {
    const isOk = await this.ensureDb();
    if (!isOk) {
      return null;
    }

    try {
      // Get current PKT time for logging
      const now = new Date();
      const pktTime = new Date(
        now.toLocaleString('en-US', { timeZone: 'Asia/Karachi' }),
      );
      const currentHour = pktTime.getHours();
      const currentMinute = pktTime.getMinutes();
      const timeStr = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;

      // Determine attendance date using checkin/checkout standards
      const attendanceDate = this.getAttendanceDate();
      this.logger.log(
        `Starting auto-mark-absent check at ${timeStr} PKT for date: ${attendanceDate}`,
      );

      // Get company absent time threshold
      const company = await this.prisma.company.findFirst();
      if (!company) {
        throw new Error('Company settings not found');
      }
      const absentTimeMinutes = company.absentTime || 180;

      // Get all active employees
      const employees = await this.prisma.employee.findMany({
        where: { status: 'active' },
        select: { id: true, shiftStart: true, shiftEnd: true },
      });

      let absentMarked = 0;
      let errors = 0;

      for (const employee of employees) {
        try {
          if (!employee.shiftStart) continue;
          // Calculate deadline (shift start + absentTime)
          const [shiftHours, shiftMins = 0] = employee.shiftStart.split(':').map(Number);
          const shiftStartMinutes = shiftHours * 60 + shiftMins;
          const currentMinutes = pktTime.getHours() * 60 + pktTime.getMinutes();
          let timeSinceShiftStart = currentMinutes - shiftStartMinutes;
          if (timeSinceShiftStart < 0) timeSinceShiftStart += 1440;

          // Only mark absent if time since shift start >= absentTime
          if (timeSinceShiftStart < absentTimeMinutes) continue;

          // Per-employee log lookup (replicating checkin/bulkMarkAllEmployeesPresent)
          let businessDate = new Date(attendanceDate + 'T00:00:00');
          // Night shift adjustment
          const [shiftEndHour, shiftEndMinute = 0] = (employee.shiftEnd || '17:00').split(':').map(Number);
          if (shiftEndHour < shiftHours) {
            const shiftEndMinutes = shiftEndHour * 60 + shiftEndMinute;
            if (currentMinutes < shiftEndMinutes) {
              businessDate.setDate(businessDate.getDate() - 1);
            }
          }

          // Check if already marked absent or present for this business date
          let existingLog = await this.prisma.attendanceLog.findFirst({
            where: {
              employeeId: employee.id,
              date: businessDate,
            },
          });
          if (existingLog && existingLog.status === 'absent') continue;
          if (existingLog && existingLog.status !== 'absent') continue;

          // Mark absent
          await this.prisma.attendanceLog.create({
            data: {
              employeeId: employee.id,
              date: businessDate,
              checkin: null,
              checkout: null,
              mode: 'onsite',
              status: 'absent',
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          });
          absentMarked++;
        } catch (error) {
          this.logger.error(`Error marking absent for employee ${employee.id}: ${error.message}`);
          errors++;
        }
      }

      this.logger.log(`Auto-mark-absent complete. Absent marked: ${absentMarked}, Errors: ${errors}`);
      return {
        message: 'Auto-mark absent process completed successfully',
        absent_marked: absentMarked,
        leave_applied: 0,
      };
    } catch (error) {
      if (
        error.message?.includes("Can't reach database server") ||
        error.code === 'P1001'
      ) {
        this.logger.warn(`DB issue during auto-mark-absent: ${error.message}`);
        return null;
      }
      this.logger.error(`Auto-mark-absent run failed: ${error.message}`);
      throw error;
    }
  }
}
