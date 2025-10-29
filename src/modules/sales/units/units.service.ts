import { Injectable, BadRequestException, ConflictException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { CreateSalesUnitDto } from './dto/create-unit.dto';
import { UpdateSalesUnitDto } from './dto/update-unit.dto';
import { SalesUnitsQueryDto } from './dto/units-query.dto';

@Injectable()
export class UnitsService {
  constructor(private prisma: PrismaService) {}

  async createUnit(createUnitDto: CreateSalesUnitDto) {
    const { name, email, phone, address, headId, logoUrl, website } = createUnitDto;

    // Validate headId only if provided
    if (headId) {
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
    }

    // Check if email already exists
    const existingEmail = await this.prisma.salesUnit.findUnique({
      where: { email }
    });

    if (existingEmail) {
      throw new ConflictException('Email already exists');
    }

    // Check if phone already exists
    const existingPhone = await this.prisma.salesUnit.findUnique({
      where: { phone }
    });

    if (existingPhone) {
      throw new ConflictException('Phone number already exists');
    }

    // Check if name already exists
    const existingName = await this.prisma.salesUnit.findUnique({
      where: { name }
    });

    if (existingName) {
      throw new ConflictException('Unit name already exists');
    }

    // Create the sales unit
    const newUnit = await this.prisma.salesUnit.create({
      data: {
        name,
        email,
        phone,
        address,
        headId,
        logoUrl,
        website
        // createdAt and updatedAt are automatically handled by Prisma
      }
    });

    return {
      success: true,
      message: 'New Unit Created Successfully'
    };
  }

  async getAllUnits(user: any, query: SalesUnitsQueryDto) {
    const whereClause: any = await this.buildRoleBasedWhereClause(user);
    
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
    
    if (query.hasLeads !== undefined) {
      if (query.hasLeads) {
        whereClause.leads = { some: {} };
      } else {
        whereClause.leads = { none: {} };
      }
    }

    if (query.hasEmployees !== undefined) {
      if (query.hasEmployees) {
        whereClause.salesEmployees = { some: {} };
      } else {
        whereClause.salesEmployees = { none: {} };
      }
    }

    // Search functionality
    if (query.search) {
      whereClause.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
        { phone: { contains: query.search, mode: 'insensitive' } }
      ];
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
      this.prisma.salesUnit.findMany({
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
      this.prisma.salesUnit.count({ where: whereClause })
    ]);

    // Get counts for each unit
    const unitsWithCounts = await Promise.all(
      units.map(async (unit) => {
        const teamsCount = await this.prisma.team.count({
          where: { salesUnitId: unit.id }
        });

        const employeesCount = await this.prisma.salesDepartment.count({
          where: { salesUnitId: unit.id }
        });

        const leadsCount = await this.prisma.lead.count({
          where: { salesUnitId: unit.id }
        });

        const archiveLeadsCount = await this.prisma.archiveLead.count({
          where: { unitId: unit.id }
        });

        return {
          id: unit.id,
          name: unit.name,
          email: unit.email,
          phone: unit.phone,
          address: unit.address,
          headId: unit.headId,
          logoUrl: unit.logoUrl,
          website: unit.website,
          createdAt: unit.createdAt,
          updatedAt: unit.updatedAt,
          head: unit.head && typeof unit.head === 'object' && 'id' in unit.head ? {
            id: (unit.head as any).id,
            firstName: (unit.head as any).firstName,
            lastName: (unit.head as any).lastName
          } : null,
          teamsCount,
          employeesCount,
          leadsCount,
          archiveLeadsCount,
          ...(unit.teams && { teams: unit.teams }),
          ...(unit.salesEmployees && { salesEmployees: unit.salesEmployees }),
          ...(unit.leads && { leads: unit.leads })
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
    // Check if unit exists and get details with comprehensive data
    const unit = await this.prisma.salesUnit.findUnique({
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
      throw new NotFoundException(`Unit with ID ${id} does not exist`);
    }

    // Check if user belongs to this unit (for all roles except dep_manager)
    if (user && user.role !== 'dep_manager') {
      const belongsToUnit = await this.checkUserBelongsToUnit(user, unit.id);
      if (!belongsToUnit) {
        throw new ForbiddenException('You do not have access to this unit. You must be a member of this unit to view its details.');
      }
    }

    // Get comprehensive data based on user role
    let filteredTeams = unit.teams;
    let filteredSalesEmployees: any[] = [];
    let filteredLeads: any = {
      active: [],
      cracked: [],
      archived: []
    };

    // Role-based data filtering
    if (user && ['unit_head', 'team_lead', 'senior', 'junior'].includes(user.role)) {
      // For unit_head - show all data if they are the head of this unit
      if (user.role === 'unit_head' && unit.headId === user.id) {
        filteredTeams = unit.teams;
        filteredSalesEmployees = await this.getSalesEmployeesForUnit(unit.id);
        filteredLeads = await this.getAllLeadsForUnit(unit.id);
      } else if (user.role === 'team_lead') {
        // Team leads see only teams they lead and related data
        filteredTeams = unit.teams.filter(team => team.teamLeadId === user.id);
        if (filteredTeams.length > 0) {
          filteredSalesEmployees = await this.getSalesEmployeesForUnit(unit.id);
          filteredLeads = await this.getLeadsForTeamLead(user.id, unit.id);
        }
      } else if (['senior', 'junior'].includes(user.role)) {
        // For senior/junior, check if they are sales employees in this unit
        const isSalesEmployee = await this.prisma.salesDepartment.findFirst({
          where: {
            salesUnitId: unit.id,
            employeeId: user.id
          }
        });

        if (isSalesEmployee) {
          // Show all teams in the unit (they work in the unit)
          filteredTeams = unit.teams;
          // Show only themselves
          filteredSalesEmployees = await this.getSalesEmployeesForUnit(unit.id, user.id);
          // Show only leads they are involved with
          filteredLeads = await this.getLeadsForEmployee(user.id, unit.id);
        } else {
          // If not a sales employee in this unit, show no data
          filteredTeams = [];
          filteredSalesEmployees = [];
          filteredLeads = { active: [], cracked: [], archived: [] };
        }
      }
    } else {
      // For dep_manager - show all data (no filtering)
      filteredSalesEmployees = await this.getSalesEmployeesForUnit(unit.id);
      filteredLeads = await this.getAllLeadsForUnit(unit.id);
    }

    // Get comprehensive counts
    const teamsCount = await this.prisma.team.count({
      where: { salesUnitId: unit.id }
    });

    const employeesCount = await this.prisma.salesDepartment.count({
      where: { salesUnitId: unit.id }
    });

    const leadsCount = await this.prisma.lead.count({
      where: { salesUnitId: unit.id }
    });

    const crackedLeadsCount = await this.prisma.crackedLead.count({
      where: {
        lead: { salesUnitId: unit.id }
      }
    });

    const archiveLeadsCount = await this.prisma.archiveLead.count({
      where: { unitId: unit.id }
    });

    // Calculate conversion rate
    const totalLeads = leadsCount + archiveLeadsCount;
    const conversionRate = totalLeads > 0 ? (crackedLeadsCount / totalLeads) * 100 : 0;

    return {
      success: true,
      data: {
        id: unit.id,
        name: unit.name,
        email: unit.email,
        phone: unit.phone,
        address: unit.address,
        headId: unit.headId,
        logoUrl: unit.logoUrl,
        website: unit.website,
        createdAt: unit.createdAt,
        updatedAt: unit.updatedAt,
        head: unit.head,
        teams: filteredTeams,
        employees: filteredSalesEmployees,
        leads: filteredLeads,
        summary: {
          teamsCount: filteredTeams.length,
          employeesCount,
          leadsCount: {
            active: filteredLeads.active.length,
            cracked: filteredLeads.cracked.length,
            archived: filteredLeads.archived.length,
            total: leadsCount + archiveLeadsCount
          },
          conversionRate: Math.round(conversionRate * 100) / 100
        }
      },
      message: 'Unit details retrieved successfully'
    };
  }



  async getArchiveLeadsFromDeletedUnits(currentUser: any) {
    // Get all archive leads from deleted units (unitId = null)
    const archiveLeads = await this.prisma.archiveLead.findMany({
      where: { unitId: null },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: {
        archivedOn: 'desc'
      }
    });

    return {
      success: true,
      data: archiveLeads.map(archiveLead => ({
        id: archiveLead.id,
        leadId: archiveLead.leadId,
        name: archiveLead.name,
        email: archiveLead.email,
        phone: archiveLead.phone,
        source: archiveLead.source,
        outcome: archiveLead.outcome,
        qualityRating: archiveLead.qualityRating,
        createdAt: archiveLead.createdAt,
        archivedOn: archiveLead.archivedOn,
        assignedTo: archiveLead.employee ? {
          id: archiveLead.employee.id,
          firstName: archiveLead.employee.firstName,
          lastName: archiveLead.employee.lastName
        } : null
      })),
      total: archiveLeads.length,
      message: archiveLeads.length > 0 ? 'Archive leads from deleted units retrieved successfully' : 'No archive leads found from deleted units'
    };
  }

  async updateUnit(id: number, updateUnitDto: UpdateSalesUnitDto) {
    // Check if unit exists
    const existingUnit = await this.prisma.salesUnit.findUnique({
      where: { id }
    });

    if (!existingUnit) {
      throw new NotFoundException(`Unit with ID ${id} does not exist`);
    }

    const { name, email, phone, address, headId, logoUrl, website } = updateUnitDto;

    // Enhanced headId validation logic
    if (headId !== undefined && headId !== null) {
      // Check if employee exists and has unit_head role
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

      // Check if employee is already head of another unit
      const existingHeadAssignment = await this.prisma.salesUnit.findFirst({
        where: { 
          headId: headId,
          id: { not: id } // Exclude current unit
        }
      });

      if (existingHeadAssignment) {
        throw new ConflictException(`Employee is already assigned as head of unit: ${existingHeadAssignment.name}`);
      }
    }

    // Check if email already exists (exclude current unit)
    if (email) {
      const existingEmail = await this.prisma.salesUnit.findFirst({
        where: { 
          email,
          id: { not: id } // Exclude current unit
        }
      });

      if (existingEmail) {
        throw new ConflictException('Email already exists');
      }
    }

    // Check if phone already exists (exclude current unit)
    if (phone) {
      const existingPhone = await this.prisma.salesUnit.findFirst({
        where: { 
          phone,
          id: { not: id } // Exclude current unit
        }
      });

      if (existingPhone) {
        throw new ConflictException('Phone number already exists');
      }
    }

    // Check if name already exists (exclude current unit)
    if (name) {
      const existingName = await this.prisma.salesUnit.findFirst({
        where: { 
          name,
          id: { not: id } // Exclude current unit
        }
      });

      if (existingName) {
        throw new ConflictException('Unit name already exists');
      }
    }

    // Update the sales unit (only provided fields)
    const updateData: any = {};
    
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (address !== undefined) updateData.address = address;
    if (headId !== undefined) updateData.headId = headId; // Allow null, 0, or any valid ID
    if (logoUrl !== undefined) updateData.logoUrl = logoUrl;
    if (website !== undefined) updateData.website = website;

    const updatedUnit = await this.prisma.salesUnit.update({
      where: { id },
      data: updateData,
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

    return {
      success: true,
      message: 'Unit updated successfully',
      data: {
        id: updatedUnit.id,
        name: updatedUnit.name,
        head: updatedUnit.head
      }
    };
  }

  async deleteUnit(id: number) {
    // Check if unit exists
    const existingUnit = await this.prisma.salesUnit.findUnique({
      where: { id }
    });

    if (!existingUnit) {
      throw new NotFoundException(`Unit with ID ${id} does not exist`);
    }

    // Check for teams associated with this unit
    const teams = await this.prisma.team.findMany({
      where: { salesUnitId: id },
      select: { id: true, name: true }
    });

    // Check for leads associated with this unit
    const leads = await this.prisma.lead.findMany({
      where: { salesUnitId: id },
      select: { id: true, name: true, email: true }
    });

    // Check for sales employees associated with this unit
    const salesEmployees = await this.prisma.salesDepartment.findMany({
      where: { salesUnitId: id },
      include: {
        employee: {
          select: { id: true, firstName: true, lastName: true }
        }
      }
    });

    // Count archive leads associated with this unit
    const archiveLeadsCount = await this.prisma.archiveLead.count({
      where: { unitId: id }
    });

    // Check if there are any dependencies
    const hasDependencies = teams.length > 0 || leads.length > 0 || salesEmployees.length > 0;

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
          leads: {
            count: leads.length,
            details: leads.map(lead => ({
              id: lead.id,
              name: lead.name,
              email: lead.email
            }))
          },
          employees: {
            count: salesEmployees.length,
            details: salesEmployees.map(emp => ({
              id: emp.employee.id,
              firstName: emp.employee.firstName,
              lastName: emp.employee.lastName
            }))
          }
        },
        archiveLeads: {
          count: archiveLeadsCount,
          message: `${archiveLeadsCount} archived leads will be assigned unit ID null`
        }
      };
    }

    // If no dependencies, proceed with deletion
    // First, update archive leads to set unitId = null
    if (archiveLeadsCount > 0) {
      await this.prisma.archiveLead.updateMany({
        where: { unitId: id },
        data: { unitId: null }
      });
    }

    // Delete the unit
    await this.prisma.salesUnit.delete({
      where: { id }
    });

    return {
      success: true,
      message: `Unit deleted successfully. ${archiveLeadsCount} archived leads have been assigned unit ID null.`
    };
  }

  private async checkUserBelongsToUnit(user: any, unitId: number): Promise<boolean> {
    switch (user.role) {
      case 'unit_head':
        // Check if user is the head of this unit
        const unit = await this.prisma.salesUnit.findFirst({
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
            salesUnitId: unitId,
            teamLeadId: user.id
          }
        });
        return !!teamLeadCheck;

      case 'senior':
      case 'junior':
        // Check if user is a sales employee in this unit
        const salesEmployeeCheck = await this.prisma.salesDepartment.findFirst({
          where: {
            salesUnitId: unitId,
            employeeId: user.id
          }
        });
        return !!salesEmployeeCheck;

      default:
        return false;
    }
  }

  private async buildRoleBasedWhereClause(user: any): Promise<any> {
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
        // Find units through sales department membership
        return {
          salesEmployees: {
            some: {
              employeeId: user.id
            }
          }
        }; // Units where they are sales employees
      default:
        throw new ForbiddenException('Insufficient permissions');
    }
  }

  private buildIncludeClause(include?: string): any {
    const includeClause: any = {};
    
    if (include?.includes('employees')) {
      includeClause.salesEmployees = {
        include: {
          employee: {
            include: {
              role: true
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
    
    if (include?.includes('leads')) {
      includeClause.leads = {
        include: {
          assignedTo: true,
          crackedBy: true
        }
      };
    }
    
    return includeClause;
  }

  private async getSalesEmployeesForUnit(unitId: number, employeeId?: number) {
    const whereClause: any = { salesUnitId: unitId };
    if (employeeId) {
      whereClause.employeeId = employeeId;
    }

    return await this.prisma.salesDepartment.findMany({
      where: whereClause,
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

  private async getAllLeadsForUnit(unitId: number) {
    const [activeLeads, crackedLeads, archivedLeads] = await Promise.all([
      // Active leads
      this.prisma.lead.findMany({
        where: { salesUnitId: unitId },
        include: {
          assignedTo: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          },
          startedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      // Cracked leads
      this.prisma.crackedLead.findMany({
        where: {
          lead: { salesUnitId: unitId }
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
      }),
      // Archived leads
      this.prisma.archiveLead.findMany({
        where: { unitId: unitId },
        include: {
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          }
        },
        orderBy: { archivedOn: 'desc' }
      })
    ]);

    return {
      active: activeLeads,
      cracked: crackedLeads,
      archived: archivedLeads
    };
  }

  private async getLeadsForTeamLead(teamLeadId: number, unitId: number) {
    // Get teams led by this team lead
    const teams = await this.prisma.team.findMany({
      where: {
        salesUnitId: unitId,
        teamLeadId: teamLeadId
      },
      select: { id: true }
    });

    const teamIds = teams.map(team => team.id);

    const [activeLeads, crackedLeads, archivedLeads] = await Promise.all([
      // Active leads assigned to team members
      this.prisma.lead.findMany({
        where: {
          salesUnitId: unitId,
          assignedTo: {
            teamLeadId: teamLeadId
          }
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
      }),
      // Cracked leads by team members
      this.prisma.crackedLead.findMany({
        where: {
          lead: { salesUnitId: unitId },
          employee: {
            teamLeadId: teamLeadId
          }
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
      }),
      // Archived leads by team members
      this.prisma.archiveLead.findMany({
        where: {
          unitId: unitId,
          employee: {
            teamLeadId: teamLeadId
          }
        },
        include: {
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          }
        },
        orderBy: { archivedOn: 'desc' }
      })
    ]);

    return {
      active: activeLeads,
      cracked: crackedLeads,
      archived: archivedLeads
    };
  }

  private async getLeadsForEmployee(employeeId: number, unitId: number) {
    const [activeLeads, crackedLeads, archivedLeads] = await Promise.all([
      // Active leads assigned to this employee
      this.prisma.lead.findMany({
        where: {
          salesUnitId: unitId,
          assignedToId: employeeId
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
      }),
      // Cracked leads by this employee
      this.prisma.crackedLead.findMany({
        where: {
          lead: { salesUnitId: unitId },
          closedBy: employeeId
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
      }),
      // Archived leads by this employee
      this.prisma.archiveLead.findMany({
        where: {
          unitId: unitId,
          assignedTo: employeeId
        },
        include: {
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          }
        },
        orderBy: { archivedOn: 'desc' }
      })
    ]);

    return {
      active: activeLeads,
      cracked: crackedLeads,
      archived: archivedLeads
    };
  }

  async getAvailableUnitHeads(assigned?: boolean) {
    let employees;

    if (assigned === true) {
      // Get only assigned heads
      employees = await this.prisma.employee.findMany({
        where: {
          role: {
            name: 'unit_head'
          },
          department: {
            name: 'Sales'
          },
          status: 'active',
          salesUnitHead: {
            some: {}
          }
        },
        include: {
          salesUnitHead: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: {
          firstName: 'asc'
        }
      });
    } else if (assigned === false) {
      // Get only unassigned heads
      employees = await this.prisma.employee.findMany({
        where: {
          role: {
            name: 'unit_head'
          },
          department: {
            name: 'Sales'
          },
          status: 'active',
          salesUnitHead: {
            none: {}
          }
        },
        orderBy: {
          firstName: 'asc'
        }
      });
    } else {
      // Get all heads (default behavior)
      employees = await this.prisma.employee.findMany({
        where: {
          role: {
            name: 'unit_head'
          },
          department: {
            name: 'Sales'
          },
          status: 'active'
        },
        include: {
          salesUnitHead: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: {
          firstName: 'asc'
        }
      });
    }

    // Format the response
    const heads = employees.map(employee => ({
      id: employee.id,
      firstName: employee.firstName,
      lastName: employee.lastName,
      email: employee.email,
      currentUnit: employee.salesUnitHead && employee.salesUnitHead.length > 0 ? {
        id: employee.salesUnitHead[0].id,
        name: employee.salesUnitHead[0].name
      } : null
    }));

    return {
      success: true,
      message: 'Unit heads retrieved successfully',
      data: {
        heads
      }
    };
  }

  async getAvailableTeams(assigned?: boolean) {
    const whereClause: any = {};

    if (assigned === true) {
      // Show teams assigned to sales units
      whereClause.salesUnitId = { not: null };
    } else if (assigned === false) {
      // Show orphan teams (not assigned to any unit)
      whereClause.salesUnitId = null;
      whereClause.productionUnitId = null;
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
        salesUnit: {
          select: {
            id: true,
            name: true
          }
        },
        productionUnit: {
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
        isAssigned: team.salesUnitId !== null || team.productionUnitId !== null || team.marketingUnitId !== null,
        currentUnit: team.salesUnit || team.productionUnit || team.marketingUnit
      })),
      total: teams.length,
      message: teams.length > 0 
        ? 'Available teams retrieved successfully' 
        : 'No available teams found'
    };
  }

  async addTeamToUnit(unitId: number, teamId: number) {
    // Validate unit exists
    const unit = await this.prisma.salesUnit.findUnique({
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
    if (team.salesUnitId !== null || team.productionUnitId !== null || team.marketingUnitId !== null) {
      throw new BadRequestException(
        `Team "${team.name}" (ID: ${teamId}) is already assigned to a unit. ` +
        `Only orphan teams (not assigned to any unit) can be assigned to a sales unit.`
      );
    }

    // Assign team to unit
    await this.prisma.team.update({
      where: { id: teamId },
      data: { salesUnitId: unitId }
    });

    return {
      success: true,
      message: `Team "${team.name}" successfully assigned to unit "${unit.name}"`
    };
  }

  async removeTeamFromUnit(unitId: number, teamId: number) {
    // Validate unit exists
    const unit = await this.prisma.salesUnit.findUnique({
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
    if (team.salesUnitId !== unitId) {
      throw new BadRequestException(
        `Team "${team.name}" (ID: ${teamId}) does not belong to unit "${unit.name}" (ID: ${unitId})`
      );
    }

    // Remove team from unit
    await this.prisma.team.update({
      where: { id: teamId },
      data: { salesUnitId: null }
    });

    return {
      success: true,
      message: `Team "${team.name}" successfully removed from unit "${unit.name}"`
    };
  }
}
