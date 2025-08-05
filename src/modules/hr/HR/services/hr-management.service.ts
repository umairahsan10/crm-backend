import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../../prisma/prisma.service';
import { CreateHrDto } from '../dto/hr-management.dto';
import { UpdateHrDto } from '../dto/hr-management.dto';
import { HrResponseDto, HrListResponseDto } from '../dto/hr-management.dto';

@Injectable()
export class HrManagementService {
  private readonly logger = new Logger(HrManagementService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new HR record
   * Validates that the employee exists and is not already in HR
   */
  async createHr(dto: CreateHrDto): Promise<HrResponseDto> {
    // Check if employee exists
    const employee = await this.prisma.employee.findUnique({
      where: { id: dto.employeeId },
    });

    if (!employee) {
      throw new NotFoundException(`Employee with ID ${dto.employeeId} not found`);
    }

    // Check if employee is already in HR
    const existingHr = await this.prisma.hR.findUnique({
      where: { employeeId: dto.employeeId },
    });

    if (existingHr) {
      throw new BadRequestException(`Employee ${dto.employeeId} is already in HR department`);
    }

    try {
      const hr = await this.prisma.hR.create({
        data: {
          employeeId: dto.employeeId,
          attendancePermission: dto.attendancePermission,
          salaryPermission: dto.salaryPermission,
          commissionPermission: dto.commissionPermission,
          employeeAddPermission: dto.employeeAddPermission,
          terminationsHandle: dto.terminationsHandle,
          monthlyLeaveRequest: dto.monthlyLeaveRequest,
          targetsSet: dto.targetsSet,
          bonusesSet: dto.bonusesSet,
          shiftTimingSet: dto.shiftTimingSet,
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
        },
      });

      this.logger.log(`HR record created for employee ${dto.employeeId}`);
      return hr;
    } catch (error) {
      this.logger.error(`Failed to create HR record: ${error.message}`);
      throw new BadRequestException(`Failed to create HR record: ${error.message}`);
    }
  }

  /**
   * Get all HR records with optional employee filtering
   */
  async getAllHr(employeeId?: number): Promise<HrListResponseDto> {
    try {
      const where = employeeId ? { employeeId } : {};

      const hrRecords = await this.prisma.hR.findMany({
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
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      const total = await this.prisma.hR.count({ where });

      return {
        hrRecords,
        total,
      };
    } catch (error) {
      this.logger.error(`Failed to get HR records: ${error.message}`);
      throw new BadRequestException(`Failed to get HR records: ${error.message}`);
    }
  }

  /**
   * Get HR record by ID
   */
  async getHrById(id: number): Promise<HrResponseDto> {
    const hr = await this.prisma.hR.findUnique({
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

    if (!hr) {
      throw new NotFoundException(`HR record with ID ${id} not found`);
    }

    return hr;
  }

  /**
   * Update HR record
   * Allows updating any column of the HR table
   */
  async updateHr(id: number, dto: UpdateHrDto): Promise<HrResponseDto> {
    // Check if HR record exists
    const existingHr = await this.prisma.hR.findUnique({
      where: { id },
    });

    if (!existingHr) {
      throw new NotFoundException(`HR record with ID ${id} not found`);
    }

    try {
      const hr = await this.prisma.hR.update({
        where: { id },
        data: {
          attendancePermission: dto.attendancePermission,
          salaryPermission: dto.salaryPermission,
          commissionPermission: dto.commissionPermission,
          employeeAddPermission: dto.employeeAddPermission,
          terminationsHandle: dto.terminationsHandle,
          monthlyLeaveRequest: dto.monthlyLeaveRequest,
          targetsSet: dto.targetsSet,
          bonusesSet: dto.bonusesSet,
          shiftTimingSet: dto.shiftTimingSet,
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
        },
      });

      this.logger.log(`HR record ${id} updated successfully`);
      return hr;
    } catch (error) {
      this.logger.error(`Failed to update HR record ${id}: ${error.message}`);
      throw new BadRequestException(`Failed to update HR record: ${error.message}`);
    }
  }

  /**
   * Delete HR record and handle related cleanup
   * Removes employee from HR and updates related tables
   */
  async deleteHr(id: number): Promise<{ message: string }> {
    // Check if HR record exists
    const existingHr = await this.prisma.hR.findUnique({
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

    if (!existingHr) {
      throw new NotFoundException(`HR record with ID ${id} not found`);
    }

    const employeeId = existingHr.employeeId;

    try {
      // Use transaction to ensure all operations succeed or fail together
      await this.prisma.$transaction(async (prisma) => {
        // Delete the HR record
        await prisma.hR.delete({
          where: { id },
        });

        this.logger.log(`HR record ${id} deleted successfully for employee ${employeeId}`);
      });

      return {
        message: `Employee ${existingHr.employee.firstName} ${existingHr.employee.lastName} removed from HR department successfully`,
      };
    } catch (error) {
      this.logger.error(`Failed to delete HR record ${id}: ${error.message}`);
      throw new BadRequestException(`Failed to delete HR record: ${error.message}`);
    }
  }
} 