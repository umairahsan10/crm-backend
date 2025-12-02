import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../../../prisma/prisma.service';
import { CreateProductionDto } from '../dto/production.dto';
import { UpdateProductionDto } from '../dto/production.dto';
import {
  ProductionResponseDto,
  ProductionsListResponseDto,
} from '../dto/production.dto';

@Injectable()
export class ProductionService {
  private readonly logger = new Logger(ProductionService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new production record
   * Validates that the employee exists and is not already in production
   */
  async createProduction(
    dto: CreateProductionDto,
    hrEmployeeId: number,
  ): Promise<ProductionResponseDto> {
    // Validate HR employee exists
    const hrEmployee = await this.prisma.employee.findUnique({
      where: { id: hrEmployeeId },
    });

    if (!hrEmployee) {
      throw new NotFoundException(
        `HR Employee with ID ${hrEmployeeId} not found`,
      );
    }

    // Get HR record
    const hrRecord = await this.prisma.hR.findUnique({
      where: { employeeId: hrEmployeeId },
    });

    if (!hrRecord) {
      throw new NotFoundException(
        `HR record not found for employee ${hrEmployeeId}`,
      );
    }

    // Check if employee exists
    const employee = await this.prisma.employee.findUnique({
      where: { id: dto.employeeId },
    });

    if (!employee) {
      throw new NotFoundException(
        `Employee with ID ${dto.employeeId} not found`,
      );
    }

    // Check if employee is already in production
    const existingProduction = await this.prisma.production.findFirst({
      where: { employeeId: dto.employeeId },
    });

    if (existingProduction) {
      throw new BadRequestException(
        `Employee ${dto.employeeId} is already in production department`,
      );
    }

    // Validate production unit if provided
    let productionUnitName = 'N/A';
    if (dto.productionUnitId) {
      const productionUnit = await this.prisma.productionUnit.findUnique({
        where: { id: dto.productionUnitId },
        select: { name: true },
      });

      if (!productionUnit) {
        throw new NotFoundException(
          `Production unit with ID ${dto.productionUnitId} not found`,
        );
      }
      productionUnitName = productionUnit.name;
    }

    try {
      const production = await this.prisma.production.create({
        data: {
          employeeId: dto.employeeId,
          specialization: dto.specialization,
          productionUnitId: dto.productionUnitId,
          projectsCompleted: dto.projectsCompleted,
        },
        include: {
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          productionUnit: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      // Create HR log entry with detailed information
      const logDescription = `Production record created for employee ${employee.firstName} ${employee.lastName} (ID: ${employee.id}, Email: ${employee.email}) - Production Unit: ${productionUnitName}, Specialization: ${dto.specialization || 'N/A'}, Projects Completed: ${dto.projectsCompleted || 0}`;
      await this.createHrLog(
        hrEmployeeId,
        'production_created',
        employee.id,
        logDescription,
      );

      this.logger.log(
        `Production record created for employee ${dto.employeeId}`,
      );
      return production;
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      this.logger.error(`Failed to create production record: ${error.message}`);
      throw new BadRequestException(
        `Failed to create production record: ${error.message}`,
      );
    }
  }

  /**
   * Get all production records with optional employee filtering
   */
  async getAllProductions(
    employeeId?: number,
    page: number = 1,
    limit: number = 10,
  ): Promise<ProductionsListResponseDto> {
    try {
      const where = employeeId ? { employeeId } : {};
      const skip = (page - 1) * limit;

      const productions = await this.prisma.production.findMany({
        where,
        include: {
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          productionUnit: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      });

      const total = await this.prisma.production.count({ where });
      const totalPages = Math.ceil(total / limit);

      return {
        productions,
        total,
        page,
        limit,
        totalPages,
      };
    } catch (error) {
      this.logger.error(`Failed to get production records: ${error.message}`);
      throw new BadRequestException(
        `Failed to get production records: ${error.message}`,
      );
    }
  }

  /**
   * Get production record by ID
   */
  async getProductionById(id: number): Promise<ProductionResponseDto> {
    try {
      const production = await this.prisma.production.findUnique({
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
          productionUnit: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      if (!production) {
        throw new NotFoundException(
          `Production record with ID ${id} not found`,
        );
      }

      return production;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Failed to get production record ${id}: ${error.message}`,
      );
      throw new BadRequestException(
        `Failed to get production record: ${error.message}`,
      );
    }
  }

  /**
   * Update production record
   * Allows updating any column of the production table
   */
  async updateProduction(
    id: number,
    dto: UpdateProductionDto,
    hrEmployeeId: number,
  ): Promise<ProductionResponseDto> {
    // Validate HR employee exists
    const hrEmployee = await this.prisma.employee.findUnique({
      where: { id: hrEmployeeId },
    });

    if (!hrEmployee) {
      throw new NotFoundException(
        `HR Employee with ID ${hrEmployeeId} not found`,
      );
    }

    // Get HR record
    const hrRecord = await this.prisma.hR.findUnique({
      where: { employeeId: hrEmployeeId },
    });

    if (!hrRecord) {
      throw new NotFoundException(
        `HR record not found for employee ${hrEmployeeId}`,
      );
    }

    // Check if production record exists
    const existingProduction = await this.prisma.production.findUnique({
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
        productionUnit: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!existingProduction) {
      throw new NotFoundException(`Production record with ID ${id} not found`);
    }

    // Validate production unit if provided
    let newProductionUnitName = 'N/A';
    if (dto.productionUnitId) {
      const productionUnit = await this.prisma.productionUnit.findUnique({
        where: { id: dto.productionUnitId },
        select: { name: true },
      });

      if (!productionUnit) {
        throw new NotFoundException(
          `Production unit with ID ${dto.productionUnitId} not found`,
        );
      }
      newProductionUnitName = productionUnit.name;
    }

    try {
      // Track changes for logging
      const changes: string[] = [];
      if (
        dto.specialization !== undefined &&
        dto.specialization !== existingProduction.specialization
      ) {
        changes.push(
          `Specialization: ${existingProduction.specialization || 'N/A'} → ${dto.specialization}`,
        );
      }
      if (
        dto.productionUnitId !== undefined &&
        dto.productionUnitId !== existingProduction.productionUnitId
      ) {
        const oldUnitName = existingProduction.productionUnit?.name || 'N/A';
        changes.push(
          `Production Unit: ${oldUnitName} → ${newProductionUnitName}`,
        );
      }
      if (
        dto.projectsCompleted !== undefined &&
        dto.projectsCompleted !== existingProduction.projectsCompleted
      ) {
        changes.push(
          `Projects Completed: ${existingProduction.projectsCompleted || 0} → ${dto.projectsCompleted}`,
        );
      }

      const production = await this.prisma.production.update({
        where: { id },
        data: {
          specialization: dto.specialization,
          productionUnitId: dto.productionUnitId,
          projectsCompleted: dto.projectsCompleted,
        },
        include: {
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          productionUnit: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      // Create HR log entry with detailed changes
      const logDescription =
        changes.length > 0
          ? `Production record updated for employee ${existingProduction.employee.firstName} ${existingProduction.employee.lastName} (ID: ${existingProduction.employee.id}) - Changes: ${changes.join(', ')}`
          : `Production record updated for employee ${existingProduction.employee.firstName} ${existingProduction.employee.lastName} (ID: ${existingProduction.employee.id}) - No changes detected`;

      await this.createHrLog(
        hrEmployeeId,
        'production_updated',
        existingProduction.employee.id,
        logDescription,
      );

      this.logger.log(`Production record ${id} updated successfully`);
      return production;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      this.logger.error(
        `Failed to update production record ${id}: ${error.message}`,
      );
      throw new BadRequestException(
        `Failed to update production record: ${error.message}`,
      );
    }
  }

  /**
   * Delete production record and handle related cleanup
   * Removes employee from production and updates related tables
   */
  async deleteProduction(
    id: number,
    hrEmployeeId: number,
  ): Promise<{ message: string }> {
    // Validate HR employee exists
    const hrEmployee = await this.prisma.employee.findUnique({
      where: { id: hrEmployeeId },
    });

    if (!hrEmployee) {
      throw new NotFoundException(
        `HR Employee with ID ${hrEmployeeId} not found`,
      );
    }

    // Get HR record
    const hrRecord = await this.prisma.hR.findUnique({
      where: { employeeId: hrEmployeeId },
    });

    if (!hrRecord) {
      throw new NotFoundException(
        `HR record not found for employee ${hrEmployeeId}`,
      );
    }

    // Check if production record exists
    const existingProduction = await this.prisma.production.findUnique({
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
        productionUnit: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!existingProduction) {
      throw new NotFoundException(`Production record with ID ${id} not found`);
    }

    const employeeId = existingProduction.employeeId;

    // Store production details before deletion for logging
    const productionDetails = {
      productionUnitName: existingProduction.productionUnit?.name || 'N/A',
      specialization: existingProduction.specialization,
      projectsCompleted: existingProduction.projectsCompleted,
    };

    try {
      // Use transaction to ensure all operations succeed or fail together
      await this.prisma.$transaction(async (prisma) => {
        // Delete the production record
        await prisma.production.delete({
          where: { id },
        });

        this.logger.log(
          `Production record ${id} deleted successfully for employee ${employeeId}`,
        );
      });

      // Create HR log entry with detailed production information
      const logDescription = `Production record deleted for employee ${existingProduction.employee.firstName} ${existingProduction.employee.lastName} (ID: ${existingProduction.employee.id}, Email: ${existingProduction.employee.email}) - Production Unit: ${productionDetails.productionUnitName}, Specialization: ${productionDetails.specialization || 'N/A'}, Projects Completed: ${productionDetails.projectsCompleted || 0}`;
      await this.createHrLog(
        hrEmployeeId,
        'production_deleted',
        existingProduction.employee.id,
        logDescription,
      );

      return {
        message: `Employee ${existingProduction.employee.firstName} ${existingProduction.employee.lastName} removed from production department successfully`,
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      this.logger.error(
        `Failed to delete production record ${id}: ${error.message}`,
      );
      throw new BadRequestException(
        `Failed to delete production record: ${error.message}`,
      );
    }
  }

  /**
   * Helper method to create HR log entries
   */
  private async createHrLog(
    hrEmployeeId: number,
    actionType: string,
    affectedEmployeeId: number,
    description: string,
  ) {
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
        this.logger.log(
          `HR log created for action: ${actionType}, affected employee: ${affectedEmployeeId}`,
        );
      } else {
        this.logger.warn(
          `No HR record found for HR employee ${hrEmployeeId}, skipping log creation`,
        );
      }
    } catch (error) {
      this.logger.error(`Failed to create HR log: ${error.message}`);
      // Don't fail the main operation if log creation fails
    }
  }
}
