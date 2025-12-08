import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../../../../prisma/prisma.service';

@Injectable()
export class MonthlyLeavesUpdateTrigger {
  private readonly logger = new Logger(MonthlyLeavesUpdateTrigger.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Trigger that runs on the 1st of every month at 6:00 AM (Asia/Karachi)
   * Adds 2 leaves to each employee's available leaves (carry forward unused leaves)
   */
  @Cron('0 6 1 * *', {
    name: 'monthly-leaves-add',
    timeZone: 'Asia/Karachi',
  })
  async addMonthlyLeaves(): Promise<number> {
    try {
      this.logger.log('Starting monthly leaves add trigger...');
      const now = new Date();
      const pktDate = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Karachi' }));
      this.logger.log(`Executing monthly leaves add for ${pktDate.toISOString()}`);

      // Add 2 to availableLeaves for all employees
      const result = await this.prisma.attendance.updateMany({
        data: {
          availableLeaves: {
            increment: 2,
          },
        },
      });

      this.logger.log(`Successfully added 2 leaves for ${result.count} employees`);
      await this.logMonthlyLeavesUpdate('ADD', 2, result.count);
      return result.count;
    } catch (error) {
      this.logger.error('Error in monthly leaves add trigger:', error);
      throw error;
    }
  }

  /**
   * Log the monthly leaves update action for audit purposes
   */
  private async logMonthlyLeavesUpdate(
    action: 'ADD',
    amount: number,
    updatedCount: number,
  ) {
    try {
      this.logger.log(`Monthly leaves added ${amount} for ${updatedCount} employees`);
      console.log(`[${new Date().toISOString()}] Monthly leaves added ${amount}: ${updatedCount} employees updated`);
    } catch (error) {
      this.logger.error('Error logging monthly leaves update:', error);
    }
  }
}
