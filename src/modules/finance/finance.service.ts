import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { Prisma, EmployeeStatus, ProjectStatus } from '@prisma/client';

@Injectable()
export class FinanceService {
  private readonly logger = new Logger(FinanceService.name);

  constructor(private readonly prisma: PrismaService) {
    this.setupDailyScheduler();
  }

  /**
   * Assigns commission to sales employee when a project is completed.
   * Calculates commission based on cracked lead amount and sales department commission rate.
   */
  async assignCommission(projectId: number) {
    // 1. Fetch project and validate it's completed
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        crackedLead: {
          select: {
            id: true,
            amount: true,
            closedBy: true,
          },
        },
      },
    });

    if (!project) {
      throw new Error('Project does not exist');
    }

    if (project.status !== ProjectStatus.completed) {
      throw new Error('Project must be completed first');
    }

    if (!project.crackedLead) {
      throw new Error('Cracked lead not found for project');
    }

    const { crackedLead } = project;

    // 2. Validate cracked lead has required data
    if (!crackedLead.amount) {
      throw new Error('Invalid cracked lead commission data');
    }

    // 3. Fetch sales department record for the employee who closed the lead
    const salesDepartment = await this.prisma.salesDepartment.findFirst({
      where: { employeeId: crackedLead.closedBy },
    });

    if (!salesDepartment) {
      throw new Error('User not found');
    }

    // 4. Validate sales department has commission rate
    if (!salesDepartment.commissionRate) {
      throw new Error('Commission rate not set for employee');
    }

    // 5. Calculate commission (treat commission rate as percentage)
    const commissionRateDecimal = salesDepartment.commissionRate.dividedBy(100);
    const commission = crackedLead.amount.mul(commissionRateDecimal);

    // 6. Apply commission based on withhold flag
    let updateData: any = {
      updatedAt: new Date(),
    };

    if (salesDepartment.withholdFlag) {
      // Add to existing withhold commission
      const currentWithhold = salesDepartment.withholdCommission || new Prisma.Decimal(0);
      updateData.withholdCommission = currentWithhold.plus(commission);
    } else {
      // Add to existing commission amount
      const currentCommission = salesDepartment.commissionAmount || new Prisma.Decimal(0);
      updateData.commissionAmount = currentCommission.plus(commission);
    }

    // 7. Update sales department record
    const updatedSalesDept = await this.prisma.salesDepartment.update({
      where: { id: salesDepartment.id },
      data: updateData,
    });

    this.logger.log(
      `Commission assigned for project ${projectId}: ${commission.toFixed(2)} to employee ${crackedLead.closedBy}`,
    );

    return {
      status: 'success',
      message: 'Commission assigned',
      employee_id: crackedLead.closedBy,
      commission_amount: parseFloat(commission.toFixed(2)),
      withheld: salesDepartment.withholdFlag,
    };
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

  /**
   * Updates the withhold flag for a sales employee.
   * Only changes the flag if the new value is different from the current value.
   */
  async updateWithholdFlag(employeeId: number, flag: boolean) {
    // 1. Check if employee exists
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
    });

    if (!employee) {
      throw new Error('Employee does not exist');
    }

    // 2. Fetch sales department record for the employee
    const salesDepartment = await this.prisma.salesDepartment.findFirst({
      where: { employeeId },
    });

    if (!salesDepartment) {
      throw new Error('Sales department record not found for employee');
    }

    // 3. Check if flag change is needed
    if (salesDepartment.withholdFlag === flag) {
      throw new Error('Withhold flag is already set to the requested value');
    }

    // 4. Update the withhold flag
    const updatedSalesDept = await this.prisma.salesDepartment.update({
      where: { id: salesDepartment.id },
      data: {
        withholdFlag: flag,
        updatedAt: new Date(),
      },
    });

    this.logger.log(
      `Withhold flag updated for employee ${employeeId}: ${flag}`,
    );

    return {
      status: 'success',
      message: 'Withhold flag updated',
      employee_id: employeeId,
      new_flag: flag,
    };
  }

  /**
   * Sets or updates the base salary for an employee with proper permission checks.
   * Admins can set any salary, HR employees have restrictions.
   */
  async updateSalary(employeeId: number, amount: number, currentUserId: number, isAdmin: boolean, description?: string) {
    // 1. Check if employee exists and is active
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      select: { id: true, status: true },
    });

    if (!employee) {
      return {
        status: 'error',
        message: 'Employee does not exist',
        error_code: 'EMPLOYEE_NOT_FOUND'
      };
    }

    if (employee.status !== 'active') {
      return {
        status: 'error',
        message: 'Employee is not active',
        error_code: 'EMPLOYEE_INACTIVE'
      };
    }

    // 2. Check if account record exists (mandatory)
    const account = await this.prisma.account.findFirst({
      where: { employeeId },
      select: { id: true, baseSalary: true },
    });

    if (!account) {
      return {
        status: 'error',
        message: 'Account record does not exist for employee',
        error_code: 'ACCOUNT_NOT_FOUND'
      };
    }

    // 3. Apply permission restrictions for non-admin users
    if (!isAdmin) {
      // HR cannot set their own salary
      if (currentUserId === employeeId) {
        return {
          status: 'error',
          message: 'HR cannot set their own salary',
          error_code: 'SELF_SALARY_RESTRICTION'
        };
      }

      // Check if target employee is HR with salary permission
      const targetHr = await this.prisma.hR.findFirst({
        where: { employeeId },
        select: { salaryPermission: true },
      });

      if (targetHr?.salaryPermission) {
        return {
          status: 'error',
          message: 'HR cannot set salary of another HR with salary permission',
          error_code: 'HR_PERMISSION_RESTRICTION'
        };
      }
    }

    // 4. Get previous salary for logging
    const previousSalary = account.baseSalary || new Prisma.Decimal(0);
    const newSalary = new Prisma.Decimal(amount);

    // 5. Update the base salary
    const updatedAccount = await this.prisma.account.update({
      where: { id: account.id },
      data: {
        baseSalary: newSalary,
        updatedAt: new Date(),
      },
    });

    // 6. Handle logging and response based on user type
    if (isAdmin) {
      // Admin: No HR log, updated_by = 0
      this.logger.log(
        `Salary updated for employee ${employeeId}: ${previousSalary.toFixed(2)} -> ${newSalary.toFixed(2)} by admin`,
      );

      return {
        status: 'success',
        message: 'Salary updated successfully',
        employee_id: employeeId,
        previous_salary: parseFloat(previousSalary.toFixed(2)),
        new_salary: parseFloat(newSalary.toFixed(2)),
        updated_by: 0, // Admin action
      };
    } else {
      // HR: Create HR log entry
      const currentHr = await this.prisma.hR.findFirst({
        where: { employeeId: currentUserId },
        select: { id: true },
      });

      if (!currentHr) {
        return {
          status: 'error',
          message: 'HR record not found for current user',
          error_code: 'HR_RECORD_NOT_FOUND'
        };
      }

      // Generate description if not provided
      const logDescription = description || `Salary updated from ${previousSalary.toFixed(2)} to ${newSalary.toFixed(2)}`;

      // Create HR log entry
      await this.prisma.hRLog.create({
        data: {
          hrId: currentHr.id,
          actionType: 'salary_update',
          affectedEmployeeId: employeeId,
          description: logDescription,
        },
      });

      this.logger.log(
        `Salary updated for employee ${employeeId}: ${previousSalary.toFixed(2)} -> ${newSalary.toFixed(2)} by HR user ${currentUserId}`,
      );

      return {
        status: 'success',
        message: 'Salary updated successfully',
        employee_id: employeeId,
        previous_salary: parseFloat(previousSalary.toFixed(2)),
        new_salary: parseFloat(newSalary.toFixed(2)),
        updated_by: currentUserId,
      };
    }
  }

  /**
   * Transfers commission between withhold_commission and commission_amount.
   * Can transfer specific amount or full available amount (when amount is 0).
   */
  async transferCommission(employeeId: number, amount: number, direction: 'release' | 'withhold') {
    // 1. Check if employee exists
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
    });

    if (!employee) {
      throw new Error('Employee does not exist');
    }

    // 2. Fetch sales department record for the employee
    const salesDepartment = await this.prisma.salesDepartment.findFirst({
      where: { employeeId },
    });

    if (!salesDepartment) {
      throw new Error('Sales department record not found for employee');
    }

    // 3. Determine source and destination fields
    let sourceField: Prisma.Decimal;
    let destinationField: string;
    let sourceFieldName: string;
    let destinationFieldName: string;

    if (direction === 'release') {
      sourceField = salesDepartment.withholdCommission || new Prisma.Decimal(0);
      destinationField = 'commissionAmount';
      sourceFieldName = 'withhold_commission';
      destinationFieldName = 'commission_amount';
    } else {
      sourceField = salesDepartment.commissionAmount || new Prisma.Decimal(0);
      destinationField = 'withholdCommission';
      sourceFieldName = 'commission_amount';
      destinationFieldName = 'withhold_commission';
    }

    // 4. Calculate transfer amount
    let transferAmount: Prisma.Decimal;
    if (amount === 0) {
      transferAmount = sourceField;
    } else {
      transferAmount = new Prisma.Decimal(amount);
    }

    // 5. Validate transfer amount
    if (transferAmount.equals(0)) {
      throw new Error(`No funds available in ${sourceFieldName} to transfer`);
    }

    if (transferAmount.greaterThan(sourceField)) {
      throw new Error(`Insufficient funds in ${sourceFieldName}. Available: ${sourceField.toFixed(2)}, Requested: ${transferAmount.toFixed(2)}`);
    }

    // 6. Calculate new balances
    const newSourceBalance = sourceField.minus(transferAmount);
    const currentDestination = direction === 'release' 
      ? (salesDepartment.commissionAmount || new Prisma.Decimal(0))
      : (salesDepartment.withholdCommission || new Prisma.Decimal(0));
    const newDestinationBalance = currentDestination.plus(transferAmount);

    // 7. Update sales department record
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (direction === 'release') {
      updateData.withholdCommission = newSourceBalance;
      updateData.commissionAmount = newDestinationBalance;
    } else {
      updateData.commissionAmount = newSourceBalance;
      updateData.withholdCommission = newDestinationBalance;
    }

    const updatedSalesDept = await this.prisma.salesDepartment.update({
      where: { id: salesDepartment.id },
      data: updateData,
    });

    this.logger.log(
      `Commission transferred for employee ${employeeId}: ${transferAmount.toFixed(2)} from ${sourceFieldName} to ${destinationFieldName}`,
    );

    return {
      status: 'success',
      message: direction === 'release' ? 'Commission released' : 'Commission withheld',
      employee_id: employeeId,
      transferred_amount: parseFloat(transferAmount.toFixed(2)),
      from: sourceFieldName,
      to: destinationFieldName,
      new_balances: {
        commission_amount: parseFloat(newDestinationBalance.toFixed(2)),
        withhold_commission: parseFloat(newSourceBalance.toFixed(2)),
      },
    };
  }
}
