import { BadGatewayException, BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../../prisma/prisma.service';

import { Prisma, EmployeeStatus, ProjectStatus } from '@prisma/client';
@Injectable()
export class FinanceService {
  private readonly logger = new Logger(FinanceService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Helper method to get current date in PKT timezone
   */
  private getCurrentDateInPKT(): Date {
    return new Date(new Date().toLocaleString("en-US", {timeZone: "Asia/Karachi"}));
  }

  /**
   * Helper method to get date in PKT timezone
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
   * Internal method that contains the original salary calculation logic.
   * This method is kept unchanged to preserve existing functionality.
   */
  private async calculateSalaryInternal(
    employeeId: number,
    startDate?: string,
    endDate?: string,
  ) {
    this.logger.log(`🔍 calculateSalaryInternal called with employeeId: ${employeeId}, startDate: ${startDate}, endDate: ${endDate}`);
    
    // Validate employeeId again
    if (!employeeId || isNaN(employeeId)) {
      throw new BadRequestException(`Invalid employee ID in calculateSalaryInternal: ${employeeId}`);
    }
    
    // 1. Fetch required information in parallel
    const [employee, account, salesDept] = await this.prisma.$transaction([
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
        select: { commissionAmount: true, salesBonus: true },
      }),
    ]);

    if (!employee) {
      throw new NotFoundException(`Employee with ID ${employeeId} not found`);
    }

    if (!account?.baseSalary) {
      throw new BadRequestException(`No base salary set for employee ID ${employeeId}`);
    }

    // Decimals from Prisma have arithmetic helpers (plus, div, mul)
    const baseSalary: Prisma.Decimal = account.baseSalary as Prisma.Decimal;

    const commission: Prisma.Decimal = (salesDept?.commissionAmount ?? new Prisma.Decimal(0)) as Prisma.Decimal;

    // Combine possible bonus sources (SalesDepartment + Employee table)
    const salesBonus: Prisma.Decimal = (salesDept?.salesBonus ?? new Prisma.Decimal(0)) as Prisma.Decimal;
    const employeeBonus: Prisma.Decimal = (employee.bonus ?? new Prisma.Decimal(0)) as Prisma.Decimal;
    const totalBonus = salesBonus.plus(employeeBonus);

    // Determine calculation month (year-month string) using reference date in PKT
    const referenceDate = startDate
      ? new Date(startDate)
      : endDate
      ? new Date(endDate)
      : new Date();

    const year = referenceDate.getUTCFullYear();
    const month = referenceDate.getUTCMonth(); // 0-based (0 = Jan)
    const endDay = referenceDate.getDate();

    // Always use 30 days for salary calculation (standard practice)
    const DAYS_IN_CYCLE = 30;
    
    let startDay = 1; // Default start day (1st of month)
    let daysWorked: number;
    
    // Determine start day based on employee type
    if (employee.startDate) {
      const employeeStartDate = new Date(employee.startDate);
      const employeeStartYear = employeeStartDate.getUTCFullYear();
      const employeeStartMonth = employeeStartDate.getUTCMonth();
      const employeeStartDay = employeeStartDate.getDate();
      
      // If employee started this month, use start day
      if (employeeStartYear === year && employeeStartMonth === month) {
        startDay = employeeStartDay;
        this.logger.log(`New employee ${employeeId} started on day ${startDay} - calculating from start date`);
      }
    }
    
    // Calculate days worked
    daysWorked = endDay - startDay + 1;
    
    // Calculate proportional salary (only base salary is prorated)
    const proportionalSalary = baseSalary.mul(daysWorked).div(DAYS_IN_CYCLE);
    
    // Commission and bonuses are added as full amounts (not prorated)
    const fullCommission = commission;
    const fullBonus = totalBonus;
    
    // Calculate total net salary
    const netSalary = proportionalSalary.plus(fullCommission).plus(fullBonus);
    
    return {
      netSalary,
      baseSalary: proportionalSalary,
      fullBaseSalary: baseSalary,
      commission: fullCommission,
      bonus: fullBonus,
      daysWorked,
      startDay,
      endDay,
      year,
      month,
    };
  }

  /**
   * Calculate deductions for a specific period.
   */
  private async calculateDeductionsForPeriod(
    employeeId: number,
    startDate?: string,
    endDate?: string,
  ): Promise<number> {
    try {
      // Determine the calculation period
      const referenceDate = startDate
        ? new Date(startDate)
        : endDate
        ? new Date(endDate)
        : new Date();

      const year = referenceDate.getUTCFullYear();
      const month = referenceDate.getUTCMonth() + 1; // Convert to 1-based
      const calculationMonth = `${year}-${String(month).padStart(2, '0')}`;

      // Calculate deductions for this month
      const deductionResult = await this.calculateEmployeeDeductions(employeeId, calculationMonth);
      
      // If we have specific start/end dates, we need to prorate the deductions
      if (startDate || endDate) {
        const startDay = startDate ? new Date(startDate).getDate() : 1;
        const endDay = endDate ? new Date(endDate).getDate() : new Date(year, month, 0).getDate();
        const daysInPeriod = endDay - startDay + 1;
        const daysInMonth = new Date(year, month, 0).getDate();
        
        // Prorate attendance-based deductions (absent, late, half-day)
        const attendanceDeductions = deductionResult.absentDeduction + deductionResult.lateDeduction + deductionResult.halfDayDeduction;
        const proratedAttendanceDeductions = (attendanceDeductions * daysInPeriod) / daysInMonth;
        
        // Chargeback and refund deductions are not prorated (they are fixed amounts)
        const chargebackDeduction = deductionResult.chargebackDeduction || 0;
        const refundDeduction = deductionResult.refundDeduction || 0;
        
        // Calculate total prorated deduction
        const proratedTotalDeduction = proratedAttendanceDeductions + chargebackDeduction + refundDeduction;
        return Math.round(proratedTotalDeduction);
      }

      return Math.round(deductionResult.totalDeduction);
    } catch (error) {
      this.logger.warn(`Failed to calculate deductions for employee ${employeeId}: ${error.message}`);
      return 0; // Return 0 deductions if calculation fails
    }
  }

  /**
   * Calculate detailed deduction breakdown for a specific period
   */
  private async calculateDetailedDeductionsForPeriod(
    employeeId: number,
    startDate?: string,
    endDate?: string,
  ): Promise<any> {
    try {
      // Determine the calculation period
      const referenceDate = startDate
        ? new Date(startDate)
        : endDate
        ? new Date(endDate)
        : new Date();

      const year = referenceDate.getUTCFullYear();
      const month = referenceDate.getUTCMonth() + 1; // Convert to 1-based
      const calculationMonth = `${year}-${String(month).padStart(2, '0')}`;

      // Get detailed deduction breakdown for this month
      const detailedBreakdown = await this.getDetailedDeductionBreakdown(employeeId, calculationMonth);
      
      // If we have specific start/end dates, we need to prorate the deductions
      if (startDate || endDate) {
        const startDay = startDate ? new Date(startDate).getDate() : 1;
        const endDay = endDate ? new Date(endDate).getDate() : new Date(year, month, 0).getDate();
        const daysInPeriod = endDay - startDay + 1;
        const daysInMonth = new Date(year, month, 0).getDate();
        
        // Prorate the attendance-based deductions (absent, late, half-day)
        const attendanceDeductions = detailedBreakdown.absentDeduction + detailedBreakdown.lateDeduction + detailedBreakdown.halfDayDeduction;
        const proratedAttendanceDeductions = Math.round((attendanceDeductions * daysInPeriod) / daysInMonth);
        
        // Chargeback and refund deductions are not prorated (they are fixed amounts)
        const chargebackDeduction = detailedBreakdown.chargebackDeduction || 0;
        const refundDeduction = detailedBreakdown.refundDeduction || 0;
        
        // Calculate total prorated deduction
        const proratedTotalDeduction = proratedAttendanceDeductions + chargebackDeduction + refundDeduction;
        
        // Filter details to only include days within the period
        const filteredAbsentDetails = detailedBreakdown.absentDetails?.filter(detail => 
          detail.day >= startDay && detail.day <= endDay
        ) || [];
        
        const filteredLateDetails = detailedBreakdown.lateDetails?.filter(detail => 
          detail.day >= startDay && detail.day <= endDay
        ) || [];
        
        const filteredHalfDayDetails = detailedBreakdown.halfDayDetails?.filter(detail => 
          detail.day >= startDay && detail.day <= endDay
        ) || [];

        return {
          ...detailedBreakdown,
          absentDeduction: Math.round((detailedBreakdown.absentDeduction * daysInPeriod) / daysInMonth),
          lateDeduction: Math.round((detailedBreakdown.lateDeduction * daysInPeriod) / daysInMonth),
          halfDayDeduction: Math.round((detailedBreakdown.halfDayDeduction * daysInPeriod) / daysInMonth),
          chargebackDeduction: chargebackDeduction,
          refundDeduction: refundDeduction,
          totalDeduction: proratedTotalDeduction,
          absentDetails: filteredAbsentDetails,
          lateDetails: filteredLateDetails,
          halfDayDetails: filteredHalfDayDetails,
          calculationPeriod: {
            startDay,
            endDay,
            daysInPeriod,
            daysInMonth
          }
        };
      }

      return detailedBreakdown;
    } catch (error) {
      this.logger.warn(`Failed to calculate detailed deductions for employee ${employeeId}: ${error.message}`);
      return {
        totalAbsent: 0,
        totalLateDays: 0,
        totalHalfDays: 0,
        monthlyLatesDays: 0,
        absentDeduction: 0,
        lateDeduction: 0,
        halfDayDeduction: 0,
        chargebackDeduction: 0,
        refundDeduction: 0,
        totalDeduction: 0,
        perDaySalary: 0,
        absentDetails: [],
        lateDetails: [],
        halfDayDetails: []
      };
    }
  }

  /**
   * Create salary log with deductions.
   */
  private async createSalaryLog(
    employeeId: number,
    salaryResult: any,
    deductions: number,
  ) {
    const year = salaryResult.year;
    const month = salaryResult.month + 1; // Convert to 1-based
    const calculationMonth = `${year}-${String(month).padStart(2, '0')}`;

    // Check if a record already exists for this employee and month
    const existingRecord = await this.prisma.netSalaryLog.findFirst({
      where: {
        employeeId: employeeId,
        month: calculationMonth,
      },
    });

    let logEntry;
    if (existingRecord) {
      // Update existing record
      logEntry = await this.prisma.netSalaryLog.update({
        where: { id: existingRecord.id },
        data: {
          netSalary: salaryResult.netSalary,
          deductions: deductions,
          updatedAt: this.getCurrentDateInPKT(),
        },
      });
      this.logger.log(`📝 Salary log updated for employee ${employeeId} - Net Salary: ${salaryResult.netSalary}, Deductions: ${deductions}`);
    } else {
      // Create new record
      logEntry = await this.prisma.netSalaryLog.create({
        data: {
          employeeId,
          month: calculationMonth,
          netSalary: salaryResult.netSalary,
          deductions: deductions,
          status: 'unpaid',
          createdAt: this.getCurrentDateInPKT(),
          updatedAt: this.getCurrentDateInPKT(),
        },
      });
      this.logger.log(`📝 Salary log created for employee ${employeeId} - Net Salary: ${salaryResult.netSalary}, Deductions: ${deductions}`);
    }

    return logEntry;
  }


  /**
   * Executes the daily job; if today is the last day of its month, calculate
   * salaries for all active employees only (excludes terminated employees).
   */
  public async calculateAllEmployees() {
    const currentDate = this.getCurrentDateInPKT();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    // Fetch all active employees with their start dates
    const activeEmployees = await this.prisma.employee.findMany({
      where: { status: EmployeeStatus.active },
      select: { 
        id: true,
        startDate: true,
      },
    });

    this.logger.log(`🔄 Auto calculation: Processing salary for ${activeEmployees.length} active employees only`);

    for (const emp of activeEmployees) {
      try {
        // Check if this is a new employee (started this month)
        if (emp.startDate) {
          const employeeStartDate = new Date(emp.startDate);
          const employeeStartMonth = employeeStartDate.getMonth();
          const employeeStartYear = employeeStartDate.getFullYear();
          
          // If employee started this month, calculate from start date
          if (employeeStartMonth === currentMonth && employeeStartYear === currentYear) {
            this.logger.log(`New employee ${emp.id} started this month - calculating from start date ${emp.startDate}`);
            await this.calculateSalary(emp.id, emp.startDate.toISOString().split('T')[0]);
          } else {
            // Regular employee - calculate full month
            this.logger.log(`Regular employee ${emp.id} - calculating full month salary`);
            await this.calculateSalary(emp.id);
          }
        } else {
          // Employee with no start date - calculate full month
          this.logger.log(`Employee ${emp.id} has no start date - calculating full month salary`);
          await this.calculateSalary(emp.id);
        }
      } catch (err) {
        this.logger.error(`Failed to calculate salary for employee ${emp.id}: ${err.message}`);
      }
    }
  }

  /**
   * Calculate salary deductions for all active employees for a specific month.
   * This can be called independently or integrated with the auto-calculate system.
   */
  public async calculateAllEmployeesDeductions(month?: string) {
    const currentDate = this.getCurrentDateInPKT();
    const calculationMonth = month || `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;

    // Fetch all active employees
    const activeEmployees = await this.prisma.employee.findMany({
      where: { status: EmployeeStatus.active },
      select: { 
        id: true,
        firstName: true,
        lastName: true,
      },
    });

    this.logger.log(`🔄 Deduction calculation: Processing deductions for ${activeEmployees.length} active employees for month ${calculationMonth}`);

    const deductionResults: Array<{
      employeeId: number;
      baseSalary: number;
      perDaySalary: number;
      totalAbsent: number;
      totalLateDays: number;
      totalHalfDays: number;
      monthlyLatesDays: number;
      absentDeduction: number;
      lateDeduction: number;
      halfDayDeduction: number;
      chargebackDeduction: number;
      refundDeduction: number;
      totalDeduction: number;
      netSalary: number;
    }> = [];

    for (const emp of activeEmployees) {
      try {
        // Check if employee has attendance data for this month
        const attendanceSummary = await this.prisma.monthlyAttendanceSummary.findFirst({
          where: {
            empId: emp.id,
            month: calculationMonth,
          },
        });

        if (!attendanceSummary) {
          this.logger.warn(`No attendance data found for employee ${emp.id} for month ${calculationMonth}`);
          continue;
        }

        // Calculate deductions for this employee
        const deductionResult = await this.calculateEmployeeDeductions(emp.id, calculationMonth);
        deductionResults.push(deductionResult);

        this.logger.log(`✅ Deductions calculated for employee ${emp.id}: ${deductionResult.totalDeduction} total deduction`);
      } catch (err) {
        this.logger.error(`Failed to calculate deductions for employee ${emp.id}: ${err.message}`);
      }
    }

    // Log summary
    const totalDeductions = deductionResults.reduce((sum, result) => sum + result.totalDeduction, 0);
    const totalEmployees = deductionResults.length;
    
    this.logger.log(`📊 Deduction calculation summary: ${totalEmployees} employees processed, ${totalDeductions} total deductions`);

    return {
      month: calculationMonth,
      totalEmployees,
      totalDeductions,
      results: deductionResults,
    };
  }

  /**
   * Calculate deductions for a single employee.
   * This method contains the deduction logic.
   */
  public async calculateEmployeeDeductions(employeeId: number, month: string) {
    // Validate employeeId
    if (!employeeId || employeeId <= 0) {
      throw new BadRequestException('Invalid employeeId. Must be a positive number.');
    }

    // Validate month format
    const monthRegex = /^\d{4}-\d{2}$/;
    if (!monthRegex.test(month)) {
      throw new BadRequestException('Invalid month format. Must be in YYYY-MM format (e.g., 2025-01).');
    }

    const company = await this.prisma.company.findFirst();
    if (!company) {
      throw new NotFoundException('Company settings not found. Please configure company settings first.');
    }
    const monthlyLatesDays = company.monthlyLatesDays;

    // Check if employee exists
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      select: { id: true, firstName: true, lastName: true, status: true }
    });
    
    if (!employee) {
      throw new NotFoundException(`Employee with ID ${employeeId} not found.`);
    }

    if (employee.status !== 'active') {
      throw new BadRequestException(`Employee ${employee.firstName} ${employee.lastName} is not active. Current status: ${employee.status}`);
    }

    const attendanceSummary = await this.prisma.monthlyAttendanceSummary.findFirst({
      where: { empId: employeeId, month: month },
    });
    
    if (!attendanceSummary) {
      throw new NotFoundException(`No attendance data found for employee ${employee.firstName} ${employee.lastName} (ID: ${employeeId}) for month ${month}. Please ensure attendance data is available.`);
    }

    const account = await this.prisma.account.findFirst({
      where: { employeeId },
      select: { baseSalary: true },
    });
    
    if (!account?.baseSalary) {
      throw new NotFoundException(`No base salary found for employee ${employee.firstName} ${employee.lastName} (ID: ${employeeId}). Please set the base salary in the employee account.`);
    }

    // Get sales department deductions (chargeback and refund)
    const salesDepartment = await this.prisma.salesDepartment.findFirst({
      where: { employeeId },
      select: { chargebackDeductions: true, refundDeductions: true },
    });

    const halfDayCount = await this.getHalfDayCount(employeeId, month);
    const baseSalary = Number(account.baseSalary);
    const perDaySalary = baseSalary / 30;

    const absentDeduction = this.calculateAbsentDeduction(attendanceSummary.totalAbsent, perDaySalary);
    const lateDeduction = this.calculateLateDeduction(attendanceSummary.totalLateDays, monthlyLatesDays, perDaySalary);
    const halfDayDeduction = this.calculateHalfDayDeduction(halfDayCount, perDaySalary);
    
    // Add chargeback and refund deductions
    const chargebackDeduction = Number(salesDepartment?.chargebackDeductions || 0);
    const refundDeduction = Number(salesDepartment?.refundDeductions || 0);

    const totalDeduction = absentDeduction + lateDeduction + halfDayDeduction + chargebackDeduction + refundDeduction;
    const netSalary = baseSalary - totalDeduction; // Internal net salary for deduction calculation

    return {
      employeeId, baseSalary, perDaySalary, totalAbsent: attendanceSummary.totalAbsent,
      totalLateDays: attendanceSummary.totalLateDays, totalHalfDays: halfDayCount,
      monthlyLatesDays, absentDeduction, lateDeduction, halfDayDeduction,
      chargebackDeduction, refundDeduction, totalDeduction, netSalary,
    };
  }

  private async getHalfDayCount(employeeId: number, month: string): Promise<number> {
    // Parse month to get start and end dates
    const [year, monthNum] = month.split('-').map(Number);
    const startDate = new Date(year, monthNum - 1, 1);
    const endDate = new Date(year, monthNum, 0); // Last day of the month

    // Count half-day attendance records
    const halfDayCount = await this.prisma.attendanceLog.count({
      where: {
        employeeId,
        date: {
          gte: startDate,
          lte: endDate,
        },
        status: 'half_day',
      },
    });

    return halfDayCount;
  }

  private calculateAbsentDeduction(absentDays: number, perDaySalary: number): number {
    // For absent days: twice the per day salary for every day absent
    return absentDays * perDaySalary * 2;
  }

  private calculateLateDeduction(lateDays: number, monthlyLatesDays: number, perDaySalary: number): number {
    // For late days: subtract monthly_lates_days from total late days
    // If there's a positive number left, apply progressive deduction
    const excessLateDays = Math.max(0, lateDays - monthlyLatesDays);
    
    if (excessLateDays === 0) {
      return 0;
    }

    // Progressive deduction: 1st day = 0.5x, 2nd day = 1x, 3rd day = 1.5x, etc.
    let totalDeduction = 0;
    for (let i = 0; i < excessLateDays; i++) {
      const multiplier = 0.5 + (i * 0.5); // 0.5, 1.0, 1.5, 2.0, etc.
      totalDeduction += perDaySalary * multiplier;
    }

    return totalDeduction;
  }

  private calculateHalfDayDeduction(halfDays: number, perDaySalary: number): number {
    // For half days: progressive deduction starting from 0.5x
    // 1st day = 0.5x, 2nd day = 1x, 3rd day = 1.5x, etc.
    let totalDeduction = 0;
    for (let i = 0; i < halfDays; i++) {
      const multiplier = 0.5 + (i * 0.5); // 0.5, 1.0, 1.5, 2.0, etc.
      totalDeduction += perDaySalary * multiplier;
    }

    return totalDeduction;
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
      throw new NotFoundException('Project does not exist');
    }

    if (project.status !== ProjectStatus.completed) {
      throw new BadGatewayException('Project must be completed first');
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
      throw new NotFoundException(`Employee not found with ID: ${crackedLead.closedBy}`);
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
      updatedAt: this.getCurrentDateInPKT(),
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
        updatedAt: this.getCurrentDateInPKT(),
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
      updatedAt: this.getCurrentDateInPKT(),
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
      orderBy: { id: 'asc' },
    });

    // Get salary logs for this month
    const salaryLogs = await this.prisma.netSalaryLog.findMany({
      where: {
        month: calculationMonth,
      },
      select: {
        employeeId: true,
        deductions: true,
        status: true,
        paidOn: true,
        createdAt: true,
      },
    });

    // Create a map of salary logs by employee ID for quick lookup
    const salaryLogMap = new Map();
    salaryLogs.forEach(log => {
      salaryLogMap.set(log.employeeId, log);
    });

    const results = employees.map(employee => {
      const salaryLog = salaryLogMap.get(employee.id);
      const baseSalary = Number(employee.accounts[0]?.baseSalary || 0);
      const commission = Number(employee.salesDepartment[0]?.commissionAmount || 0);
      const employeeBonus = Number(employee.bonus || 0);
      const salesBonus = Number(employee.salesDepartment[0]?.salesBonus || 0);
      const totalBonus = employeeBonus + salesBonus;
      const attendanceDeductions = salaryLog?.deductions || 0;
      
      // Get chargeback and refund deductions from sales department
      const chargebackDeduction = Number(employee.salesDepartment[0]?.chargebackDeductions || 0);
      const refundDeduction = Number(employee.salesDepartment[0]?.refundDeductions || 0);
      const totalDeductions = attendanceDeductions + chargebackDeduction + refundDeduction;
      
      // Calculate final salary: base_salary + employee_bonus + sales_bonus + commission - deductions
      const finalSalary = Math.max(0, baseSalary + totalBonus + commission - totalDeductions);
      
      return {
        employeeId: employee.id,
        firstName: employee.firstName,
        lastName: employee.lastName,
        departmentName: employee.department.name,
        fullBaseSalary: baseSalary,
        baseSalary: baseSalary, // Keep for backward compatibility
        commission: commission,
        employeeBonus: employeeBonus,
        salesBonus: salesBonus,
        totalBonus: totalBonus,
        attendanceDeductions: attendanceDeductions,
        chargebackDeduction: chargebackDeduction,
        refundDeduction: refundDeduction,
        deductions: totalDeductions,
        finalSalary: finalSalary,
        status: salaryLog?.status || 'unpaid',
        paidOn: salaryLog?.paidOn || null,
        createdAt: salaryLog?.createdAt || null,
      };
    });

    // Calculate summary
    const totalBaseSalary = results.reduce((sum, result) => sum + result.baseSalary, 0);
    const totalCommission = results.reduce((sum, result) => sum + result.commission, 0);
    const totalEmployeeBonus = results.reduce((sum, result) => sum + result.employeeBonus, 0);
    const totalSalesBonus = results.reduce((sum, result) => sum + result.salesBonus, 0);
    const totalBonus = results.reduce((sum, result) => sum + result.totalBonus, 0);
    const totalAttendanceDeductions = results.reduce((sum, result) => sum + result.attendanceDeductions, 0);
    const totalChargebackDeductions = results.reduce((sum, result) => sum + result.chargebackDeduction, 0);
    const totalRefundDeductions = results.reduce((sum, result) => sum + result.refundDeduction, 0);
    const totalDeductions = results.reduce((sum, result) => sum + result.deductions, 0);
    const totalFinalSalary = results.reduce((sum, result) => sum + result.finalSalary, 0);

    return {
      month: calculationMonth,
      totalEmployees: results.length,
      totalBaseSalary,
      totalCommission,
      totalEmployeeBonus,
      totalSalesBonus,
      totalBonus,
      totalAttendanceDeductions,
      totalChargebackDeductions,
      totalRefundDeductions,
      totalDeductions,
      totalFinalSalary,
      results,
    };
  }

  /**
   * Get detailed salary breakdown for a specific employee
   * 
   * This method provides comprehensive salary information including:
   * - Employee details and department
   * - Salary components (base, commission, bonus, deductions)
   * - Commission breakdown by projects
   * - Detailed deduction breakdown (absent, late, half-day)
   * - Final salary calculation
   * 
   * @param employeeId - Employee ID to get detailed breakdown for
   * @param month - Optional month in YYYY-MM format (defaults to current month)
   * @returns Comprehensive salary breakdown with all details
   */
  public async getDetailedSalaryBreakdown(employeeId: number, month?: string) {
    if (!employeeId || employeeId <= 0) {
      throw new BadRequestException('Invalid employeeId. Must be a positive number.');
    }

    if (month) {
      const monthRegex = /^\d{4}-\d{2}$/;
      if (!monthRegex.test(month)) {
        throw new BadRequestException('Invalid month format. Must be in YYYY-MM format (e.g., 2025-01).');
      }
    }

    const currentDate = this.getCurrentDateInPKT();
    const calculationMonth = month || `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;

    // Get employee with all related information
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

    if (employee.status !== 'active') {
      throw new BadRequestException(`Employee ${employee.firstName} ${employee.lastName} is not active. Current status: ${employee.status}`);
    }

    // Get salary log for this month
    const salaryLog = await this.prisma.netSalaryLog.findFirst({
      where: {
        employeeId,
        month: calculationMonth,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Get commission breakdown by projects
    const commissionBreakdown = await this.getCommissionBreakdown(employeeId, calculationMonth);

    // Get detailed deduction breakdown
    const deductionBreakdown = await this.getDetailedDeductionBreakdown(employeeId, calculationMonth);

    // Calculate salary components
    const baseSalary = Number(employee.accounts[0]?.baseSalary || 0);
    const commission = Number(employee.salesDepartment[0]?.commissionAmount || 0);
    const employeeBonus = Number(employee.bonus || 0);
    const salesBonus = Number(employee.salesDepartment[0]?.salesBonus || 0);
    const totalBonus = employeeBonus + salesBonus;
    const attendanceDeductions = salaryLog?.deductions || 0;
    
    // Get chargeback and refund deductions from sales department
    const chargebackDeduction = Number(employee.salesDepartment[0]?.chargebackDeductions || 0);
    const refundDeduction = Number(employee.salesDepartment[0]?.refundDeductions || 0);
    const totalDeductions = attendanceDeductions + chargebackDeduction + refundDeduction;
    
    // Calculate final salary: base_salary + employee_bonus + sales_bonus + commission - deductions
    const finalSalary = Math.max(0, baseSalary + totalBonus + commission - totalDeductions);

    return {
      employee: {
        id: employee.id,
        firstName: employee.firstName,
        lastName: employee.lastName,
        email: employee.email,
        departmentName: employee.department.name,
        status: employee.status,
        startDate: employee.startDate,
      },
      salary: {
        month: calculationMonth,
        fullBaseSalary: baseSalary,
        baseSalary: baseSalary, // Keep for backward compatibility
        commission: commission,
        employeeBonus: employeeBonus,
        salesBonus: salesBonus,
        totalBonus: totalBonus,
        attendanceDeductions: attendanceDeductions,
        chargebackDeduction: chargebackDeduction,
        refundDeduction: refundDeduction,
        deductions: totalDeductions,
        finalSalary: finalSalary,
        status: salaryLog?.status || 'unpaid',
        paidOn: salaryLog?.paidOn || null,
        createdAt: salaryLog?.createdAt || null,
      },
      commissionBreakdown: commissionBreakdown,
      deductionBreakdown: deductionBreakdown,
    };
  }

  /**
   * Get commission breakdown by projects for a specific employee and month
   */
  private async getCommissionBreakdown(employeeId: number, month: string): Promise<any[]> {
    // Parse month to get start and end dates
    const [year, monthNum] = month.split('-').map(Number);
    const startDate = new Date(year, monthNum - 1, 1);
    const endDate = new Date(year, monthNum, 0); // Last day of the month

    // Get projects where this employee was the sales rep and were completed in this month
    const projects = await this.prisma.project.findMany({
      where: {
        salesRepId: employeeId,
        status: 'completed',
        updatedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        client: {
          select: { companyName: true, clientName: true },
        },
        crackedLead: {
          select: { amount: true, commissionRate: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    // Calculate commission for each project
    const commissionBreakdown = projects.map(project => {
      const projectValue = Number(project.crackedLead?.amount || 0);
      const commissionRate = Number(project.crackedLead?.commissionRate || 0);
      const commissionAmount = (projectValue * commissionRate) / 100;

      return {
        projectId: project.id,
        projectName: `Project ${project.id}`,
        clientName: project.client?.companyName || project.client?.clientName || 'N/A',
        projectValue: projectValue,
        commissionRate: commissionRate,
        commissionAmount: commissionAmount,
        completedAt: project.updatedAt,
        status: project.status,
      };
    });

    return commissionBreakdown;
  }

  /**
   * Get detailed deduction breakdown for a specific employee and month
   */
  private async getDetailedDeductionBreakdown(employeeId: number, month: string): Promise<any> {
    // Get company settings for monthly lates allowance
    const company = await this.prisma.company.findFirst();
    const monthlyLatesDays = company?.monthlyLatesDays || 0;

    // Get attendance summary
    const attendanceSummary = await this.prisma.monthlyAttendanceSummary.findFirst({
      where: { empId: employeeId, month: month },
    });

    if (!attendanceSummary) {
      return {
        totalAbsent: 0,
        totalLateDays: 0,
        totalHalfDays: 0,
        monthlyLatesDays: monthlyLatesDays,
        absentDeduction: 0,
        lateDeduction: 0,
        halfDayDeduction: 0,
        chargebackDeduction: 0,
        refundDeduction: 0,
        totalDeduction: 0,
        perDaySalary: 0,
        absentDetails: [],
        lateDetails: [],
        halfDayDetails: [],
      };
    }

    // Get employee's base salary for per-day calculation
    const account = await this.prisma.account.findFirst({
      where: { employeeId },
      select: { baseSalary: true },
    });

    const baseSalary = Number(account?.baseSalary || 0);
    const perDaySalary = baseSalary / 30;

    // Get sales department deductions (chargeback and refund)
    const salesDepartment = await this.prisma.salesDepartment.findFirst({
      where: { employeeId },
      select: { chargebackDeductions: true, refundDeductions: true },
    });

    // Get half-day details
    const halfDayDetails = await this.getHalfDayDetails(employeeId, month);

    // Calculate deductions
    const absentDeduction = this.calculateAbsentDeduction(attendanceSummary.totalAbsent, perDaySalary);
    const lateDeduction = this.calculateLateDeduction(attendanceSummary.totalLateDays, monthlyLatesDays, perDaySalary);
    const halfDayDeduction = this.calculateHalfDayDeduction(halfDayDetails.length, perDaySalary);
    
    // Add chargeback and refund deductions
    const chargebackDeduction = Number(salesDepartment?.chargebackDeductions || 0);
    const refundDeduction = Number(salesDepartment?.refundDeductions || 0);

    const totalDeduction = absentDeduction + lateDeduction + halfDayDeduction + chargebackDeduction + refundDeduction;

    // Generate absent details
    const absentDetails = Array.from({ length: attendanceSummary.totalAbsent }, (_, index) => ({
      day: index + 1,
      deduction: perDaySalary * 2,
      reason: 'Absent',
    }));

    // Generate late details (only for excess days)
    const excessLateDays = Math.max(0, attendanceSummary.totalLateDays - monthlyLatesDays);
    const lateDetails = Array.from({ length: excessLateDays }, (_, index) => ({
      day: index + 1,
      deduction: perDaySalary * (0.5 + (index * 0.5)),
      reason: 'Late (excess)',
    }));

    // Generate half-day details
    const halfDayDetailsWithDeductions = halfDayDetails.map((detail, index) => ({
      ...detail,
      deduction: perDaySalary * (0.5 + (index * 0.5)),
    }));

    return {
      totalAbsent: attendanceSummary.totalAbsent,
      totalLateDays: attendanceSummary.totalLateDays,
      totalHalfDays: halfDayDetails.length,
      monthlyLatesDays: monthlyLatesDays,
      absentDeduction: absentDeduction,
      lateDeduction: lateDeduction,
      halfDayDeduction: halfDayDeduction,
      chargebackDeduction: chargebackDeduction,
      refundDeduction: refundDeduction,
      totalDeduction: totalDeduction,
      perDaySalary: perDaySalary,
      absentDetails: absentDetails,
      lateDetails: lateDetails,
      halfDayDetails: halfDayDetailsWithDeductions,
    };
  }

  /**
   * Get detailed half-day information for a specific employee and month
   */
  private async getHalfDayDetails(employeeId: number, month: string): Promise<any[]> {
    // Parse month to get start and end dates
    const [year, monthNum] = month.split('-').map(Number);
    const startDate = new Date(year, monthNum - 1, 1);
    const endDate = new Date(year, monthNum, 0); // Last day of the month

    // Get half-day attendance records
    const halfDayLogs = await this.prisma.attendanceLog.findMany({
      where: {
        employeeId,
        date: {
          gte: startDate,
          lte: endDate,
        },
        status: 'half_day',
      },
      orderBy: { date: 'asc' },
    });

    return halfDayLogs.map(log => ({
      date: log.date,
      day: log.date?.getDate() || 0,
      reason: 'Half Day',
    }));
  }
}