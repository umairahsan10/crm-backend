import { Injectable, BadRequestException, ConflictException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { CreateProductionUnitDto } from './dto/create-unit.dto';
import { UnitsQueryDto } from './dto/units-query.dto';

@Injectable()
export class UnitsService {
  constructor(private prisma: PrismaService) {}

  async createUnit(createUnitDto: CreateProductionUnitDto) {
    const { name, headId, newTeamLeadId } = createUnitDto;

    // Check if unit name already exists
    const existingUnit = await this.prisma.productionUnit.findUnique({
      where: { name }
    });

    if (existingUnit) {
      throw new ConflictException('Unit name already exists');
    }

    // Validate headId employee exists
    const headEmployee = await this.prisma.employee.findUnique({
      where: { id: headId },
      include: { 
        role: true,
        department: true,
        teamLead: true,
        teamMembers: true
      }
    });

    if (!headEmployee) {
      throw new BadRequestException(`Employee with ID ${headId} does not exist`);
    }

    // Check if employee belongs to Production department
    if (headEmployee.department.name !== 'Production') {
      throw new BadRequestException('Employee must belong to Production department');
    }

    // Check if employee is active
    if (headEmployee.status !== 'active') {
      throw new BadRequestException('Employee must be active to be promoted');
    }

    // Determine scenario based on newTeamLeadId presence
    if (newTeamLeadId) {
      // Scenario 1: Team Lead Promotion
      return await this.handleTeamLeadPromotion(name, headId, newTeamLeadId, headEmployee);
    } else {
      // Scenario 2: Direct Promotion (Senior/Junior to Unit Head)
      return await this.handleDirectPromotion(name, headId, headEmployee);
    }
  }

  private async handleTeamLeadPromotion(
    unitName: string, 
    headId: number, 
    newTeamLeadId: number, 
    headEmployee: any
  ) {
    // Validate that headId is actually a team lead
    if (headEmployee.role.name !== 'team_lead') {
      throw new BadRequestException('Head employee must be a team lead for team lead promotion scenario');
    }

    // Check if team lead is actually leading a team
    if (!headEmployee.teamMembers || headEmployee.teamMembers.length === 0) {
      throw new BadRequestException('Employee is not currently leading any team');
    }

    // Validate new team lead employee
    const newTeamLeadEmployee = await this.prisma.employee.findUnique({
      where: { id: newTeamLeadId },
      include: { 
        role: true,
        department: true,
        teamLead: true
      }
    });

    if (!newTeamLeadEmployee) {
      throw new BadRequestException(`New team lead employee with ID ${newTeamLeadId} does not exist`);
    }

    // Check if new team lead is senior or junior
    if (!['senior', 'junior'].includes(newTeamLeadEmployee.role.name)) {
      throw new BadRequestException('New team lead must be a senior or junior employee');
    }

    // Check if new team lead belongs to Production department
    if (newTeamLeadEmployee.department.name !== 'Production') {
      throw new BadRequestException('New team lead must belong to Production department');
    }

    // Check if new team lead is active
    if (newTeamLeadEmployee.status !== 'active') {
      throw new BadRequestException('New team lead must be active');
    }

    // Check if new team lead is already a team lead
    if (newTeamLeadEmployee.role.name === 'team_lead') {
      throw new BadRequestException('New team lead cannot already be a team lead');
    }

    // Get the team that the current team lead is leading
    const currentTeam = await this.prisma.team.findFirst({
      where: { teamLeadId: headId }
    });

    if (!currentTeam) {
      throw new BadRequestException('Current team lead is not assigned to any team');
    }

    // Start transaction for all role changes and unit creation
    return await this.prisma.$transaction(async (tx) => {
      // 1. Get unit_head role ID
      const unitHeadRole = await tx.role.findUnique({
        where: { name: 'unit_head' }
      });

      if (!unitHeadRole) {
        throw new BadRequestException('Unit head role not found in system');
      }

      // 2. Get team_lead role ID  
      const teamLeadRole = await tx.role.findUnique({
        where: { name: 'team_lead' }
      });

      if (existingUnitWithHead) {
        throw new ConflictException(
          `Employee ${employee.firstName} ${employee.lastName} (ID: ${headId}) is already the head of production unit "${existingUnitWithHead.name}" (ID: ${existingUnitWithHead.id}). Each employee can only be the head of one production unit at a time. Please remove this employee from their current unit first or choose a different employee.`
        );
      }
    }

    // Check if name already exists
    const existingName = await this.prisma.productionUnit.findUnique({
      where: { name }
    });

    if (existingName) {
      throw new ConflictException('Unit name already exists');
    }

    // Create the production unit
    const newUnit = await this.prisma.productionUnit.create({
      data: {
        name,
        headId
      }
    });

      return {
        success: true,
        message: `Production unit "${unitName}" created successfully with direct promotion`,
        data: {
          unitId: newUnit.id,
          unitName: newUnit.name,
          promotedEmployee: {
            id: headId,
            name: `${headEmployee.firstName} ${headEmployee.lastName}`,
            previousRole: headEmployee.role.name,
            newRole: 'unit_head'
          }
        }
      };
    });
  }

  async getAllUnits(user: any, query: UnitsQueryDto) {
    // Check if single unit request (by ID)
    if (query.unitId) {
      return await this.getSingleUnitWithDetails(query.unitId, user);
    }

    const whereClause: any = this.buildRoleBasedWhereClause(user);
    
    // Apply filters from query
    if (query.hasHead !== undefined) {
      whereClause.headId = query.hasHead ? { not: null } : null;
    }
    
    if (query.hasTeams !== undefined) {
      if (query.hasTeams) {
        whereClause.teams = { some: {} };
      } else {
        whereClause.teams = { none: {} };
      }
    }
    
    if (query.hasProjects !== undefined) {
      if (query.hasProjects) {
        whereClause.teams = {
          some: {
            projects: { some: {} }
          }
        };
      } else {
        whereClause.teams = {
          none: {
            projects: { some: {} }
          }
        };
      }
    }

    const orderBy = {};
    if (query.sortBy) {
      orderBy[query.sortBy] = query.sortOrder || 'asc';
    } else {
      orderBy['name'] = 'asc';
    }

    const skip = query.page ? (query.page - 1) * (query.limit || 10) : 0;
    const take = query.limit || 10;

    const [units, total] = await Promise.all([
      this.prisma.productionUnit.findMany({
        where: whereClause,
        include: {
          head: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          },
          _count: {
            select: {
              teams: true,
              productionEmployees: true
            }
          }
        },
        orderBy,
        skip,
        take
      }),
      this.prisma.productionUnit.count({ where: whereClause })
    ]);

    // Get project counts for each unit
    const unitsWithCounts = await Promise.all(
      units.map(async (unit) => {
        const teamsCount = await this.prisma.team.count({
          where: { productionUnitId: unit.id }
        });

        const employeesCount = await this.prisma.production.count({
          where: { productionUnitId: unit.id }
        });

        // Get projects count from projects table where team belongs to this unit
        const projectsCount = await this.prisma.project.count({
          where: {
            team: {
              productionUnitId: unit.id
            }
          }
        });

        return {
          ...unit,
          teamsCount,
          employeesCount,
          projectsCount
        };
      })
    );

    return {
      success: true,
      data: unitsWithCounts,
      total,
      pagination: {
        page: query.page || 1,
        limit: query.limit || 10,
        totalPages: Math.ceil(total / (query.limit || 10))
      },
      message: unitsWithCounts.length > 0 ? 'Units retrieved successfully' : 'No units found'
    };
  }

  async getUnit(id: number, user?: any) {
    const unit = await this.prisma.productionUnit.findUnique({
      where: { id },
      include: {
        head: {
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
        teams: {
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
            }
          }
        }
      }
    });

    if (!unit) {
      throw new NotFoundException(`Unit with ID ${unitId} does not exist or you don't have access to it`);
    }

    // Check if user belongs to this unit (for all roles except dep_manager)
    if (user && user.role !== 'dep_manager') {
      const belongsToUnit = await this.checkUserBelongsToUnit(user, unit.id);
      if (!belongsToUnit) {
        throw new ForbiddenException('You do not have access to this unit. You must be a member of this unit to view its details.');
      }
    }

    // Apply role-based filtering for teams and projects
    let filteredTeams = unit.teams;
    let filteredProjects: any[] = [];
    let filteredProductionEmployees: any[] = [];

    if (user && ['team_lead', 'senior', 'junior'].includes(user.role)) {
      // For team_lead, senior, junior - only show teams they are part of
      if (user.role === 'team_lead') {
        // Team leads see only teams they lead
        filteredTeams = unit.teams.filter(team => team.teamLeadId === user.id);
      } else if (['senior', 'junior'].includes(user.role)) {
        // For senior/junior, check if they are production employees in this unit
        const isProductionEmployee = await this.prisma.production.findFirst({
          where: {
            productionUnitId: unit.id,
            employeeId: user.id
          }
        });

        if (!isProductionEmployee) {
          // If not a production employee in this unit, show no teams/projects
          filteredTeams = [];
        } else {
          // If they are production employees, show all teams in the unit
          // (since they work in the unit, they can see all teams)
          filteredTeams = unit.teams;
        }
      }

      // Get projects only for the filtered teams
      if (filteredTeams.length > 0) {
        const filteredTeamIds = filteredTeams.map(team => team.id);
        
        filteredProjects = await this.prisma.project.findMany({
          where: {
            teamId: { in: filteredTeamIds }
          },
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

        // For senior/junior, also filter production employees to only show themselves
        if (['senior', 'junior'].includes(user.role)) {
          filteredProductionEmployees = await this.prisma.production.findMany({
            where: { 
              productionUnitId: unit.id,
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
      }
    } else {
      // For dep_manager and unit_head - show all data (no filtering)
      filteredProjects = await this.prisma.project.findMany({
        where: {
          team: {
            productionUnitId: unit.id
          }
        },
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

      // Get all production employees for managers/unit heads
      filteredProductionEmployees = await this.prisma.production.findMany({
        where: { productionUnitId: unit.id },
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

    // Get production employees count (always show total count)
    const employeesCount = await this.prisma.production.count({
      where: { productionUnitId: unit.id }
    });

    return {
      success: true,
      data: {
        ...unit,
        teams: filteredTeams, // Filtered teams based on user role
        teamsCount: filteredTeams.length, // Count of filtered teams
        employeesCount,
        projectsCount: filteredProjects.length, // Count of filtered projects
        allProjects: filteredProjects, // Filtered projects based on user role
        productionEmployees: filteredProductionEmployees // Filtered employees based on user role
      },
      message: 'Unit details retrieved successfully'
    };
  }



  private async checkUserBelongsToUnit(user: any, unitId: number): Promise<boolean> {
    switch (user.role) {
      case 'unit_head':
        // Check if user is the head of this unit
        const unit = await this.prisma.productionUnit.findFirst({
          where: {
            id: unitId,
            headId: user.id
          }
        });
        return !!unit;

      case 'team_lead':
        // Check if user leads any team in this unit
        const teamLeadCheck = await this.prisma.team.findFirst({
          where: {
            productionUnitId: unitId,
            teamLeadId: user.id
          }
        });
        return !!teamLeadCheck;

      case 'senior':
      case 'junior':
        // Check if user is a production employee in this unit
        const productionEmployeeCheck = await this.prisma.production.findFirst({
          where: {
            productionUnitId: unitId,
            employeeId: user.id
          }
        });
        return !!productionEmployeeCheck;

      default:
        return false;
    }
  }

  private buildRoleBasedWhereClause(user: any): any {
    switch (user.role) {
      case 'dep_manager':
        return {}; // Can see all units
      case 'unit_head':
        return { headId: user.id }; // Only their unit
      case 'team_lead':
        return {
          teams: {
            some: {
              teamLeadId: user.id
            }
          }
        }; // Units where they lead teams
      case 'senior':
      case 'junior':
        return {
          productionEmployees: {
            some: {
              employeeId: user.id
            }
          }
        }; // Units where they are production employees
      default:
        throw new ForbiddenException('Insufficient permissions');
    }
  }

  private buildIncludeClause(include?: string): any {
    const includeClause: any = {};
    
    if (include?.includes('employees')) {
      includeClause.productionEmployees = {
        include: {
          employee: {
            include: {
              role: true
            }
          }
        }
      };
    }
    
    if (include?.includes('projects')) {
      includeClause.teams = {
        include: {
          projects: {
            include: {
              client: true
            }
          }
        }
      };
    }
    
    if (include?.includes('teams')) {
      includeClause.teams = {
        include: {
          teamLead: true
        }
      };
    }
    
    return includeClause;
  }

  async updateUnit(id: number, updateUnitDto: UpdateProductionUnitDto, user?: any) {
    // Validate that updateUnitDto is provided
    if (!updateUnitDto) {
      throw new BadRequestException('Request body is required for update operation');
    }

    // Check if unit exists
    const existingUnit = await this.prisma.productionUnit.findUnique({
      where: { id }
    });

    if (!existingUnit) {
      throw new NotFoundException(`Unit with ID ${id} does not exist`);
    }

    // Role-based access control
    if (user && user.role === 'unit_head' && existingUnit.headId !== user.id) {
      throw new ForbiddenException('You can only update your own unit');
    }

    const { name, headId } = updateUnitDto;

    // Check if at least one field is provided for update
    if (name === undefined && headId === undefined) {
      throw new BadRequestException('At least one field (name or headId) must be provided for update');
    }

    // Validate headId if provided
    if (headId !== undefined) {
      if (headId === null) {
        // Setting headId to NULL - check if all teams have team leads
        const teamsWithoutTeamLead = await this.prisma.team.findMany({
          where: {
            productionUnitId: id,
            teamLeadId: null
          },
          select: { id: true, name: true }
        });

        if (teamsWithoutTeamLead.length > 0) {
          throw new BadRequestException(
            `Cannot remove unit head. ${teamsWithoutTeamLead.length} team(s) do not have team leads assigned. ` +
            `Please assign team leads to all teams before removing the unit head to avoid workflow disruption. ` +
            `Affected teams: ${teamsWithoutTeamLead.map(t => `ID ${t.id}`).join(', ')}`
          );
        }
      } else {
        // Assigning a new head
        const employee = await this.prisma.employee.findUnique({
          where: { id: headId },
          include: { role: true }
        });

        if (!employee) {
          throw new BadRequestException(`Employee with ID ${headId} does not exist`);
        }

        if (employee.role.name !== 'unit_head') {
          throw new BadRequestException('Employee must have unit_head role to be assigned as unit head');
        }

        // Check if employee is already head of another production unit (excluding current unit)
        const existingUnitWithHead = await this.prisma.productionUnit.findFirst({
          where: { 
            headId: headId,
            id: { not: id } // Exclude current unit from check
          }
        });

        if (existingUnitWithHead) {
          throw new ConflictException(
            `Employee ${employee.firstName} ${employee.lastName} (ID: ${headId}) is already the head of production unit "${existingUnitWithHead.name}" (ID: ${existingUnitWithHead.id}). Each employee can only be the head of one production unit at a time. Please remove this employee from their current unit first or choose a different employee.`
          );
        }
      }
    }

    // Check name uniqueness if provided
    if (name) {
      const existingName = await this.prisma.productionUnit.findFirst({
        where: {
          name,
          id: { not: id }
        }
      });

      if (existingName) {
        throw new ConflictException('Unit name already exists');
      }
    }

    // Update the unit
    await this.prisma.productionUnit.update({
      where: { id },
      data: updateUnitDto
    });

    return {
      success: true,
      message: 'Unit updated successfully'
    };
  }

  async deleteUnit(id: number) {
    // Check if unit exists
    const existingUnit = await this.prisma.productionUnit.findUnique({
      where: { id }
    });

    if (!existingUnit) {
      throw new NotFoundException(`Unit with ID ${id} does not exist`);
    }

    // Check for teams associated with this unit with detailed information
    const teams = await this.prisma.team.findMany({
      where: { productionUnitId: id },
      include: {
        teamLead: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        projects: {
          select: {
            id: true,
            description: true,
            status: true,
            deadline: true
          }
        }
      }
    });

    // Unit can only be deleted if it has NO teams
    if (teams.length > 0) {
      // Get total projects count for this unit
      const totalProjects = teams.reduce((sum, team) => sum + team.projects.length, 0);
      
      return {
        success: false,
        message: `Cannot delete unit "${existingUnit.name}". Unit has ${teams.length} team(s) and ${totalProjects} project(s). Please remove all teams first.`,
        unitInfo: {
          id: existingUnit.id,
          name: existingUnit.name,
          headId: existingUnit.headId
        },
        dependencies: {
          teams: {
            count: teams.length,
            details: teams.map(team => ({
              id: team.id,
              name: team.name,
              employeeCount: team.employeeCount,
              teamLead: team.teamLead ? {
                id: team.teamLead.id,
                name: `${team.teamLead.firstName} ${team.teamLead.lastName}`,
                email: team.teamLead.email
              } : null,
              projectsCount: team.projects.length,
              projects: team.projects.map(project => ({
                id: project.id,
                description: project.description,
                status: project.status,
                deadline: project.deadline
              }))
            }))
          },
          summary: {
            totalTeams: teams.length,
            totalProjects: totalProjects,
            teamsWithProjects: teams.filter(team => team.projects.length > 0).length,
            teamsWithoutProjects: teams.filter(team => team.projects.length === 0).length
          }
        },
        instructions: [
          "To delete this unit, you must first:",
          "1. Remove all teams from this unit using DELETE /production/units/:id/teams/:teamId",
          "2. Or reassign teams to other units",
          "3. Once all teams are removed, the unit can be deleted"
        ]
      };
    }

    // If no teams, proceed with deletion
    await this.prisma.productionUnit.delete({
      where: { id }
    });

    return {
      success: true,
      message: 'Unit deleted successfully'
    };
  }


  async getAvailableHeads(assigned?: boolean) {
    let whereClause: any = {
      role: { name: 'unit_head' },
      department: { name: 'Production' },
      status: 'active'
    };

    if (assigned === true) {
      // Only heads assigned to Production units
      whereClause.productionUnitHead = { some: {} };
    } else if (assigned === false) {
      // Only heads NOT assigned to any Production unit
      whereClause.productionUnitHead = { none: {} };
    } else {
      // Default behavior: Only show heads WITHOUT units (available for assignment)
      whereClause.productionUnitHead = { none: {} };
    }

    const heads = await this.prisma.employee.findMany({
      where: whereClause,
      include: {
        productionUnitHead: {
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
      data: heads.map(head => ({
        id: head.id,
        firstName: head.firstName,
        lastName: head.lastName,
        email: head.email,
        isAssigned: head.productionUnitHead.length > 0,
        currentUnit: head.productionUnitHead.length > 0 ? head.productionUnitHead[0] : null
      })),
      total: heads.length,
      message: heads.length > 0 
        ? 'Available heads retrieved successfully' 
        : 'No available heads found'
    };
  }

  async getAvailableTeams(assigned?: boolean) {
    const whereClause: any = {};

    if (assigned === true) {
      // Show teams assigned to production units
      whereClause.productionUnitId = { not: null };
    } else if (assigned === false) {
      // Show orphan teams (not assigned to any unit)
      whereClause.productionUnitId = null;
      whereClause.salesUnitId = null;
      whereClause.marketingUnitId = null;
    }
    // If assigned is undefined, show all teams (no additional filter)

    const teams = await this.prisma.team.findMany({
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
        salesUnit: {
          select: {
            id: true,
            name: true
          }
        },
        marketingUnit: {
          select: {
            id: true,
            name: true
          }
        },
        projects: {
          select: {
            id: true,
            description: true,
            status: true
          }
        }
      },
      orderBy: [
        { name: 'asc' }
      ]
    });

    return {
      success: true,
      data: teams.map(team => ({
        id: team.id,
        name: team.name,
        employeeCount: team.employeeCount,
        teamLead: team.teamLead,
        isAssigned: team.productionUnitId !== null || team.salesUnitId !== null || team.marketingUnitId !== null,
        currentUnit: team.productionUnit || team.salesUnit || team.marketingUnit,
        projectsCount: team.projects.length,
        projects: team.projects
      })),
      total: teams.length,
      message: teams.length > 0 
        ? 'Available teams retrieved successfully' 
        : 'No available teams found'
    };
  }

  async addTeamToUnit(unitId: number, teamId: number) {
    // Validate unit exists
    const unit = await this.prisma.productionUnit.findUnique({
      where: { id: unitId }
    });

    if (!unit) {
      throw new NotFoundException(`Unit with ID ${unitId} does not exist`);
    }

    // Validate team exists
    const team = await this.prisma.team.findUnique({
      where: { id: teamId }
    });

    if (!team) {
      throw new NotFoundException(`Team with ID ${teamId} does not exist`);
    }

    // Check if team is orphan (not assigned to any unit)
    if (team.productionUnitId !== null || team.salesUnitId !== null || team.marketingUnitId !== null) {
      throw new BadRequestException(
        `Team "${team.name}" (ID: ${teamId}) is already assigned to a unit. ` +
        `Only orphan teams (not assigned to any unit) can be assigned to a production unit.`
      );
    }

    // Assign team to unit
    await this.prisma.team.update({
      where: { id: teamId },
      data: { productionUnitId: unitId }
    });

    return {
      success: true,
      message: `Team "${team.name}" successfully assigned to unit "${unit.name}"`
    };
  }

  async removeTeamFromUnit(unitId: number, teamId: number) {
    // Validate unit exists
    const unit = await this.prisma.productionUnit.findUnique({
      where: { id: unitId }
    });

    if (!unit) {
      throw new NotFoundException(`Unit with ID ${unitId} does not exist`);
    }

    // Validate team exists
    const team = await this.prisma.team.findUnique({
      where: { id: teamId }
    });

    if (!team) {
      throw new NotFoundException(`Team with ID ${teamId} does not exist`);
    }

    // Verify team belongs to this unit
    if (team.productionUnitId !== unitId) {
      throw new BadRequestException(
        `Team "${team.name}" (ID: ${teamId}) does not belong to unit "${unit.name}" (ID: ${unitId})`
      );
    }

    // Remove team from unit
    await this.prisma.team.update({
      where: { id: teamId },
      data: { productionUnitId: null }
    });

    return {
      success: true,
      message: `Team "${team.name}" successfully removed from unit "${unit.name}"`
    };
  }
}