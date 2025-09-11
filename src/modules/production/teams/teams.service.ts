import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';

@Injectable()
export class TeamsService {
  constructor(private prisma: PrismaService) {}

  // Utility method to reset team_id sequence
  private async resetTeamIdSequence() {
    try {
      await this.prisma.$executeRaw`SELECT setval('teams_team_id_seq', (SELECT COALESCE(MAX(team_id), 0) + 1 FROM teams))`;
    } catch (error) {
      // If the sequence doesn't exist, try alternative approach
      await this.prisma.$executeRaw`ALTER SEQUENCE teams_team_id_seq RESTART WITH (SELECT COALESCE(MAX(team_id), 0) + 1 FROM teams)`;
    }
  }

  // New Methods
  async createTeam(name: string, productionUnitId: number, teamLeadId: number) {
    // Proactively reset team_id sequence to prevent conflicts
    await this.resetTeamIdSequence();
    
    // Check if production unit exists
    const existingUnit = await this.prisma.productionUnit.findUnique({
      where: { id: productionUnitId }
    });

    if (!existingUnit) {
      throw new NotFoundException(`Production unit with ID ${productionUnitId} does not exist`);
    }

    // Check if team name is unique within the unit
    const existingTeam = await this.prisma.team.findFirst({
      where: {
        name,
        productionUnitId
      }
    });

    if (existingTeam) {
      throw new ConflictException(`Team name "${name}" already exists in this production unit`);
    }

    // Check if team lead exists and belongs to Production department
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

    if (teamLead.department.name !== 'Production') {
      throw new BadRequestException(
        `Team lead must belong to Production department. Current department: ${teamLead.department.name}`
      );
    }

    // Check if team lead has the correct role (team_lead role)
    if (teamLead.role.name !== 'team_lead') {
      throw new BadRequestException(
        `Only employees with team_lead role can be assigned as team leads. Current role: ${teamLead.role.name}`
      );
    }

    // Check if team lead is already assigned to another team
    const existingTeamLead = await this.prisma.team.findFirst({
      where: { teamLeadId }
    });

    if (existingTeamLead) {
      throw new ConflictException(
        `Employee with ID ${teamLeadId} is already a team lead of team "${existingTeamLead.name}"`
      );
    }

    // Create team
    let newTeam;
    try {
      newTeam = await this.prisma.team.create({
        data: {
          name,
          productionUnitId,
          teamLeadId,
          employeeCount: 1 // Start with team lead
        },
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
    } catch (error) {
      if (error.code === 'P2002' && error.meta?.target?.includes('team_id')) {
        // Handle sequence issue by resetting it
        await this.resetTeamIdSequence();
        
        // Try creating the team again
        newTeam = await this.prisma.team.create({
          data: {
            name,
            productionUnitId,
            teamLeadId,
            employeeCount: 1 // Start with team lead
          },
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
      } else {
        throw error;
      }
    }

    return {
      success: true,
      message: `Team "${name}" created successfully in production unit "${existingUnit.name}"`,
      data: {
        teamId: newTeam.id,
        teamName: newTeam.name,
        teamLead: newTeam.teamLead,
        productionUnit: newTeam.productionUnit,
        employeeCount: newTeam.employeeCount
      }
    };
  }

  async replaceTeamLead(teamId: number, newTeamLeadId: number) {
    // Check if team exists
    const existingTeam = await this.prisma.team.findUnique({
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

    if (!existingTeam) {
      throw new NotFoundException(`Team with ID ${teamId} does not exist`);
    }

    // Check if new team lead exists and belongs to Production department
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

    if (newTeamLead.department.name !== 'Production') {
      throw new BadRequestException(
        `Team lead must belong to Production department. Current department: ${newTeamLead.department.name}`
      );
    }

    // Check if new team lead has the correct role (team_lead role)
    if (newTeamLead.role.name !== 'team_lead') {
      throw new BadRequestException(
        `Only employees with team_lead role can be assigned as team leads. Current role: ${newTeamLead.role.name}`
      );
    }

    // Check if new team lead is already a team lead of another team
    const existingTeamLead = await this.prisma.team.findFirst({
      where: { 
        teamLeadId: newTeamLeadId,
        id: { not: teamId } // Exclude current team
      }
    });

    if (existingTeamLead) {
      throw new ConflictException(
        `Employee with ID ${newTeamLeadId} is already a team lead of team "${existingTeamLead.name}"`
      );
    }

    // Get all current team members (including team lead)
    const currentTeamMembers = await this.prisma.employee.findMany({
      where: { teamLeadId: existingTeam.teamLeadId }
    });

    // Update team with new team lead
    const updatedTeam = await this.prisma.team.update({
      where: { id: teamId },
      data: { teamLeadId: newTeamLeadId },
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

    // Update all team members to follow the new team lead
    await this.prisma.employee.updateMany({
      where: { teamLeadId: existingTeam.teamLeadId },
      data: { teamLeadId: newTeamLeadId }
    });

    // Update team employee count (include team lead + team members)
    const totalCount = currentTeamMembers.length + 1; // +1 for the new team lead
    await this.prisma.team.update({
      where: { id: teamId },
      data: { employeeCount: totalCount }
    });

    return {
      success: true,
      message: `Team lead replaced successfully. All ${currentTeamMembers.length} team members transferred to new team lead.`,
      data: {
        teamId: updatedTeam.id,
        teamName: updatedTeam.name,
        previousTeamLead: existingTeam.teamLead,
        newTeamLead: updatedTeam.teamLead,
        memberCount: totalCount
      }
    };
  }

  async addEmployeeToTeam(teamId: number, employeeId: number) {
    // Check if team exists
    const existingTeam = await this.prisma.team.findUnique({
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

    if (!existingTeam) {
      throw new NotFoundException(`Team with ID ${teamId} does not exist`);
    }

    // Check if employee exists and belongs to Production department
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

    if (employee.department.name !== 'Production') {
      throw new BadRequestException(
        `Employee must belong to Production department. Current department: ${employee.department.name}`
      );
    }

    // Check if employee has the correct role (senior or junior only)
    if (employee.role.name !== 'senior' && employee.role.name !== 'junior') {
      throw new BadRequestException(
        `Only employees with senior or junior role can be added to teams. Current role: ${employee.role.name}`
      );
    }

    // Check if employee is already in a team
    if (employee.teamLeadId !== null) {
      throw new ConflictException(
        `Employee with ID ${employeeId} is already a member of another team`
      );
    }

    // Check if employee is the team lead (they're already in the team)
    if (employeeId === existingTeam.teamLeadId) {
      throw new BadRequestException(
        `Employee with ID ${employeeId} is already the team lead of this team`
      );
    }

    // Use transaction to ensure all operations succeed or fail together
    const result = await this.prisma.$transaction(async (tx) => {
      // Add employee to team
      await tx.employee.update({
        where: { id: employeeId },
        data: { teamLeadId: existingTeam.teamLeadId }
      });

      // Update team employee count (include team lead + team members)
      const teamMembers = await tx.employee.findMany({
        where: { teamLeadId: existingTeam.teamLeadId }
      });
      
      // Count includes team lead + team members
      const totalCount = teamMembers.length + 1; // +1 for the team lead

      await tx.team.update({
        where: { id: teamId },
        data: { employeeCount: totalCount }
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
        teamId: existingTeam.id,
        teamName: existingTeam.name,
        teamLead: existingTeam.teamLead,
        addedEmployee: {
          id: employee.id,
          firstName: employee.firstName,
          lastName: employee.lastName
        },
        newEmployeeCount: totalCount,
        projectsUpdated: teamProjects.length
      };
    });

    return {
      success: true,
      message: `Employee "${employee.firstName} ${employee.lastName}" successfully added to team "${existingTeam.name}" and all team projects`,
      data: result
    };
  }

  async removeEmployeeFromTeam(teamId: number, employeeId: number) {
    // Check if team exists
    const existingTeam = await this.prisma.team.findUnique({
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

    if (!existingTeam) {
      throw new NotFoundException(`Team with ID ${teamId} does not exist`);
    }

    // Check if employee exists
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId }
    });

    if (!employee) {
      throw new NotFoundException(`Employee with ID ${employeeId} does not exist`);
    }

    // Check if employee is the team lead
    if (employeeId === existingTeam.teamLeadId) {
      throw new BadRequestException(
        `Cannot remove team lead from team. Use replace-lead endpoint instead.`
      );
    }

    // Check if employee is actually in this team
    if (employee.teamLeadId !== existingTeam.teamLeadId) {
      throw new BadRequestException(
        `Employee with ID ${employeeId} is not a member of this team`
      );
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
      // Remove employee from team
      await tx.employee.update({
        where: { id: employeeId },
        data: { teamLeadId: null }
      });

      // Update team employee count (include team lead + team members)
      const teamMembers = await tx.employee.findMany({
        where: { teamLeadId: existingTeam.teamLeadId }
      });
      
      // Count includes team lead + team members
      const totalCount = teamMembers.length + 1; // +1 for the team lead

      await tx.team.update({
        where: { id: teamId },
        data: { employeeCount: totalCount }
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
        teamId: existingTeam.id,
        teamName: existingTeam.name,
        removedEmployee: {
          id: employee.id,
          firstName: employee.firstName,
          lastName: employee.lastName
        },
        newEmployeeCount: totalCount,
        projectsUpdated: teamProjects.length
      };
    });

    return {
      success: true,
      message: `Employee "${employee.firstName} ${employee.lastName}" successfully removed from team "${existingTeam.name}" and all team projects`,
      data: result
    };
  }

  async unassignEmployeesFromTeam(teamId: number) {
    // Check if team exists
    const existingTeam = await this.prisma.team.findUnique({
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

    if (!existingTeam) {
      throw new NotFoundException(`Team with ID ${teamId} does not exist`);
    }

    // Get all team members (excluding team lead)
    // Only check for team members if team has a team lead, otherwise no team members to check
    const teamMembers = existingTeam.teamLeadId ? await this.prisma.employee.findMany({
      where: { 
        teamLeadId: existingTeam.teamLeadId,
        id: { not: existingTeam.teamLeadId } // Exclude team lead
      },
      select: {
        id: true,
        firstName: true,
        lastName: true
      }
    }) : [];

    // Check if there are no employees and no team lead to unassign
    if (teamMembers.length === 0 && !existingTeam.teamLeadId) {
      return {
        success: true,
        message: `No employees or team lead to unassign from team "${existingTeam.name}"`,
        data: {
          teamId: existingTeam.id,
          teamName: existingTeam.name,
          teamLead: existingTeam.teamLead,
          unassignedEmployees: [],
          unassignedCount: 0,
          teamLeadUnassigned: false,
          totalUnassigned: 0
        }
      };
    }

    // Unassign all team members (set their teamLeadId to null)
    const unassignedEmployees: Array<{ id: number; firstName: string; lastName: string }> = [];
    for (const employee of teamMembers) {
      await this.prisma.employee.update({
        where: { id: employee.id },
        data: { teamLeadId: null }
      });
      unassignedEmployees.push(employee);
    }

    // Always unassign team lead if exists
    let teamLeadUnassigned = false;
    if (existingTeam.teamLeadId) {
      await this.prisma.employee.update({
        where: { id: existingTeam.teamLeadId },
        data: { teamLeadId: null }
      });
      
      // Update team to remove team lead
      await this.prisma.team.update({
        where: { id: teamId },
        data: { teamLeadId: null }
      });
      
      teamLeadUnassigned = true;
    }

    const totalUnassigned = unassignedEmployees.length + (teamLeadUnassigned ? 1 : 0);
    const message = `${unassignedEmployees.length} employee(s) and ${teamLeadUnassigned ? 'team lead' : '0 team lead'} successfully unassigned from team "${existingTeam.name}"`;

    return {
      success: true,
      message,
      data: {
        teamId: existingTeam.id,
        teamName: existingTeam.name,
        teamLead: teamLeadUnassigned ? null : existingTeam.teamLead,
        unassignedEmployees: unassignedEmployees,
        unassignedCount: unassignedEmployees.length,
        teamLeadUnassigned: teamLeadUnassigned,
        totalUnassigned: totalUnassigned
      }
    };
  }

  async deleteTeam(teamId: number) {
    // Check if team exists
    const existingTeam = await this.prisma.team.findUnique({
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

    if (!existingTeam) {
      throw new NotFoundException(`Team with ID ${teamId} does not exist`);
    }

    // Get all team members (excluding team lead)
    // Only check for team members if team has a team lead, otherwise no team members to check
    const teamMembers = existingTeam.teamLeadId ? await this.prisma.employee.findMany({
      where: { 
        teamLeadId: existingTeam.teamLeadId,
        id: { not: existingTeam.teamLeadId } // Exclude team lead
      },
      select: {
        id: true,
        firstName: true,
        lastName: true
      }
    }) : [];

    // Get all projects assigned to this team
    const allProjects = await this.prisma.project.findMany({
      where: {
        teams: {
          some: {
            id: teamId
          }
        }
      },
      select: {
        id: true,
        description: true,
        status: true
      }
    });

    // Check if team has employees or team lead
    if (teamMembers.length > 0 || existingTeam.teamLeadId) {
      const totalAssigned = teamMembers.length + (existingTeam.teamLeadId ? 1 : 0);
      const message = existingTeam.teamLeadId 
        ? `Cannot delete team. ${teamMembers.length} employee(s) and team lead are still assigned to this team. Please unassign all employees and team lead first using the unassign-employees endpoint.`
        : `Cannot delete team. ${teamMembers.length} employee(s) are still assigned to this team. Please unassign all employees first using the unassign-employees endpoint.`;
      
      return {
        success: false,
        message,
        data: {
          teamId: existingTeam.id,
          teamName: existingTeam.name,
          teamLead: existingTeam.teamLead,
          assignedEmployees: teamMembers,
          assignedProjects: allProjects,
          canDelete: false,
          reason: 'employees_or_team_lead_assigned',
          suggestion: 'Use POST /production/teams/:teamId/unassign-employees'
        }
      };
    }

    // Check if team has active projects
    const activeProjects = allProjects.filter(project => 
      project.status && ['in_progress', 'onhold'].includes(project.status)
    );

    if (activeProjects.length > 0) {
      return {
        success: false,
        message: `Cannot delete team. ${activeProjects.length} active project(s) are assigned to this team. Please reassign or complete these projects first.`,
        data: {
          teamId: existingTeam.id,
          teamName: existingTeam.name,
          teamLead: existingTeam.teamLead,
          assignedEmployees: teamMembers,
          assignedProjects: allProjects,
          activeProjects: activeProjects,
          canDelete: false,
          reason: 'active_projects'
        }
      };
    }

    // Reassign team lead (set their teamLeadId to null) before deleting team
    if (existingTeam.teamLeadId) {
      await this.prisma.employee.update({
        where: { id: existingTeam.teamLeadId },
        data: { teamLeadId: null }
      });
    }

    // Delete team
    await this.prisma.team.delete({
      where: { id: teamId }
    });

    return {
      success: true,
      message: `Team "${existingTeam.name}" successfully deleted. Team lead has been unassigned.`,
      data: {
        teamId: existingTeam.id,
        teamName: existingTeam.name,
        teamLead: existingTeam.teamLead,
        assignedEmployees: teamMembers,
        assignedProjects: allProjects,
        canDelete: true
      }
    };
  }

  async getTeamDetails(teamId: number) {
    // Check if team exists
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
        currentProject: {
          select: {
            id: true,
            description: true,
            status: true,
            liveProgress: true,
            deadline: true
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

    if (!team) {
      throw new NotFoundException(`Team with ID ${teamId} does not exist`);
    }

    // Get all team members
    // Only check for team members if team has a team lead, otherwise no team members to check
    const teamMembers = team.teamLeadId ? await this.prisma.employee.findMany({
      where: { teamLeadId: team.teamLeadId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true
      }
    }) : [];

    return {
      success: true,
      data: {
        ...team,
        teamMembers,
        actualEmployeeCount: teamMembers.length + (team.teamLeadId ? 1 : 0) // +1 for the team lead only if team lead exists
      }
    };
  }

  async getEmployeeTeam(employeeId: number) {
    // Check if employee exists
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      include: {
        department: true
      }
    });

    if (!employee) {
      throw new NotFoundException(`Employee with ID ${employeeId} does not exist`);
    }

    // If employee has no team lead, they're not in any team
    if (!employee.teamLeadId) {
      return {
        success: true,
        data: null,
        message: `Employee "${employee.firstName} ${employee.lastName}" is not assigned to any team`
      };
    }

    // Find the team where this employee's team lead is the team lead
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
        currentProject: {
          select: {
            id: true,
            description: true,
            status: true
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
      data: {
        employee: {
          id: employee.id,
          firstName: employee.firstName,
          lastName: employee.lastName,
          department: employee.department.name
        },
        team
      }
    };
  }

  async getAllTeams() {
    // Get all teams that are either assigned to production units or have production team leads
    const teams = await this.prisma.team.findMany({
      where: {
        OR: [
          { productionUnitId: { not: null } }, // Teams assigned to production units
          {
            teamLead: {
              department: {
                name: 'Production'
              }
            }
          }
        ]
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
        },
        currentProject: {
          select: {
            id: true,
            description: true,
            status: true
          }
        },
        productionUnit: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: [
        { productionUnit: { name: 'asc' } },
        { name: 'asc' }
      ]
    });

    // Filter to only include teams where team lead belongs to Production department
    const productionTeams = teams.filter(team => 
      team.teamLead?.department?.name === 'Production' || team.productionUnitId !== null
    );

    // Get actual employee count for each team
    const teamsWithMemberCount = await Promise.all(
      productionTeams.map(async (team) => {
        const memberCount = team.teamLeadId ? await this.prisma.employee.count({
          where: { teamLeadId: team.teamLeadId }
        }) : 0;

        return {
          ...team,
          actualEmployeeCount: memberCount + (team.teamLeadId ? 1 : 0) // +1 for the team lead only if team lead exists
        };
      })
    );

    return {
      success: true,
      data: teamsWithMemberCount,
      total: teamsWithMemberCount.length,
      message: `All production teams retrieved successfully`
    };
  }

  // Existing Methods
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
      include: { 
        department: true,
        role: true
      }
    });

    if (!teamLead) {
      throw new BadRequestException(`Team lead with ID ${existingTeam.teamLeadId} does not exist`);
    }

    if (teamLead.department.name !== 'Production') {
      throw new BadRequestException(
        `Team lead must belong to Production department. Current department: ${teamLead.department.name}`
      );
    }

    // Validate that team lead has the correct role
    if (teamLead.role.name !== 'team_lead') {
      throw new BadRequestException(
        `Team lead must have team_lead role. Current role: ${teamLead.role.name}`
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

    // Get actual employee count for each team
    const teamsWithMemberCount = await Promise.all(
      teams.map(async (team) => {
        const memberCount = team.teamLeadId ? await this.prisma.employee.count({
          where: { teamLeadId: team.teamLeadId }
        }) : 0;

        return {
          ...team,
          actualEmployeeCount: memberCount + (team.teamLeadId ? 1 : 0) // +1 for the team lead only if team lead exists
        };
      })
    );

    return {
      success: true,
      data: teamsWithMemberCount,
      total: teamsWithMemberCount.length,
      message: teamsWithMemberCount.length > 0 
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

    // Get actual employee count for each team
    const teamsWithMemberCount = await Promise.all(
      productionTeams.map(async (team) => {
        const memberCount = team.teamLeadId ? await this.prisma.employee.count({
          where: { teamLeadId: team.teamLeadId }
        }) : 0;

        return {
          ...team,
          actualEmployeeCount: memberCount + (team.teamLeadId ? 1 : 0) // +1 for the team lead only if team lead exists
        };
      })
    );

    return {
      success: true,
      data: teamsWithMemberCount,
      total: teamsWithMemberCount.length,
      message: teamsWithMemberCount.length > 0 
        ? 'Available production teams retrieved successfully' 
        : 'No available production teams found'
    };
  }
} 