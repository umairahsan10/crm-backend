import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../../../prisma/prisma.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import {
  AdminDepartmentResponseDto,
  AdminDepartmentsListResponseDto,
} from './dto/department-response.dto';

@Injectable()
export class DepartmentsService {
  private readonly logger = new Logger(DepartmentsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get all departments with pagination
   */
  async getAllDepartments(
    page: number = 1,
    limit: number = 10,
    search?: string,
  ): Promise<AdminDepartmentsListResponseDto> {
    const skip = (page - 1) * limit;
    const where: any = {};

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
                email: true,
              },
            },
            _count: {
              select: {
                employees: true,
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

      // Map departments to include manager email and employees count
      const departmentsWithCount = departments.map((dept) => ({
        id: dept.id,
        name: dept.name,
        description: dept.description,
        managerId: dept.managerId,
        createdAt: dept.createdAt,
        updatedAt: dept.updatedAt,
        managerEmail: dept.manager?.email || null,
        employeesCount: dept._count.employees,
      }));

      return {
        departments: departmentsWithCount,
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
   * Get department by ID
   */
  async getDepartmentById(id: number): Promise<AdminDepartmentResponseDto> {
    const department = await this.prisma.department.findUnique({
      where: { id },
      include: {
        manager: {
          select: {
            email: true,
          },
        },
        _count: {
          select: {
            employees: true,
          },
        },
      },
    });

    if (!department) {
      throw new NotFoundException(`Department with ID ${id} not found`);
    }

    // Return with manager email and employees count
    return {
      id: department.id,
      name: department.name,
      description: department.description,
      managerId: department.managerId,
      createdAt: department.createdAt,
      updatedAt: department.updatedAt,
      managerEmail: department.manager?.email || null,
      employeesCount: department._count.employees,
    } as AdminDepartmentResponseDto;
  }

  /**
   * Create a new department
   */
  async createDepartment(
    dto: CreateDepartmentDto,
  ): Promise<AdminDepartmentResponseDto> {
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
              email: true,
            },
          },
          _count: {
            select: {
              employees: true,
            },
          },
        },
      });

      this.logger.log(`Department "${department.name}" created successfully`);

      // Return with manager email and employees count
      return {
        id: department.id,
        name: department.name,
        description: department.description,
        managerId: department.managerId,
        createdAt: department.createdAt,
        updatedAt: department.updatedAt,
        managerEmail: department.manager?.email || null,
        employeesCount: department._count.employees,
      } as AdminDepartmentResponseDto;
    } catch (error) {
      this.logger.error(`Failed to create department: ${error.message}`);
      throw new BadRequestException(
        `Failed to create department: ${error.message}`,
      );
    }
  }

  /**
   * Update a department
   */
  async updateDepartment(
    id: number,
    dto: UpdateDepartmentDto,
  ): Promise<AdminDepartmentResponseDto> {
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
              email: true,
            },
          },
          _count: {
            select: {
              employees: true,
            },
          },
        },
      });

      this.logger.log(`Department ${id} updated successfully`);

      // Return with manager email and employees count
      return {
        id: department.id,
        name: department.name,
        description: department.description,
        managerId: department.managerId,
        createdAt: department.createdAt,
        updatedAt: department.updatedAt,
        managerEmail: department.manager?.email || null,
        employeesCount: department._count.employees,
      } as AdminDepartmentResponseDto;
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
  async deleteDepartment(id: number): Promise<{ message: string }> {
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
