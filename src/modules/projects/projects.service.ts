import { Injectable, BadRequestException, NotFoundException, ForbiddenException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateProjectFromPaymentDto } from './dto/create-project-from-payment.dto';
import { AssignUnitHeadDto } from './dto/assign-unit-head.dto';
import { UpdateProjectDetailsDto, ProjectStatus } from './dto/update-project-details.dto';
import { AssignProjectTeamDto } from './dto/assign-team.dto';
import { ProjectQueryDto } from './dto/project-query.dto';
import { UnifiedUpdateProjectDto } from './dto/unified-update-project.dto';
import { AutoLogService } from './Projects-Logs/auto-log.service';

@Injectable()
export class ProjectsService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => AutoLogService))
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
        select: {
          // Core project fields only
          id: true,
          status: true,
          difficultyLevel: true,
          paymentStage: true,
          deadline: true,
          liveProgress: true,
          description: true,
          createdAt: true,
          updatedAt: true,
          // Minimal related data
          salesRep: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          unitHead: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          team: {
            select: {
              id: true,
              name: true,
              teamLead: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true
                }
              }
            }
          }
        }
      });

      // Automatically create project chat with HR and Production managers as owners
      await this.createProjectChatWithDefaultOwners(project.id);

      // Note: Manager ID is not added to project logs during project creation
      // Only unit heads and team members are tracked in project logs

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

      // Pagination
      const skip = query.page ? (query.page - 1) * (query.limit || 10) : 0;
      const take = query.limit || 10;

      // Sorting
      const orderBy: any = {};
      if (query.sortBy) {
        orderBy[query.sortBy] = query.sortOrder || 'desc';
      } else {
        orderBy['createdAt'] = 'desc';
      }

      // Fetch projects and total count (minimal data for list view)
      const [projects, total] = await Promise.all([
        this.prisma.project.findMany({
          where: whereClause,
          select: {
            // Core project fields only
            id: true,
            status: true,
            difficultyLevel: true,
            paymentStage: true,
            deadline: true,
            liveProgress: true,
            createdAt: true,
            updatedAt: true,
            // Minimal related data (just names/IDs)
            salesRep: {
              select: {
                id: true,
                firstName: true,
                lastName: true
              }
            },
            unitHead: {
              select: {
                id: true,
                firstName: true,
                lastName: true
              }
            },
            team: {
              select: {
                id: true,
                name: true,
                teamLead: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true
                  }
                }
              }
            }
          },
          orderBy,
          skip,
          take
        }),
        this.prisma.project.count({ where: whereClause })
      ]);

      // Calculate counts for each project
      const projectsWithCounts = await Promise.all(
        projects.map(async (project) => {
          const [
            tasksCount,
            logsCount,
            chatParticipantsCount,
            teamMembersCount
          ] = await Promise.all([
            // Tasks count
            this.prisma.projectTask.count({
              where: { projectId: project.id }
            }),
            // Logs count
            this.prisma.projectLog.count({
              where: { projectId: project.id }
            }),
            // Chat participants count
            this.prisma.chatParticipant.count({
              where: {
                chat: {
                  projectId: project.id
                }
              }
            }).catch(() => 0),
            // Team members count (if team assigned)
            project.team?.teamLead?.id ? (() => {
              const teamLeadId = project.team.teamLead.id;
              return this.prisma.employee.count({
                where: {
                  OR: [
                    { id: teamLeadId },
                    { teamLeadId: teamLeadId }
                  ]
                }
              });
            })() : Promise.resolve(0)
          ]);

          return {
            ...project,
            tasksCount,
            logsCount,
            chatParticipantsCount,
            teamMembersCount
          };
        })
      );

      return {
        success: true,
        data: projectsWithCounts,
        total,
        pagination: {
          page: query.page || 1,
          limit: query.limit || 10,
          totalPages: Math.ceil(total / (query.limit || 10))
        },
        message: projectsWithCounts.length > 0 ? 'Projects retrieved successfully' : 'No projects found'
      };
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      throw new BadRequestException(`Failed to fetch projects: ${error.message}`);
    }
  }

  // 3. Get Project Details (Full Details with All Relations)
  async getProjectById(id: number, user: any) {
    try {
      // Normalize user object
      const normalizedUser = this.normalizeUser(user);
      if (!normalizedUser || !normalizedUser.roleId) {
        throw new ForbiddenException('User authentication required');
      }

      const project = await this.prisma.project.findUnique({
        where: { id },
        include: {
          salesRep: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          unitHead: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          team: {
            include: {
              teamLead: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true
                }
              },
              productionUnit: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          },
        }
      });

      if (!project) {
        throw new NotFoundException('Project not found');
      }

      // Check access permissions
      const hasAccess = await this.checkProjectAccess(normalizedUser, project);
      if (!hasAccess) {
        throw new ForbiddenException('Access denied to this project');
      }

      // Get all employees related to this project
      const [
        projectLogsEmployees,
        teamMembers
      ] = await Promise.all([
        // Employees from project logs (get unique developers)
        this.prisma.projectLog.findMany({
          where: { projectId: id },
          select: {
            developerId: true,
            developer: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                role: {
                  select: {
                    id: true,
                    name: true,
                    description: true
                  }
                },
                department: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              }
            }
          },
          distinct: ['developerId']
        }),
        // Team members (if team assigned)
        project.teamId && project.team?.teamLeadId ? (() => {
          const teamLeadId = project.team.teamLeadId;
          return this.prisma.employee.findMany({
            where: {
              OR: [
                { id: teamLeadId },
                { teamLeadId: teamLeadId }
              ]
            },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            role: {
              select: {
                id: true,
                name: true,
                description: true
              }
            },
            department: {
              select: {
                id: true,
                name: true
              }
            }
          }
          });
        })() : Promise.resolve([])
      ]);

      // Extract unique employees from logs
      const logsEmployees = projectLogsEmployees
        .map(log => log.developer)
        .filter((emp, index, self) => emp && index === self.findIndex(e => e?.id === emp.id));

      // Combine all employees and get unique list
      const allEmployeesMap = new Map();
      
      // Add sales rep
      if (project.salesRep) {
        allEmployeesMap.set(project.salesRep.id, project.salesRep);
      }
      
      // Add unit head
      if (project.unitHead) {
        allEmployeesMap.set(project.unitHead.id, project.unitHead);
      }
      
      // Add team lead
      if (project.team?.teamLead) {
        allEmployeesMap.set(project.team.teamLead.id, project.team.teamLead);
      }
      
      // Add team members
      if (Array.isArray(teamMembers)) {
        teamMembers.forEach((emp: any) => {
          if (emp && emp.id) {
            allEmployeesMap.set(emp.id, emp);
          }
        });
      }
      
      // Add employees from logs
      logsEmployees.forEach(emp => {
        if (emp) {
          allEmployeesMap.set(emp.id, emp);
        }
      });

      const allRelatedEmployeesList = Array.from(allEmployeesMap.values());

      // Calculate counts
      const [
        tasksCount,
        logsCount,
        chatParticipantsCount,
        teamMembersCount
      ] = await Promise.all([
        this.prisma.projectTask.count({ where: { projectId: id } }),
        this.prisma.projectLog.count({ where: { projectId: id } }),
        this.prisma.chatParticipant.count({
          where: {
            chat: { projectId: id }
          }
        }),
        project.teamId && project.team?.teamLeadId ? (() => {
          const teamLeadId = project.team.teamLeadId;
          return this.prisma.employee.count({
            where: {
              OR: [
                { id: teamLeadId },
                { teamLeadId: teamLeadId }
              ]
            }
          });
        })() : Promise.resolve(0)
      ]);

      return {
        success: true,
        data: {
          ...project,
          // All related employees
          relatedEmployees: allRelatedEmployeesList,
          // Calculated counts
          tasksCount,
          logsCount,
          chatParticipantsCount,
          teamMembersCount
        }
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
      if (user.role !== 'dep_manager') {
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

      if (unitHead.role?.name !== 'unit_head') {
        throw new BadRequestException('Assigned user is not a unit head');
      }

      // Update project
      const updatedProject = await this.prisma.project.update({
        where: { id },
        data: {
          unitHeadId: dto.unitHeadId,
          status: 'in_progress'
        },
        select: {
          // Core project fields only
          id: true,
          status: true,
          difficultyLevel: true,
          paymentStage: true,
          deadline: true,
          liveProgress: true,
          description: true,
          createdAt: true,
          updatedAt: true,
          // Minimal related data
          salesRep: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          unitHead: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          team: {
            select: {
              id: true,
              name: true,
              teamLead: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true
                }
              }
            }
          }
        }
      });

      // Add unit head as owner to project chat
      await this.addUnitHeadToProjectChat(id, dto.unitHeadId);

      // Add unit head to project logs
      const normalizedUser = this.normalizeUser(user);
      await this.autoLogService.addEmployeeToProject(id, dto.unitHeadId);

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

      // Prepare update data (excluding teamId for now)
      const updateData: any = {};
      
      if (dto.description !== undefined) updateData.description = dto.description;
      if (dto.difficulty !== undefined) updateData.difficultyLevel = dto.difficulty;
      if (dto.paymentStage !== undefined) updateData.paymentStage = dto.paymentStage;
      if (dto.liveProgress !== undefined) updateData.liveProgress = dto.liveProgress;
      if (dto.deadline !== undefined) updateData.deadline = new Date(dto.deadline);
      if (dto.status !== undefined) updateData.status = dto.status;

      // Auto-update logic when status is set to completed
      if (dto.status === 'completed') {
        updateData.paymentStage = 'approved';
        updateData.liveProgress = 100;
        console.log(`Project ${id} marked as completed - auto-updating payment stage to 'approved' and live progress to 100%`);
      }

      // First, update the project with all fields except teamId
      const updatedProject = await this.prisma.project.update({
        where: { id },
        data: updateData,
        select: {
          // Core project fields only
          id: true,
          status: true,
          difficultyLevel: true,
          paymentStage: true,
          deadline: true,
          liveProgress: true,
          description: true,
          createdAt: true,
          updatedAt: true,
          // Minimal related data
          salesRep: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          unitHead: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          team: {
            select: {
              id: true,
              name: true,
              teamLead: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true
                }
              }
            }
          }
        }
      });

      // Handle team assignment separately
      if (dto.teamId !== undefined) {
        // Check if project already has deadline and difficulty set
        const hasDeadline = updatedProject.deadline !== null;
        const hasDifficulty = updatedProject.difficultyLevel !== null;

        // If either deadline or difficulty is missing from project, require both in request
        if (!hasDeadline || !hasDifficulty) {
          if (!dto.deadline || !dto.difficulty) {
            throw new BadRequestException('Deadline and difficulty must be provided in order to assign team');
          }
        }

        // Use deadline from request if provided, otherwise use existing project deadline
        const deadlineToUse = dto.deadline || updatedProject.deadline?.toISOString();

        // Validate team assignment prerequisites
        const teamValidation = await this.validateTeamAssignment(updatedProject, dto.teamId, deadlineToUse);
        if (!teamValidation.valid) {
          throw new BadRequestException(teamValidation.reason);
        }

        // Update team's current_project_id
        await this.prisma.team.update({
          where: { id: dto.teamId },
          data: { currentProjectId: id }
        });

        // Add all team members to project chat as participants
        await this.addTeamMembersToProjectChat(id, dto.teamId);

        // Add all team members to project logs
        await this.addTeamMembersToProjectLogs(id, dto.teamId);

        // Update project's teamId and status if needed
        const finalUpdateData: any = { teamId: dto.teamId };
        if (dto.status === undefined && !updatedProject.status) {
          finalUpdateData.status = 'in_progress';
        }

        const finalUpdatedProject = await this.prisma.project.update({
          where: { id },
          data: finalUpdateData,
          select: {
            // Core project fields only
            id: true,
            status: true,
            difficultyLevel: true,
            paymentStage: true,
            deadline: true,
            liveProgress: true,
            description: true,
            createdAt: true,
            updatedAt: true,
            // Minimal related data
            salesRep: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            },
            unitHead: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            },
            team: {
              select: {
                id: true,
                name: true,
                teamLead: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true
                  }
                }
              }
            }
          }
        });

        return {
          success: true,
          message: 'Project updated and team assigned successfully',
          data: finalUpdatedProject
        };
      }

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
        select: {
          // Core project fields only
          id: true,
          status: true,
          difficultyLevel: true,
          paymentStage: true,
          deadline: true,
          liveProgress: true,
          createdAt: true,
          updatedAt: true,
          // Minimal related data
          salesRep: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          },
          unitHead: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          },
          team: {
            select: {
              id: true,
              name: true,
              teamLead: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true
                }
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
        select: {
          // Core project fields only
          id: true,
          status: true,
          difficultyLevel: true,
          paymentStage: true,
          deadline: true,
          liveProgress: true,
          createdAt: true,
          updatedAt: true,
          // Minimal related data
          salesRep: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          },
          unitHead: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          },
          team: {
            select: {
              id: true,
              name: true,
              teamLead: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true
                }
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
        select: {
          // Core project fields only
          id: true,
          status: true,
          difficultyLevel: true,
          paymentStage: true,
          deadline: true,
          liveProgress: true,
          createdAt: true,
          updatedAt: true,
          // Minimal related data
          salesRep: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          },
          unitHead: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          },
          team: {
            select: {
              id: true,
              name: true,
              teamLead: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true
                }
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
    // Normalize user if not already normalized (defensive check)
    const normalizedUser = this.normalizeUser(user) || user;
    
    // Manager (Role 1 or 'dep_manager') - Access to all projects
    if (normalizedUser.roleId === 1 || normalizedUser.role === 'dep_manager') {
      return true;
    }

    // Unit Head (Role 2 or 'unit_head') - Access to assigned projects
    if (normalizedUser.roleId === 2 || normalizedUser.role === 'unit_head') {
      return project.unitHeadId === normalizedUser.id;
    }

    // Team Lead (Role 3 or 'team_lead') and Employee - Access to team projects
    if ((normalizedUser.roleId === 3 || normalizedUser.roleId === 4) || 
        (normalizedUser.role === 'team_lead' || normalizedUser.role === 'senior' || normalizedUser.role === 'junior')) {
      if (!project.teamId) {
        return false;
      }

      const userEmployee = await this.prisma.employee.findUnique({
        where: { id: normalizedUser.id },
        select: { teamLeadId: true }
      });

      if (!userEmployee) {
        return false;
      }

      // For team lead, check if they lead the assigned team
      if (normalizedUser.roleId === 3 || normalizedUser.role === 'team_lead') {
        return project.team?.teamLeadId === normalizedUser.id;
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
    // Manager (dep_manager) - Can update all fields
    if (user.role === 'dep_manager') {
      return { allowed: true };
    }

    // Unit Head (unit_head) - Can update status, difficulty, deadline, teamId
    // liveProgress is now automatic (cannot be manually updated)
    if (user.role === 'unit_head') {
      if (project.unitHeadId !== user.id) {
        return { allowed: false, reason: 'Only assigned unit head can update this project' };
      }
      
      // Check if trying to update restricted fields
      const restrictedFields = ['description', 'paymentStage', 'liveProgress'];
      for (const field of restrictedFields) {
        if (dto[field] !== undefined) {
          return { allowed: false, reason: `Unit heads cannot update ${field}. Live progress is automatically updated based on payment phases.` };
        }
      }
      
      return { allowed: true };
    }

    // Team Lead (team_lead) - Read-only access (liveProgress is automatic)
    if (user.role === 'team_lead') {
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
      
      // Team leads have read-only access - liveProgress is automatically updated based on payment phases
      if (Object.keys(dto).some(key => dto[key] !== undefined)) {
        return { allowed: false, reason: 'Team leads have read-only access. Live progress is automatically updated when payment phases are completed.' };
      }
      
      return { allowed: false, reason: 'Team leads have read-only access' };
    }

    return { allowed: false, reason: 'Insufficient permissions' };
  }

  private async validateTeamAssignment(project: any, teamId: number, deadline?: string): Promise<{ valid: boolean; reason?: string }> {
    // Check if deadline is provided when assigning team
    if (!deadline) {
      return { valid: false, reason: 'Deadline must be provided when assigning team' };
    }
    
    const deadlineDate = new Date(deadline);
    const now = new Date();
    if (deadlineDate <= now) {
      return { valid: false, reason: 'Deadline must be in the future' };
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

  // Helper method to create project chat with HR, Production, Sales managers and Sales Rep as initial participants
  private async createProjectChatWithDefaultOwners(projectId: number) {
    try {
      // Get the project to access salesRepId
      const project = await this.prisma.project.findUnique({
        where: { id: projectId },
        select: { salesRepId: true }
      });

      if (!project || !project.salesRepId) {
        throw new BadRequestException('Project or Sales Representative not found. Cannot create project chat.');
      }

      // Find HR manager (dep_manager role in HR department)
      const hrManager = await this.prisma.employee.findFirst({
        where: {
          role: { name: 'dep_manager' },
          department: { name: 'HR' }
        }
      });

      // Find Production manager (dep_manager role in Production department)
      const productionManager = await this.prisma.employee.findFirst({
        where: {
          role: { name: 'dep_manager' },
          department: { name: 'Production' }
        }
      });

      // Find Sales manager (dep_manager role in Sales department)
      const salesManager = await this.prisma.employee.findFirst({
        where: {
          role: { name: 'dep_manager' },
          department: { name: 'Sales' }
        }
      });

      // Get Sales Representative
      const salesRep = await this.prisma.employee.findUnique({
        where: { id: project.salesRepId }
      });

      if (!hrManager || !productionManager || !salesManager || !salesRep) {
        throw new BadRequestException('HR Manager, Production Manager, Sales Manager, or Sales Representative not found. Cannot create project chat.');
      }

      // Create project chat
      const projectChat = await this.prisma.projectChat.create({
        data: {
          projectId: projectId,
          participants: 4 // Initially 4 participants (HR, Production, Sales managers + Sales Rep)
        }
      });

      // Add HR manager as owner
      await this.prisma.chatParticipant.create({
        data: {
          chatId: projectChat.id,
          employeeId: hrManager.id,
          memberType: 'owner'
        }
      });

      // Add Production manager as owner
      await this.prisma.chatParticipant.create({
        data: {
          chatId: projectChat.id,
          employeeId: productionManager.id,
          memberType: 'owner'
        }
      });

      // Add Sales manager as owner
      await this.prisma.chatParticipant.create({
        data: {
          chatId: projectChat.id,
          employeeId: salesManager.id,
          memberType: 'owner'
        }
      });

      // Add Sales Representative as participant
      await this.prisma.chatParticipant.create({
        data: {
          chatId: projectChat.id,
          employeeId: salesRep.id,
          memberType: 'participant'
        }
      });

      console.log(`Project chat created for project ${projectId} with HR manager (${hrManager.id}), Production manager (${productionManager.id}), Sales manager (${salesManager.id}) as owners and Sales Rep (${salesRep.id}) as participant`);
    } catch (error) {
      console.error(`Failed to create project chat for project ${projectId}:`, error);
      throw new BadRequestException(`Failed to create project chat: ${error.message}`);
    }
  }

  // Helper method to add unit head as owner to project chat
  private async addUnitHeadToProjectChat(projectId: number, unitHeadId: number) {
    try {
      // Find the project chat
      const projectChat = await this.prisma.projectChat.findFirst({
        where: { projectId: projectId }
      });

      if (!projectChat) {
        throw new BadRequestException(`Project chat not found for project ${projectId}`);
      }

      // Check if unit head is already a participant
      const existingParticipant = await this.prisma.chatParticipant.findFirst({
        where: {
          chatId: projectChat.id,
          employeeId: unitHeadId
        }
      });

      if (existingParticipant) {
        // Update existing participant to owner
        await this.prisma.chatParticipant.update({
          where: { id: existingParticipant.id },
          data: { memberType: 'owner' }
        });
      } else {
        // Add unit head as owner
        await this.prisma.chatParticipant.create({
          data: {
            chatId: projectChat.id,
            employeeId: unitHeadId,
            memberType: 'owner'
          }
        });
      }

      // Update participant count
      const participantCount = await this.prisma.chatParticipant.count({
        where: { chatId: projectChat.id }
      });

      await this.prisma.projectChat.update({
        where: { id: projectChat.id },
        data: { participants: participantCount }
      });

      console.log(`Unit head (${unitHeadId}) added as owner to project chat for project ${projectId}`);
    } catch (error) {
      console.error(`Failed to add unit head to project chat for project ${projectId}:`, error);
      throw new BadRequestException(`Failed to add unit head to project chat: ${error.message}`);
    }
  }

  // Helper method to add all team members to project logs
  private async addTeamMembersToProjectLogs(projectId: number, teamId: number) {
    try {
      // Get team details
      const team = await this.prisma.team.findUnique({
        where: { id: teamId },
        include: {
          teamLead: true
        }
      });

      if (!team) {
        throw new BadRequestException(`Team with ID ${teamId} not found`);
      }

      // Get all team members (team lead + employees where teamLeadId = team.teamLeadId)
      if (!team.teamLeadId) {
        throw new BadRequestException(`Team with ID ${teamId} has no team lead assigned`);
      }

      const teamMembers = await this.prisma.employee.findMany({
        where: {
          OR: [
            { id: team.teamLeadId }, // Team lead
            { teamLeadId: team.teamLeadId } // Team members
          ]
        }
      });

      if (teamMembers.length === 0) {
        throw new BadRequestException(`No team members found for team ${teamId}`);
      }

      // Add each team member to project logs
      for (const member of teamMembers) {
        await this.autoLogService.addEmployeeToProject(projectId, member.id);
      }

      console.log(`Added ${teamMembers.length} team members to project logs for project ${projectId}`);
    } catch (error) {
      console.error(`Failed to add team members to project logs for project ${projectId}:`, error);
      throw new BadRequestException(`Failed to add team members to project logs: ${error.message}`);
    }
  }

  // Helper method to add all team members to project chat as participants
  private async addTeamMembersToProjectChat(projectId: number, teamId: number) {
    try {
      // Find the project chat
      const projectChat = await this.prisma.projectChat.findFirst({
        where: { projectId: projectId }
      });

      if (!projectChat) {
        throw new BadRequestException(`Project chat not found for project ${projectId}`);
      }

      // Get team details
      const team = await this.prisma.team.findUnique({
        where: { id: teamId },
        include: {
          teamLead: true
        }
      });

      if (!team) {
        throw new BadRequestException(`Team with ID ${teamId} not found`);
      }

      // Get all team members (team lead + employees where teamLeadId = team.teamLeadId)
      if (!team.teamLeadId) {
        throw new BadRequestException(`Team with ID ${teamId} has no team lead assigned`);
      }

      const teamMembers = await this.prisma.employee.findMany({
        where: {
          OR: [
            { id: team.teamLeadId }, // Team lead
            { teamLeadId: team.teamLeadId } // Team members
          ]
        }
      });

      if (teamMembers.length === 0) {
        throw new BadRequestException(`No team members found for team ${teamId}`);
      }

      // Add each team member as participant (if not already a participant)
      for (const member of teamMembers) {
        const existingParticipant = await this.prisma.chatParticipant.findFirst({
          where: {
            chatId: projectChat.id,
            employeeId: member.id
          }
        });

        if (!existingParticipant) {
          await this.prisma.chatParticipant.create({
            data: {
              chatId: projectChat.id,
              employeeId: member.id,
              memberType: 'participant'
            }
          });
        }
      }

      // Update participant count
      const participantCount = await this.prisma.chatParticipant.count({
        where: { chatId: projectChat.id }
      });

      await this.prisma.projectChat.update({
        where: { id: projectChat.id },
        data: { participants: participantCount }
      });

      console.log(`Added ${teamMembers.length} team members to project chat for project ${projectId}`);
    } catch (error) {
      console.error(`Failed to add team members to project chat for project ${projectId}:`, error);
      throw new BadRequestException(`Failed to add team members to project chat: ${error.message}`);
    }
  }
}
