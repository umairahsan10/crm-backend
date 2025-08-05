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
      throw new BadRequestException(`Failed to retrieve marketing records: ${error.message}`);
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
      throw new BadRequestException(`Failed to retrieve marketing record: ${error.message}`);
    }
  }

  async createMarketingRecord(dto: CreateMarketingDto, hrEmployeeId: number) {
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
        throw new BadRequestException(`Employee with ID ${dto.employeeId} does not exist. Marketing records can only be created for existing employees.`);
      }

      const existingMarketingRecord = await this.prisma.marketing.findFirst({
        where: { employeeId: dto.employeeId },
      });

      if (existingMarketingRecord) {
        throw new BadRequestException(`Marketing record already exists for employee ${dto.employeeId}. Use update endpoint instead.`);
      }

      // Get marketing unit details if provided
      let marketingUnitName = 'N/A';
      if (dto.marketingUnitId) {
        const marketingUnit = await this.prisma.marketingUnit.findUnique({
          where: { id: dto.marketingUnitId },
          select: { name: true },
        });
        if (marketingUnit) {
          marketingUnitName = marketingUnit.name;
        }
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

      // Create HR log entry with detailed information
      const logDescription = `Marketing record created for employee ${employee.firstName} ${employee.lastName} (ID: ${employee.id}, Email: ${employee.email}) - Marketing Unit: ${marketingUnitName}, Total Campaigns: ${dto.totalCampaignsRun || 0}, Platform Focus: ${dto.platformFocus || 'N/A'}`;
      await this.createHrLog(hrEmployeeId, 'marketing_created', employee.id, logDescription);

      this.logger.log(`Created marketing record for employee ${dto.employeeId}`);
      return marketingRecord;
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to create marketing record: ${error.message}`);
      throw new BadRequestException(`Failed to create marketing record: ${error.message}`);
    }
  }

  async updateMarketingRecord(id: number, dto: UpdateMarketingDto, hrEmployeeId: number) {
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
      const existingMarketingRecord = await this.prisma.marketing.findUnique({
        where: { id },
        include: { 
          employee: { select: { id: true, firstName: true, lastName: true, email: true } },
          marketingUnit: { select: { name: true } }
        },
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

      // Track changes for logging
      const changes: string[] = [];
      if (dto.marketingUnitId !== undefined && dto.marketingUnitId !== existingMarketingRecord.marketingUnitId) {
        const oldUnitName = existingMarketingRecord.marketingUnit?.name || 'N/A';
        let newUnitName = 'N/A';
        if (dto.marketingUnitId) {
          const newUnit = await this.prisma.marketingUnit.findUnique({
            where: { id: dto.marketingUnitId },
            select: { name: true },
          });
          if (newUnit) {
            newUnitName = newUnit.name;
          }
        }
        changes.push(`Marketing Unit: ${oldUnitName} → ${newUnitName}`);
      }
      if (dto.totalCampaignsRun !== undefined && dto.totalCampaignsRun !== existingMarketingRecord.totalCampaignsRun) {
        changes.push(`Total Campaigns: ${existingMarketingRecord.totalCampaignsRun || 0} → ${dto.totalCampaignsRun}`);
      }
      if (dto.platformFocus !== undefined && dto.platformFocus !== existingMarketingRecord.platformFocus) {
        changes.push(`Platform Focus: ${existingMarketingRecord.platformFocus || 'N/A'} → ${dto.platformFocus}`);
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

      // Create HR log entry with detailed changes
      const logDescription = changes.length > 0 
        ? `Marketing record updated for employee ${employee.firstName} ${employee.lastName} (ID: ${employee.id}) - Changes: ${changes.join(', ')}`
        : `Marketing record updated for employee ${employee.firstName} ${employee.lastName} (ID: ${employee.id}) - No changes detected`;
      
      await this.createHrLog(hrEmployeeId, 'marketing_updated', employee.id, logDescription);

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

  async deleteMarketingRecord(id: number, hrEmployeeId: number) {
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
      const existingMarketingRecord = await this.prisma.marketing.findUnique({
        where: { id },
        include: { 
          employee: { select: { id: true, firstName: true, lastName: true, email: true } },
          marketingUnit: { select: { name: true } }
        },
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

      // Store marketing details before deletion for logging
      const marketingDetails = {
        marketingUnitName: existingMarketingRecord.marketingUnit?.name || 'N/A',
        totalCampaignsRun: existingMarketingRecord.totalCampaignsRun,
        platformFocus: existingMarketingRecord.platformFocus,
      };

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

      // Create HR log entry with detailed marketing information
      const logDescription = `Marketing record deleted for employee ${employee.firstName} ${employee.lastName} (ID: ${employee.id}, Email: ${employee.email}) - Marketing Unit: ${marketingDetails.marketingUnitName}, Total Campaigns: ${marketingDetails.totalCampaignsRun || 0}, Platform Focus: ${marketingDetails.platformFocus || 'N/A'}`;
      await this.createHrLog(hrEmployeeId, 'marketing_deleted', employee.id, logDescription);

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
}