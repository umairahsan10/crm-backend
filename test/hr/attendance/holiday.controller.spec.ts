import { Test, TestingModule } from '@nestjs/testing';
import { HolidayController } from '../../../src/modules/hr/attendance/holiday.controller';
import { HolidayService } from '../../../src/modules/hr/attendance/holiday.service';
import { CreateHolidayDto } from '../../../src/modules/hr/attendance/dto/create-holiday.dto';
import { UpdateHolidayDto } from '../../../src/modules/hr/attendance/dto/update-holiday.dto';
import { BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';

describe('HolidayController', () => {
  let controller: HolidayController;
  let service: HolidayService;

  const mockHolidayService = {
    createHoliday: jest.fn(),
    getAllHolidays: jest.fn(),
    getHolidayById: jest.fn(),
    getUpcomingHolidays: jest.fn(),
    isHoliday: jest.fn(),
    getHolidayStats: jest.fn(),
    updateHoliday: jest.fn(),
    deleteHoliday: jest.fn(),
    bulkCreateHolidays: jest.fn(),
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
      controllers: [HolidayController],
      providers: [
        {
          provide: HolidayService,
          useValue: mockHolidayService,
        },
      ],
    }).compile();

    controller = module.get<HolidayController>(HolidayController);
    service = module.get<HolidayService>(HolidayService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getAllHolidays', () => {
    it('should return all holidays without filters', async () => {
      mockHolidayService.getAllHolidays.mockResolvedValue([mockHoliday]);

      const result = await controller.getAllHolidays();

      expect(service.getAllHolidays).toHaveBeenCalledWith(undefined, undefined);
      expect(result).toEqual([mockHoliday]);
    });

    it('should return holidays filtered by year', async () => {
      mockHolidayService.getAllHolidays.mockResolvedValue([mockHoliday]);

      const result = await controller.getAllHolidays('2025');

      expect(service.getAllHolidays).toHaveBeenCalledWith(2025, undefined);
      expect(result).toEqual([mockHoliday]);
    });

    it('should return holidays filtered by year and month', async () => {
      mockHolidayService.getAllHolidays.mockResolvedValue([mockHoliday]);

      const result = await controller.getAllHolidays('2025', '12');

      expect(service.getAllHolidays).toHaveBeenCalledWith(2025, 12);
      expect(result).toEqual([mockHoliday]);
    });

    it('should throw BadRequestException for invalid year', async () => {
      await expect(controller.getAllHolidays('invalid')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException for invalid month', async () => {
      await expect(controller.getAllHolidays('2025', 'invalid')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException for month without year', async () => {
      await expect(controller.getAllHolidays(undefined, '12')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException for month out of range', async () => {
      await expect(controller.getAllHolidays('2025', '13')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getHolidayById', () => {
    it('should return a holiday by ID', async () => {
      mockHolidayService.getHolidayById.mockResolvedValue(mockHoliday);

      const result = await controller.getHolidayById('1');

      expect(service.getHolidayById).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockHoliday);
    });

    it('should throw BadRequestException for invalid ID', async () => {
      await expect(controller.getHolidayById('invalid')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getUpcomingHolidays', () => {
    it('should return upcoming holidays with default limit', async () => {
      mockHolidayService.getUpcomingHolidays.mockResolvedValue([mockHoliday]);

      const result = await controller.getUpcomingHolidays();

      expect(service.getUpcomingHolidays).toHaveBeenCalledWith(10);
      expect(result).toEqual([mockHoliday]);
    });

    it('should return upcoming holidays with custom limit', async () => {
      mockHolidayService.getUpcomingHolidays.mockResolvedValue([mockHoliday]);

      const result = await controller.getUpcomingHolidays('5');

      expect(service.getUpcomingHolidays).toHaveBeenCalledWith(5);
      expect(result).toEqual([mockHoliday]);
    });

    it('should throw BadRequestException for invalid limit', async () => {
      await expect(controller.getUpcomingHolidays('invalid')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException for limit out of range', async () => {
      await expect(controller.getUpcomingHolidays('101')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('checkHoliday', () => {
    it('should check if a date is a holiday', async () => {
      const holidayCheck = { isHoliday: true, holiday: mockHoliday };
      mockHolidayService.isHoliday.mockResolvedValue(holidayCheck);

      const result = await controller.checkHoliday('2025-01-01');

      expect(service.isHoliday).toHaveBeenCalledWith('2025-01-01');
      expect(result).toEqual(holidayCheck);
    });

    it('should throw BadRequestException for invalid date format', async () => {
      await expect(controller.checkHoliday('invalid-date')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getHolidayStats', () => {
    it('should return holiday statistics for current year', async () => {
      const stats = {
        totalHolidays: 10,
        holidaysThisYear: 5,
        upcomingHolidays: 2,
        holidaysByMonth: [],
      };
      mockHolidayService.getHolidayStats.mockResolvedValue(stats);

      const result = await controller.getHolidayStats();

      expect(service.getHolidayStats).toHaveBeenCalledWith(undefined);
      expect(result).toEqual(stats);
    });

    it('should return holiday statistics for specific year', async () => {
      const stats = {
        totalHolidays: 10,
        holidaysThisYear: 5,
        upcomingHolidays: 2,
        holidaysByMonth: [],
      };
      mockHolidayService.getHolidayStats.mockResolvedValue(stats);

      const result = await controller.getHolidayStats('2025');

      expect(service.getHolidayStats).toHaveBeenCalledWith(2025);
      expect(result).toEqual(stats);
    });

    it('should throw BadRequestException for invalid year', async () => {
      await expect(controller.getHolidayStats('invalid')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('createHoliday', () => {
    it('should create a new holiday', async () => {
      const createDto: CreateHolidayDto = {
        holidayName: 'Test Holiday',
        holidayDate: '2025-01-01',
        description: 'Test description',
      };
      mockHolidayService.createHoliday.mockResolvedValue(mockHoliday);

      const result = await controller.createHoliday(createDto);

      expect(service.createHoliday).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(mockHoliday);
    });
  });

  describe('updateHoliday', () => {
    it('should update a holiday', async () => {
      const updateDto: UpdateHolidayDto = {
        holidayName: 'Updated Holiday',
      };
      mockHolidayService.updateHoliday.mockResolvedValue(mockHoliday);

      const result = await controller.updateHoliday('1', updateDto);

      expect(service.updateHoliday).toHaveBeenCalledWith(1, updateDto);
      expect(result).toEqual(mockHoliday);
    });

    it('should throw BadRequestException for invalid ID', async () => {
      const updateDto: UpdateHolidayDto = { holidayName: 'Updated Holiday' };

      await expect(controller.updateHoliday('invalid', updateDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('deleteHoliday', () => {
    it('should delete a holiday', async () => {
      const deleteResponse = { message: 'Holiday deleted successfully' };
      mockHolidayService.deleteHoliday.mockResolvedValue(deleteResponse);

      const result = await controller.deleteHoliday('1');

      expect(service.deleteHoliday).toHaveBeenCalledWith(1);
      expect(result).toEqual(deleteResponse);
    });

    it('should throw BadRequestException for invalid ID', async () => {
      await expect(controller.deleteHoliday('invalid')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('bulkCreateHolidays', () => {
    it('should bulk create holidays', async () => {
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
      const bulkResponse = { created: 2, errors: 0, details: [] };
      mockHolidayService.bulkCreateHolidays.mockResolvedValue(bulkResponse);

      const result = await controller.bulkCreateHolidays(holidays);

      expect(service.bulkCreateHolidays).toHaveBeenCalledWith(holidays);
      expect(result).toEqual(bulkResponse);
    });

    it('should throw BadRequestException for empty array', async () => {
      await expect(controller.bulkCreateHolidays([])).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException for non-array input', async () => {
      await expect(controller.bulkCreateHolidays(null as any)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException for too many holidays', async () => {
      const holidays = Array(101).fill({
        holidayName: 'Holiday',
        holidayDate: '2025-01-01',
      });

      await expect(controller.bulkCreateHolidays(holidays)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
