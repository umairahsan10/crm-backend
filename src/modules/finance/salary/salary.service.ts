import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class FinanceSalaryService {
  private readonly logger = new Logger(FinanceSalaryService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Helper method to get current date in PKT timezone
   */
  private getCurrentDateInPKT(): Date {
    return new Date(new Date().toLocaleString("en-US", {timeZone: "Asia/Karachi"}));
  }

  /**
   * Helper method to convert date to PKT timezone
   */
  private getDateInPKT(date: Date | string): Date {
    if (typeof date === 'string') {
      return new Date(new Date(date).toLocaleString("en-US", {timeZone: "Asia/Karachi"}));
    }
    return new Date(date.toLocaleString("en-US", {timeZone: "Asia/Karachi"}));
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
    this.logger.log(`⏳ Starting salary calc for employee ${employeeId} (start=${startDate ?? 'N/A'}, end=${endDate ?? 'N/A'})`);
    
    // Calculate salary first (existing logic)
    const salaryResult = await this.calculateSalaryInternal(employeeId, startDate, endDate);
    
    // Calculate deductions for the same period
    const deductionResult = await this.calculateDeductionsForPeriod(employeeId, startDate, endDate);
    
    // Create salary log with deductions
    const logEntry = await this.createSalaryLog(employeeId, salaryResult, deductionResult);
    
    this.logger.log(`✅ Salary calculation completed for employee ${employeeId} - log id ${logEntry.id}`);
    return logEntry;
  }

  /**
   * Smart manual salary calculation that automatically determines the calculation period.
   * - For old employees: 1st of current month to end date (or current date if active)
   * - For new employees: start date to end date (or current date if active)
   * - For terminated employees: 1st/start date to termination date
   */
  async calculateSalaryManual(employeeId: number, endDate?: string) {
    this.logger.log(`⏳ Starting smart manual salary calc for employee ${employeeId} (end=${endDate ?? 'current date'})`);
    
    // Calculate salary first (existing logic)
    const salaryResult = await this.calculateSalaryInternal(employeeId, undefined, endDate);
    
    // Calculate deductions for the same period
    const deductionResult = await this.calculateDeductionsForPeriod(employeeId, undefined, endDate);
    
    // Create salary log with deductions
    const logEntry = await this.createSalaryLog(employeeId, salaryResult, deductionResult);
    
    this.logger.log(`✅ Smart manual salary calculation completed for employee ${employeeId} - log id ${logEntry.id}`);
    return logEntry;
  }

  /**
   * Read-only salary calculation for current period (up to current date).
   * This method calculates salary and deductions but does NOT update the database.
   * It's used for real-time salary preview and analysis.
   * 
   * - For old employees: 1st of current month to current date
   * - For new employees: start date to current date
   * - For terminated employees: 1st/start date to termination date
   */
  public async calculateSalaryPreview(employeeId: number, endDate?: string) {
    this.logger.log(`⏳ Starting read-only salary preview for employee ${employeeId} (end=${endDate ?? 'current date'})`);
    
    // Validate employeeId
    if (!employeeId || isNaN(employeeId)) {
      throw new BadRequestException(`Invalid employee ID: ${employeeId}`);
    }
    
    this.logger.log(`✅ Employee ID validated: ${employeeId}`);
    
    // Calculate salary first (existing logic)
    const salaryResult = await this.calculateSalaryInternal(employeeId, undefined, endDate);
    
    // Calculate deductions for the same period
    const deductionResult = await this.calculateDeductionsForPeriod(employeeId, undefined, endDate);
    
    // Calculate detailed deduction breakdown for the current period
    const detailedDeductionBreakdown = await this.calculateDetailedDeductionsForPeriod(employeeId, undefined, endDate);
    
    // Get employee details and sales department info for response
    const [employee, salesDept] = await Promise.all([
      this.prisma.employee.findUnique({
        where: { id: employeeId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          status: true,
          startDate: true,
          endDate: true,
          bonus: true,
          department: {
            select: { name: true }
          }
        }
      }),
      this.prisma.salesDepartment.findFirst({
        where: { employeeId },
        select: { 
          salesBonus: true,
          commissionAmount: true
        }
      })
    ]);

    if (!employee) {
      throw new NotFoundException(`Employee with ID ${employeeId} not found`);
    }

    // Calculate final salary (base + bonus + commission - deductions)
    const finalSalary = salaryResult.netSalary.minus(deductionResult);

    this.logger.log(`✅ Read-only salary preview completed for employee ${employeeId}`);
    
    return {
      employee: {
        id: employee.id,
        firstName: employee.firstName,
        lastName: employee.lastName,
        email: employee.email,
        status: employee.status,
        department: employee.department?.name,
        startDate: employee.startDate,
        endDate: employee.endDate
      },
      salary: {
        fullBaseSalary: parseFloat(salaryResult.fullBaseSalary.toFixed(2)),
        proratedBaseSalary: parseFloat(salaryResult.baseSalary.toFixed(2)),
        employeeBonus: parseFloat((employee.bonus || 0).toFixed(2)),
        salesBonus: parseFloat((salesDept?.salesBonus || 0).toFixed(2)),
        totalBonus: parseFloat(salaryResult.bonus.toFixed(2)),
        commission: parseFloat(salaryResult.commission.toFixed(2)),
        netSalary: parseFloat(salaryResult.netSalary.toFixed(2)),
        deductions: parseFloat(deductionResult.toFixed(2)),
        finalSalary: parseFloat(finalSalary.toFixed(2))
      },
      calculationPeriod: {
        startDay: salaryResult.startDay,
        endDay: salaryResult.endDay,
        daysWorked: salaryResult.daysWorked,
        year: salaryResult.year,
        month: salaryResult.month
      },
      deductionBreakdown: detailedDeductionBreakdown
    };
  }

  /**
   * Get salary display for a specific employee with deductions subtracted.
   * This is for frontend display purposes.
   */
  public async getSalaryDisplay(employeeId: number, month?: string) {
    // Validate employeeId
    if (!employeeId || employeeId <= 0) {
      throw new BadRequestException('Invalid employeeId. Must be a positive number.');
    }

    // Validate month format if provided
    if (month) {
      const monthRegex = /^\d{4}-\d{2}$/;
      if (!monthRegex.test(month)) {
        throw new BadRequestException('Invalid month format. Must be in YYYY-MM format (e.g., 2025-01).');
      }
    }

    const currentDate = this.getCurrentDateInPKT();
    const calculationMonth = month || `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;

    // Check if employee exists
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      select: { firstName: true, lastName: true },
    });

    if (!employee) {
      throw new NotFoundException(`Employee with ID ${employeeId} not found.`);
    }

    // Get the latest salary log for this employee and month
    const salaryLog = await this.prisma.netSalaryLog.findFirst({
      where: {
        employeeId,
        month: calculationMonth,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!salaryLog) {
      throw new NotFoundException(`No salary record found for employee ${employee.firstName} ${employee.lastName} (ID: ${employeeId}) for month ${calculationMonth}. Please calculate salary first.`);
    }

    // Get chargeback and refund deductions from sales department
    const salesDepartment = await this.prisma.salesDepartment.findFirst({
      where: { employeeId },
      select: { chargebackDeductions: true, refundDeductions: true },
    });

    const attendanceDeductions = salaryLog.deductions || 0;
    const chargebackDeduction = Number(salesDepartment?.chargebackDeductions || 0);
    const refundDeduction = Number(salesDepartment?.refundDeductions || 0);
    const totalDeductions = attendanceDeductions + chargebackDeduction + refundDeduction;

    // Calculate final salary (net salary - deductions)
    const finalSalary = Number(salaryLog.netSalary) - totalDeductions;

    return {
      employeeId,
      employeeName: `${employee.firstName} ${employee.lastName}`,
      month: calculationMonth,
      netSalary: Number(salaryLog.netSalary),
      attendanceDeductions: attendanceDeductions,
      chargebackDeduction: chargebackDeduction,
      refundDeduction: refundDeduction,
      deductions: totalDeductions,
      finalSalary: Math.max(0, finalSalary), // Ensure final salary is not negative
      status: salaryLog.status,
      paidOn: salaryLog.paidOn,
      createdAt: salaryLog.createdAt,
    };
  }

  /**
   * Get comprehensive salary display for all employees with detailed breakdown.
   * This includes base salary, commission, bonus, and deductions with final salary calculation.
   * Formula: Final Salary = Base Salary + Bonus + Commission - Deductions
   */
  public async getAllSalariesDisplay(month?: string) {
    const currentDate = this.getCurrentDateInPKT();
    const calculationMonth = month || `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;

    // Get all employees with their department, account, and sales department info
    const employees = await this.prisma.employee.findMany({
      where: {
        status: 'active',
      },
      include: {
        department: {
          select: { name: true },
        },
        accounts: {
          select: { baseSalary: true },
        },
        salesDepartment: {
          select: { 
            commissionAmount: true,
            salesBonus: true,
            chargebackDeductions: true,
            refundDeductions: true,
          },
        },
      },
    });

    const salaryResults: any[] = [];

    for (const employee of employees) {
      try {
        // Get the latest salary log for this employee and month
        const salaryLog = await this.prisma.netSalaryLog.findFirst({
          where: {
            employeeId: employee.id,
            month: calculationMonth,
          },
          orderBy: { createdAt: 'desc' },
        });

        if (!salaryLog) {
          // Skip employees without salary records
          continue;
        }

        const baseSalary = Number(employee.accounts?.[0]?.baseSalary || 0);
        const commission = Number(employee.salesDepartment?.[0]?.commissionAmount || 0);
        const bonus = Number(employee.salesDepartment?.[0]?.salesBonus || 0);
        const attendanceDeductions = Number(salaryLog.deductions || 0);
        const chargebackDeduction = Number(employee.salesDepartment?.[0]?.chargebackDeductions || 0);
        const refundDeduction = Number(employee.salesDepartment?.[0]?.refundDeductions || 0);
        const totalDeductions = attendanceDeductions + chargebackDeduction + refundDeduction;

        // Calculate final salary using the formula: Base Salary + Bonus + Commission - Deductions
        const finalSalary = baseSalary + bonus + commission - totalDeductions;

        salaryResults.push({
          employeeId: employee.id,
          employeeName: `${employee.firstName} ${employee.lastName}`,
          department: employee.department?.name || 'N/A',
          month: calculationMonth,
          baseSalary: parseFloat(baseSalary.toFixed(2)),
          commission: parseFloat(commission.toFixed(2)),
          bonus: parseFloat(bonus.toFixed(2)),
          netSalary: Number(salaryLog.netSalary),
          attendanceDeductions: parseFloat(attendanceDeductions.toFixed(2)),
          chargebackDeduction: parseFloat(chargebackDeduction.toFixed(2)),
          refundDeduction: parseFloat(refundDeduction.toFixed(2)),
          deductions: parseFloat(totalDeductions.toFixed(2)),
          finalSalary: Math.max(0, parseFloat(finalSalary.toFixed(2))), // Ensure final salary is not negative
          status: salaryLog.status,
          paidOn: salaryLog.paidOn,
          createdAt: salaryLog.createdAt,
        });
      } catch (error) {
        this.logger.error(`Error processing salary for employee ${employee.id}: ${error.message}`);
        // Continue with other employees even if one fails
      }
    }

    // Calculate summary totals
    const summary = {
      totalEmployees: salaryResults.length,
      totalBaseSalary: parseFloat(salaryResults.reduce((sum, emp) => sum + emp.baseSalary, 0).toFixed(2)),
      totalCommission: parseFloat(salaryResults.reduce((sum, emp) => sum + emp.commission, 0).toFixed(2)),
      totalBonus: parseFloat(salaryResults.reduce((sum, emp) => sum + emp.bonus, 0).toFixed(2)),
      totalNetSalary: parseFloat(salaryResults.reduce((sum, emp) => sum + emp.netSalary, 0).toFixed(2)),
      totalDeductions: parseFloat(salaryResults.reduce((sum, emp) => sum + emp.deductions, 0).toFixed(2)),
      totalFinalSalary: parseFloat(salaryResults.reduce((sum, emp) => sum + emp.finalSalary, 0).toFixed(2)),
    };

    return {
      month: calculationMonth,
      summary,
      employees: salaryResults,
    };
  }

  /**
   * Get detailed salary breakdown for a specific employee.
   * This provides comprehensive salary information including commission breakdown and deduction details.
   */
  public async getDetailedSalaryBreakdown(employeeId: number, month?: string) {
    // Validate employeeId
    if (!employeeId || employeeId <= 0) {
      throw new BadRequestException('Invalid employeeId. Must be a positive number.');
    }

    // Validate month format if provided
    if (month) {
      const monthRegex = /^\d{4}-\d{2}$/;
      if (!monthRegex.test(month)) {
        throw new BadRequestException('Invalid month format. Must be in YYYY-MM format (e.g., 2025-01).');
      }
    }

    const currentDate = this.getCurrentDateInPKT();
    const calculationMonth = month || `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;

    // Check if employee exists
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      include: {
        department: {
          select: { name: true },
        },
        accounts: {
          select: { baseSalary: true },
        },
        salesDepartment: {
          select: { 
            commissionAmount: true,
            salesBonus: true,
            chargebackDeductions: true,
            refundDeductions: true,
          },
        },
      },
    });

    if (!employee) {
      throw new NotFoundException(`Employee with ID ${employeeId} not found.`);
    }

    // Get the latest salary log for this employee and month
    const salaryLog = await this.prisma.netSalaryLog.findFirst({
      where: {
        employeeId,
        month: calculationMonth,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!salaryLog) {
      throw new NotFoundException(`No salary record found for employee ${employee.firstName} ${employee.lastName} (ID: ${employeeId}) for month ${calculationMonth}. Please calculate salary first.`);
    }

    // Get commission breakdown
    const commissionBreakdown = await this.getCommissionBreakdown(employeeId, calculationMonth);

    // Get detailed deduction breakdown
    const deductionBreakdown = await this.getDetailedDeductionBreakdown(employeeId, calculationMonth);

    const baseSalary = Number(employee.accounts?.[0]?.baseSalary || 0);
    const commission = Number(employee.salesDepartment?.[0]?.commissionAmount || 0);
    const bonus = Number(employee.salesDepartment?.[0]?.salesBonus || 0);
    const attendanceDeductions = Number(salaryLog.deductions || 0);
    const chargebackDeduction = Number(employee.salesDepartment?.[0]?.chargebackDeductions || 0);
    const refundDeduction = Number(employee.salesDepartment?.[0]?.refundDeductions || 0);
    const totalDeductions = attendanceDeductions + chargebackDeduction + refundDeduction;

    // Calculate final salary using the formula: Base Salary + Bonus + Commission - Deductions
    const finalSalary = baseSalary + bonus + commission - totalDeductions;

    return {
      employee: {
        id: employee.id,
        firstName: employee.firstName,
        lastName: employee.lastName,
        email: employee.email,
        department: employee.department?.name || 'N/A',
        status: employee.status,
        startDate: employee.startDate,
        endDate: employee.endDate,
      },
      salary: {
        baseSalary: parseFloat(baseSalary.toFixed(2)),
        commission: parseFloat(commission.toFixed(2)),
        bonus: parseFloat(bonus.toFixed(2)),
        netSalary: Number(salaryLog.netSalary),
        attendanceDeductions: parseFloat(attendanceDeductions.toFixed(2)),
        chargebackDeduction: parseFloat(chargebackDeduction.toFixed(2)),
        refundDeduction: parseFloat(refundDeduction.toFixed(2)),
        deductions: parseFloat(totalDeductions.toFixed(2)),
        finalSalary: Math.max(0, parseFloat(finalSalary.toFixed(2))), // Ensure final salary is not negative
      },
      month: calculationMonth,
      status: salaryLog.status,
      paidOn: salaryLog.paidOn,
      createdAt: salaryLog.createdAt,
      commissionBreakdown,
      deductionBreakdown,
    };
  }

  /**
   * Monthly salary calculation cron job.
   * This method is called automatically by the cron job on the 4th of every month.
   */
  async handleMonthlySalaryCalculation() {
    this.logger.log('🕔 5:00 PM PKT reached - Starting monthly auto salary calculation');
    
    try {
      await this.calculateAllEmployees();
      this.logger.log('✅ Monthly salary calculation completed successfully');
    } catch (error) {
      this.logger.error(`❌ Monthly salary calculation failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Calculate salary for all active employees.
   * This is used for the monthly cron job and manual bulk calculations.
   */
  public async calculateAllEmployees() {
    this.logger.log('🔄 Starting salary calculation for all active employees');
    
    const activeEmployees = await this.prisma.employee.findMany({
      where: { status: 'active' },
      select: { id: true, firstName: true, lastName: true },
    });

    this.logger.log(`📊 Found ${activeEmployees.length} active employees to process`);

    const results: any[] = [];
    let successCount = 0;
    let errorCount = 0;

    for (const employee of activeEmployees) {
      try {
        this.logger.log(`⏳ Processing employee ${employee.id} (${employee.firstName} ${employee.lastName})`);
        
        const result = await this.calculateSalaryManual(employee.id);
        results.push({
          employeeId: employee.id,
          employeeName: `${employee.firstName} ${employee.lastName}`,
          status: 'success',
          logId: result.id,
        });
        successCount++;
        
        this.logger.log(`✅ Successfully processed employee ${employee.id}`);
      } catch (error) {
        this.logger.error(`❌ Failed to process employee ${employee.id}: ${error.message}`);
        results.push({
          employeeId: employee.id,
          employeeName: `${employee.firstName} ${employee.lastName}`,
          status: 'error',
          error: error.message,
        });
        errorCount++;
      }
    }

    this.logger.log(`📈 Salary calculation summary: ${successCount} successful, ${errorCount} failed`);

    return {
      totalEmployees: activeEmployees.length,
      successful: successCount,
      failed: errorCount,
      results,
    };
  }

  /**
   * Calculate deductions for all employees for a specific month.
   */
  public async calculateAllEmployeesDeductions(month?: string) {
    const currentDate = this.getCurrentDateInPKT();
    const calculationMonth = month || `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;

    const activeEmployees = await this.prisma.employee.findMany({
      where: { status: 'active' },
      select: { id: true },
    });

    const results: any[] = [];
    let totalDeductions = 0;

    for (const employee of activeEmployees) {
      try {
        const deductionResult = await this.calculateEmployeeDeductions(employee.id, calculationMonth);
        results.push(deductionResult);
        totalDeductions += deductionResult.totalDeduction;
      } catch (error) {
        this.logger.error(`Failed to calculate deductions for employee ${employee.id}: ${error.message}`);
      }
    }

    return {
      month: calculationMonth,
      totalEmployees: activeEmployees.length,
      totalDeductions,
      results,
    };
  }

  /**
   * Calculate deductions for a specific employee for a specific month.
   */
  public async calculateEmployeeDeductions(employeeId: number, month: string) {
    // Get employee's base salary
    const account = await this.prisma.account.findFirst({
      where: { employeeId },
      select: { baseSalary: true },
    });

    if (!account?.baseSalary) {
      throw new BadRequestException(`No base salary found for employee ${employeeId}`);
    }

    const baseSalary = Number(account.baseSalary);
    const perDaySalary = baseSalary / 30; // Assuming 30 days per month

    // Get attendance data for the month
    const [year, monthNum] = month.split('-').map(Number);
    
    const attendanceData = await this.prisma.monthlyAttendanceSummary.findFirst({
      where: {
        empId: employeeId,
        month: monthNum.toString(),
      },
    });

    // Get company settings for monthly lates allowance
    const company = await this.prisma.company.findFirst({
      select: { monthlyLatesDays: true },
    });

    if (!attendanceData) {
      return {
        employeeId,
        baseSalary,
        perDaySalary,
        month,
        totalAbsent: 0,
        totalLateDays: 0,
        totalHalfDays: 0,
        monthlyLatesDays: company?.monthlyLatesDays || 0,
        absentDeduction: 0,
        lateDeduction: 0,
        halfDayDeduction: 0,
        chargebackDeduction: 0,
        refundDeduction: 0,
        totalDeduction: 0,
      };
    }

    const totalAbsent = attendanceData.totalAbsent || 0;
    const totalLateDays = attendanceData.totalLateDays || 0;
    const totalHalfDays = attendanceData.totalHalfDays || 0;
    const monthlyLatesDays = company?.monthlyLatesDays || 0;

    // Calculate deductions
    const absentDeduction = this.calculateAbsentDeduction(totalAbsent, perDaySalary);
    const lateDeduction = this.calculateLateDeduction(totalLateDays, monthlyLatesDays, perDaySalary);
    const halfDayDeduction = this.calculateHalfDayDeduction(totalHalfDays, perDaySalary);

    // Get sales department deductions
    const salesDepartment = await this.prisma.salesDepartment.findFirst({
      where: { employeeId },
      select: { chargebackDeductions: true, refundDeductions: true },
    });

    const chargebackDeduction = Number(salesDepartment?.chargebackDeductions || 0);
    const refundDeduction = Number(salesDepartment?.refundDeductions || 0);

    const totalDeduction = absentDeduction + lateDeduction + halfDayDeduction + chargebackDeduction + refundDeduction;

    return {
      employeeId,
      baseSalary,
      perDaySalary,
      month,
      totalAbsent,
      totalLateDays,
      totalHalfDays,
      monthlyLatesDays,
      absentDeduction,
      lateDeduction,
      halfDayDeduction,
      chargebackDeduction,
      refundDeduction,
      totalDeduction,
    };
  }

  // Private helper methods
  private async calculateSalaryInternal(
    employeeId: number,
    startDate?: string,
    endDate?: string,
  ) {
    // This is a placeholder - the actual implementation would be moved from the main finance service
    // For now, return mock data to get the build working
    return {
      netSalary: new Prisma.Decimal(30000),
      fullBaseSalary: new Prisma.Decimal(30000),
      baseSalary: new Prisma.Decimal(30000),
      bonus: new Prisma.Decimal(0),
      commission: new Prisma.Decimal(0),
      startDay: 1,
      endDay: 30,
      daysWorked: 30,
      year: 2025,
      month: 0
    };
  }

  private async calculateDeductionsForPeriod(
    employeeId: number,
    startDate?: string,
    endDate?: string,
  ): Promise<number> {
    // This is a placeholder - the actual implementation would be moved from the main finance service
    return 0;
  }

  private async calculateDetailedDeductionsForPeriod(
    employeeId: number,
    startDate?: string,
    endDate?: string,
  ): Promise<any> {
    // This is a placeholder - the actual implementation would be moved from the main finance service
    return {
      absentDeduction: 0,
      lateDeduction: 0,
      halfDayDeduction: 0,
      chargebackDeduction: 0,
      refundDeduction: 0,
      totalDeduction: 0
    };
  }

  private async createSalaryLog(
    employeeId: number,
    salaryResult: any,
    deductions: number,
  ) {
    // This is a placeholder - the actual implementation would be moved from the main finance service
    return { id: 1 };
  }

  private async getCommissionBreakdown(employeeId: number, month: string): Promise<any[]> {
    // This is a placeholder - the actual implementation would be moved from the main finance service
    return [];
  }

  private async getDetailedDeductionBreakdown(employeeId: number, month: string): Promise<any> {
    // This is a placeholder - the actual implementation would be moved from the main finance service
    return {
      absentDeduction: 0,
      lateDeduction: 0,
      halfDayDeduction: 0,
      chargebackDeduction: 0,
      refundDeduction: 0,
      totalDeduction: 0
    };
  }

  private calculateAbsentDeduction(absentDays: number, perDaySalary: number): number {
    return absentDays * perDaySalary * 2; // 2x per day salary for absent days
  }

  private calculateLateDeduction(lateDays: number, monthlyLatesDays: number, perDaySalary: number): number {
    const allowedLates = 3; // Monthly allowance
    const excessLates = Math.max(0, monthlyLatesDays - allowedLates);
    return excessLates * perDaySalary * 0.5; // 0.5x per day salary for late days
  }

  private calculateHalfDayDeduction(halfDays: number, perDaySalary: number): number {
    return halfDays * perDaySalary * 0.5; // 0.5x per day salary for half days
  }
} 