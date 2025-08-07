import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';

@Injectable()
export class TeamsService {
  constructor(private prisma: PrismaService) {}

  async getTeamsInUnit(id: number, currentUser: any) {
    // Check if unit exists
    const unit = await this.prisma.salesUnit.findUnique({
      where: { id }
    });

    if (!unit) {
      return {
        success: false,
        message: `Unit with ID ${id} does not exist`
      };
    }

    // Security check: unit_head can only access their own unit
    if (currentUser.role === 'unit_head' && unit.headId !== currentUser.id) {
      return {
        success: false,
        message: 'You can only access your own unit'
      };
    }

    // Get teams associated with this unit
    const teams = await this.prisma.team.findMany({
      where: { salesUnitId: id },
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

    return {
      success: true,
      data: teams.map(team => ({
        id: team.id,
        name: team.name,
        teamLead: team.teamLead ? {
          id: team.teamLead.id,
          firstName: team.teamLead.firstName,
          lastName: team.teamLead.lastName
        } : null,
        currentProject: team.currentProject ? {
          id: team.currentProject.id,
          description: team.currentProject.description,
          liveProgress: team.currentProject.liveProgress,
          deadline: team.currentProject.deadline
        } : null,
        employeeCount: team.employeeCount,
        createdAt: team.createdAt,
        updatedAt: team.updatedAt
      })),
      total: teams.length,
      message: teams.length > 0 ? 'Teams retrieved successfully' : 'No teams found in this unit'
    };
  }
} 