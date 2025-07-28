import { Test, TestingModule } from '@nestjs/testing';
import { AttendanceService } from '../../src/modules/attendance/attendance.service';
import { PrismaService } from '../../src/prisma/prisma.service';

describe('AttendanceService', () => {
  let service: AttendanceService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    attendance: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AttendanceService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<AttendanceService>(AttendanceService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new attendance record', async () => {
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

      mockPrismaService.attendance.create.mockResolvedValue(expectedResult);

      const result = await service.create(createAttendanceDto);

      expect(result).toEqual(expectedResult);
      expect(mockPrismaService.attendance.create).toHaveBeenCalledWith({
        data: createAttendanceDto,
      });
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

      mockPrismaService.attendance.findMany.mockResolvedValue(expectedResult);

      const result = await service.findAll();

      expect(result).toEqual(expectedResult);
      expect(mockPrismaService.attendance.findMany).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a single attendance record', async () => {
      const id = 1;
      const expectedResult = {
        id: 1,
        employeeId: 1,
        date: new Date(),
        checkIn: new Date(),
        checkOut: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.attendance.findUnique.mockResolvedValue(expectedResult);

      const result = await service.findOne(id);

      expect(result).toEqual(expectedResult);
      expect(mockPrismaService.attendance.findUnique).toHaveBeenCalledWith({
        where: { id },
      });
    });
  });

  describe('update', () => {
    it('should update an attendance record', async () => {
      const id = 1;
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

      mockPrismaService.attendance.update.mockResolvedValue(expectedResult);

      const result = await service.update(id, updateAttendanceDto);

      expect(result).toEqual(expectedResult);
      expect(mockPrismaService.attendance.update).toHaveBeenCalledWith({
        where: { id },
        data: updateAttendanceDto,
      });
    });
  });

  describe('remove', () => {
    it('should remove an attendance record', async () => {
      const id = 1;
      const expectedResult = {
        id: 1,
        employeeId: 1,
        date: new Date(),
        checkIn: new Date(),
        checkOut: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.attendance.delete.mockResolvedValue(expectedResult);

      const result = await service.remove(id);

      expect(result).toEqual(expectedResult);
      expect(mockPrismaService.attendance.delete).toHaveBeenCalledWith({
        where: { id },
      });
    });
  });
});