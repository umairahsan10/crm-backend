import { Injectable, BadRequestException, ConflictException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { CreateProductionTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { TeamsQueryDto } from './dto/teams-query.dto';
import { AddMembersDto } from './dto/add-members.dto';

@Injectable()
export class TeamsService {
  constructor(private prisma: PrismaService) {}

  async createTeam(createTeamDto: CreateProductionTeamDto, user?: any) {
    const { name, teamLeadId, productionUnitId } = createTeamDto;

    // Check if team name already exists
    const existingTeam = await this.prisma.team.findFirst({
      where: { name }
    });

    if (existingTeam) {
      throw new ConflictException('Team name already exists');
    }

    // Validate teamLeadId employee exists
    const teamLeadEmployee = await this.prisma.employee.findUnique({
      where: { id: teamLeadId },
      include: { 
        role: true,
        department: true
      }
    });

    if (!teamLeadEmployee) {
      throw new BadRequestException(`Employee with ID ${teamLeadId} does not exist`);
    }

    // Check if employee belongs to Production department
    if (teamLeadEmployee.department.name !== 'Production') {
      throw new BadRequestException('Employee must belong to Production department');
    }

    // Check if employee has team_lead role
    if (teamLeadEmployee.role.name !== 'team_lead') {
      throw new BadRequestException('Employee must have team_lead role to be assigned as team lead');
    }

    // Check if employee is active
    if (teamLeadEmployee.status !== 'active') {
      throw new BadRequestException('Employee must be active to be assigned as team lead');
    }

    // Check if team lead is already leading another team
    const existingTeamWithLead = await this.prisma.team.findFirst({
      where: { teamLeadId: teamLeadId }
    });

    if (existingTeamWithLead) {
      throw new ConflictException(
        `Employee ${teamLeadEmployee.firstName} ${teamLeadEmployee.lastName} (ID: ${teamLeadId}) is already leading team "${existingTeamWithLead.name}" (ID: ${existingTeamWithLead.id}). Each employee can only lead one team at a time.`
      );
    }

    // Validate productionUnitId exists
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

    // Create the team using max + 1 logic for ID assignment
    const newTeam = await this.prisma.$transaction(async (tx) => {
      // Get the maximum team ID and increment it
      const maxTeam = await tx.team.findFirst({
        orderBy: { id: 'desc' },
        select: { id: true }
      });

      const nextTeamId = maxTeam ? maxTeam.id + 1 : 1;

      // Create the team with manual ID assignment
      const team = await tx.team.create({
        data: {
          id: nextTeamId,
          name,
          teamLeadId,
          productionUnitId,
          employeeCount: 1 // Start with 1 (the team lead themselves)
        }
      });

      // Set the team lead's teamLeadId to the team's teamLeadId so they are counted as part of the team
      await tx.employee.update({
        where: { id: teamLeadId },
        data: { teamLeadId: teamLeadId }
      });

      return team;
    });

    // Get the created team with includes
    const teamWithDetails = await this.prisma.team.findUnique({
      where: { id: newTeam.id },
      include: {
        teamLead: {
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

    return {
      success: true,
      message: `Team "${name}" created successfully`,
      data: {
        teamId: teamWithDetails!.id,
        teamName: teamWithDetails!.name,
        teamLead: teamWithDetails!.teamLead,
        productionUnit: teamWithDetails!.productionUnit,
        employeeCount: 1
      }
    };
  }

  async getAllTeams(user: any, query: TeamsQueryDto) {
    // Check if single team request (by ID)
    if (query.teamId) {
      return await this.getSingleTeamWithDetails(query.teamId, user);
    }

    const whereClause: any = await this.buildRoleBasedWhereClause(user);
    
    // Apply filters from query
    if (query.unitId) {
      whereClause.productionUnitId = query.unitId;
    }
    
    if (query.hasLead !== undefined) {
      whereClause.teamLeadId = query.hasLead ? { not: null } : null;
    }
    
    if (query.hasMembers !== undefined) {
      if (query.hasMembers) {
        whereClause.teamLeadId = { not: null }; // Teams with team leads have members
      } else {
        whereClause.teamLeadId = null; // Teams without team leads have no members
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
          }
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
        // Count team members (team lead + employees with same teamLeadId)
        const membersCount = team.teamLeadId ? await this.prisma.employee.count({
          where: { 
            OR: [
              { id: team.teamLeadId }, // Include team lead
              { teamLeadId: team.teamLeadId } // Include team members
            ]
          }
        }) : 0;

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

    // Check if user belongs to this team (for all roles except dep_manager and admin)
    if (user && user.role !== 'dep_manager' && user.type !== 'admin' && user.role !== 'admin') {
      const belongsToTeam = await this.checkUserBelongsToTeam(user, team.id);
      if (!belongsToTeam) {
        throw new ForbiddenException('You do not have access to this team. You must be a member of this team to view its details.');
      }
    }

    // Get team members (employees where teamLeadId = team.teamLeadId)
    let filteredMembers: any[] = [];
    let filteredProjects: any[] = [];

    if (team.teamLeadId) {
      // Get all team members (including the team lead)
      filteredMembers = await this.prisma.employee.findMany({
        where: { teamLeadId: team.teamLeadId },
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
      });
    }

    // Get team projects (all users see all projects in the team)
    filteredProjects = await this.prisma.project.findMany({
      where: { teamId: team.id },
      select: {
        id: true,
        description: true,
        status: true,
        deadline: true,
        liveProgress: true,
        client: {
          select: {
            id: true,
            companyName: true,
            clientName: true,
            email: true,
            phone: true
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
      }
    });

    // Get counts
    const membersCount = team.teamLeadId ? await this.prisma.employee.count({
      where: { 
        OR: [
          { id: team.teamLeadId }, // Include team lead
          { teamLeadId: team.teamLeadId } // Include team members
        ]
      }
    }) : 0;

    const projectsCount = await this.prisma.project.count({
      where: { teamId: team.id }
    });

    return {
      success: true,
      data: {
        ...team,
        members: filteredMembers,
        membersCount,
        projectsCount,
        projects: filteredProjects
      },
      message: 'Team details retrieved successfully'
    };
  }

  private async checkUserBelongsToTeam(user: any, teamId: number): Promise<boolean> {
    // Admin users have access to all teams
    if (user?.type === 'admin' || user?.role === 'admin') {
      return true;
    }
    
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
        // Check if user is a member of this team
        // First get the user's teamLeadId from database
        const userEmployee = await this.prisma.employee.findUnique({
          where: { id: user.id },
          select: { teamLeadId: true }
        });
        
        if (!userEmployee || !userEmployee.teamLeadId) return false;
        
        // Then check if the team's teamLeadId matches user's teamLeadId
        const teamWithLead = await this.prisma.team.findUnique({
          where: { id: teamId },
          select: { teamLeadId: true }
        });
        
        if (!teamWithLead || !teamWithLead.teamLeadId) return false;
        
        return userEmployee.teamLeadId === teamWithLead.teamLeadId;

      default:
        return false;
    }
  }

  private async buildRoleBasedWhereClause(user: any): Promise<any> {
    // Admin users can see all teams
    if (user?.type === 'admin' || user?.role === 'admin') {
      return {
        productionUnit: {
          isNot: null // Only teams assigned to production units
        }
      };
    }
    
    // If no user provided, deny access
    if (!user || !user.role) {
      throw new ForbiddenException('Insufficient permissions');
    }
    
    switch (user.role) {
      case 'dep_manager':
        // Department manager can see all teams in Production department
        return {
          productionUnit: {
            isNot: null // Only teams assigned to production units
          }
        };
        
      case 'unit_head':
        // Unit head can only see teams in their production unit
        return { 
          productionUnitId: { 
            in: await this.getUserProductionUnits(user.id) 
          } 
        };
        
      case 'team_lead':
        // Team lead can only see teams they lead
        return { teamLeadId: user.id };
        
      case 'senior':
      case 'junior':
        // Senior/junior can only see teams they belong to
        // Get their team lead ID and find teams with that team lead
        const userTeamLeadId = await this.getUserTeamLeadId(user.id);
        if (!userTeamLeadId) {
          return { id: -1 }; // Return no teams if user has no team lead
        }
        return { teamLeadId: userTeamLeadId };
        
      case 'admin':
        // Fallback case for admin role
        return {
          productionUnit: {
            isNot: null // Only teams assigned to production units
          }
        };
        
      default:
        throw new ForbiddenException('Insufficient permissions');
    }
  }

  private async getUserProductionUnits(userId: number): Promise<number[]> {
    const productionUnits = await this.prisma.productionUnit.findMany({
      where: { headId: userId },
      select: { id: true }
    });
    return productionUnits.map(unit => unit.id);
  }

  private async getUserTeamLeadId(userId: number): Promise<number | null> {
    const user = await this.prisma.employee.findUnique({
      where: { id: userId },
      select: { teamLeadId: true }
    });
    return user?.teamLeadId || null;
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
            `Employee ${employee.firstName} ${employee.lastName} (ID: ${teamLeadId}) is already leading team "${existingTeamWithLead.name}" (ID: ${existingTeamWithLead.id}). Each employee can only lead one team at a time.`
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

    // Check for team members (employees where teamLeadId = team.teamLeadId)
    const members = existingTeam.teamLeadId ? await this.prisma.employee.findMany({
      where: { teamLeadId: existingTeam.teamLeadId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true
      }
    }) : [];

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
              employeeId: member.id,
              employeeName: `${member.firstName} ${member.lastName}`,
              email: member.email
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
      whereClause.teamsAsLead = { some: {} };
    } else if (assigned === false) {
      // Only leads NOT assigned to any team
      whereClause.teamsAsLead = { none: {} };
    } else {
      // Default behavior: Only show leads WITHOUT teams (available for assignment)
      whereClause.teamsAsLead = { none: {} };
    }

    const leads = await this.prisma.employee.findMany({
      where: whereClause,
      include: {
        teamsAsLead: {
          select: {
            id: true,
            name: true
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
        isAssigned: lead.teamsAsLead.length > 0,
        currentTeam: lead.teamsAsLead.length > 0 ? lead.teamsAsLead[0] : null
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
      // Show employees assigned to teams
      whereClause.teamLeadId = { not: null };
    } else if (assigned === false) {
      // Show employees NOT assigned to any team
      whereClause.teamLeadId = null;
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
        teamLead: {
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
      data: employees.map(employee => ({
        id: employee.id,
        firstName: employee.firstName,
        lastName: employee.lastName,
        email: employee.email,
        role: employee.role?.name || 'Unknown',
        isAssigned: employee.teamLeadId !== null,
        currentTeamLead: employee.teamLead ? {
          id: employee.teamLead.id,
          name: `${employee.teamLead.firstName} ${employee.teamLead.lastName}`
        } : null
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

    // Check if team has a team lead
    if (!team.teamLeadId) {
      throw new BadRequestException('Team must have a team lead before adding members');
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

    // Check if any employee is already in a team
    const employeesInTeams = await this.prisma.employee.findMany({
      where: {
        id: { in: employeeIds },
        teamLeadId: { not: null }
      },
      include: {
        teamLead: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    if (employeesInTeams.length > 0) {
      const conflictDetails = employeesInTeams.map(emp => 
        `${emp.firstName} ${emp.lastName} (ID: ${emp.id}) is already in team led by ${emp.teamLead?.firstName} ${emp.teamLead?.lastName}`
      );
      throw new ConflictException(
        `Cannot add employees who are already in teams: ${conflictDetails.join('; ')}`
      );
    }

    // Use transaction to ensure all operations succeed or fail together
    const result = await this.prisma.$transaction(async (tx) => {
      // Add employees to team (set their teamLeadId to team's teamLeadId)
      await tx.employee.updateMany({
        where: { id: { in: employeeIds } },
        data: { teamLeadId: team.teamLeadId }
      });

      // Update team employee count (team lead + team members)
      const totalMembers = team.teamLeadId ? await tx.employee.count({
        where: { 
          OR: [
            { id: team.teamLeadId }, // Include team lead
            { teamLeadId: team.teamLeadId } // Include team members
          ]
        }
      }) : 0;

      await tx.team.update({
        where: { id: teamId },
        data: { employeeCount: totalMembers }
      });

      // Add employees to all team projects' chat participants
      const teamProjects = await tx.project.findMany({
        where: { teamId: teamId },
        include: {
          projectChats: true
        }
      });

      for (const project of teamProjects) {
        // Only work with projects that have existing chats
        const projectChat = project.projectChats[0];
        if (projectChat) {
          for (const employeeId of employeeIds) {
            // Add employee as chat participant if not already a participant
            const existingParticipant = await tx.chatParticipant.findFirst({
              where: {
                chatId: projectChat.id,
                employeeId: employeeId
              }
            });

            if (!existingParticipant) {
              await tx.chatParticipant.create({
                data: {
                  chatId: projectChat.id,
                  employeeId: employeeId,
                  memberType: 'participant'
                }
              });
            }
          }

          // Update chat participants count
          const participantCount = await tx.chatParticipant.count({
            where: { chatId: projectChat.id }
          });

          await tx.projectChat.update({
            where: { id: projectChat.id },
            data: { participants: participantCount }
          });
        }

        // Add employees to project logs
        for (const employeeId of employeeIds) {
          const existingLog = await tx.projectLog.findFirst({
            where: {
              projectId: project.id,
              developerId: employeeId
            }
          });

          if (!existingLog) {
            await tx.projectLog.create({
              data: {
                projectId: project.id,
                developerId: employeeId
              }
            });
          }
        }
      }

      return {
        teamId: team.id,
        teamName: team.name,
        addedEmployees: employees.map(emp => ({
          id: emp.id,
          firstName: emp.firstName,
          lastName: emp.lastName
        })),
        newEmployeeCount: totalMembers,
        projectsUpdated: teamProjects.length
      };
    });

    return {
      success: true,
      message: `Successfully added ${employeeIds.length} member(s) to team "${team.name}" and all team projects`,
      data: result
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

    // Check if employee is the team lead
    if (employeeId === team.teamLeadId) {
      throw new BadRequestException(
        `Cannot remove team lead from team. Use update endpoint to change team lead instead.`
      );
    }

    // Check if employee is actually in this team
    if (employee.teamLeadId !== team.teamLeadId) {
      throw new BadRequestException(
        `Employee ${employee.firstName} ${employee.lastName} (ID: ${employeeId}) is not a member of this team`
      );
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

    // Check if employee has active tasks
    const activeTasks = await this.prisma.projectTask.findMany({
      where: {
        assignedTo: employeeId,
        status: {
          in: ['not_started', 'in_progress', 'review']
        }
      }
    });

    if (activeTasks.length > 0) {
      throw new ConflictException(
        `Cannot remove employee. ${activeTasks.length} active task(s) are assigned to this employee. ` +
        `Please reassign or complete these tasks first.`
      );
    }

    // Use transaction to ensure all operations succeed or fail together
    const result = await this.prisma.$transaction(async (tx) => {
      // Remove employee from team (set their teamLeadId to null)
      await tx.employee.update({
        where: { id: employeeId },
        data: { teamLeadId: null }
      });

      // Update team employee count (team lead + team members)
      const totalMembers = team.teamLeadId ? await tx.employee.count({
        where: { 
          OR: [
            { id: team.teamLeadId }, // Include team lead
            { teamLeadId: team.teamLeadId } // Include team members
          ]
        }
      }) : 0;

      await tx.team.update({
        where: { id: teamId },
        data: { employeeCount: totalMembers }
      });

      // Remove employee from all team projects' chat participants
      const teamProjects = await tx.project.findMany({
        where: { teamId: teamId },
        include: {
          projectChats: true
        }
      });

      for (const project of teamProjects) {
        const projectChat = project.projectChats[0];
        if (projectChat) {
          // Remove employee as chat participant
          await tx.chatParticipant.deleteMany({
            where: {
              chatId: projectChat.id,
              employeeId: employeeId
            }
          });

          // Update chat participants count
          const participantCount = await tx.chatParticipant.count({
            where: { chatId: projectChat.id }
          });

          await tx.projectChat.update({
            where: { id: projectChat.id },
            data: { participants: participantCount }
          });
        }

        // Remove employee from project logs
        await tx.projectLog.deleteMany({
          where: {
            projectId: project.id,
            developerId: employeeId
          }
        });
      }

      return {
        teamId: team.id,
        teamName: team.name,
        removedEmployee: {
          id: employee.id,
          firstName: employee.firstName,
          lastName: employee.lastName
        },
        newEmployeeCount: totalMembers,
        projectsUpdated: teamProjects.length
      };
    });

    return {
      success: true,
      message: `Employee ${employee.firstName} ${employee.lastName} successfully removed from team "${team.name}" and all team projects`,
      data: result
    };
  }

  private async getSingleTeamWithDetails(teamId: number, user: any) {
    return await this.getTeam(teamId, user);
  }
}