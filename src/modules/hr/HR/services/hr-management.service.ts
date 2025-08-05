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
  async createHr(dto: CreateHrDto, hrEmployeeId: number): Promise<HrResponseDto> {
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

      // Create HR log entry with detailed permissions
      const permissions: string[] = [];
      if (dto.attendancePermission) permissions.push('Attendance');
      if (dto.salaryPermission) permissions.push('Salary');
      if (dto.commissionPermission) permissions.push('Commission');
      if (dto.employeeAddPermission) permissions.push('Employee Add');
      if (dto.terminationsHandle) permissions.push('Terminations');
      if (dto.monthlyLeaveRequest) permissions.push('Monthly Leave Request');
      if (dto.targetsSet) permissions.push('Targets Set');
      if (dto.bonusesSet) permissions.push('Bonuses Set');
      if (dto.shiftTimingSet) permissions.push('Shift Timing Set');

      const logDescription = `HR record created for employee ${employee.firstName} ${employee.lastName} (ID: ${employee.id}, Email: ${employee.email}) - Permissions granted: ${permissions.length > 0 ? permissions.join(', ') : 'None'}`;
      await this.createHrLog(hrEmployeeId, 'hr_created', employee.id, logDescription);

      this.logger.log(`HR record created for employee ${dto.employeeId}`);
      return hr;
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
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
    try {
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
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to get HR record ${id}: ${error.message}`);
      throw new BadRequestException(`Failed to get HR record: ${error.message}`);
    }
  }

  /**
   * Update HR record
   * Allows updating any column of the HR table
   */
  async updateHr(id: number, dto: UpdateHrDto, hrEmployeeId: number): Promise<HrResponseDto> {
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

    // Check if HR record exists
    const existingHr = await this.prisma.hR.findUnique({
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

    if (!existingHr) {
      throw new NotFoundException(`HR record with ID ${id} not found`);
    }

    try {
      // Track changes for logging
      const changes: string[] = [];
      if (dto.attendancePermission !== undefined && dto.attendancePermission !== existingHr.attendancePermission) {
        changes.push(`Attendance Permission: ${existingHr.attendancePermission ? 'Yes' : 'No'} → ${dto.attendancePermission ? 'Yes' : 'No'}`);
      }
      if (dto.salaryPermission !== undefined && dto.salaryPermission !== existingHr.salaryPermission) {
        changes.push(`Salary Permission: ${existingHr.salaryPermission ? 'Yes' : 'No'} → ${dto.salaryPermission ? 'Yes' : 'No'}`);
      }
      if (dto.commissionPermission !== undefined && dto.commissionPermission !== existingHr.commissionPermission) {
        changes.push(`Commission Permission: ${existingHr.commissionPermission ? 'Yes' : 'No'} → ${dto.commissionPermission ? 'Yes' : 'No'}`);
      }
      if (dto.employeeAddPermission !== undefined && dto.employeeAddPermission !== existingHr.employeeAddPermission) {
        changes.push(`Employee Add Permission: ${existingHr.employeeAddPermission ? 'Yes' : 'No'} → ${dto.employeeAddPermission ? 'Yes' : 'No'}`);
      }
      if (dto.terminationsHandle !== undefined && dto.terminationsHandle !== existingHr.terminationsHandle) {
        changes.push(`Terminations Handle: ${existingHr.terminationsHandle ? 'Yes' : 'No'} → ${dto.terminationsHandle ? 'Yes' : 'No'}`);
      }
      if (dto.monthlyLeaveRequest !== undefined && dto.monthlyLeaveRequest !== existingHr.monthlyLeaveRequest) {
        changes.push(`Monthly Leave Request: ${existingHr.monthlyLeaveRequest ? 'Yes' : 'No'} → ${dto.monthlyLeaveRequest ? 'Yes' : 'No'}`);
      }
      if (dto.targetsSet !== undefined && dto.targetsSet !== existingHr.targetsSet) {
        changes.push(`Targets Set: ${existingHr.targetsSet ? 'Yes' : 'No'} → ${dto.targetsSet ? 'Yes' : 'No'}`);
      }
      if (dto.bonusesSet !== undefined && dto.bonusesSet !== existingHr.bonusesSet) {
        changes.push(`Bonuses Set: ${existingHr.bonusesSet ? 'Yes' : 'No'} → ${dto.bonusesSet ? 'Yes' : 'No'}`);
      }
      if (dto.shiftTimingSet !== undefined && dto.shiftTimingSet !== existingHr.shiftTimingSet) {
        changes.push(`Shift Timing Set: ${existingHr.shiftTimingSet ? 'Yes' : 'No'} → ${dto.shiftTimingSet ? 'Yes' : 'No'}`);
      }

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

      // Create HR log entry with detailed changes
      const logDescription = changes.length > 0 
        ? `HR record updated for employee ${existingHr.employee.firstName} ${existingHr.employee.lastName} (ID: ${existingHr.employee.id}) - Changes: ${changes.join(', ')}`
        : `HR record updated for employee ${existingHr.employee.firstName} ${existingHr.employee.lastName} (ID: ${existingHr.employee.id}) - No changes detected`;
      
      await this.createHrLog(hrEmployeeId, 'hr_updated', existingHr.employee.id, logDescription);

      this.logger.log(`HR record ${id} updated successfully`);
      return hr;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Failed to update HR record ${id}: ${error.message}`);
      throw new BadRequestException(`Failed to update HR record: ${error.message}`);
    }
  }

  /**
   * Delete HR record and handle related cleanup
   * Removes employee from HR and updates related tables
   */
  async deleteHr(id: number, hrEmployeeId: number): Promise<{ message: string }> {
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

    // Check if HR record exists
    const existingHr = await this.prisma.hR.findUnique({
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

    if (!existingHr) {
      throw new NotFoundException(`HR record with ID ${id} not found`);
    }

    const employeeId = existingHr.employeeId;

    // Store HR details before deletion for logging
    const hrDetails = {
      attendancePermission: existingHr.attendancePermission,
      salaryPermission: existingHr.salaryPermission,
      commissionPermission: existingHr.commissionPermission,
      employeeAddPermission: existingHr.employeeAddPermission,
      terminationsHandle: existingHr.terminationsHandle,
      monthlyLeaveRequest: existingHr.monthlyLeaveRequest,
      targetsSet: existingHr.targetsSet,
      bonusesSet: existingHr.bonusesSet,
      shiftTimingSet: existingHr.shiftTimingSet,
    };

    try {
      // Use transaction to ensure all operations succeed or fail together
      await this.prisma.$transaction(async (prisma) => {
        // Delete the HR record
        await prisma.hR.delete({
          where: { id },
        });

        this.logger.log(`HR record ${id} deleted successfully for employee ${employeeId}`);
      });

      // Create HR log entry with detailed HR information
      const permissions: string[] = [];
      if (hrDetails.attendancePermission) permissions.push('Attendance');
      if (hrDetails.salaryPermission) permissions.push('Salary');
      if (hrDetails.commissionPermission) permissions.push('Commission');
      if (hrDetails.employeeAddPermission) permissions.push('Employee Add');
      if (hrDetails.terminationsHandle) permissions.push('Terminations');
      if (hrDetails.monthlyLeaveRequest) permissions.push('Monthly Leave Request');
      if (hrDetails.targetsSet) permissions.push('Targets Set');
      if (hrDetails.bonusesSet) permissions.push('Bonuses Set');
      if (hrDetails.shiftTimingSet) permissions.push('Shift Timing Set');

      const logDescription = `HR record deleted for employee ${existingHr.employee.firstName} ${existingHr.employee.lastName} (ID: ${existingHr.employee.id}, Email: ${existingHr.employee.email}) - Removed permissions: ${permissions.length > 0 ? permissions.join(', ') : 'None'}`;
      await this.createHrLog(hrEmployeeId, 'hr_deleted', existingHr.employee.id, logDescription);

      return {
        message: `Employee ${existingHr.employee.firstName} ${existingHr.employee.lastName} removed from HR department successfully`,
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Failed to delete HR record ${id}: ${error.message}`);
      throw new BadRequestException(`Failed to delete HR record: ${error.message}`);
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