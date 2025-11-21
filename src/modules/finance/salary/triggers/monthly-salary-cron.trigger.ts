import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../../../../prisma/prisma.service';
import { FinanceSalaryService } from '../salary.service';

@Injectable()
export class MonthlySalaryCronTrigger {
  private readonly logger = new Logger(MonthlySalaryCronTrigger.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly financeSalaryService: FinanceSalaryService,
  ) {}

  /**
   * Check database connection health.
   * @returns true if database is healthy, false otherwise
   */
  private async ensureDb(): Promise<boolean> {
    try {
      const healthy = await this.prisma.isConnectionHealthy();
      if (!healthy) {
        this.logger.warn('Database unhealthy, attempting reconnect...');
        const reconnected = await this.prisma.reconnectIfNeeded();
        if (!reconnected) {
          this.logger.warn('Reconnect failed, skipping monthly salary calculation');
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
   * Monthly salary calculation cron job.
   * Runs on the 1st of every month at 1:00 PM PKT.
   * Calculates salaries for the PREVIOUS month (full month).
   * Cron expression: '0 13 1 * *' = At 13:00 (1:00 PM) on day-of-month 1
   */
  @Cron('0 13 1 * *', {
    name: 'monthly-salary-calculation',
    timeZone: 'Asia/Karachi', // PKT timezone
  })
  async handleMonthlySalaryCalculation() {
    const isOk = await this.ensureDb();
    if (!isOk) {
      return null;
    }

    try {
      this.logger.log('🕔 1:00 PM PKT reached - Starting monthly auto salary calculation for previous month');

      // Get current PKT date to determine previous month
      const now = new Date();
      const pktTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Karachi' }));
      
      // Get previous month (if current month is January, previous month is December of previous year)
      let previousYear = pktTime.getFullYear();
      let previousMonth = pktTime.getMonth() - 1; // 0-based: 0 = Jan, 11 = Dec

      // Handle January (month 0) -> previous month is December of previous year
      if (previousMonth < 0) {
        previousMonth = 11; // December (0-based: 11)
        previousYear -= 1;
      }

      this.logger.log(
        `📅 Calculating salaries for ${previousYear}-${String(previousMonth + 1).padStart(2, '0')} (previous month)`,
      );

      // Calculate salaries for previous month
      const result = await this.financeSalaryService.calculateForSpecificMonth(previousYear, previousMonth);

      this.logger.log(
        `✅ Monthly salary calculation completed successfully: ${result.successful} successful, ${result.failed} failed`,
      );

      return result;
    } catch (error) {
      if (error.message?.includes("Can't reach database server") || (error as any).code === 'P1001') {
        this.logger.warn(`❌ Database connection issue in monthly salary cron: ${error.message}`);
        return null;
      }
      this.logger.error(`❌ Monthly salary cron failed: ${error.message}`);
      throw error;
    }
  }
}

