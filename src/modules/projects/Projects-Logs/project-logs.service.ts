import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { CreateProjectLogDto } from './dto/create-project-log.dto';
import { UpdateProjectLogDto } from './dto/update-project-log.dto';
import { ProjectLogQueryDto } from './dto/project-log-query.dto';
import { AutoLogService } from './auto-log.service';
import { TimeStorageUtil } from '../../../common/utils/time-storage.util';
import { ExportProjectLogsDto } from './dto/export-project-logs.dto';
import {
  ProjectLogsStatsDto,
  ProjectLogsStatsResponseDto,
  StatsPeriod,
  PeriodStatsDto,
  DeveloperStatsDto,
  ProjectStatsDto,
} from './dto/project-logs-stats.dto';

@Injectable()
export class ProjectLogsService {
  constructor(
    private prisma: PrismaService,
    private autoLogService: AutoLogService,
  ) {}

  // Helper method to normalize user object
  private normalizeUser(user: any) {
    if (!user) return null;

    // Map role names to numeric IDs for backward compatibility
    const roleMap: { [key: string]: number } = {
      dep_manager: 1,
      unit_head: 2,
      team_lead: 3,
      senior: 4,
      junior: 4,
    };

    return {
      ...user,
      roleId: roleMap[user.role] || user.roleId || user.role,
      role: user.role,
      id: user.id,
    };
  }

  // Helper method to validate user is in Production department
  private async validateProductionDepartment(userId: number): Promise<boolean> {
    const employee = await this.prisma.employee.findUnique({
      where: { id: userId },
      include: { department: true },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    if (employee.department.name !== 'Production') {
      throw new ForbiddenException(
        'Only Production department employees can access project logs',
      );
    }

    return true;
  }

  // Helper method to validate project access
  private async validateProjectAccess(
    projectId: number,
    user: any,
  ): Promise<boolean> {
    const normalizedUser = this.normalizeUser(user);

    // Validate user is in Production department
    await this.validateProductionDepartment(normalizedUser.id);

    // Validate project exists
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return true;
  }

  // Helper method to check if user can access project logs
  private async canAccessProjectLogs(
    user: any,
    projectId: number,
  ): Promise<boolean> {
    const normalizedUser = this.normalizeUser(user);

    // Department manager can access all project logs
    if (normalizedUser.role === 'dep_manager') {
      return true;
    }

    // Unit head can access logs in their unit's projects
    if (normalizedUser.role === 'unit_head') {
      const project = await this.prisma.project.findUnique({
        where: { id: projectId },
        include: { unitHead: true },
      });

      if (project && project.unitHeadId === normalizedUser.id) {
        return true;
      }
    }

    // Team lead can access logs in their team's projects
    if (normalizedUser.role === 'team_lead') {
      // For now, allow team leads to access all project logs
      // This can be enhanced with team-based filtering when team structure is defined
      return true;
    }

    // Regular employees can access logs for projects they're working on
    const projectLog = await this.prisma.projectLog.findFirst({
      where: {
        projectId: projectId,
        developerId: normalizedUser.id,
      },
    });

    return !!projectLog;
  }

  // Helper method to check if user can create/update logs
  private async canCreateOrUpdateLogs(
    user: any,
    projectId: number,
  ): Promise<boolean> {
    const normalizedUser = this.normalizeUser(user);

    // Managers and leads can create/update logs
    if (
      ['dep_manager', 'unit_head', 'team_lead'].includes(normalizedUser.role)
    ) {
      return true;
    }

    // Regular employees can create/update their own logs
    const projectLog = await this.prisma.projectLog.findFirst({
      where: {
        projectId: projectId,
        developerId: normalizedUser.id,
      },
    });

    return !!projectLog;
  }

  // 1. Create Project Log
  async createLog(projectId: number, dto: CreateProjectLogDto, user: any) {
    try {
      const normalizedUser = this.normalizeUser(user);

      // Validate project access
      await this.validateProjectAccess(projectId, normalizedUser);

      // Check if user can create logs
      const canCreate = await this.canCreateOrUpdateLogs(
        normalizedUser,
        projectId,
      );
      if (!canCreate) {
        throw new ForbiddenException(
          'You do not have permission to create logs for this project',
        );
      }

      // Create the log entry
      const log = await this.prisma.projectLog.create({
        data: {
          projectId: projectId,
          developerId: normalizedUser.id,
        },
        include: {
          project: {
            include: {
              client: true,
              salesRep: {
                include: { role: true },
              },
              unitHead: {
                include: { role: true },
              },
            },
          },
          developer: {
            include: {
              role: true,
              department: true,
            },
          },
        },
      });

      return {
        success: true,
        message: 'Log entry created successfully',
        data: {
          ...log,
          logEntry: dto.logEntry,
          logType: dto.logType,
          additionalNotes: dto.additionalNotes,
        },
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to create log entry: ${error.message}`,
      );
    }
  }

  // 2. Get Project Logs
  async getProjectLogs(
    projectId: number,
    user: any,
    query: ProjectLogQueryDto,
  ) {
    try {
      const normalizedUser = this.normalizeUser(user);

      // Validate project access
      await this.validateProjectAccess(projectId, normalizedUser);

      // Check if user can access project logs
      const canAccess = await this.canAccessProjectLogs(
        normalizedUser,
        projectId,
      );
      if (!canAccess) {
        throw new ForbiddenException(
          'You do not have permission to view logs for this project',
        );
      }

      // Build where clause
      const whereClause: any = { projectId };

      // Apply query filters
      if (query.developerId) {
        whereClause.developerId = query.developerId;
      }

      if (query.startDate && query.endDate) {
        whereClause.createdAt = {
          gte: new Date(query.startDate),
          lte: new Date(query.endDate),
        };
      } else if (query.startDate) {
        whereClause.createdAt = {
          gte: new Date(query.startDate),
        };
      } else if (query.endDate) {
        whereClause.createdAt = {
          lte: new Date(query.endDate),
        };
      }

      // Build order by clause
      const orderBy: any = {};
      if (query.sortBy === 'createdAt') {
        orderBy.createdAt = query.order || 'desc';
      } else if (query.sortBy === 'updatedAt') {
        orderBy.updatedAt = query.order || 'desc';
      } else {
        orderBy.createdAt = 'desc'; // Default sort
      }

      const logs = await this.prisma.projectLog.findMany({
        where: whereClause,
        include: {
          project: {
            include: {
              client: true,
              salesRep: {
                include: { role: true },
              },
              unitHead: {
                include: { role: true },
              },
            },
          },
          developer: {
            include: {
              role: true,
              department: true,
            },
          },
        },
        orderBy: orderBy,
      });

      return {
        success: true,
        data: logs,
        count: logs.length,
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to fetch project logs: ${error.message}`,
      );
    }
  }

  // 3. Get Log by ID
  async getLogById(projectId: number, logId: number, user: any) {
    try {
      const normalizedUser = this.normalizeUser(user);

      // Validate project access
      await this.validateProjectAccess(projectId, normalizedUser);

      const log = await this.prisma.projectLog.findFirst({
        where: {
          id: logId,
          projectId: projectId,
        },
        include: {
          project: {
            include: {
              client: true,
              salesRep: {
                include: { role: true },
              },
              unitHead: {
                include: { role: true },
              },
            },
          },
          developer: {
            include: {
              role: true,
              department: true,
            },
          },
        },
      });

      if (!log) {
        throw new NotFoundException('Log entry not found');
      }

      // Check if user has access to this log
      const canAccess = await this.canAccessProjectLogs(
        normalizedUser,
        projectId,
      );
      if (!canAccess) {
        throw new ForbiddenException('Access denied to this log entry');
      }

      return {
        success: true,
        data: log,
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to fetch log entry: ${error.message}`,
      );
    }
  }

  // 4. Update Log
  async updateLog(
    projectId: number,
    logId: number,
    dto: UpdateProjectLogDto,
    user: any,
  ) {
    try {
      const normalizedUser = this.normalizeUser(user);

      // Validate project access
      await this.validateProjectAccess(projectId, normalizedUser);

      const log = await this.prisma.projectLog.findFirst({
        where: {
          id: logId,
          projectId: projectId,
        },
      });

      if (!log) {
        throw new NotFoundException('Log entry not found');
      }

      // Check if user can update this log
      const canUpdate = await this.canCreateOrUpdateLogs(
        normalizedUser,
        projectId,
      );
      if (!canUpdate) {
        throw new ForbiddenException(
          'You do not have permission to update this log entry',
        );
      }

      // Regular employees can only update their own logs
      if (
        !['dep_manager', 'unit_head', 'team_lead'].includes(normalizedUser.role)
      ) {
        if (log.developerId !== normalizedUser.id) {
          throw new ForbiddenException(
            'You can only update your own log entries',
          );
        }
      }

      const updatedLog = await this.prisma.projectLog.update({
        where: { id: logId },
        data: {
          updatedAt: TimeStorageUtil.getCurrentTimeForStorage(),
        },
        include: {
          project: {
            include: {
              client: true,
              salesRep: {
                include: { role: true },
              },
              unitHead: {
                include: { role: true },
              },
            },
          },
          developer: {
            include: {
              role: true,
              department: true,
            },
          },
        },
      });

      return {
        success: true,
        message: 'Log entry updated successfully',
        data: {
          ...updatedLog,
          logEntry: dto.logEntry || 'Log entry updated',
          logType: dto.logType,
          additionalNotes: dto.additionalNotes,
        },
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to update log entry: ${error.message}`,
      );
    }
  }

  // 5. Delete Log
  async deleteLog(projectId: number, logId: number, user: any) {
    try {
      const normalizedUser = this.normalizeUser(user);

      // Validate project access
      await this.validateProjectAccess(projectId, normalizedUser);

      const log = await this.prisma.projectLog.findFirst({
        where: {
          id: logId,
          projectId: projectId,
        },
      });

      if (!log) {
        throw new NotFoundException('Log entry not found');
      }

      // Check if user can delete this log
      const canDelete = await this.canCreateOrUpdateLogs(
        normalizedUser,
        projectId,
      );
      if (!canDelete) {
        throw new ForbiddenException(
          'You do not have permission to delete this log entry',
        );
      }

      // Regular employees can only delete their own logs
      if (
        !['dep_manager', 'unit_head', 'team_lead'].includes(normalizedUser.role)
      ) {
        if (log.developerId !== normalizedUser.id) {
          throw new ForbiddenException(
            'You can only delete your own log entries',
          );
        }
      }

      await this.prisma.projectLog.delete({
        where: { id: logId },
      });

      return {
        success: true,
        message: 'Log entry deleted successfully',
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to delete log entry: ${error.message}`,
      );
    }
  }

  // 6. Get Project Employees
  async getProjectEmployees(projectId: number, user: any) {
    try {
      const normalizedUser = this.normalizeUser(user);

      // Validate project access
      await this.validateProjectAccess(projectId, normalizedUser);

      // Check if user can access project logs
      const canAccess = await this.canAccessProjectLogs(
        normalizedUser,
        projectId,
      );
      if (!canAccess) {
        throw new ForbiddenException(
          'You do not have permission to view project employees',
        );
      }

      const employees =
        await this.autoLogService.getProjectEmployees(projectId);

      return {
        success: true,
        data: employees,
        count: employees.length,
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to fetch project employees: ${error.message}`,
      );
    }
  }

  // 7. Get Log Statistics
  async getLogStatistics(projectId: number, user: any) {
    try {
      const normalizedUser = this.normalizeUser(user);

      // Validate project access
      await this.validateProjectAccess(projectId, normalizedUser);

      // Check if user can access project logs
      const canAccess = await this.canAccessProjectLogs(
        normalizedUser,
        projectId,
      );
      if (!canAccess) {
        throw new ForbiddenException(
          'You do not have permission to view log statistics for this project',
        );
      }

      const totalLogs = await this.prisma.projectLog.count({
        where: { projectId },
      });

      const logsByDeveloper = await this.prisma.projectLog.groupBy({
        by: ['developerId'],
        where: { projectId },
        _count: {
          id: true,
        },
      });

      const recentLogs = await this.prisma.projectLog.findMany({
        where: { projectId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          developer: {
            include: {
              role: true,
            },
          },
        },
      });

      return {
        success: true,
        data: {
          totalLogs,
          logsByDeveloper: logsByDeveloper.map((item) => ({
            developerId: item.developerId,
            logCount: item._count.id,
          })),
          recentLogs,
        },
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to fetch log statistics: ${error.message}`,
      );
    }
  }

  // 8. Get Project Logs for Export
  async getProjectLogsForExport(query: ExportProjectLogsDto) {
    try {
      const { project_id, developer_id, start_date, end_date } = query;

      // Build where clause
      const where: any = {};

      if (project_id) {
        where.projectId = project_id;
      }

      if (developer_id) {
        where.developerId = developer_id;
      }

      if (start_date || end_date) {
        where.createdAt = {};
        if (start_date) {
          where.createdAt.gte = new Date(start_date);
        }
        if (end_date) {
          where.createdAt.lte = new Date(end_date);
        }
      }

      return this.prisma.projectLog.findMany({
        where,
        include: {
          project: {
            include: {
              client: {
                select: {
                  id: true,
                  companyName: true,
                  clientName: true,
                  email: true,
                },
              },
            },
          },
          developer: {
            include: {
              role: {
                select: {
                  name: true,
                },
              },
              department: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    } catch (error) {
      console.error('Error in getProjectLogsForExport:', error);
      throw new InternalServerErrorException(
        `Failed to get project logs for export: ${error.message}`,
      );
    }
  }

  // 9. Convert Project Logs to CSV
  convertProjectLogsToCSV(
    projectLogs: any[],
    query: ExportProjectLogsDto,
  ): string {
    const headers = [
      'Project Log ID',
      'Project ID',
      'Developer ID',
      'Developer Name',
      'Developer Email',
      'Created At',
      'Updated At',
    ];

    if (query.include_project_details) {
      headers.push(
        'Project Name',
        'Project Status',
        'Client Name',
        'Client Email',
      );
    }

    if (query.include_developer_details) {
      headers.push('Developer Role', 'Developer Department');
    }

    const csvRows = [headers.join(',')];

    projectLogs.forEach((log) => {
      const row = [
        log.id,
        log.projectId,
        log.developerId,
        `"${log.developer.firstName} ${log.developer.lastName}"`,
        log.developer.email,
        log.createdAt.toISOString(),
        log.updatedAt.toISOString(),
      ];

      if (query.include_project_details) {
        const clientName =
          log.project?.client?.companyName ||
          log.project?.client?.clientName ||
          'N/A';
        row.push(
          `Project ${log.projectId}`,
          'N/A', // Project status not available in current structure
          `"${clientName}"`,
          log.project?.client?.email || 'N/A',
        );
      }

      if (query.include_developer_details) {
        row.push(
          log.developer.role?.name || 'N/A',
          log.developer.department?.name || 'N/A',
        );
      }

      csvRows.push(row.join(','));
    });

    return csvRows.join('\n');
  }

  // 10. Get Project Logs Statistics
  async getProjectLogsStats(
    query: ProjectLogsStatsDto,
  ): Promise<ProjectLogsStatsResponseDto> {
    try {
      // Build where clause
      const where: any = {};

      if (query.project_id) {
        where.projectId = query.project_id;
      }

      if (query.developer_id) {
        where.developerId = query.developer_id;
      }

      if (query.start_date && query.end_date) {
        where.createdAt = {
          gte: new Date(query.start_date),
          lte: new Date(query.end_date),
        };
      } else if (query.start_date) {
        where.createdAt = {
          gte: new Date(query.start_date),
        };
      } else if (query.end_date) {
        where.createdAt = {
          lte: new Date(query.end_date),
        };
      }

      // Get all project logs for statistics
      const projectLogs = await this.prisma.projectLog.findMany({
        where,
        include: {
          project: {
            select: {
              id: true,
            },
          },
          developer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      // Calculate basic statistics
      const totalProjectLogs = projectLogs.length;
      const uniqueProjects = new Set(projectLogs.map((log) => log.projectId))
        .size;
      const uniqueDevelopers = new Set(
        projectLogs.map((log) => log.developerId),
      ).size;
      const averageLogsPerProject =
        uniqueProjects > 0 ? totalProjectLogs / uniqueProjects : 0;
      const averageLogsPerDeveloper =
        uniqueDevelopers > 0 ? totalProjectLogs / uniqueDevelopers : 0;

      // Generate period statistics
      const periodStats = this.generateProjectLogsPeriodStats(
        projectLogs,
        query.period || StatsPeriod.MONTHLY,
      );

      const response: ProjectLogsStatsResponseDto = {
        total_project_logs: totalProjectLogs,
        unique_projects: uniqueProjects,
        unique_developers: uniqueDevelopers,
        average_logs_per_project: Math.round(averageLogsPerProject * 100) / 100,
        average_logs_per_developer:
          Math.round(averageLogsPerDeveloper * 100) / 100,
        period_stats: periodStats,
      };

      // Add breakdowns if requested
      if (query.include_breakdown) {
        response.developer_breakdown =
          this.generateProjectLogsDeveloperBreakdown(projectLogs);
        response.project_breakdown =
          this.generateProjectLogsProjectBreakdown(projectLogs);
      }

      return response;
    } catch (error) {
      console.error('Error in getProjectLogsStats:', error);
      throw new InternalServerErrorException(
        `Failed to get project logs statistics: ${error.message}`,
      );
    }
  }

  // Generate period statistics for project logs
  private generateProjectLogsPeriodStats(
    projectLogs: any[],
    period: StatsPeriod,
  ): PeriodStatsDto[] {
    const stats: PeriodStatsDto[] = [];
    const groupedLogs = this.groupProjectLogsByPeriod(projectLogs, period);

    Object.keys(groupedLogs).forEach((periodKey) => {
      const logs = groupedLogs[periodKey];
      const totalProjectLogs = logs.length;
      const uniqueProjects = new Set(logs.map((log) => log.projectId)).size;
      const uniqueDevelopers = new Set(logs.map((log) => log.developerId)).size;

      stats.push({
        period: periodKey,
        total_project_logs: totalProjectLogs,
        unique_projects: uniqueProjects,
        unique_developers: uniqueDevelopers,
      });
    });

    return stats.sort((a, b) => a.period.localeCompare(b.period));
  }

  // Group project logs by period
  private groupProjectLogsByPeriod(
    projectLogs: any[],
    period: StatsPeriod,
  ): Record<string, any[]> {
    const grouped: Record<string, any[]> = {};

    projectLogs.forEach((log) => {
      let periodKey: string;
      const date = new Date(log.createdAt);

      switch (period) {
        case StatsPeriod.DAILY:
          periodKey = date.toISOString().split('T')[0];
          break;
        case StatsPeriod.WEEKLY:
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          periodKey = `Week of ${weekStart.toISOString().split('T')[0]}`;
          break;
        case StatsPeriod.MONTHLY:
          periodKey = date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
          });
          break;
        case StatsPeriod.YEARLY:
          periodKey = date.getFullYear().toString();
          break;
        default:
          periodKey = date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
          });
      }

      if (!grouped[periodKey]) {
        grouped[periodKey] = [];
      }
      grouped[periodKey].push(log);
    });

    return grouped;
  }

  // Generate developer breakdown
  private generateProjectLogsDeveloperBreakdown(
    projectLogs: any[],
  ): DeveloperStatsDto[] {
    const developerMap = new Map<number, { logs: any[]; developer: any }>();

    projectLogs.forEach((log) => {
      if (!developerMap.has(log.developerId)) {
        developerMap.set(log.developerId, {
          logs: [],
          developer: log.developer,
        });
      }
      developerMap.get(log.developerId)!.logs.push(log);
    });

    return Array.from(developerMap.entries())
      .map(([developerId, data]) => {
        const uniqueProjects = new Set(data.logs.map((log) => log.projectId))
          .size;
        const totalProjectLogs = data.logs.length;
        const averageLogsPerProject =
          uniqueProjects > 0 ? totalProjectLogs / uniqueProjects : 0;

        return {
          developer_id: developerId,
          developer_name: `${data.developer.firstName} ${data.developer.lastName}`,
          total_project_logs: totalProjectLogs,
          unique_projects: uniqueProjects,
          average_logs_per_project:
            Math.round(averageLogsPerProject * 100) / 100,
        };
      })
      .sort((a, b) => b.total_project_logs - a.total_project_logs);
  }

  // Generate project breakdown
  private generateProjectLogsProjectBreakdown(
    projectLogs: any[],
  ): ProjectStatsDto[] {
    const projectMap = new Map<number, { logs: any[]; project: any }>();

    projectLogs.forEach((log) => {
      if (!projectMap.has(log.projectId)) {
        projectMap.set(log.projectId, {
          logs: [],
          project: log.project,
        });
      }
      projectMap.get(log.projectId)!.logs.push(log);
    });

    return Array.from(projectMap.entries())
      .map(([projectId, data]) => {
        const uniqueDevelopers = new Set(
          data.logs.map((log) => log.developerId),
        ).size;
        const totalProjectLogs = data.logs.length;
        const averageLogsPerDeveloper =
          uniqueDevelopers > 0 ? totalProjectLogs / uniqueDevelopers : 0;

        return {
          project_id: projectId,
          project_name: `Project ${projectId}`,
          total_project_logs: totalProjectLogs,
          unique_developers: uniqueDevelopers,
          average_logs_per_developer:
            Math.round(averageLogsPerDeveloper * 100) / 100,
        };
      })
      .sort((a, b) => b.total_project_logs - a.total_project_logs);
  }
}
