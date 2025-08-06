import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../../../../prisma/prisma.service';

@Injectable()
export class QuarterlyLeavesUpdateTrigger {
  private readonly logger = new Logger(QuarterlyLeavesUpdateTrigger.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Trigger that runs on the 1st of April, July, October at 6:00 PM (18:00)
   * Adds 5 to quarterly_leaves for all employees
   */
  @Cron('0 18 1 4,7,10 *', {
    name: 'quarterly-leaves-add',
    timeZone: 'Asia/Karachi' // PKT timezone
  })
  async addQuarterlyLeaves(): Promise<number> {
    try {
      this.logger.log('Starting quarterly leaves add trigger...');

      // Get current date in PKT
      const now = new Date();
      const pktDate = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Karachi' }));
      
      this.logger.log(`Executing quarterly leaves add for ${pktDate.toISOString()}`);

      // Update all employees' quarterly_leaves by adding 5
      const result = await this.prisma.attendance.updateMany({
        where: {
          // Update all records (no specific condition needed)
        },
        data: {
          quarterlyLeaves: {
            increment: 5
          }
        }
      });

      this.logger.log(`Successfully added 5 quarterly leaves for ${result.count} employees`);

      // Log the action for audit purposes
      await this.logQuarterlyLeavesUpdate('ADD', 5, result.count);

      return result.count;
    } catch (error) {
      this.logger.error('Error in quarterly leaves add trigger:', error);
      throw error;
    }
  }

  /**
   * Trigger that runs on the 1st of January at 6:00 PM (18:00)
   * Resets quarterly_leaves to 5 for all employees
   */
  @Cron('0 18 1 1 *', {
    name: 'quarterly-leaves-reset',
    timeZone: 'Asia/Karachi' // PKT timezone
  })
  async resetQuarterlyLeaves(): Promise<number> {
    try {
      this.logger.log('Starting quarterly leaves reset trigger...');

      // Get current date in PKT
      const now = new Date();
      const pktDate = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Karachi' }));
      
      this.logger.log(`Executing quarterly leaves reset for ${pktDate.toISOString()}`);

      // Update all employees' quarterly_leaves to 5
      const result = await this.prisma.attendance.updateMany({
        where: {
          // Update all records (no specific condition needed)
        },
        data: {
          quarterlyLeaves: 5
        }
      });

      this.logger.log(`Successfully reset quarterly_leaves to 5 for ${result.count} employees`);

      // Log the action for audit purposes
      await this.logQuarterlyLeavesUpdate('RESET', 5, result.count);

      return result.count;
    } catch (error) {
      this.logger.error('Error in quarterly leaves reset trigger:', error);
      throw error;
    }
  }

  /**
   * Log the quarterly leaves update action for audit purposes
   */
  private async logQuarterlyLeavesUpdate(action: 'ADD' | 'RESET', amount: number, updatedCount: number) {
    try {
      const actionText = action === 'ADD' ? 'added' : 'reset to';
      this.logger.log(`Quarterly leaves ${actionText} ${amount} for ${updatedCount} employees`);
      
      // Example: Log to console with timestamp
      console.log(`[${new Date().toISOString()}] Quarterly leaves ${actionText} ${amount}: ${updatedCount} employees updated`);
      
    } catch (error) {
      this.logger.error('Error logging quarterly leaves update:', error);
    }
  }

  /**
   * Manual trigger method for testing or manual execution
   */
  async manualAddQuarterlyLeaves(): Promise<number> {
    this.logger.log('Manual quarterly leaves add triggered');
    return await this.addQuarterlyLeaves();
  }

  async manualResetQuarterlyLeaves(): Promise<number> {
    this.logger.log('Manual quarterly leaves reset triggered');
    return await this.resetQuarterlyLeaves();
  }

  /**
   * Get current quarterly leaves status for all employees
   */
  async getCurrentQuarterlyLeavesStatus() {
    try {
      const employees = await this.prisma.attendance.findMany({
        select: {
          employeeId: true,
          quarterlyLeaves: true,
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
        quarterly_leaves: emp.quarterlyLeaves
      }));
    } catch (error) {
      this.logger.error('Error getting quarterly leaves status:', error);
      throw error;
    }
  }
} 