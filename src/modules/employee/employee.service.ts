import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class EmployeeService {
  constructor(private readonly prisma: PrismaService) {}

  async getMyProfile(userId: number) {
    const employee = await this.prisma.employee.findUnique({
      where: { id: userId },
      include: {
        department: true,
        role: true,
        manager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        teamLead: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!employee) {
      throw new Error('Employee not found');
    }

    return employee;
  }

  async getDepartmentEmployees(departmentId: number) {
    return await this.prisma.employee.findMany({
      where: { departmentId },
      include: {
        department: true,
        role: true,
        manager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        teamLead: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  async getAllEmployees() {
    return await this.prisma.employee.findMany({
      include: {
        department: true,
        role: true,
        manager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        teamLead: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  async getSeniorEmployees() {
    return await this.prisma.employee.findMany({
      where: {
        role: {
          name: {
            in: ['senior', 'dep_manager', 'team_lead', 'unit_head']
          }
        }
      },
      include: {
        department: true,
        role: true,
        manager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        teamLead: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }
}
