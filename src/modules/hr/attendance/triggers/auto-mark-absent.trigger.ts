import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../../../../prisma/prisma.service';
import { AttendanceService } from '../attendance.service';

@Injectable()
export class AutoMarkAbsentTrigger {
  private readonly logger = new Logger(AutoMarkAbsentTrigger.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly attendanceService: AttendanceService
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
   * Auto-mark absent cron job.
   * Runs every 2 hours from 11pm (23:00) to 3am (03:00) each day.
   * Marks employees as absent if they haven't checked in after their shift end time + grace period.
   * If an employee has approved leave, applies leave instead of absent.
   * Cron: '0 23,1,3 * * *' = At 23:00, 01:00, and 03:00 every day
   * */
  @Cron('0 23,1,3 * * *', {
    name: 'auto-mark-absent',
    timeZone: 'Asia/Karachi' // PKT timezone
  })
  async autoMarkAbsent(): Promise<{ message: string; absent_marked: number; leave_applied: number } | null> {
    const isOk = await this.ensureDb();
    if (!isOk) {
      return null;
    }

    try {
      this.logger.log('Starting auto-mark-absent check...');
      const result = await this.attendanceService.autoMarkAbsent();
      this.logger.log(
        `Auto-mark-absent complete. Absent marked: ${result.absent_marked}, Leave applied: ${result.leave_applied}`
      );
      return result;
    } catch (error) {
      if (error.message?.includes("Can't reach database server") || (error as any).code === 'P1001') {
        this.logger.warn(`DB issue during auto-mark-absent: ${error.message}`);
        return null;
      }
      this.logger.error(`Auto-mark-absent run failed: ${error.message}`);
      throw error;
    }
  }
}

