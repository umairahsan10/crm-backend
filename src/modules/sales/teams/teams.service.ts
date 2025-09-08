import { Injectable, BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';

@Injectable()
export class TeamsService {
  constructor(private prisma: PrismaService) {}

  // 1. Create Team
  async createTeam(name: string, salesUnitId: number, teamLeadId: number) {
    // Validate that the sales unit exists
    const salesUnit = await this.prisma.salesUnit.findUnique({
      where: { id: salesUnitId }
    });

    if (!salesUnit) {
      throw new NotFoundException(`Sales unit with ID ${salesUnitId} does not exist`);
    }

    // Validate that team lead exists and belongs to Sales department
    const teamLead = await this.prisma.employee.findUnique({
      where: { id: teamLeadId },
      include: {
        department: true,
        role: true
      }
    });

    if (!teamLead) {
      throw new NotFoundException(`Employee with ID ${teamLeadId} does not exist`);
    }

    if (teamLead.department.name !== 'Sales') {
      throw new BadRequestException(`Team lead must belong to Sales department. Current department: ${teamLead.department.name}`);
    }

    if (teamLead.role.name !== 'team_lead') {
      throw new BadRequestException(`Only employees with team_lead role can be assigned as team leads. Current role: ${teamLead.role.name}`);
    }

    // Check if team lead is already assigned to another team
    const existingTeam = await this.prisma.team.findFirst({
      where: { teamLeadId }
    });

    if (existingTeam) {
      throw new ConflictException(`Employee with ID ${teamLeadId} is already a team lead of team "${existingTeam.name}"`);
    }

    // Check if team name is unique within the unit
    const existingTeamName = await this.prisma.team.findFirst({
      where: {
        name,
        salesUnitId
      }
    });

    if (existingTeamName) {
      throw new ConflictException(`Team name "${name}" already exists in this sales unit`);
    }

    // Create the team
    const team = await this.prisma.team.create({
      data: {
        name,
        salesUnitId,
        teamLeadId,
        employeeCount: 1 // Team lead only initially
      },
      include: {
        teamLead: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        salesUnit: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    return {
      success: true,
      message: `Team "${name}" created successfully in sales unit "${team.salesUnit!.name}"`,
      data: {
        teamId: team.id,
        teamName: team.name,
        teamLead: team.teamLead,
        salesUnit: team.salesUnit,
        employeeCount: team.employeeCount
      }
    };
  }

  // 2. Replace Team Lead
  async replaceTeamLead(teamId: number, newTeamLeadId: number) {
    // Validate that the team exists and is a Sales team
    const team = await this.prisma.team.findUnique({
      where: { id: teamId },
      include: {
        teamLead: {
          include: {
            department: true
          }
        },
        salesUnit: true
      }
    });

    if (!team) {
      throw new NotFoundException(`Team with ID ${teamId} does not exist`);
    }

    // CRITICAL SECURITY: Ensure this is a Sales team
    if (!team.salesUnitId) {
      throw new BadRequestException(`Team with ID ${teamId} is not assigned to a Sales unit. This operation is only allowed for Sales teams.`);
    }

    if (!team.teamLead) {
      throw new BadRequestException(`Team with ID ${teamId} does not have a team lead assigned.`);
    }

    if (team.teamLead.department.name !== 'Sales') {
      throw new BadRequestException(`Team with ID ${teamId} is not a Sales team. Team lead belongs to ${team.teamLead.department.name} department.`);
    }

    // Validate that new team lead exists and belongs to Sales department
    const newTeamLead = await this.prisma.employee.findUnique({
      where: { id: newTeamLeadId },
      include: {
        department: true,
        role: true
      }
    });

    if (!newTeamLead) {
      throw new NotFoundException(`Employee with ID ${newTeamLeadId} does not exist`);
    }

    if (newTeamLead.department.name !== 'Sales') {
      throw new BadRequestException(`Team lead must belong to Sales department. Current department: ${newTeamLead.department.name}`);
    }

    if (newTeamLead.role.name !== 'team_lead') {
      throw new BadRequestException(`Only employees with team_lead role can be assigned as team leads. Current role: ${newTeamLead.role.name}`);
    }

    // Check if new team lead is already a team lead of another team
    const existingTeam = await this.prisma.team.findFirst({
      where: {
        teamLeadId: newTeamLeadId,
        id: { not: teamId }
      }
    });

    if (existingTeam) {
      throw new ConflictException(`Employee with ID ${newTeamLeadId} is already a team lead of team "${existingTeam.name}"`);
    }

    // Get all team members (employees who follow the current team lead)
    const teamMembers = await this.prisma.employee.findMany({
      where: { teamLeadId: team.teamLeadId }
    });

    // Update team with new team lead
    await this.prisma.team.update({
      where: { id: teamId },
      data: { teamLeadId: newTeamLeadId }
    });

    // Transfer all team members to follow the new team lead
    if (teamMembers.length > 0) {
      await this.prisma.employee.updateMany({
        where: { teamLeadId: team.teamLeadId },
        data: { teamLeadId: newTeamLeadId }
      });
    }

    return {
      success: true,
      message: `Team lead replaced successfully. All ${teamMembers.length} team members transferred to new team lead.`,
      data: {
        teamId: team.id,
        teamName: team.name,
        previousTeamLead: team.teamLead,
        newTeamLead: {
          id: newTeamLead.id,
          firstName: newTeamLead.firstName,
          lastName: newTeamLead.lastName
        },
        memberCount: teamMembers.length
      }
    };
  }

  // 3. Add Employee to Team
  async addEmployeeToTeam(teamId: number, employeeId: number) {
    // Validate that the team exists and is a Sales team
    const team = await this.prisma.team.findUnique({
      where: { id: teamId },
      include: {
        teamLead: {
          include: {
            department: true
          }
        },
        salesUnit: true
      }
    });

    if (!team) {
      throw new NotFoundException(`Team with ID ${teamId} does not exist`);
    }

    // CRITICAL SECURITY: Ensure this is a Sales team
    if (!team.salesUnitId) {
      throw new BadRequestException(`Team with ID ${teamId} is not assigned to a Sales unit. This operation is only allowed for Sales teams.`);
    }

    // Validate that employee exists and belongs to Sales department
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      include: {
        department: true,
        role: true
      }
    });

    if (!employee) {
      throw new NotFoundException(`Employee with ID ${employeeId} does not exist`);
    }

    if (employee.department.name !== 'Sales') {
      throw new BadRequestException(`Employee must belong to Sales department. Current department: ${employee.department.name}`);
    }

    // Check if employee is already in another team
    if (employee.teamLeadId && employee.teamLeadId !== team.teamLeadId) {
      throw new ConflictException(`Employee with ID ${employeeId} is already a member of another team`);
    }

    // Check if employee is the team lead
    if (employee.id === team.teamLeadId) {
      throw new BadRequestException(`Employee with ID ${employeeId} is already the team lead of this team`);
    }

    // SPECIAL CASE: If team has no team lead and employee is a team_lead, assign them as team lead
    if (!team.teamLeadId && employee.role.name === 'team_lead') {
      // Check if this team lead is already leading another team
      const existingTeam = await this.prisma.employee.findFirst({
        where: { teamLeadId: employeeId }
      });

      if (existingTeam) {
        throw new ConflictException(`Employee with ID ${employeeId} is already a team lead of another team`);
      }

      // Assign employee as team lead
      await this.prisma.team.update({
        where: { id: teamId },
        data: { teamLeadId: employeeId }
      });

      // Update team employee count - team lead counts as 1, plus any existing members
      const existingMembersCount = await this.prisma.employee.count({
        where: { teamLeadId: employeeId }
      });
      const newEmployeeCount = existingMembersCount + 1; // +1 for team lead

      await this.prisma.team.update({
        where: { id: teamId },
        data: { employeeCount: newEmployeeCount }
      });

      return {
        success: true,
        message: `Employee "${employee.firstName} ${employee.lastName}" successfully assigned as team lead to team "${team.name}"`,
        data: {
          teamId: team.id,
          teamName: team.name,
          teamLead: {
            id: employee.id,
            firstName: employee.firstName,
            lastName: employee.lastName
          },
          assignedEmployee: {
            id: employee.id,
            firstName: employee.firstName,
            lastName: employee.lastName,
            role: employee.role.name
          },
          newEmployeeCount: newEmployeeCount,
          action: 'assigned_as_team_lead'
        }
      };
    }

    // REGULAR CASE: Add employee as team member (requires existing team lead)
    if (!team.teamLeadId) {
      throw new BadRequestException(`Team with ID ${teamId} does not have a team lead assigned. Please assign a team lead first or add an employee with team_lead role.`);
    }

    if (!team.teamLead) {
      throw new BadRequestException(`Team with ID ${teamId} does not have a team lead assigned.`);
    }

    if (team.teamLead.department.name !== 'Sales') {
      throw new BadRequestException(`Team with ID ${teamId} is not a Sales team. Team lead belongs to ${team.teamLead.department.name} department.`);
    }

    if (!['senior', 'junior'].includes(employee.role.name)) {
      throw new BadRequestException(`Only employees with senior or junior role can be added to teams. Current role: ${employee.role.name}`);
    }

    // Add employee to team
    await this.prisma.employee.update({
      where: { id: employeeId },
      data: { teamLeadId: team.teamLeadId }
    });

    // Update team employee count - includes team lead + team members
    const existingMembersCount = await this.prisma.employee.count({
      where: { teamLeadId: team.teamLeadId }
    });
    const newEmployeeCount = existingMembersCount + 1; // +1 for team lead

    await this.prisma.team.update({
      where: { id: teamId },
      data: { employeeCount: newEmployeeCount }
    });

    return {
      success: true,
      message: `Employee "${employee.firstName} ${employee.lastName}" successfully added to team "${team.name}"`,
      data: {
        teamId: team.id,
        teamName: team.name,
        teamLead: team.teamLead,
        addedEmployee: {
          id: employee.id,
          firstName: employee.firstName,
          lastName: employee.lastName
        },
        newEmployeeCount: newEmployeeCount,
        action: 'added_as_member'
      }
    };
  }

  // 4. Remove Employee from Team
  async removeEmployeeFromTeam(teamId: number, employeeId: number) {
    // Validate that the team exists and is a Sales team
    const team = await this.prisma.team.findUnique({
      where: { id: teamId },
      include: {
        teamLead: {
          include: {
            department: true
          }
        },
        salesUnit: true
      }
    });

    if (!team) {
      throw new NotFoundException(`Team with ID ${teamId} does not exist`);
    }

    // CRITICAL SECURITY: Ensure this is a Sales team
    if (!team.salesUnitId) {
      throw new BadRequestException(`Team with ID ${teamId} is not assigned to a Sales unit. This operation is only allowed for Sales teams.`);
    }

    if (!team.teamLead) {
      throw new BadRequestException(`Team with ID ${teamId} does not have a team lead assigned.`);
    }

    if (team.teamLead.department.name !== 'Sales') {
      throw new BadRequestException(`Team with ID ${teamId} is not a Sales team. Team lead belongs to ${team.teamLead.department.name} department.`);
    }

    // Validate that employee exists
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId }
    });

    if (!employee) {
      throw new NotFoundException(`Employee with ID ${employeeId} does not exist`);
    }

    // Check if employee is the team lead
    if (employee.id === team.teamLeadId) {
      throw new BadRequestException(`Cannot remove team lead from team. Use replace-lead endpoint instead.`);
    }

    // Check if employee is actually in this team
    if (employee.teamLeadId !== team.teamLeadId) {
      throw new BadRequestException(`Employee with ID ${employeeId} is not a member of this team`);
    }

    // Check if employee has active leads (completed status)
    const activeLeads = await this.prisma.lead.count({
      where: {
        assignedToId: employeeId,
        status: 'completed'
      }
    });

    if (activeLeads > 0) {
      throw new ConflictException(`Cannot remove employee. ${activeLeads} completed lead(s) are assigned to this employee. Please reassign these leads first.`);
    }

    // Remove employee from team
    await this.prisma.employee.update({
      where: { id: employeeId },
      data: { teamLeadId: null }
    });

    // Update team employee count - includes team lead + remaining members
    const remainingMembersCount = await this.prisma.employee.count({
      where: { teamLeadId: team.teamLeadId }
    });
    const newEmployeeCount = remainingMembersCount + 1; // +1 for team lead

    await this.prisma.team.update({
      where: { id: teamId },
      data: { employeeCount: newEmployeeCount }
    });

    return {
      success: true,
      message: `Employee "${employee.firstName} ${employee.lastName}" successfully removed from team "${team.name}"`,
      data: {
        teamId: team.id,
        teamName: team.name,
        removedEmployee: {
          id: employee.id,
          firstName: employee.firstName,
          lastName: employee.lastName
        },
        newEmployeeCount: newEmployeeCount
      }
    };
  }

  // 5. Unassign All From Team
  async unassignEmployeesFromTeam(teamId: number) {
    // Validate that the team exists and is a Sales team
    const team = await this.prisma.team.findUnique({
      where: { id: teamId },
      include: {
        teamLead: {
          include: {
            department: true
          }
        },
        salesUnit: true
      }
    });

    if (!team) {
      throw new NotFoundException(`Team with ID ${teamId} does not exist`);
    }

    // CRITICAL SECURITY: Ensure this is a Sales team
    if (!team.salesUnitId) {
      throw new BadRequestException(`Team with ID ${teamId} is not assigned to a Sales unit. This operation is only allowed for Sales teams.`);
    }

    if (!team.teamLead) {
      throw new BadRequestException(`Team with ID ${teamId} does not have a team lead assigned.`);
    }

    if (team.teamLead.department.name !== 'Sales') {
      throw new BadRequestException(`Team with ID ${teamId} is not a Sales team. Team lead belongs to ${team.teamLead.department.name} department.`);
    }

    // Store team lead details before unassigning
    const teamLeadDetails = {
      id: team.teamLead.id,
      firstName: team.teamLead.firstName,
      lastName: team.teamLead.lastName,
      department: team.teamLead.department.name
    };

    // Get all team members (excluding team lead)
    const teamMembers = await this.prisma.employee.findMany({
      where: { teamLeadId: team.teamLeadId },
      select: {
        id: true,
        firstName: true,
        lastName: true
      }
    });

    // Set teamLeadId to null for all team members
    if (teamMembers.length > 0) {
      await this.prisma.employee.updateMany({
        where: { teamLeadId: team.teamLeadId },
        data: { teamLeadId: null }
      });
    }

    // Unassign the team lead if one exists
    let teamLeadUnassigned = false;
    if (team.teamLeadId) {
      await this.prisma.team.update({
        where: { id: teamId },
        data: { teamLeadId: null }
      });
      teamLeadUnassigned = true;
    }

    // Update employee count
    await this.prisma.team.update({
      where: { id: teamId },
      data: { employeeCount: 0 }
    });

    return {
      success: true,
      message: `${teamMembers.length} employee(s) and team lead successfully unassigned from team "${team.name}"`,
      data: {
        teamId: team.id,
        teamName: team.name,
        teamLead: null,
        unassignedTeamLead: teamLeadDetails,
        unassignedEmployees: teamMembers,
        unassignedCount: teamMembers.length,
        teamLeadUnassigned,
        totalUnassigned: teamMembers.length + (teamLeadUnassigned ? 1 : 0)
      }
    };
  }

  // 7. Get Team Details
  async getTeamDetails(teamId: number) {
    // Validate that the team exists and is a Sales team
    const team = await this.prisma.team.findUnique({
      where: { id: teamId },
      include: {
        teamLead: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        salesUnit: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!team) {
      throw new NotFoundException(`Team with ID ${teamId} does not exist`);
    }

    // CRITICAL SECURITY: Ensure this is a Sales team
    if (!team.salesUnitId) {
      throw new BadRequestException(`Team with ID ${teamId} is not assigned to a Sales unit. This operation is only allowed for Sales teams.`);
    }

    if (!team.teamLead) {
      throw new BadRequestException(`Team with ID ${teamId} does not have a team lead assigned.`);
    }

    // Get all team members
    const teamMembers = await this.prisma.employee.findMany({
      where: { teamLeadId: team.teamLeadId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true
      }
    });

    // Get completed leads count from team counter
    const completedLeadsCount = team.completedLeads || 0;

    // Calculate actual employee count
    const actualEmployeeCount = teamMembers.length + (team.teamLeadId ? 1 : 0);

    return {
      success: true,
      data: {
        id: team.id,
        name: team.name,
        teamLeadId: team.teamLeadId,
        employeeCount: team.employeeCount,
        salesUnitId: team.salesUnitId,
        createdAt: team.createdAt,
        updatedAt: team.updatedAt,
        teamLead: team.teamLead,
        completedLeads: {
          count: completedLeadsCount,
          status: 'completed'
        },
        salesUnit: team.salesUnit,
        teamMembers,
        actualEmployeeCount
      }
    };
  }

  // 8. Get Employee's Team
  async getEmployeeTeam(employeeId: number) {
    // Validate that the employee exists
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      include: {
        department: true
      }
    });

    if (!employee) {
      throw new NotFoundException(`Employee with ID ${employeeId} does not exist`);
    }

    // Check if employee is assigned to any team
    if (!employee.teamLeadId) {
      return {
        success: true,
        data: null,
        message: `Employee "${employee.firstName} ${employee.lastName}" is not assigned to any team`
      };
    }

    // Find the team where employee's team lead is the team lead
    const team = await this.prisma.team.findFirst({
      where: { teamLeadId: employee.teamLeadId },
      include: {
        teamLead: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        salesUnit: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!team) {
      return {
        success: true,
        data: null,
        message: `Employee "${employee.firstName} ${employee.lastName}" is not assigned to any team`
      };
    }

    return {
      success: true,
      data: {
        employee: {
          id: employee.id,
          firstName: employee.firstName,
          lastName: employee.lastName,
          department: employee.department.name
        },
        team: {
          id: team.id,
          name: team.name,
          teamLeadId: team.teamLeadId,
          employeeCount: team.employeeCount,
          salesUnitId: team.salesUnitId,
          createdAt: team.createdAt,
          updatedAt: team.updatedAt,
          teamLead: team.teamLead,
          completedLeads: {
            count: team.completedLeads || 0,
            status: 'completed'
          },
          salesUnit: team.salesUnit
        }
      }
    };
  }

  // 9. Get All Sales Teams (with optional unit filtering)
  async getAllTeams(salesUnitId?: number) {
    const whereClause: any = {
      // Only get teams that belong to Sales department (have a salesUnitId)
      salesUnitId: { not: null }
    };
    
    if (salesUnitId) {
      whereClause.salesUnitId = salesUnitId;
    }

    const teams = await this.prisma.team.findMany({
      where: whereClause,
      include: {
        teamLead: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        salesUnit: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: [
        { salesUnit: { name: 'asc' } },
        { name: 'asc' }
      ]
    });

    // Calculate actual employee count for each team
    const teamsWithActualCount = await Promise.all(
      teams.map(async (team) => {
        const actualEmployeeCount = await this.prisma.employee.count({
          where: { teamLeadId: team.teamLeadId }
        });

        const { currentProjectId, ...teamWithoutProject } = team;
        return {
          ...teamWithoutProject,
          actualEmployeeCount: actualEmployeeCount + (team.teamLeadId ? 1 : 0)
        };
      })
    );

    const message = salesUnitId 
      ? `Sales teams in unit retrieved successfully`
      : 'All sales teams retrieved successfully';

    return {
      success: true,
      data: teamsWithActualCount,
      total: teamsWithActualCount.length,
      message
    };
  }

  // 10. Assign Team to Sales Unit
  async assignTeamToUnit(teamId: number, salesUnitId: number) {
    // Validate that the team exists
    const team = await this.prisma.team.findUnique({
      where: { id: teamId },
      include: {
        teamLead: {
          include: {
            department: true
          }
        }
      }
    });

    if (!team) {
      throw new NotFoundException(`Team with ID ${teamId} does not exist`);
    }

    // Validate that the sales unit exists
    const salesUnit = await this.prisma.salesUnit.findUnique({
      where: { id: salesUnitId }
    });

    if (!salesUnit) {
      throw new NotFoundException(`Sales unit with ID ${salesUnitId} does not exist`);
    }

    // Check if team is already assigned to this unit
    if (team.salesUnitId === salesUnitId) {
      throw new ConflictException(`Team is already assigned to this sales unit`);
    }

    // Check if team is assigned to another sales unit
    if (team.salesUnitId && team.salesUnitId !== salesUnitId) {
      throw new ConflictException(`Team is already assigned to sales unit ID ${team.salesUnitId}. Please unassign first.`);
    }

    // Validate that team has a team lead assigned
    if (!team.teamLeadId || !team.teamLead) {
      throw new BadRequestException(`Team must have a team lead assigned before it can be assigned to a sales unit`);
    }

    // Validate that team lead belongs to Sales department
    if (team.teamLead.department.name !== 'Sales') {
      throw new BadRequestException(`Team lead must belong to Sales department. Current department: ${team.teamLead.department.name}`);
    }

    // Assign team to the sales unit
    await this.prisma.team.update({
      where: { id: teamId },
      data: { salesUnitId }
    });

    return {
      success: true,
      message: `Team "${team.name}" successfully assigned to sales unit "${salesUnit.name}"`,
      data: {
        teamId: team.id,
        teamName: team.name,
        teamLead: {
          id: team.teamLead.id,
          firstName: team.teamLead.firstName,
          lastName: team.teamLead.lastName
        },
        salesUnit: {
          id: salesUnit.id,
          name: salesUnit.name
        }
      }
    };
  }

  // 13. Get Available Teams
  async getAvailableTeams() {
    // Get all teams not assigned to any sales unit
    const availableTeams = await this.prisma.team.findMany({
      where: {
        salesUnitId: null
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
      orderBy: {
        name: 'asc'
      }
    });

    // Filter teams that have a team lead assigned and team lead belongs to Sales department
    const filteredTeams = availableTeams.filter(team => 
      team.teamLeadId && team.teamLead && team.teamLead.department.name === 'Sales'
    );

    // Calculate actual employee count for each team
    const teamsWithActualCount = await Promise.all(
      filteredTeams.map(async (team) => {
        const actualEmployeeCount = await this.prisma.employee.count({
          where: { teamLeadId: team.teamLeadId }
        });

        const { currentProjectId, ...teamWithoutProject } = team;
        return {
          ...teamWithoutProject,
          actualEmployeeCount: actualEmployeeCount + 1 // +1 for team lead
        };
      })
    );

    return {
      success: true,
      data: teamsWithActualCount,
      total: teamsWithActualCount.length,
      message: teamsWithActualCount.length > 0 
        ? 'Available sales teams retrieved successfully'
        : 'No available sales teams found'
    };
  }

  // Existing method - Get Teams in Unit (updated to use the new structure)
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
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    // Calculate actual employee count for each team
    const teamsWithActualCount = await Promise.all(
      teams.map(async (team) => {
        const actualEmployeeCount = await this.prisma.employee.count({
          where: { teamLeadId: team.teamLeadId }
        });

        return {
          id: team.id,
          name: team.name,
          teamLead: team.teamLead,
          employeeCount: team.employeeCount,
          createdAt: team.createdAt,
          updatedAt: team.updatedAt,
          actualEmployeeCount: actualEmployeeCount + (team.teamLeadId ? 1 : 0)
        };
      })
    );

    return {
      success: true,
      data: teamsWithActualCount,
      total: teamsWithActualCount.length,
      message: teamsWithActualCount.length > 0 ? 'Teams retrieved successfully' : 'No teams found in this unit'
    };
  }

  // 13. Delete Team
  async deleteTeam(teamId: number) {
    // Validate that the team exists
    const team = await this.prisma.team.findUnique({
      where: { id: teamId },
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

    if (!team) {
      throw new NotFoundException(`Team with ID ${teamId} does not exist`);
    }

    // Get all team members (excluding team lead)
    // Only check for team members if team has a team lead, otherwise no team members to check
    const teamMembers = team.teamLeadId ? await this.prisma.employee.findMany({
      where: { 
        teamLeadId: team.teamLeadId,
        id: { not: team.teamLeadId } // Exclude team lead
      },
      select: {
        id: true,
        firstName: true,
        lastName: true
      }
    }) : [];

    // Check if team has employees or team lead
    if (teamMembers.length > 0 || team.teamLeadId) {
      const totalAssigned = teamMembers.length + (team.teamLeadId ? 1 : 0);
      const message = team.teamLeadId 
        ? `Cannot delete team. ${teamMembers.length} employee(s) and team lead are still assigned to this team. Please unassign all employees and team lead first using the unassign-employees endpoint.`
        : `Cannot delete team. ${teamMembers.length} employee(s) are still assigned to this team. Please unassign all employees first using the unassign-employees endpoint.`;
      
      return {
        success: false,
        message,
        data: {
          teamId: team.id,
          teamName: team.name,
          teamLead: team.teamLead,
          assignedEmployees: teamMembers,
          canDelete: false,
          reason: 'employees_or_team_lead_assigned',
          suggestion: 'Use POST /sales/teams/:teamId/unassign-employees'
        }
      };
    }

    // Reassign team lead (set their teamLeadId to null) before deleting team
    if (team.teamLeadId) {
      await this.prisma.employee.update({
        where: { id: team.teamLeadId },
        data: { teamLeadId: null }
      });
    }

    // Store team details before deletion
    const teamDetails = {
      id: team.id,
      name: team.name,
      teamLead: team.teamLead
    };

    // Delete the team
    await this.prisma.team.delete({
      where: { id: teamId }
    });

    return {
      success: true,
      message: `Team "${team.name}" successfully deleted. Team lead has been unassigned.`,
      data: {
        ...teamDetails,
        assignedEmployees: teamMembers,
        canDelete: true
      }
    };
  }

  // 14. Unassign Team from Sales Unit
  async unassignTeamFromUnit(teamId: number) {
    // Validate that the team exists
    const team = await this.prisma.team.findUnique({
      where: { id: teamId },
      include: {
        teamLead: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        salesUnit: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!team) {
      throw new NotFoundException(`Team with ID ${teamId} does not exist`);
    }

    // Check if team is assigned to any sales unit
    if (!team.salesUnitId) {
      throw new BadRequestException('Team is not assigned to any sales unit');
    }

    // Store previous unit details
    const previousUnit = team.salesUnit;

    // Unassign team from the sales unit
    await this.prisma.team.update({
      where: { id: teamId },
      data: { salesUnitId: null }
    });

    return {
      success: true,
      message: `Team "${team.name}" successfully unassigned from sales unit "${previousUnit?.name || 'Unknown Unit'}"`,
      data: {
        teamId: team.id,
        teamName: team.name,
        teamLead: team.teamLead,
        previousUnit
      }
    };
  }


} 