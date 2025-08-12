import { Test, TestingModule } from '@nestjs/testing';
import { HolidayService } from '../../../src/modules/hr/attendance/holiday.service';
import { PrismaService } from '../../../../prisma/prisma.service';
import { CreateHolidayDto } from '../../../src/modules/hr/attendance/dto/create-holiday.dto';
import { UpdateHolidayDto } from '../../../src/modules/hr/attendance/dto/update-holiday.dto';
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

      const result = await service.createHoliday(createDto);

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

      await expect(service.createHoliday(createDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw BadRequestException on other errors', async () => {
      mockPrismaService.holiday.findFirst.mockRejectedValue(new Error('Database error'));

      await expect(service.createHoliday(createDto)).rejects.toThrow(
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

  describe('updateHoliday', () => {
    const updateDto: UpdateHolidayDto = {
      holidayName: 'Updated Holiday',
    };

    it('should update a holiday successfully', async () => {
      mockPrismaService.holiday.findUnique.mockResolvedValue(mockHoliday);
      mockPrismaService.holiday.findFirst.mockResolvedValue(null);
      mockPrismaService.holiday.update.mockResolvedValue(mockHoliday);

      const result = await service.updateHoliday(1, updateDto);

      expect(prisma.holiday.update).toHaveBeenCalledWith({
        where: { holidayId: 1 },
        data: { holidayName: 'Updated Holiday' },
      });
      expect(result).toEqual(mockHoliday);
    });

    it('should throw NotFoundException if holiday not found', async () => {
      mockPrismaService.holiday.findUnique.mockResolvedValue(null);

      await expect(service.updateHoliday(999, updateDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException if updating to conflicting date', async () => {
      mockPrismaService.holiday.findUnique.mockResolvedValue(mockHoliday);
      mockPrismaService.holiday.findFirst.mockResolvedValue({ holidayId: 2 });

      const updateWithDate: UpdateHolidayDto = {
        holidayDate: '2025-01-02',
      };

      await expect(service.updateHoliday(1, updateWithDate)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw BadRequestException on other errors', async () => {
      mockPrismaService.holiday.findUnique.mockRejectedValue(new Error('Database error'));

      await expect(service.updateHoliday(1, updateDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('deleteHoliday', () => {
    it('should delete a holiday successfully', async () => {
      mockPrismaService.holiday.findUnique.mockResolvedValue(mockHoliday);
      mockPrismaService.holiday.delete.mockResolvedValue(mockHoliday);

      const result = await service.deleteHoliday(1);

      expect(prisma.holiday.delete).toHaveBeenCalledWith({
        where: { holidayId: 1 },
      });
      expect(result).toEqual({
        message: `Holiday "${mockHoliday.holidayName}" deleted successfully`,
      });
    });

    it('should throw NotFoundException if holiday not found', async () => {
      mockPrismaService.holiday.findUnique.mockResolvedValue(null);

      await expect(service.deleteHoliday(999)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException on other errors', async () => {
      mockPrismaService.holiday.findUnique.mockRejectedValue(new Error('Database error'));

      await expect(service.deleteHoliday(1)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('bulkCreateHolidays', () => {
    const holidays: CreateHolidayDto[] = [
      {
        holidayName: 'Holiday 1',
        holidayDate: '2025-01-01',
        description: 'Description 1',
      },
      {
        holidayName: 'Holiday 2',
        holidayDate: '2025-01-02',
        description: 'Description 2',
      },
    ];

    it('should bulk create holidays successfully', async () => {
      // Mock the createHoliday method to avoid complex setup
      jest.spyOn(service, 'createHoliday').mockResolvedValue(mockHoliday);

      const result = await service.bulkCreateHolidays(holidays);

      expect(result.created).toBe(2);
      expect(result.errors).toBe(0);
      expect(result.details).toHaveLength(2);
    });

    it('should handle errors in bulk creation', async () => {
      jest.spyOn(service, 'createHoliday')
        .mockResolvedValueOnce(mockHoliday)
        .mockRejectedValueOnce(new Error('Creation failed'));

      const result = await service.bulkCreateHolidays(holidays);

      expect(result.created).toBe(1);
      expect(result.errors).toBe(1);
      expect(result.details).toHaveLength(2);
    });

    it('should throw BadRequestException on error', async () => {
      jest.spyOn(service, 'createHoliday').mockRejectedValue(new Error('Database error'));

      await expect(service.bulkCreateHolidays(holidays)).rejects.toThrow(
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
