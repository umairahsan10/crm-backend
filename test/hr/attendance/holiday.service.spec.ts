import { Test, TestingModule } from '@nestjs/testing';
import { HolidayService } from '../../../src/modules/hr/attendance/holiday.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateHolidayDto } from '../../../src/modules/hr/attendance/dto/create-holiday.dto';
import { BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';

describe('HolidayService', () => {
  let service: HolidayService;
  let prisma: PrismaService;

  const mockPrismaService = {
    holiday: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
    },
  };

  const mockHoliday = {
    holidayId: 1,
    holidayName: 'Test Holiday',
    holidayDate: new Date('2025-01-01'),
    description: 'Test description',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HolidayService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<HolidayService>(HolidayService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createHoliday', () => {
    const createDto: CreateHolidayDto = {
      holidayName: 'Test Holiday',
      holidayDate: '2025-01-01',
      description: 'Test description',
    };

    it('should create a new holiday successfully', async () => {
      mockPrismaService.holiday.findFirst.mockResolvedValue(null);
      mockPrismaService.holiday.create.mockResolvedValue(mockHoliday);

      const result = await service.createHoliday(createDto, 1, 'hr');

      expect(prisma.holiday.findFirst).toHaveBeenCalledWith({
        where: { holidayDate: new Date('2025-01-01') },
      });
      expect(prisma.holiday.create).toHaveBeenCalledWith({
        data: {
          holidayName: 'Test Holiday',
          holidayDate: new Date('2025-01-01'),
          description: 'Test description',
        },
      });
      expect(result).toEqual(mockHoliday);
    });

    it('should throw ConflictException if holiday already exists on the same date', async () => {
      mockPrismaService.holiday.findFirst.mockResolvedValue(mockHoliday);

      await expect(service.createHoliday(createDto, 1, 'hr')).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw BadRequestException on other errors', async () => {
      mockPrismaService.holiday.findFirst.mockRejectedValue(new Error('Database error'));

      await expect(service.createHoliday(createDto, 1, 'hr')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getAllHolidays', () => {
    it('should return all holidays without filters', async () => {
      mockPrismaService.holiday.findMany.mockResolvedValue([mockHoliday]);

      const result = await service.getAllHolidays();

      expect(prisma.holiday.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: { holidayDate: 'asc' },
      });
      expect(result).toEqual([mockHoliday]);
    });

    it('should return holidays filtered by year', async () => {
      mockPrismaService.holiday.findMany.mockResolvedValue([mockHoliday]);

      const result = await service.getAllHolidays(2025);

      expect(prisma.holiday.findMany).toHaveBeenCalledWith({
        where: {
          holidayDate: {
            gte: new Date(2025, 0, 1),
            lt: new Date(2026, 0, 1),
          },
        },
        orderBy: { holidayDate: 'asc' },
      });
      expect(result).toEqual([mockHoliday]);
    });

    it('should return holidays filtered by year and month', async () => {
      mockPrismaService.holiday.findMany.mockResolvedValue([mockHoliday]);

      const result = await service.getAllHolidays(2025, 12);

      expect(prisma.holiday.findMany).toHaveBeenCalledWith({
        where: {
          holidayDate: {
            gte: new Date(2025, 11, 1),
            lt: new Date(2026, 0, 1),
          },
        },
        orderBy: { holidayDate: 'asc' },
      });
      expect(result).toEqual([mockHoliday]);
    });

    it('should throw BadRequestException on error', async () => {
      mockPrismaService.holiday.findMany.mockRejectedValue(new Error('Database error'));

      await expect(service.getAllHolidays()).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getHolidayById', () => {
    it('should return a holiday by ID', async () => {
      mockPrismaService.holiday.findUnique.mockResolvedValue(mockHoliday);

      const result = await service.getHolidayById(1);

      expect(prisma.holiday.findUnique).toHaveBeenCalledWith({
        where: { holidayId: 1 },
      });
      expect(result).toEqual(mockHoliday);
    });

    it('should throw NotFoundException if holiday not found', async () => {
      mockPrismaService.holiday.findUnique.mockResolvedValue(null);

      await expect(service.getHolidayById(999)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException on other errors', async () => {
      mockPrismaService.holiday.findUnique.mockRejectedValue(new Error('Database error'));

      await expect(service.getHolidayById(1)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getUpcomingHolidays', () => {
    it('should return upcoming holidays with default limit', async () => {
      mockPrismaService.holiday.findMany.mockResolvedValue([mockHoliday]);

      const result = await service.getUpcomingHolidays();

      expect(prisma.holiday.findMany).toHaveBeenCalledWith({
        where: {
          holidayDate: {
            gte: expect.any(Date),
          },
        },
        orderBy: { holidayDate: 'asc' },
        take: 10,
      });
      expect(result).toEqual([mockHoliday]);
    });

    it('should return upcoming holidays with custom limit', async () => {
      mockPrismaService.holiday.findMany.mockResolvedValue([mockHoliday]);

      const result = await service.getUpcomingHolidays(5);

      expect(prisma.holiday.findMany).toHaveBeenCalledWith({
        where: {
          holidayDate: {
            gte: expect.any(Date),
          },
        },
        orderBy: { holidayDate: 'asc' },
        take: 5,
      });
      expect(result).toEqual([mockHoliday]);
    });

    it('should throw BadRequestException on error', async () => {
      mockPrismaService.holiday.findMany.mockRejectedValue(new Error('Database error'));

      await expect(service.getUpcomingHolidays()).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('isHoliday', () => {
    it('should return true with holiday data if date is a holiday', async () => {
      mockPrismaService.holiday.findFirst.mockResolvedValue(mockHoliday);

      const result = await service.isHoliday('2025-01-01');

      expect(prisma.holiday.findFirst).toHaveBeenCalledWith({
        where: { holidayDate: expect.any(Date) },
      });
      expect(result).toEqual({
        isHoliday: true,
        holiday: mockHoliday,
      });
    });

    it('should return false if date is not a holiday', async () => {
      mockPrismaService.holiday.findFirst.mockResolvedValue(null);

      const result = await service.isHoliday('2025-01-02');

      expect(result).toEqual({
        isHoliday: false,
      });
    });

    it('should throw BadRequestException on error', async () => {
      mockPrismaService.holiday.findFirst.mockRejectedValue(new Error('Database error'));

      await expect(service.isHoliday('2025-01-01')).rejects.toThrow(
        BadRequestException,
      );
    });
  });



  describe('deleteHoliday', () => {
    const mockPrismaServiceWithHR = {
      ...mockPrismaService,
      hR: {
        findUnique: jest.fn(),
      },
      hRLog: {
        create: jest.fn(),
      },
    };

    beforeEach(() => {
      // Update the mock to include HR-related methods
      Object.assign(prisma, mockPrismaServiceWithHR);
      mockPrismaServiceWithHR.hR.findUnique.mockResolvedValue({ id: 1 });
      mockPrismaServiceWithHR.hRLog.create.mockResolvedValue({});
    });

    it('should delete a future holiday successfully', async () => {
      const futureHoliday = {
        ...mockHoliday,
        holidayDate: new Date('2025-12-25'), // Future date
        createdAt: new Date('2025-01-01'), // Created in past
      };
      mockPrismaService.holiday.findUnique.mockResolvedValue(futureHoliday);
      mockPrismaService.holiday.delete.mockResolvedValue(futureHoliday);

      const result = await service.deleteHoliday(1, 1, 'hr');

      expect(prisma.holiday.delete).toHaveBeenCalledWith({
        where: { holidayId: 1 },
      });
      expect(result).toEqual({
        message: `Holiday "${futureHoliday.holidayName}" deleted successfully`,
      });
    });

    it('should throw NotFoundException if holiday not found', async () => {
      mockPrismaService.holiday.findUnique.mockResolvedValue(null);

      await expect(service.deleteHoliday(999, 1, 'hr')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException when trying to delete past holiday', async () => {
      const pastHoliday = {
        ...mockHoliday,
        holidayDate: new Date('2024-12-25'), // Past date
      };
      mockPrismaService.holiday.findUnique.mockResolvedValue(pastHoliday);

      await expect(service.deleteHoliday(1, 1, 'hr')).rejects.toThrow(
        BadRequestException,
      );
      expect(prisma.holiday.delete).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when trying to delete holiday on same day', async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const sameDayHoliday = {
        ...mockHoliday,
        holidayDate: today, // Same as today
      };
      mockPrismaService.holiday.findUnique.mockResolvedValue(sameDayHoliday);

      await expect(service.deleteHoliday(1, 1, 'hr')).rejects.toThrow(
        BadRequestException,
      );
      expect(prisma.holiday.delete).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when trying to delete holiday one day before', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      
      const oneDayBeforeHoliday = {
        ...mockHoliday,
        holidayDate: tomorrow, // One day before
      };
      mockPrismaService.holiday.findUnique.mockResolvedValue(oneDayBeforeHoliday);

      await expect(service.deleteHoliday(1, 1, 'hr')).rejects.toThrow(
        BadRequestException,
      );
      expect(prisma.holiday.delete).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when trying to delete emergency holiday', async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const emergencyHoliday = {
        ...mockHoliday,
        holidayDate: today, // Same as today
        createdAt: today, // Created today (emergency)
      };
      mockPrismaService.holiday.findUnique.mockResolvedValue(emergencyHoliday);

      await expect(service.deleteHoliday(1, 1, 'hr')).rejects.toThrow(
        BadRequestException,
      );
      expect(prisma.holiday.delete).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException on other errors', async () => {
      mockPrismaService.holiday.findUnique.mockRejectedValue(new Error('Database error'));

      await expect(service.deleteHoliday(1, 1, 'hr')).rejects.toThrow(
        BadRequestException,
      );
    });
  });



  describe('getHolidayStats', () => {
    it('should return holiday statistics for current year', async () => {
      const mockStats = {
        totalHolidays: 10,
        holidaysThisYear: 5,
        upcomingHolidays: 2,
        holidaysByMonth: [
          { month: 'January', count: 1 },
          { month: 'March', count: 2 },
        ],
      };

      mockPrismaService.holiday.count
        .mockResolvedValueOnce(10) // totalHolidays
        .mockResolvedValueOnce(5)  // holidaysThisYear
        .mockResolvedValueOnce(2); // upcomingHolidays

      mockPrismaService.holiday.groupBy.mockResolvedValue([
        { holidayDate: new Date('2025-01-01'), _count: 1 },
        { holidayDate: new Date('2025-03-01'), _count: 1 },
        { holidayDate: new Date('2025-03-15'), _count: 1 },
      ]);

      const result = await service.getHolidayStats();

      expect(result.totalHolidays).toBe(10);
      expect(result.holidaysThisYear).toBe(5);
      expect(result.upcomingHolidays).toBe(2);
      expect(result.holidaysByMonth).toHaveLength(2);
    });

    it('should return holiday statistics for specific year', async () => {
      mockPrismaService.holiday.count
        .mockResolvedValueOnce(10)
        .mockResolvedValueOnce(5)
        .mockResolvedValueOnce(2);

      mockPrismaService.holiday.groupBy.mockResolvedValue([]);

      const result = await service.getHolidayStats(2024);

      expect(result.holidaysThisYear).toBe(5);
    });

    it('should throw BadRequestException on error', async () => {
      mockPrismaService.holiday.count.mockRejectedValue(new Error('Database error'));

      await expect(service.getHolidayStats()).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
