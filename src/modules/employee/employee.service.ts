import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class EmployeeService {
  constructor(private readonly prisma: PrismaService) {}

  async getMyProfile(userId: number) {
    const employee = await this.prisma.employee.findUnique({
      where: { id: userId },
      select: {
        // Basic Information
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        status: true,
        address: true,
        dob: true, // dateOfBirth
        
        // Department
        department: {
          select: {
            id: true,
            name: true,
          },
        },
        
        // Role
        role: {
          select: {
            id: true,
            name: true,
          },
        },
        
        // Manager (name and email)
        manager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        
        // Team Lead (name and email)
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

    // Transform dob to dateOfBirth for consistent naming
    const { dob, ...rest } = employee;
    return {
      ...rest,
      dateOfBirth: dob,
    };
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
