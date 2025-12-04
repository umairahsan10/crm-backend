import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { GetProjectLogsDto } from '../attendance/dto/get-project-logs.dto';
import { ProjectLogsListResponseDto } from '../attendance/dto/project-logs-list-response.dto';
import { ExportProjectLogsDto } from '../../projects/Projects-Logs/dto/export-project-logs.dto';
import { ProjectLogsStatsDto, ProjectLogsStatsResponseDto, StatsPeriod as ProjectLogsStatsPeriod } from '../../projects/Projects-Logs/dto/project-logs-stats.dto';

@Injectable()
export class ProjectLogsService {
  constructor(private readonly prisma: PrismaService) {}

  async getProjectLogs(query: GetProjectLogsDto): Promise<ProjectLogsListResponseDto[]> {
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

      // Fetch project logs with developer and project information
      const projectLogs = await this.prisma.projectLog.findMany({
        where,
        include: {
          developer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          project: {
            select: {
              id: true,
              description: true,
              deadline: true,
              status: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      // Transform the data to match the response DTO
      return projectLogs.map(log => ({
        project_log_id: log.id,
        project_id: log.projectId,
        developer_id: log.developerId,
        developer_first_name: log.developer.firstName,
        developer_last_name: log.developer.lastName,
        developer_name: `${log.developer.firstName} ${log.developer.lastName}`,
        developer_email: log.developer.email,
        project_name: `Project ${log.projectId}`,
        project_description: log.project.description,
        project_deadline: log.project.deadline ? log.project.deadline.toISOString().split('T')[0] : null,
        project_status: log.project.status,
        created_at: log.createdAt.toISOString(),
        updated_at: log.updatedAt.toISOString()
      }));
    } catch (error) {
      console.error('Error in getProjectLogs:', error);
      throw new InternalServerErrorException(`Failed to fetch project logs: ${error.message}`);
    }
  }

  async getProjectLogsForExportHR(query: ExportProjectLogsDto) {
    try {
      const { 
        project_id, 
        developer_id, 
        start_date, 
        end_date 
      } = query;

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
                  email: true
                }
              }
            }
          },
          developer: {
            include: {
              role: {
                select: {
                  name: true
                }
              },
              department: {
                select: {
                  name: true
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
    } catch (error) {
      console.error('Error in getProjectLogsForExportHR:', error);
      throw new InternalServerErrorException(`Failed to get project logs for export: ${error.message}`);
    }
  }

  convertProjectLogsToCSVHR(projectLogs: any[], query: ExportProjectLogsDto): string {
    const headers = [
      'Project Log ID',
      'Project ID',
      'Developer ID',
      'Developer Name',
      'Developer Email',
      'Created At',
      'Updated At'
    ];

    if (query.include_project_details) {
      headers.push('Project Name', 'Client Name', 'Client Email');
    }

    if (query.include_developer_details) {
      headers.push('Developer Role', 'Developer Department');
    }

    const csvRows = [headers.join(',')];

    projectLogs.forEach(log => {
      const row = [
        log.id,
        log.projectId,
        log.developerId,
        `"${log.developer.firstName} ${log.developer.lastName}"`,
        log.developer.email,
        log.createdAt.toISOString(),
        log.updatedAt.toISOString()
      ];

      if (query.include_project_details) {
        const clientName = log.project?.client?.companyName || log.project?.client?.clientName || 'N/A';
        row.push(
          `Project ${log.projectId}`,
          `"${clientName}"`,
          log.project?.client?.email || 'N/A'
        );
      }

      if (query.include_developer_details) {
        row.push(
          log.developer.role?.name || 'N/A',
          log.developer.department?.name || 'N/A'
        );
      }

      csvRows.push(row.join(','));
    });

    return csvRows.join('\n');
  }

  async getProjectLogsStatsHR(query: ProjectLogsStatsDto): Promise<ProjectLogsStatsResponseDto> {
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
          lte: new Date(query.end_date)
        };
      } else if (query.start_date) {
        where.createdAt = {
          gte: new Date(query.start_date)
        };
      } else if (query.end_date) {
        where.createdAt = {
          lte: new Date(query.end_date)
        };
      }

      // Get all project logs for statistics
      const projectLogs = await this.prisma.projectLog.findMany({
        where,
        include: {
          project: {
            select: {
              id: true
            }
          },
          developer: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          }
        }
      });

      // Calculate basic statistics
      const totalProjectLogs = projectLogs.length;
      const uniqueProjects = new Set(projectLogs.map(log => log.projectId)).size;
      const uniqueDevelopers = new Set(projectLogs.map(log => log.developerId)).size;
      const averageLogsPerProject = uniqueProjects > 0 ? totalProjectLogs / uniqueProjects : 0;
      const averageLogsPerDeveloper = uniqueDevelopers > 0 ? totalProjectLogs / uniqueDevelopers : 0;

      // Generate period statistics
      const periodStats = this.generateProjectLogsPeriodStatsHR(projectLogs, query.period || ProjectLogsStatsPeriod.MONTHLY);

      const response: ProjectLogsStatsResponseDto = {
        total_project_logs: totalProjectLogs,
        unique_projects: uniqueProjects,
        unique_developers: uniqueDevelopers,
        average_logs_per_project: Math.round(averageLogsPerProject * 100) / 100,
        average_logs_per_developer: Math.round(averageLogsPerDeveloper * 100) / 100,
        period_stats: periodStats
      };

      // Add breakdowns if requested
      if (query.include_breakdown) {
        response.developer_breakdown = this.generateProjectLogsDeveloperBreakdownHR(projectLogs);
        response.project_breakdown = this.generateProjectLogsProjectBreakdownHR(projectLogs);
      }

      return response;
    } catch (error) {
      console.error('Error in getProjectLogsStatsHR:', error);
      throw new InternalServerErrorException(`Failed to get project logs statistics: ${error.message}`);
    }
  }

  // Generate period statistics for project logs
  private generateProjectLogsPeriodStatsHR(projectLogs: any[], period: ProjectLogsStatsPeriod): any[] {
    const stats: any[] = [];
    const groupedLogs = this.groupProjectLogsByPeriodHR(projectLogs, period);

    Object.keys(groupedLogs).forEach(periodKey => {
      const logs = groupedLogs[periodKey];
      const totalProjectLogs = logs.length;
      const uniqueProjects = new Set(logs.map(log => log.projectId)).size;
      const uniqueDevelopers = new Set(logs.map(log => log.developerId)).size;

      stats.push({
        period: periodKey,
        total_project_logs: totalProjectLogs,
        unique_projects: uniqueProjects,
        unique_developers: uniqueDevelopers
      });
    });

    return stats.sort((a, b) => a.period.localeCompare(b.period));
  }

  // Group project logs by period
  private groupProjectLogsByPeriodHR(projectLogs: any[], period: ProjectLogsStatsPeriod): Record<string, any[]> {
    const grouped: Record<string, any[]> = {};

    projectLogs.forEach(log => {
      let periodKey: string;
      const date = new Date(log.createdAt);

      switch (period) {
        case ProjectLogsStatsPeriod.DAILY:
          periodKey = date.toISOString().split('T')[0];
          break;
        case ProjectLogsStatsPeriod.WEEKLY:
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          periodKey = `Week of ${weekStart.toISOString().split('T')[0]}`;
          break;
        case ProjectLogsStatsPeriod.MONTHLY:
          periodKey = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
          break;
        case ProjectLogsStatsPeriod.YEARLY:
          periodKey = date.getFullYear().toString();
          break;
        default:
          periodKey = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
      }

      if (!grouped[periodKey]) {
        grouped[periodKey] = [];
      }
      grouped[periodKey].push(log);
    });

    return grouped;
  }

  // Generate developer breakdown
  private generateProjectLogsDeveloperBreakdownHR(projectLogs: any[]): any[] {
    const developerMap = new Map<number, { logs: any[], developer: any }>();

    projectLogs.forEach(log => {
      if (!developerMap.has(log.developerId)) {
        developerMap.set(log.developerId, {
          logs: [],
          developer: log.developer
        });
      }
      developerMap.get(log.developerId)!.logs.push(log);
    });

    return Array.from(developerMap.entries()).map(([developerId, data]) => {
      const uniqueProjects = new Set(data.logs.map(log => log.projectId)).size;
      const totalProjectLogs = data.logs.length;
      const averageLogsPerProject = uniqueProjects > 0 ? totalProjectLogs / uniqueProjects : 0;

      return {
        developer_id: developerId,
        developer_name: `${data.developer.firstName} ${data.developer.lastName}`,
        total_project_logs: totalProjectLogs,
        unique_projects: uniqueProjects,
        average_logs_per_project: Math.round(averageLogsPerProject * 100) / 100
      };
    }).sort((a, b) => b.total_project_logs - a.total_project_logs);
  }

  // Generate project breakdown
  private generateProjectLogsProjectBreakdownHR(projectLogs: any[]): any[] {
    const projectMap = new Map<number, { logs: any[] }>();

    projectLogs.forEach(log => {
      if (!projectMap.has(log.projectId)) {
        projectMap.set(log.projectId, {
          logs: []
        });
      }
      projectMap.get(log.projectId)!.logs.push(log);
    });

    return Array.from(projectMap.entries()).map(([projectId, data]) => {
      const uniqueDevelopers = new Set(data.logs.map(log => log.developerId)).size;
      const totalProjectLogs = data.logs.length;
      const averageLogsPerDeveloper = uniqueDevelopers > 0 ? totalProjectLogs / uniqueDevelopers : 0;

      return {
        project_id: projectId,
        project_name: `Project ${projectId}`,
        total_project_logs: totalProjectLogs,
        unique_developers: uniqueDevelopers,
        average_logs_per_developer: Math.round(averageLogsPerDeveloper * 100) / 100
      };
    }).sort((a, b) => b.total_project_logs - a.total_project_logs);
  }
}

