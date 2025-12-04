import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { GetHalfDayLogsDto } from '../attendance/dto/get-half-day-logs.dto';
import { HalfDayLogsListResponseDto } from '../attendance/dto/half-day-logs-list-response.dto';
import { SubmitHalfDayReasonDto } from '../attendance/dto/submit-half-day-reason.dto';
import { HalfDayLogResponseDto } from '../attendance/dto/half-day-log-response.dto';
import { ExportHalfDayLogsDto } from '../attendance/dto/export-half-day-logs.dto';
import { HalfDayLogsStatsDto, HalfDayLogsStatsResponseDto, EmployeeHalfDayStatsDto, ReasonStatsDto as HalfDayReasonStatsDto, PeriodStatsDto as HalfDayPeriodStatsDto, StatsPeriod } from '../attendance/dto/half-day-logs-stats.dto';

@Injectable()
export class HalfDayLogsService {
  constructor(private readonly prisma: PrismaService) { }

  async getHalfDayLogs(query: GetHalfDayLogsDto): Promise<HalfDayLogsListResponseDto[]> {
    try {
      const { employee_id, start_date, end_date } = query;

      // Ensure employee_id is a number if provided
      const employeeId = employee_id ? Number(employee_id) : undefined;

      // Validate date range (within last 6 months)
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      if (start_date && new Date(start_date) < sixMonthsAgo) {
        throw new BadRequestException('Start date cannot be more than 6 months ago');
      }

      if (end_date && new Date(end_date) < sixMonthsAgo) {
        throw new BadRequestException('End date cannot be more than 6 months ago');
      }

      // Validate that start_date is not greater than end_date
      if (start_date && end_date && new Date(start_date) > new Date(end_date)) {
        throw new BadRequestException('Start date cannot be greater than end date');
      }

      // Build where clause
      const where: any = {};

      if (employeeId) {
        where.empId = employeeId;
      }

      if (start_date || end_date) {
        where.date = {};
        if (start_date) {
          where.date.gte = new Date(start_date);
        }
        if (end_date) {
          where.date.lte = new Date(end_date);
        }
      }

      // Fetch half-day logs with employee and reviewer information
      const halfDayLogs = await this.prisma.halfDayLog.findMany({
        where,
        include: {
          employee: {
            select: {
              firstName: true,
              lastName: true
            }
          },
          reviewer: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        },
        orderBy: {
          date: 'desc'
        }
      });

      // Transform the data to match the response DTO
      return halfDayLogs.map(log => ({
        half_day_log_id: log.id,
        emp_id: log.empId,
        employee_name: `${log.employee.firstName} ${log.employee.lastName}`,
        date: log.date.toISOString().split('T')[0],
        scheduled_time_in: log.scheduledTimeIn,
        actual_time_in: log.actualTimeIn,
        minutes_late: log.minutesLate,
        reason: log.reason,
        justified: log.justified,
        half_day_type: log.halfDayType,
        action_taken: log.actionTaken,
        reviewed_by: log.reviewedBy,
        reviewer_name: log.reviewer ? `${log.reviewer.firstName} ${log.reviewer.lastName}` : null,
        created_at: log.createdAt.toISOString(),
        updated_at: log.updatedAt.toISOString()
      }));
    } catch (error) {
      console.error('Error in getHalfDayLogs:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(`Failed to fetch half-day logs: ${error.message}`);
    }
  }

  async getHalfDayLogsByEmployee(employeeId: number): Promise<HalfDayLogsListResponseDto[]> {
    try {
      // Validate employee_id
      if (isNaN(employeeId) || employeeId <= 0) {
        throw new BadRequestException('Invalid employee ID');
      }

      // Check if employee exists
      const employee = await this.prisma.employee.findUnique({
        where: { id: employeeId }
      });

      if (!employee) {
        throw new BadRequestException('Employee not found');
      }

      // Fetch half-day logs for the specific employee
      const halfDayLogs = await this.prisma.halfDayLog.findMany({
        where: {
          empId: employeeId
        },
        include: {
          employee: {
            select: {
              firstName: true,
              lastName: true
            }
          },
          reviewer: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        },
        orderBy: {
          date: 'desc'
        }
      });

      // Transform the data to match the response DTO
      return halfDayLogs.map(log => ({
        half_day_log_id: log.id,
        emp_id: log.empId,
        employee_name: `${log.employee.firstName} ${log.employee.lastName}`,
        date: log.date.toISOString().split('T')[0],
        scheduled_time_in: log.scheduledTimeIn,
        actual_time_in: log.actualTimeIn,
        minutes_late: log.minutesLate,
        reason: log.reason,
        justified: log.justified,
        half_day_type: log.halfDayType,
        action_taken: log.actionTaken,
        reviewed_by: log.reviewedBy,
        reviewer_name: log.reviewer ? `${log.reviewer.firstName} ${log.reviewer.lastName}` : null,
        created_at: log.createdAt.toISOString(),
        updated_at: log.updatedAt.toISOString()
      }));
    } catch (error) {
      console.error('Error in getHalfDayLogsByEmployee:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(`Failed to fetch half-day logs for employee: ${error.message}`);
    }
  }

  async getHalfDayLogsForExport(query: any) {
    const {
      employee_id,
      start_date,
      end_date
    } = query;

    // Build where clause (same logic as getHalfDayLogs but without pagination)
    const where: any = {};

    if (employee_id) {
      where.empId = employee_id;
    }

    if (start_date || end_date) {
      where.date = {};
      if (start_date) {
        where.date.gte = new Date(start_date);
      }
      if (end_date) {
        where.date.lte = new Date(end_date);
      }
    }

    return this.prisma.halfDayLog.findMany({
      where,
      include: {
        employee: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            id: true
          }
        },
        reviewer: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: {
        date: 'desc'
      }
    });
  }

  convertHalfDayLogsToCSV(halfDayLogs: any[], query: ExportHalfDayLogsDto): string {
    const headers = [
      'Half Day Log ID',
      'Employee ID',
      'Employee Name',
      'Employee Email',
      'Date',
      'Scheduled Time In',
      'Actual Time In',
      'Minutes Late',
      'Reason',
      'Justified',
      'Action Taken'
    ];

    if (query.include_half_day_type) {
      headers.push('Half Day Type');
    }

    if (query.include_reviewer_details) {
      headers.push('Reviewed By', 'Reviewer Name', 'Reviewer Email', 'Reviewed On');
    }

    headers.push('Created At', 'Updated At');

    const csvRows = [headers.join(',')];

    halfDayLogs.forEach(log => {
      const row = [
        log.id,
        log.empId,
        `"${log.employee.firstName} ${log.employee.lastName}"`,
        log.employee.email,
        log.date.toISOString().split('T')[0],
        log.scheduledTimeIn,
        log.actualTimeIn,
        log.minutesLate,
        `"${log.reason || ''}"`,
        log.justified !== null ? log.justified : '',
        log.actionTaken
      ];

      if (query.include_half_day_type) {
        row.push(log.halfDayType || '');
      }

      if (query.include_reviewer_details) {
        row.push(
          log.reviewedBy || '',
          log.reviewer ? `"${log.reviewer.firstName} ${log.reviewer.lastName}"` : '',
          log.reviewer ? log.reviewer.email : '',
          log.reviewedOn ? log.reviewedOn.toISOString() : ''
        );
      }

      row.push(
        log.createdAt.toISOString(),
        log.updatedAt.toISOString()
      );

      csvRows.push(row.join(','));
    });

    return csvRows.join('\n');
  }

  async getHalfDayLogsStats(query: HalfDayLogsStatsDto): Promise<HalfDayLogsStatsResponseDto> {
    try {
      // Build where clause
      const where: any = {};

      if (query.employee_id) {
        where.empId = query.employee_id;
      }

      if (query.start_date && query.end_date) {
        where.date = {
          gte: new Date(query.start_date),
          lte: new Date(query.end_date)
        };
      } else if (query.start_date) {
        where.date = {
          gte: new Date(query.start_date)
        };
      } else if (query.end_date) {
        where.date = {
          lte: new Date(query.end_date)
        };
      }

      // Get all half day logs for statistics
      const halfDayLogs = await this.prisma.halfDayLog.findMany({
        where,
        include: {
          employee: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        }
      });

      // Calculate basic statistics
      const totalHalfDayLogs = halfDayLogs.length;
      const pendingHalfDayLogs = halfDayLogs.filter(log => log.actionTaken === 'Pending').length;
      const completedHalfDayLogs = halfDayLogs.filter(log => log.actionTaken === 'Completed').length;

      // Calculate total minutes late
      const totalMinutesLate = halfDayLogs.reduce((sum, log) => sum + log.minutesLate, 0);
      const averageMinutesLate = totalHalfDayLogs > 0 ? totalMinutesLate / totalHalfDayLogs : 0;

      // Count paid vs unpaid
      const paidHalfDayCount = halfDayLogs.filter(log => log.halfDayType === 'paid').length;
      const unpaidHalfDayCount = halfDayLogs.filter(log => log.halfDayType === 'unpaid').length;

      // Find most common reason
      const reasonCounts = halfDayLogs.reduce((acc, log) => {
        const reason = log.reason || 'No reason provided';
        acc[reason] = (acc[reason] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const mostCommonReason = Object.keys(reasonCounts).length > 0
        ? Object.keys(reasonCounts).reduce((a, b) =>
          reasonCounts[a] > reasonCounts[b] ? a : b
        )
        : 'N/A';

      // Generate period statistics
      const periodStats = this.generateHalfDayLogsPeriodStats(halfDayLogs, query.period || StatsPeriod.MONTHLY);

      const response: HalfDayLogsStatsResponseDto = {
        total_half_day_logs: totalHalfDayLogs,
        pending_half_day_logs: pendingHalfDayLogs,
        completed_half_day_logs: completedHalfDayLogs,
        total_minutes_late: totalMinutesLate,
        average_minutes_late: Math.round(averageMinutesLate * 100) / 100,
        most_common_reason: mostCommonReason,
        paid_half_day_count: paidHalfDayCount,
        unpaid_half_day_count: unpaidHalfDayCount,
        period_stats: periodStats
      };

      // Add breakdowns if requested
      if (query.include_breakdown) {
        response.employee_breakdown = this.generateHalfDayLogsEmployeeBreakdown(halfDayLogs);
        response.reason_breakdown = this.generateHalfDayLogsReasonBreakdown(halfDayLogs);
      }

      return response;
    } catch (error) {
      console.error('Error in getHalfDayLogsStats:', error);
      throw new InternalServerErrorException(`Failed to get half day logs statistics: ${error.message}`);
    }
  }

  // Generate period statistics for half day logs
  private generateHalfDayLogsPeriodStats(halfDayLogs: any[], period: StatsPeriod): HalfDayPeriodStatsDto[] {
    const stats: HalfDayPeriodStatsDto[] = [];
    const groupedLogs = this.groupHalfDayLogsByPeriod(halfDayLogs, period);

    Object.keys(groupedLogs).forEach(periodKey => {
      const logs = groupedLogs[periodKey];
      const totalHalfDayLogs = logs.length;
      const pendingHalfDayLogs = logs.filter(log => log.actionTaken === 'Pending').length;
      const completedHalfDayLogs = logs.filter(log => log.actionTaken === 'Completed').length;
      const totalMinutes = logs.reduce((sum, log) => sum + log.minutesLate, 0);

      stats.push({
        period: periodKey,
        total_half_day_logs: totalHalfDayLogs,
        completed_half_day_logs: completedHalfDayLogs,
        pending_half_day_logs: pendingHalfDayLogs,
        total_minutes: totalMinutes
      });
    });

    return stats.sort((a, b) => a.period.localeCompare(b.period));
  }

  // Group half day logs by period
  private groupHalfDayLogsByPeriod(halfDayLogs: any[], period: StatsPeriod): Record<string, any[]> {
    const grouped: Record<string, any[]> = {};

    halfDayLogs.forEach(log => {
      let periodKey: string;
      const date = new Date(log.date);

      switch (period) {
        case StatsPeriod.DAILY:
          periodKey = date.toISOString().split('T')[0];
          break;
        case StatsPeriod.WEEKLY:
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          periodKey = weekStart.toISOString().split('T')[0];
          break;
        case StatsPeriod.MONTHLY:
          periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        case StatsPeriod.YEARLY:
          periodKey = date.getFullYear().toString();
          break;
        default:
          periodKey = date.toISOString().split('T')[0];
      }

      if (!grouped[periodKey]) {
        grouped[periodKey] = [];
      }
      grouped[periodKey].push(log);
    });

    return grouped;
  }

  // Generate employee breakdown for half day logs
  private generateHalfDayLogsEmployeeBreakdown(halfDayLogs: any[]): EmployeeHalfDayStatsDto[] {
    const employeeStats: Record<number, any> = {};

    halfDayLogs.forEach(log => {
      if (!employeeStats[log.empId]) {
        employeeStats[log.empId] = {
          employee_id: log.empId,
          employee_name: `${log.employee.firstName} ${log.employee.lastName}`,
          total_half_day_logs: 0,
          total_minutes: 0,
          completed_half_day_logs: 0,
          pending_half_day_logs: 0
        };
      }

      const stats = employeeStats[log.empId];
      stats.total_half_day_logs++;
      stats.total_minutes += log.minutesLate;

      if (log.actionTaken === 'Completed') stats.completed_half_day_logs++;
      else if (log.actionTaken === 'Pending') stats.pending_half_day_logs++;
    });

    return Object.values(employeeStats).map(stats => ({
      ...stats,
      average_minutes_late: stats.total_half_day_logs > 0 ? Math.round((stats.total_minutes / stats.total_half_day_logs) * 100) / 100 : 0
    })).sort((a, b) => b.total_half_day_logs - a.total_half_day_logs);
  }

  // Generate reason breakdown for half day logs
  private generateHalfDayLogsReasonBreakdown(halfDayLogs: any[]): HalfDayReasonStatsDto[] {
    const reasonStats: Record<string, any> = {};

    halfDayLogs.forEach(log => {
      const reason = log.reason || 'No reason provided';
      if (!reasonStats[reason]) {
        reasonStats[reason] = {
          reason: reason,
          count: 0,
          total_minutes: 0,
          completed_count: 0
        };
      }

      const stats = reasonStats[reason];
      stats.count++;
      stats.total_minutes += log.minutesLate;
      if (log.actionTaken === 'Completed') stats.completed_count++;
    });

    return Object.values(reasonStats).map(stats => ({
      reason: stats.reason,
      count: stats.count,
      total_minutes: stats.total_minutes,
      completion_rate: stats.count > 0 ? Math.round((stats.completed_count / stats.count) * 100) : 0
    })).sort((a, b) => b.count - a.count);
  }

  async submitHalfDayReason(halfDayData: SubmitHalfDayReasonDto): Promise<HalfDayLogResponseDto> {
    try {
      const { emp_id, date, scheduled_time_in, actual_time_in, minutes_late, reason } = halfDayData;

      // Check if employee exists
      const employee = await this.prisma.employee.findUnique({
        where: { id: emp_id }
      });

      if (!employee) {
        throw new BadRequestException('Employee not found');
      }

      // Find existing half-day log created by check-in for this employee and date
      const existingHalfDayLog = await this.prisma.halfDayLog.findFirst({
        where: {
          empId: emp_id,
          date: new Date(date),
          actionTaken: 'Created' // Only update logs created by check-in
        },
        orderBy: {
          createdAt: 'desc' // Get the most recent one
        }
      });

      if (!existingHalfDayLog) {
        throw new BadRequestException('No half-day log found for this employee and date. Please check-in first.');
      }

      // Update the existing half-day log with reason and change status to Pending
      const halfDayLog = await this.prisma.halfDayLog.update({
        where: { id: existingHalfDayLog.id },
        data: {
          reason: reason,
          actionTaken: 'Pending', // Status when employee submits reason
          halfDayType: null, // Keep null, will be set by HR
          justified: null, // Keep null, will be set by HR
          updatedAt: new Date()
        }
      });

      return {
        half_day_log_id: halfDayLog.id,
        emp_id: halfDayLog.empId,
        date: halfDayLog.date.toISOString().split('T')[0],
        scheduled_time_in: halfDayLog.scheduledTimeIn,
        actual_time_in: halfDayLog.actualTimeIn,
        minutes_late: halfDayLog.minutesLate,
        reason: halfDayLog.reason || '',
        justified: halfDayLog.justified || false,
        half_day_type: halfDayLog.halfDayType || 'unpaid',
        action_taken: halfDayLog.actionTaken,
        reviewed_by: halfDayLog.reviewedBy,
        created_at: halfDayLog.createdAt.toISOString(),
        updated_at: halfDayLog.updatedAt.toISOString()
      };
    } catch (error) {
      console.error('Error in submitHalfDayReason:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(`Failed to submit half-day reason: ${error.message}`);
    }
  }

  async processHalfDayAction(halfDayLogId: number, action: 'Pending' | 'Completed', reviewerId: number, halfDayType?: 'paid' | 'unpaid'): Promise<HalfDayLogResponseDto> {
    try {
      // Find the half-day log
      const halfDayLog = await this.prisma.halfDayLog.findUnique({
        where: { id: halfDayLogId }
      });

      if (!halfDayLog) {
        throw new BadRequestException('Half-day log not found');
      }

      // Update the half-day log with the action
      const updatedHalfDayLog = await this.prisma.halfDayLog.update({
        where: { id: halfDayLogId },
        data: {
          actionTaken: action,
          halfDayType: halfDayType || null, // Let HR set this
          justified: action === 'Completed' ? (halfDayType === 'paid') : null, // Let HR set this
          reviewedBy: reviewerId,
          updatedAt: new Date()
        }
      });

      let attendanceUpdates: { half_days: number; monthly_half_days: number; } | undefined = undefined;

      // If completed and marked as paid, update attendance records
      if (action === 'Completed' && halfDayType === 'paid') {
        // Find the attendance record for this employee
        const attendance = await this.prisma.attendance.findFirst({
          where: { employeeId: halfDayLog.empId }
        });

        if (attendance) {
          // Check if half_days is greater than 0 before decrementing
          const currentHalfDays = attendance.halfDays || 0;
          const newHalfDays = Math.max(0, currentHalfDays - 1); // Prevent going below 0

          // Update attendance with safe decrement
          const updatedAttendance = await this.prisma.attendance.update({
            where: { id: attendance.id },
            data: {
              halfDays: newHalfDays
            }
          });

          // Update monthly attendance summary to reflect the change
          // Use the month from the half-day log date, not current month
          const halfDayMonth = halfDayLog.date.toISOString().slice(0, 7); // YYYY-MM format
          await this.prisma.monthlyAttendanceSummary.updateMany({
            where: {
              empId: halfDayLog.empId,
              month: halfDayMonth
            },
            data: {
              totalHalfDays: {
                decrement: 1
              }
            }
          });

          // Get the updated monthly attendance summary to include in response
          const updatedMonthlySummary = await this.prisma.monthlyAttendanceSummary.findFirst({
            where: {
              empId: halfDayLog.empId,
              month: halfDayMonth
            }
          });

          // Include the updated attendance values in response
          attendanceUpdates = {
            half_days: updatedAttendance.halfDays || 0,
            monthly_half_days: updatedMonthlySummary?.totalHalfDays || 0
          };
        }
      }

      return {
        half_day_log_id: updatedHalfDayLog.id,
        emp_id: updatedHalfDayLog.empId,
        date: updatedHalfDayLog.date.toISOString().split('T')[0],
        scheduled_time_in: updatedHalfDayLog.scheduledTimeIn,
        actual_time_in: updatedHalfDayLog.actualTimeIn,
        minutes_late: updatedHalfDayLog.minutesLate,
        reason: updatedHalfDayLog.reason || '',
        justified: updatedHalfDayLog.justified || false,
        half_day_type: updatedHalfDayLog.halfDayType || 'unpaid',
        action_taken: updatedHalfDayLog.actionTaken,
        reviewed_by: updatedHalfDayLog.reviewedBy,
        created_at: updatedHalfDayLog.createdAt.toISOString(),
        updated_at: updatedHalfDayLog.updatedAt.toISOString(),
        attendance_updates: attendanceUpdates
      };
    } catch (error) {
      console.error('Error in processHalfDayAction:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(`Failed to process half-day action: ${error.message}`);
    }
  }
}

