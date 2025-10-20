import { Injectable, BadRequestException, ConflictException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { CreateProductionUnitDto } from './dto/create-unit.dto';
import { UpdateProductionUnitDto } from './dto/update-unit.dto';
import { UnitsQueryDto } from './dto/units-query.dto';

@Injectable()
export class UnitsService {
  constructor(private prisma: PrismaService) {}

  async createUnit(createUnitDto: CreateProductionUnitDto) {
    const { name, headId } = createUnitDto;

    // Validate headId if provided
    if (headId !== undefined && headId !== null) {
      if (isNaN(headId) || headId <= 0) {
        throw new BadRequestException('Head ID must be a valid positive number');
      }

      // Check if employee exists
      const employee = await this.prisma.employee.findUnique({
        where: { id: headId },
        include: { role: true }
      });

      if (!employee) {
        throw new BadRequestException(`Employee with ID ${headId} does not exist`);
      }

      // Check if employee has unit_head role
      if (employee.role.name !== 'unit_head') {
        throw new BadRequestException('Employee must have unit_head role to be assigned as unit head');
      }

      // Check if employee is already head of another production unit
      const existingUnitWithHead = await this.prisma.productionUnit.findFirst({
        where: { headId: headId }
      });

      if (existingUnitWithHead) {
        throw new ConflictException(
          `Each employee can only be the head of one production unit at a time. `
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
      message: 'New Production Unit Created Successfully'
    };
  }

  async getAllUnits(user: any, query: UnitsQueryDto) {
    const whereClause: any = this.buildRoleBasedWhereClause(user);
    
    // Apply all filters from query
    if (query.unitId) {
      whereClause.id = query.unitId;
    }
    
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

    const include = this.buildIncludeClause(query.include);

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
          ...include
        },
        orderBy,
        skip,
        take
      }),
      this.prisma.productionUnit.count({ where: whereClause })
    ]);

    // Get counts for each unit
    const unitsWithCounts = await Promise.all(
      units.map(async (unit) => {
        const teamsCount = await this.prisma.team.count({
          where: { productionUnitId: unit.id }
        });

        const employeesCount = await this.prisma.production.count({
          where: { productionUnitId: unit.id }
        });

        return {
          ...unit,
          teamsCount,
          employeesCount
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

  async getUnit(id: number) {
    const unit = await this.prisma.productionUnit.findUnique({
      where: { id },
      include: {
        head: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    if (!unit) {
      throw new NotFoundException(`Unit with ID ${id} does not exist`);
    }

    // Get counts
    const teamsCount = await this.prisma.team.count({
      where: { productionUnitId: unit.id }
    });

    const employeesCount = await this.prisma.production.count({
      where: { productionUnitId: unit.id }
    });

    return {
      success: true,
      data: {
        ...unit,
        teamsCount,
        employeesCount
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
            `Employee ${employee.firstName} ${employee.lastName} (ID: ${headId}) is already the head of production unit "${existingUnitWithHead.name}" (ID: ${existingUnitWithHead.id}). ` +
            `Each employee can only be the head of one production unit at a time. ` +
            `Please either assign a different employee as head or remove this employee from their current unit first.`
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
    }
    // If assigned is undefined, show all (no additional filter)

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
}