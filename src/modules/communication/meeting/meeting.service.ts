import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { CreateMeetingDto } from './dto/create-meeting.dto';
import { UpdateMeetingDto } from './dto/update-meeting.dto';
import { GetMeetingsDto } from './dto/get-meetings.dto';
import { MeetingResponseDto } from './dto/meeting-response.dto';
import { MeetingStatus } from '@prisma/client';

@Injectable()
export class MeetingService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new meeting
   * All employees can schedule meetings with one another
   * Sales team, HR and admin can schedule meetings with clients
   */
  async createMeeting(
    createMeetingDto: CreateMeetingDto,
    currentEmployeeId: number,
  ): Promise<MeetingResponseDto> {
    // Validate that the current employee exists
    const currentEmployee = await this.prisma.employee.findUnique({
      where: { id: currentEmployeeId },
      include: { department: true },
    });

    if (!currentEmployee) {
      throw new NotFoundException('Current employee not found');
    }

    // Check if trying to schedule with a client
    if (createMeetingDto.clientId) {
      // Only Sales, HR, and Admin can schedule meetings with clients
      const allowedDepartments = ['Sales', 'HR', 'Admin'];
      if (!allowedDepartments.includes(currentEmployee.department.name)) {
        throw new ForbiddenException(
          'Only Sales, HR, and Admin employees can schedule meetings with clients',
        );
      }

      // Validate client exists
      const client = await this.prisma.client.findUnique({
        where: { id: createMeetingDto.clientId },
      });

      if (!client) {
        throw new NotFoundException('Client not found');
      }
    }

    // If project is specified, validate it exists
    if (createMeetingDto.projectId) {
      const project = await this.prisma.project.findUnique({
        where: { id: createMeetingDto.projectId },
      });

      if (!project) {
        throw new NotFoundException('Project not found');
      }
    }

    // Validate meeting date is not in the past
    const meetingDate = new Date(createMeetingDto.dateTime);
    if (meetingDate < new Date()) {
      throw new BadRequestException('Meeting date cannot be in the past');
    }

    try {
      const meeting = await this.prisma.meeting.create({
        data: {
          employeeId: currentEmployeeId,
          clientId: createMeetingDto.clientId,
          projectId: createMeetingDto.projectId,
          topic: createMeetingDto.topic,
          dateTime: meetingDate,
          status: createMeetingDto.status || MeetingStatus.scheduled,
          autoReminder: createMeetingDto.autoReminder ?? true,
          meetingLink: createMeetingDto.meetingLink,
        },
        include: {
          employee: {
            include: {
              department: true,
            },
          },
          client: true,
          project: true,
        },
      });

      // Log HR action if HR created the meeting
      if (currentEmployee.department.name === 'HR') {
        await this.prisma.hRLog.create({
          data: {
            hrId: currentEmployeeId,
            actionType: 'MEETING_CREATED',
            affectedEmployeeId: currentEmployeeId,
            description: `HR created meeting: ${createMeetingDto.topic} scheduled for ${meetingDate.toISOString()}${createMeetingDto.clientId ? ' with client' : ''}`,
          },
        });
      }

      return this.mapToResponseDto(meeting);
    } catch (error) {
      if (error.code === 'P2002') {
        throw new BadRequestException('Duplicate meeting entry found');
      }
      if (error.code === 'P2003') {
        throw new BadRequestException('Foreign key constraint failed');
      }
      throw error;
    }
  }

  /**
   * Get all meetings with optional filters
   * Only Admin and HR can access all meetings
   */
  async getAllMeetings(
    query: GetMeetingsDto,
    currentEmployeeId: number,
  ): Promise<MeetingResponseDto[]> {
    const currentEmployee = await this.prisma.employee.findUnique({
      where: { id: currentEmployeeId },
      include: { department: true },
    });

    if (!currentEmployee) {
      throw new NotFoundException('Current employee not found');
    }

    // Only Admin and HR can access all meetings
    if (
      currentEmployee.department.name !== 'Admin' &&
      currentEmployee.department.name !== 'HR'
    ) {
      throw new ForbiddenException('Only Admin and HR can access all meetings');
    }

    // Build where clause
    const where: any = {};

    if (query.employeeId) {
      where.employeeId = query.employeeId;
    }

    if (query.clientId) {
      where.clientId = query.clientId;
    }

    if (query.projectId) {
      where.projectId = query.projectId;
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.startDate || query.endDate) {
      where.dateTime = {};
      if (query.startDate) {
        where.dateTime.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        where.dateTime.lte = new Date(query.endDate);
      }
    }

    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    try {
      const meetings = await this.prisma.meeting.findMany({
        where,
        include: {
          employee: {
            include: {
              department: true,
            },
          },
          client: true,
          project: true,
        },
        orderBy: {
          dateTime: 'asc',
        },
        skip,
        take: limit,
      });

      return meetings.map((meeting) => this.mapToResponseDto(meeting));
    } catch (error) {
      throw new BadRequestException(
        `Failed to fetch meetings: ${error.message}`,
      );
    }
  }

  /**
   * Get meeting by ID
   */
  async getMeetingById(
    id: number,
    currentEmployeeId: number,
  ): Promise<MeetingResponseDto> {
    const currentEmployee = await this.prisma.employee.findUnique({
      where: { id: currentEmployeeId },
      include: { department: true },
    });

    if (!currentEmployee) {
      throw new NotFoundException('Current employee not found');
    }

    try {
      const meeting = await this.prisma.meeting.findUnique({
        where: { id },
        include: {
          employee: {
            include: {
              department: true,
            },
          },
          client: true,
          project: true,
        },
      });

      if (!meeting) {
        throw new NotFoundException('Meeting not found');
      }

      // Check access permissions
      if (
        currentEmployee.department.name !== 'Admin' &&
        meeting.employeeId !== currentEmployeeId &&
        !meeting.clientId
      ) {
        throw new ForbiddenException('Access denied to this meeting');
      }

      return this.mapToResponseDto(meeting);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to fetch meeting: ${error.message}`,
      );
    }
  }

  /**
   * Update meeting
   */
  async updateMeeting(
    id: number,
    updateMeetingDto: UpdateMeetingDto,
    currentEmployeeId: number,
  ): Promise<MeetingResponseDto> {
    const currentEmployee = await this.prisma.employee.findUnique({
      where: { id: currentEmployeeId },
      include: { department: true },
    });

    if (!currentEmployee) {
      throw new NotFoundException('Current employee not found');
    }

    // Check if meeting exists and current employee has access
    const existingMeeting = await this.prisma.meeting.findUnique({
      where: { id },
      include: {
        employee: true,
        client: true,
      },
    });

    if (!existingMeeting) {
      throw new NotFoundException('Meeting not found');
    }

    // Check access permissions - only meeting creator or Admin can update (not HR)
    if (
      currentEmployee.department.name !== 'Admin' &&
      existingMeeting.employeeId !== currentEmployeeId
    ) {
      throw new ForbiddenException(
        'Only meeting creator or Admin can update this meeting',
      );
    }

    // If updating to include a client, check permissions
    if (updateMeetingDto.clientId && !existingMeeting.clientId) {
      const allowedDepartments = ['Sales', 'HR', 'Admin'];
      if (!allowedDepartments.includes(currentEmployee.department.name)) {
        throw new ForbiddenException(
          'Only Sales, HR, and Admin employees can schedule meetings with clients',
        );
      }
    }

    // Validate meeting date is not in the past
    if (updateMeetingDto.dateTime) {
      const meetingDate = new Date(updateMeetingDto.dateTime);
      if (meetingDate < new Date()) {
        throw new BadRequestException('Meeting date cannot be in the past');
      }
    }

    try {
      const updatedMeeting = await this.prisma.meeting.update({
        where: { id },
        data: updateMeetingDto,
        include: {
          employee: {
            include: {
              department: true,
            },
          },
          client: true,
          project: true,
        },
      });

      // Log HR action if HR updated the meeting
      if (currentEmployee.department.name === 'HR') {
        await this.prisma.hRLog.create({
          data: {
            hrId: currentEmployeeId,
            actionType: 'MEETING_UPDATED',
            affectedEmployeeId: existingMeeting.employeeId,
            description: `HR updated meeting: "${existingMeeting.topic}" to "${updatedMeeting.topic}" scheduled for ${updatedMeeting.dateTime?.toISOString() || 'unspecified time'}${updatedMeeting.clientId ? ' with client' : ''}`,
          },
        });
      }

      return this.mapToResponseDto(updatedMeeting);
    } catch (error) {
      if (error.code === 'P2002') {
        throw new BadRequestException('Duplicate meeting entry found');
      }
      if (error.code === 'P2003') {
        throw new BadRequestException('Foreign key constraint failed');
      }
      throw new BadRequestException(
        `Failed to update meeting: ${error.message}`,
      );
    }
  }

  /**
   * Delete meeting
   */
  async deleteMeeting(
    id: number,
    currentEmployeeId: number,
  ): Promise<{ message: string }> {
    const currentEmployee = await this.prisma.employee.findUnique({
      where: { id: currentEmployeeId },
      include: { department: true },
    });

    if (!currentEmployee) {
      throw new NotFoundException('Current employee not found');
    }

    // Check if meeting exists and current employee has access
    const existingMeeting = await this.prisma.meeting.findUnique({
      where: { id },
    });

    if (!existingMeeting) {
      throw new NotFoundException('Meeting not found');
    }

    // Check access permissions - only meeting creator or Admin can delete (not HR)
    if (
      currentEmployee.department.name !== 'Admin' &&
      existingMeeting.employeeId !== currentEmployeeId
    ) {
      throw new ForbiddenException(
        'Only meeting creator or Admin can delete this meeting',
      );
    }

    try {
      await this.prisma.meeting.delete({
        where: { id },
      });

      // Log HR action if HR deleted the meeting
      if (currentEmployee.department.name === 'HR') {
        await this.prisma.hRLog.create({
          data: {
            hrId: currentEmployeeId,
            actionType: 'MEETING_DELETED',
            affectedEmployeeId: existingMeeting.employeeId,
            description: `HR deleted meeting: "${existingMeeting.topic}" that was scheduled for ${existingMeeting.dateTime?.toISOString() || 'unspecified time'}${existingMeeting.clientId ? ' with client' : ''}`,
          },
        });
      }

      return { message: 'Meeting deleted successfully' };
    } catch (error) {
      throw new BadRequestException(
        `Failed to delete meeting: ${error.message}`,
      );
    }
  }

  /**
   * Get meetings for current employee
   */
  async getMyMeetings(
    currentEmployeeId: number,
  ): Promise<MeetingResponseDto[]> {
    const currentEmployee = await this.prisma.employee.findUnique({
      where: { id: currentEmployeeId },
    });

    if (!currentEmployee) {
      throw new NotFoundException('Current employee not found');
    }

    try {
      const meetings = await this.prisma.meeting.findMany({
        where: {
          employeeId: currentEmployeeId,
        },
        include: {
          employee: {
            include: {
              department: true,
            },
          },
          client: true,
          project: true,
        },
        orderBy: {
          dateTime: 'asc',
        },
      });

      return meetings.map((meeting) => this.mapToResponseDto(meeting));
    } catch (error) {
      throw new BadRequestException(
        `Failed to fetch meetings: ${error.message}`,
      );
    }
  }

  /**
   * Get upcoming meetings
   */
  async getUpcomingMeetings(
    currentEmployeeId: number,
    days: number = 7,
  ): Promise<MeetingResponseDto[]> {
    const currentEmployee = await this.prisma.employee.findUnique({
      where: { id: currentEmployeeId },
      include: { department: true },
    });

    if (!currentEmployee) {
      throw new NotFoundException('Current employee not found');
    }

    const now = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);

    // Build where clause
    const where: any = {
      dateTime: {
        gte: now,
        lte: endDate,
      },
    };

    // If not admin, only show meetings related to current employee
    if (currentEmployee.department.name !== 'Admin') {
      where.OR = [
        { employeeId: currentEmployeeId },
        { clientId: { not: null } }, // Show client meetings for Sales/HR
      ];
    }

    try {
      const meetings = await this.prisma.meeting.findMany({
        where,
        include: {
          employee: {
            include: {
              department: true,
            },
          },
          client: true,
          project: true,
        },
        orderBy: {
          dateTime: 'asc',
        },
      });

      return meetings.map((meeting) => this.mapToResponseDto(meeting));
    } catch (error) {
      throw new BadRequestException(
        `Failed to fetch upcoming meetings: ${error.message}`,
      );
    }
  }

  /**
   * Helper method to map database result to response DTO
   */
  private mapToResponseDto(meeting: any): MeetingResponseDto {
    return {
      id: meeting.id,
      employeeId: meeting.employeeId,
      clientId: meeting.clientId,
      projectId: meeting.projectId,
      topic: meeting.topic,
      dateTime: meeting.dateTime,
      status: meeting.status,
      autoReminder: meeting.autoReminder,
      meetingLink: meeting.meetingLink,
      createdAt: meeting.createdAt,
      updatedAt: meeting.updatedAt,
      employee: meeting.employee
        ? {
            id: meeting.employee.id,
            firstName: meeting.employee.firstName,
            lastName: meeting.employee.lastName,
            email: meeting.employee.email,
            department: meeting.employee.department
              ? {
                  id: meeting.employee.department.id,
                  name: meeting.employee.department.name,
                }
              : undefined,
          }
        : undefined,
      client: meeting.client
        ? {
            id: meeting.client.id,
            clientName: meeting.client.clientName,
            companyName: meeting.client.companyName,
            email: meeting.client.email,
            phone: meeting.client.phone,
          }
        : undefined,
      project: meeting.project
        ? {
            id: meeting.project.id,
            description: meeting.project.description,
            status: meeting.project.status,
          }
        : undefined,
    };
  }
}
