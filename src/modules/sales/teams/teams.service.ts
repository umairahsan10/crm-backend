import { Injectable, BadRequestException, ConflictException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { SalesTeamsQueryDto } from './dto/teams-query.dto';
import { SalesAddMembersDto } from './dto/add-members.dto';
import { UpdateSalesTeamDto } from './dto/update-team.dto';

@Injectable()
export class TeamsService {
  constructor(private prisma: PrismaService) {}

  // 1. Create Team
  async createTeam(name: string, salesUnitId: number, teamLeadId: number, user?: any) {
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

      // Use transaction to ensure all operations succeed or fail together
      const result = await this.prisma.$transaction(async (tx) => {
        // Assign employee as team lead
        await tx.team.update({
          where: { id: teamId },
          data: { teamLeadId: employeeId }
        });

        // Update team employee count - team lead counts as 1, plus any existing members
        const existingMembersCount = await tx.employee.count({
          where: { teamLeadId: employeeId }
        });
        const newEmployeeCount = existingMembersCount + 1; // +1 for team lead

        await tx.team.update({
          where: { id: teamId },
          data: { employeeCount: newEmployeeCount }
        });

        // Add team lead to all team projects' chat participants and project logs
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
            // Add team lead as chat participant if not already a participant
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
                  memberType: 'owner'
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
          }

          // Add team lead to project logs (regardless of chat existence)
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

        return {
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
          action: 'assigned_as_team_lead',
          projectsUpdated: teamProjects.length
        };
      });

      return {
        success: true,
        message: `Employee "${employee.firstName} ${employee.lastName}" successfully assigned as team lead to team "${team.name}" and all team projects`,
        data: result
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

    // Use transaction to ensure all operations succeed or fail together
    const result = await this.prisma.$transaction(async (tx) => {
      // Add employee to team
      await tx.employee.update({
        where: { id: employeeId },
        data: { teamLeadId: team.teamLeadId }
      });

      // Update team employee count - includes team lead + team members
      const existingMembersCount = await tx.employee.count({
        where: { teamLeadId: team.teamLeadId }
      });
      const newEmployeeCount = existingMembersCount + 1; // +1 for team lead

      await tx.team.update({
        where: { id: teamId },
        data: { employeeCount: newEmployeeCount }
      });

      // Add employee to all team projects' chat participants
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

            // Update chat participants count
            const participantCount = await tx.chatParticipant.count({
              where: { chatId: projectChat.id }
            });

            await tx.projectChat.update({
              where: { id: projectChat.id },
              data: { participants: participantCount }
            });
          }
        }

        // Add employee to project logs (regardless of chat existence)
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

      return {
        teamId: team.id,
        teamName: team.name,
        teamLead: team.teamLead,
        addedEmployee: {
          id: employee.id,
          firstName: employee.firstName,
          lastName: employee.lastName
        },
        newEmployeeCount: newEmployeeCount,
        action: 'added_as_member',
        projectsUpdated: teamProjects.length
      };
    });

    return {
      success: true,
      message: `Employee "${employee.firstName} ${employee.lastName}" successfully added to team "${team.name}" and all team projects`,
      data: result
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

    // Use transaction to ensure all operations succeed or fail together
    const result = await this.prisma.$transaction(async (tx) => {
      // Remove employee from team
      await tx.employee.update({
        where: { id: employeeId },
        data: { teamLeadId: null }
      });

      // Update team employee count - includes team lead + remaining members
      const remainingMembersCount = await tx.employee.count({
        where: { teamLeadId: team.teamLeadId }
      });
      const newEmployeeCount = remainingMembersCount + 1; // +1 for team lead

      await tx.team.update({
        where: { id: teamId },
        data: { employeeCount: newEmployeeCount }
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
        newEmployeeCount: newEmployeeCount,
        projectsUpdated: teamProjects.length
      };
    });

    return {
      success: true,
      message: `Employee "${employee.firstName} ${employee.lastName}" successfully removed from team "${team.name}" and all team projects`,
      data: result
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

  // 9. Get All Sales Teams (Legacy - with optional unit filtering)
  async getAllTeamsLegacy(salesUnitId?: number) {
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

  // ===== ENHANCED METHODS (Production Teams Style) =====

  // Enhanced Get All Teams with Advanced Filtering
  async getAllTeams(user: any, query: SalesTeamsQueryDto) {
    // Build role-based where clause
    const whereClause = this.buildRoleBasedWhereClause(user, query);
    
    // Build include clause
    const includeClause = this.buildIncludeClause(query.include);
    
    // Build order by clause
    const orderBy = this.buildOrderByClause(query.sortBy, query.sortOrder);
    
    // Calculate pagination
    const page = query.page || 1;
    const limit = Math.min(query.limit || 10, 100); // Max 100 items per page
    const skip = (page - 1) * limit;

    // Get teams with pagination
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
              phone: true,
              role: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          },
          salesUnit: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true
            }
          },
          ...includeClause
        },
        orderBy,
        skip,
        take: limit
      }),
      this.prisma.team.count({ where: whereClause })
    ]);

    // Calculate additional data for each team
    const teamsWithCounts = await Promise.all(
      teams.map(async (team) => {
        const [membersCount, leadsCount, completedLeadsCount] = await Promise.all([
          this.prisma.employee.count({
            where: { teamLeadId: team.teamLeadId }
          }),
          this.prisma.lead.count({
            where: { 
              assignedTo: { teamLeadId: team.teamLeadId }
            }
          }),
          this.prisma.crackedLead.count({
            where: {
              employee: { teamLeadId: team.teamLeadId }
            }
          })
        ]);

        return {
          ...team,
          membersCount,
          leadsCount,
          completedLeadsCount,
          actualEmployeeCount: membersCount
        };
      })
    );

    const totalPages = Math.ceil(total / limit);

    return {
      success: true,
      data: teamsWithCounts,
      total,
      pagination: {
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      message: teamsWithCounts.length > 0 ? 'Teams retrieved successfully' : 'No teams found'
    };
  }

  // Get Team by ID with Role-Based Access
  async getTeam(id: number, user: any) {
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
        salesUnit: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            address: true
          }
        }
      }
    });

    if (!team) {
      throw new NotFoundException(`Team with ID ${id} does not exist`);
    }

    // Check if user has access to this team
    if (user && !this.checkUserAccessToTeam(user, team)) {
      throw new ForbiddenException('You do not have access to this team');
    }

    // Get team members
    const members = await this.prisma.employee.findMany({
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

    // Get team leads
    const leads = await this.prisma.lead.findMany({
      where: { 
        assignedTo: { teamLeadId: team.teamLeadId }
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Get completed leads
    const completedLeads = await this.prisma.crackedLead.findMany({
      where: {
        employee: { teamLeadId: team.teamLeadId }
      },
      include: {
        lead: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: { crackedAt: 'desc' }
    });

    return {
      success: true,
      data: {
        id: team.id,
        name: team.name,
        teamLeadId: team.teamLeadId,
        salesUnitId: team.salesUnitId,
        employeeCount: team.employeeCount,
        completedLeads: team.completedLeads,
        createdAt: team.createdAt,
        updatedAt: team.updatedAt,
        teamLead: team.teamLead,
        salesUnit: team.salesUnit,
        members,
        leads,
        completedLeadsData: completedLeads,
        summary: {
          membersCount: members.length,
          leadsCount: leads.length,
          completedLeadsCount: completedLeads.length,
          conversionRate: leads.length > 0 ? (completedLeads.length / leads.length) * 100 : 0
        }
      },
      message: 'Team details retrieved successfully'
    };
  }

  // Update Team
  async updateTeam(id: number, updateTeamDto: UpdateSalesTeamDto, user: any) {
    const team = await this.prisma.team.findUnique({
      where: { id },
      include: {
        teamLead: true,
        salesUnit: true
      }
    });

    if (!team) {
      throw new NotFoundException(`Team with ID ${id} does not exist`);
    }

    // Check if user has access to update this team
    if (!this.checkUserAccessToUpdateTeam(user, team)) {
      throw new ForbiddenException('You do not have permission to update this team');
    }

    const updateData: any = {};

    // Update team name
    if (updateTeamDto.name) {
      // Check if name is unique within the unit
      const existingTeam = await this.prisma.team.findFirst({
        where: {
          name: updateTeamDto.name,
          salesUnitId: team.salesUnitId,
          id: { not: id }
        }
      });

      if (existingTeam) {
        throw new ConflictException(`Team name "${updateTeamDto.name}" already exists in this sales unit`);
      }
      updateData.name = updateTeamDto.name;
    }

    // Update team lead
    if (updateTeamDto.teamLeadId) {
      const newTeamLead = await this.prisma.employee.findUnique({
        where: { id: updateTeamDto.teamLeadId },
        include: { department: true, role: true }
      });

      if (!newTeamLead) {
        throw new NotFoundException(`Employee with ID ${updateTeamDto.teamLeadId} does not exist`);
      }

      if (newTeamLead.department.name !== 'Sales') {
        throw new BadRequestException('Team lead must belong to Sales department');
      }

      if (newTeamLead.role.name !== 'team_lead') {
        throw new BadRequestException('Only employees with team_lead role can be assigned as team leads');
      }

      // Check if new team lead is already leading another team
      const existingTeam = await this.prisma.team.findFirst({
        where: {
          teamLeadId: updateTeamDto.teamLeadId,
          id: { not: id }
        }
      });

      if (existingTeam) {
        throw new ConflictException(`Employee is already leading team "${existingTeam.name}"`);
      }

      updateData.teamLeadId = updateTeamDto.teamLeadId;
    }

    // Update sales unit
    if (updateTeamDto.salesUnitId) {
      const salesUnit = await this.prisma.salesUnit.findUnique({
        where: { id: updateTeamDto.salesUnitId }
      });

      if (!salesUnit) {
        throw new NotFoundException(`Sales unit with ID ${updateTeamDto.salesUnitId} does not exist`);
      }

      updateData.salesUnitId = updateTeamDto.salesUnitId;
    }

    const updatedTeam = await this.prisma.team.update({
      where: { id },
      data: updateData,
      include: {
        teamLead: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
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
      message: 'Team updated successfully',
      data: updatedTeam
    };
  }

  // Add Members to Team (Bulk Operation)
  async addMembersToTeam(teamId: number, addMembersDto: SalesAddMembersDto, user: any) {
    const team = await this.prisma.team.findUnique({
      where: { id: teamId },
      include: { teamLead: true, salesUnit: true }
    });

    if (!team) {
      throw new NotFoundException(`Team with ID ${teamId} does not exist`);
    }

    // Check if user has access to add members to this team
    if (!this.checkUserAccessToUpdateTeam(user, team)) {
      throw new ForbiddenException('You do not have permission to add members to this team');
    }

    const results: any[] = [];
    const errors: Array<{ employeeId: number; error: string }> = [];

    for (const employeeId of addMembersDto.employeeIds) {
      try {
        const result = await this.addEmployeeToTeam(teamId, employeeId);
        results.push(result);
      } catch (error) {
        errors.push({
          employeeId,
          error: error.message
        });
      }
    }

    return {
      success: true,
      message: `Added ${results.length} members to team. ${errors.length} failed.`,
      data: {
        successful: results,
        failed: errors,
        totalProcessed: addMembersDto.employeeIds.length,
        successCount: results.length,
        failureCount: errors.length
      }
    };
  }

  // Remove Member from Team (Enhanced)
  async removeMemberFromTeam(teamId: number, employeeId: number, user: any) {
    const team = await this.prisma.team.findUnique({
      where: { id: teamId },
      include: { teamLead: true, salesUnit: true }
    });

    if (!team) {
      throw new NotFoundException(`Team with ID ${teamId} does not exist`);
    }

    // Check if user has access to remove members from this team
    if (!this.checkUserAccessToUpdateTeam(user, team)) {
      throw new ForbiddenException('You do not have permission to remove members from this team');
    }

    return this.removeEmployeeFromTeam(teamId, employeeId);
  }

  // Get Available Team Leads
  async getAvailableLeads(assigned?: boolean) {
    let employees;

    if (assigned === true) {
      // Get employees who are already team leads
      employees = await this.prisma.employee.findMany({
        where: {
          role: { name: 'team_lead' },
          department: { name: 'Sales' },
          status: 'active',
          teamLeadId: { not: null }
        },
        include: {
          role: true,
          department: true
        }
      });
    } else if (assigned === false) {
      // Get employees who can be team leads but aren't assigned
      employees = await this.prisma.employee.findMany({
        where: {
          role: { name: 'team_lead' },
          department: { name: 'Sales' },
          status: 'active',
          teamLeadId: null
        },
        include: {
          role: true,
          department: true
        }
      });
    } else {
      // Get all team lead eligible employees
      employees = await this.prisma.employee.findMany({
        where: {
          role: { name: 'team_lead' },
          department: { name: 'Sales' },
          status: 'active'
        },
        include: {
          role: true,
          department: true
        }
      });
    }

    return {
      success: true,
      data: employees.map(emp => ({
        id: emp.id,
        firstName: emp.firstName,
        lastName: emp.lastName,
        email: emp.email,
        phone: emp.phone,
        role: emp.role,
        department: emp.department,
        currentTeam: null, // Will be populated separately if needed
        isAssigned: emp.teamLeadId !== null
      })),
      total: employees.length,
      message: employees.length > 0 ? 'Available team leads retrieved successfully' : 'No available team leads found'
    };
  }

  // Get Available Employees
  async getAvailableEmployees(assigned?: boolean) {
    let employees;

    if (assigned === true) {
      // Get employees who are already in teams
      employees = await this.prisma.employee.findMany({
        where: {
          role: { name: { in: ['senior', 'junior'] } },
          department: { name: 'Sales' },
          status: 'active',
          teamLeadId: { not: null }
        },
        include: {
          role: true,
          department: true,
          teamLead: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          }
        }
      });
    } else if (assigned === false) {
      // Get employees who can be team members but aren't assigned
      employees = await this.prisma.employee.findMany({
        where: {
          role: { name: { in: ['senior', 'junior'] } },
          department: { name: 'Sales' },
          status: 'active',
          teamLeadId: null
        },
        include: {
          role: true,
          department: true
        }
      });
    } else {
      // Get all team member eligible employees
      employees = await this.prisma.employee.findMany({
        where: {
          role: { name: { in: ['senior', 'junior'] } },
          department: { name: 'Sales' },
          status: 'active'
        },
        include: {
          role: true,
          department: true,
          teamLead: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          }
        }
      });
    }

    return {
      success: true,
      data: employees.map(emp => ({
        id: emp.id,
        firstName: emp.firstName,
        lastName: emp.lastName,
        email: emp.email,
        phone: emp.phone,
        role: emp.role,
        department: emp.department,
        currentTeam: null, // Will be populated separately if needed
        isAssigned: emp.teamLeadId !== null
      })),
      total: employees.length,
      message: employees.length > 0 ? 'Available employees retrieved successfully' : 'No available employees found'
    };
  }

  // ===== HELPER METHODS =====

  private buildRoleBasedWhereClause(user: any, query: SalesTeamsQueryDto): any {
    const whereClause: any = {};

    // Role-based filtering
    if (user) {
      switch (user.role) {
        case 'dep_manager':
          // Department managers can see all teams
          break;
        case 'unit_head':
          // Unit heads can see teams in their units
          whereClause.salesUnit = {
            headId: user.id
          };
          break;
        case 'team_lead':
          // Team leads can see teams they lead
          whereClause.teamLeadId = user.id;
          break;
        case 'senior':
        case 'junior':
          // Senior/junior can see teams they belong to
          whereClause.teamLeadId = user.teamLeadId;
          break;
        default:
          throw new ForbiddenException('Insufficient permissions');
      }
    }

    // Apply query filters
    if (query.teamId) {
      whereClause.id = query.teamId;
    }

    if (query.salesUnitId) {
      whereClause.salesUnitId = query.salesUnitId;
    }

    if (query.hasLead !== undefined) {
      if (query.hasLead) {
        whereClause.teamLeadId = { not: null };
      } else {
        whereClause.teamLeadId = null;
      }
    }

    if (query.hasMembers !== undefined) {
      if (query.hasMembers) {
        whereClause.employeeCount = { gt: 1 };
      } else {
        whereClause.employeeCount = 1;
      }
    }

    if (query.hasLeads !== undefined) {
      // This would require a subquery to check if team has leads
      // For now, we'll implement this in the service logic
    }

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
      whereClause.salesUnit = {
        name: {
          contains: query.unitName,
          mode: 'insensitive'
        }
      };
    }

    if (query.minMembers !== undefined) {
      whereClause.employeeCount = { gte: query.minMembers };
    }

    if (query.maxMembers !== undefined) {
      whereClause.employeeCount = { lte: query.maxMembers };
    }

    if (query.minCompletedLeads !== undefined) {
      whereClause.completedLeads = { gte: query.minCompletedLeads };
    }

    if (query.maxCompletedLeads !== undefined) {
      whereClause.completedLeads = { lte: query.maxCompletedLeads };
    }

    if (query.assigned !== undefined) {
      if (query.assigned) {
        whereClause.salesUnitId = { not: null };
      } else {
        whereClause.salesUnitId = null;
      }
    }

    return whereClause;
  }

  private buildIncludeClause(include?: string): any {
    const includeClause: any = {};
    
    if (include?.includes('members')) {
      // Members will be fetched separately for better control
    }
    
    if (include?.includes('leads')) {
      // Leads will be fetched separately for better control
    }
    
    if (include?.includes('unit')) {
      includeClause.salesUnit = {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          address: true
        }
      };
    }
    
    if (include?.includes('lead')) {
      includeClause.teamLead = {
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
      };
    }
    
    return includeClause;
  }

  private buildOrderByClause(sortBy?: string, sortOrder?: string): any {
    const order = sortOrder === 'desc' ? 'desc' : 'asc';
    
    switch (sortBy) {
      case 'name':
        return { name: order };
      case 'createdAt':
        return { createdAt: order };
      case 'updatedAt':
        return { updatedAt: order };
      case 'employeeCount':
        return { employeeCount: order };
      case 'completedLeads':
        return { completedLeads: order };
      default:
        return { createdAt: 'desc' };
    }
  }

  private checkUserAccessToTeam(user: any, team: any): boolean {
    if (!user) return false;

    switch (user.role) {
      case 'dep_manager':
        return true;
      case 'unit_head':
        return team.salesUnit?.headId === user.id;
      case 'team_lead':
        return team.teamLeadId === user.id;
      case 'senior':
      case 'junior':
        return team.teamLeadId === user.teamLeadId;
      default:
        return false;
    }
  }

  private checkUserAccessToUpdateTeam(user: any, team: any): boolean {
    if (!user) return false;

    switch (user.role) {
      case 'dep_manager':
        return true;
      case 'unit_head':
        return team.salesUnit?.headId === user.id;
      case 'team_lead':
        return team.teamLeadId === user.id;
      default:
        return false;
    }
  }


} 