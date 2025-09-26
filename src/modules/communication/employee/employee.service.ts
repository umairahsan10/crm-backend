import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { CreateHrRequestDto } from './dto/create-hr-request.dto';
import { HrActionDto } from './dto/hr-action.dto';
import { RequestPriority, RequestStatus } from '@prisma/client';
import { TimeStorageUtil } from '../../../common/utils/time-storage.util';

@Injectable()
export class EmployeeService {
  constructor(private prisma: PrismaService) {}

  async getAllHrRequests() {
    try {
      return await this.prisma.hrRequest.findMany({
        include: {
          employee: {
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
          requestedOn: 'desc',
        },
      });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new BadRequestException('Duplicate entry found. Please check your data.');
      }
      if (error.code === 'P2003') {
        throw new BadRequestException('Foreign key constraint failed. Please check if referenced records exist.');
      }
      throw new InternalServerErrorException(`Failed to fetch HR requests: ${error.message}`);
    }
  }

  async getHrRequestById(id: number) {
    try {
      const request = await this.prisma.hrRequest.findUnique({
        where: { id },
        include: {
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
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

      if (!request) {
        throw new NotFoundException(`HR request with ID ${id} not found. Please check the ID and try again.`);
      }

      return request;
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
      throw new InternalServerErrorException(`Failed to fetch HR request with ID ${id}: ${error.message}`);
    }
  }

  async getHrRequestsByPriority(priority: RequestPriority) {
    try {
      const requests = await this.prisma.hrRequest.findMany({
        where: { priority },
        include: {
          employee: {
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
          requestedOn: 'desc',
        },
      });

      if (requests.length === 0) {
        throw new NotFoundException(`No HR requests found with priority ${priority}.`);
      }

      return requests;
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
      throw new InternalServerErrorException(`Failed to fetch HR requests by priority ${priority}: ${error.message}`);
    }
  }

  async getHrRequestsByStatus(status: RequestStatus) {
    try {
      const requests = await this.prisma.hrRequest.findMany({
        where: { status },
        include: {
          employee: {
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
          requestedOn: 'desc',
        },
      });

      if (requests.length === 0) {
        throw new NotFoundException(`No HR requests found with status ${status}.`);
      }

      return requests;
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
      throw new InternalServerErrorException(`Failed to fetch HR requests by status ${status}: ${error.message}`);
    }
  }

  async getHrRequestsByEmployee(employeeId: number) {
    try {
      const requests = await this.prisma.hrRequest.findMany({
        where: { empId: employeeId },
        include: {
          employee: {
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
          requestedOn: 'desc',
        },
      });

      return requests;
    } catch (error) {
      if (error.code === 'P2002') {
        throw new BadRequestException('Duplicate entry found. Please check your data.');
      }
      if (error.code === 'P2003') {
        throw new BadRequestException('Foreign key constraint failed. Please check if referenced records exist.');
      }
      throw new InternalServerErrorException(`Failed to fetch HR requests for employee ${employeeId}: ${error.message}`);
    }
  }

  async createHrRequest(createHrRequestDto: CreateHrRequestDto) {
    try {
      const { empId, departmentId, requestType, subject, description, priority, status, assignedTo } = createHrRequestDto;

      // Validate if employee exists
      const employee = await this.prisma.employee.findUnique({
        where: { id: empId },
      });

      if (!employee) {
        throw new NotFoundException(`Employee with ID ${empId} not found. Please check the employee ID and try again.`);
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

      // Validate assignedTo if provided
      if (assignedTo) {
        const assignedEmployee = await this.prisma.employee.findUnique({
          where: { id: assignedTo },
        });

        if (!assignedEmployee) {
          throw new NotFoundException(`Assigned employee with ID ${assignedTo} not found. Please check the assigned employee ID and try again.`);
        }
      }

      // Create the HR request
      const request = await this.prisma.hrRequest.create({
        data: {
          empId,
          departmentId,
          requestType,
          subject,
          description,
          priority: priority || RequestPriority.Low,
          status: status || RequestStatus.Pending,
          assignedTo,
        },
        include: {
          employee: {
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

      // Log the creation (if assignedTo is provided, it means HR created it)
      if (assignedTo) {
        const hrEmployee = await this.prisma.employee.findUnique({
          where: { id: assignedTo },
          include: {
            hr: true,
          },
        });

        if (hrEmployee?.hr) {
          await this.prisma.hRLog.create({
            data: {
              hrId: hrEmployee.hr.id,
              actionType: 'HR_REQUEST_CREATE',
              affectedEmployeeId: empId,
              description: `Created HR Request #${request.id} (Subject: "${subject}", Priority: ${priority || RequestPriority.Low})`,
            },
          });
        }
      }

      return {
        message: 'HR request created successfully',
        data: request,
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
      throw new InternalServerErrorException(`Failed to create HR request: ${error.message}`);
    }
  }



  private async validateAndUpdateHrRequest(id: number, hrActionDto: HrActionDto, hrEmployeeId: number) {
    // Validate if request exists
    const existingRequest = await this.prisma.hrRequest.findUnique({
      where: { id },
    });

    if (!existingRequest) {
      throw new NotFoundException(`HR request with ID ${id} not found. Please check the ID and try again.`);
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
      responseNotes, 
      assignedTo, 
      requestType, 
      subject, 
      description, 
      priority, 
      departmentId 
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

    // Validate department if provided
    if (departmentId) {
      const department = await this.prisma.department.findUnique({
        where: { id: departmentId },
      });

      if (!department) {
        throw new NotFoundException(`Department with ID ${departmentId} not found. Please check the department ID and try again.`);
      }
    }

    // Update the request with all provided fields
    const updateData: any = {
      updatedAt: TimeStorageUtil.getCurrentTimeForStorage(),
    };

    // Track changes for logging
    const changes: string[] = [];

    // Add all provided fields to update data and track changes
    if (status !== undefined) {
      updateData.status = status;
      changes.push(`Status: ${existingRequest.status} → ${status}`);
    }
    if (responseNotes !== undefined) {
      updateData.responseNotes = responseNotes;
      changes.push(`Response Notes: ${existingRequest.responseNotes || 'None'} → ${responseNotes}`);
    }
    if (assignedTo !== undefined) {
      updateData.assignedTo = assignedTo;
      changes.push(`Assigned To: ${existingRequest.assignedTo || 'None'} → ${assignedTo}`);
    }
    if (requestType !== undefined) {
      updateData.requestType = requestType;
      changes.push(`Request Type: ${existingRequest.requestType} → ${requestType}`);
    }
    if (subject !== undefined) {
      updateData.subject = subject;
      changes.push(`Subject: ${existingRequest.subject} → ${subject}`);
    }
    if (description !== undefined) {
      updateData.description = description;
      changes.push(`Description: ${existingRequest.description} → ${description}`);
    }
    if (priority !== undefined) {
      updateData.priority = priority;
      changes.push(`Priority: ${existingRequest.priority} → ${priority}`);
    }
    if (departmentId !== undefined) {
      updateData.departmentId = departmentId;
      changes.push(`Department: ${existingRequest.departmentId || 'None'} → ${departmentId}`);
    }

    // Set resolvedOn if status is being updated to Resolved
    if (status === RequestStatus.Resolved) {
      updateData.resolvedOn = new Date();
      changes.push(`Resolved On: ${existingRequest.resolvedOn || 'None'} → ${new Date().toISOString()}`);
    }

    // Update the request
    const updatedRequest = await this.prisma.hrRequest.update({
      where: { id },
      data: updateData,
      include: {
        employee: {
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
          actionType: 'HR_REQUEST_UPDATE',
          affectedEmployeeId: existingRequest.empId,
          description: `Updated HR Request #${id}: ${changes.join(', ')}`,
        },
      });
    }

    return updatedRequest;
  }

  async takeHrAction(id: number, hrActionDto: HrActionDto, hrEmployeeId: number) {
    try {
      const updatedRequest = await this.validateAndUpdateHrRequest(id, hrActionDto, hrEmployeeId);

      return {
        message: 'HR action taken successfully',
        data: updatedRequest,
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
      throw new InternalServerErrorException(`Failed to take HR action on request ${id}: ${error.message}`);
    }
  }



  async updateHrRequestAction(id: number, hrActionDto: HrActionDto, hrEmployeeId: number) {
    try {
      const updatedRequest = await this.validateAndUpdateHrRequest(id, hrActionDto, hrEmployeeId);

      return {
        message: 'HR request action updated successfully',
        data: updatedRequest,
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
      throw new InternalServerErrorException(`Failed to update HR request action for ID ${id}: ${error.message}`);
    }
  }

  async deleteHrRequest(id: number, hrEmployeeId: number) {
    try {
      // Validate if request exists
      const existingRequest = await this.prisma.hrRequest.findUnique({
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

      if (!existingRequest) {
        throw new NotFoundException(`HR request with ID ${id} not found. Please check the ID and try again.`);
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

      // Check if employee is HR (you might need to adjust this based on your role system)
      if (hrEmployee.role.name !== 'dep_manager' && hrEmployee.role.name !== 'unit_head') {
        throw new ForbiddenException(`Employee with ID ${hrEmployeeId} is not authorized to delete HR requests. Only HR personnel can perform this action.`);
      }

      if (!hrEmployee.hr) {
        throw new ForbiddenException(`Employee with ID ${hrEmployeeId} is not registered as HR personnel.`);
      }

      // Log the deletion before deleting
      await this.prisma.hRLog.create({
        data: {
          hrId: hrEmployee.hr.id,
          actionType: 'HR_REQUEST_DELETE',
          affectedEmployeeId: existingRequest.empId,
          description: `Deleted HR Request #${id} (Subject: "${existingRequest.subject}", Employee: ${existingRequest.employee.firstName} ${existingRequest.employee.lastName})`,
        },
      });

      // Delete the request
      await this.prisma.hrRequest.delete({
        where: { id },
      });

      return {
        message: 'HR request deleted successfully',
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
      throw new InternalServerErrorException(`Failed to delete HR request with ID ${id}: ${error.message}`);
    }
  }
}
