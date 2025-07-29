import { Test, TestingModule } from '@nestjs/testing';
import { AttendanceController } from '../../src/modules/attendance/attendance.controller';
import { AttendanceService } from '../../src/modules/attendance/attendance.service';

describe('AttendanceController', () => {
  let controller: AttendanceController;
  let service: AttendanceService;

  const mockAttendanceService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AttendanceController],
      providers: [
        {
          provide: AttendanceService,
          useValue: mockAttendanceService,
        },
      ],
    }).compile();

    controller = module.get<AttendanceController>(AttendanceController);
    service = module.get<AttendanceService>(AttendanceService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create attendance record', async () => {
      const createAttendanceDto = {
        employeeId: 1,
        date: new Date(),
        checkIn: new Date(),
        checkOut: new Date(),
      };

      const expectedResult = {
        id: 1,
        ...createAttendanceDto,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockAttendanceService.create.mockResolvedValue(expectedResult);

      const result = await controller.create(createAttendanceDto);

      expect(result).toEqual(expectedResult);
      expect(service.create).toHaveBeenCalledWith(createAttendanceDto);
    });
  });

  describe('findAll', () => {
    it('should return all attendance records', async () => {
      const expectedResult = [
        {
          id: 1,
          employeeId: 1,
          date: new Date(),
          checkIn: new Date(),
          checkOut: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockAttendanceService.findAll.mockResolvedValue(expectedResult);

      const result = await controller.findAll();

      expect(result).toEqual(expectedResult);
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a single attendance record', async () => {
      const id = '1';
      const expectedResult = {
        id: 1,
        employeeId: 1,
        date: new Date(),
        checkIn: new Date(),
        checkOut: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockAttendanceService.findOne.mockResolvedValue(expectedResult);

      const result = await controller.findOne(id);

      expect(result).toEqual(expectedResult);
      expect(service.findOne).toHaveBeenCalledWith(+id);
    });
  });

  describe('update', () => {
    it('should update an attendance record', async () => {
      const id = '1';
      const updateAttendanceDto = {
        checkOut: new Date(),
      };

      const expectedResult = {
        id: 1,
        employeeId: 1,
        date: new Date(),
        checkIn: new Date(),
        checkOut: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockAttendanceService.update.mockResolvedValue(expectedResult);

      const result = await controller.update(id, updateAttendanceDto);

      expect(result).toEqual(expectedResult);
      expect(service.update).toHaveBeenCalledWith(+id, updateAttendanceDto);
    });
  });

  describe('remove', () => {
    it('should remove an attendance record', async () => {
      const id = '1';
      const expectedResult = {
        id: 1,
        employeeId: 1,
        date: new Date(),
        checkIn: new Date(),
        checkOut: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockAttendanceService.remove.mockResolvedValue(expectedResult);

      const result = await controller.remove(id);

      expect(result).toEqual(expectedResult);
      expect(service.remove).toHaveBeenCalledWith(+id);
    });
  });
});