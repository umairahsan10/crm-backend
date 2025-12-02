import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';

@Injectable()
export class AutoLogService {
  constructor(private prisma: PrismaService) {}

  // Helper method to add employee to project logs
  private async addEmployeeToProjectLog(projectId: number, employeeId: number) {
    try {
      // Check if employee is already logged for this project
      const existingLog = await this.prisma.projectLog.findFirst({
        where: {
          projectId: projectId,
          developerId: employeeId,
        },
      });

      // Only create log if employee is not already logged for this project
      if (!existingLog) {
        await this.prisma.projectLog.create({
          data: {
            projectId,
            developerId: employeeId,
          },
        });

        console.log(
          `Employee ${employeeId} added to project ${projectId} logs`,
        );
      } else {
        console.log(
          `Employee ${employeeId} already exists in project ${projectId} logs`,
        );
      }
    } catch (error) {
      console.error('Failed to add employee to project log:', error);
      // Don't throw error to avoid breaking the main operation
    }
  }

  // Add employee to project when they are assigned a task
  async addEmployeeToProject(projectId: number, employeeId: number) {
    await this.addEmployeeToProjectLog(projectId, employeeId);
  }

  // Add multiple employees to project (when team is assigned)
  async addEmployeesToProject(projectId: number, employeeIds: number[]) {
    for (const employeeId of employeeIds) {
      await this.addEmployeeToProjectLog(projectId, employeeId);
    }
  }

  // Get all employees working on a project
  async getProjectEmployees(projectId: number) {
    try {
      const logs = await this.prisma.projectLog.findMany({
        where: { projectId },
        include: {
          developer: {
            include: {
              role: true,
              department: true,
            },
          },
        },
      });

      return logs.map((log) => ({
        employeeId: log.developerId,
        employee: log.developer,
      }));
    } catch (error) {
      console.error('Failed to get project employees:', error);
      return [];
    }
  }

  // Get project count for an employee
  async getEmployeeProjectCount(employeeId: number) {
    try {
      const count = await this.prisma.projectLog.count({
        where: { developerId: employeeId },
      });
      return count;
    } catch (error) {
      console.error('Failed to get employee project count:', error);
      return 0;
    }
  }

  // Add employee to all projects their team is working on (when employee joins team)
  async addEmployeeToTeamProjects(employeeId: number, teamLeadId: number) {
    try {
      // Get all projects that the team is currently working on
      const teamProjects = await this.prisma.project.findMany({
        where: {
          team: {
            teamLeadId: teamLeadId,
          },
        },
      });

      // Add employee to all team projects
      for (const project of teamProjects) {
        await this.addEmployeeToProjectLog(project.id, employeeId);
      }

      console.log(
        `Added employee ${employeeId} to ${teamProjects.length} team projects`,
      );
    } catch (error) {
      console.error('Failed to add employee to team projects:', error);
    }
  }
}
