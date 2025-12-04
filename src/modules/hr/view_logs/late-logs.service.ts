import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { GetLateLogsDto } from '../attendance/dto/get-late-logs.dto';
import { LateLogsListResponseDto } from '../attendance/dto/late-logs-list-response.dto';
import { SubmitLateReasonDto } from '../attendance/dto/submit-late-reason.dto';
import { LateLogResponseDto } from '../attendance/dto/late-log-response.dto';
import { ExportLateLogsDto } from '../attendance/dto/export-late-logs.dto';
import { LateLogsStatsDto, LateLogsStatsResponseDto, EmployeeLateStatsDto, ReasonStatsDto, PeriodStatsDto as LatePeriodStatsDto, StatsPeriod } from '../attendance/dto/late-logs-stats.dto';

@Injectable()
export class LateLogsService {
  constructor(private readonly prisma: PrismaService) {}

  async getLateLogs(query: GetLateLogsDto): Promise<LateLogsListResponseDto[]> {
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

      // Fetch late logs with employee and reviewer information
      const lateLogs = await this.prisma.lateLog.findMany({
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
      return lateLogs.map(log => ({
        late_log_id: log.id,
        emp_id: log.empId,
        employee_name: `${log.employee.firstName} ${log.employee.lastName}`,
        date: log.date.toISOString().split('T')[0],
        scheduled_time_in: log.scheduledTimeIn,
        actual_time_in: log.actualTimeIn,
        minutes_late: log.minutesLate,
        reason: log.reason,
        justified: log.justified,
        late_type: log.lateType,
        action_taken: log.actionTaken,
        reviewed_by: log.reviewedBy,
        reviewer_name: log.reviewer ? `${log.reviewer.firstName} ${log.reviewer.lastName}` : null,
        created_at: log.createdAt.toISOString(),
        updated_at: log.updatedAt.toISOString()
      }));
    } catch (error) {
      console.error('Error in getLateLogs:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(`Failed to fetch late logs: ${error.message}`);
    }
  }

  async getLateLogsByEmployee(employeeId: number): Promise<LateLogsListResponseDto[]> {
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

      // Fetch late logs for the specific employee
      const lateLogs = await this.prisma.lateLog.findMany({
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
      return lateLogs.map(log => ({
        late_log_id: log.id,
        emp_id: log.empId,
        employee_name: `${log.employee.firstName} ${log.employee.lastName}`,
        date: log.date.toISOString().split('T')[0],
        scheduled_time_in: log.scheduledTimeIn,
        actual_time_in: log.actualTimeIn,
        minutes_late: log.minutesLate,
        reason: log.reason,
        justified: log.justified,
        late_type: log.lateType,
        action_taken: log.actionTaken,
        reviewed_by: log.reviewedBy,
        reviewer_name: log.reviewer ? `${log.reviewer.firstName} ${log.reviewer.lastName}` : null,
        created_at: log.createdAt.toISOString(),
        updated_at: log.updatedAt.toISOString()
      }));
    } catch (error) {
      console.error('Error in getLateLogsByEmployee:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(`Failed to fetch late logs for employee: ${error.message}`);
    }
  }

  async getLateLogsForExport(query: any) {
    const {
      employee_id,
      start_date,
      end_date
    } = query;

    // Build where clause (same logic as getLateLogs but without pagination)
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

    return this.prisma.lateLog.findMany({
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

  convertLateLogsToCSV(lateLogs: any[], query: ExportLateLogsDto): string {
    const headers = [
      'Late Log ID',
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

    if (query.include_late_type) {
      headers.push('Late Type');
    }

    if (query.include_reviewer_details) {
      headers.push('Reviewed By', 'Reviewer Name', 'Reviewer Email', 'Reviewed On');
    }

    headers.push('Created At', 'Updated At');

    const csvRows = [headers.join(',')];

    lateLogs.forEach(log => {
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

      if (query.include_late_type) {
        row.push(log.lateType || '');
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

  async getLateLogsStats(query: LateLogsStatsDto): Promise<LateLogsStatsResponseDto> {
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

      // Get all late logs for statistics
      const lateLogs = await this.prisma.lateLog.findMany({
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
      const totalLateLogs = lateLogs.length;
      const pendingLateLogs = lateLogs.filter(log => log.actionTaken === 'Pending').length;
      const completedLateLogs = lateLogs.filter(log => log.actionTaken === 'Completed').length;

      // Calculate total minutes late
      const totalMinutesLate = lateLogs.reduce((sum, log) => sum + log.minutesLate, 0);
      const averageMinutesLate = totalLateLogs > 0 ? totalMinutesLate / totalLateLogs : 0;

      // Count paid vs unpaid
      const paidLateCount = lateLogs.filter(log => log.lateType === 'paid').length;
      const unpaidLateCount = lateLogs.filter(log => log.lateType === 'unpaid').length;

      // Find most common reason
      const reasonCounts = lateLogs.reduce((acc, log) => {
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
      const periodStats = this.generateLateLogsPeriodStats(lateLogs, query.period || StatsPeriod.MONTHLY);

      const response: LateLogsStatsResponseDto = {
        total_late_logs: totalLateLogs,
        pending_late_logs: pendingLateLogs,
        completed_late_logs: completedLateLogs,
        total_minutes_late: totalMinutesLate,
        average_minutes_late: Math.round(averageMinutesLate * 100) / 100,
        most_common_reason: mostCommonReason,
        paid_late_count: paidLateCount,
        unpaid_late_count: unpaidLateCount,
        period_stats: periodStats
      };

      // Add breakdowns if requested
      if (query.include_breakdown) {
        response.employee_breakdown = this.generateLateLogsEmployeeBreakdown(lateLogs);
        response.reason_breakdown = this.generateLateLogsReasonBreakdown(lateLogs);
      }

      return response;
    } catch (error) {
      console.error('Error in getLateLogsStats:', error);
      throw new InternalServerErrorException(`Failed to get late logs statistics: ${error.message}`);
    }
  }

  // Generate period statistics for late logs
  private generateLateLogsPeriodStats(lateLogs: any[], period: StatsPeriod): LatePeriodStatsDto[] {
    const stats: LatePeriodStatsDto[] = [];
    const groupedLogs = this.groupLateLogsByPeriod(lateLogs, period);

    Object.keys(groupedLogs).forEach(periodKey => {
      const logs = groupedLogs[periodKey];
      const totalLateLogs = logs.length;
      const pendingLateLogs = logs.filter(log => log.actionTaken === 'Pending').length;
      const completedLateLogs = logs.filter(log => log.actionTaken === 'Completed').length;
      const totalMinutes = logs.reduce((sum, log) => sum + log.minutesLate, 0);

      stats.push({
        period: periodKey,
        total_late_logs: totalLateLogs,
        completed_late_logs: completedLateLogs,
        pending_late_logs: pendingLateLogs,
        total_minutes: totalMinutes
      });
    });

    return stats.sort((a, b) => a.period.localeCompare(b.period));
  }

  // Group late logs by period
  private groupLateLogsByPeriod(lateLogs: any[], period: StatsPeriod): Record<string, any[]> {
    const grouped: Record<string, any[]> = {};

    lateLogs.forEach(log => {
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

  // Generate employee breakdown for late logs
  private generateLateLogsEmployeeBreakdown(lateLogs: any[]): EmployeeLateStatsDto[] {
    const employeeStats: Record<number, any> = {};

    lateLogs.forEach(log => {
      if (!employeeStats[log.empId]) {
        employeeStats[log.empId] = {
          employee_id: log.empId,
          employee_name: `${log.employee.firstName} ${log.employee.lastName}`,
          total_late_logs: 0,
          total_minutes: 0,
          completed_late_logs: 0,
          pending_late_logs: 0
        };
      }

      const stats = employeeStats[log.empId];
      stats.total_late_logs++;
      stats.total_minutes += log.minutesLate;

      if (log.actionTaken === 'Completed') stats.completed_late_logs++;
      else if (log.actionTaken === 'Pending') stats.pending_late_logs++;
    });

    return Object.values(employeeStats).map(stats => ({
      ...stats,
      average_minutes_late: stats.total_late_logs > 0 ? Math.round((stats.total_minutes / stats.total_late_logs) * 100) / 100 : 0
    })).sort((a, b) => b.total_late_logs - a.total_late_logs);
  }

  // Generate reason breakdown for late logs
  private generateLateLogsReasonBreakdown(lateLogs: any[]): ReasonStatsDto[] {
    const reasonStats: Record<string, any> = {};

    lateLogs.forEach(log => {
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

  async submitLateReason(lateData: SubmitLateReasonDto): Promise<LateLogResponseDto> {
    try {
      const { emp_id, date, scheduled_time_in, actual_time_in, minutes_late, reason } = lateData;

      // Check if employee exists
      const employee = await this.prisma.employee.findUnique({
        where: { id: emp_id }
      });

      if (!employee) {
        throw new BadRequestException('Employee not found');
      }

      // Find existing late log created by check-in for this employee and date
      const existingLateLog = await this.prisma.lateLog.findFirst({
        where: {
          empId: emp_id,
          date: new Date(date),
          actionTaken: 'Created' // Only update logs created by check-in
        },
        orderBy: {
          createdAt: 'desc' // Get the most recent one
        }
      });

      if (!existingLateLog) {
        throw new BadRequestException('No late log found for this employee and date. Please check-in first.');
      }

      // Update the existing late log with reason and change status to Pending
      const lateLog = await this.prisma.lateLog.update({
        where: { id: existingLateLog.id },
        data: {
          reason: reason,
          actionTaken: 'Pending', // Status when employee submits reason
          lateType: null, // Keep null, will be set by HR
          justified: null, // Keep null, will be set by HR
          updatedAt: new Date()
        }
      });

      return {
        late_log_id: lateLog.id,
        emp_id: lateLog.empId,
        date: lateLog.date.toISOString().split('T')[0],
        scheduled_time_in: lateLog.scheduledTimeIn,
        actual_time_in: lateLog.actualTimeIn,
        minutes_late: lateLog.minutesLate,
        reason: lateLog.reason || '',
        justified: lateLog.justified || false,
        late_type: lateLog.lateType || 'unpaid',
        action_taken: lateLog.actionTaken,
        reviewed_by: lateLog.reviewedBy,
        created_at: lateLog.createdAt.toISOString(),
        updated_at: lateLog.updatedAt.toISOString()
      };
    } catch (error) {
      console.error('Error in submitLateReason:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(`Failed to submit late reason: ${error.message}`);
    }
  }

  async processLateAction(lateLogId: number, action: 'Pending' | 'Completed', reviewerId: number, lateType?: 'paid' | 'unpaid'): Promise<LateLogResponseDto> {
    try {
      // Find the late log
      const lateLog = await this.prisma.lateLog.findUnique({
        where: { id: lateLogId }
      });

      if (!lateLog) {
        throw new BadRequestException('Late log not found');
      }

      // Update the late log with the action
      const updatedLateLog = await this.prisma.lateLog.update({
        where: { id: lateLogId },
        data: {
          actionTaken: action,
          lateType: lateType || null, // Let HR set this
          justified: action === 'Completed' ? (lateType === 'paid') : null, // Let HR set this
          reviewedBy: reviewerId,
          updatedAt: new Date()
        }
      });

      let attendanceUpdates: { late_days: number; monthly_lates: number; } | undefined = undefined;

      // If completed and marked as paid, update attendance records
      if (action === 'Completed' && lateType === 'paid') {
        // Find the attendance record for this employee
        const attendance = await this.prisma.attendance.findFirst({
          where: { employeeId: lateLog.empId }
        });

        if (attendance) {
          // Check if late_days is greater than 0 before decrementing
          const currentLateDays = attendance.lateDays || 0;
          const newLateDays = Math.max(0, currentLateDays - 1); // Prevent going below 0

          // Update attendance with safe decrement
          const updatedAttendance = await this.prisma.attendance.update({
            where: { id: attendance.id },
            data: {
              lateDays: newLateDays,
              monthlyLates: {
                increment: 1
              }
            }
          });

          // Update monthly attendance summary to reflect the change
          const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
          await this.prisma.monthlyAttendanceSummary.updateMany({
            where: {
              empId: lateLog.empId,
              month: currentMonth
            },
            data: {
              totalLateDays: {
                decrement: 1
              }
            }
          });

          // Include the updated attendance values in response
          attendanceUpdates = {
            late_days: updatedAttendance.lateDays || 0,
            monthly_lates: updatedAttendance.monthlyLates || 0
          };
        }
      }

      return {
        late_log_id: updatedLateLog.id,
        emp_id: updatedLateLog.empId,
        date: updatedLateLog.date.toISOString().split('T')[0],
        scheduled_time_in: updatedLateLog.scheduledTimeIn,
        actual_time_in: updatedLateLog.actualTimeIn,
        minutes_late: updatedLateLog.minutesLate,
        reason: updatedLateLog.reason || '',
        justified: updatedLateLog.justified || false,
        late_type: updatedLateLog.lateType || 'unpaid',
        action_taken: updatedLateLog.actionTaken,
        reviewed_by: updatedLateLog.reviewedBy,
        created_at: updatedLateLog.createdAt.toISOString(),
        updated_at: updatedLateLog.updatedAt.toISOString(),
        attendance_updates: attendanceUpdates
      };
    } catch (error) {
      console.error('Error in processLateAction:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(`Failed to process late action: ${error.message}`);
    }
  }
}

