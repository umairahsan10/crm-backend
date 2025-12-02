import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../../prisma/prisma.service';
import { Request } from 'express';
import { TimeStorageUtil } from '../../common/utils/time-storage.util';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string, req?: Request) {
    try {
      // Check in admin table
      const admin = await this.prisma.admin.findFirst({ where: { email } });
      if (
        admin &&
        admin.password &&
        (await bcrypt.compare(password, admin.password))
      ) {
        return {
          id: admin.id,
          role: admin.role,
          type: 'admin',
          email: admin.email,
        };
      }

      // Check in employee table
      const employee = await this.prisma.employee.findUnique({
        where: { email },
        include: {
          role: true,
          department: true,
        },
      });

      if (employee && (await bcrypt.compare(password, employee.passwordHash))) {
        return {
          id: employee.id,
          role: employee.role.name,
          type: 'employee',
          email: employee.email,
          department: employee.department?.name,
          departmentId: employee.departmentId,
        };
      }

      // Log failed login attempt for employee if email exists
      if (employee && req) {
        try {
          const ipAddress = this.getClientIpAddress(req);
          await this.createAccessLog(employee.id, ipAddress, false);
        } catch (error) {
          console.error('Failed to create access log for failed login:', error);
        }
      }

      throw new UnauthorizedException('Invalid credentials');
    } catch (error) {
      // If the error is due to DB connectivity, fail gracefully in non-prod env
      if (
        error.message?.includes("Can't reach database server") ||
        error.errorCode === 'P1001'
      ) {
        if (process.env.NODE_ENV !== 'production') {
          // In dev, allow startup with a mock user for testing guards
          return {
            id: 0,
            role: 'mock',
            type: 'admin',
            email,
          };
        }
      }
      throw error;
    }
  }

  async login(email: string, password: string, req?: Request) {
    const user = await this.validateUser(email, password, req);

    let permissionData = {};

    // Check for employee type (HR or Accountant)
    if (user.type === 'employee') {
      if (user.department === 'HR') {
        const hr = await this.prisma.hR.findUnique({
          where: { employeeId: user.id },
        });

        // If HR record exists, use its permissions, otherwise use default HR permissions
        if (hr) {
          permissionData = {
            attendance_permission: hr.attendancePermission ?? false,
            salary_permission: hr.salaryPermission ?? false,
            commission_permission: hr.commissionPermission ?? false,
            employee_add_permission: hr.employeeAddPermission ?? false,
            terminations_handle: hr.terminationsHandle ?? false,
            monthly_request_approvals: hr.monthlyRequestApprovals ?? false,
            targets_set: hr.targetsSet ?? false,
            bonuses_set: hr.bonusesSet ?? false,
            shift_timing_set: hr.shiftTimingSet ?? false,
          };
        } else {
          // Default HR permissions for all HR employees
          permissionData = {
            attendance_permission: true, // HR employees should have attendance permission by default
            salary_permission: false,
            commission_permission: false,
            employee_add_permission: false,
            terminations_handle: false,
            monthly_request_approvals: false,
            targets_set: false,
            bonuses_set: false,
            shift_timing_set: false,
          };
        }
      } else if (user.department === 'Accounts') {
        const accountant = await this.prisma.accountant.findUnique({
          where: { employeeId: user.id },
        });

        // If accountant record exists, use its permissions, otherwise use default accountant permissions
        if (accountant) {
          permissionData = {
            liabilities_permission: accountant.liabilitiesPermission ?? false,
            salary_permission: accountant.salaryPermission ?? false,
            sales_permission: accountant.salesPermission ?? false,
            invoices_permission: accountant.invoicesPermission ?? false,
            expenses_permission: accountant.expensesPermission ?? false,
            assets_permission: accountant.assetsPermission ?? false,
            revenues_permission: accountant.revenuesPermission ?? false,
          };
        } else {
          // Default accountant permissions for all accountant employees
          permissionData = {
            liabilities_permission: false,
            salary_permission: false,
            sales_permission: false,
            invoices_permission: false,
            expenses_permission: false,
            assets_permission: false,
            revenues_permission: false,
          };
        }
      }
    }

    // Construct JWT payload
    const payload = {
      sub: user.id,
      role: user.role,
      type: user.type,
      ...(user.department && { department: user.department }),
      ...(Object.keys(permissionData).length > 0 && {
        permissions: permissionData,
      }),
    };

    const accessToken = this.jwtService.sign(payload);

    // Create access log for successful login (only for employees)
    if (user.type === 'employee' && req) {
      try {
        const ipAddress = this.getClientIpAddress(req);
        await this.createAccessLog(user.id, ipAddress, true);
      } catch (error) {
        // Log error but don't fail the login
        console.error('Failed to create access log:', error);
      }
    }

    return {
      access_token: accessToken,
      user: payload,
    };
  }

  async logout(employeeId?: number) {
    // Update access log with logout time if employee ID is provided
    if (employeeId) {
      try {
        await this.updateAccessLogLogout(employeeId);
      } catch (error) {
        console.error('Failed to update access log on logout:', error);
      }
    }

    return {
      message: 'Successfully logged out',
      success: true,
    };
  }

  private getClientIpAddress(req: Request): string | null {
    // Check various headers for the real IP address
    const forwarded = req.headers['x-forwarded-for'];
    const realIp = req.headers['x-real-ip'];
    const remoteAddress =
      req.connection?.remoteAddress || req.socket?.remoteAddress;

    if (forwarded) {
      // x-forwarded-for can contain multiple IPs, take the first one
      return Array.isArray(forwarded)
        ? forwarded[0]
        : forwarded.split(',')[0].trim();
    }

    if (realIp) {
      return Array.isArray(realIp) ? realIp[0] : realIp;
    }

    if (remoteAddress) {
      // Remove IPv6 prefix if present
      return remoteAddress.replace(/^::ffff:/, '');
    }

    return null;
  }

  private async createAccessLog(
    employeeId: number,
    ipAddress: string | null,
    success: boolean,
  ) {
    // Create time for storage using the utility
    const storageTime = TimeStorageUtil.getCurrentTimeForStorage();

    return this.prisma.accessLog.create({
      data: {
        employeeId,
        ipAddress,
        success,
        loginTime: storageTime,
      },
    });
  }

  private async updateAccessLogLogout(employeeId: number) {
    // Find the most recent access log for this employee that doesn't have a logout time
    const latestAccessLog = await this.prisma.accessLog.findFirst({
      where: {
        employeeId,
        logoutTime: null,
        success: true,
      },
      orderBy: {
        loginTime: 'desc',
      },
    });

    if (latestAccessLog) {
      const storageTime = TimeStorageUtil.getCurrentTimeForStorage();

      await this.prisma.accessLog.update({
        where: { id: latestAccessLog.id },
        data: { logoutTime: storageTime },
      });
    }
  }

  async getAccessLogs(
    employeeId?: number,
    success?: boolean,
    limit: number = 50,
  ) {
    const whereClause: any = {};

    if (employeeId) {
      whereClause.employeeId = employeeId;
    }

    if (success !== undefined) {
      whereClause.success = success;
    }

    return this.prisma.accessLog.findMany({
      where: whereClause,
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: {
        loginTime: 'desc',
      },
      take: limit,
    });
  }

  async getAccessLogsStats() {
    const [
      totalLogs,
      successfulLogins,
      failedLogins,
      uniqueUsers,
      todayLogs,
      thisWeekLogs,
      thisMonthLogs,
      recentActivity,
    ] = await Promise.all([
      // Total access logs
      this.prisma.accessLog.count(),

      // Successful logins
      this.prisma.accessLog.count({
        where: { success: true },
      }),

      // Failed logins
      this.prisma.accessLog.count({
        where: { success: false },
      }),

      // Unique users who have logged in
      this.prisma.accessLog
        .groupBy({
          by: ['employeeId'],
          where: { success: true },
        })
        .then((groups) => groups.length),

      // Today's logs
      this.prisma.accessLog.count({
        where: {
          loginTime: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),

      // This week's logs
      this.prisma.accessLog.count({
        where: {
          loginTime: {
            gte: new Date(new Date().setDate(new Date().getDate() - 7)),
          },
        },
      }),

      // This month's logs
      this.prisma.accessLog.count({
        where: {
          loginTime: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }),

      // Recent activity (last 10 successful logins)
      this.prisma.accessLog.findMany({
        where: { success: true },
        include: {
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: { loginTime: 'desc' },
        take: 10,
      }),
    ]);

    const successRate =
      totalLogs > 0
        ? ((successfulLogins / totalLogs) * 100).toFixed(2)
        : '0.00';

    return {
      summary: {
        totalLogs,
        successfulLogins,
        failedLogins,
        uniqueUsers,
        successRate: parseFloat(successRate),
      },
      timeBasedStats: {
        today: todayLogs,
        thisWeek: thisWeekLogs,
        thisMonth: thisMonthLogs,
      },
      recentActivity,
    };
  }

  async getAccessLogsForExport(
    employeeId?: number,
    success?: boolean,
    startDate?: Date,
    endDate?: Date,
  ) {
    const whereClause: any = {};

    if (employeeId) {
      whereClause.employeeId = employeeId;
    }

    if (success !== undefined) {
      whereClause.success = success;
    }

    if (startDate || endDate) {
      whereClause.loginTime = {};
      if (startDate) {
        whereClause.loginTime.gte = startDate;
      }
      if (endDate) {
        whereClause.loginTime.lte = endDate;
      }
    }

    return this.prisma.accessLog.findMany({
      where: whereClause,
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            department: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        loginTime: 'desc',
      },
    });
  }

  convertToCSV(data: any[]): string {
    if (!data || data.length === 0) {
      return 'No data available';
    }

    // Define CSV headers
    const headers = [
      'ID',
      'Employee ID',
      'Employee Name',
      'Employee Email',
      'Department',
      'Success',
      'Login Time',
      'Logout Time',
      'IP Address',
      'Created At',
    ];

    // Convert data to CSV rows
    const rows = data.map((log) => [
      log.id,
      log.employeeId,
      `${log.employee.firstName} ${log.employee.lastName}`,
      log.employee.email,
      log.employee.department?.name || 'N/A',
      log.success ? 'Yes' : 'No',
      log.loginTime ? new Date(log.loginTime).toISOString() : 'N/A',
      log.logoutTime ? new Date(log.logoutTime).toISOString() : 'N/A',
      log.ipAddress || 'N/A',
      log.createdAt ? new Date(log.createdAt).toISOString() : 'N/A',
    ]);

    // Escape CSV values
    const escapeCsvValue = (value: any) => {
      if (value === null || value === undefined) return '';
      const stringValue = String(value);
      if (
        stringValue.includes(',') ||
        stringValue.includes('"') ||
        stringValue.includes('\n')
      ) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    };

    // Combine headers and rows
    const csvContent = [
      headers.map(escapeCsvValue).join(','),
      ...rows.map((row) => row.map(escapeCsvValue).join(',')),
    ].join('\n');

    return csvContent;
  }
}
