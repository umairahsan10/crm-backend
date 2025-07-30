import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { Prisma, EmployeeStatus } from '@prisma/client';

@Injectable()
export class FinanceService {
  private readonly logger = new Logger(FinanceService.name);

  constructor(private readonly prisma: PrismaService) {
    this.setupDailyScheduler();
  }

  /**
   * Public method used by the controller to calculate salary for a single employee.
   * Handles new-join, normal monthly, and termination scenarios based on optional dates.
   */
  async calculateSalary(
    employeeId: number,
    startDate?: string,
    endDate?: string,
  ) {
    // 1. Fetch required information in parallel
    const [employee, account, salesDept] = await Promise.all([
      this.prisma.employee.findUnique({
        where: { id: employeeId },
        select: {
          id: true,
          startDate: true,
          endDate: true,
          status: true,
          bonus: true,
        },
      }),
      this.prisma.account.findFirst({
        where: { employeeId },
        select: { baseSalary: true },
      }),
      this.prisma.salesDepartment.findFirst({
        where: { employeeId },
        select: { commissionAmount: true, bonus: true },
      }),
    ]);

    if (!employee) {
      throw new Error(`Employee with id ${employeeId} not found.`);
    }

    if (!account?.baseSalary) {
      throw new Error(`No base salary set for employee id ${employeeId}.`);
    }

    // Decimals from Prisma have arithmetic helpers (plus, div, mul)
    const baseSalary: Prisma.Decimal = account.baseSalary as Prisma.Decimal;

    const commission: Prisma.Decimal = (salesDept?.commissionAmount ?? new Prisma.Decimal(0)) as Prisma.Decimal;

    // Combine possible bonus sources (SalesDepartment + Employee table)
    const bonusSales: Prisma.Decimal = (salesDept?.bonus ?? new Prisma.Decimal(0)) as Prisma.Decimal;
    const bonusEmp: Prisma.Decimal = (employee.bonus ?? new Prisma.Decimal(0)) as Prisma.Decimal;
    const totalBonus = bonusSales.plus(bonusEmp);

    // Determine calculation month (year-month string) using reference date in PKT
    const referenceDate = startDate
      ? new Date(startDate)
      : endDate
      ? new Date(endDate)
      : new Date();

    const year = referenceDate.getUTCFullYear();
    const month = referenceDate.getUTCMonth(); // 0-based (0 = Jan)

    const DAYS_IN_CYCLE = 30; // Always treat every month as 30-day for salary purposes

    let daysWorked = DAYS_IN_CYCLE; // default – full month

    if (startDate) {
      // Prorate for new employee – remaining days in the 30-day cycle
      const join = new Date(startDate);
      daysWorked = DAYS_IN_CYCLE - (join.getUTCDate() - 1);
    } else if (endDate) {
      // Prorate for termination – worked until (and incl.) the given day, capped at 30
      const term = new Date(endDate);
      daysWorked = Math.min(term.getUTCDate(), DAYS_IN_CYCLE);
    }

    // Calculate prorated/basic part (base salary divided by 30)
    const dailyRate = baseSalary.dividedBy(DAYS_IN_CYCLE);
    const proratedSalary = dailyRate.times(daysWorked);

    const netSalary = proratedSalary.plus(commission).plus(totalBonus);

    const monthString = `${year}-${String(month + 1).padStart(2, '0')}`; // e.g. 2025-07

    // Insert log (processedBy and paidOn are left null)
    const logEntry = await this.prisma.netSalaryLog.create({
      data: {
        employeeId,
        month: monthString,
        netSalary,
        deductions: 0,
      },
    });

    this.logger.log(
      `Salary calculated for employee ${employeeId} for ${monthString}: ${netSalary.toFixed()}`,
    );

    return logEntry;
  }

  /**
   * Sets up a simple in-memory timer that triggers each day at 00:05. If the
   * current day is the last day of the month, it will run salary calculations
   * for every active employee.
   */
  private setupDailyScheduler() {
    const PKT_OFFSET_MS = 5 * 60 * 60 * 1000; // UTC+5

    const scheduleNextRun = () => {
      const now = new Date();

      // Current time in PKT
      const pktNow = new Date(now.getTime() + PKT_OFFSET_MS);

      // Today in PKT at 00:05
      const nextPkt = new Date(
        pktNow.getFullYear(),
        pktNow.getMonth(),
        pktNow.getDate(),
        0,
        5,
        0,
        0,
      );

      // If already past 00:05 PKT, schedule for next day
      if (pktNow >= nextPkt) {
        nextPkt.setDate(nextPkt.getDate() + 1);
      }

      // Convert nextPkt back to UTC epoch for setTimeout
      const nextRunUtcMs = nextPkt.getTime() - PKT_OFFSET_MS;
      const delay = nextRunUtcMs - now.getTime();

      setTimeout(async () => {
        try {
          await this.runDailyJob();
        } catch (err) {
          this.logger.error(`Daily salary cron failed: ${err.message}`);
        } finally {
          // Schedule subsequent run
          scheduleNextRun();
        }
      }, delay);
    };

    // Kick off the initial schedule
    scheduleNextRun();
  }

  /**
   * Executes the daily job; if today is the last day of its month, calculate
   * salaries for all active employees.
   */
  private async runDailyJob() {

    const PKT_OFFSET_MS = 5 * 60 * 60 * 1000;
    const pktToday = new Date(Date.now() + PKT_OFFSET_MS);
    const pktTomorrow = new Date(
      pktToday.getFullYear(),
      pktToday.getMonth(),
      pktToday.getDate() + 1,
    );

    if (pktTomorrow.getMonth() === pktToday.getMonth()) {
      // Not the last day of the month in PKT – do nothing
      return;
    }

    this.logger.log('Running month-end salary generation for all active employees');

    // Fetch all active employees
    const activeEmployees = await this.prisma.employee.findMany({
      where: { status: EmployeeStatus.active },
      select: { id: true },
    });

    for (const emp of activeEmployees) {
      try {
        await this.calculateSalary(emp.id);
      } catch (err) {
        this.logger.error(
          `Failed to calculate salary for employee ${emp.id}: ${err.message}`,
        );
      }
    }
  }
}
