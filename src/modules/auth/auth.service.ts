import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string) {
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

      throw new UnauthorizedException('Invalid credentials');
    } catch (error) {
      // If the error is due to DB connectivity, fail gracefully in non-prod env
      if (error.message?.includes("Can't reach database server") || error.errorCode === 'P1001') {
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

  async login(email: string, password: string) {
    const user = await this.validateUser(email, password);

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
            monthly_leave_request: hr.monthlyLeaveRequest ?? false,
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
            monthly_leave_request: false,
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
            tax_permission: accountant.taxPermission ?? false,
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
            tax_permission: false,
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
      ...(Object.keys(permissionData).length > 0 && { permissions: permissionData }),
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: payload,
    };
  }
}
