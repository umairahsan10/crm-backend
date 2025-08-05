import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../../prisma/prisma.service';
import { CreateProductionDto } from '../dto/production.dto';
import { UpdateProductionDto } from '../dto/production.dto';
import { ProductionResponseDto, ProductionsListResponseDto } from '../dto/production.dto';

@Injectable()
export class ProductionService {
  private readonly logger = new Logger(ProductionService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new production record
   * Validates that the employee exists and is not already in production
   */
  async createProduction(dto: CreateProductionDto): Promise<ProductionResponseDto> {
    // Check if employee exists
    const employee = await this.prisma.employee.findUnique({
      where: { id: dto.employeeId },
    });

    if (!employee) {
      throw new NotFoundException(`Employee with ID ${dto.employeeId} not found`);
    }

    // Check if employee is already in production
    const existingProduction = await this.prisma.production.findFirst({
      where: { employeeId: dto.employeeId },
    });

    if (existingProduction) {
      throw new BadRequestException(`Employee ${dto.employeeId} is already in production department`);
    }

    // Validate production unit if provided
    if (dto.productionUnitId) {
      const productionUnit = await this.prisma.productionUnit.findUnique({
        where: { id: dto.productionUnitId },
      });

      if (!productionUnit) {
        throw new NotFoundException(`Production unit with ID ${dto.productionUnitId} not found`);
      }
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

      this.logger.log(`Production record created for employee ${dto.employeeId}`);
      return production;
    } catch (error) {
      this.logger.error(`Failed to create production record: ${error.message}`);
      throw new BadRequestException(`Failed to create production record: ${error.message}`);
    }
  }

  /**
   * Get all production records with optional employee filtering
   */
  async getAllProductions(employeeId?: number): Promise<ProductionsListResponseDto> {
    try {
      const where = employeeId ? { employeeId } : {};

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
      });

      const total = await this.prisma.production.count({ where });

      return {
        productions,
        total,
      };
    } catch (error) {
      this.logger.error(`Failed to get production records: ${error.message}`);
      throw new BadRequestException(`Failed to get production records: ${error.message}`);
    }
  }

  /**
   * Get production record by ID
   */
  async getProductionById(id: number): Promise<ProductionResponseDto> {
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
      throw new NotFoundException(`Production record with ID ${id} not found`);
    }

    return production;
  }

  /**
   * Update production record
   * Allows updating any column of the production table
   */
  async updateProduction(id: number, dto: UpdateProductionDto): Promise<ProductionResponseDto> {
    // Check if production record exists
    const existingProduction = await this.prisma.production.findUnique({
      where: { id },
    });

    if (!existingProduction) {
      throw new NotFoundException(`Production record with ID ${id} not found`);
    }

    // Validate production unit if provided
    if (dto.productionUnitId) {
      const productionUnit = await this.prisma.productionUnit.findUnique({
        where: { id: dto.productionUnitId },
      });

      if (!productionUnit) {
        throw new NotFoundException(`Production unit with ID ${dto.productionUnitId} not found`);
      }
    }

    try {
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

      this.logger.log(`Production record ${id} updated successfully`);
      return production;
    } catch (error) {
      this.logger.error(`Failed to update production record ${id}: ${error.message}`);
      throw new BadRequestException(`Failed to update production record: ${error.message}`);
    }
  }

  /**
   * Delete production record and handle related cleanup
   * Removes employee from production and updates related tables
   */
  async deleteProduction(id: number): Promise<{ message: string }> {
    // Check if production record exists
    const existingProduction = await this.prisma.production.findUnique({
      where: { id },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!existingProduction) {
      throw new NotFoundException(`Production record with ID ${id} not found`);
    }

    const employeeId = existingProduction.employeeId;

    try {
      // Use transaction to ensure all operations succeed or fail together
      await this.prisma.$transaction(async (prisma) => {
        // Delete the production record
        await prisma.production.delete({
          where: { id },
        });

        this.logger.log(`Production record ${id} deleted successfully for employee ${employeeId}`);
      });

      return {
        message: `Employee ${existingProduction.employee.firstName} ${existingProduction.employee.lastName} removed from production department successfully`,
      };
    } catch (error) {
      this.logger.error(`Failed to delete production record ${id}: ${error.message}`);
      throw new BadRequestException(`Failed to delete production record: ${error.message}`);
    }
  }
} 