import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { CreateRoleDto } from '../dto/create-role.dto';
import { UpdateRoleDto } from '../dto/update-role.dto';
import { GetRolesDto } from '../dto/get-roles.dto';

@Injectable()
export class RolesService {
  private readonly logger = new Logger(RolesService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new role
   */
  async createRole(dto: CreateRoleDto) {
    // Check if role name already exists
    const existingRole = await this.prisma.role.findUnique({
      where: { name: dto.name },
    });

    if (existingRole) {
      throw new BadRequestException(`Role with name "${dto.name}" already exists`);
    }

    try {
      const role = await this.prisma.role.create({
        data: {
          name: dto.name,
          description: dto.description,
        },
        include: {
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

      this.logger.log(`Role "${role.name}" created successfully`);
      return role;
    } catch (error) {
      this.logger.error(`Failed to create role: ${error.message}`);
      throw new BadRequestException(`Failed to create role: ${error.message}`);
    }
  }

  /**
   * Get all roles with filters and pagination
   */
  async getRoles(filters: GetRolesDto) {
    const { search, page = 1, limit = 10 } = filters;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    try {
      const [roles, total] = await Promise.all([
        this.prisma.role.findMany({
          where,
          include: {
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
        this.prisma.role.count({ where }),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        roles,
        total,
        page,
        limit,
        totalPages,
      };
    } catch (error) {
      this.logger.error(`Failed to get roles: ${error.message}`);
      throw new BadRequestException(`Failed to get roles: ${error.message}`);
    }
  }

  /**
   * Get a specific role by ID
   */
  async getRoleById(id: number) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: {
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

    if (!role) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }

    return role;
  }

  /**
   * Update a role
   */
  async updateRole(id: number, dto: UpdateRoleDto) {
    // Check if role exists
    const existingRole = await this.prisma.role.findUnique({
      where: { id },
    });

    if (!existingRole) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }

    // Check if name is being updated and if it already exists
    if (dto.name && dto.name !== existingRole.name) {
      const nameExists = await this.prisma.role.findUnique({
        where: { name: dto.name },
      });

      if (nameExists) {
        throw new BadRequestException(`Role with name "${dto.name}" already exists`);
      }
    }

    try {
      const updateData: any = {};

      // Only include fields that are provided
      if (dto.name !== undefined) updateData.name = dto.name;
      if (dto.description !== undefined) updateData.description = dto.description;

      const role = await this.prisma.role.update({
        where: { id },
        data: updateData,
        include: {
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

      this.logger.log(`Role ${id} updated successfully`);
      return role;
    } catch (error) {
      this.logger.error(`Failed to update role ${id}: ${error.message}`);
      throw new BadRequestException(`Failed to update role: ${error.message}`);
    }
  }

  /**
   * Delete a role
   */
  async deleteRole(id: number) {
    // Check if role exists
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: {
        employees: true,
      },
    });

    if (!role) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }

    // Check if role has employees
    if (role.employees.length > 0) {
      throw new BadRequestException(`Cannot delete role "${role.name}" because it has ${role.employees.length} employee(s). Please reassign employees first.`);
    }

    try {
      await this.prisma.role.delete({
        where: { id },
      });

      this.logger.log(`Role "${role.name}" deleted successfully`);
      return { message: 'Role deleted successfully' };
    } catch (error) {
      this.logger.error(`Failed to delete role ${id}: ${error.message}`);
      throw new BadRequestException(`Failed to delete role: ${error.message}`);
    }
  }
}
