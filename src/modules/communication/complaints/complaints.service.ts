import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { CreateComplaintDto } from './dto/create-complaint.dto';
import { ComplaintHrActionDto } from './dto/hr-action.dto';
import { ComplaintStatus, ComplaintPriority } from '@prisma/client';
import { TimeStorageUtil } from '../../../common/utils/time-storage.util';

@Injectable()
export class ComplaintsService {
  constructor(private readonly prisma: PrismaService) { }

  async getAllComplaints() {
    try {
      const complaints = await this.prisma.complaint.findMany({
        include: {
          raisedByEmployee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
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
          againstEmployee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          department: {
            select: {
              id: true,
              name: true,
            },
          },
          assignedToEmployee: {
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

      return complaints;
    } catch (error) {
      if (error.code === 'P2002') {
        throw new BadRequestException('Duplicate entry found. Please check your data.');
      }
      if (error.code === 'P2003') {
        throw new BadRequestException('Foreign key constraint failed. Please check if referenced records exist.');
      }
      throw new InternalServerErrorException(`Failed to retrieve complaints: ${error.message}`);
    }
  }

  async getComplaintById(id: number) {
    try {
      const complaint = await this.prisma.complaint.findUnique({
        where: { id },
        include: {
          raisedByEmployee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
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
          againstEmployee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          department: {
            select: {
              id: true,
              name: true,
            },
          },
          assignedToEmployee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      if (!complaint) {
        throw new NotFoundException(`Complaint with ID ${id} not found. Please check the ID and try again.`);
      }

      return complaint;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      if (error.code === 'P2002') {
        throw new BadRequestException('Duplicate entry found. Please check your data.');
      }
      if (error.code === 'P2003') {
        throw new BadRequestException('Foreign key constraint failed. Please check if referenced records exist.');
      }
      throw new InternalServerErrorException(`Failed to retrieve complaint with ID ${id}: ${error.message}`);
    }
  }

  async getComplaintsByPriority(priority: ComplaintPriority) {
    try {
      const complaints = await this.prisma.complaint.findMany({
        where: { priority },
        include: {
          raisedByEmployee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
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
          againstEmployee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          department: {
            select: {
              id: true,
              name: true,
            },
          },
          assignedToEmployee: {
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

      return complaints;
    } catch (error) {
      if (error.code === 'P2002') {
        throw new BadRequestException('Duplicate entry found. Please check your data.');
      }
      if (error.code === 'P2003') {
        throw new BadRequestException('Foreign key constraint failed. Please check if referenced records exist.');
      }
      throw new InternalServerErrorException(`Failed to retrieve complaints by priority ${priority}: ${error.message}`);
    }
  }

  async getComplaintsByStatus(status: ComplaintStatus) {
    try {
      const complaints = await this.prisma.complaint.findMany({
        where: { status },
        include: {
          raisedByEmployee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
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
          againstEmployee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          department: {
            select: {
              id: true,
              name: true,
            },
          },
          assignedToEmployee: {
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

      return complaints;
    } catch (error) {
      if (error.code === 'P2002') {
        throw new BadRequestException('Duplicate entry found. Please check your data.');
      }
      if (error.code === 'P2003') {
        throw new BadRequestException('Foreign key constraint failed. Please check if referenced records exist.');
      }
      throw new InternalServerErrorException(`Failed to retrieve complaints by status ${status}: ${error.message}`);
    }
  }

  async createComplaint(createComplaintDto: CreateComplaintDto) {
    try {
      // Validate if raised by employee exists
      const raisedByEmployee = await this.prisma.employee.findUnique({
        where: { id: createComplaintDto.raisedBy },
        include: {
          hr: true,
        },
      });

      if (!raisedByEmployee) {
        throw new NotFoundException(`Employee with ID ${createComplaintDto.raisedBy} not found. Please check the employee ID and try again.`);
      }

      // Validate against employee if provided
      if (createComplaintDto.againstEmployeeId) {
        const againstEmployee = await this.prisma.employee.findUnique({
          where: { id: createComplaintDto.againstEmployeeId },
        });

        if (!againstEmployee) {
          throw new NotFoundException(`Against employee with ID ${createComplaintDto.againstEmployeeId} not found. Please check the employee ID and try again.`);
        }
      }

      // Validate department if provided
      if (createComplaintDto.departmentId) {
        const department = await this.prisma.department.findUnique({
          where: { id: createComplaintDto.departmentId },
        });

        if (!department) {
          throw new NotFoundException(`Department with ID ${createComplaintDto.departmentId} not found. Please check the department ID and try again.`);
        }
      }

      // Validate assigned to employee if provided
      if (createComplaintDto.assignedTo) {
        const assignedToEmployee = await this.prisma.employee.findUnique({
          where: { id: createComplaintDto.assignedTo },
        });

        if (!assignedToEmployee) {
          throw new NotFoundException(`Assigned to employee with ID ${createComplaintDto.assignedTo} not found. Please check the employee ID and try again.`);
        }
      }

      const complaint = await this.prisma.complaint.create({
        data: {
          raisedBy: createComplaintDto.raisedBy,
          againstEmployeeId: createComplaintDto.againstEmployeeId,
          departmentId: createComplaintDto.departmentId,
          complaintType: createComplaintDto.complaintType,
          subject: createComplaintDto.subject,
          description: createComplaintDto.description,
          status: createComplaintDto.status || ComplaintStatus.Open,
          priority: createComplaintDto.priority || ComplaintPriority.Low,
          assignedTo: createComplaintDto.assignedTo,
        },
        include: {
          raisedByEmployee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
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
          againstEmployee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          department: {
            select: {
              id: true,
              name: true,
            },
          },
          assignedToEmployee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      // Log to hr_logs if the complaint was created by an HR employee
      if (raisedByEmployee.hr) {
        await this.prisma.hRLog.create({
          data: {
            hrId: raisedByEmployee.hr.id,
            actionType: 'COMPLAINT_CREATE',
            affectedEmployeeId: createComplaintDto.againstEmployeeId || createComplaintDto.raisedBy,
            description: `Created Complaint #${complaint.id} (Subject: "${complaint.subject}", Type: ${complaint.complaintType || 'Not specified'}, Priority: ${complaint.priority})`,
          },
        });
      }

      return {
        message: 'Complaint created successfully',
        data: complaint,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      if (error.code === 'P2002') {
        throw new BadRequestException('Duplicate entry found. Please check your data.');
      }
      if (error.code === 'P2003') {
        throw new BadRequestException('Foreign key constraint failed. Please check if referenced records exist.');
      }
      throw new InternalServerErrorException(`Failed to create complaint: ${error.message}`);
    }
  }

  private async validateAndUpdateComplaint(id: number, hrActionDto: ComplaintHrActionDto, hrEmployeeId: number) {
    // Validate if complaint exists
    const existingComplaint = await this.prisma.complaint.findUnique({
      where: { id },
    });

    if (!existingComplaint) {
      throw new NotFoundException(`Complaint with ID ${id} not found. Please check the ID and try again.`);
    }

    // Validate if HR employee exists and is HR
    const hrEmployee = await this.prisma.employee.findUnique({
      where: { id: hrEmployeeId },
      include: {
        role: true,
        hr: true,
      },
    });

    if (!hrEmployee) {
      throw new NotFoundException(`HR employee with ID ${hrEmployeeId} not found.`);
    }

    if (!hrEmployee.hr) {
      throw new ForbiddenException(`Employee with ID ${hrEmployeeId} is not registered as HR personnel.`);
    }

    const {
      status,
      resolutionNotes,
      assignedTo,
      priority,
      complaintType,
      subject,
      description,
      departmentId,
      againstEmployeeId
    } = hrActionDto;

    // Validate assignedTo if provided
    if (assignedTo) {
      const assignedEmployee = await this.prisma.employee.findUnique({
        where: { id: assignedTo },
      });

      if (!assignedEmployee) {
        throw new NotFoundException(`Assigned employee with ID ${assignedTo} not found. Please check the assigned employee ID and try again.`);
      }
    }

    // Validate against employee if provided
    if (againstEmployeeId) {
      const againstEmployee = await this.prisma.employee.findUnique({
        where: { id: againstEmployeeId },
      });

      if (!againstEmployee) {
        throw new NotFoundException(`Against employee with ID ${againstEmployeeId} not found. Please check the employee ID and try again.`);
      }
    }

    // Validate department if provided
    if (departmentId) {
      const department = await this.prisma.department.findUnique({
        where: { id: departmentId },
      });

      if (!department) {
        throw new NotFoundException(`Department with ID ${departmentId} not found. Please check the department ID and try again.`);
      }
    }

    // Update the complaint with all provided fields
    const updateData: any = {
      updatedAt: TimeStorageUtil.getCurrentTimeForStorage(),
    };

    // Track changes for logging
    const changes: string[] = [];

    // Add all provided fields to update data and track changes
    if (status !== undefined) {
      updateData.status = status;
      changes.push(`Status: ${existingComplaint.status || 'None'} → ${status}`);
    }
    if (resolutionNotes !== undefined) {
      updateData.resolutionNotes = resolutionNotes;
      changes.push(`Resolution Notes: ${existingComplaint.resolutionNotes || 'None'} → ${resolutionNotes}`);
    }
    if (assignedTo !== undefined) {
      updateData.assignedTo = assignedTo;
      changes.push(`Assigned To: ${existingComplaint.assignedTo || 'None'} → ${assignedTo}`);
    }
    if (priority !== undefined) {
      updateData.priority = priority;
      changes.push(`Priority: ${existingComplaint.priority || 'None'} → ${priority}`);
    }
    if (complaintType !== undefined) {
      updateData.complaintType = complaintType;
      changes.push(`Complaint Type: ${existingComplaint.complaintType || 'None'} → ${complaintType}`);
    }
    if (subject !== undefined) {
      updateData.subject = subject;
      changes.push(`Subject: ${existingComplaint.subject} → ${subject}`);
    }
    if (description !== undefined) {
      updateData.description = description;
      changes.push(`Description: ${existingComplaint.description} → ${description}`);
    }
    if (departmentId !== undefined) {
      updateData.departmentId = departmentId;
      changes.push(`Department: ${existingComplaint.departmentId || 'None'} → ${departmentId}`);
    }
    if (againstEmployeeId !== undefined) {
      updateData.againstEmployeeId = againstEmployeeId;
      changes.push(`Against Employee: ${existingComplaint.againstEmployeeId || 'None'} → ${againstEmployeeId}`);
    }

    // Set resolutionDate if status is being updated to Resolved
    if (status === ComplaintStatus.Resolved) {
      updateData.resolutionDate = new Date();
      changes.push(`Resolution Date: ${existingComplaint.resolutionDate || 'None'} → ${new Date().toISOString()}`);
    }

    // Update the complaint
    const updatedComplaint = await this.prisma.complaint.update({
      where: { id },
      data: updateData,
      include: {
        raisedByEmployee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
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
        againstEmployee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        department: {
          select: {
            id: true,
            name: true,
          },
        },
        assignedToEmployee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    // Log the changes to hr_logs table
    if (changes.length > 0) {
      await this.prisma.hRLog.create({
        data: {
          hrId: hrEmployee.hr.id,
          actionType: 'COMPLAINT_UPDATE',
          affectedEmployeeId: existingComplaint.raisedBy,
          description: `Updated Complaint #${id}: ${changes.join(', ')}`,
        },
      });
    }

    return updatedComplaint;
  }

  async updateComplaintAction(id: number, hrActionDto: ComplaintHrActionDto, hrEmployeeId: number) {
    try {
      const updatedComplaint = await this.validateAndUpdateComplaint(id, hrActionDto, hrEmployeeId);

      return {
        message: 'Complaint action updated successfully',
        data: updatedComplaint,
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      if (error.code === 'P2002') {
        throw new BadRequestException('Duplicate entry found. Please check your data.');
      }
      if (error.code === 'P2003') {
        throw new BadRequestException('Foreign key constraint failed. Please check if referenced records exist.');
      }
      throw new InternalServerErrorException(`Failed to update complaint action for ID ${id}: ${error.message}`);
    }
  }

  async deleteComplaint(id: number, hrEmployeeId: number) {
    try {
      // Validate if complaint exists
      const existingComplaint = await this.prisma.complaint.findUnique({
        where: { id },
        include: {
          raisedByEmployee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      if (!existingComplaint) {
        throw new NotFoundException(`Complaint with ID ${id} not found. Please check the ID and try again.`);
      }

      // Validate if employee exists
      const employee = await this.prisma.employee.findUnique({
        where: { id: hrEmployeeId },
        include: {
          role: true,
          hr: true,
          department: true,
        },
      });

      if (!employee) {
        throw new NotFoundException(`Employee with ID ${hrEmployeeId} not found.`);
      }

      // Check if employee is department manager HR or admin
      const isDeptManagerHr = employee.role.name === 'dep_manager' && employee.hr;
      const isAdmin = employee.department.name === 'Admin';

      if (!isDeptManagerHr && !isAdmin) {
        throw new ForbiddenException(`Employee with ID ${hrEmployeeId} is not authorized to delete complaints. Only department manager HR and admin can perform this action.`);
      }

      // For HR employees, ensure they are registered in HR table
      if (isDeptManagerHr && !employee.hr) {
        throw new ForbiddenException(`Employee with ID ${hrEmployeeId} is not registered as HR personnel.`);
      }

      // Log the deletion before deleting
      await this.prisma.hRLog.create({
        data: {
          hrId: employee.hr?.id || 0, // Use 0 for admin users who don't have HR record
          actionType: 'COMPLAINT_DELETE',
          affectedEmployeeId: existingComplaint.raisedBy,
          description: `Deleted Complaint #${id} (Subject: "${existingComplaint.subject}", Employee: ${existingComplaint.raisedByEmployee.firstName} ${existingComplaint.raisedByEmployee.lastName})`,
        },
      });

      // Delete the complaint
      await this.prisma.complaint.delete({
        where: { id },
      });

      return {
        message: 'Complaint deleted successfully',
        data: { id },
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      if (error.code === 'P2002') {
        throw new BadRequestException('Duplicate entry found. Please check your data.');
      }
      if (error.code === 'P2003') {
        throw new BadRequestException('Foreign key constraint failed. Please check if referenced records exist.');
      }
      throw new InternalServerErrorException(`Failed to delete complaint with ID ${id}: ${error.message}`);
    }
  }
}
