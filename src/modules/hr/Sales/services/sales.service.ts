import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../../prisma/prisma.service';
import { CreateSalesDepartmentDto, UpdateSalesDepartmentDto, UpdateCommissionRateDto, UpdateTargetAmountDto } from '../dto/sales.dto';

@Injectable()
export class SalesService {
  private readonly logger = new Logger(SalesService.name);

  constructor(
    private readonly prisma: PrismaService,
  ) { }

  async getAllSalesDepartments() {
    try {
      const salesDepartments = await this.prisma.salesDepartment.findMany({
        include: {
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              status: true,
              department: {
                select: {
                  id: true,
                  name: true,
                },
              },
              role: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          salesUnit: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              address: true,
              logoUrl: true,
              website: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      this.logger.log(`Retrieved ${salesDepartments.length} sales departments`);
      return salesDepartments;
    } catch (error) {
      this.logger.error(`Failed to retrieve sales departments: ${error.message}`);
      throw new BadRequestException(`Failed to retrieve sales departments: ${error.message}`);
    }
  }

  async getSalesDepartmentById(id: number) {
    try {
      const salesDepartment = await this.prisma.salesDepartment.findUnique({
        where: { id },
        include: {
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              status: true,
              department: {
                select: {
                  id: true,
                  name: true,
                },
              },
              role: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          salesUnit: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              address: true,
              logoUrl: true,
              website: true,
            },
          },
        },
      });

      if (!salesDepartment) {
        throw new NotFoundException(`Sales department with ID ${id} not found`);
      }

      this.logger.log(`Retrieved sales department with ID ${id}`);
      return salesDepartment;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to retrieve sales department ${id}: ${error.message}`);
      throw new BadRequestException(`Failed to retrieve sales department: ${error.message}`);
    }
  }

  async createSalesDepartment(dto: CreateSalesDepartmentDto, hrEmployeeId: number) {
    // Validate HR employee exists
    const hrEmployee = await this.prisma.employee.findUnique({
      where: { id: hrEmployeeId },
    });

    if (!hrEmployee) {
      throw new NotFoundException(`HR Employee with ID ${hrEmployeeId} not found`);
    }

    // Get HR record
    const hrRecord = await this.prisma.hR.findUnique({
      where: { employeeId: hrEmployeeId },
    });

    if (!hrRecord) {
      throw new NotFoundException(`HR record not found for employee ${hrEmployeeId}`);
    }

    try {
      const employee = await this.prisma.employee.findUnique({
        where: { id: dto.employeeId },
        select: { id: true, firstName: true, lastName: true, email: true },
      });

      if (!employee) {
        throw new BadRequestException(`Employee with ID ${dto.employeeId} does not exist. Sales department records can only be created for existing employees.`);
      }

      const existingSalesDept = await this.prisma.salesDepartment.findFirst({
        where: { employeeId: dto.employeeId },
      });

      if (existingSalesDept) {
        throw new BadRequestException(`Sales department record already exists for employee ${dto.employeeId}. Use update endpoint instead.`);
      }

      // Get sales unit details if provided
      let salesUnitName = 'N/A';
      if (dto.salesUnitId) {
        const salesUnit = await this.prisma.salesUnit.findUnique({
          where: { id: dto.salesUnitId },
          select: { name: true },
        });
        if (salesUnit) {
          salesUnitName = salesUnit.name;
        }
      }

      const salesDepartment = await this.prisma.salesDepartment.create({
        data: {
          employeeId: dto.employeeId,
          leadsClosed: dto.leadsClosed,
          salesAmount: dto.salesAmount,
          salesUnitId: dto.salesUnitId,
          commissionRate: dto.commissionRate,
          commissionAmount: dto.commissionAmount,
          salesBonus: dto.salesBonus,
          withholdCommission: dto.withholdCommission,
          withholdFlag: dto.withholdFlag,
          targetAmount: dto.targetAmount,
          chargebackDeductions: dto.chargebackDeductions,
          refundDeductions: dto.refundDeductions,
        },
        include: {
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              status: true,
              department: {
                select: {
                  id: true,
                  name: true,
                },
              },
              role: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          salesUnit: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              address: true,
              logoUrl: true,
              website: true,
            },
          },
        },
      });

      // Create HR log entry with detailed information
      const logDescription = `Sales department record created for employee ${employee.firstName} ${employee.lastName} (ID: ${employee.id}, Email: ${employee.email}) - Sales Unit: ${salesUnitName}, Leads Closed: ${dto.leadsClosed || 0}, Sales Amount: ${dto.salesAmount || 0}, Commission Rate: ${dto.commissionRate || 0}%, Target Amount: ${dto.targetAmount || 0}`;
      await this.createHrLog(hrEmployeeId, 'sales_department_created', employee.id, logDescription);

      this.logger.log(`Created sales department record for employee ${dto.employeeId}`);
      return salesDepartment;
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to create sales department: ${error.message}`);
      throw new BadRequestException(`Failed to create sales department: ${error.message}`);
    }
  }

  async updateSalesDepartment(id: number, dto: UpdateSalesDepartmentDto, hrEmployeeId: number) {
    // Validate HR employee exists
    const hrEmployee = await this.prisma.employee.findUnique({
      where: { id: hrEmployeeId },
    });

    if (!hrEmployee) {
      throw new NotFoundException(`HR Employee with ID ${hrEmployeeId} not found`);
    }

    // Get HR record
    const hrRecord = await this.prisma.hR.findUnique({
      where: { employeeId: hrEmployeeId },
    });

    if (!hrRecord) {
      throw new NotFoundException(`HR record not found for employee ${hrEmployeeId}`);
    }

    try {
      const existingSalesDept = await this.prisma.salesDepartment.findUnique({
        where: { id },
        include: { 
          employee: { select: { id: true, firstName: true, lastName: true, email: true } },
          salesUnit: { select: { name: true } }
        },
      });

      if (!existingSalesDept) {
        throw new NotFoundException(`Sales department with ID ${id} not found`);
      }

      const employee = await this.prisma.employee.findUnique({
        where: { id: existingSalesDept.employeeId },
        select: { id: true, firstName: true, lastName: true, email: true },
      });

      if (!employee) {
        throw new BadRequestException(`Employee with ID ${existingSalesDept.employeeId} no longer exists. Cannot update sales department record.`);
      }

      // Track changes for logging
      const changes: string[] = [];
      if (dto.leadsClosed !== undefined && dto.leadsClosed !== existingSalesDept.leadsClosed) {
        changes.push(`Leads Closed: ${existingSalesDept.leadsClosed || 0} → ${dto.leadsClosed}`);
      }
      if (dto.salesAmount !== undefined && dto.salesAmount !== Number(existingSalesDept.salesAmount)) {
        changes.push(`Sales Amount: ${existingSalesDept.salesAmount || 0} → ${dto.salesAmount}`);
      }
      if (dto.salesUnitId !== undefined && dto.salesUnitId !== existingSalesDept.salesUnitId) {
        const oldUnitName = existingSalesDept.salesUnit?.name || 'N/A';
        let newUnitName = 'N/A';
        if (dto.salesUnitId) {
          const newUnit = await this.prisma.salesUnit.findUnique({
            where: { id: dto.salesUnitId },
            select: { name: true },
          });
          if (newUnit) {
            newUnitName = newUnit.name;
          }
        }
        changes.push(`Sales Unit: ${oldUnitName} → ${newUnitName}`);
      }
      if (dto.commissionRate !== undefined && dto.commissionRate !== Number(existingSalesDept.commissionRate)) {
        changes.push(`Commission Rate: ${existingSalesDept.commissionRate || 0}% → ${dto.commissionRate}%`);
      }
      if (dto.commissionAmount !== undefined && dto.commissionAmount !== Number(existingSalesDept.commissionAmount)) {
        changes.push(`Commission Amount: ${existingSalesDept.commissionAmount || 0} → ${dto.commissionAmount}`);
      }
      if (dto.salesBonus !== undefined && dto.salesBonus !== Number(existingSalesDept.salesBonus)) {
        changes.push(`Sales Bonus: ${existingSalesDept.salesBonus || 0} → ${dto.salesBonus}`);
      }
      if (dto.withholdCommission !== undefined && dto.withholdCommission !== Number(existingSalesDept.withholdCommission)) {
        changes.push(`Withhold Commission: ${existingSalesDept.withholdCommission || 0} → ${dto.withholdCommission}`);
      }
      if (dto.withholdFlag !== undefined && dto.withholdFlag !== existingSalesDept.withholdFlag) {
        changes.push(`Withhold Flag: ${existingSalesDept.withholdFlag ? 'Yes' : 'No'} → ${dto.withholdFlag ? 'Yes' : 'No'}`);
      }
      if (dto.targetAmount !== undefined && dto.targetAmount !== Number(existingSalesDept.targetAmount)) {
        changes.push(`Target Amount: ${existingSalesDept.targetAmount || 0} → ${dto.targetAmount}`);
      }
      if (dto.chargebackDeductions !== undefined && dto.chargebackDeductions !== Number(existingSalesDept.chargebackDeductions)) {
        changes.push(`Chargeback Deductions: ${existingSalesDept.chargebackDeductions || 0} → ${dto.chargebackDeductions}`);
      }
      if (dto.refundDeductions !== undefined && dto.refundDeductions !== Number(existingSalesDept.refundDeductions)) {
        changes.push(`Refund Deductions: ${existingSalesDept.refundDeductions || 0} → ${dto.refundDeductions}`);
      }

      const updatedSalesDepartment = await this.prisma.salesDepartment.update({
        where: { id },
        data: {
          leadsClosed: dto.leadsClosed,
          salesAmount: dto.salesAmount,
          salesUnitId: dto.salesUnitId,
          commissionRate: dto.commissionRate,
          commissionAmount: dto.commissionAmount,
          salesBonus: dto.salesBonus,
          withholdCommission: dto.withholdCommission,
          withholdFlag: dto.withholdFlag,
          targetAmount: dto.targetAmount,
          chargebackDeductions: dto.chargebackDeductions,
          refundDeductions: dto.refundDeductions,
        },
        include: {
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              status: true,
              department: {
                select: {
                  id: true,
                  name: true,
                },
              },
              role: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          salesUnit: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              address: true,
              logoUrl: true,
              website: true,
            },
          },
        },
      });

      // Create HR log entry with detailed changes
      const logDescription = changes.length > 0 
        ? `Sales department record updated for employee ${employee.firstName} ${employee.lastName} (ID: ${employee.id}) - Changes: ${changes.join(', ')}`
        : `Sales department record updated for employee ${employee.firstName} ${employee.lastName} (ID: ${employee.id}) - No changes detected`;
      
      await this.createHrLog(hrEmployeeId, 'sales_department_updated', employee.id, logDescription);

      this.logger.log(`Updated sales department with ID ${id}`);
      return updatedSalesDepartment;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Failed to update sales department ${id}: ${error.message}`);
      throw new BadRequestException(`Failed to update sales department: ${error.message}`);
    }
  }

  async deleteSalesDepartment(id: number, hrEmployeeId: number) {
    // Validate HR employee exists
    const hrEmployee = await this.prisma.employee.findUnique({
      where: { id: hrEmployeeId },
    });

    if (!hrEmployee) {
      throw new NotFoundException(`HR Employee with ID ${hrEmployeeId} not found`);
    }

    // Get HR record
    const hrRecord = await this.prisma.hR.findUnique({
      where: { employeeId: hrEmployeeId },
    });

    if (!hrRecord) {
      throw new NotFoundException(`HR record not found for employee ${hrEmployeeId}`);
    }

    try {
      const existingSalesDept = await this.prisma.salesDepartment.findUnique({
        where: { id },
        include: { 
          employee: { select: { id: true, firstName: true, lastName: true, email: true } },
          salesUnit: { select: { name: true } }
        },
      });

      if (!existingSalesDept) {
        throw new NotFoundException(`Sales department with ID ${id} not found`);
      }

      const employee = await this.prisma.employee.findUnique({
        where: { id: existingSalesDept.employeeId },
        select: { id: true, firstName: true, lastName: true, email: true },
      });

      if (!employee) {
        throw new BadRequestException(`Employee with ID ${existingSalesDept.employeeId} no longer exists. Cannot delete sales department record.`);
      }

      // Store sales department details before deletion for logging
      const salesDetails = {
        salesUnitName: existingSalesDept.salesUnit?.name || 'N/A',
        leadsClosed: existingSalesDept.leadsClosed,
        salesAmount: existingSalesDept.salesAmount,
        commissionRate: existingSalesDept.commissionRate,
        commissionAmount: existingSalesDept.commissionAmount,
        salesBonus: existingSalesDept.salesBonus,
        targetAmount: existingSalesDept.targetAmount,
      };

      const result = await this.prisma.$transaction(async (tx) => {
        await tx.salesDepartment.delete({
          where: { id },
        });

        await tx.salesUnit.updateMany({
          where: { headId: existingSalesDept.employeeId },
          data: { headId: null },
        });

        await tx.team.updateMany({
          where: { teamLeadId: existingSalesDept.employeeId },
          data: { teamLeadId: null },
        });

        return {
          message: `Sales department record for employee ${employee.firstName} ${employee.lastName} (ID: ${existingSalesDept.employeeId}) has been successfully deleted.`,
          deletedRecord: {
            id: existingSalesDept.id,
            employeeId: existingSalesDept.employeeId,
            employeeName: `${employee.firstName} ${employee.lastName}`,
            employeeEmail: employee.email,
          }
        };
      });

      // Create HR log entry with detailed sales department information
      const logDescription = `Sales department record deleted for employee ${employee.firstName} ${employee.lastName} (ID: ${employee.id}, Email: ${employee.email}) - Sales Unit: ${salesDetails.salesUnitName}, Leads Closed: ${salesDetails.leadsClosed || 0}, Sales Amount: ${salesDetails.salesAmount || 0}, Commission Rate: ${salesDetails.commissionRate || 0}%, Commission Amount: ${salesDetails.commissionAmount || 0}, Sales Bonus: ${salesDetails.salesBonus || 0}, Target Amount: ${salesDetails.targetAmount || 0}`;
      await this.createHrLog(hrEmployeeId, 'sales_department_deleted', employee.id, logDescription);

      this.logger.log(`Deleted sales department with ID ${id} for employee ${existingSalesDept.employeeId} and updated related records`);
      return result;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Failed to delete sales department ${id}: ${error.message}`);
      throw new BadRequestException(`Failed to delete sales department: ${error.message}`);
    }
  }

  /**
   * Helper method to create HR log entries
   */
  private async createHrLog(hrEmployeeId: number, actionType: string, affectedEmployeeId: number, description: string) {
    try {
      const hrRecord = await this.prisma.hR.findUnique({
        where: { employeeId: hrEmployeeId },
      });

      if (hrRecord) {
        await this.prisma.hRLog.create({
          data: {
            hrId: hrRecord.id,
            actionType,
            affectedEmployeeId,
            description,
          },
        });
        this.logger.log(`HR log created for action: ${actionType}, affected employee: ${affectedEmployeeId}`);
      } else {
        this.logger.warn(`No HR record found for HR employee ${hrEmployeeId}, skipping log creation`);
      }
    } catch (error) {
      this.logger.error(`Failed to create HR log: ${error.message}`);
      // Don't fail the main operation if log creation fails
    }
  }

  /**
   * Update commission rate for a sales department record
   * Requires commission permission
   */
  async updateCommissionRate(id: number, dto: UpdateCommissionRateDto, hrEmployeeId: number) {
    try {
      // Check if sales department record exists
      const existingSalesDepartment = await this.prisma.salesDepartment.findUnique({
        where: { id },
        include: {
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      if (!existingSalesDepartment) {
        throw new NotFoundException(`Sales department record with ID ${id} not found`);
      }

      // Update commission rate
      const updatedSalesDepartment = await this.prisma.salesDepartment.update({
        where: { id },
        data: {
          commissionRate: dto.commissionRate,
        },
        include: {
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              status: true,
              department: {
                select: {
                  id: true,
                  name: true,
                },
              },
              role: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          salesUnit: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              address: true,
              logoUrl: true,
              website: true,
            },
          },
        },
      });

      // Create HR log
      await this.createHrLog(
        hrEmployeeId,
        'UPDATE_COMMISSION_RATE',
        existingSalesDepartment.employeeId,
        `Commission rate updated to ${dto.commissionRate}% for employee ${existingSalesDepartment.employee.firstName} ${existingSalesDepartment.employee.lastName}`
      );

      this.logger.log(`Commission rate updated for sales department ${id} to ${dto.commissionRate}%`);
      return updatedSalesDepartment;
    } catch (error) {
      this.logger.error(`Failed to update commission rate for sales department ${id}: ${error.message}`);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Failed to update commission rate: ${error.message}`);
    }
  }

  /**
   * Update target amount for a sales department record
   * Requires targets set permission
   */
  async updateTargetAmount(id: number, dto: UpdateTargetAmountDto, hrEmployeeId: number) {
    try {
      // Check if sales department record exists
      const existingSalesDepartment = await this.prisma.salesDepartment.findUnique({
        where: { id },
        include: {
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      if (!existingSalesDepartment) {
        throw new NotFoundException(`Sales department record with ID ${id} not found`);
      }

      // Update target amount
      const updatedSalesDepartment = await this.prisma.salesDepartment.update({
        where: { id },
        data: {
          targetAmount: dto.targetAmount,
        },
        include: {
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              status: true,
              department: {
                select: {
                  id: true,
                  name: true,
                },
              },
              role: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          salesUnit: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              address: true,
              logoUrl: true,
              website: true,
            },
          },
        },
      });

      // Create HR log
      await this.createHrLog(
        hrEmployeeId,
        'UPDATE_TARGET_AMOUNT',
        existingSalesDepartment.employeeId,
        `Target amount updated to $${dto.targetAmount} for employee ${existingSalesDepartment.employee.firstName} ${existingSalesDepartment.employee.lastName}`
      );

      this.logger.log(`Target amount updated for sales department ${id} to $${dto.targetAmount}`);
      return updatedSalesDepartment;
    } catch (error) {
      this.logger.error(`Failed to update target amount for sales department ${id}: ${error.message}`);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Failed to update target amount: ${error.message}`);
    }
  }
} 