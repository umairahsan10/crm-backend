import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../../prisma/prisma.service';
import { CreateMarketingDto, UpdateMarketingDto } from '../dto/marketing.dto';

@Injectable()
export class MarketingService {
  private readonly logger = new Logger(MarketingService.name);

  constructor(
    private readonly prisma: PrismaService,
  ) { }

  async getAllMarketingRecords() {
    try {
      const marketingRecords = await this.prisma.marketing.findMany({
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
          marketingUnit: {
            select: {
              id: true,
              name: true,
              leadQualityScore: true,
              head: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      this.logger.log(`Retrieved ${marketingRecords.length} marketing records`);
      return marketingRecords;
    } catch (error) {
      this.logger.error(`Failed to retrieve marketing records: ${error.message}`);
      throw error;
    }
  }

  async getMarketingRecordById(id: number) {
    try {
      const marketingRecord = await this.prisma.marketing.findUnique({
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
          marketingUnit: {
            select: {
              id: true,
              name: true,
              leadQualityScore: true,
              head: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
          },
        },
      });

      if (!marketingRecord) {
        throw new NotFoundException(`Marketing record with ID ${id} not found`);
      }

      this.logger.log(`Retrieved marketing record with ID ${id}`);
      return marketingRecord;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to retrieve marketing record ${id}: ${error.message}`);
      throw error;
    }
  }

  async createMarketingRecord(dto: CreateMarketingDto) {
    try {
      const employee = await this.prisma.employee.findUnique({
        where: { id: dto.employeeId },
        select: { id: true, firstName: true, lastName: true, email: true },
      });

      if (!employee) {
        throw new BadRequestException(`Employee with ID ${dto.employeeId} does not exist. Marketing records can only be created for existing employees.`);
      }

      const existingMarketingRecord = await this.prisma.marketing.findFirst({
        where: { employeeId: dto.employeeId },
      });

      if (existingMarketingRecord) {
        throw new BadRequestException(`Marketing record already exists for employee ${dto.employeeId}. Use update endpoint instead.`);
      }

      const marketingRecord = await this.prisma.marketing.create({
        data: {
          employeeId: dto.employeeId,
          marketingUnitId: dto.marketingUnitId,
          totalCampaignsRun: dto.totalCampaignsRun,
          platformFocus: dto.platformFocus,
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
          marketingUnit: {
            select: {
              id: true,
              name: true,
              leadQualityScore: true,
              head: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
          },
        },
      });

      this.logger.log(`Created marketing record for employee ${dto.employeeId}`);
      return marketingRecord;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Failed to create marketing record: ${error.message}`);
      throw new BadRequestException(`Failed to create marketing record: ${error.message}`);
    }
  }

  async updateMarketingRecord(id: number, dto: UpdateMarketingDto) {
    try {
      const existingMarketingRecord = await this.prisma.marketing.findUnique({
        where: { id },
        include: { employee: { select: { id: true, firstName: true, lastName: true, email: true } } },
      });

      if (!existingMarketingRecord) {
        throw new NotFoundException(`Marketing record with ID ${id} not found`);
      }

      const employee = await this.prisma.employee.findUnique({
        where: { id: existingMarketingRecord.employeeId },
        select: { id: true, firstName: true, lastName: true, email: true },
      });

      if (!employee) {
        throw new BadRequestException(`Employee with ID ${existingMarketingRecord.employeeId} no longer exists. Cannot update marketing record.`);
      }

      const updatedMarketingRecord = await this.prisma.marketing.update({
        where: { id },
        data: {
          marketingUnitId: dto.marketingUnitId,
          totalCampaignsRun: dto.totalCampaignsRun,
          platformFocus: dto.platformFocus,
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
          marketingUnit: {
            select: {
              id: true,
              name: true,
              leadQualityScore: true,
              head: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
          },
        },
      });

      this.logger.log(`Updated marketing record with ID ${id}`);
      return updatedMarketingRecord;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Failed to update marketing record ${id}: ${error.message}`);
      throw new BadRequestException(`Failed to update marketing record: ${error.message}`);
    }
  }

  async deleteMarketingRecord(id: number) {
    try {
      const existingMarketingRecord = await this.prisma.marketing.findUnique({
        where: { id },
        include: { employee: { select: { id: true, firstName: true, lastName: true, email: true } } },
      });

      if (!existingMarketingRecord) {
        throw new NotFoundException(`Marketing record with ID ${id} not found`);
      }

      const employee = await this.prisma.employee.findUnique({
        where: { id: existingMarketingRecord.employeeId },
        select: { id: true, firstName: true, lastName: true, email: true },
      });

      if (!employee) {
        throw new BadRequestException(`Employee with ID ${existingMarketingRecord.employeeId} no longer exists. Cannot delete marketing record.`);
      }

      const result = await this.prisma.$transaction(async (tx) => {
        await tx.marketing.delete({
          where: { id },
        });

        await tx.marketingUnit.updateMany({
          where: { headId: existingMarketingRecord.employeeId },
          data: { headId: null },
        });

        await tx.team.updateMany({
          where: { teamLeadId: existingMarketingRecord.employeeId },
          data: { teamLeadId: null },
        });

        return {
          message: `Marketing record for employee ${employee.firstName} ${employee.lastName} (ID: ${existingMarketingRecord.employeeId}) has been successfully deleted.`,
          deletedRecord: {
            id: existingMarketingRecord.id,
            employeeId: existingMarketingRecord.employeeId,
            employeeName: `${employee.firstName} ${employee.lastName}`,
            employeeEmail: employee.email,
          }
        };
      });

      this.logger.log(`Deleted marketing record with ID ${id} for employee ${existingMarketingRecord.employeeId} and updated related records`);
      return result;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Failed to delete marketing record ${id}: ${error.message}`);
      throw new BadRequestException(`Failed to delete marketing record: ${error.message}`);
    }
  }
}