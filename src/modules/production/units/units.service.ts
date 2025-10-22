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

      if (!teamLeadRole) {
        throw new BadRequestException('Team lead role not found in system');
      }

      // 3. Promote current team lead to unit head
      await tx.employee.update({
        where: { id: headId },
        data: { 
          roleId: unitHeadRole.id,
          
        }
      });

      // 4. Promote new team lead (role only, keep teamLeadId for now)
      await tx.employee.update({
        where: { id: newTeamLeadId },
        data: { 
          roleId: teamLeadRole.id
        }
      });

      // 5. Update team with new team lead
      await tx.team.update({
        where: { id: currentTeam.id },
        data: { teamLeadId: newTeamLeadId }
      });

      // 6. Update all team members to point to new team lead
      console.log(`🔍 Step 6: Updating all employees with teamLeadId ${headId} to ${newTeamLeadId}`);
      
      // First, let's see which employees will be affected
      const employeesToUpdate = await tx.employee.findMany({
        where: { teamLeadId: headId },
        select: { id: true, firstName: true, lastName: true, teamLeadId: true }
      });
      console.log(`🔍 Employees that will be updated:`, employeesToUpdate);
      
      const updateResult = await tx.employee.updateMany({
        where: { teamLeadId: headId },
        data: { teamLeadId: newTeamLeadId }
      });
      console.log(`🔍 Updated ${updateResult.count} employees`);

      // Check new team lead's teamLeadId after the updateMany
      const newTeamLeadAfter = await tx.employee.findUnique({
        where: { id: newTeamLeadId },
        select: { id: true, teamLeadId: true, role: { select: { name: true } } }
      });
      console.log(`🔍 New team lead ${newTeamLeadId} after team member updates:`, newTeamLeadAfter);

      // 7. Ensure new team lead has teamLeadId as null (they are the team lead)
      await tx.employee.update({
        where: { id: newTeamLeadId },
        data: { 
          teamLeadId: null
        }
      });

      // 8. Create new production unit with promoted employee as head
      const newUnit = await tx.productionUnit.create({
        data: {
          name: unitName,
          headId: headId
        }
      });

      return {
        success: true,
        message: `Production unit "${unitName}" created successfully with team lead promotion`,
        data: {
          unitId: newUnit.id,
          unitName: newUnit.name,
          promotedEmployee: {
            id: headId,
            name: `${headEmployee.firstName} ${headEmployee.lastName}`,
            newRole: 'unit_head'
          },
          newTeamLead: {
            id: newTeamLeadId,
            name: `${newTeamLeadEmployee.firstName} ${newTeamLeadEmployee.lastName}`,
            newRole: 'team_lead'
          },
          originalTeam: {
            id: currentTeam.id,
            name: currentTeam.name,
            newTeamLeadId: newTeamLeadId
          }
        }
      };
    });
  }

  private async handleDirectPromotion(
    unitName: string, 
    headId: number, 
    headEmployee: any
  ) {
    // Validate that headId is senior or junior
    if (!['senior', 'junior'].includes(headEmployee.role.name)) {
      throw new BadRequestException('Employee must be a senior or junior for direct promotion to unit head');
    }

    // Start transaction for role change and unit creation
    return await this.prisma.$transaction(async (tx) => {
      // 1. Get unit_head role ID
      const unitHeadRole = await tx.role.findUnique({
        where: { name: 'unit_head' }
      });

      if (!unitHeadRole) {
        throw new BadRequestException('Unit head role not found in system');
      }

      // 2. Promote employee to unit head
      await tx.employee.update({
        where: { id: headId },
        data: { 
          roleId: unitHeadRole.id,
          teamLeadId: null // Remove from any team
        }
      });

      // 3. Create new production unit with promoted employee as head
      const newUnit = await tx.productionUnit.create({
        data: {
          name: unitName,
          headId: headId
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
        const projectsCount = await this.prisma.project.count({
          where: {
            teams: {
              some: {
                productionUnitId: unit.id
              }
            },
            status: {
              in: ['in_progress', 'onhold'] // Only active projects
            }
          }
        });

        return {
          ...unit,
          teamsCount: (unit as any)._count?.teams || 0,
          employeesCount: (unit as any)._count?.productionEmployees || 0,
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

  async getSingleUnitWithDetails(unitId: number, user: any) {
    // Check if user has access to this unit
    const whereClause = this.buildRoleBasedWhereClause(user);
    whereClause.id = unitId;

    const unit = await this.prisma.productionUnit.findFirst({
      where: whereClause,
      include: {
        head: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        _count: {
          select: {
            teams: true,
            productionEmployees: true
          }
        }
      }
    });

    if (!unit) {
      throw new NotFoundException(`Unit with ID ${unitId} does not exist or you don't have access to it`);
    }

    // Get teams with limited details
    const teams = await this.prisma.team.findMany({
      where: { productionUnitId: unitId },
      include: {
        teamLead: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        _count: {
          select: {
            projects: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    // Get projects with limited details (only active projects)
    const projects = await this.prisma.project.findMany({
      where: {
        teams: {
          some: {
            productionUnitId: unitId
          }
        },
        status: {
          in: ['in_progress', 'onhold'] // Only active projects
        }
      },
      include: {
        client: {
          select: {
            id: true,
            clientName: true,
            companyName: true
          }
        },
        team: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Get employee count for each team
    const teamsWithMemberCount = await Promise.all(
      teams.map(async (team) => {
        const memberCount = await this.prisma.employee.count({
          where: { teamLeadId: team.teamLeadId }
        });

        return {
          ...team,
          employeeCount: memberCount + (team.teamLeadId ? 1 : 0), // +1 for team lead
          projectsCount: (team as any)._count?.projects || 0
        };
      })
    );

    return {
      success: true,
      data: {
        ...unit,
        teamsCount: (unit as any)._count?.teams || 0,
        employeesCount: (unit as any)._count?.productionEmployees || 0,
        projectsCount: projects.length,
        teams: teamsWithMemberCount,
        projects: projects.map(project => ({
          id: project.id,
          description: project.description,
          status: project.status,
          deadline: project.deadline,
          liveProgress: project.liveProgress,
          difficultyLevel: project.difficultyLevel,
          paymentStage: project.paymentStage,
          client: project.client,
          team: project.team,
          createdAt: project.createdAt,
          updatedAt: project.updatedAt
        }))
      },
      message: 'Unit details retrieved successfully'
    };
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
          teams: {
            some: {
              teamMembers: {
                some: {
                  id: user.id
                }
              }
            }
          }
        }; // Units where they are team members
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


  async deleteUnit(id: number) {
    // Check if unit exists
    const existingUnit = await this.prisma.productionUnit.findUnique({
      where: { id }
    });

    if (!existingUnit) {
      throw new NotFoundException(`Unit with ID ${id} does not exist`);
    }

    // Check for teams associated with this unit
    const teams = await this.prisma.team.findMany({
      where: { productionUnitId: id },
      select: { id: true, name: true }
    });

    // Check for active projects associated with this unit through teams
    const teamIds = teams.map(team => team.id);
    const activeProjects = await this.prisma.project.findMany({
      where: {
        teams: {
          some: {
            id: { in: teamIds }
          }
        },
        status: {
          in: ['in_progress', 'onhold']  // Only active projects block deletion
        }
      },
      select: { id: true, description: true, status: true }
    });

    // Also get completed projects for informational purposes
    const completedProjects = await this.prisma.project.findMany({
      where: {
        teams: {
          some: {
            id: { in: teamIds }
          }
        },
        status: 'completed'
      },
      select: { id: true, description: true, status: true }
    });

    // Check for production employees associated with this unit
    const productionEmployees = await this.prisma.production.findMany({
      where: { productionUnitId: id },
      include: {
        employee: {
          select: { id: true, firstName: true, lastName: true }
        }
      }
    });

    // Check if there are any dependencies
    const hasDependencies = teams.length > 0 || activeProjects.length > 0 || productionEmployees.length > 0;

    if (hasDependencies) {
      // Return detailed dependency information
      return {
        success: false,
        message: 'Cannot delete unit. Please reassign dependencies first.',
        dependencies: {
          teams: {
            count: teams.length,
            details: teams.map(team => ({
              id: team.id,
              name: team.name
            }))
          },
          projects: {
            count: activeProjects.length,
            details: activeProjects.map(project => ({
              id: project.id,
              description: project.description,
              status: project.status
            }))
          },
          employees: {
            count: productionEmployees.length,
            details: productionEmployees.map(emp => ({
              id: emp.employee.id,
              firstName: emp.employee.firstName,
              lastName: emp.employee.lastName
            }))
          }
        }
      };
    }

    // If no dependencies, proceed with deletion
    await this.prisma.productionUnit.delete({
      where: { id }
    });

    return {
      success: true,
      message: 'Unit deleted successfully'
    };
  }


}