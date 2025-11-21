import { Injectable, BadRequestException, NotFoundException, ForbiddenException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { CreateProjectTaskDto } from './dto/create-project-task.dto';
import { UpdateProjectTaskDto } from './dto/update-project-task.dto';
import { UpdateTaskStatusDto } from './dto/update-task-status.dto';
import { TaskQueryDto } from './dto/task-query.dto';
import { ProjectTaskStatus, ProjectTaskPriority } from '@prisma/client';
import { AutoLogService } from '../Projects-Logs/auto-log.service';
import { TimeStorageUtil } from '../../../common/utils/time-storage.util';

@Injectable()
export class ProjectTasksService {
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
      throw new ForbiddenException('Only Production department employees can access project tasks');
    }

    return true;
  }

  // Helper method to validate task creation permissions
  private async validateTaskCreationPermission(user: any): Promise<boolean> {
    const normalizedUser = this.normalizeUser(user);
    
    if (!['dep_manager', 'unit_head', 'team_lead'].includes(normalizedUser.role)) {
      throw new ForbiddenException('Only team leads, unit heads, and department managers can create tasks');
    }

    await this.validateProductionDepartment(normalizedUser.id);
    return true;
  }

  // Helper method to validate task assignment scope
  private async validateTaskAssignmentScope(creatorId: number, assignedToId: number): Promise<boolean> {
    const creator = await this.prisma.employee.findUnique({
      where: { id: creatorId },
      include: { 
        role: true,
        department: true,
        teamLead: true,
        managedDepartment: true
      }
    });

    const assignee = await this.prisma.employee.findUnique({
      where: { id: assignedToId },
      include: { 
        role: true,
        department: true,
        teamLead: true
      }
    });

    if (!creator || !assignee) {
      throw new NotFoundException('Creator or assignee not found');
    }

    // Ensure assignee is in Production department
    if (assignee.department.name !== 'Production') {
      throw new BadRequestException('Can only assign tasks to Production department employees');
    }

    // Team Lead can assign to team members only
    if (creator.role.name === 'team_lead') {
      if (assignee.teamLeadId !== creatorId) {
        throw new BadRequestException('Team leads can only assign tasks to their team members');
      }
    }
    // Unit Head can assign to employees in their unit
    else if (creator.role.name === 'unit_head') {
      // For now, allow unit heads to assign to any Production employee
      // This can be enhanced with unit-based filtering when unit structure is defined
    }
    // Department Manager can assign to any employee in their department
    else if (creator.role.name === 'dep_manager') {
      if (assignee.departmentId !== creator.departmentId) {
        throw new BadRequestException('Department managers can only assign tasks to employees in their department');
      }
    }

    return true;
  }

  // Helper method to validate status transition
  private validateStatusTransition(currentStatus: ProjectTaskStatus, newStatus: ProjectTaskStatus): boolean {
    const validTransitions: { [key in ProjectTaskStatus]: ProjectTaskStatus[] } = {
      'not_started': ['in_progress', 'review'],
      'in_progress': ['review'],
      'review': ['completed', 'cancelled'],
      'completed': [],
      'cancelled': []
    };

    return validTransitions[currentStatus]?.includes(newStatus) || false;
  }

  // Helper method to check if user can complete/cancel task
  private async canCompleteOrCancelTask(user: any, task: any): Promise<boolean> {
    const normalizedUser = this.normalizeUser(user);
    
    // Original creator can always complete/cancel
    if (task.assignedBy === normalizedUser.id) {
      return true;
    }

    // Check hierarchy permissions
    const creator = await this.prisma.employee.findUnique({
      where: { id: task.assignedBy },
      include: { role: true }
    });

    if (!creator) {
      return false;
    }

    // Team Lead created task -> Unit Head or Dept Manager can complete/cancel
    if (creator.role.name === 'team_lead') {
      return ['unit_head', 'dep_manager'].includes(normalizedUser.role);
    }
    // Unit Head created task -> Dept Manager can complete/cancel
    else if (creator.role.name === 'unit_head') {
      return normalizedUser.role === 'dep_manager';
    }
    // Dept Manager created task -> Only Dept Manager can complete/cancel
    else if (creator.role.name === 'dep_manager') {
      return normalizedUser.role === 'dep_manager' && normalizedUser.id === task.assignedBy;
    }

    return false;
  }

  // Helper method to format cancellation comment
  private formatCancellationComment(userId: number, comment: string): string {
    const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    return `${currentDate}, Changed by ID: ${userId}, ${comment}`;
  }

  // 1. Create Project Task
  async createTask(projectId: number, dto: CreateProjectTaskDto, user: any) {
    try {
      const normalizedUser = this.normalizeUser(user);
      
      // Validate creation permissions
      await this.validateTaskCreationPermission(normalizedUser);

      // Validate project exists and is active
      const project = await this.prisma.project.findUnique({
        where: { id: projectId }
      });

      if (!project) {
        throw new NotFoundException('Project not found');
      }

      if (project.status === 'completed' || project.status === 'onhold') {
        throw new BadRequestException('Cannot create tasks for completed or on-hold projects');
      }

      // Validate due date is in the future
      const dueDate = new Date(dto.dueDate);
      const now = new Date();
      if (dueDate <= now) {
        throw new BadRequestException('Due date must be in the future');
      }

      // Validate assignment scope
      await this.validateTaskAssignmentScope(normalizedUser.id, dto.assignedTo);

      // Create the task
      const task = await this.prisma.projectTask.create({
        data: {
          projectId: projectId,
          title: dto.title,
          description: dto.description,
          assignedBy: normalizedUser.id,
          assignedTo: dto.assignedTo,
          priority: dto.priority,
          status: 'not_started',
          difficulty: dto.difficulty,
          startDate: null, // Will be set when status changes to in_progress
          dueDate: dueDate,
          completedOn: null,
          comments: dto.comments
        },
        include: {
          project: {
            include: {
              client: true,
              salesRep: {
                include: { role: true }
              }
            }
          },
          assigner: {
            include: {
              role: true,
              department: true
            }
          },
          assignee: {
            include: {
              role: true,
              department: true
            }
          }
        }
      });

      // No auto log needed for task creation - only track team assignments

      return {
        success: true,
        message: 'Task created successfully',
        data: task
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Failed to create task: ${error.message}`);
    }
  }

  // 2. Get Tasks for Project
  async getProjectTasks(projectId: number, user: any, query: TaskQueryDto) {
    try {
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

      // Build where clause based on user role
      let whereClause: any = { projectId };

      // Apply role-based filtering
      if (normalizedUser.role === 'dep_manager') {
        // Department manager can see all tasks in their department
        whereClause.assignee = {
          department: {
            name: 'Production'
          }
        };
      } else if (normalizedUser.role === 'unit_head') {
        // Unit head can see all tasks in their unit (for now, all Production tasks)
        whereClause.assignee = {
          department: {
            name: 'Production'
          }
        };
      } else if (normalizedUser.role === 'team_lead') {
        // Team lead can see tasks assigned to their team members
        const teamMembers = await this.prisma.employee.findMany({
          where: { teamLeadId: normalizedUser.id },
          select: { id: true }
        });
        
        whereClause.assignedTo = {
          in: teamMembers.map(member => member.id)
        };
      } else {
        // Regular employees can only see tasks assigned to them
        whereClause.assignedTo = normalizedUser.id;
      }

      // Apply query filters
      if (query.status) {
        whereClause.status = query.status;
      }
      if (query.assignedTo) {
        whereClause.assignedTo = query.assignedTo;
      }
      if (query.priority) {
        whereClause.priority = query.priority;
      }

      // Build order by clause
      let orderBy: any = {};
      if (query.sortBy === 'dueDate') {
        orderBy.dueDate = query.order || 'asc';
      } else if (query.sortBy === 'priority') {
        orderBy.priority = query.order || 'asc';
      } else if (query.sortBy === 'createdAt') {
        orderBy.createdAt = query.order || 'desc';
      } else {
        orderBy.createdAt = 'desc'; // Default sort
      }

      const tasks = await this.prisma.projectTask.findMany({
        where: whereClause,
        include: {
          project: {
            include: {
              client: true,
              salesRep: {
                include: { role: true }
              }
            }
          },
          assigner: {
            include: {
              role: true,
              department: true
            }
          },
          assignee: {
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
        data: tasks,
        count: tasks.length
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      throw new BadRequestException(`Failed to fetch project tasks: ${error.message}`);
    }
  }

  // 3. Get Task by ID
  async getTaskById(projectId: number, taskId: number, user: any) {
    try {
      const normalizedUser = this.normalizeUser(user);
      
      // Validate user is in Production department
      await this.validateProductionDepartment(normalizedUser.id);

      const task = await this.prisma.projectTask.findFirst({
        where: {
          id: taskId,
          projectId: projectId
        },
        include: {
          project: {
            include: {
              client: true,
              salesRep: {
                include: { role: true }
              }
            }
          },
          assigner: {
            include: {
              role: true,
              department: true
            }
          },
          assignee: {
            include: {
              role: true,
              department: true
            }
          }
        }
      });

      if (!task) {
        throw new NotFoundException('Task not found');
      }

      // Check if user has access to this task
      const hasAccess = await this.checkTaskAccess(normalizedUser, task);
      if (!hasAccess) {
        throw new ForbiddenException('Access denied to this task');
      }

      return {
        success: true,
        data: task
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      throw new BadRequestException(`Failed to fetch task: ${error.message}`);
    }
  }

  // 4. Update Task
  async updateTask(projectId: number, taskId: number, dto: UpdateProjectTaskDto, user: any) {
    try {
      const normalizedUser = this.normalizeUser(user);
      
      // Validate user is in Production department
      await this.validateProductionDepartment(normalizedUser.id);

      const task = await this.prisma.projectTask.findFirst({
        where: {
          id: taskId,
          projectId: projectId
        }
      });

      if (!task) {
        throw new NotFoundException('Task not found');
      }

      // Only the original creator can update task details
      if (task.assignedBy !== normalizedUser.id) {
        throw new ForbiddenException('Only the task creator can update task details');
      }

      // Validate due date if provided
      if (dto.dueDate) {
        const dueDate = new Date(dto.dueDate);
        const now = new Date();
        if (dueDate <= now) {
          throw new BadRequestException('Due date must be in the future');
        }
      }

      const updatedTask = await this.prisma.projectTask.update({
        where: { id: taskId },
        data: {
          ...dto,
          dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
          updatedAt: TimeStorageUtil.getCurrentTimeForStorage()
        },
        include: {
          project: {
            include: {
              client: true,
              salesRep: {
                include: { role: true }
              }
            }
          },
          assigner: {
            include: {
              role: true,
              department: true
            }
          },
          assignee: {
            include: {
              role: true,
              department: true
            }
          }
        }
      });

      return {
        success: true,
        message: 'Task updated successfully',
        data: updatedTask
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Failed to update task: ${error.message}`);
    }
  }

  // 5. Update Task Status
  async updateTaskStatus(projectId: number, taskId: number, dto: UpdateTaskStatusDto, user: any) {
    try {
      const normalizedUser = this.normalizeUser(user);
      
      // Validate user is in Production department
      await this.validateProductionDepartment(normalizedUser.id);

      const task = await this.prisma.projectTask.findFirst({
        where: {
          id: taskId,
          projectId: projectId
        }
      });

      if (!task) {
        throw new NotFoundException('Task not found');
      }

      // Validate status transition
      if (!this.validateStatusTransition(task.status, dto.status)) {
        throw new BadRequestException(`Invalid status transition from ${task.status} to ${dto.status}`);
      }

      // Check permissions based on status change
      if (dto.status === 'completed' || dto.status === 'cancelled') {
        // Only managers/leads can complete/cancel
        if (!['dep_manager', 'unit_head', 'team_lead'].includes(normalizedUser.role)) {
          throw new ForbiddenException('Only managers and leads can complete or cancel tasks');
        }

        // For cancellation, comment is required
        if (dto.status === 'cancelled' && !dto.comments) {
          throw new BadRequestException('Comment is required when cancelling a task');
        }
      } else if (dto.status === 'in_progress' || dto.status === 'review') {
        // Managers/leads can update any task, regular employees can only update their assigned tasks
        if (['dep_manager', 'unit_head', 'team_lead'].includes(normalizedUser.role)) {
          // Managers and leads can update any task status
        } else {
          // Regular employees can only update their own assigned tasks
          if (task.assignedTo !== normalizedUser.id) {
            throw new ForbiddenException('You can only update status of tasks assigned to you');
          }
        }
      }

      // Prepare update data
      const updateData: any = {
        status: dto.status,
        updatedAt: TimeStorageUtil.getCurrentTimeForStorage()
      };

      // Set start date when status changes to in_progress
      if (dto.status === 'in_progress' && task.status === 'not_started') {
        updateData.startDate = TimeStorageUtil.getCurrentTimeForStorage();
      }

      // Set completed date when status changes to completed
      if (dto.status === 'completed') {
        updateData.completedOn = TimeStorageUtil.getCurrentTimeForStorage();
      }

      // Handle comments
      if (dto.comments) {
        if (dto.status === 'cancelled') {
          // Format cancellation comment
          updateData.comments = this.formatCancellationComment(normalizedUser.id, dto.comments);
        } else {
          // Regular comment
          updateData.comments = dto.comments;
        }
      }

      const updatedTask = await this.prisma.projectTask.update({
        where: { id: taskId },
        data: updateData,
        include: {
          project: {
            include: {
              client: true,
              salesRep: {
                include: { role: true }
              }
            }
          },
          assigner: {
            include: {
              role: true,
              department: true
            }
          },
          assignee: {
            include: {
              role: true,
              department: true
            }
          }
        }
      });

      // No auto log needed for status changes - only track employee assignments

      return {
        success: true,
        message: 'Task status updated successfully',
        data: updatedTask
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Failed to update task status: ${error.message}`);
    }
  }

  // Helper method to check task access
  private async checkTaskAccess(user: any, task: any): Promise<boolean> {
    // Department manager can see all tasks
    if (user.role === 'dep_manager') {
      return true;
    }
    // Unit head can see all tasks in their unit
    else if (user.role === 'unit_head') {
      return true; // For now, all Production tasks
    }
    // Team lead can see tasks assigned to their team members
    else if (user.role === 'team_lead') {
      const teamMembers = await this.prisma.employee.findMany({
        where: { teamLeadId: user.id },
        select: { id: true }
      });
      return teamMembers.some(member => member.id === task.assignedTo);
    }
    // Regular employees can only see tasks assigned to them
    else {
      return task.assignedTo === user.id;
    }
  }
}
