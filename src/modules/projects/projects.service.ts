import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateProjectFromPaymentDto } from './dto/create-project-from-payment.dto';
import { AssignUnitHeadDto } from './dto/assign-unit-head.dto';
import { UpdateProjectDetailsDto, ProjectStatus } from './dto/update-project-details.dto';
import { AssignTeamDto } from './dto/assign-team.dto';
import { ProjectQueryDto } from './dto/project-query.dto';
import { UnifiedUpdateProjectDto } from './dto/unified-update-project.dto';

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

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

  // 1. Create Project from Payment (Internal & External API)
  async createFromPayment(dto: CreateProjectFromPaymentDto, user?: any) {
    try {
      // For external calls, validate user permissions
      if (user) {
        const normalizedUser = this.normalizeUser(user);
        if (normalizedUser.roleId !== 1 && normalizedUser.roleId !== 2) {
          throw new ForbiddenException('Only managers and unit heads can create projects');
        }
      }

      // Validate cracked lead exists
      const crackedLead = await this.prisma.crackedLead.findUnique({
        where: { id: dto.crackedLeadId },
        include: { lead: true }
      });

      if (!crackedLead) {
        throw new NotFoundException('Cracked lead not found');
      }

      // Validate client exists
      const client = await this.prisma.client.findUnique({
        where: { id: dto.clientId }
      });

      if (!client) {
        throw new NotFoundException('Client not found');
      }

      // Validate sales rep exists
      const salesRep = await this.prisma.employee.findUnique({
        where: { id: dto.salesRepId }
      });

      if (!salesRep) {
        throw new NotFoundException('Sales representative not found');
      }

      // Check if project already exists for this cracked lead
      const existingProject = await this.prisma.project.findFirst({
        where: { crackedLeadId: dto.crackedLeadId }
      });

      if (existingProject) {
        throw new BadRequestException('Project already exists for this cracked lead');
      }

      // Create project with null status (pending_assignment) and initial payment stage
      const project = await this.prisma.project.create({
        data: {
          crackedLeadId: dto.crackedLeadId,
          clientId: dto.clientId,
          salesRepId: dto.salesRepId,
          status: null, // null represents pending_assignment
          description: `Project created from cracked lead ${dto.crackedLeadId}`,
          liveProgress: 0,
          paymentStage: 'initial' // Set payment stage to initial
        },
        include: {
          crackedLead: {
            include: { lead: true }
          },
          client: true,
          salesRep: {
            include: { role: true }
          }
        }
      });

      return {
        success: true,
        message: 'Project created successfully',
        data: project
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Failed to create project: ${error.message}`);
    }
  }

  // 2. Get Projects (Unified with multiple filtering options)
  async getProjects(user: any, query: ProjectQueryDto) {
    try {
      // Normalize user object
      const normalizedUser = this.normalizeUser(user);
      if (!normalizedUser || !normalizedUser.roleId) {
        throw new ForbiddenException('User authentication required');
      }

      let whereClause: any = {};

      // Handle different filter types
      if (query.filterBy === 'team' && query.teamId) {
        return await this.getProjectsByTeam(query.teamId, normalizedUser);
      } else if (query.filterBy === 'employee' && query.employeeId) {
        return await this.getProjectsByEmployee(query.employeeId, normalizedUser);
      } else if (query.filterBy === 'status' && query.status) {
        return await this.getProjectsByStatus(query.status, normalizedUser);
      }

      // Default role-based filtering for 'all' or no filterBy specified
      if (normalizedUser.roleId === 1) {
        // Manager - gets all projects (assigned and unassigned)
        // No additional filtering needed
      } else if (normalizedUser.roleId === 2) {
        // Unit Head - gets projects assigned to them
        whereClause.unitHeadId = normalizedUser.id;
      } else if (normalizedUser.roleId === 3 || normalizedUser.roleId === 4) {
        // Team Lead and Employee - gets projects assigned to their team
        const userEmployee = await this.prisma.employee.findUnique({
          where: { id: normalizedUser.id },
          select: { teamLeadId: true }
        });

        if (!userEmployee) {
          throw new ForbiddenException('User not found');
        }

        // Get team ID for the user
        const team = await this.prisma.team.findFirst({
          where: {
            OR: [
              { teamLeadId: user.id }, // User is team lead
              { teamLeadId: userEmployee.teamLeadId } // User is team member
            ]
          }
        });

        if (team) {
          whereClause.teamId = team.id;
        } else {
          // If user has no team, return empty result
          whereClause.teamId = -1;
        }
      }

      // Apply additional query filters
      if (query.status) {
        whereClause.status = query.status;
      }
      if (query.difficulty) {
        whereClause.difficultyLevel = query.difficulty;
      }
      if (query.teamId) {
        whereClause.teamId = query.teamId;
      }
      if (query.unitHeadId) {
        whereClause.unitHeadId = query.unitHeadId;
      }

      const projects = await this.prisma.project.findMany({
        where: whereClause,
        include: {
          crackedLead: {
            include: { lead: true }
          },
          client: true,
          salesRep: {
            include: { role: true }
          },
          unitHead: {
            include: { role: true }
          },
          team: {
            include: {
              teamLead: {
                include: { role: true }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      return {
        success: true,
        data: projects,
        count: projects.length
      };
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      throw new BadRequestException(`Failed to fetch projects: ${error.message}`);
    }
  }

  // 3. Get Project Details
  async getProjectById(id: number, user: any) {
    try {
      const project = await this.prisma.project.findUnique({
        where: { id },
        include: {
          crackedLead: {
            include: { lead: true }
          },
          client: true,
          salesRep: {
            include: { role: true }
          },
          unitHead: {
            include: { role: true }
          },
          team: {
            include: {
              teamLead: {
                include: { role: true }
              }
            }
          },
          projectTasks: {
            include: {
              assigner: {
                include: { role: true }
              },
              assignee: {
                include: { role: true }
              }
            }
          }
        }
      });

      if (!project) {
        throw new NotFoundException('Project not found');
      }

      // Check access permissions
      const hasAccess = await this.checkProjectAccess(user, project);
      if (!hasAccess) {
        throw new ForbiddenException('Access denied to this project');
      }

      return {
        success: true,
        data: project
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      throw new BadRequestException(`Failed to fetch project: ${error.message}`);
    }
  }

  // 4. Assign Unit Head (Manager Only)
  async assignUnitHead(id: number, dto: AssignUnitHeadDto, user: any) {
    try {
      // Verify user is manager
      if (user.roleId !== 1) {
        throw new ForbiddenException('Only managers can assign unit heads');
      }

      const project = await this.prisma.project.findUnique({
        where: { id }
      });

      if (!project) {
        throw new NotFoundException('Project not found');
      }

      // Validate unit head exists and has correct role
      const unitHead = await this.prisma.employee.findUnique({
        where: { id: dto.unitHeadId },
        include: { role: true }
      });

      if (!unitHead) {
        throw new NotFoundException('Unit head not found');
      }

      if (unitHead.roleId !== 2) {
        throw new BadRequestException('Assigned user is not a unit head');
      }

      // Update project
      const updatedProject = await this.prisma.project.update({
        where: { id },
        data: {
          unitHeadId: dto.unitHeadId,
          deadline: new Date(dto.deadline),
          status: 'in_progress'
        },
        include: {
          unitHead: {
            include: { role: true }
          },
          client: true,
          salesRep: {
            include: { role: true }
          }
        }
      });

      return {
        success: true,
        message: 'Unit head assigned successfully',
        data: updatedProject
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Failed to assign unit head: ${error.message}`);
    }
  }

  // 5. Unified Update Project (Role-based permissions)
  async updateProject(id: number, dto: UnifiedUpdateProjectDto, user: any) {
    try {
      const project = await this.prisma.project.findUnique({
        where: { id },
        include: { unitHead: true, team: true }
      });

      if (!project) {
        throw new NotFoundException('Project not found');
      }

      // Check permissions based on role
      const canUpdate = await this.checkUnifiedUpdatePermission(user, project, dto);
      if (!canUpdate.allowed) {
        throw new ForbiddenException(canUpdate.reason);
      }

      // If status is being updated, validate status transition
      if (dto.status !== undefined) {
        const isValidTransition = this.validateStatusTransition(project.status, dto.status);
        if (!isValidTransition) {
          const currentStatusDisplay = project.status || 'pending_assignment';
          throw new BadRequestException(`Invalid status transition from ${currentStatusDisplay} to ${dto.status}`);
        }

        // Special validation for completed status
        if (dto.status === 'completed') {
          if (project.paymentStage !== 'final') {
            throw new BadRequestException('Project can only be marked as completed when payment stage is final');
          }
        }
      }

      // If team is being assigned, validate prerequisites
      if (dto.teamId !== undefined) {
        const teamValidation = await this.validateTeamAssignment(project, dto.teamId);
        if (!teamValidation.valid) {
          throw new BadRequestException(teamValidation.reason);
        }
      }

      // Prepare update data
      const updateData: any = {};
      
      if (dto.description !== undefined) updateData.description = dto.description;
      if (dto.difficulty !== undefined) updateData.difficultyLevel = dto.difficulty;
      if (dto.paymentStage !== undefined) updateData.paymentStage = dto.paymentStage;
      if (dto.liveProgress !== undefined) updateData.liveProgress = dto.liveProgress;
      if (dto.deadline !== undefined) updateData.deadline = new Date(dto.deadline);
      if (dto.status !== undefined) updateData.status = dto.status;
      if (dto.teamId !== undefined) {
        updateData.teamId = dto.teamId;
        // If team is assigned and status is not set, automatically set to in_progress
        if (dto.status === undefined && !project.status) {
          updateData.status = 'in_progress';
        }
      }

      // Auto-update logic when status is set to completed
      if (dto.status === 'completed') {
        updateData.paymentStage = 'approved';
        updateData.liveProgress = 100;
        console.log(`Project ${id} marked as completed - auto-updating payment stage to 'approved' and live progress to 100%`);
      }

      const updatedProject = await this.prisma.project.update({
        where: { id },
        data: updateData,
        include: {
          unitHead: {
            include: { role: true }
          },
          team: {
            include: {
              teamLead: {
                include: { role: true }
              }
            }
          },
          client: true,
          salesRep: {
            include: { role: true }
          }
        }
      });

      // Prepare success message
      let message = 'Project updated successfully';
      if (dto.status === 'completed') {
        message = 'Project marked as completed - payment stage set to approved and live progress set to 100%';
      }

      return {
        success: true,
        message: message,
        data: updatedProject
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Failed to update project: ${error.message}`);
    }
  }

  // 6. Get Projects by Team ID
  async getProjectsByTeam(teamId: number, user: any) {
    try {
      // Validate team exists
      const team = await this.prisma.team.findUnique({
        where: { id: teamId }
      });

      if (!team) {
        throw new NotFoundException('Team not found');
      }

      // Check if user has access to this team's projects
      const hasAccess = await this.checkTeamAccess(user, teamId);
      if (!hasAccess) {
        throw new ForbiddenException('Access denied to team projects');
      }

      const projects = await this.prisma.project.findMany({
        where: { teamId },
        include: {
          crackedLead: {
            include: { lead: true }
          },
          client: true,
          salesRep: {
            include: { role: true }
          },
          unitHead: {
            include: { role: true }
          },
          team: {
            include: {
              teamLead: {
                include: { role: true }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      return {
        success: true,
        data: projects,
        count: projects.length
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      throw new BadRequestException(`Failed to fetch team projects: ${error.message}`);
    }
  }

  // 7. Get Projects by Employee ID
  async getProjectsByEmployee(employeeId: number, user: any) {
    try {
      // Validate employee exists
      const employee = await this.prisma.employee.findUnique({
        where: { id: employeeId },
        include: { role: true }
      });

      if (!employee) {
        throw new NotFoundException('Employee not found');
      }

      // Check if user has permission to view this employee's projects
      const hasPermission = await this.checkEmployeeProjectAccess(user, employeeId);
      if (!hasPermission) {
        throw new ForbiddenException('Access denied to employee projects');
      }

      let whereClause: any = {};

      // If requesting user is a manager, they can see all projects
      if (user.roleId === 1) {
        // Manager can see all projects (assigned and unassigned)
        // No additional filtering needed
      } else {
        // For other roles, filter based on assignment
        if (employee.roleId === 2) {
          // Unit Head - get projects assigned to them
          whereClause.unitHeadId = employeeId;
        } else if (employee.roleId === 3) {
          // Team Lead - get projects assigned to their team
          const team = await this.prisma.team.findFirst({
            where: { teamLeadId: employeeId }
          });
          if (team) {
            whereClause.teamId = team.id;
          } else {
            whereClause.teamId = -1; // No team, return empty
          }
        } else {
          // Employee - get projects assigned to their team
          const userTeam = await this.prisma.team.findFirst({
            where: {
              OR: [
                { teamLeadId: employeeId },
                { 
                  teamLead: {
                    teamMembers: {
                      some: { id: employeeId }
                    }
                  }
                }
              ]
            }
          });
          if (userTeam) {
            whereClause.teamId = userTeam.id;
          } else {
            whereClause.teamId = -1; // No team, return empty
          }
        }
      }

      const projects = await this.prisma.project.findMany({
        where: whereClause,
        include: {
          crackedLead: {
            include: { lead: true }
          },
          client: true,
          salesRep: {
            include: { role: true }
          },
          unitHead: {
            include: { role: true }
          },
          team: {
            include: {
              teamLead: {
                include: { role: true }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      return {
        success: true,
        data: projects,
        count: projects.length
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      throw new BadRequestException(`Failed to fetch employee projects: ${error.message}`);
    }
  }

  // 8. Get Projects by Status (Dept Manager, Unit Head, Team Lead only)
  async getProjectsByStatus(status: string, user: any) {
    try {
      // Validate status
      const validStatuses = ['pending_assignment', 'in_progress', 'onhold', 'completed'];
      if (!validStatuses.includes(status)) {
        throw new BadRequestException('Invalid status provided');
      }

      let whereClause: any = { status };

      // Apply role-based filtering
      if (user.roleId === 1) {
        // Manager - gets all projects with this status
        // No additional filtering needed
      } else if (user.roleId === 2) {
        // Unit Head - gets projects assigned to them with this status
        whereClause.unitHeadId = user.id;
      } else if (user.roleId === 3) {
        // Team Lead - gets projects assigned to their team with this status
        const team = await this.prisma.team.findFirst({
          where: { teamLeadId: user.id }
        });
        if (team) {
          whereClause.teamId = team.id;
        } else {
          whereClause.teamId = -1; // No team, return empty
        }
      }

      const projects = await this.prisma.project.findMany({
        where: whereClause,
        include: {
          crackedLead: {
            include: { lead: true }
          },
          client: true,
          salesRep: {
            include: { role: true }
          },
          unitHead: {
            include: { role: true }
          },
          team: {
            include: {
              teamLead: {
                include: { role: true }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      return {
        success: true,
        data: projects,
        count: projects.length
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Failed to fetch projects by status: ${error.message}`);
    }
  }


  // Helper Methods
  private async checkProjectAccess(user: any, project: any): Promise<boolean> {
    // Manager (Role 1) - Access to all projects
    if (user.roleId === 1) {
      return true;
    }

    // Unit Head (Role 2) - Access to assigned projects
    if (user.roleId === 2) {
      return project.unitHeadId === user.id;
    }

    // Team Lead (Role 3) and Employee - Access to team projects
    if (user.roleId === 3 || user.roleId === 4) {
      if (!project.teamId) {
        return false;
      }

      const userEmployee = await this.prisma.employee.findUnique({
        where: { id: user.id },
        select: { teamLeadId: true }
      });

      if (!userEmployee) {
        return false;
      }

      // For team lead, check if they lead the assigned team
      if (user.roleId === 3) {
        return project.team?.teamLeadId === user.id;
      }

      // For employee, check if they are in the assigned team
      return userEmployee.teamLeadId === project.team?.teamLeadId;
    }

    return false;
  }

  private async checkUpdatePermission(user: any, project: any): Promise<boolean> {
    // Manager (Role 1) - Can update all projects
    if (user.roleId === 1) {
      return true;
    }

    // Unit Head (Role 2) - Can update assigned projects
    if (user.roleId === 2) {
      return project.unitHeadId === user.id;
    }

    return false;
  }


  private validateStatusTransition(currentStatus: string | null, newStatus: ProjectStatus): boolean {
    // Convert null to 'pending_assignment' for validation
    const status = currentStatus || 'pending_assignment';
    
    const validTransitions: { [key: string]: ProjectStatus[] } = {
      'pending_assignment': [ProjectStatus.IN_PROGRESS],
      'in_progress': [ProjectStatus.ONHOLD, ProjectStatus.COMPLETED],
      'onhold': [ProjectStatus.IN_PROGRESS, ProjectStatus.COMPLETED],
      'completed': [] // Terminal state
    };

    return validTransitions[status]?.includes(newStatus) || false;
  }

  private async checkUnifiedUpdatePermission(user: any, project: any, dto: UnifiedUpdateProjectDto): Promise<{ allowed: boolean; reason?: string }> {
    // Manager (Role 1) - Can update all fields
    if (user.roleId === 1) {
      return { allowed: true };
    }

    // Unit Head (Role 2) - Can update status, difficulty, deadline, liveProgress, teamId
    if (user.roleId === 2) {
      if (project.unitHeadId !== user.id) {
        return { allowed: false, reason: 'Only assigned unit head can update this project' };
      }
      
      // Check if trying to update restricted fields
      const restrictedFields = ['description', 'paymentStage'];
      for (const field of restrictedFields) {
        if (dto[field] !== undefined) {
          return { allowed: false, reason: `Unit heads cannot update ${field}` };
        }
      }
      
      return { allowed: true };
    }

    // Team Lead (Role 3) - Can only update liveProgress
    if (user.roleId === 3) {
      if (!project.teamId) {
        return { allowed: false, reason: 'Project not assigned to a team' };
      }
      
      // Check if user is the team lead of the assigned team
      const team = await this.prisma.team.findUnique({
        where: { id: project.teamId }
      });
      
      if (!team || team.teamLeadId !== user.id) {
        return { allowed: false, reason: 'Only the team lead can update this project' };
      }
      
      // Check if only updating liveProgress
      const allowedFields = ['liveProgress'];
      for (const [key, value] of Object.entries(dto)) {
        if (value !== undefined && !allowedFields.includes(key)) {
          return { allowed: false, reason: 'Team leads can only update liveProgress' };
        }
      }
      
      return { allowed: true };
    }

    return { allowed: false, reason: 'Insufficient permissions' };
  }

  private async validateTeamAssignment(project: any, teamId: number): Promise<{ valid: boolean; reason?: string }> {
    // Check if deadline is set and is in the future
    if (!project.deadline) {
      return { valid: false, reason: 'Deadline must be set before assigning team' };
    }
    
    const deadline = new Date(project.deadline);
    const now = new Date();
    if (deadline <= now) {
      return { valid: false, reason: 'Deadline must be in the future' };
    }
    
    // Check if difficulty level is set
    if (!project.difficultyLevel) {
      return { valid: false, reason: 'Difficulty level must be set before assigning team' };
    }
    
    // Validate team exists
    const team = await this.prisma.team.findUnique({
      where: { id: teamId }
    });
    
    if (!team) {
      return { valid: false, reason: 'Team not found' };
    }
    
    return { valid: true };
  }

  private async checkTeamAccess(user: any, teamId: number): Promise<boolean> {
    // Manager (Role 1) - Access to all teams
    if (user.roleId === 1) {
      return true;
    }

    // Unit Head (Role 2) - Access to teams in their unit
    if (user.roleId === 2) {
      // For now, allow access - can be enhanced with unit-based filtering
      return true;
    }

    // Team Lead (Role 3) - Access to their own team
    if (user.roleId === 3) {
      const team = await this.prisma.team.findUnique({
        where: { id: teamId }
      });
      return team?.teamLeadId === user.id;
    }

    // Employee (Role 4) - Access to their team
    if (user.roleId === 4) {
      const userEmployee = await this.prisma.employee.findUnique({
        where: { id: user.id },
        select: { teamLeadId: true }
      });

      if (!userEmployee?.teamLeadId) {
        return false;
      }

      const team = await this.prisma.team.findUnique({
        where: { id: teamId }
      });
      
      return team?.teamLeadId === userEmployee.teamLeadId;
    }

    return false;
  }

  private async checkEmployeeProjectAccess(user: any, employeeId: number): Promise<boolean> {
    // Manager (Role 1) - Can view any employee's projects
    if (user.roleId === 1) {
      return true;
    }

    // Unit Head (Role 2) - Can view projects of employees in their unit
    if (user.roleId === 2) {
      // For now, allow access - can be enhanced with unit-based filtering
      return true;
    }

    // Team Lead (Role 3) - Can view projects of their team members
    if (user.roleId === 3) {
      const team = await this.prisma.team.findFirst({
        where: { teamLeadId: user.id }
      });

      if (!team) {
        return false;
      }

      // Check if the employee is in this team
      const employee = await this.prisma.employee.findUnique({
        where: { id: employeeId },
        select: { teamLeadId: true }
      });

      return employee?.teamLeadId === user.id;
    }

    // Employee (Role 4) - Can only view their own projects
    if (user.roleId === 4) {
      return user.id === employeeId;
    }

    return false;
  }
}
