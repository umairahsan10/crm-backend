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
   * Runs at 11 PM, 1 AM, 3 AM, and 5 AM PKT every day.
   *
   * Marks employees as absent if they haven't checked in and exceeded absentTime threshold.
   * Half-day is only marked when employees actually check in late (through check-in process),
   * not automatically in this cron job to avoid complexity of updating status later.
   *
   * Date determination:
   * - At 11 PM: marks for current day
   * - At 1 AM, 3 AM, 5 AM: marks for previous day
   *
   * Cron: '0 23,1,3,5 * * *' = At 23:00, 01:00, 03:00, and 05:00 every day
   */
  @Cron('0 23,1,3,5 * * *', {
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

      // Automatically determine the attendance date
      const attendanceDate = this.getAttendanceDate();
      const dateExplanation =
        currentHour < 9 || (currentHour === 9 && currentMinute === 0)
          ? `previous day (triggered at ${timeStr} - before 09:01)`
          : `current day (triggered at ${timeStr} - after 09:00)`;

      this.logger.log(
        `Starting auto-mark-absent check at ${timeStr} PKT for date: ${attendanceDate} (${dateExplanation})`,
      );

      const absentResult =
        await this.attendanceService.autoMarkAbsent(attendanceDate);
      this.logger.log(
        `Auto-mark-absent complete. Absent marked: ${absentResult.absent_marked}, Leave applied: ${absentResult.leave_applied}`,
      );

      return absentResult;
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
