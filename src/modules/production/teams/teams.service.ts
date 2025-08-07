import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';

@Injectable()
export class TeamsService {
  constructor(private prisma: PrismaService) {}

  async assignTeamToUnit(teamId: number, productionUnitId: number) {
    // Check if team exists
    const existingTeam = await this.prisma.team.findUnique({
      where: { id: teamId }
    });

    if (!existingTeam) {
      throw new NotFoundException(`Team with ID ${teamId} does not exist`);
    }

    // Check if production unit exists
    const existingUnit = await this.prisma.productionUnit.findUnique({
      where: { id: productionUnitId }
    });

    if (!existingUnit) {
      throw new NotFoundException(`Production unit with ID ${productionUnitId} does not exist`);
    }

    // Check if team is already assigned to this unit
    if (existingTeam.productionUnitId === productionUnitId) {
      throw new ConflictException(`Team is already assigned to this production unit`);
    }

    // Check if team is assigned to another production unit
    if (existingTeam.productionUnitId !== null) {
      throw new ConflictException(
        `Team is already assigned to production unit ID ${existingTeam.productionUnitId}. Please unassign first.`
      );
    }

    // Check if team has a team lead
    if (!existingTeam.teamLeadId) {
      throw new BadRequestException(
        `Team must have a team lead assigned before it can be assigned to a production unit`
      );
    }

    // Validate that team lead belongs to Production department
    const teamLead = await this.prisma.employee.findUnique({
      where: { id: existingTeam.teamLeadId },
      include: { department: true }
    });

    if (!teamLead) {
      throw new BadRequestException(`Team lead with ID ${existingTeam.teamLeadId} does not exist`);
    }

    if (teamLead.department.name !== 'Production') {
      throw new BadRequestException(
        `Team lead must belong to Production department. Current department: ${teamLead.department.name}`
      );
    }

    // Assign team to production unit
    const updatedTeam = await this.prisma.team.update({
      where: { id: teamId },
      data: { productionUnitId },
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
      message: `Team "${updatedTeam.name}" successfully assigned to production unit "${updatedTeam.productionUnit?.name}"`,
      data: {
        teamId: updatedTeam.id,
        teamName: updatedTeam.name,
        teamLead: updatedTeam.teamLead,
        productionUnit: updatedTeam.productionUnit
      }
    };
  }

  async unassignTeamFromUnit(teamId: number) {
    // Check if team exists
    const existingTeam = await this.prisma.team.findUnique({
      where: { id: teamId },
      include: {
        productionUnit: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!existingTeam) {
      throw new NotFoundException(`Team with ID ${teamId} does not exist`);
    }

    // Check if team is assigned to any production unit
    if (existingTeam.productionUnitId === null) {
      throw new BadRequestException(`Team is not assigned to any production unit`);
    }

    // Check if team has active projects
    const activeProjects = await this.prisma.project.findMany({
      where: {
        teams: {
          some: {
            id: teamId
          }
        },
        status: {
          in: ['in_progress', 'onhold']
        }
      },
      select: { id: true, description: true }
    });

    if (activeProjects.length > 0) {
      throw new ConflictException(
        `Cannot unassign team. ${activeProjects.length} active project(s) are assigned to this team. ` +
        `Please reassign or complete these projects first. ` +
        `Affected projects: ${activeProjects.map(p => `ID ${p.id}`).join(', ')}`
      );
    }

    // Unassign team from production unit
    const updatedTeam = await this.prisma.team.update({
      where: { id: teamId },
      data: { productionUnitId: null },
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

    return {
      success: true,
      message: `Team "${updatedTeam.name}" successfully unassigned from production unit "${existingTeam.productionUnit?.name}"`,
      data: {
        teamId: updatedTeam.id,
        teamName: updatedTeam.name,
        teamLead: updatedTeam.teamLead,
        previousUnit: existingTeam.productionUnit
      }
    };
  }

  async getTeamsInProductionUnit(productionUnitId: number) {
    // Check if production unit exists
    const existingUnit = await this.prisma.productionUnit.findUnique({
      where: { id: productionUnitId }
    });

    if (!existingUnit) {
      throw new NotFoundException(`Production unit with ID ${productionUnitId} does not exist`);
    }

    // Get all teams assigned to this production unit
    const teams = await this.prisma.team.findMany({
      where: { productionUnitId },
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
            status: true,
            liveProgress: true,
            deadline: true
          }
        }
      },
      orderBy: [
        { name: 'asc' }
      ]
    });

    return {
      success: true,
      data: teams,
      total: teams.length,
      message: teams.length > 0 
        ? `Teams in production unit "${existingUnit.name}" retrieved successfully` 
        : `No teams found in production unit "${existingUnit.name}"`
    };
  }

  async getAvailableTeams() {
    // Get all teams that are not assigned to any production unit
    const availableTeams = await this.prisma.team.findMany({
      where: {
        productionUnitId: null,
        teamLeadId: { not: null }  // Must have a team lead
      },
      include: {
        teamLead: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            department: {
              select: {
                name: true
              }
            }
          }
        }
      },
      orderBy: [
        { name: 'asc' }
      ]
    });

    // Filter teams where team lead belongs to Production department
    const productionTeams = availableTeams.filter(team => 
      team.teamLead?.department.name === 'Production'
    );

    return {
      success: true,
      data: productionTeams,
      total: productionTeams.length,
      message: productionTeams.length > 0 
        ? 'Available production teams retrieved successfully' 
        : 'No available production teams found'
    };
  }
} 