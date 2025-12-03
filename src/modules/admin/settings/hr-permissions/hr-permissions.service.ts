import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../../../prisma/prisma.service';
import { CreateHrPermissionDto } from './dto/create-hr-permission.dto';
import { UpdateHrPermissionDto } from './dto/update-hr-permission.dto';
import {
  HrPermissionResponseDto,
  HrPermissionsListResponseDto,
} from './dto/hr-permission-response.dto';

@Injectable()
export class HrPermissionsService {
  private readonly logger = new Logger(HrPermissionsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get all HR records with pagination
   */
  async getAllHrPermissions(
    page: number = 1,
    limit: number = 10,
    employeeId?: number,
  ): Promise<HrPermissionsListResponseDto> {
    const skip = (page - 1) * limit;
    const where = employeeId ? { employeeId } : {};

    try {
      const [hrRecords, total] = await Promise.all([
        this.prisma.hR.findMany({
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
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        this.prisma.hR.count({ where }),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        hrRecords,
        total,
        page,
        limit,
        totalPages,
      };
    } catch (error) {
      this.logger.error(`Failed to get HR records: ${error.message}`);
      throw new BadRequestException(
        `Failed to get HR records: ${error.message}`,
      );
    }
  }

  /**
   * Get HR record by ID
   */
  async getHrPermissionById(id: number): Promise<HrPermissionResponseDto> {
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
   * Create a new HR record
   */
  async createHrPermission(
    dto: CreateHrPermissionDto,
  ): Promise<HrPermissionResponseDto> {
    // Check if employee exists
    const employee = await this.prisma.employee.findUnique({
      where: { id: dto.employeeId },
    });

    if (!employee) {
      throw new NotFoundException(
        `Employee with ID ${dto.employeeId} not found`,
      );
    }

    // Check if employee is already in HR
    const existingHr = await this.prisma.hR.findUnique({
      where: { employeeId: dto.employeeId },
    });

    if (existingHr) {
      throw new BadRequestException(
        `Employee ${dto.employeeId} is already in HR department`,
      );
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
          monthlyRequestApprovals: dto.monthlyRequestApprovals,
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
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      this.logger.error(`Failed to create HR record: ${error.message}`);
      throw new BadRequestException(
        `Failed to create HR record: ${error.message}`,
      );
    }
  }

  /**
   * Update HR record
   */
  async updateHrPermission(
    id: number,
    dto: UpdateHrPermissionDto,
  ): Promise<HrPermissionResponseDto> {
    // Check if HR record exists
    const existingHr = await this.prisma.hR.findUnique({
      where: { id },
    });

    if (!existingHr) {
      throw new NotFoundException(`HR record with ID ${id} not found`);
    }

    try {
      const updateData: any = {};

      // Only include fields that are provided
      if (dto.attendancePermission !== undefined)
        updateData.attendancePermission = dto.attendancePermission;
      if (dto.salaryPermission !== undefined)
        updateData.salaryPermission = dto.salaryPermission;
      if (dto.commissionPermission !== undefined)
        updateData.commissionPermission = dto.commissionPermission;
      if (dto.employeeAddPermission !== undefined)
        updateData.employeeAddPermission = dto.employeeAddPermission;
      if (dto.terminationsHandle !== undefined)
        updateData.terminationsHandle = dto.terminationsHandle;
      if (dto.monthlyRequestApprovals !== undefined)
        updateData.monthlyRequestApprovals = dto.monthlyRequestApprovals;
      if (dto.targetsSet !== undefined) updateData.targetsSet = dto.targetsSet;
      if (dto.bonusesSet !== undefined) updateData.bonusesSet = dto.bonusesSet;
      if (dto.shiftTimingSet !== undefined)
        updateData.shiftTimingSet = dto.shiftTimingSet;

      const hr = await this.prisma.hR.update({
        where: { id },
        data: updateData,
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
      throw new BadRequestException(
        `Failed to update HR record: ${error.message}`,
      );
    }
  }

  /**
   * Delete HR record
   */
  async deleteHrPermission(id: number): Promise<{ message: string }> {
    // Check if HR record exists
    const hr = await this.prisma.hR.findUnique({
      where: { id },
    });

    if (!hr) {
      throw new NotFoundException(`HR record with ID ${id} not found`);
    }

    try {
      await this.prisma.hR.delete({
        where: { id },
      });

      this.logger.log(`HR record ${id} deleted successfully`);
      return { message: 'HR record deleted successfully' };
    } catch (error) {
      this.logger.error(`Failed to delete HR record ${id}: ${error.message}`);
      throw new BadRequestException(
        `Failed to delete HR record: ${error.message}`,
      );
    }
  }
}
