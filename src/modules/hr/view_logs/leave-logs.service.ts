import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { GetLeaveLogsDto } from '../attendance/dto/get-leave-logs.dto';
import { LeaveLogsListResponseDto } from '../attendance/dto/leave-logs-list-response.dto';
import { CreateLeaveLogDto } from '../attendance/dto/create-leave-log.dto';
import { LeaveLogResponseDto } from '../attendance/dto/leave-log-response.dto';
import { ExportLeaveLogsDto } from '../attendance/dto/export-leave-logs.dto';
import { LeaveLogsStatsDto, LeaveLogsStatsResponseDto, PeriodStatsDto, EmployeeLeaveStatsDto, LeaveTypeStatsDto, StatsPeriod } from '../attendance/dto/leave-logs-stats.dto';

@Injectable()
export class LeaveLogsService {
  constructor(private readonly prisma: PrismaService) {}

  async getLeaveLogs(query: GetLeaveLogsDto): Promise<LeaveLogsListResponseDto[]> {
    try {
      const { employee_id, start_date, end_date } = query;

      // Ensure employee_id is a number
      const employeeId = employee_id ? Number(employee_id) : undefined;

      // Validate date range (within last 3 months)
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

      if (start_date && new Date(start_date) < threeMonthsAgo) {
        throw new BadRequestException('Start date cannot be more than 3 months ago');
      }

      if (end_date && new Date(end_date) < threeMonthsAgo) {
        throw new BadRequestException('End date cannot be more than 3 months ago');
      }

      // Validate that start_date is not less than end_date
      if (start_date && end_date && new Date(start_date) > new Date(end_date)) {
        throw new BadRequestException('Start date cannot be greater than end date');
      }

      // Build where clause
      const where: any = {};

      if (employeeId) {
        where.empId = employeeId;
      }

      if (start_date || end_date) {
        where.OR = [];

        if (start_date && end_date) {
          // Check if leave period overlaps with the date range
          where.OR.push({
            AND: [
              { startDate: { lte: new Date(end_date) } },
              { endDate: { gte: new Date(start_date) } }
            ]
          });
        } else if (start_date) {
          where.OR.push({
            endDate: { gte: new Date(start_date) }
          });
        } else if (end_date) {
          where.OR.push({
            startDate: { lte: new Date(end_date) }
          });
        }
      }

      const leaveLogs = await this.prisma.leaveLog.findMany({
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
          appliedOn: 'desc'
        }
      });

      return leaveLogs.map(log => ({
        leave_log_id: log.id,
        emp_id: log.empId,
        employee_name: `${log.employee.firstName} ${log.employee.lastName}`,
        leave_type: log.leaveType,
        start_date: log.startDate.toISOString().split('T')[0],
        end_date: log.endDate.toISOString().split('T')[0],
        reason: log.reason,
        status: log.status || 'Pending',
        applied_on: log.appliedOn.toISOString(),
        reviewed_by: log.reviewedBy,
        reviewer_name: log.reviewer ? `${log.reviewer.firstName} ${log.reviewer.lastName}` : null,
        reviewed_on: log.reviewedOn ? log.reviewedOn.toISOString() : null,
        confirmation_reason: log.confirmationReason,
        created_at: log.createdAt.toISOString(),
        updated_at: log.updatedAt.toISOString()
      }));
    } catch (error) {
      console.error('Error in getLeaveLogs:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(`Failed to get leave logs: ${error.message}`);
    }
  }

  async getLeaveLogsByEmployee(employeeId: number): Promise<LeaveLogsListResponseDto[]> {
    try {
      if (!employeeId || isNaN(employeeId)) {
        throw new BadRequestException('Invalid employee ID');
      }

      const leaveLogs = await this.prisma.leaveLog.findMany({
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
          appliedOn: 'desc'
        }
      });

      return leaveLogs.map(log => ({
        leave_log_id: log.id,
        emp_id: log.empId,
        employee_name: `${log.employee.firstName} ${log.employee.lastName}`,
        leave_type: log.leaveType,
        start_date: log.startDate.toISOString().split('T')[0],
        end_date: log.endDate.toISOString().split('T')[0],
        reason: log.reason,
        status: log.status || 'Pending',
        applied_on: log.appliedOn.toISOString(),
        reviewed_by: log.reviewedBy,
        reviewer_name: log.reviewer ? `${log.reviewer.firstName} ${log.reviewer.lastName}` : null,
        reviewed_on: log.reviewedOn ? log.reviewedOn.toISOString() : null,
        confirmation_reason: log.confirmationReason,
        created_at: log.createdAt.toISOString(),
        updated_at: log.updatedAt.toISOString()
      }));
    } catch (error) {
      console.error('Error in getLeaveLogsByEmployee:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(`Failed to get leave logs by employee: ${error.message}`);
    }
  }

  async getLeaveLogsForExport(query: any) {
    const {
      employee_id,
      start_date,
      end_date
    } = query;

    // Build where clause (same logic as getLeaveLogs but without pagination)
    const where: any = {};

    if (employee_id) {
      where.empId = employee_id;
    }

    if (start_date && end_date) {
      where.appliedOn = {
        gte: new Date(start_date),
        lte: new Date(end_date)
      };
    } else if (start_date) {
      where.appliedOn = {
        gte: new Date(start_date)
      };
    } else if (end_date) {
      where.appliedOn = {
        lte: new Date(end_date)
      };
    }

    return this.prisma.leaveLog.findMany({
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
        appliedOn: 'desc'
      }
    });
  }

  convertLeaveLogsToCSV(leaveLogs: any[], query: ExportLeaveLogsDto): string {
    const headers = [
      'Leave ID',
      'Employee ID',
      'Employee Name',
      'Employee Email',
      'Leave Type',
      'Start Date',
      'End Date',
      'Reason',
      'Status',
      'Applied On',
      'Total Days'
    ];

    if (query.include_reviewer_details) {
      headers.push('Reviewed By', 'Reviewer Name', 'Reviewer Email', 'Reviewed On');
    }

    if (query.include_confirmation_reason) {
      headers.push('Confirmation Reason');
    }

    headers.push('Created At', 'Updated At');

    const csvRows = [headers.join(',')];

    leaveLogs.forEach(log => {
      const row = [
        log.id,
        log.empId,
        `"${log.employee.firstName} ${log.employee.lastName}"`,
        log.employee.email,
        log.leaveType,
        log.startDate.toISOString().split('T')[0],
        log.endDate.toISOString().split('T')[0],
        `"${log.reason || ''}"`,
        log.status || 'Pending',
        log.appliedOn.toISOString(),
        this.calculateLeaveDays(log.startDate, log.endDate)
      ];

      if (query.include_reviewer_details) {
        row.push(
          log.reviewedBy || '',
          log.reviewer ? `"${log.reviewer.firstName} ${log.reviewer.lastName}"` : '',
          log.reviewer ? log.reviewer.email : '',
          log.reviewedOn ? log.reviewedOn.toISOString() : ''
        );
      }

      if (query.include_confirmation_reason) {
        row.push(`"${log.confirmationReason || ''}"`);
      }

      row.push(
        log.createdAt.toISOString(),
        log.updatedAt.toISOString()
      );

      csvRows.push(row.join(','));
    });

    return csvRows.join('\n');
  }

  async getLeaveLogsStats(query: LeaveLogsStatsDto): Promise<LeaveLogsStatsResponseDto> {
    try {
      // Build where clause
      const where: any = {};

      if (query.employee_id) {
        where.empId = query.employee_id;
      }

      if (query.start_date && query.end_date) {
        where.appliedOn = {
          gte: new Date(query.start_date),
          lte: new Date(query.end_date)
        };
      } else if (query.start_date) {
        where.appliedOn = {
          gte: new Date(query.start_date)
        };
      } else if (query.end_date) {
        where.appliedOn = {
          lte: new Date(query.end_date)
        };
      }

      // Get all leave logs for statistics
      const leaveLogs = await this.prisma.leaveLog.findMany({
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
      const totalLeaves = leaveLogs.length;
      const pendingLeaves = leaveLogs.filter(log => log.status === 'Pending').length;
      const approvedLeaves = leaveLogs.filter(log => log.status === 'Approved').length;
      const rejectedLeaves = leaveLogs.filter(log => log.status === 'Rejected').length;

      // Calculate total leave days
      const totalLeaveDays = leaveLogs.reduce((sum, log) => {
        return sum + this.calculateLeaveDays(log.startDate, log.endDate);
      }, 0);

      const averageLeaveDuration = totalLeaves > 0 ? totalLeaveDays / totalLeaves : 0;

      // Find most common leave type
      const leaveTypeCounts = leaveLogs.reduce((acc, log) => {
        const leaveType = log.leaveType || 'Unknown';
        acc[leaveType] = (acc[leaveType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const mostCommonLeaveType = Object.keys(leaveTypeCounts).length > 0
        ? Object.keys(leaveTypeCounts).reduce((a, b) =>
          leaveTypeCounts[a] > leaveTypeCounts[b] ? a : b
        )
        : 'N/A';

      // Generate period statistics
      const periodStats = this.generatePeriodStats(leaveLogs, query.period || StatsPeriod.MONTHLY);

      const response: LeaveLogsStatsResponseDto = {
        total_leaves: totalLeaves,
        pending_leaves: pendingLeaves,
        approved_leaves: approvedLeaves,
        rejected_leaves: rejectedLeaves,
        total_leave_days: totalLeaveDays,
        average_leave_duration: Math.round(averageLeaveDuration * 100) / 100,
        most_common_leave_type: mostCommonLeaveType,
        period_stats: periodStats
      };

      // Add breakdowns if requested
      if (query.include_breakdown) {
        response.employee_breakdown = this.generateEmployeeBreakdown(leaveLogs);
        response.leave_type_breakdown = this.generateLeaveTypeBreakdown(leaveLogs);
      }

      return response;
    } catch (error) {
      console.error('Error in getLeaveLogsStats:', error);
      throw new InternalServerErrorException(`Failed to get leave logs statistics: ${error.message}`);
    }
  }

  // Helper function to calculate leave days accurately by looping through dates
  private calculateLeaveDays(startDate: Date, endDate: Date): number {
    let count = 0;
    const currentDate = new Date(startDate);

    // Loop through each day from start to end (inclusive)
    while (currentDate <= endDate) {
      count++;
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return count;
  }

  // Generate period statistics
  private generatePeriodStats(leaveLogs: any[], period: StatsPeriod): PeriodStatsDto[] {
    const stats: PeriodStatsDto[] = [];
    const groupedLogs = this.groupLogsByPeriod(leaveLogs, period);

    Object.keys(groupedLogs).forEach(periodKey => {
      const logs = groupedLogs[periodKey];
      const totalLeaves = logs.length;
      const pendingLeaves = logs.filter(log => log.status === 'Pending').length;
      const approvedLeaves = logs.filter(log => log.status === 'Approved').length;
      const rejectedLeaves = logs.filter(log => log.status === 'Rejected').length;
      const totalDays = logs.reduce((sum, log) => sum + this.calculateLeaveDays(log.startDate, log.endDate), 0);

      stats.push({
        period: periodKey,
        total_leaves: totalLeaves,
        approved_leaves: approvedLeaves,
        rejected_leaves: rejectedLeaves,
        pending_leaves: pendingLeaves,
        total_days: totalDays
      });
    });

    return stats.sort((a, b) => a.period.localeCompare(b.period));
  }

  // Group logs by period
  private groupLogsByPeriod(leaveLogs: any[], period: StatsPeriod): Record<string, any[]> {
    const grouped: Record<string, any[]> = {};

    leaveLogs.forEach(log => {
      let periodKey: string;
      const date = new Date(log.appliedOn);

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

  // Generate employee breakdown
  private generateEmployeeBreakdown(leaveLogs: any[]): EmployeeLeaveStatsDto[] {
    const employeeStats: Record<number, any> = {};

    leaveLogs.forEach(log => {
      if (!employeeStats[log.empId]) {
        employeeStats[log.empId] = {
          employee_id: log.empId,
          employee_name: `${log.employee.firstName} ${log.employee.lastName}`,
          total_leaves: 0,
          total_days: 0,
          approved_leaves: 0,
          rejected_leaves: 0,
          pending_leaves: 0
        };
      }

      const stats = employeeStats[log.empId];
      stats.total_leaves++;
      stats.total_days += this.calculateLeaveDays(log.startDate, log.endDate);

      if (log.status === 'Approved') stats.approved_leaves++;
      else if (log.status === 'Rejected') stats.rejected_leaves++;
      else stats.pending_leaves++;
    });

    return Object.values(employeeStats).sort((a, b) => b.total_leaves - a.total_leaves);
  }

  // Generate leave type breakdown
  private generateLeaveTypeBreakdown(leaveLogs: any[]): LeaveTypeStatsDto[] {
    const typeStats: Record<string, any> = {};

    leaveLogs.forEach(log => {
      const leaveType = log.leaveType || 'Unknown';
      if (!typeStats[leaveType]) {
        typeStats[leaveType] = {
          leave_type: leaveType,
          count: 0,
          total_days: 0,
          approved_count: 0
        };
      }

      const stats = typeStats[leaveType];
      stats.count++;
      stats.total_days += this.calculateLeaveDays(log.startDate, log.endDate);
      if (log.status === 'Approved') stats.approved_count++;
    });

    return Object.values(typeStats).map(stats => ({
      leave_type: stats.leave_type,
      count: stats.count,
      total_days: stats.total_days,
      approval_rate: stats.count > 0 ? Math.round((stats.approved_count / stats.count) * 100) : 0
    })).sort((a, b) => b.count - a.count);
  }

  async createLeaveLog(leaveData: CreateLeaveLogDto): Promise<LeaveLogResponseDto> {
    try {
      // Validate employee exists
      const employee = await this.prisma.employee.findUnique({
        where: { id: leaveData.emp_id },
        select: { id: true, firstName: true, lastName: true }
      });

      if (!employee) {
        throw new BadRequestException('Employee not found');
      }

      // Validate date range
      const startDate = new Date(leaveData.start_date);
      const endDate = new Date(leaveData.end_date);

      if (startDate > endDate) {
        throw new BadRequestException('Start date cannot be greater than end date');
      }

      // Check for existing leave requests for the same date range
      const existingLeave = await this.prisma.leaveLog.findFirst({
        where: {
          empId: leaveData.emp_id,
          OR: [
            // Check if there's any overlap with existing leave requests
            {
              AND: [
                { startDate: { lte: startDate } },
                { endDate: { gte: startDate } }
              ]
            },
            {
              AND: [
                { startDate: { lte: endDate } },
                { endDate: { gte: endDate } }
              ]
            },
            {
              AND: [
                { startDate: { gte: startDate } },
                { endDate: { lte: endDate } }
              ]
            }
          ],
          status: {
            in: ['Pending', 'Approved']
          }
        }
      });

      if (existingLeave) {
        throw new BadRequestException('Leave request already exists for the specified date range. Please check your existing leave requests.');
      }

      // Create the leave log with status automatically set to 'Pending'
      const leaveLog = await this.prisma.leaveLog.create({
        data: {
          empId: leaveData.emp_id,
          leaveType: leaveData.leave_type,
          startDate: startDate,
          endDate: endDate,
          reason: leaveData.reason,
          status: 'Pending', // Automatically set to pending
          appliedOn: new Date()
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
        }
      });

      return {
        leave_log_id: leaveLog.id,
        emp_id: leaveLog.empId,
        employee_name: `${leaveLog.employee.firstName} ${leaveLog.employee.lastName}`,
        leave_type: leaveLog.leaveType,
        start_date: leaveLog.startDate.toISOString().split('T')[0],
        end_date: leaveLog.endDate.toISOString().split('T')[0],
        reason: leaveLog.reason,
        status: leaveLog.status || 'Pending',
        applied_on: leaveLog.appliedOn.toISOString(),
        reviewed_by: leaveLog.reviewedBy,
        reviewer_name: leaveLog.reviewer ? `${leaveLog.reviewer.firstName} ${leaveLog.reviewer.lastName}` : null,
        reviewed_on: leaveLog.reviewedOn ? leaveLog.reviewedOn.toISOString() : null,
        confirmation_reason: leaveLog.confirmationReason,
        created_at: leaveLog.createdAt.toISOString(),
        updated_at: leaveLog.updatedAt.toISOString()
      };
    } catch (error) {
      console.error('Error in createLeaveLog:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(`Failed to create leave log: ${error.message}`);
    }
  }

  async processLeaveAction(leaveLogId: number, action: 'Approved' | 'Rejected', reviewerId: number, confirmationReason?: string): Promise<LeaveLogResponseDto> {
    try {
      // Find the leave log
      const leaveLog = await this.prisma.leaveLog.findUnique({
        where: { id: leaveLogId },
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
        }
      });

      if (!leaveLog) {
        throw new BadRequestException('Leave log not found');
      }

      // Update the leave log with the action
      const updatedLeaveLog = await this.prisma.leaveLog.update({
        where: { id: leaveLogId },
        data: {
          status: action,
          reviewedBy: reviewerId,
          reviewedOn: new Date(),
          confirmationReason: confirmationReason || null,
          updatedAt: new Date()
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
        }
      });

      // Process attendance updates based on the logic you specified
      if (action === 'Approved') {
        const currentDate = new Date();
        const startDate = leaveLog.startDate;
        const endDate = leaveLog.endDate;

        // Calculate the TOTAL number of days for this leave using proper day counting
        const totalLeaveDays = this.calculateLeaveDays(startDate, endDate);

        console.log(`Leave approved: Total days: ${totalLeaveDays}, Start: ${startDate.toISOString().split('T')[0]}, End: ${endDate.toISOString().split('T')[0]}`);

        // Condition 1: If endDate is less than current date (past leave)
        if (endDate < currentDate) {
          console.log(`Processing past leave - endDate ${endDate.toISOString().split('T')[0]} is before current date ${currentDate.toISOString().split('T')[0]}`);

          // Find the attendance record for this employee
          const attendance = await this.prisma.attendance.findFirst({
            where: { employeeId: leaveLog.empId }
          });

          if (attendance) {
            const currentAbsentDays = attendance.absentDays || 0;
            const currentLeaveDays = attendance.leaveDays || 0;
            const currentQuarterlyLeaves = attendance.quarterlyLeaves || 0;

            // 1. Update attendance table
            await this.prisma.attendance.update({
              where: { id: attendance.id },
              data: {
                absentDays: Math.max(0, currentAbsentDays - totalLeaveDays),
                leaveDays: currentLeaveDays + totalLeaveDays,
                quarterlyLeaves: Math.max(0, currentQuarterlyLeaves - totalLeaveDays)
              }
            });

            console.log(`Updated attendance: -${totalLeaveDays} absent, +${totalLeaveDays} leave, -${totalLeaveDays} quarterly`);

            // 2. Update monthly attendance summary table
            await this.updateMonthlyAttendanceForLeave(leaveLog.empId, startDate, endDate, totalLeaveDays, totalLeaveDays);

            // 3. Update attendance logs table - change status from absent to leave
            const currentDateForLogs = new Date(startDate);
            while (currentDateForLogs <= endDate) {
              const logDate = currentDateForLogs.toISOString().split('T')[0];

              // Check if attendance log exists for this date
              const existingLog = await this.prisma.attendanceLog.findFirst({
                where: {
                  employeeId: leaveLog.empId,
                  date: new Date(logDate)
                }
              });

              if (existingLog) {
                // Update existing log to leave status
                await this.prisma.attendanceLog.update({
                  where: { id: existingLog.id },
                  data: {
                    status: 'leave',
                    checkin: null,
                    checkout: null
                  }
                });
                console.log(`Updated existing log for ${logDate} to leave status`);
              } else {
                // Create new attendance log with leave status
                await this.prisma.attendanceLog.create({
                  data: {
                    employeeId: leaveLog.empId,
                    date: new Date(logDate),
                    checkin: null,
                    checkout: null,
                    mode: 'onsite',
                    status: 'leave'
                  }
                });
                console.log(`Created new leave log for ${logDate}`);
              }

              // Move to next day
              currentDateForLogs.setDate(currentDateForLogs.getDate() + 1);
            }
          }
        }
        // Condition 2: If startDate >= current date (future leave) - DO NOTHING
        else {
          console.log(`Future leave - startDate ${startDate.toISOString().split('T')[0]} is >= current date ${currentDate.toISOString().split('T')[0]}, doing nothing`);
        }
      }
      // If action is 'Rejected', no action needed as per your requirement

      return {
        leave_log_id: updatedLeaveLog.id,
        emp_id: updatedLeaveLog.empId,
        employee_name: `${updatedLeaveLog.employee.firstName} ${updatedLeaveLog.employee.lastName}`,
        leave_type: updatedLeaveLog.leaveType,
        start_date: updatedLeaveLog.startDate.toISOString().split('T')[0],
        end_date: updatedLeaveLog.endDate.toISOString().split('T')[0],
        reason: updatedLeaveLog.reason,
        status: updatedLeaveLog.status || 'Pending',
        applied_on: updatedLeaveLog.appliedOn.toISOString(),
        reviewed_by: updatedLeaveLog.reviewedBy,
        reviewer_name: updatedLeaveLog.reviewer ? `${updatedLeaveLog.reviewer.firstName} ${updatedLeaveLog.reviewer.lastName}` : null,
        reviewed_on: updatedLeaveLog.reviewedOn ? updatedLeaveLog.reviewedOn.toISOString() : null,
        confirmation_reason: updatedLeaveLog.confirmationReason,
        created_at: updatedLeaveLog.createdAt.toISOString(),
        updated_at: updatedLeaveLog.updatedAt.toISOString()
      };
    } catch (error) {
      console.error('Error in processLeaveAction:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(`Failed to process leave action: ${error.message}`);
    }
  }

  // Helper function to update monthly attendance for cross-month leaves
  private async updateMonthlyAttendanceForLeave(empId: number, startDate: Date, endDate: Date, totalLeaveDays: number, allowedDaysForMonthly: number): Promise<void> {
    const monthlyDays = new Map<string, number>();

    // Count the actual days per month
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const monthKey = currentDate.toISOString().slice(0, 7); // YYYY-MM format
      monthlyDays.set(monthKey, (monthlyDays.get(monthKey) || 0) + 1);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    console.log(`Leave spans months:`, Object.fromEntries(monthlyDays));
    console.log(`Total leave days: ${totalLeaveDays}`);

    // Update each affected month with the actual days that fall in that month
    for (const [month, daysInMonth] of monthlyDays) {
      await this.prisma.monthlyAttendanceSummary.updateMany({
        where: {
          empId: empId,
          month: month
        },
        data: {
          totalAbsent: {
            decrement: daysInMonth
          },
          totalLeaveDays: {
            increment: daysInMonth
          }
        }
      });

      console.log(`Updated month ${month}: -${daysInMonth} absent, +${daysInMonth} leave days`);
    }
  }
}

