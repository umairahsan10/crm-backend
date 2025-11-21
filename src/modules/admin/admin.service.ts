import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { UpdateAdminDto } from './dto/update-admin.dto';
import { CreateAdminDto } from './dto/create-admin.dto';
import { AdminResponseDto, AdminListResponseDto } from './dto/admin-response.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get all admins with pagination
   */
  async getAllAdmins(page: number = 1, limit: number = 10): Promise<AdminListResponseDto> {
    const skip = (page - 1) * limit;

    try {
      const [admins, total] = await Promise.all([
        this.prisma.admin.findMany({
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        this.prisma.admin.count(),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        admins,
        total,
        page,
        limit,
        totalPages,
      };
    } catch (error) {
      this.logger.error(`Failed to get admins: ${error.message}`);
      throw new BadRequestException(`Failed to get admins: ${error.message}`);
    }
  }

  /**
   * Get a specific admin by ID
   */
  async getAdminById(id: number): Promise<AdminResponseDto> {
    const admin = await this.prisma.admin.findUnique({
      where: { id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!admin) {
      throw new NotFoundException(`Admin with ID ${id} not found`);
    }

    return admin;
  }

  /**
   * Update an admin
   */
  async updateAdmin(id: number, dto: UpdateAdminDto): Promise<AdminResponseDto> {
    // Check if admin exists
    const existingAdmin = await this.prisma.admin.findUnique({
      where: { id },
    });

    if (!existingAdmin) {
      throw new NotFoundException(`Admin with ID ${id} not found`);
    }

    // Check if email is being updated and if it already exists
    if (dto.email && dto.email !== existingAdmin.email) {
      const emailExists = await this.prisma.admin.findFirst({
        where: { 
          email: dto.email,
          id: { not: id } // Exclude current admin
        },
      });

      if (emailExists) {
        throw new BadRequestException(`Admin with email ${dto.email} already exists`);
      }
    }

    try {
      const updateData: any = {};

      // Only include fields that are provided
      if (dto.firstName !== undefined) updateData.firstName = dto.firstName;
      if (dto.lastName !== undefined) updateData.lastName = dto.lastName;
      if (dto.email !== undefined) updateData.email = dto.email;
      if (dto.role !== undefined) updateData.role = dto.role;

      // Handle password hashing if provided
      if (dto.password !== undefined) {
        updateData.password = await bcrypt.hash(dto.password, 10);
      }

      const updatedAdmin = await this.prisma.admin.update({
        where: { id },
        data: updateData,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      this.logger.log(`Admin ${id} updated successfully`);
      return updatedAdmin;
    } catch (error) {
      this.logger.error(`Failed to update admin ${id}: ${error.message}`);
      throw new BadRequestException(`Failed to update admin: ${error.message}`);
    }
  }

  /**
   * Create a new admin user
   */
  async createAdmin(dto: CreateAdminDto): Promise<AdminResponseDto> {
    // Check if email already exists
    const existingAdmin = await this.prisma.admin.findFirst({
      where: { email: dto.email },
    });

    if (existingAdmin) {
      throw new BadRequestException(`Admin with email ${dto.email} already exists`);
    }

    try {
      // Hash password
      const hashedPassword = await bcrypt.hash(dto.password, 10);

      const admin = await this.prisma.admin.create({
        data: {
          firstName: dto.firstName,
          lastName: dto.lastName,
          email: dto.email,
          password: hashedPassword,
          role: dto.role || 'admin',
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      this.logger.log(`Admin ${admin.id} created successfully`);
      return admin;
    } catch (error) {
      this.logger.error(`Failed to create admin: ${error.message}`);
      throw new BadRequestException(`Failed to create admin: ${error.message}`);
    }
  }

  /**
   * Delete an admin user
   */
  async deleteAdmin(id: number, currentAdminId: number): Promise<{ message: string }> {
    // Prevent self-deletion
    if (id === currentAdminId) {
      throw new BadRequestException('You cannot delete your own account');
    }

    // Check if admin exists
    const admin = await this.prisma.admin.findUnique({
      where: { id },
    });

    if (!admin) {
      throw new NotFoundException(`Admin with ID ${id} not found`);
    }

    // Check if this is the last admin (prevent deleting the last admin)
    const adminCount = await this.prisma.admin.count();
    if (adminCount <= 1) {
      throw new BadRequestException('Cannot delete the last admin. At least one admin must exist.');
    }

    try {
      await this.prisma.admin.delete({
        where: { id },
      });

      this.logger.log(`Admin ${id} deleted successfully`);
      return { message: `Admin with ID ${id} deleted successfully` };
    } catch (error) {
      this.logger.error(`Failed to delete admin ${id}: ${error.message}`);
      throw new BadRequestException(`Failed to delete admin: ${error.message}`);
    }
  }
}
