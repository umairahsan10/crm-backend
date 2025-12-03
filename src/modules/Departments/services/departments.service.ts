import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { CreateDepartmentDto } from '../dto/create-department.dto';
import { UpdateDepartmentDto } from '../dto/update-department.dto';
import { GetDepartmentsDto } from '../dto/get-departments.dto';

@Injectable()
export class DepartmentsService {
  private readonly logger = new Logger(DepartmentsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new department
   */
  async createDepartment(dto: CreateDepartmentDto) {
    // Check if department name already exists
    const existingDepartment = await this.prisma.department.findUnique({
      where: { name: dto.name },
    });

    if (existingDepartment) {
      throw new BadRequestException(
        `Department with name "${dto.name}" already exists`,
      );
    }

    // Validate manager if provided
    if (dto.managerId) {
      const manager = await this.prisma.employee.findUnique({
        where: { id: dto.managerId },
      });

      if (!manager) {
        throw new NotFoundException(
          `Manager with ID ${dto.managerId} not found`,
        );
      }

      // Check if manager is already managing another department
      const existingManagerDepartment = await this.prisma.department.findUnique(
        {
          where: { managerId: dto.managerId },
        },
      );

      if (existingManagerDepartment) {
        throw new BadRequestException(
          `Employee ${dto.managerId} is already managing department "${existingManagerDepartment.name}"`,
        );
      }
    }

    try {
      const department = await this.prisma.department.create({
        data: {
          name: dto.name,
          description: dto.description,
          managerId: dto.managerId,
        },
        include: {
          manager: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          employees: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      this.logger.log(`Department "${department.name}" created successfully`);
      return department;
    } catch (error) {
      this.logger.error(`Failed to create department: ${error.message}`);
      throw new BadRequestException(
        `Failed to create department: ${error.message}`,
      );
    }
  }

  /**
   * Get all departments with filters and pagination
   */
  async getDepartments(filters: GetDepartmentsDto) {
    const { managerId, search, page = 1, limit = 10 } = filters;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (managerId) {
      where.managerId = managerId;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    try {
      const [departments, total] = await Promise.all([
        this.prisma.department.findMany({
          where,
          include: {
            manager: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            employees: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        this.prisma.department.count({ where }),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        departments,
        total,
        page,
        limit,
        totalPages,
      };
    } catch (error) {
      this.logger.error(`Failed to get departments: ${error.message}`);
      throw new BadRequestException(
        `Failed to get departments: ${error.message}`,
      );
    }
  }

  /**
   * Get a specific department by ID
   */
  async getDepartmentById(id: number) {
    const department = await this.prisma.department.findUnique({
      where: { id },
      include: {
        manager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        employees: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!department) {
      throw new NotFoundException(`Department with ID ${id} not found`);
    }

    return department;
  }

  /**
   * Update a department
   */
  async updateDepartment(id: number, dto: UpdateDepartmentDto) {
    // Check if department exists
    const existingDepartment = await this.prisma.department.findUnique({
      where: { id },
    });

    if (!existingDepartment) {
      throw new NotFoundException(`Department with ID ${id} not found`);
    }

    // Check if name is being updated and if it already exists
    if (dto.name && dto.name !== existingDepartment.name) {
      const nameExists = await this.prisma.department.findUnique({
        where: { name: dto.name },
      });

      if (nameExists) {
        throw new BadRequestException(
          `Department with name "${dto.name}" already exists`,
        );
      }
    }

    // Validate manager if being updated
    if (dto.managerId !== undefined) {
      if (dto.managerId === null) {
        // Setting manager to null is allowed
      } else {
        const manager = await this.prisma.employee.findUnique({
          where: { id: dto.managerId },
        });

        if (!manager) {
          throw new NotFoundException(
            `Manager with ID ${dto.managerId} not found`,
          );
        }

        // Check if manager is already managing another department
        const existingManagerDepartment =
          await this.prisma.department.findFirst({
            where: {
              managerId: dto.managerId,
              id: { not: id },
            },
          });

        if (existingManagerDepartment) {
          throw new BadRequestException(
            `Employee ${dto.managerId} is already managing department "${existingManagerDepartment.name}"`,
          );
        }
      }
    }

    try {
      const updateData: any = {};

      // Only include fields that are provided
      if (dto.name !== undefined) updateData.name = dto.name;
      if (dto.description !== undefined)
        updateData.description = dto.description;
      if (dto.managerId !== undefined) updateData.managerId = dto.managerId;

      const department = await this.prisma.department.update({
        where: { id },
        data: updateData,
        include: {
          manager: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          employees: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      this.logger.log(`Department ${id} updated successfully`);
      return department;
    } catch (error) {
      this.logger.error(`Failed to update department ${id}: ${error.message}`);
      throw new BadRequestException(
        `Failed to update department: ${error.message}`,
      );
    }
  }

  /**
   * Delete a department
   */
  async deleteDepartment(id: number) {
    // Check if department exists
    const department = await this.prisma.department.findUnique({
      where: { id },
      include: {
        employees: true,
      },
    });

    if (!department) {
      throw new NotFoundException(`Department with ID ${id} not found`);
    }

    // Check if department has employees
    if (department.employees.length > 0) {
      throw new BadRequestException(
        `Cannot delete department "${department.name}" because it has ${department.employees.length} employee(s). Please reassign employees first.`,
      );
    }

    try {
      await this.prisma.department.delete({
        where: { id },
      });

      this.logger.log(`Department "${department.name}" deleted successfully`);
      return { message: 'Department deleted successfully' };
    } catch (error) {
      this.logger.error(`Failed to delete department ${id}: ${error.message}`);
      throw new BadRequestException(
        `Failed to delete department: ${error.message}`,
      );
    }
  }
}
