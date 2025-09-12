import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { CreateProjectLogDto } from './dto/create-project-log.dto';
import { UpdateProjectLogDto } from './dto/update-project-log.dto';
import { ProjectLogQueryDto } from './dto/project-log-query.dto';
import { AutoLogService } from './auto-log.service';

@Injectable()
export class ProjectLogsService {
  constructor(
    private prisma: PrismaService,
    private autoLogService: AutoLogService
  ) {}

  // Helper method to normalize user object
  private normalizeUser(user: any) {
    if (!user) return null;
    
    // Map role names to numeric IDs for backward compatibility
    const roleMap: { [key: string]: number } = {
      'dep_manager': 1,
      'unit_head': 2,
      'team_lead': 3,
      'senior': 4,
      'junior': 4
    };
    
    return {
      ...user,
      roleId: roleMap[user.role] || user.roleId || user.role,
      role: user.role,
      id: user.id
    };
  }

  // Helper method to validate user is in Production department
  private async validateProductionDepartment(userId: number): Promise<boolean> {
    const employee = await this.prisma.employee.findUnique({
      where: { id: userId },
      include: { department: true }
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    if (employee.department.name !== 'Production') {
      throw new ForbiddenException('Only Production department employees can access project logs');
    }

    return true;
  }

  // Helper method to validate project access
  private async validateProjectAccess(projectId: number, user: any): Promise<boolean> {
    const normalizedUser = this.normalizeUser(user);
    
    // Validate user is in Production department
    await this.validateProductionDepartment(normalizedUser.id);

    // Validate project exists
    const project = await this.prisma.project.findUnique({
      where: { id: projectId }
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return true;
  }

  // Helper method to check if user can access project logs
  private async canAccessProjectLogs(user: any, projectId: number): Promise<boolean> {
    const normalizedUser = this.normalizeUser(user);
    
    // Department manager can access all project logs
    if (normalizedUser.role === 'dep_manager') {
      return true;
    }
    
    // Unit head can access logs in their unit's projects
    if (normalizedUser.role === 'unit_head') {
      const project = await this.prisma.project.findUnique({
        where: { id: projectId },
        include: { unitHead: true }
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
        developerId: normalizedUser.id
      }
    });
    
    return !!projectLog;
  }

  // Helper method to check if user can create/update logs
  private async canCreateOrUpdateLogs(user: any, projectId: number): Promise<boolean> {
    const normalizedUser = this.normalizeUser(user);
    
    // Managers and leads can create/update logs
    if (['dep_manager', 'unit_head', 'team_lead'].includes(normalizedUser.role)) {
      return true;
    }
    
    // Regular employees can create/update their own logs
    const projectLog = await this.prisma.projectLog.findFirst({
      where: {
        projectId: projectId,
        developerId: normalizedUser.id
      }
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
      const canCreate = await this.canCreateOrUpdateLogs(normalizedUser, projectId);
      if (!canCreate) {
        throw new ForbiddenException('You do not have permission to create logs for this project');
      }

      // Create the log entry
      const log = await this.prisma.projectLog.create({
        data: {
          projectId: projectId,
          developerId: normalizedUser.id
        },
        include: {
          project: {
            include: {
              client: true,
              salesRep: {
                include: { role: true }
              },
              unitHead: {
                include: { role: true }
              }
            }
          },
          developer: {
            include: {
              role: true,
              department: true
            }
          }
        }
      });

      return {
        success: true,
        message: 'Log entry created successfully',
        data: {
          ...log,
          logEntry: dto.logEntry,
          logType: dto.logType,
          additionalNotes: dto.additionalNotes
        }
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Failed to create log entry: ${error.message}`);
    }
  }

  // 2. Get Project Logs
  async getProjectLogs(projectId: number, user: any, query: ProjectLogQueryDto) {
    try {
      const normalizedUser = this.normalizeUser(user);
      
      // Validate project access
      await this.validateProjectAccess(projectId, normalizedUser);

      // Check if user can access project logs
      const canAccess = await this.canAccessProjectLogs(normalizedUser, projectId);
      if (!canAccess) {
        throw new ForbiddenException('You do not have permission to view logs for this project');
      }

      // Build where clause
      let whereClause: any = { projectId };

      // Apply query filters
      if (query.developerId) {
        whereClause.developerId = query.developerId;
      }

      if (query.startDate && query.endDate) {
        whereClause.createdAt = {
          gte: new Date(query.startDate),
          lte: new Date(query.endDate)
        };
      } else if (query.startDate) {
        whereClause.createdAt = {
          gte: new Date(query.startDate)
        };
      } else if (query.endDate) {
        whereClause.createdAt = {
          lte: new Date(query.endDate)
        };
      }

      // Build order by clause
      let orderBy: any = {};
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
                include: { role: true }
              },
              unitHead: {
                include: { role: true }
              }
            }
          },
          developer: {
            include: {
              role: true,
              department: true
            }
          }
        },
        orderBy: orderBy
      });

      return {
        success: true,
        data: logs,
        count: logs.length
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      throw new BadRequestException(`Failed to fetch project logs: ${error.message}`);
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
          projectId: projectId
        },
        include: {
          project: {
            include: {
              client: true,
              salesRep: {
                include: { role: true }
              },
              unitHead: {
                include: { role: true }
              }
            }
          },
          developer: {
            include: {
              role: true,
              department: true
            }
          }
        }
      });

      if (!log) {
        throw new NotFoundException('Log entry not found');
      }

      // Check if user has access to this log
      const canAccess = await this.canAccessProjectLogs(normalizedUser, projectId);
      if (!canAccess) {
        throw new ForbiddenException('Access denied to this log entry');
      }

      return {
        success: true,
        data: log
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      throw new BadRequestException(`Failed to fetch log entry: ${error.message}`);
    }
  }

  // 4. Update Log
  async updateLog(projectId: number, logId: number, dto: UpdateProjectLogDto, user: any) {
    try {
      const normalizedUser = this.normalizeUser(user);
      
      // Validate project access
      await this.validateProjectAccess(projectId, normalizedUser);

      const log = await this.prisma.projectLog.findFirst({
        where: {
          id: logId,
          projectId: projectId
        }
      });

      if (!log) {
        throw new NotFoundException('Log entry not found');
      }

      // Check if user can update this log
      const canUpdate = await this.canCreateOrUpdateLogs(normalizedUser, projectId);
      if (!canUpdate) {
        throw new ForbiddenException('You do not have permission to update this log entry');
      }

      // Regular employees can only update their own logs
      if (!['dep_manager', 'unit_head', 'team_lead'].includes(normalizedUser.role)) {
        if (log.developerId !== normalizedUser.id) {
          throw new ForbiddenException('You can only update your own log entries');
        }
      }

      const updatedLog = await this.prisma.projectLog.update({
        where: { id: logId },
        data: {
          updatedAt: new Date()
        },
        include: {
          project: {
            include: {
              client: true,
              salesRep: {
                include: { role: true }
              },
              unitHead: {
                include: { role: true }
              }
            }
          },
          developer: {
            include: {
              role: true,
              department: true
            }
          }
        }
      });

      return {
        success: true,
        message: 'Log entry updated successfully',
        data: {
          ...updatedLog,
          logEntry: dto.logEntry || 'Log entry updated',
          logType: dto.logType,
          additionalNotes: dto.additionalNotes
        }
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Failed to update log entry: ${error.message}`);
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
          projectId: projectId
        }
      });

      if (!log) {
        throw new NotFoundException('Log entry not found');
      }

      // Check if user can delete this log
      const canDelete = await this.canCreateOrUpdateLogs(normalizedUser, projectId);
      if (!canDelete) {
        throw new ForbiddenException('You do not have permission to delete this log entry');
      }

      // Regular employees can only delete their own logs
      if (!['dep_manager', 'unit_head', 'team_lead'].includes(normalizedUser.role)) {
        if (log.developerId !== normalizedUser.id) {
          throw new ForbiddenException('You can only delete your own log entries');
        }
      }

      await this.prisma.projectLog.delete({
        where: { id: logId }
      });

      return {
        success: true,
        message: 'Log entry deleted successfully'
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Failed to delete log entry: ${error.message}`);
    }
  }

  // 6. Get Project Employees
  async getProjectEmployees(projectId: number, user: any) {
    try {
      const normalizedUser = this.normalizeUser(user);
      
      // Validate project access
      await this.validateProjectAccess(projectId, normalizedUser);

      // Check if user can access project logs
      const canAccess = await this.canAccessProjectLogs(normalizedUser, projectId);
      if (!canAccess) {
        throw new ForbiddenException('You do not have permission to view project employees');
      }

      const employees = await this.autoLogService.getProjectEmployees(projectId);

      return {
        success: true,
        data: employees,
        count: employees.length
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      throw new BadRequestException(`Failed to fetch project employees: ${error.message}`);
    }
  }

  // 7. Get Log Statistics
  async getLogStatistics(projectId: number, user: any) {
    try {
      const normalizedUser = this.normalizeUser(user);
      
      // Validate project access
      await this.validateProjectAccess(projectId, normalizedUser);

      // Check if user can access project logs
      const canAccess = await this.canAccessProjectLogs(normalizedUser, projectId);
      if (!canAccess) {
        throw new ForbiddenException('You do not have permission to view log statistics for this project');
      }

      const totalLogs = await this.prisma.projectLog.count({
        where: { projectId }
      });

      const logsByDeveloper = await this.prisma.projectLog.groupBy({
        by: ['developerId'],
        where: { projectId },
        _count: {
          id: true
        }
      });

      const recentLogs = await this.prisma.projectLog.findMany({
        where: { projectId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          developer: {
            include: {
              role: true
            }
          }
        }
      });

      return {
        success: true,
        data: {
          totalLogs,
          logsByDeveloper: logsByDeveloper.map(item => ({
            developerId: item.developerId,
            logCount: item._count.id
          })),
          recentLogs
        }
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      throw new BadRequestException(`Failed to fetch log statistics: ${error.message}`);
    }
  }
}
