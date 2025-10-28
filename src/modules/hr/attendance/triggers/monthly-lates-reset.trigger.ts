import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../../../../prisma/prisma.service';
import { TimezoneUtil } from '../../../../common/utils/timezone.util';

@Injectable()
export class MonthlyLatesResetTrigger {
  private readonly logger = new Logger(MonthlyLatesResetTrigger.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly timezoneUtil: TimezoneUtil
  ) {}

  /**
   * Trigger that runs on the 1st of every month at 6:00 PM (18:00)
   * Resets monthly_lates to 3 for all employees in the attendance table
   */
  @Cron('0 18 1 * *', {
    name: 'monthly-lates-reset',
    timeZone: 'Asia/Karachi' // PKT timezone
  })
  async resetMonthlyLates(): Promise<number> {
    try {
      this.logger.log('Starting monthly lates reset trigger...');

      // Get current date in PKT using TimezoneUtil
      const pktDate = this.timezoneUtil.getCurrentPKTDate();
      
      this.logger.log(`Executing monthly lates reset for ${pktDate.toISOString()}`);

      // Update all employees' monthly_lates to 3
      const result = await this.prisma.attendance.updateMany({
        where: {
          // Update all records (no specific condition needed)
        },
        data: {
          monthlyLates: 3
        }
      });

      this.logger.log(`Successfully reset monthly_lates to 3 for ${result.count} employees`);

      // Log the action for audit purposes
      await this.logMonthlyLatesReset(result.count);

      return result.count;
    } catch (error) {
      this.logger.error('Error in monthly lates reset trigger:', error);
      throw error;
    }
  }

  /**
   * Log the monthly lates reset action for audit purposes
   */
  private async logMonthlyLatesReset(updatedCount: number) {
    try {
      // You can implement logging to a separate table or file here
      this.logger.log(`Monthly lates reset completed: ${updatedCount} employees updated`);
      
      // Example: Log to console with timestamp
      console.log(`[${new Date().toISOString()}] Monthly lates reset: ${updatedCount} employees updated`);
      
    } catch (error) {
      this.logger.error('Error logging monthly lates reset:', error);
    }
  }

  /**
   * Manual trigger method for testing or manual execution
   */
  async manualReset(): Promise<number> {
    this.logger.log('Manual monthly lates reset triggered');
    return await this.resetMonthlyLates();
  }

  /**
   * Get current monthly lates status for all employees
   */
  async getCurrentMonthlyLatesStatus() {
    try {
      const employees = await this.prisma.attendance.findMany({
        select: {
          employeeId: true,
          monthlyLates: true,
          employee: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        },
        orderBy: {
          employeeId: 'asc'
        }
      });

      return employees.map(emp => ({
        employee_id: emp.employeeId,
        employee_name: `${emp.employee.firstName} ${emp.employee.lastName}`,
        monthly_lates: emp.monthlyLates
      }));
    } catch (error) {
      this.logger.error('Error getting monthly lates status:', error);
      throw error;
    }
  }
} 