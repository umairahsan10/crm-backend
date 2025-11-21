import { Test, TestingModule } from '@nestjs/testing';
import { MeetingService } from '../../../src/modules/communication/meeting/meeting.service';
import { PrismaService } from '../../../src/prisma/prisma.service';
import { BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { MeetingStatus } from '@prisma/client';

describe('MeetingService', () => {
  let service: MeetingService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    meeting: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    employee: {
      findUnique: jest.fn(),
    },
    client: {
      findUnique: jest.fn(),
    },
    project: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MeetingService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<MeetingService>(MeetingService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createMeeting', () => {
    const createMeetingDto = {
      employeeId: 2,
      topic: 'Test Meeting',
      dateTime: '2025-01-15T10:00:00Z',
      meetingLink: 'https://meet.google.com/test',
    };

    const currentEmployee = {
      id: 1,
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      department: { name: 'Sales' },
    };

    it('should create a meeting successfully', async () => {
      const expectedMeeting = {
        id: 1,
        ...createMeetingDto,
        dateTime: new Date(createMeetingDto.dateTime),
        status: MeetingStatus.scheduled,
        autoReminder: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        employee: currentEmployee,
        client: null,
        project: null,
      };

      mockPrismaService.employee.findUnique.mockResolvedValue(currentEmployee);
      mockPrismaService.employee.findUnique.mockResolvedValueOnce(currentEmployee);
      mockPrismaService.employee.findUnique.mockResolvedValueOnce({
        id: 2,
        firstName: 'Jane',
        lastName: 'Smith',
      });
      mockPrismaService.meeting.create.mockResolvedValue(expectedMeeting);

      const result = await service.createMeeting(createMeetingDto, 1);

      expect(result).toEqual(service['mapToResponseDto'](expectedMeeting));
      expect(mockPrismaService.meeting.create).toHaveBeenCalledWith({
        data: {
          employeeId: createMeetingDto.employeeId,
          clientId: undefined,
          projectId: undefined,
          topic: createMeetingDto.topic,
          dateTime: new Date(createMeetingDto.dateTime),
          status: MeetingStatus.scheduled,
          autoReminder: true,
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
    });

    it('should throw error if current employee not found', async () => {
      mockPrismaService.employee.findUnique.mockResolvedValue(null);

      await expect(service.createMeeting(createMeetingDto, 999)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw error if meeting date is in the past', async () => {
      const pastMeetingDto = {
        ...createMeetingDto,
        dateTime: '2020-01-15T10:00:00Z',
      };

      mockPrismaService.employee.findUnique.mockResolvedValue(currentEmployee);

      await expect(service.createMeeting(pastMeetingDto, 1)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should allow Sales department to create client meetings', async () => {
      const clientMeetingDto = {
        ...createMeetingDto,
        clientId: 1,
        employeeId: undefined,
      };

      const salesEmployee = { ...currentEmployee, department: { name: 'Sales' } };
      const client = { id: 1, clientName: 'Test Client' };

      mockPrismaService.employee.findUnique.mockResolvedValue(salesEmployee);
      mockPrismaService.client.findUnique.mockResolvedValue(client);
      mockPrismaService.meeting.create.mockResolvedValue({
        id: 1,
        ...clientMeetingDto,
        dateTime: new Date(clientMeetingDto.dateTime),
        status: MeetingStatus.scheduled,
        autoReminder: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        employee: salesEmployee,
        client,
        project: null,
      });

      const result = await service.createMeeting(clientMeetingDto, 1);

      expect(result).toBeDefined();
      expect(mockPrismaService.client.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('should prevent non-Sales/HR/Admin from creating client meetings', async () => {
      const clientMeetingDto = {
        ...createMeetingDto,
        clientId: 1,
        employeeId: undefined,
      };

      const productionEmployee = { ...currentEmployee, department: { name: 'Production' } };

      mockPrismaService.employee.findUnique.mockResolvedValue(productionEmployee);

      await expect(service.createMeeting(clientMeetingDto, 1)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('getAllMeetings', () => {
    const currentEmployee = {
      id: 1,
      firstName: 'John',
      lastName: 'Doe',
      department: { name: 'Sales' },
    };

    it('should return meetings for current employee', async () => {
      const meetings = [
        {
          id: 1,
          employeeId: 1,
          topic: 'Test Meeting',
          dateTime: new Date(),
          status: MeetingStatus.scheduled,
          autoReminder: true,
          meetingLink: 'https://meet.google.com/test',
          createdAt: new Date(),
          updatedAt: new Date(),
          employee: currentEmployee,
          client: null,
          project: null,
        },
      ];

      mockPrismaService.employee.findUnique.mockResolvedValue(currentEmployee);
      mockPrismaService.meeting.findMany.mockResolvedValue(meetings);

      const result = await service.getAllMeetings({}, 1);

      expect(result).toHaveLength(1);
      expect(mockPrismaService.meeting.findMany).toHaveBeenCalled();
    });
  });

  describe('getMeetingById', () => {
    const currentEmployee = {
      id: 1,
      firstName: 'John',
      lastName: 'Doe',
      department: { name: 'Sales' },
    };

    it('should return meeting if found and accessible', async () => {
      const meeting = {
        id: 1,
        employeeId: 1,
        topic: 'Test Meeting',
        dateTime: new Date(),
        status: MeetingStatus.scheduled,
        autoReminder: true,
        meetingLink: 'https://meet.google.com/test',
        createdAt: new Date(),
        updatedAt: new Date(),
        employee: currentEmployee,
        client: null,
        project: null,
      };

      mockPrismaService.employee.findUnique.mockResolvedValue(currentEmployee);
      mockPrismaService.meeting.findUnique.mockResolvedValue(meeting);

      const result = await service.getMeetingById(1, 1);

      expect(result).toBeDefined();
      expect(mockPrismaService.meeting.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
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
    });

    it('should throw error if meeting not found', async () => {
      mockPrismaService.employee.findUnique.mockResolvedValue(currentEmployee);
      mockPrismaService.meeting.findUnique.mockResolvedValue(null);

      await expect(service.getMeetingById(999, 1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateMeeting', () => {
    const currentEmployee = {
      id: 1,
      firstName: 'John',
      lastName: 'Doe',
      department: { name: 'Sales' },
    };

    it('should update meeting if accessible', async () => {
      const existingMeeting = {
        id: 1,
        employeeId: 1,
        topic: 'Old Topic',
        dateTime: new Date(),
        status: MeetingStatus.scheduled,
        autoReminder: true,
        meetingLink: 'https://meet.google.com/old',
        createdAt: new Date(),
        updatedAt: new Date(),
        employee: currentEmployee,
        client: null,
        project: null,
      };

      const updateDto = {
        topic: 'Updated Topic',
        meetingLink: 'https://meet.google.com/new',
      };

      const updatedMeeting = { ...existingMeeting, ...updateDto };

      mockPrismaService.employee.findUnique.mockResolvedValue(currentEmployee);
      mockPrismaService.meeting.findUnique.mockResolvedValue(existingMeeting);
      mockPrismaService.meeting.update.mockResolvedValue(updatedMeeting);

      const result = await service.updateMeeting(1, updateDto, 1);

      expect(result).toBeDefined();
      expect(mockPrismaService.meeting.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: updateDto,
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
    });
  });

  describe('deleteMeeting', () => {
    const currentEmployee = {
      id: 1,
      firstName: 'John',
      lastName: 'Doe',
      department: { name: 'Sales' },
    };

    it('should delete meeting if accessible', async () => {
      const existingMeeting = {
        id: 1,
        employeeId: 1,
        topic: 'Test Meeting',
        dateTime: new Date(),
        status: MeetingStatus.scheduled,
        autoReminder: true,
        meetingLink: 'https://meet.google.com/test',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.employee.findUnique.mockResolvedValue(currentEmployee);
      mockPrismaService.meeting.findUnique.mockResolvedValue(existingMeeting);
      mockPrismaService.meeting.delete.mockResolvedValue(existingMeeting);

      const result = await service.deleteMeeting(1, 1);

      expect(result).toEqual({ message: 'Meeting deleted successfully' });
      expect(mockPrismaService.meeting.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });
  });
});
