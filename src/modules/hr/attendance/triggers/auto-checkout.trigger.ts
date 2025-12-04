import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../../../../prisma/prisma.service';

@Injectable()
export class AutoCheckoutTrigger {
  private readonly logger = new Logger(AutoCheckoutTrigger.name);

  constructor(private readonly prisma: PrismaService) {}

  private async ensureDb(): Promise<boolean> {
    try {
      const healthy = await this.prisma.isConnectionHealthy();
      if (!healthy) {
        this.logger.warn('Database unhealthy, attempting reconnect...');
        const reconnected = await this.prisma.reconnectIfNeeded();
        if (!reconnected) {
          this.logger.warn('Reconnect failed, skipping auto-checkout run');
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
   * Daily auto-checkout cron.
   * Runs at 05:30 AM PKT and checks out all employees from yesterday's logs
   * where status is not 'absent' and checkout is still null.
   * Follows bulkCheckout logic for log lookup and status update.
   */
  @Cron('30 5 * * *', { timeZone: 'Asia/Karachi' })
  async autoCheckout(): Promise<{
    processed: number;
    updated: number;
    skipped: number;
  }> {
    const isOk = await this.ensureDb();
    if (!isOk) {
      return { processed: 0, updated: 0, skipped: 0 };
    }

    try {
      // Current PKT date/time
      const now = new Date();
      const nowPkt = new Date(
        now.toLocaleString('en-US', { timeZone: 'Asia/Karachi' }),
      );

      // Target date is yesterday in PKT (business date)
      const targetDate = new Date(nowPkt);
      targetDate.setDate(targetDate.getDate() - 1);
      targetDate.setHours(0, 0, 0, 0);

      // Get all active employees
      const employees = await this.prisma.employee.findMany({
        where: { status: 'active' },
        select: { id: true, shiftStart: true, shiftEnd: true },
      });

      let updated = 0;
      let skipped = 0;
      let processed = 0;

      for (const employee of employees) {
        try {
          // Per-employee log lookup (replicating bulkCheckout logic)
          let existingAttendance = await this.prisma.attendanceLog.findFirst({
            where: {
              employeeId: employee.id,
              date: targetDate,
              checkin: { not: null },
              checkout: null,
            },
          });
          if (!existingAttendance) {
            const prevDate = new Date(targetDate);
            prevDate.setDate(prevDate.getDate() - 1);
            existingAttendance = await this.prisma.attendanceLog.findFirst({
              where: {
                employeeId: employee.id,
                date: prevDate,
                checkin: { not: null },
                checkout: null,
              },
            });
          }
          if (!existingAttendance) {
            const nextDate = new Date(targetDate);
            nextDate.setDate(nextDate.getDate() + 1);
            existingAttendance = await this.prisma.attendanceLog.findFirst({
              where: {
                employeeId: employee.id,
                date: nextDate,
                checkin: { not: null },
                checkout: null,
              },
            });
          }
          if (!existingAttendance) {
            existingAttendance = await this.prisma.attendanceLog.findFirst({
              where: {
                employeeId: employee.id,
                checkin: { not: null },
                checkout: null,
              },
              orderBy: {
                createdAt: 'desc',
              },
            });
          }

          if (!existingAttendance || !existingAttendance.checkin) {
            skipped++;
            continue;
          }

          // Compute candidate checkout in PKT for the business date
          const candidateCheckout = this.computeCandidateCheckout(
            targetDate,
            employee.shiftStart || null,
            employee.shiftEnd || null,
          );

          // Cap at 05:30 AM PKT next day (cron run time)
          const capTime = new Date(targetDate);
          capTime.setDate(capTime.getDate() + 1);
          capTime.setHours(5, 30, 0, 0);

          const finalCheckout =
            candidateCheckout > capTime ? capTime : candidateCheckout;

          // Calculate worked hours
          const checkinTime = existingAttendance.checkin;
          const workedMs = finalCheckout.getTime() - checkinTime.getTime();
          const workedHours = workedMs / (1000 * 60 * 60);

          // Determine new status based on worked hours
          let newStatus = existingAttendance.status;
          if (existingAttendance.status !== 'absent') {
            if (workedHours >= 8) {
              newStatus = 'present';
            } else if (workedHours >= 4) {
              newStatus = 'half_day';
            } else {
              newStatus = 'absent';
            }
          }

          // Persist checkout and status
          await this.prisma.attendanceLog.update({
            where: { id: existingAttendance.id },
            data: {
              checkout: finalCheckout,
              status: newStatus,
              updatedAt: new Date(),
            },
          });
          updated++;
        } catch (e) {
          this.logger.error(
            `Failed auto-checkout for employee ${employee.id}: ${e.message}`,
          );
          skipped++;
        }
        processed++;
      }

      this.logger.log(
        `Auto-checkout complete. Processed=${processed}, Updated=${updated}, Skipped=${skipped}`,
      );
      return { processed, updated, skipped };
    } catch (error) {
      if (
        error.message?.includes("Can't reach database server") ||
        error.code === 'P1001'
      ) {
        this.logger.warn(`DB issue during auto-checkout: ${error.message}`);
        return { processed: 0, updated: 0, skipped: 0 };
      }
      this.logger.error(`Auto-checkout run failed: ${error.message}`);
      throw error;
    }
  }

  private computeCandidateCheckout(
    businessDatePkt: Date,
    shiftStart: string | null,
    shiftEnd: string | null,
  ): Date {
    // If shiftEnd exists, place it on the correct day relative to shiftStart
    if (shiftEnd) {
      const end = new Date(businessDatePkt);
      const [eh, em] = this.parseTimeString(shiftEnd);
      end.setHours(eh, em, 0, 0);

      if (shiftStart) {
        const start = new Date(businessDatePkt);
        const [sh, sm] = this.parseTimeString(shiftStart);
        start.setHours(sh, sm, 0, 0);
        // If end is before start, it means it crosses midnight -> next day
        if (end <= start) {
          end.setDate(end.getDate() + 1);
        }
      }
      return end;
    }

    // Else compute 9 hours from scheduled shiftStart
    if (shiftStart) {
      const start = new Date(businessDatePkt);
      const [sh, sm] = this.parseTimeString(shiftStart);
      start.setHours(sh, sm, 0, 0);
      const end = new Date(start);
      end.setHours(end.getHours() + 9);
      return end;
    }

    // Fallback: if no shift info, default to 05:00 AM next day (safe cap)
    const fallback = new Date(businessDatePkt);
    fallback.setDate(fallback.getDate() + 1);
    fallback.setHours(5, 0, 0, 0);
    return fallback;
  }

  private parseTimeString(raw: string): [number, number] {
    const s = (raw || '').toString().trim();
    if (s.length === 0) return [0, 0];
    if (s.includes(':')) {
      const parts = s.split(':');
      const h = Number(parts[0]);
      const m = Number(parts[1] ?? 0);
      return [this.normalizeHour(h), this.normalizeMinute(m)];
    }
    // hour-only like "21" or "5"
    const h = Number(s);
    return [this.normalizeHour(h), 0];
  }

  private normalizeHour(h: number): number {
    if (!Number.isFinite(h)) return 0;
    if (h < 0) return 0;
    if (h > 23) return 23;
    return Math.floor(h);
  }

  private normalizeMinute(m: number): number {
    if (!Number.isFinite(m)) return 0;
    if (m < 0) return 0;
    if (m > 59) return 59;
    return Math.floor(m);
  }
}
