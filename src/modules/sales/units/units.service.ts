import { Injectable, BadRequestException, ConflictException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { CreateSalesUnitDto } from './dto/create-unit.dto';
import { UpdateSalesUnitDto } from './dto/update-unit.dto';

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

  async getAllUnits() {
    const units = await this.prisma.salesUnit.findMany({
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
          where: { salesUnitId: unit.id }
        });

        const employeesCount = await this.prisma.salesDepartment.count({
          where: { salesUnitId: unit.id }
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
          head: unit.head ? {
            id: unit.head.id,
            firstName: unit.head.firstName,
            lastName: unit.head.lastName
          } : null,
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
    // Check if unit exists and get details with head information
    const unit = await this.prisma.salesUnit.findUnique({
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
      return {
        success: false,
        message: `Unit with ID ${id} does not exist`
      };
    }

    // Get count of teams associated with this unit
    const teamsCount = await this.prisma.team.count({
      where: { salesUnitId: id }
    });

    // Get count of employees associated with this unit
    const employeesCount = await this.prisma.salesDepartment.count({
      where: { salesUnitId: id }
    });

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
        head: unit.head ? {
          id: unit.head.id,
          firstName: unit.head.firstName,
          lastName: unit.head.lastName
        } : null,
        teamsCount,
        employeesCount
      },
      message: 'Unit details retrieved successfully'
    };
  }

  async getEmployeesInUnit(id: number, currentUser: any) {
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

    // Get all active employees in this unit
    const salesEmployees = await this.prisma.salesDepartment.findMany({
      where: { 
        salesUnitId: id 
      },
      include: {
        employee: {
          include: {
            role: true
          }
        }
      }
    });

    // Filter only active employees and get their team information
    const employeesWithTeams = await Promise.all(
      salesEmployees
        .filter(salesEmp => salesEmp.employee.status === 'active')
        .map(async (salesEmp) => {
          const employee = salesEmp.employee;
          
          // Find the team for this employee
          let team: { id: number; name: string } | null = null;
          if (employee.teamLeadId) {
            const foundTeam = await this.prisma.team.findFirst({
              where: { teamLeadId: employee.teamLeadId },
              select: {
                id: true,
                name: true
              }
            });
            if (foundTeam && foundTeam.name) {
              team = {
                id: foundTeam.id,
                name: foundTeam.name
              };
            }
          }

          return {
            id: employee.id,
            firstName: employee.firstName,
            lastName: employee.lastName,
            email: employee.email,
            phone: employee.phone,
            role: {
              id: employee.role.id,
              name: employee.role.name
            },
            team: team,
            startDate: employee.startDate
          };
        })
    );

    // Sort alphabetically by firstName, then lastName
    const sortedEmployees = employeesWithTeams.sort((a, b) => {
      if (a.firstName !== b.firstName) {
        return a.firstName.localeCompare(b.firstName);
      }
      return a.lastName.localeCompare(b.lastName);
    });

    return {
      success: true,
      data: sortedEmployees,
      total: sortedEmployees.length,
      message: sortedEmployees.length > 0 ? 'Employees retrieved successfully' : 'No employees found in this unit'
    };
  }

  async getLeadsInUnit(id: number, currentUser: any) {
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

    // Get all leads associated with this unit
    const leads = await this.prisma.lead.findMany({
      where: { salesUnitId: id },
      include: {
        crackedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
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
        },
        closedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return {
      success: true,
      data: leads.map(lead => ({
        id: lead.id,
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        source: lead.source,
        type: lead.type,
        status: lead.status,
        failedCount: lead.failedCount,
        outcome: lead.outcome,
        qualityRating: lead.qualityRating,
        createdAt: lead.createdAt,
        updatedAt: lead.updatedAt,
        closedAt: lead.closedAt,
        crackedBy: lead.crackedBy,
        assignedTo: lead.assignedTo,
        startedBy: lead.startedBy,
        closedBy: lead.closedBy
      })),
      total: leads.length,
      message: leads.length > 0 ? 'Leads retrieved successfully' : 'No leads found in this unit'
    };
  }

  async getArchiveLeadsInUnit(id: number, currentUser: any) {
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

    // Get all archive leads associated with this unit
    const archiveLeads = await this.prisma.archiveLead.findMany({
      where: { unitId: id },
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
      message: archiveLeads.length > 0 ? 'Archive leads retrieved successfully' : 'No archive leads found in this unit'
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
}
