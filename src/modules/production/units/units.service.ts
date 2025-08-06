import { Injectable, BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { CreateUnitDto } from './dto/create-unit.dto';
import { UpdateUnitDto } from './dto/update-unit.dto';

@Injectable()
export class UnitsService {
  constructor(private prisma: PrismaService) {}

  async createUnit(createUnitDto: CreateUnitDto) {
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

  async getAllUnits() {
    const units = await this.prisma.productionUnit.findMany({
      include: {
        head: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

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
      total: unitsWithCounts.length,
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

  async getTeamsInUnit(id: number, currentUser: any) {
    // Check if unit exists
    const unit = await this.prisma.productionUnit.findUnique({
      where: { id }
    });

    if (!unit) {
      throw new NotFoundException(`Unit with ID ${id} does not exist`);
    }

    // Security check for unit_head - can only access their own unit
    if (currentUser.role === 'unit_head' && currentUser.id !== unit.headId) {
      return {
        success: false,
        message: 'You can only access your own unit'
      };
    }

    const teams = await this.prisma.team.findMany({
      where: { productionUnitId: id },
      include: {
        teamLead: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        currentProject: {
          select: {
            id: true,
            description: true,
            liveProgress: true,
            deadline: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    // Add employee count for each team
    const teamsWithCounts = await Promise.all(
      teams.map(async (team) => {
        const employeeCount = await this.prisma.production.count({
          where: { productionUnitId: id }
        });

        return {
          ...team,
          employeeCount
        };
      })
    );

    return {
      success: true,
      data: teamsWithCounts,
      total: teamsWithCounts.length,
      message: teamsWithCounts.length > 0 ? 'Teams retrieved successfully' : 'No teams found in this unit'
    };
  }

  async getEmployeesInUnit(id: number, currentUser: any) {
    // Check if unit exists
    const unit = await this.prisma.productionUnit.findUnique({
      where: { id }
    });

    if (!unit) {
      throw new NotFoundException(`Unit with ID ${id} does not exist`);
    }

    // Security check for unit_head - can only access their own unit
    if (currentUser.role === 'unit_head' && currentUser.id !== unit.headId) {
      return {
        success: false,
        message: 'You can only access your own unit'
      };
    }

    const employees = await this.prisma.production.findMany({
      where: { productionUnitId: id },
      include: {
        employee: {
          include: {
            role: true
          }
        }
      },
      orderBy: [
        { employee: { firstName: 'asc' } },
        { employee: { lastName: 'asc' } }
      ]
    });

    // Format the response
    const formattedEmployees = employees.map(prod => ({
      id: prod.employee.id,
      firstName: prod.employee.firstName,
      lastName: prod.employee.lastName,
      email: prod.employee.email,
      phone: prod.employee.phone,
      role: {
        id: prod.employee.role.id,
        name: prod.employee.role.name
      },
      specialization: prod.specialization,
      projectsCompleted: prod.projectsCompleted,
      startDate: prod.createdAt
    }));

    return {
      success: true,
      data: formattedEmployees,
      total: formattedEmployees.length,
      message: formattedEmployees.length > 0 ? 'Employees retrieved successfully' : 'No employees found in this unit'
    };
  }

  async getProjectsInUnit(id: number, currentUser: any) {
    // Check if unit exists
    const unit = await this.prisma.productionUnit.findUnique({
      where: { id }
    });

    if (!unit) {
      throw new NotFoundException(`Unit with ID ${id} does not exist`);
    }

    // Security check for unit_head - can only access their own unit
    if (currentUser.role === 'unit_head' && currentUser.id !== unit.headId) {
      return {
        success: false,
        message: 'You can only access your own unit'
      };
    }

    // Get projects through teams in this unit
    const teams = await this.prisma.team.findMany({
      where: { productionUnitId: id },
      select: { id: true }
    });

    const teamIds = teams.map(team => team.id);

    const projects = await this.prisma.project.findMany({
      where: {
        OR: [
          { teamLeadId: { in: teamIds } },
          { unitHeadId: unit.headId }
        ]
      },
      include: {
        teamLead: {
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
        client: {
          select: {
            id: true,
            companyName: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return {
      success: true,
      data: projects,
      total: projects.length,
      message: projects.length > 0 ? 'Projects retrieved successfully' : 'No projects found in this unit'
    };
  }

  async updateUnit(id: number, updateUnitDto: UpdateUnitDto) {
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

    const { name, headId } = updateUnitDto;

    // Check if at least one field is provided for update
    if (name === undefined && headId === undefined) {
      throw new BadRequestException('At least one field (name or headId) must be provided for update');
    }

    // Validate headId if provided
    if (headId !== undefined) {
      if (headId === null) {
        // Setting headId to NULL - check if all projects have team leads
        const projectsWithoutTeamLead = await this.prisma.project.findMany({
          where: {
            unitHeadId: existingUnit.headId,
            teamLeadId: null
          },
          select: { id: true, description: true }
        });

        if (projectsWithoutTeamLead.length > 0) {
          throw new BadRequestException(
            `Cannot remove unit head. ${projectsWithoutTeamLead.length} project(s) do not have team leads assigned. ` +
            `Please assign team leads to all projects before removing the unit head to avoid workflow disruption. ` +
            `Affected projects: ${projectsWithoutTeamLead.map(p => `ID ${p.id}`).join(', ')}`
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
    const unit = await this.prisma.productionUnit.findUnique({
      where: { id }
    });

    if (!unit) {
      throw new NotFoundException(`Unit with ID ${id} does not exist`);
    }

    // Check for teams and employees (these always block deletion)
    const teams = await this.prisma.team.findMany({
      where: { productionUnitId: id },
      select: { id: true, name: true }
    });

    const employees = await this.prisma.production.findMany({
      where: { productionUnitId: id },
      include: {
        employee: {
          select: { id: true, firstName: true, lastName: true }
        }
      }
    });

    // Check for projects based on unit head status
    let projects: any[] = [];
    let projectMessage = '';

    if (unit.headId === null) {
      // Unit has no head - check if any projects are assigned to this unit through teams
      const teamIds = teams.map(team => team.id);
      
      if (teamIds.length > 0) {
        projects = await this.prisma.project.findMany({
          where: { teamLeadId: { in: teamIds } },
          select: { id: true, description: true, teamLeadId: true }
        });
      }
      
      if (projects.length > 0) {
        projectMessage = 'Unit has no head but contains projects assigned to teams. Please reassign projects to another unit first.';
      }
    } else {
      // Unit has a head - check projects assigned to this head
      projects = await this.prisma.project.findMany({
        where: { unitHeadId: unit.headId },
        select: { id: true, description: true, teamLeadId: true }
      });
      
      if (projects.length > 0) {
        projectMessage = 'Unit has a head with assigned projects. Please reassign projects to another unit first.';
      }
    }

    // If dependencies exist, return them without deleting
    if (teams.length > 0 || employees.length > 0 || projects.length > 0) {
      return {
        success: false,
        message: 'Cannot delete unit. Please reassign dependencies first.',
        dependencies: {
          teams: {
            count: teams.length,
            details: teams
          },
          employees: {
            count: employees.length,
            details: employees.map(emp => ({
              id: emp.employee.id,
              firstName: emp.employee.firstName,
              lastName: emp.employee.lastName
            }))
          },
          projects: {
            count: projects.length,
            details: projects,
            message: projectMessage
          }
        }
      };
    }

    // Delete the unit
    await this.prisma.productionUnit.delete({
      where: { id }
    });

    return {
      success: true,
      message: 'Unit deleted successfully'
    };
  }
} 