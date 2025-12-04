import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { TimeStorageUtil } from '../../../common/utils/time-storage.util';
import { FinanceMarkSalaryPaidDto } from './dto/mark-paid.dto';

type GetAllSalariesParams = {
  month?: string;
  page?: string;
  limit?: string;
  departments?: string;
  status?: string;
  minSalary?: string;
  maxSalary?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: string;
};

@Injectable()
export class FinanceSalaryService {
  private readonly logger = new Logger(FinanceSalaryService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get PKT date components (year, month, day) for accurate date calculations.
   * This ensures the calculation month matches the PKT timezone, not UTC.
   */
  private getPKTDateComponents(): {
    year: number;
    month: number;
    day: number;
    date: Date;
  } {
    const now = new Date();
    // Convert to PKT (UTC+5)
    const pktTime = new Date(now.getTime() + 5 * 60 * 60 * 1000);

    // Extract PKT date components from the shifted time
    const year = pktTime.getUTCFullYear();
    const month = pktTime.getUTCMonth(); // 0-based
    const day = pktTime.getUTCDate();

    return { year, month, day, date: pktTime };
  }

  /**
   * Get calculation month string (YYYY-MM format).
   * Uses PKT timezone for accurate month calculation.
   * @param month - Optional month string (YYYY-MM). If not provided, defaults to current PKT month.
   * @returns Month string in YYYY-MM format
   */
  private getCalculationMonth(month?: string): string {
    const pktDate = this.getPKTDateComponents();
    return (
      month || `${pktDate.year}-${String(pktDate.month + 1).padStart(2, '0')}`
    );
  }

  /**
   * Get previous month string (YYYY-MM format) from a given month.
   * @param month - Month string (YYYY-MM)
   * @returns Previous month string in YYYY-MM format
   */
  private getPreviousMonth(month: string): string {
    const [year, monthNum] = month.split('-').map(Number);
    let prevYear = year;
    let prevMonth = monthNum - 1;

    if (prevMonth === 0) {
      prevMonth = 12;
      prevYear = year - 1;
    }

    return `${prevYear}-${String(prevMonth).padStart(2, '0')}`;
  }

  /**
   * Validate employee ID.
   * @param employeeId - Employee ID to validate
   * @throws BadRequestException if employee ID is invalid
   */
  private validateEmployeeId(employeeId: number): void {
    if (!employeeId || employeeId <= 0 || isNaN(employeeId)) {
      throw new BadRequestException(
        'Invalid employeeId. Must be a positive number.',
      );
    }
  }

  /**
   * Validate month format (YYYY-MM).
   * @param month - Month string to validate
   * @throws BadRequestException if month format is invalid
   */
  private validateMonthFormat(month?: string): void {
    if (month) {
      const monthRegex = /^\d{4}-\d{2}$/;
      if (!monthRegex.test(month)) {
        throw new BadRequestException(
          'Invalid month format. Must be in YYYY-MM format (e.g., 2025-01).',
        );
      }
    }
  }

  /**
   * Get latest salary log for an employee and month.
   * @param employeeId - Employee ID
   * @param month - Month string (YYYY-MM)
   * @returns Latest salary log or null if not found
   */
  private async getLatestSalaryLog(employeeId: number, month: string) {
    return await this.prisma.netSalaryLog.findFirst({
      where: {
        employeeId,
        month,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Parse month string to UTC date range (start and end of month).
   * @param month - Month string in YYYY-MM format
   * @returns Object with startDate and endDate (UTC)
   */
  private parseMonthToDateRange(month: string): {
    startDate: Date;
    endDate: Date;
  } {
    const [year, monthNum] = month.split('-').map(Number);
    const startDate = new Date(Date.UTC(year, monthNum - 1, 1, 0, 0, 0, 0));
    const endDate = new Date(Date.UTC(year, monthNum, 0, 23, 59, 59, 999)); // Last day of the month
    return { startDate, endDate };
  }

  /**
   * Convert any date to PKT timezone components.
   * @param date - Date to convert (Date object or string)
   * @returns PKT date components (year, month, day, date)
   */
  private convertDateToPKT(date: Date | string): {
    year: number;
    month: number;
    day: number;
    date: Date;
  } {
    const inputDate = new Date(date);
    // Convert to PKT (UTC+5)
    const pktTime = new Date(inputDate.getTime() + 5 * 60 * 60 * 1000);
    return {
      year: pktTime.getUTCFullYear(),
      month: pktTime.getUTCMonth(), // 0-based (0 = Jan)
      day: pktTime.getUTCDate(),
      date: pktTime,
    };
  }

  /**
   * Convert employee start date to PKT timezone components.
   * @param startDate - Employee start date
   * @returns PKT date components (year, month, day)
   */
  private convertEmployeeStartDateToPKT(startDate: Date | string): {
    year: number;
    month: number;
    day: number;
  } {
    const employeeStartDate = new Date(startDate);
    const employeeStartPKT = new Date(
      employeeStartDate.getTime() + 5 * 60 * 60 * 1000,
    );
    return {
      year: employeeStartPKT.getUTCFullYear(),
      month: employeeStartPKT.getUTCMonth(),
      day: employeeStartPKT.getUTCDate(),
    };
  }

  /**
   * Calculate final salary (net salary - deductions).
   * Ensures final salary is not negative.
   * @param netSalary - Net salary amount
   * @param deductions - Total deductions
   * @returns Final salary (non-negative)
   */
  private calculateFinalSalary(netSalary: number, deductions: number): number {
    return Math.max(0, netSalary - deductions);
  }

  /**
   * Format employee name from first and last name.
   * @param firstName - Employee first name
   * @param lastName - Employee last name
   * @returns Formatted full name
   */
  private formatEmployeeName(firstName: string, lastName: string): string {
    return `${firstName} ${lastName}`;
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
    this.logger.log(
      `⏳ Starting read-only salary preview for employee ${employeeId} (end=${endDate ?? 'current date'})`,
    );

    // Validate employeeId
    this.validateEmployeeId(employeeId);

    this.logger.log(`Employee ID validated: ${employeeId}`);

    // Calculate salary first (existing logic)
    const salaryResult = await this.calculateSalaryInternal(
      employeeId,
      undefined,
      endDate,
    );

    // Calculate deductions for the same period
    const deductionResult = await this.calculateDeductionsForPeriod(
      employeeId,
      undefined,
      endDate,
    );

    // Calculate detailed deduction breakdown for the current period
    const detailedDeductionBreakdown =
      await this.calculateDetailedDeductionsForPeriod(
        employeeId,
        undefined,
        endDate,
      );

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
            select: { name: true },
          },
        },
      }),
      this.prisma.salesDepartment.findFirst({
        where: { employeeId },
        select: {
          salesBonus: true,
          commissionAmount: true,
        },
      }),
    ]);

    if (!employee) {
      throw new NotFoundException(`Employee with ID ${employeeId} not found`);
    }

    // Calculate final salary (base + bonus + commission - deductions)
    const finalSalary = salaryResult.netSalary.minus(deductionResult);

    this.logger.log(
      `Read-only salary preview completed for employee ${employeeId}`,
    );

    return {
      employee: {
        id: employee.id,
        firstName: employee.firstName,
        lastName: employee.lastName,
        email: employee.email,
        status: employee.status,
        department: employee.department?.name,
        startDate: employee.startDate,
        endDate: employee.endDate,
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
        finalSalary: parseFloat(finalSalary.toFixed(2)),
      },
      calculationPeriod: {
        startDay: salaryResult.startDay,
        endDay: salaryResult.endDay,
        daysWorked: salaryResult.daysWorked,
        year: salaryResult.year,
        month: salaryResult.month,
      },
      deductionBreakdown: detailedDeductionBreakdown,
    };
  }

  /**
   * Wrapper for API to fetch paginated salaries list for table view.
   */
  public async getAllSalaries(params: GetAllSalariesParams) {
    const parseNumber = (value?: string, fallback?: number) => {
      if (value === undefined || value === null) {
        return fallback;
      }
      const parsed = Number(value);
      return Number.isNaN(parsed) ? fallback : parsed;
    };

    const month = params.month;
    const pageNum = parseNumber(params.page, 1);
    const limitNum = parseNumber(params.limit, 20);
    const minSalaryNum = params.minSalary
      ? parseFloat(params.minSalary)
      : undefined;
    const maxSalaryNum = params.maxSalary
      ? parseFloat(params.maxSalary)
      : undefined;
    const departmentRaw = params.departments;
    let departmentIds: number[] | undefined;
    let departmentNames: string[] | undefined;
    if (departmentRaw) {
      const parts = departmentRaw.split(',').map((s) => s.trim()).filter(Boolean);
      const allNumeric = parts.every((p) => /^\d+$/.test(p));
      if (allNumeric) {
        departmentIds = parts.map((p) => parseInt(p, 10));
      } else {
        // treat as department names
        departmentNames = parts;
      }
    }

    const search = params.search;
    const sortBy = params.sortBy;
    const sortOrder = params.sortOrder;

    return await this.getAllSalariesDisplay(
      month,
      pageNum,
      limitNum,
      departmentIds,
      departmentNames,
      params.status,
      minSalaryNum,
      maxSalaryNum,
      search,
      sortBy,
      sortOrder,
    );
  }

  /**
   * Get comprehensive salary display for all employees - OPTIMIZED VERSION.
   * Uses stored netSalary and deductions from netSalaryLogs instead of recalculating.
   * Reduces from O(n) queries to O(1) batch queries.
   *
   * Formula: Final Salary = netSalary (base + bonus + commission) - deductions
   *
   * @param month - Optional month in YYYY-MM format (defaults to current month)
   * @param page - Page number (defaults to 1)
   * @param limit - Number of records per page (defaults to 20)
   * @param departmentIds - Optional array of department IDs to filter by
   * @param status - Optional employee status filter (active, inactive, terminated)
   * @param minSalary - Optional minimum final salary filter
   * @param maxSalary - Optional maximum final salary filter
   *
   * @returns Paginated salary display with summary and employee list
   */
  public async getAllSalariesDisplay(
    month?: string,
    page: number = 1,
    limit: number = 20,
    departmentIds?: number[],
    departmentNames?: string[],
    status?: string,
    minSalary?: number,
    maxSalary?: number,
    search?: string,
    sortBy?: string,
    sortOrder?: string,
  ) {
    // Validate and get calculation month
    this.validateMonthFormat(month);
    const requestedMonth = this.getCalculationMonth(month);

    this.logger.log(
      `Fetching salary display for month: ${requestedMonth}${departmentIds ? `, departments: ${departmentIds.join(',')}` : ''}${status ? `, status: ${status}` : ''}`,
    );

    // Build employee where clause with filters
    const employeeWhere: any = {};

    // Status filter - default to 'active' if not specified
    if (status) {
      employeeWhere.status = status;
    } else {
      employeeWhere.status = 'active';
    }

    // Department filter (support department IDs OR department names)
    if (departmentIds && departmentIds.length > 0) {
      employeeWhere.departmentId = { in: departmentIds };
    } else if (departmentNames && departmentNames.length > 0) {
      employeeWhere.department = { name: { in: departmentNames } };
    }

    // Search filter (by firstName, lastName, email) - case insensitive contains
    if (search && search.trim().length > 0) {
      const q = search.trim();
      employeeWhere.OR = [
        { firstName: { contains: q, mode: 'insensitive' } },
        { lastName: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
      ];
    }

    // STEP 1: Batch fetch employees with related data (1 query) - with filters
    const employees = await this.prisma.employee.findMany({
      where: employeeWhere,
      select: {
        id: true,
        firstName: true,
        lastName: true,
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

    const employeeIds = employees.map((emp) => emp.id);
    if (employeeIds.length === 0) {
      return {
        month: requestedMonth,
        summary: {
          totalEmployees: 0,
          totalBaseSalary: 0,
          totalCommission: 0,
          totalBonus: 0,
          totalNetSalary: 0,
          totalDeductions: 0,
          totalFinalSalary: 0,
        },
        employees: [],
      };
    }

    // Build salary log where clause
    const salaryLogWhere: any = {
      employeeId: { in: employeeIds },
      month: requestedMonth,
    };

    // STEP 2: Batch fetch all salary logs for the requested month (1 query instead of N queries)
    let salaryLogs = await this.prisma.netSalaryLog.findMany({
      where: salaryLogWhere,
      orderBy: { createdAt: 'desc' },
    });

    // If no logs found for the requested month, try the previous month
    let calculationMonth = requestedMonth;
    if (salaryLogs.length === 0) {
      const previousMonth = this.getPreviousMonth(requestedMonth);
      this.logger.log(
        `No logs found for ${requestedMonth}, trying previous month: ${previousMonth}`,
      );

      // Update month filter for previous month search, but keep date filters if present
      const previousMonthWhere = {
        ...salaryLogWhere,
        month: previousMonth,
      };

      salaryLogs = await this.prisma.netSalaryLog.findMany({
        where: previousMonthWhere,
        orderBy: { createdAt: 'desc' },
      });

      if (salaryLogs.length > 0) {
        calculationMonth = previousMonth;
        this.logger.log(
          `Found logs for previous month ${previousMonth}, using that instead`,
        );
      } else {
        this.logger.log(
          `No logs found for previous month ${previousMonth} either`,
        );
      }
    }

    // Create lookup map for O(1) access
    const salaryLogMap = new Map<number, (typeof salaryLogs)[0]>();
    salaryLogs.forEach((log) => {
      // Use the most recent log if multiple exist (already sorted by createdAt desc)
      if (!salaryLogMap.has(log.employeeId)) {
        salaryLogMap.set(log.employeeId, log);
      }
    });

    // STEP 3: Process all employees using stored values (0 additional queries)
    const salaryResults: any[] = [];
    let totalBaseSalary = 0;
    let totalCommission = 0;
    let totalBonus = 0;
    let totalNetSalary = 0;
    let totalDeductions = 0;
    let totalFinalSalary = 0;

    for (const employee of employees) {
      try {
        const salaryLog = salaryLogMap.get(employee.id);

        if (!salaryLog) {
          // Skip employees without salary records for this month
          continue;
        }

        // Use stored values from netSalaryLog instead of recalculating
        // netSalary already contains: baseSalary + bonus + commission
        // deductions already contains: attendance + chargeback + refund
        const storedNetSalary = Number(salaryLog.netSalary || 0);
        const storedDeductions = Number(salaryLog.deductions || 0);

        // Extract individual components for display (from employee relations, not recalculated)
        const baseSalary = Number(employee.accounts?.[0]?.baseSalary || 0);
        const commission = Number(
          employee.salesDepartment?.[0]?.commissionAmount || 0,
        );
        const bonus = Number(employee.salesDepartment?.[0]?.salesBonus || 0);

        // Note: chargeback and refund deductions are already included in storedDeductions
        // We extract them separately only for display breakdown
        const chargebackDeduction = Number(
          employee.salesDepartment?.[0]?.chargebackDeductions || 0,
        );
        const refundDeduction = Number(
          employee.salesDepartment?.[0]?.refundDeductions || 0,
        );

        // Final salary = netSalary (base + bonus + commission) - deductions
        const finalSalary = this.calculateFinalSalary(
          storedNetSalary,
          storedDeductions,
        );

        salaryResults.push({
          employeeId: employee.id,
          employeeName: this.formatEmployeeName(
            employee.firstName,
            employee.lastName,
          ),
          department: employee.department?.name || 'N/A',
          month: calculationMonth, // Use the actual month we found logs for
          baseSalary: parseFloat(baseSalary.toFixed(2)),
          commission: parseFloat(commission.toFixed(2)),
          bonus: parseFloat(bonus.toFixed(2)),
          netSalary: parseFloat(storedNetSalary.toFixed(2)),
          attendanceDeductions: parseFloat(
            (storedDeductions - chargebackDeduction - refundDeduction).toFixed(
              2,
            ),
          ),
          chargebackDeduction: parseFloat(chargebackDeduction.toFixed(2)),
          refundDeduction: parseFloat(refundDeduction.toFixed(2)),
          deductions: parseFloat(storedDeductions.toFixed(2)),
          finalSalary: parseFloat(finalSalary.toFixed(2)),
          status: salaryLog.status,
          paidOn: salaryLog.paidOn,
          createdAt: salaryLog.createdAt,
        });

        // Accumulate totals (before salary filter - we'll recalculate after filtering)
        totalBaseSalary += baseSalary;
        totalCommission += commission;
        totalBonus += bonus;
        totalNetSalary += storedNetSalary;
        totalDeductions += storedDeductions;
        totalFinalSalary += finalSalary;
      } catch (error) {
        this.logger.error(
          `Error processing salary for employee ${employee.id}: ${error.message}`,
        );
        // Continue with other employees even if one fails
      }
    }

    // Apply salary range filters (minSalary, maxSalary) if provided
    let filteredResults = salaryResults;
    if (minSalary !== undefined || maxSalary !== undefined) {
      filteredResults = salaryResults.filter((result) => {
        const meetsMin =
          minSalary === undefined || result.finalSalary >= minSalary;
        const meetsMax =
          maxSalary === undefined || result.finalSalary <= maxSalary;
        return meetsMin && meetsMax;
      });

      // Recalculate totals based on filtered results
      totalBaseSalary = 0;
      totalCommission = 0;
      totalBonus = 0;
      totalNetSalary = 0;
      totalDeductions = 0;
      totalFinalSalary = 0;

      filteredResults.forEach((result) => {
        totalBaseSalary += result.baseSalary;
        totalCommission += result.commission;
        totalBonus += result.bonus;
        totalNetSalary += result.netSalary;
        totalDeductions += result.deductions;
        totalFinalSalary += result.finalSalary;
      });

      this.logger.log(
        `Applied salary range filter: ${salaryResults.length} -> ${filteredResults.length} results (min=${minSalary || 'none'}, max=${maxSalary || 'none'})`,
      );
    }

    // Apply sorting if requested (server-side on the filteredResults array)
    if (sortBy && typeof sortBy === 'string') {
      const order = sortOrder && sortOrder.toLowerCase() === 'desc' ? 'desc' : 'asc';
      const key = sortBy;
      filteredResults.sort((a, b) => {
        const va = a[key];
        const vb = b[key];

        // Handle undefined
        if (va === undefined && vb === undefined) return 0;
        if (va === undefined) return order === 'asc' ? 1 : -1;
        if (vb === undefined) return order === 'asc' ? -1 : 1;

        // Numeric comparison
        if (typeof va === 'number' && typeof vb === 'number') {
          return order === 'asc' ? va - vb : vb - va;
        }

        // Date comparison
        const dateA = new Date(va);
        const dateB = new Date(vb);
        if (!isNaN(dateA.getTime()) && !isNaN(dateB.getTime())) {
          return order === 'asc' ? dateA.getTime() - dateB.getTime() : dateB.getTime() - dateA.getTime();
        }

        // String comparison fallback
        const sa = String(va).toLowerCase();
        const sb = String(vb).toLowerCase();
        if (sa < sb) return order === 'asc' ? -1 : 1;
        if (sa > sb) return order === 'asc' ? 1 : -1;
        return 0;
      });
    }

    // Validate pagination parameters
    const validatedPage = Math.max(1, Math.floor(page) || 1);
    const validatedLimit = Math.max(1, Math.min(100, Math.floor(limit) || 20)); // Max 100 per page
    const skip = (validatedPage - 1) * validatedLimit;

    // Calculate total before pagination (for pagination metadata)
    const total = filteredResults.length;
    const totalPages = Math.ceil(total / validatedLimit);

    // Apply pagination to results
    const paginatedResults = filteredResults.slice(skip, skip + validatedLimit);

    // Calculate summary totals (these are for ALL filtered employees, not just the current page)
    const summary = {
      totalEmployees: total, // Total employees with salary records after filters
      totalBaseSalary: parseFloat(totalBaseSalary.toFixed(2)),
      totalCommission: parseFloat(totalCommission.toFixed(2)),
      totalBonus: parseFloat(totalBonus.toFixed(2)),
      totalNetSalary: parseFloat(totalNetSalary.toFixed(2)),
      totalDeductions: parseFloat(totalDeductions.toFixed(2)),
      totalFinalSalary: parseFloat(totalFinalSalary.toFixed(2)),
    };

    this.logger.log(
      `Salary display fetched: ${total} employees processed, showing page ${validatedPage} (${paginatedResults.length} records)`,
    );

    return {
      month: calculationMonth, // Return the actual month we found logs for
      summary,
      employees: paginatedResults,
      pagination: {
        page: validatedPage,
        limit: validatedLimit,
        total: total,
        totalPages: totalPages,
        retrieved: paginatedResults.length,
      },
    };
  }

  /**
   * Wrapper for API to fetch salary details of a specific employee with fallback to previous month.
   */
  public async getEmployeeSalary(employeeId: number, month?: string) {
    this.validateEmployeeId(employeeId);
    this.validateMonthFormat(month);
    const requestedMonth = this.getCalculationMonth(month);

    let salaryLog = await this.getLatestSalaryLog(employeeId, requestedMonth);
    if (salaryLog) {
      return await this.getDetailedSalaryBreakdown(employeeId, requestedMonth);
    }

    const previousMonth = this.getPreviousMonth(requestedMonth);
    this.logger.log(
      `No salary record found for employee ${employeeId} in ${requestedMonth}. Trying previous month ${previousMonth}`,
    );

    salaryLog = await this.getLatestSalaryLog(employeeId, previousMonth);
    if (salaryLog) {
      return await this.getDetailedSalaryBreakdown(employeeId, previousMonth);
    }

    throw new NotFoundException(
      `No salary record found for employee ${employeeId} for ${requestedMonth} or ${previousMonth}. Please calculate salary first.`,
    );
  }

  /**
   * Get detailed salary breakdown for a specific employee.
   * This provides comprehensive salary information including commission breakdown and deduction details.
   */
  public async getDetailedSalaryBreakdown(employeeId: number, month?: string) {
    // Validate inputs
    this.validateEmployeeId(employeeId);
    this.validateMonthFormat(month);
    const calculationMonth = this.getCalculationMonth(month);

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
    const salaryLog = await this.getLatestSalaryLog(
      employeeId,
      calculationMonth,
    );

    if (!salaryLog) {
      throw new NotFoundException(
        `No salary record found for employee ${this.formatEmployeeName(employee.firstName, employee.lastName)} (ID: ${employeeId}) for month ${calculationMonth}. Please calculate salary first.`,
      );
    }

    // Get commission breakdown
    const commissionBreakdown = await this.getCommissionBreakdown(
      employeeId,
      calculationMonth,
    );

    // Get detailed deduction breakdown
    const deductionBreakdown = await this.getDetailedDeductionBreakdown(
      employeeId,
      calculationMonth,
    );

    const baseSalary = Number(employee.accounts?.[0]?.baseSalary || 0);
    const commission = Number(
      employee.salesDepartment?.[0]?.commissionAmount || 0,
    );
    const bonus = Number(employee.salesDepartment?.[0]?.salesBonus || 0);
    const attendanceDeductions = Number(salaryLog.deductions || 0);
    const chargebackDeduction = Number(
      employee.salesDepartment?.[0]?.chargebackDeductions || 0,
    );
    const refundDeduction = Number(
      employee.salesDepartment?.[0]?.refundDeductions || 0,
    );
    const totalDeductions =
      attendanceDeductions + chargebackDeduction + refundDeduction;

    // Calculate final salary using the formula: Base Salary + Bonus + Commission - Deductions
    const finalSalary = this.calculateFinalSalary(
      baseSalary + bonus + commission,
      totalDeductions,
    );

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
    try {
      const result = await this.calculateAllEmployees();
      this.logger.log('Monthly salary calculation completed successfully');
      return result;
    } catch (error) {
      this.logger.error(`Monthly salary calculation failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Calculate salary for all active employees - OPTIMIZED VERSION.
   * This is used for the monthly cron job and manual bulk calculations.
   * Uses batch operations to minimize database calls (O(n) -> O(1) queries).
   */
  public async calculateAllEmployees() {
    this.logger.log(
      'Starting optimized bulk salary calculation for all active employees',
    );

    // Get PKT date components to ensure correct month/year calculation
    const pktDate = this.getPKTDateComponents();
    const year = pktDate.year;
    const month = pktDate.month; // 0-based
    const endDay = pktDate.day;
    const calculationMonth = `${year}-${String(month + 1).padStart(2, '0')}`;
    const DAYS_IN_CYCLE = 30;

    // STEP 1: Batch fetch all employee data with joined accounts (reduces queries)
    this.logger.log('Batch fetching all employee data with accounts...');
    const [employees, salesDepts, company] = await Promise.all([
      this.prisma.employee.findMany({
        where: { status: 'active' },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          startDate: true,
          endDate: true,
          bonus: true,
          accounts: {
            select: {
              baseSalary: true,
            },
          },
        },
      }),
      this.prisma.salesDepartment.findMany({
        where: { employee: { status: 'active' } },
        select: {
          employeeId: true,
          commissionAmount: true,
          salesBonus: true,
          chargebackDeductions: true,
          refundDeductions: true,
        },
      }),
      this.prisma.company.findFirst({
        select: { monthlyLatesDays: true },
      }),
    ]);

    const employeeIds = employees.map((emp) => emp.id);
    this.logger.log(`Found ${employees.length} active employees to process`);

    // STEP 2: Batch fetch attendance summaries for current month (1 query instead of N)
    const attendanceSummaries =
      await this.prisma.monthlyAttendanceSummary.findMany({
        where: {
          empId: { in: employeeIds },
          month: `${year}-${String(month + 1).padStart(2, '0')}`,
        },
        select: {
          empId: true,
          totalAbsent: true,
          totalLateDays: true,
          totalHalfDays: true,
        },
      });

    // STEP 3: Batch fetch half-day counts (1 query instead of N)
    // Use PKT date components to create proper date range
    const startDate = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));
    const endDate = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59, 999)); // Last day of month
    const halfDayLogs = await this.prisma.attendanceLog.findMany({
      where: {
        employeeId: { in: employeeIds },
        date: { gte: startDate, lte: endDate },
        status: 'half_day',
      },
      select: { employeeId: true },
    });

    // STEP 4: Batch fetch existing salary logs to determine create vs update (1 query instead of N)
    const existingSalaryLogs = await this.prisma.netSalaryLog.findMany({
      where: {
        employeeId: { in: employeeIds },
        month: calculationMonth,
      },
      select: { id: true, employeeId: true },
    });

    // Create lookup maps for O(1) access
    const salesDeptMap = new Map(salesDepts.map((sd) => [sd.employeeId, sd]));
    const attendanceMap = new Map(
      attendanceSummaries.map((att) => [att.empId, att]),
    );
    const halfDayCountMap = new Map<number, number>();
    halfDayLogs.forEach((log) => {
      halfDayCountMap.set(
        log.employeeId,
        (halfDayCountMap.get(log.employeeId) || 0) + 1,
      );
    });
    const existingLogMap = new Map(
      existingSalaryLogs.map((log) => [log.employeeId, log.id]),
    );

    // STEP 5: Process all calculations in memory (0 DB queries)
    this.logger.log('Processing salary calculations in memory...');
    const salaryResults: any[] = [];
    const logUpdates: any[] = [];
    const logCreates: any[] = [];
    const results: any[] = [];
    let successCount = 0;
    let errorCount = 0;

    const monthlyLatesDays = company?.monthlyLatesDays || 0;

    for (const employee of employees) {
      try {
        // OPTIMIZATION: More robust account handling - find first account with baseSalary
        const account =
          employee.accounts?.find((acc) => acc.baseSalary) ||
          employee.accounts?.[0];
        if (!account?.baseSalary) {
          throw new Error(`No base salary found for employee ${employee.id}`);
        }

        // Calculate salary (same logic as calculateSalaryInternal)
        const baseSalary: Prisma.Decimal = account.baseSalary;
        const salesDept = salesDeptMap.get(employee.id);
        const commission: Prisma.Decimal =
          salesDept?.commissionAmount ?? new Prisma.Decimal(0);
        const salesBonus: Prisma.Decimal =
          salesDept?.salesBonus ?? new Prisma.Decimal(0);
        const employeeBonus: Prisma.Decimal = (employee.bonus ??
          new Prisma.Decimal(0)) as Prisma.Decimal;
        const totalBonus = salesBonus.plus(employeeBonus);

        // Determine start day based on employee type
        // Compare using PKT date components for accuracy
        let startDay = 1;
        if (employee.startDate) {
          const employeeStartPKT = this.convertEmployeeStartDateToPKT(
            employee.startDate,
          );
          if (
            employeeStartPKT.year === year &&
            employeeStartPKT.month === month
          ) {
            startDay = employeeStartPKT.day;
          }
        }

        const daysWorked = endDay - startDay + 1;
        const proportionalSalary = baseSalary
          .mul(daysWorked)
          .div(DAYS_IN_CYCLE);
        const netSalary = proportionalSalary.plus(commission).plus(totalBonus);

        // Calculate deductions (same logic as calculateDeductionsForPeriod)
        const attendanceSummary = attendanceMap.get(employee.id);
        const totalAbsent = attendanceSummary?.totalAbsent || 0;
        const totalLateDays = attendanceSummary?.totalLateDays || 0;
        const totalHalfDays = halfDayCountMap.get(employee.id) || 0;

        const perDaySalary = Number(baseSalary) / 30;
        const absentDeduction = this.calculateAbsentDeduction(
          totalAbsent,
          perDaySalary,
        );
        const lateDeduction = this.calculateLateDeduction(
          totalLateDays,
          monthlyLatesDays,
          perDaySalary,
        );
        const halfDayDeduction = this.calculateHalfDayDeduction(
          totalHalfDays,
          perDaySalary,
        );
        const chargebackDeduction = Number(
          salesDept?.chargebackDeductions || 0,
        );
        const refundDeduction = Number(salesDept?.refundDeductions || 0);
        const totalDeduction =
          absentDeduction +
          lateDeduction +
          halfDayDeduction +
          chargebackDeduction +
          refundDeduction;

        // Prepare salary log data
        // Use PKT time for storage (follows same convention as attendance/chat messages)
        const pktTime = TimeStorageUtil.getCurrentPKTTimeForStorage();
        const existingLogId = existingLogMap.get(employee.id);
        if (existingLogId) {
          logUpdates.push({
            id: existingLogId,
            data: {
              netSalary: netSalary,
              deductions: Math.round(totalDeduction),
              updatedAt: pktTime,
            },
          });
        } else {
          logCreates.push({
            employeeId: employee.id,
            month: calculationMonth,
            netSalary: netSalary,
            deductions: Math.round(totalDeduction),
            status: 'unpaid',
            createdAt: pktTime,
            updatedAt: pktTime,
          });
        }

        results.push({
          employeeId: employee.id,
          employeeName: this.formatEmployeeName(
            employee.firstName,
            employee.lastName,
          ),
          status: 'success',
          logId: existingLogId || null, // Will be set after create
        });
        successCount++;
      } catch (error) {
        this.logger.error(
          `Failed to process employee ${employee.id}: ${error.message}`,
        );
        results.push({
          employeeId: employee.id,
          employeeName: this.formatEmployeeName(
            employee.firstName,
            employee.lastName,
          ),
          status: 'error',
          error: error.message,
        });
        errorCount++;
      }
    }

    // STEP 6: Batch update/create salary logs in transaction (OPTIMIZED)
    this.logger.log(
      `Batch saving ${logUpdates.length} updates and ${logCreates.length} creates...`,
    );
    await this.prisma.$transaction(async (tx) => {
      // OPTIMIZATION: Parallel batch updates instead of sequential loop
      if (logUpdates.length > 0) {
        await Promise.all(
          logUpdates.map((update) =>
            tx.netSalaryLog.update({
              where: { id: update.id },
              data: update.data,
            }),
          ),
        );
      }

      // Batch create new logs
      if (logCreates.length > 0) {
        const createdLogs = await tx.netSalaryLog.createManyAndReturn({
          data: logCreates,
        });

        // Update results with new log IDs
        createdLogs.forEach((log) => {
          const result = results.find(
            (r) => r.employeeId === log.employeeId && r.status === 'success',
          );
          if (result) {
            result.logId = log.id;
          }
        });
      }
    });

    this.logger.log(
      `Salary calculation summary: ${successCount} successful, ${errorCount} failed`,
    );
    this.logger.log(
      `Optimized bulk calculation completed - Reduced from ~${employees.length * 7} queries to ~8 queries`,
    );

    return {
      totalEmployees: employees.length,
      successful: successCount,
      failed: errorCount,
      results: results,
    };
  }

  /**
   * Calculate salary for all active employees for a SPECIFIC month.
   * Used by cron job to calculate previous month's salary on 1st of each month.
   * Handles full month calculation (30/31 days depending on month).
   *
   * @param targetYear - Year to calculate for (e.g., 2025)
   * @param targetMonth - Month to calculate for (0-based: 0 = Jan, 11 = Dec)
   * @returns Calculation results with summary
   */
  public async calculateForSpecificMonth(
    targetYear: number,
    targetMonth: number,
  ) {
    this.logger.log(
      `Starting salary calculation for ${targetYear}-${String(targetMonth + 1).padStart(2, '0')}`,
    );

    // Get last day of the target month (handles 30/31/28/29)
    const lastDayOfMonth = new Date(
      Date.UTC(targetYear, targetMonth + 1, 0),
    ).getUTCDate();
    const calculationMonth = `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}`;
    const DAYS_IN_CYCLE = 30;

    // STEP 1: Batch fetch all employee data with joined accounts
    this.logger.log('Batch fetching all employee data with accounts...');
    const [employees, salesDepts, company] = await Promise.all([
      this.prisma.employee.findMany({
        where: { status: 'active' },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          startDate: true,
          endDate: true,
          bonus: true,
          accounts: {
            select: {
              baseSalary: true,
            },
          },
        },
      }),
      this.prisma.salesDepartment.findMany({
        where: { employee: { status: 'active' } },
        select: {
          employeeId: true,
          commissionAmount: true,
          salesBonus: true,
          chargebackDeductions: true,
          refundDeductions: true,
        },
      }),
      this.prisma.company.findFirst({
        select: { monthlyLatesDays: true },
      }),
    ]);

    const employeeIds = employees.map((emp) => emp.id);
    this.logger.log(`Found ${employees.length} active employees to process`);

    // STEP 2: Batch fetch attendance summaries for target month
    const attendanceSummaries =
      await this.prisma.monthlyAttendanceSummary.findMany({
        where: {
          empId: { in: employeeIds },
          month: calculationMonth,
        },
        select: {
          empId: true,
          totalAbsent: true,
          totalLateDays: true,
          totalHalfDays: true,
        },
      });

    // STEP 3: Batch fetch half-day counts for target month
    const startDate = new Date(
      Date.UTC(targetYear, targetMonth, 1, 0, 0, 0, 0),
    );
    const endDate = new Date(
      Date.UTC(targetYear, targetMonth + 1, 0, 23, 59, 59, 999),
    ); // Last day of month
    const halfDayLogs = await this.prisma.attendanceLog.findMany({
      where: {
        employeeId: { in: employeeIds },
        date: { gte: startDate, lte: endDate },
        status: 'half_day',
      },
      select: { employeeId: true },
    });

    // STEP 4: Batch fetch existing salary logs
    const existingSalaryLogs = await this.prisma.netSalaryLog.findMany({
      where: {
        employeeId: { in: employeeIds },
        month: calculationMonth,
      },
      select: { id: true, employeeId: true },
    });

    // Create lookup maps for O(1) access
    const salesDeptMap = new Map(salesDepts.map((sd) => [sd.employeeId, sd]));
    const attendanceMap = new Map(
      attendanceSummaries.map((att) => [att.empId, att]),
    );
    const halfDayCountMap = new Map<number, number>();
    halfDayLogs.forEach((log) => {
      halfDayCountMap.set(
        log.employeeId,
        (halfDayCountMap.get(log.employeeId) || 0) + 1,
      );
    });
    const existingLogMap = new Map(
      existingSalaryLogs.map((log) => [log.employeeId, log.id]),
    );

    // STEP 5: Process all calculations in memory
    this.logger.log('🔢 Processing salary calculations in memory...');
    const logUpdates: any[] = [];
    const logCreates: any[] = [];
    const results: any[] = [];
    let successCount = 0;
    let errorCount = 0;

    const monthlyLatesDays = company?.monthlyLatesDays || 0;

    for (const employee of employees) {
      try {
        // OPTIMIZATION: More robust account handling - find first account with baseSalary
        const account =
          employee.accounts?.find((acc) => acc.baseSalary) ||
          employee.accounts?.[0];
        if (!account?.baseSalary) {
          throw new Error(`No base salary found for employee ${employee.id}`);
        }

        // Calculate salary
        const baseSalary: Prisma.Decimal = account.baseSalary;
        const salesDept = salesDeptMap.get(employee.id);
        const commission: Prisma.Decimal =
          salesDept?.commissionAmount ?? new Prisma.Decimal(0);
        const salesBonus: Prisma.Decimal =
          salesDept?.salesBonus ?? new Prisma.Decimal(0);
        const employeeBonus: Prisma.Decimal = (employee.bonus ??
          new Prisma.Decimal(0)) as Prisma.Decimal;
        const totalBonus = salesBonus.plus(employeeBonus);

        // Determine start day based on employee type
        // For employees who started in the target month, prorate from start day
        // For employees who started before target month, use day 1 (full month)
        let startDay = 1;
        if (employee.startDate) {
          const employeeStartPKT = this.convertEmployeeStartDateToPKT(
            employee.startDate,
          );
          // Only prorate if employee started in the target month
          if (
            employeeStartPKT.year === targetYear &&
            employeeStartPKT.month === targetMonth
          ) {
            startDay = employeeStartPKT.day;
            this.logger.log(
              `Employee ${employee.id} started on day ${startDay} of ${calculationMonth} - prorating`,
            );
          }
          // If employee started after target month, skip (shouldn't be calculated yet)
          if (
            employeeStartPKT.year > targetYear ||
            (employeeStartPKT.year === targetYear &&
              employeeStartPKT.month > targetMonth)
          ) {
            this.logger.log(
              `Employee ${employee.id} started after ${calculationMonth} - skipping`,
            );
            continue;
          }
        }

        // Use last day of month as endDay for full month calculation
        const endDay = lastDayOfMonth;
        const daysWorked = endDay - startDay + 1;
        const proportionalSalary = baseSalary
          .mul(daysWorked)
          .div(DAYS_IN_CYCLE);
        const netSalary = proportionalSalary.plus(commission).plus(totalBonus);

        // Calculate deductions
        const attendanceSummary = attendanceMap.get(employee.id);
        const totalAbsent = attendanceSummary?.totalAbsent || 0;
        const totalLateDays = attendanceSummary?.totalLateDays || 0;
        const totalHalfDays = halfDayCountMap.get(employee.id) || 0;

        const perDaySalary = Number(baseSalary) / 30;
        const absentDeduction = this.calculateAbsentDeduction(
          totalAbsent,
          perDaySalary,
        );
        const lateDeduction = this.calculateLateDeduction(
          totalLateDays,
          monthlyLatesDays,
          perDaySalary,
        );
        const halfDayDeduction = this.calculateHalfDayDeduction(
          totalHalfDays,
          perDaySalary,
        );
        const chargebackDeduction = Number(
          salesDept?.chargebackDeductions || 0,
        );
        const refundDeduction = Number(salesDept?.refundDeductions || 0);
        const totalDeduction =
          absentDeduction +
          lateDeduction +
          halfDayDeduction +
          chargebackDeduction +
          refundDeduction;

        // Prepare salary log data
        const pktTime = TimeStorageUtil.getCurrentPKTTimeForStorage();
        const existingLogId = existingLogMap.get(employee.id);
        if (existingLogId) {
          logUpdates.push({
            id: existingLogId,
            data: {
              netSalary: netSalary,
              deductions: Math.round(totalDeduction),
              updatedAt: pktTime,
            },
          });
        } else {
          logCreates.push({
            employeeId: employee.id,
            month: calculationMonth,
            netSalary: netSalary,
            deductions: Math.round(totalDeduction),
            status: 'unpaid',
            createdAt: pktTime,
            updatedAt: pktTime,
          });
        }

        results.push({
          employeeId: employee.id,
          employeeName: this.formatEmployeeName(
            employee.firstName,
            employee.lastName,
          ),
          status: 'success',
          logId: existingLogId || null,
          startDay,
          endDay,
          daysWorked,
        });
        successCount++;
      } catch (error) {
        this.logger.error(
          `Failed to process employee ${employee.id}: ${error.message}`,
        );
        results.push({
          employeeId: employee.id,
          employeeName: this.formatEmployeeName(
            employee.firstName,
            employee.lastName,
          ),
          status: 'error',
          error: error.message,
        });
        errorCount++;
      }
    }

    // STEP 6: Batch update/create salary logs in transaction (OPTIMIZED)
    this.logger.log(
      `💾 Batch saving ${logUpdates.length} updates and ${logCreates.length} creates...`,
    );
    await this.prisma.$transaction(async (tx) => {
      // OPTIMIZATION: Parallel batch updates instead of sequential loop
      if (logUpdates.length > 0) {
        await Promise.all(
          logUpdates.map((update) =>
            tx.netSalaryLog.update({
              where: { id: update.id },
              data: update.data,
            }),
          ),
        );
      }

      // Batch create new logs
      if (logCreates.length > 0) {
        const createdLogs = await tx.netSalaryLog.createManyAndReturn({
          data: logCreates,
        });

        // Update results with new log IDs
        createdLogs.forEach((log) => {
          const result = results.find(
            (r) => r.employeeId === log.employeeId && r.status === 'success',
          );
          if (result) {
            result.logId = log.id;
          }
        });
      }
    });

    this.logger.log(
      `Salary calculation summary for ${calculationMonth}: ${successCount} successful, ${errorCount} failed`,
    );
    this.logger.log(
      `Monthly salary calculation completed for ${calculationMonth}`,
    );

    return {
      month: calculationMonth,
      totalEmployees: employees.length,
      successful: successCount,
      failed: errorCount,
      results: results,
    };
  }

  /**
   * Calculate deductions for a specific employee for a specific month.
   */
  /**
   * Calculate deductions for a single employee for a specific month.
   * Optimized to batch fetch all required data in parallel.
   */
  public async calculateEmployeeDeductions(employeeId: number, month: string) {
    // Validate month format
    this.validateMonthFormat(month);

    // Batch fetch all required data in parallel (reduces from 5 sequential queries to 1 parallel batch)
    const [
      company,
      employee,
      attendanceSummary,
      account,
      salesDepartment,
      halfDayCount,
    ] = await Promise.all([
      this.prisma.company.findFirst({
        select: { monthlyLatesDays: true },
      }),
      this.prisma.employee.findUnique({
        where: { id: employeeId },
        select: { id: true, firstName: true, lastName: true, status: true },
      }),
      this.prisma.monthlyAttendanceSummary.findFirst({
        where: { empId: employeeId, month: month },
      }),
      this.prisma.account.findFirst({
        where: { employeeId },
        select: { baseSalary: true },
      }),
      this.prisma.salesDepartment.findFirst({
        where: { employeeId },
        select: { chargebackDeductions: true, refundDeductions: true },
      }),
      this.getHalfDayCount(employeeId, month),
    ]);

    if (!company) {
      throw new NotFoundException(
        'Company settings not found. Please configure company settings first.',
      );
    }

    if (!employee) {
      throw new NotFoundException(`Employee with ID ${employeeId} not found.`);
    }

    if (employee.status !== 'active') {
      throw new BadRequestException(
        `Employee ${employee.firstName} ${employee.lastName} is not active. Current status: ${employee.status}`,
      );
    }

    if (!attendanceSummary) {
      throw new NotFoundException(
        `No attendance data found for employee ${employee.firstName} ${employee.lastName} (ID: ${employeeId}) for month ${month}. Please ensure attendance data is available.`,
      );
    }

    if (!account?.baseSalary) {
      throw new NotFoundException(
        `No base salary found for employee ${employee.firstName} ${employee.lastName} (ID: ${employeeId}). Please set the base salary in the employee account.`,
      );
    }

    const baseSalary = Number(account.baseSalary);
    const perDaySalary = baseSalary / 30;
    const monthlyLatesDays = company.monthlyLatesDays || 0;

    // Calculate deductions
    const absentDeduction = this.calculateAbsentDeduction(
      attendanceSummary.totalAbsent,
      perDaySalary,
    );
    const lateDeduction = this.calculateLateDeduction(
      attendanceSummary.totalLateDays,
      monthlyLatesDays,
      perDaySalary,
    );
    const halfDayDeduction = this.calculateHalfDayDeduction(
      halfDayCount,
      perDaySalary,
    );

    // Add chargeback and refund deductions
    const chargebackDeduction = Number(
      salesDepartment?.chargebackDeductions || 0,
    );
    const refundDeduction = Number(salesDepartment?.refundDeductions || 0);

    const totalDeduction =
      absentDeduction +
      lateDeduction +
      halfDayDeduction +
      chargebackDeduction +
      refundDeduction;

    return {
      employeeId,
      baseSalary,
      perDaySalary,
      totalAbsent: attendanceSummary.totalAbsent,
      totalLateDays: attendanceSummary.totalLateDays,
      totalHalfDays: halfDayCount,
      monthlyLatesDays,
      absentDeduction,
      lateDeduction,
      halfDayDeduction,
      chargebackDeduction,
      refundDeduction,
      totalDeduction,
      netSalary: baseSalary - totalDeduction, // Internal net salary for deduction calculation
    };
  }

  // Private helper methods
  /**
   * Internal method that contains the salary calculation logic.
   * Optimized to join accounts with employee to reduce queries.
   */
  private async calculateSalaryInternal(
    employeeId: number,
    startDate?: string,
    endDate?: string,
  ) {
    this.logger.log(
      `calculateSalaryInternal called with employeeId: ${employeeId}, startDate: ${startDate}, endDate: ${endDate}`,
    );

    // Validate employeeId
    this.validateEmployeeId(employeeId);

    // Fetch required information - employee with joined accounts (optimized)
    const [employee, salesDept] = await Promise.all([
      this.prisma.employee.findUnique({
        where: { id: employeeId },
        select: {
          id: true,
          startDate: true,
          endDate: true,
          status: true,
          bonus: true,
          accounts: {
            select: { baseSalary: true },
          },
        },
      }),
      this.prisma.salesDepartment.findFirst({
        where: { employeeId },
        select: { commissionAmount: true, salesBonus: true },
      }),
    ]);

    if (!employee) {
      throw new NotFoundException(`Employee with ID ${employeeId} not found`);
    }

    if (!employee.accounts?.[0]?.baseSalary) {
      throw new BadRequestException(
        `No base salary set for employee ID ${employeeId}`,
      );
    }

    // Decimals from Prisma have arithmetic helpers (plus, div, mul)
    const baseSalary: Prisma.Decimal = employee.accounts[0].baseSalary;

    const commission: Prisma.Decimal =
      salesDept?.commissionAmount ?? new Prisma.Decimal(0);

    // Combine possible bonus sources (SalesDepartment + Employee table)
    const salesBonus: Prisma.Decimal =
      salesDept?.salesBonus ?? new Prisma.Decimal(0);
    const employeeBonus: Prisma.Decimal = (employee.bonus ??
      new Prisma.Decimal(0)) as Prisma.Decimal;
    const totalBonus = salesBonus.plus(employeeBonus);

    // Determine calculation date - use endDate if provided, otherwise use current date
    const calculationDate = endDate ? new Date(endDate) : new Date();

    // Convert calculation date to PKT timezone components
    const pktDate = endDate
      ? this.convertDateToPKT(calculationDate)
      : this.getPKTDateComponents();

    const year = pktDate.year;
    const month = pktDate.month; // 0-based (0 = Jan)
    const endDay = pktDate.day;

    this.logger.log(
      `Calculating salary for period: year=${year}, month=${month + 1}, endDay=${endDay}${endDate ? ` (endDate=${endDate})` : ' (current date)'}`,
    );

    // Always use 30 days for salary calculation (standard practice)
    const DAYS_IN_CYCLE = 30;

    let startDay = 1; // Default start day (1st of month)
    let daysWorked: number;

    // Determine start day based on employee type and startDate parameter
    if (startDate) {
      // If startDate is provided, use it
      const startDatePKT = this.convertDateToPKT(startDate);
      if (startDatePKT.year === year && startDatePKT.month === month) {
        startDay = startDatePKT.day;
        this.logger.log(`Using provided startDate: day ${startDay}`);
      }
    } else if (employee.startDate) {
      // Otherwise, check employee start date
      const employeeStartPKT = this.convertEmployeeStartDateToPKT(
        employee.startDate,
      );
      // If employee started this month, use start day
      if (employeeStartPKT.year === year && employeeStartPKT.month === month) {
        startDay = employeeStartPKT.day;
        this.logger.log(
          `New employee ${employeeId} started on day ${startDay} - calculating from start date`,
        );
      }
    }

    // Calculate days worked (inclusive of both start and end day)
    daysWorked = endDay - startDay + 1;

    // Ensure daysWorked is at least 1
    if (daysWorked < 1) {
      this.logger.warn(
        `Invalid daysWorked calculation: ${daysWorked}, setting to 1`,
      );
      daysWorked = 1;
    }

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
   * Optimized to use calculateEmployeeDeductions which batches queries.
   */
  private async calculateDeductionsForPeriod(
    employeeId: number,
    startDate?: string,
    endDate?: string,
  ): Promise<number> {
    try {
      // Determine the calculation period using PKT
      // Use endDate if provided, otherwise use current date
      const calculationDate = endDate ? new Date(endDate) : new Date();
      const pktDate = endDate
        ? this.convertDateToPKT(calculationDate)
        : this.getPKTDateComponents();

      const year = pktDate.year;
      const month = pktDate.month + 1; // Convert to 1-based for calculation
      const calculationMonth = `${year}-${String(month).padStart(2, '0')}`;

      this.logger.log(
        `Calculating deductions for period: ${calculationMonth}${endDate ? ` (endDate=${endDate})` : ' (current date)'}`,
      );

      // Calculate deductions for this month using optimized method
      const deductionResult = await this.calculateEmployeeDeductions(
        employeeId,
        calculationMonth,
      );

      // If we have specific start/end dates, we need to prorate the deductions
      if (startDate || endDate) {
        // Convert dates to PKT for accurate day calculation
        const startDayPKT = startDate ? this.convertDateToPKT(startDate) : null;
        const endDayPKT = endDate ? this.convertDateToPKT(endDate) : null;

        // Ensure we're in the same month/year as calculation
        let startDay = 1; // Default to 1st of month
        if (
          startDayPKT &&
          startDayPKT.year === year &&
          startDayPKT.month === month - 1
        ) {
          startDay = startDayPKT.day;
        }

        const endDay = endDayPKT ? endDayPKT.day : pktDate.day;

        // Get total days in the month
        const daysInMonth = new Date(year, month, 0).getDate(); // month is 1-based here, so this gets last day
        const daysInPeriod = endDay - startDay + 1;

        // Ensure valid period
        if (daysInPeriod < 1 || daysInPeriod > daysInMonth) {
          this.logger.warn(
            `Invalid deduction period: ${daysInPeriod} days (startDay=${startDay}, endDay=${endDay}, daysInMonth=${daysInMonth})`,
          );
          return Math.round(deductionResult.totalDeduction);
        }

        // Prorate attendance-based deductions (absent, late, half-day)
        const attendanceDeductions =
          deductionResult.absentDeduction +
          deductionResult.lateDeduction +
          deductionResult.halfDayDeduction;
        const proratedAttendanceDeductions =
          (attendanceDeductions * daysInPeriod) / daysInMonth;

        // Chargeback and refund deductions are not prorated (they are fixed amounts)
        const chargebackDeduction = deductionResult.chargebackDeduction || 0;
        const refundDeduction = deductionResult.refundDeduction || 0;

        // Calculate total prorated deduction
        const proratedTotalDeduction =
          proratedAttendanceDeductions + chargebackDeduction + refundDeduction;
        return Math.round(proratedTotalDeduction);
      }

      return Math.round(deductionResult.totalDeduction);
    } catch (error) {
      this.logger.warn(
        `Failed to calculate deductions for employee ${employeeId}: ${error.message}`,
      );
      return 0; // Return 0 deductions if calculation fails
    }
  }

  /**
   * Calculate detailed deduction breakdown for a specific period.
   * Optimized to batch fetch data and use getDetailedDeductionBreakdown.
   */
  private async calculateDetailedDeductionsForPeriod(
    employeeId: number,
    startDate?: string,
    endDate?: string,
  ): Promise<any> {
    try {
      // Determine the calculation period using PKT
      // Use endDate if provided, otherwise use current date
      const calculationDate = endDate ? new Date(endDate) : new Date();
      const pktDate = endDate
        ? this.convertDateToPKT(calculationDate)
        : this.getPKTDateComponents();

      const year = pktDate.year;
      const month = pktDate.month + 1; // Convert to 1-based for calculation
      const calculationMonth = `${year}-${String(month).padStart(2, '0')}`;

      this.logger.log(
        `Calculating detailed deductions for period: ${calculationMonth}${endDate ? ` (endDate=${endDate})` : ' (current date)'}`,
      );

      // Get detailed deduction breakdown for this month (optimized)
      const detailedBreakdown = await this.getDetailedDeductionBreakdown(
        employeeId,
        calculationMonth,
      );

      // If we have specific start/end dates, we need to prorate the deductions
      if (startDate || endDate) {
        // Convert dates to PKT for accurate day calculation
        const startDayPKT = startDate ? this.convertDateToPKT(startDate) : null;
        const endDayPKT = endDate ? this.convertDateToPKT(endDate) : null;

        // Ensure we're in the same month/year as calculation
        let startDay = 1; // Default to 1st of month
        if (
          startDayPKT &&
          startDayPKT.year === year &&
          startDayPKT.month === month - 1
        ) {
          startDay = startDayPKT.day;
        }

        const endDay = endDayPKT ? endDayPKT.day : pktDate.day;

        // Get total days in the month
        const daysInMonth = new Date(year, month, 0).getDate(); // month is 1-based here, so this gets last day
        const daysInPeriod = endDay - startDay + 1;

        // Ensure valid period
        if (daysInPeriod < 1 || daysInPeriod > daysInMonth) {
          this.logger.warn(
            `Invalid detailed deduction period: ${daysInPeriod} days (startDay=${startDay}, endDay=${endDay}, daysInMonth=${daysInMonth})`,
          );
          return detailedBreakdown;
        }

        // Prorate the attendance-based deductions (absent, late, half-day)
        const attendanceDeductions =
          detailedBreakdown.absentDeduction +
          detailedBreakdown.lateDeduction +
          detailedBreakdown.halfDayDeduction;
        const proratedAttendanceDeductions = Math.round(
          (attendanceDeductions * daysInPeriod) / daysInMonth,
        );

        // Chargeback and refund deductions are not prorated (they are fixed amounts)
        const chargebackDeduction = detailedBreakdown.chargebackDeduction || 0;
        const refundDeduction = detailedBreakdown.refundDeduction || 0;

        // Calculate total prorated deduction
        const proratedTotalDeduction =
          proratedAttendanceDeductions + chargebackDeduction + refundDeduction;

        // Filter details to only include days within the period
        const filteredAbsentDetails =
          detailedBreakdown.absentDetails?.filter(
            (detail) => detail.day >= startDay && detail.day <= endDay,
          ) || [];

        const filteredLateDetails =
          detailedBreakdown.lateDetails?.filter(
            (detail) => detail.day >= startDay && detail.day <= endDay,
          ) || [];

        const filteredHalfDayDetails =
          detailedBreakdown.halfDayDetails?.filter(
            (detail) => detail.day >= startDay && detail.day <= endDay,
          ) || [];

        return {
          ...detailedBreakdown,
          absentDeduction: Math.round(
            (detailedBreakdown.absentDeduction * daysInPeriod) / daysInMonth,
          ),
          lateDeduction: Math.round(
            (detailedBreakdown.lateDeduction * daysInPeriod) / daysInMonth,
          ),
          halfDayDeduction: Math.round(
            (detailedBreakdown.halfDayDeduction * daysInPeriod) / daysInMonth,
          ),
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
            daysInMonth,
          },
        };
      }

      return detailedBreakdown;
    } catch (error) {
      this.logger.warn(
        `Failed to calculate detailed deductions for employee ${employeeId}: ${error.message}`,
      );
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
        halfDayDetails: [],
      };
    }
  }

  /**
   * Get commission breakdown by projects for a specific employee and month.
   * Optimized single query with includes.
   */
  private async getCommissionBreakdown(
    employeeId: number,
    month: string,
  ): Promise<any[]> {
    // Parse month to get start and end dates
    const { startDate, endDate } = this.parseMonthToDateRange(month);

    // Get projects where this employee was the sales rep and were completed in this month
    // Single optimized query with includes
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
    const commissionBreakdown = projects.map((project) => {
      const projectValue = Number(project.crackedLead?.amount || 0);
      const commissionRate = Number(project.crackedLead?.commissionRate || 0);
      const commissionAmount = (projectValue * commissionRate) / 100;

      return {
        projectId: project.id,
        projectName: `Project ${project.id}`,
        clientName:
          project.client?.companyName || project.client?.clientName || 'N/A',
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
   * Get detailed deduction breakdown for a specific employee and month.
   * Optimized to batch fetch company, attendance summary, account, sales department, and half-day logs in parallel.
   */
  private async getDetailedDeductionBreakdown(
    employeeId: number,
    month: string,
  ): Promise<any> {
    // Batch fetch all required data in parallel (reduces from 5 sequential queries to 1 parallel batch)
    const [
      company,
      attendanceSummary,
      account,
      salesDepartment,
      halfDayDetails,
    ] = await Promise.all([
      this.prisma.company.findFirst({
        select: { monthlyLatesDays: true },
      }),
      this.prisma.monthlyAttendanceSummary.findFirst({
        where: { empId: employeeId, month: month },
      }),
      this.prisma.account.findFirst({
        where: { employeeId },
        select: { baseSalary: true },
      }),
      this.prisma.salesDepartment.findFirst({
        where: { employeeId },
        select: { chargebackDeductions: true, refundDeductions: true },
      }),
      this.getHalfDayDetails(employeeId, month),
    ]);

    const monthlyLatesDays = company?.monthlyLatesDays || 0;

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

    const baseSalary = Number(account?.baseSalary || 0);
    const perDaySalary = baseSalary / 30;

    // Calculate deductions
    const absentDeduction = this.calculateAbsentDeduction(
      attendanceSummary.totalAbsent,
      perDaySalary,
    );
    const lateDeduction = this.calculateLateDeduction(
      attendanceSummary.totalLateDays,
      monthlyLatesDays,
      perDaySalary,
    );
    const halfDayDeduction = this.calculateHalfDayDeduction(
      halfDayDetails.length,
      perDaySalary,
    );

    // Add chargeback and refund deductions
    const chargebackDeduction = Number(
      salesDepartment?.chargebackDeductions || 0,
    );
    const refundDeduction = Number(salesDepartment?.refundDeductions || 0);

    const totalDeduction =
      absentDeduction +
      lateDeduction +
      halfDayDeduction +
      chargebackDeduction +
      refundDeduction;

    // Generate absent details
    const absentDetails = Array.from(
      { length: attendanceSummary.totalAbsent },
      (_, index) => ({
        day: index + 1,
        deduction: perDaySalary * 2,
        reason: 'Absent',
      }),
    );

    // Generate late details (only for excess days)
    const excessLateDays = Math.max(
      0,
      attendanceSummary.totalLateDays - monthlyLatesDays,
    );
    const lateDetails = Array.from({ length: excessLateDays }, (_, index) => ({
      day: index + 1,
      deduction: perDaySalary * (0.5 + index * 0.5),
      reason: 'Late (excess)',
    }));

    // Generate half-day details
    const halfDayDetailsWithDeductions = halfDayDetails.map(
      (detail, index) => ({
        ...detail,
        deduction: perDaySalary * (0.5 + index * 0.5),
      }),
    );

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
   * Get half-day count for a specific employee and month.
   */
  private async getHalfDayCount(
    employeeId: number,
    month: string,
  ): Promise<number> {
    // Parse month to get start and end dates
    const { startDate, endDate } = this.parseMonthToDateRange(month);

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

  /**
   * Get detailed half-day information for a specific employee and month.
   */
  private async getHalfDayDetails(
    employeeId: number,
    month: string,
  ): Promise<any[]> {
    // Parse month to get start and end dates
    const { startDate, endDate } = this.parseMonthToDateRange(month);

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

    return halfDayLogs.map((log) => ({
      date: log.date,
      day: log.date?.getDate() || 0,
      reason: 'Half day',
    }));
  }

  private calculateAbsentDeduction(
    absentDays: number,
    perDaySalary: number,
  ): number {
    return absentDays * perDaySalary * 2; // 2x per day salary for absent days
  }

  private calculateLateDeduction(
    lateDays: number,
    monthlyLatesDays: number,
    perDaySalary: number,
  ): number {
    // For late days: subtract monthly_lates_days from total late days
    // If there's a positive number left, apply progressive deduction
    const excessLateDays = Math.max(0, lateDays - monthlyLatesDays);

    if (excessLateDays === 0) {
      return 0;
    }

    // Progressive deduction: 1st day = 0.5x, 2nd day = 1x, 3rd day = 1.5x, etc.
    let totalDeduction = 0;
    for (let i = 0; i < excessLateDays; i++) {
      const multiplier = 0.5 + i * 0.5; // 0.5, 1.0, 1.5, 2.0, etc.
      totalDeduction += perDaySalary * multiplier;
    }

    return totalDeduction;
  }

  private calculateHalfDayDeduction(
    halfDays: number,
    perDaySalary: number,
  ): number {
    // For half days: progressive deduction starting from 0.5x
    // 1st day = 0.5x, 2nd day = 1x, 3rd day = 1.5x, etc.
    let totalDeduction = 0;
    for (let i = 0; i < halfDays; i++) {
      const multiplier = 0.5 + i * 0.5; // 0.5, 1.0, 1.5, 2.0, etc.
      totalDeduction += perDaySalary * multiplier;
    }

    return totalDeduction;
  }

  /**
   * Get sales employees with sales amount greater than 3000, ordered alphabetically
   *
   * This endpoint retrieves sales employees from the sales department who have
   * sales amount greater than 3000, ordered alphabetically by name.
   * Supports pagination and filtering by sales amount and bonus amount.
   *
   * @param page - Page number (defaults to 1)
   * @param limit - Number of records per page (defaults to 20, max 100)
   * @param minSales - Minimum sales amount filter
   * @param maxSales - Maximum sales amount filter
   * @param minBonus - Minimum bonus amount filter
   * @param maxBonus - Maximum bonus amount filter
   * @returns Paginated array of sales employees with id, name, sales amount, and bonus amount
   */
  public async getSalesEmployeesBonusDisplay(
    page: number = 1,
    limit: number = 20,
    minSales?: number,
    maxSales?: number,
    minBonus?: number,
    maxBonus?: number,
  ) {
    this.logger.log(
      `Fetching sales employees with sales amount > 3000${minSales !== undefined || maxSales !== undefined || minBonus !== undefined || maxBonus !== undefined ? ' (with filters)' : ''}`,
    );

    // Build where clause for sales amount filters
    const salesAmountFilter: any = {
      not: null,
      gte: new Prisma.Decimal(3000), // Default minimum sales amount
    };

    // Apply custom sales amount filters if provided
    if (minSales !== undefined) {
      salesAmountFilter.gte = new Prisma.Decimal(minSales);
    }
    if (maxSales !== undefined) {
      salesAmountFilter.lte = new Prisma.Decimal(maxSales);
    }

    // Build the main where clause
    const whereClause: any = {
      AND: [
        {
          salesAmount: {
            not: null,
          },
        },
        {
          salesAmount: salesAmountFilter,
        },
      ],
    };

    // Fetch all sales employees matching the criteria
    const salesEmployees = await this.prisma.salesDepartment.findMany({
      where: whereClause,
      select: {
        salesAmount: true,
        salesBonus: true,
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        employee: {
          firstName: 'asc',
        },
      },
    });

    // Map to result format and apply bonus filters
    let result = salesEmployees.map((record) => ({
      id: record.employee.id,
      name: `${record.employee.firstName} ${record.employee.lastName}`,
      salesAmount: Number(record.salesAmount),
      bonusAmount: Number(record.salesBonus || 0),
    }));

    // Apply bonus filters if provided
    if (minBonus !== undefined || maxBonus !== undefined) {
      result = result.filter((record) => {
        const meetsMin =
          minBonus === undefined || record.bonusAmount >= minBonus;
        const meetsMax =
          maxBonus === undefined || record.bonusAmount <= maxBonus;
        return meetsMin && meetsMax;
      });
    }

    // Validate pagination parameters
    const validatedPage = Math.max(1, Math.floor(page) || 1);
    const validatedLimit = Math.max(1, Math.min(100, Math.floor(limit) || 20)); // Max 100 per page
    const skip = (validatedPage - 1) * validatedLimit;

    // Calculate total before pagination (for pagination metadata)
    const total = result.length;
    const totalPages = Math.ceil(total / validatedLimit);

    // Apply pagination to results
    const paginatedResults = result.slice(skip, skip + validatedLimit);

    this.logger.log(
      `Found ${total} sales employees (after filters), showing page ${validatedPage} (${paginatedResults.length} records)`,
    );

    return {
      employees: paginatedResults,
      pagination: {
        page: validatedPage,
        limit: validatedLimit,
        total: total,
        totalPages: totalPages,
        retrieved: paginatedResults.length,
      },
    };
  }

  /**
   * Update bonus amount for sales employees with sales amount >= 3000
   *
   * This endpoint allows admins to update the bonus amount for sales employees
   * who have sales amount greater than or equal to 3000.
   *
   * @param employeeId - Employee ID to update bonus for
   * @param bonusAmount - New bonus amount to set
   * @returns Updated employee data with success message
   */
  public async updateSalesEmployeeBonus(
    employeeId: number,
    bonusAmount: number,
  ) {
    this.logger.log(
      `Updating bonus for employee ${employeeId} to ${bonusAmount}`,
    );

    // Validate employeeId
    this.validateEmployeeId(employeeId);

    // Validate bonusAmount
    if (bonusAmount < 0) {
      throw new BadRequestException('Bonus amount cannot be negative.');
    }

    // First check if employee exists
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      select: { id: true, firstName: true, lastName: true },
    });

    if (!employee) {
      throw new NotFoundException(`Employee with ID ${employeeId} not found.`);
    }

    // Check if employee belongs to sales department
    const salesEmployee = await this.prisma.salesDepartment.findFirst({
      where: {
        employeeId: employeeId,
      },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!salesEmployee) {
      throw new NotFoundException(
        `Employee ${employee.firstName} ${employee.lastName} (ID: ${employeeId}) is not a sales department employee. Only sales employees can have their bonus updated.`,
      );
    }

    // Check if employee has sales amount >= 3000
    if (
      !salesEmployee.salesAmount ||
      Number(salesEmployee.salesAmount) < 3000
    ) {
      const currentSalesAmount = salesEmployee.salesAmount
        ? Number(salesEmployee.salesAmount)
        : 0;
      throw new NotFoundException(
        `Employee ${employee.firstName} ${employee.lastName} (ID: ${employeeId}) does not meet the minimum sales criteria. Current sales amount: ${currentSalesAmount}, Required: >= 3000.`,
      );
    }

    // Update the bonus amount
    const updatedSalesEmployee = await this.prisma.salesDepartment.update({
      where: {
        id: salesEmployee.id,
      },
      data: {
        salesBonus: new Prisma.Decimal(bonusAmount),
      },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    const result = {
      id: updatedSalesEmployee.employee.id,
      name: `${updatedSalesEmployee.employee.firstName} ${updatedSalesEmployee.employee.lastName}`,
      salesAmount: Number(updatedSalesEmployee.salesAmount),
      bonusAmount: Number(updatedSalesEmployee.salesBonus),
      message: `Bonus updated successfully for ${updatedSalesEmployee.employee.firstName} ${updatedSalesEmployee.employee.lastName}`,
    };

    this.logger.log(
      `Bonus updated for employee ${employeeId} to ${bonusAmount}`,
    );
    return result;
  }

  /**
   * Handle salary mark-as-paid requests supporting both single and bulk operations.
   */
  public async handleMarkSalaryPaidRequest(
    dto: FinanceMarkSalaryPaidDto,
    processedBy: number,
    userType: string,
  ) {
    if (!processedBy) {
      throw new BadRequestException('Processed by user is required.');
    }

    const processedByRole = userType === 'admin' ? 'Admin' : 'Employee';

    if (dto.employeeIds && dto.employeeIds.length > 0) {
      return await this.markSalariesAsPaidBulk(
        dto.employeeIds,
        dto.month,
        processedBy,
        processedByRole,
      );
    }

    if (dto.employeeId) {
      return await this.markSalaryAsPaid(
        dto.employeeId,
        dto.month,
        processedBy,
        processedByRole,
      );
    }

    throw new BadRequestException(
      'Either employeeId or employeeIds must be provided.',
    );
  }

  /**
   * Wrapper for API to calculate salary preview via query params.
   */
  public async calculateSalaryForPreview(employeeId: number, endDate?: string) {
    return await this.calculateSalaryPreview(employeeId, endDate);
  }

  /**
   * Mark salary as paid for a single employee.
   * Updates the status to 'paid' and sets the paidOn timestamp.
   *
   * @param employeeId - Employee ID to mark as paid
   * @param month - Optional month in YYYY-MM format (defaults to current month)
   * @param processedBy - ID of the user processing the payment
   * @param processedByRole - Role of the user processing the payment
   * @returns Updated salary log information
   */
  public async markSalaryAsPaid(
    employeeId: number,
    month: string | undefined,
    processedBy: number,
    processedByRole?: 'Employee' | 'Admin',
  ) {
    // Validate inputs
    this.validateEmployeeId(employeeId);
    this.validateMonthFormat(month);
    const calculationMonth = this.getCalculationMonth(month);

    // Check if employee exists
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      select: { firstName: true, lastName: true },
    });

    if (!employee) {
      throw new NotFoundException(`Employee with ID ${employeeId} not found.`);
    }

    // Get the latest salary log for this employee and month
    const salaryLog = await this.getLatestSalaryLog(
      employeeId,
      calculationMonth,
    );

    if (!salaryLog) {
      throw new NotFoundException(
        `No salary record found for employee ${this.formatEmployeeName(employee.firstName, employee.lastName)} (ID: ${employeeId}) for month ${calculationMonth}. Please calculate salary first.`,
      );
    }

    // Check if already paid
    if (salaryLog.status === 'paid') {
      this.logger.warn(
        `Salary for employee ${employeeId} (month: ${calculationMonth}) is already marked as paid.`,
      );
      return {
        employeeId,
        employeeName: this.formatEmployeeName(
          employee.firstName,
          employee.lastName,
        ),
        month: calculationMonth,
        status: 'paid',
        paidOn: salaryLog.paidOn,
        message: 'Salary was already marked as paid',
      };
    }

    // Update salary log to mark as paid
    const paidOnDate = TimeStorageUtil.getCurrentPKTTimeForStorage();

    const updatedSalaryLog = await this.prisma.netSalaryLog.update({
      where: { id: salaryLog.id },
      data: {
        status: 'paid',
        paidOn: paidOnDate,
        processedBy: processedBy,
        processedByRole: processedByRole || 'Admin',
        updatedAt: TimeStorageUtil.getCurrentPKTTimeForStorage(),
      },
    });

    this.logger.log(
      `Salary marked as paid for employee ${employeeId} (${employee.firstName} ${employee.lastName}) for month ${calculationMonth}`,
    );

    return {
      employeeId,
      employeeName: this.formatEmployeeName(
        employee.firstName,
        employee.lastName,
      ),
      month: calculationMonth,
      status: updatedSalaryLog.status,
      paidOn: updatedSalaryLog.paidOn,
      processedBy: updatedSalaryLog.processedBy,
      processedByRole: updatedSalaryLog.processedByRole,
      message: 'Salary marked as paid successfully',
    };
  }

  /**
   * Mark salaries as paid for multiple employees in bulk.
   * Updates the status to 'paid' and sets the paidOn timestamp for all specified employees.
   *
   * @param employeeIds - Array of employee IDs to mark as paid
   * @param month - Optional month in YYYY-MM format (defaults to current month)
   * @param processedBy - ID of the user processing the payment
   * @param processedByRole - Role of the user processing the payment
   * @returns Summary of bulk operation with results for each employee
   */
  public async markSalariesAsPaidBulk(
    employeeIds: number[],
    month: string | undefined,
    processedBy: number,
    processedByRole?: 'Employee' | 'Admin',
  ) {
    // Validate inputs
    if (!employeeIds || employeeIds.length === 0) {
      throw new BadRequestException('Employee IDs array cannot be empty.');
    }

    if (!Array.isArray(employeeIds)) {
      throw new BadRequestException('Employee IDs must be an array.');
    }

    this.validateMonthFormat(month);
    const calculationMonth = this.getCalculationMonth(month);

    this.logger.log(
      `Starting bulk mark as paid for ${employeeIds.length} employees (month: ${calculationMonth})`,
    );

    // Fetch all employees to validate they exist
    const employees = await this.prisma.employee.findMany({
      where: { id: { in: employeeIds } },
      select: { id: true, firstName: true, lastName: true },
    });

    const employeeMap = new Map(employees.map((emp) => [emp.id, emp]));

    // Find invalid employee IDs
    const invalidIds = employeeIds.filter((id) => !employeeMap.has(id));
    if (invalidIds.length > 0) {
      throw new NotFoundException(
        `Invalid employee IDs: ${invalidIds.join(', ')}. These employees do not exist.`,
      );
    }

    // Fetch all salary logs for the specified employees and month
    const salaryLogs = await this.prisma.netSalaryLog.findMany({
      where: {
        employeeId: { in: employeeIds },
        month: calculationMonth,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Create a map of employeeId to latest salary log (most recent)
    const salaryLogMap = new Map<number, (typeof salaryLogs)[0]>();
    salaryLogs.forEach((log) => {
      if (!salaryLogMap.has(log.employeeId)) {
        salaryLogMap.set(log.employeeId, log);
      }
    });

    // Separate employees into those with salary logs and those without
    const employeesWithLogs: number[] = [];
    const employeesWithoutLogs: number[] = [];
    const alreadyPaid: number[] = [];

    employeeIds.forEach((employeeId) => {
      const log = salaryLogMap.get(employeeId);
      if (!log) {
        employeesWithoutLogs.push(employeeId);
      } else if (log.status === 'paid') {
        alreadyPaid.push(employeeId);
      } else {
        employeesWithLogs.push(employeeId);
      }
    });

    // Prepare batch update data
    const paidOnDate = TimeStorageUtil.getCurrentPKTTimeForStorage();
    const updateDate = TimeStorageUtil.getCurrentPKTTimeForStorage();

    const logIdsToUpdate = employeesWithLogs
      .map((id) => salaryLogMap.get(id)?.id)
      .filter((id) => id !== undefined);

    // Perform bulk update
    let updatedCount = 0;
    if (logIdsToUpdate.length > 0) {
      await this.prisma.netSalaryLog.updateMany({
        where: {
          id: { in: logIdsToUpdate },
        },
        data: {
          status: 'paid',
          paidOn: paidOnDate,
          processedBy: processedBy,
          processedByRole: processedByRole || 'Admin',
          updatedAt: updateDate,
        },
      });
      updatedCount = logIdsToUpdate.length;
    }

    // Build results
    const results = employeeIds.map((employeeId) => {
      const employee = employeeMap.get(employeeId);
      const log = salaryLogMap.get(employeeId);
      const employeeName = employee
        ? this.formatEmployeeName(employee.firstName, employee.lastName)
        : `Unknown (ID: ${employeeId})`;

      if (employeesWithoutLogs.includes(employeeId)) {
        return {
          employeeId,
          employeeName,
          status: 'error',
          message: `No salary record found for month ${calculationMonth}. Please calculate salary first.`,
        };
      }

      if (alreadyPaid.includes(employeeId)) {
        return {
          employeeId,
          employeeName,
          status: 'skipped',
          message: 'Already marked as paid',
          paidOn: log?.paidOn,
        };
      }

      return {
        employeeId,
        employeeName,
        status: 'success',
        message: 'Marked as paid successfully',
        month: calculationMonth,
      };
    });

    this.logger.log(
      `Bulk mark as paid completed: ${updatedCount} updated, ${alreadyPaid.length} already paid, ${employeesWithoutLogs.length} without salary records`,
    );

    return {
      month: calculationMonth,
      totalEmployees: employeeIds.length,
      successful: updatedCount,
      alreadyPaid: alreadyPaid.length,
      failed: employeesWithoutLogs.length,
      results,
    };
  }
}
