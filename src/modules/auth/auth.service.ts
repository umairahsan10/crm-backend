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
    });
    if (employee && (await bcrypt.compare(password, employee.passwordHash))) {
      return {
        id: employee.id,
        role: employee.roleId,
        type: "employee",
        departmentId: employee.departmentId,
        email: employee.email,
      };
    }

    throw new UnauthorizedException('Invalid credentials');
  }

  async login(email: string, password: string) {
    const user = await this.validateUser(email, password);

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      type: user.type,
      ...(user.departmentId && { departmentId: user.departmentId }),
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        type: user.type,
        ...(user.departmentId && { departmentId: user.departmentId }),
      },
    };
  }
}
