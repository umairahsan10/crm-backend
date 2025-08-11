import { Test, TestingModule } from '@nestjs/testing';
import { MeetingController } from '../../../src/modules/communication/meeting/meeting.controller';
import { MeetingService } from '../../../src/modules/communication/meeting/meeting.service';
import { CreateMeetingDto } from '../../../src/modules/communication/meeting/dto/create-meeting.dto';
import { UpdateMeetingDto } from '../../../src/modules/communication/meeting/dto/update-meeting.dto';
import { GetMeetingsDto } from '../../../src/modules/communication/meeting/dto/get-meetings.dto';
import { MeetingResponseDto } from '../../../src/modules/communication/meeting/dto/meeting-response.dto';

describe('MeetingController', () => {
  let controller: MeetingController;
  let service: MeetingService;

  const mockMeetingService = {
    createMeeting: jest.fn(),
    getAllMeetings: jest.fn(),
    getMeetingById: jest.fn(),
    updateMeeting: jest.fn(),
    deleteMeeting: jest.fn(),
    getMyMeetings: jest.fn(),
    getUpcomingMeetings: jest.fn(),
  };

  const mockRequest = {
    user: {
      id: 1,
      role: 'employee',
      type: 'employee',
      department: 'Sales',
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MeetingController],
      providers: [
        {
          provide: MeetingService,
          useValue: mockMeetingService,
        },
      ],
    }).compile();

    controller = module.get<MeetingController>(MeetingController);
    service = module.get<MeetingService>(MeetingService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createMeeting', () => {
    const createMeetingDto: CreateMeetingDto = {
      employeeId: 2,
      topic: 'Test Meeting',
      dateTime: '2025-01-15T10:00:00Z',
      meetingLink: 'https://meet.google.com/test',
    };

    const expectedResponse: MeetingResponseDto = {
      id: 1,
      employeeId: 2,
      topic: 'Test Meeting',
      dateTime: new Date('2025-01-15T10:00:00Z'),
      status: 'scheduled',
      autoReminder: true,
      meetingLink: 'https://meet.google.com/test',
      createdAt: new Date(),
      updatedAt: new Date(),
      employee: {
        id: 2,
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
        department: {
          id: 1,
          name: 'Sales',
        },
      },
      client: undefined,
      project: undefined,
    };

    it('should create a meeting successfully', async () => {
      mockMeetingService.createMeeting.mockResolvedValue(expectedResponse);

      const result = await controller.createMeeting(createMeetingDto, mockRequest as any);

      expect(result).toEqual(expectedResponse);
      expect(mockMeetingService.createMeeting).toHaveBeenCalledWith(createMeetingDto, 1);
    });
  });

  describe('getAllMeetings', () => {
    const query: GetMeetingsDto = {
      page: 1,
      limit: 10,
    };

    const expectedResponse: MeetingResponseDto[] = [
      {
        id: 1,
        employeeId: 1,
        topic: 'Test Meeting',
        dateTime: new Date(),
        status: 'scheduled',
        autoReminder: true,
        meetingLink: 'https://meet.google.com/test',
        createdAt: new Date(),
        updatedAt: new Date(),
        employee: {
          id: 1,
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          department: {
            id: 1,
            name: 'Sales',
          },
        },
        client: undefined,
        project: undefined,
      },
    ];

    it('should return all meetings', async () => {
      mockMeetingService.getAllMeetings.mockResolvedValue(expectedResponse);

      const result = await controller.getAllMeetings(query, mockRequest as any);

      expect(result).toEqual(expectedResponse);
      expect(mockMeetingService.getAllMeetings).toHaveBeenCalledWith(query, 1);
    });
  });

  describe('getMeetingById', () => {
    const expectedResponse: MeetingResponseDto = {
      id: 1,
      employeeId: 1,
      topic: 'Test Meeting',
      dateTime: new Date(),
      status: 'scheduled',
      autoReminder: true,
      meetingLink: 'https://meet.google.com/test',
      createdAt: new Date(),
      updatedAt: new Date(),
      employee: {
        id: 1,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        department: {
          id: 1,
          name: 'Sales',
        },
      },
      client: undefined,
      project: undefined,
    };

    it('should return meeting by ID', async () => {
      mockMeetingService.getMeetingById.mockResolvedValue(expectedResponse);

      const result = await controller.getMeetingById(1, mockRequest as any);

      expect(result).toEqual(expectedResponse);
      expect(mockMeetingService.getMeetingById).toHaveBeenCalledWith(1, 1);
    });
  });

  describe('updateMeeting', () => {
    const updateMeetingDto: UpdateMeetingDto = {
      topic: 'Updated Meeting',
      meetingLink: 'https://meet.google.com/updated',
    };

    const expectedResponse: MeetingResponseDto = {
      id: 1,
      employeeId: 1,
      topic: 'Updated Meeting',
      dateTime: new Date(),
      status: 'scheduled',
      autoReminder: true,
      meetingLink: 'https://meet.google.com/updated',
      createdAt: new Date(),
      updatedAt: new Date(),
      employee: {
        id: 1,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        department: {
          id: 1,
          name: 'Sales',
        },
      },
      client: undefined,
      project: undefined,
    };

    it('should update meeting successfully', async () => {
      mockMeetingService.updateMeeting.mockResolvedValue(expectedResponse);

      const result = await controller.updateMeeting(1, updateMeetingDto, mockRequest as any);

      expect(result).toEqual(expectedResponse);
      expect(mockMeetingService.updateMeeting).toHaveBeenCalledWith(1, updateMeetingDto, 1);
    });
  });

  describe('deleteMeeting', () => {
    const expectedResponse = { message: 'Meeting deleted successfully' };

    it('should delete meeting successfully', async () => {
      mockMeetingService.deleteMeeting.mockResolvedValue(expectedResponse);

      const result = await controller.deleteMeeting(1, mockRequest as any);

      expect(result).toEqual(expectedResponse);
      expect(mockMeetingService.deleteMeeting).toHaveBeenCalledWith(1, 1);
    });
  });

  describe('getMyMeetings', () => {
    const expectedResponse: MeetingResponseDto[] = [
      {
        id: 1,
        employeeId: 1,
        topic: 'My Meeting',
        dateTime: new Date(),
        status: 'scheduled',
        autoReminder: true,
        meetingLink: 'https://meet.google.com/my',
        createdAt: new Date(),
        updatedAt: new Date(),
        employee: {
          id: 1,
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          department: {
            id: 1,
            name: 'Sales',
          },
        },
        client: undefined,
        project: undefined,
      },
    ];

    it('should return my meetings', async () => {
      mockMeetingService.getMyMeetings.mockResolvedValue(expectedResponse);

      const result = await controller.getMyMeetings(mockRequest as any);

      expect(result).toEqual(expectedResponse);
      expect(mockMeetingService.getMyMeetings).toHaveBeenCalledWith(1);
    });
  });

  describe('getUpcomingMeetings', () => {
    const expectedResponse: MeetingResponseDto[] = [
      {
        id: 1,
        employeeId: 1,
        topic: 'Upcoming Meeting',
        dateTime: new Date(),
        status: 'scheduled',
        autoReminder: true,
        meetingLink: 'https://meet.google.com/upcoming',
        createdAt: new Date(),
        updatedAt: new Date(),
        employee: {
          id: 1,
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          department: {
            id: 1,
            name: 'Sales',
          },
        },
        client: undefined,
        project: undefined,
      },
    ];

    it('should return upcoming meetings with default days', async () => {
      mockMeetingService.getUpcomingMeetings.mockResolvedValue(expectedResponse);

      const result = await controller.getUpcomingMeetings('7', mockRequest as any);

      expect(result).toEqual(expectedResponse);
      expect(mockMeetingService.getUpcomingMeetings).toHaveBeenCalledWith(1, 7);
    });

    it('should return upcoming meetings with custom days', async () => {
      mockMeetingService.getUpcomingMeetings.mockResolvedValue(expectedResponse);

      const result = await controller.getUpcomingMeetings('14', mockRequest as any);

      expect(result).toEqual(expectedResponse);
      expect(mockMeetingService.getUpcomingMeetings).toHaveBeenCalledWith(1, 14);
    });

    it('should handle invalid days parameter', async () => {
      mockMeetingService.getUpcomingMeetings.mockResolvedValue(expectedResponse);

      const result = await controller.getUpcomingMeetings('invalid', mockRequest as any);

      expect(result).toEqual(expectedResponse);
      expect(mockMeetingService.getUpcomingMeetings).toHaveBeenCalledWith(1, 7);
    });
  });
});
