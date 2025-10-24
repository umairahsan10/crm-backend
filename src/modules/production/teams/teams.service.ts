import { Injectable, BadRequestException, ConflictException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { TeamsQueryDto } from './dto/teams-query.dto';
import { AddMembersDto } from './dto/add-members.dto';

@Injectable()
export class TeamsService {
  constructor(private prisma: PrismaService) {}

  async createTeam(createTeamDto: CreateTeamDto, user?: any) {
    const { name, teamLeadId, productionUnitId } = createTeamDto;

    // Validate teamLeadId if provided
    if (teamLeadId !== undefined && teamLeadId !== null) {
      if (isNaN(teamLeadId) || teamLeadId <= 0) {
        throw new BadRequestException('Team lead ID must be a valid positive number');
      }

      // Check if employee exists
      const employee = await this.prisma.employee.findUnique({
        where: { id: teamLeadId },
        include: { role: true, department: true }
      });

      if (!employee) {
        throw new BadRequestException(`Employee with ID ${teamLeadId} does not exist`);
      }

      // Check if employee has team_lead role
      if (employee.role.name !== 'team_lead') {
        throw new BadRequestException('Employee must have team_lead role to be assigned as team lead');
      }

      // Check if employee is in Production department
      if (employee.department.name !== 'Production') {
        throw new BadRequestException('Employee must be in Production department to be assigned as team lead');
      }

      // Check if employee is already leading another team
      const existingTeamWithLead = await this.prisma.team.findFirst({
        where: { teamLeadId: teamLeadId }
      });

      if (existingTeamWithLead) {
        throw new ConflictException(
          `Employee ${employee.firstName} ${employee.lastName} (ID: ${teamLeadId}) is already leading team "${existingTeamWithLead.name}" (ID: ${existingTeamWithLead.id}). Each employee can only lead one team at a time. Please remove this employee from their current team first or choose a different employee.`
        );
      }
    }

    // Validate productionUnitId if provided
    if (productionUnitId !== undefined && productionUnitId !== null) {
      if (isNaN(productionUnitId) || productionUnitId <= 0) {
        throw new BadRequestException('Production unit ID must be a valid positive number');
      }

      // Check if production unit exists
      const productionUnit = await this.prisma.productionUnit.findUnique({
        where: { id: productionUnitId }
      });

      if (!productionUnit) {
        throw new BadRequestException(`Production unit with ID ${productionUnitId} does not exist`);
      }

      // Check if user has access to this production unit (for unit_head role)
      if (user && user.role === 'unit_head') {
        if (productionUnit.headId !== user.id) {
          throw new ForbiddenException('You can only create teams in your own production unit');
        }
      }
    }

    // Check if name already exists
    const existingName = await this.prisma.team.findFirst({
      where: { name }
    });

    if (existingName) {
      throw new ConflictException('Team name already exists');
    }

    // Create the team
    const newTeam = await this.prisma.team.create({
      data: {
        name,
        teamLeadId,
        productionUnitId
      }
    });

    return {
      success: true,
      message: 'New Team Created Successfully'
    };
  }

  async getAllTeams(user: any, query: TeamsQueryDto) {
    const whereClause: any = this.buildRoleBasedWhereClause(user);
    
    // Apply all filters from query
    if (query.teamId) {
      whereClause.id = query.teamId;
    }
    
    if (query.unitId) {
      whereClause.productionUnitId = query.unitId;
    }
    
    if (query.hasLead !== undefined) {
      whereClause.teamLeadId = query.hasLead ? { not: null } : null;
    }
    
    if (query.hasMembers !== undefined) {
      if (query.hasMembers) {
        whereClause.productionUnit = {
          productionEmployees: { some: {} }
        };
      } else {
        whereClause.productionUnit = {
          productionEmployees: { none: {} }
        };
      }
    }
    
    if (query.hasProjects !== undefined) {
      if (query.hasProjects) {
        whereClause.projects = { some: {} };
      } else {
        whereClause.projects = { none: {} };
      }
    }

    // Text-based filters
    if (query.teamName) {
      whereClause.name = {
        contains: query.teamName,
        mode: 'insensitive'
      };
    }

    if (query.leadEmail) {
      whereClause.teamLead = {
        email: {
          contains: query.leadEmail,
          mode: 'insensitive'
        }
      };
    }

    if (query.leadName) {
      whereClause.teamLead = {
        OR: [
          { firstName: { contains: query.leadName, mode: 'insensitive' } },
          { lastName: { contains: query.leadName, mode: 'insensitive' } }
        ]
      };
    }

    if (query.unitName) {
      whereClause.productionUnit = {
        name: {
          contains: query.unitName,
          mode: 'insensitive'
        }
      };
    }

    const include = this.buildIncludeClause(query.include);

    const orderBy = {};
    if (query.sortBy) {
      orderBy[query.sortBy] = query.sortOrder || 'asc';
    } else {
      orderBy['name'] = 'asc';
    }

    const skip = query.page ? (query.page - 1) * (query.limit || 10) : 0;
    const take = query.limit || 10;

    const [teams, total] = await Promise.all([
      this.prisma.team.findMany({
        where: whereClause,
        include: {
          teamLead: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          },
          productionUnit: {
            select: {
              id: true,
              name: true
            }
          },
          ...include
        },
        orderBy,
        skip,
        take
      }),
      this.prisma.team.count({ where: whereClause })
    ]);

    // Get counts for each team
    const teamsWithCounts = await Promise.all(
      teams.map(async (team) => {
        // Count production employees in the same unit as this team
        const membersCount = await this.prisma.production.count({
          where: { productionUnitId: team.productionUnitId }
        });

        const projectsCount = await this.prisma.project.count({
          where: { teamId: team.id }
        });

        return {
          ...team,
          membersCount,
          projectsCount
        };
      })
    );

    return {
      success: true,
      data: teamsWithCounts,
      total,
      pagination: {
        page: query.page || 1,
        limit: query.limit || 10,
        totalPages: Math.ceil(total / (query.limit || 10))
      },
      message: teamsWithCounts.length > 0 ? 'Teams retrieved successfully' : 'No teams found'
    };
  }

  async getTeam(id: number, user?: any) {
    const team = await this.prisma.team.findUnique({
      where: { id },
      include: {
        teamLead: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            role: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        productionUnit: {
          select: {
            id: true,
            name: true,
            head: {
              select: {
                id: true,
                firstName: true,
                lastName: true
              }
            }
          }
        }
      }
    });

    if (!team) {
      throw new NotFoundException(`Team with ID ${id} does not exist`);
    }

    // Check if user belongs to this team (for all roles except dep_manager)
    if (user && user.role !== 'dep_manager') {
      const belongsToTeam = await this.checkUserBelongsToTeam(user, team.id);
      if (!belongsToTeam) {
        throw new ForbiddenException('You do not have access to this team. You must be a member of this team to view its details.');
      }
    }

    // Get production employees in the same unit as this team
    let filteredMembers: any[] = [];
    let filteredProjects: any[] = [];

    if (user && ['team_lead', 'senior', 'junior'].includes(user.role)) {
      // For team_lead - show all production employees in the unit
      if (user.role === 'team_lead') {
        filteredMembers = await this.prisma.production.findMany({
          where: { productionUnitId: team.productionUnitId },
          include: {
            employee: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                role: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              }
            }
          }
        });
      } else if (['senior', 'junior'].includes(user.role)) {
        // For senior/junior - only show themselves
        filteredMembers = await this.prisma.production.findMany({
          where: { 
            productionUnitId: team.productionUnitId,
            employeeId: user.id
          },
          include: {
            employee: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                role: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              }
            }
          }
        });
      }

      // Get projects (view-only for all roles)
      filteredProjects = await this.prisma.project.findMany({
        where: { teamId: team.id },
        include: {
          client: {
            select: {
              id: true,
              companyName: true,
              clientName: true,
              email: true,
              phone: true
            }
          },
          salesRep: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      });
    } else {
      // For dep_manager and unit_head - show all data (no filtering)
      filteredMembers = await this.prisma.production.findMany({
        where: { productionUnitId: team.productionUnitId },
        include: {
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              role: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          }
        }
      });

      filteredProjects = await this.prisma.project.findMany({
        where: { teamId: team.id },
        include: {
          client: {
            select: {
              id: true,
              companyName: true,
              clientName: true,
              email: true,
              phone: true
            }
          },
          salesRep: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      });
    }

    // Get counts (always show total counts)
    const membersCount = await this.prisma.production.count({
      where: { productionUnitId: team.productionUnitId }
    });

    const projectsCount = await this.prisma.project.count({
      where: { teamId: team.id }
    });

    return {
      success: true,
      data: {
        ...team,
        members: filteredMembers, // Filtered members based on user role
        membersCount, // Total count
        projectsCount, // Total count
        projects: filteredProjects // Filtered projects based on user role
      },
      message: 'Team details retrieved successfully'
    };
  }

  private async checkUserBelongsToTeam(user: any, teamId: number): Promise<boolean> {
    switch (user.role) {
      case 'unit_head':
        // Check if team is in their unit
        const team = await this.prisma.team.findFirst({
          where: {
            id: teamId,
            productionUnit: { headId: user.id }
          }
        });
        return !!team;

      case 'team_lead':
        // Check if user leads this team
        const leadTeam = await this.prisma.team.findFirst({
          where: {
            id: teamId,
            teamLeadId: user.id
          }
        });
        return !!leadTeam;

      case 'senior':
      case 'junior':
        // Check if user is a production employee in the same unit as this team
        const teamWithUnit = await this.prisma.team.findUnique({
          where: { id: teamId },
          select: { productionUnitId: true }
        });
        
        if (!teamWithUnit) return false;
        
        const member = await this.prisma.production.findFirst({
          where: {
            productionUnitId: teamWithUnit.productionUnitId,
            employeeId: user.id
          }
        });
        return !!member;

      default:
        return false;
    }
  }

  private buildRoleBasedWhereClause(user: any): any {
    switch (user.role) {
      case 'dep_manager':
        return {}; // Can see all teams
      case 'unit_head':
        return { productionUnit: { headId: user.id } }; // Teams in their unit
      case 'team_lead':
        return { teamLeadId: user.id }; // Only teams they lead
      case 'senior':
      case 'junior':
        return {
          productionUnit: {
            productionEmployees: {
              some: {
                employeeId: user.id
              }
            }
          }
        }; // Teams in units where they are production employees
      default:
        throw new ForbiddenException('Insufficient permissions');
    }
  }

  private buildIncludeClause(include?: string): any {
    const includeClause: any = {};
    
    if (include?.includes('members')) {
      includeClause.productionUnit = {
        include: {
          productionEmployees: {
            include: {
              employee: {
                include: {
                  role: true
                }
              }
            }
          }
        }
      };
    }
    
    if (include?.includes('projects')) {
      includeClause.projects = {
        include: {
          client: true
        }
      };
    }
    
    if (include?.includes('unit')) {
      includeClause.productionUnit = {
        include: {
          head: true
        }
      };
    }
    
    if (include?.includes('lead')) {
      includeClause.teamLead = {
        include: {
          role: true
        }
      };
    }
    
    return includeClause;
  }

  async updateTeam(id: number, updateTeamDto: UpdateTeamDto, user?: any) {
    // Validate that updateTeamDto is provided
    if (!updateTeamDto) {
      throw new BadRequestException('Request body is required for update operation');
    }

    // Check if team exists
    const existingTeam = await this.prisma.team.findUnique({
      where: { id }
    });

    if (!existingTeam) {
      throw new NotFoundException(`Team with ID ${id} does not exist`);
    }

    // Role-based access control
    if (user && user.role === 'unit_head') {
      const teamInUnit = await this.prisma.team.findFirst({
        where: {
          id: id,
          productionUnit: { headId: user.id }
        }
      });
      if (!teamInUnit) {
        throw new ForbiddenException('You can only update teams in your own production unit');
      }
    }

    if (user && user.role === 'team_lead') {
      if (existingTeam.teamLeadId !== user.id) {
        throw new ForbiddenException('You can only update your own team');
      }
    }

    const { name, teamLeadId } = updateTeamDto;

    // Check if at least one field is provided for update
    if (name === undefined && teamLeadId === undefined) {
      throw new BadRequestException('At least one field (name or teamLeadId) must be provided for update');
    }

    // Validate teamLeadId if provided
    if (teamLeadId !== undefined) {
      if (teamLeadId === null) {
        // Setting teamLeadId to NULL - check if team has active projects
        const activeProjects = await this.prisma.project.findMany({
          where: {
            teamId: id,
            status: { not: 'completed' }
          },
          select: { id: true, description: true, status: true }
        });

        if (activeProjects.length > 0) {
          throw new BadRequestException(
            `Cannot remove team lead. Team has ${activeProjects.length} active project(s). ` +
            `Please complete or reassign all active projects before removing the team lead to avoid workflow disruption. ` +
            `Active projects: ${activeProjects.map(p => `ID ${p.id} - ${p.description}`).join(', ')}`
          );
        }
      } else {
        // Assigning a new lead
        const employee = await this.prisma.employee.findUnique({
          where: { id: teamLeadId },
          include: { role: true, department: true }
        });

        if (!employee) {
          throw new BadRequestException(`Employee with ID ${teamLeadId} does not exist`);
        }

        if (employee.role.name !== 'team_lead') {
          throw new BadRequestException('Employee must have team_lead role to be assigned as team lead');
        }

        if (employee.department.name !== 'Production') {
          throw new BadRequestException('Employee must be in Production department to be assigned as team lead');
        }

        // Check if employee is already leading another team (excluding current team)
        const existingTeamWithLead = await this.prisma.team.findFirst({
          where: { 
            teamLeadId: teamLeadId,
            id: { not: id } // Exclude current team from check
          }
        });

        if (existingTeamWithLead) {
          throw new ConflictException(
            `Employee ${employee.firstName} ${employee.lastName} (ID: ${teamLeadId}) is already leading team "${existingTeamWithLead.name}" (ID: ${existingTeamWithLead.id}). Each employee can only lead one team at a time. Please remove this employee from their current team first or choose a different employee.`
          );
        }
      }
    }

    // Check name uniqueness if provided
    if (name) {
      const existingName = await this.prisma.team.findFirst({
        where: {
          name,
          id: { not: id }
        }
      });

      if (existingName) {
        throw new ConflictException('Team name already exists');
      }
    }

    // Update the team
    await this.prisma.team.update({
      where: { id },
      data: updateTeamDto
    });

    return {
      success: true,
      message: 'Team updated successfully'
    };
  }

  async deleteTeam(id: number) {
    // Check if team exists
    const existingTeam = await this.prisma.team.findUnique({
      where: { id }
    });

    if (!existingTeam) {
      throw new NotFoundException(`Team with ID ${id} does not exist`);
    }

    // Check for production employees in the same unit
    const members = await this.prisma.production.findMany({
      where: { productionUnitId: existingTeam.productionUnitId },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    // Check for projects
    const projects = await this.prisma.project.findMany({
      where: { teamId: id },
      select: {
        id: true,
        description: true,
        status: true,
        deadline: true
      }
    });

    // Team can only be deleted if it has NO members AND NO projects
    if (members.length > 0 || projects.length > 0) {
      return {
        success: false,
        message: `Cannot delete team "${existingTeam.name}". Team has ${members.length} member(s) and ${projects.length} project(s). Please remove all members and projects first.`,
        teamInfo: {
          id: existingTeam.id,
          name: existingTeam.name,
          teamLeadId: existingTeam.teamLeadId
        },
        dependencies: {
          members: {
            count: members.length,
            details: members.map(member => ({
              id: member.id,
              employeeId: member.employee.id,
              employeeName: `${member.employee.firstName} ${member.employee.lastName}`,
              email: member.employee.email,
              specialization: member.specialization
            }))
          },
          projects: {
            count: projects.length,
            details: projects.map(project => ({
              id: project.id,
              description: project.description,
              status: project.status,
              deadline: project.deadline
            }))
          },
          summary: {
            totalMembers: members.length,
            totalProjects: projects.length,
            hasMembers: members.length > 0,
            hasProjects: projects.length > 0
          }
        },
        instructions: [
          "To delete this team, you must first:",
          "1. Remove all members from this team using DELETE /production/teams/:id/members/:employeeId",
          "2. Complete or reassign all projects",
          "3. Once all members and projects are removed, the team can be deleted"
        ]
      };
    }

    // If no members and no projects, proceed with deletion
    await this.prisma.team.delete({
      where: { id }
    });

    return {
      success: true,
      message: 'Team deleted successfully'
    };
  }

  async getAvailableLeads(assigned?: boolean) {
    let whereClause: any = {
      role: { name: 'team_lead' },
      department: { name: 'Production' },
      status: 'active'
    };

    if (assigned === true) {
      // Only leads assigned to teams
      whereClause.teamMembers = { some: {} };
    } else if (assigned === false) {
      // Only leads NOT assigned to any team
      whereClause.teamMembers = { none: {} };
    } else {
      // Default behavior: Only show leads WITHOUT teams (available for assignment)
      whereClause.teamMembers = { none: {} };
    }

    const leads = await this.prisma.employee.findMany({
      where: whereClause,
      include: {
        teamMembers: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: [
        { firstName: 'asc' },
        { lastName: 'asc' }
      ]
    });

    return {
      success: true,
      data: leads.map(lead => ({
        id: lead.id,
        firstName: lead.firstName,
        lastName: lead.lastName,
        email: lead.email,
        isAssigned: lead.teamMembers.length > 0,
        currentTeam: lead.teamMembers.length > 0 ? {
          id: lead.teamMembers[0].id,
          name: `${lead.teamMembers[0].firstName} ${lead.teamMembers[0].lastName}`
        } : null
      })),
      total: leads.length,
      message: leads.length > 0 
        ? 'Available team leads retrieved successfully' 
        : 'No available team leads found'
    };
  }

  async getAvailableEmployees(assigned?: boolean) {
    let whereClause: any = {
      role: { name: { in: ['senior', 'junior'] } },
      department: { name: 'Production' },
      status: 'active'
    };

    if (assigned === true) {
      // Show employees assigned to production units
      whereClause.production = { some: {} };
    } else if (assigned === false) {
      // Show employees NOT assigned to any production unit
      whereClause.production = { none: {} };
    }
    // If assigned is undefined, show all employees (no additional filter)

    const employees = await this.prisma.employee.findMany({
      where: whereClause,
      include: {
        role: {
          select: {
            name: true
          }
        },
        production: {
          include: {
            productionUnit: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: [
        { firstName: 'asc' },
        { lastName: 'asc' }
      ]
    });

    return {
      success: true,
      data: employees.map(employee => ({
        id: employee.id,
        firstName: employee.firstName,
        lastName: employee.lastName,
        email: employee.email,
        role: employee.role?.name || 'Unknown',
        isAssigned: employee.production.length > 0,
        currentUnits: employee.production.map(p => ({
          id: p.productionUnit?.id || 0,
          name: p.productionUnit?.name || 'Unknown'
        }))
      })),
      total: employees.length,
      message: employees.length > 0 
        ? 'Available employees retrieved successfully' 
        : 'No available employees found'
    };
  }

  async addMembersToTeam(teamId: number, addMembersDto: AddMembersDto, user?: any) {
    const { employeeIds } = addMembersDto;

    // Validate team exists
    const team = await this.prisma.team.findUnique({
      where: { id: teamId },
      include: { productionUnit: true }
    });

    if (!team) {
      throw new NotFoundException(`Team with ID ${teamId} does not exist`);
    }

    // Role-based access control
    if (user && user.role === 'unit_head') {
      if (team.productionUnit && team.productionUnit.headId !== user.id) {
        throw new ForbiddenException('You can only add members to teams in your own production unit');
      }
    }

    if (user && user.role === 'team_lead') {
      if (team.teamLeadId !== user.id) {
        throw new ForbiddenException('You can only add members to your own team');
      }
    }

    // Validate all employees exist and have correct roles
    const employees = await this.prisma.employee.findMany({
      where: {
        id: { in: employeeIds },
        role: { name: { in: ['senior', 'junior'] } },
        department: { name: 'Production' },
        status: 'active'
      },
      include: { role: true, department: true }
    });

    if (employees.length !== employeeIds.length) {
      const foundIds = employees.map(emp => emp.id);
      const missingIds = employeeIds.filter(id => !foundIds.includes(id));
      throw new BadRequestException(
        `Some employees not found or don't have correct roles: ${missingIds.join(', ')}. ` +
        `All employees must have 'senior' or 'junior' role and be in Production department.`
      );
    }

    // Check if any employee is already in another production unit
    const employeesInUnits = await this.prisma.production.findMany({
      where: {
        employeeId: { in: employeeIds }
      },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        productionUnit: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (employeesInUnits.length > 0) {
      const conflictDetails = employeesInUnits.map(emp => 
        `${emp.employee.firstName} ${emp.employee.lastName} (ID: ${emp.employee.id}) is already in production unit "${emp.productionUnit?.name || 'Unknown'}" (ID: ${emp.productionUnit?.id || 0})`
      );
      throw new ConflictException(
        `Cannot add employees who are already in other production units: ${conflictDetails.join('; ')}`
      );
    }

    // Check if any employee is already in this team's production unit
    const employeesAlreadyInUnit = await this.prisma.production.findMany({
      where: {
        employeeId: { in: employeeIds },
        productionUnitId: team.productionUnitId
      },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    if (employeesAlreadyInUnit.length > 0) {
      const alreadyInUnitIds = employeesAlreadyInUnit.map(emp => emp.employee.id);
      const newEmployeeIds = employeeIds.filter(id => !alreadyInUnitIds.includes(id));
      
      if (newEmployeeIds.length === 0) {
        throw new ConflictException('All specified employees are already members of this production unit');
      }
      
      // Continue with only new employees
      employeeIds.splice(0, employeeIds.length, ...newEmployeeIds);
    }

    // Get team's production unit
    const productionUnitId = team.productionUnitId;
    if (!productionUnitId) {
      throw new BadRequestException('Team must be assigned to a production unit before adding members');
    }

    // Bulk insert members
    const membersToCreate = employeeIds.map(employeeId => ({
      employeeId,
      productionUnitId,
      specialization: 'General', // Default specialization
      projectsCompleted: 0
    }));

    await this.prisma.production.createMany({
      data: membersToCreate
    });

    return {
      success: true,
      message: `Successfully added ${employeeIds.length} member(s) to team "${team.name}"`
    };
  }

  async removeMemberFromTeam(teamId: number, employeeId: number, user?: any) {
    // Validate team exists
    const team = await this.prisma.team.findUnique({
      where: { id: teamId }
    });

    if (!team) {
      throw new NotFoundException(`Team with ID ${teamId} does not exist`);
    }

    // Validate employee exists
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId }
    });

    if (!employee) {
      throw new NotFoundException(`Employee with ID ${employeeId} does not exist`);
    }

    // Role-based access control
    if (user && user.role === 'unit_head') {
      const teamInUnit = await this.prisma.team.findFirst({
        where: {
          id: teamId,
          productionUnit: { headId: user.id }
        }
      });
      if (!teamInUnit) {
        throw new ForbiddenException('You can only remove members from teams in your own production unit');
      }
    }

    if (user && user.role === 'team_lead') {
      if (team.teamLeadId !== user.id) {
        throw new ForbiddenException('You can only remove members from your own team');
      }
    }

    // Check if employee is a member of this team's production unit
    const memberRecord = await this.prisma.production.findFirst({
      where: {
        productionUnitId: team.productionUnitId,
        employeeId: employeeId
      }
    });

    if (!memberRecord) {
      throw new BadRequestException(
        `Employee ${employee.firstName} ${employee.lastName} (ID: ${employeeId}) is not a member of this production unit`
      );
    }

    // Remove employee from production unit
    await this.prisma.production.delete({
      where: { id: memberRecord.id }
    });

    return {
      success: true,
      message: `Employee ${employee.firstName} ${employee.lastName} successfully removed from production unit`
    };
  }
}