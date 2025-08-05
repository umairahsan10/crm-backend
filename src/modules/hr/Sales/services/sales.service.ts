import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../../prisma/prisma.service';
import { CreateSalesDepartmentDto, UpdateSalesDepartmentDto } from '../dto/sales.dto';

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
      throw error;
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
      throw error;
    }
  }

  async createSalesDepartment(dto: CreateSalesDepartmentDto) {
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

      this.logger.log(`Created sales department record for employee ${dto.employeeId}`);
      return salesDepartment;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Failed to create sales department: ${error.message}`);
      throw new BadRequestException(`Failed to create sales department: ${error.message}`);
    }
  }

  async updateSalesDepartment(id: number, dto: UpdateSalesDepartmentDto) {
    try {
      const existingSalesDept = await this.prisma.salesDepartment.findUnique({
        where: { id },
        include: { employee: { select: { id: true, firstName: true, lastName: true, email: true } } },
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

  async deleteSalesDepartment(id: number) {
    try {
      const existingSalesDept = await this.prisma.salesDepartment.findUnique({
        where: { id },
        include: { employee: { select: { id: true, firstName: true, lastName: true, email: true } } },
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
} 