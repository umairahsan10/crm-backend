import { Test, TestingModule } from '@nestjs/testing';
import { AttendanceService } from '../../src/modules/hr/attendance/attendance.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { BadRequestException, InternalServerErrorException } from '@nestjs/common';

describe('AttendanceService - Bulk Mark Present', () => {
  let service: AttendanceService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    employee: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    attendanceLog: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    attendance: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    monthlyAttendanceSummary: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    hrLog: {
      create: jest.fn(),
    },
    $transaction: jest.fn(),
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

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('bulkMarkAllEmployeesPresent', () => {
    const mockEmployees = [
      {
        id: 1,
        firstName: 'John',
        lastName: 'Doe',
        shiftStart: '09:00:00',
        shiftEnd: '17:00:00',
      },
      {
        id: 2,
        firstName: 'Jane',
        lastName: 'Smith',
        shiftStart: '08:00:00',
        shiftEnd: '16:00:00',
      },
    ];

    const mockBulkMarkData = {
      date: '2024-12-25',
      reason: 'Company Christmas Party',
    };

    it('should successfully mark all employees present for a valid date', async () => {
      // Mock employee data
      mockPrismaService.employee.findMany.mockResolvedValue(mockEmployees);

      // Mock transaction
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return await callback({
          attendanceLog: {
            findFirst: jest.fn().mockResolvedValue(null), // No existing log
            create: jest.fn().mockResolvedValue({ id: 1 }),
          },
          attendance: {
            findFirst: jest.fn().mockResolvedValue({
              id: 1,
              presentDays: 5,
              absentDays: 2,
            }),
            update: jest.fn().mockResolvedValue({}),
          },
          monthlyAttendanceSummary: {
            findFirst: jest.fn().mockResolvedValue({
              id: 1,
              totalPresent: 20,
              totalAbsent: 5,
            }),
            update: jest.fn().mockResolvedValue({}),
          },
          hrLog: {
            create: jest.fn().mockResolvedValue({ id: 1 }),
          },
        });
      });

      const result = await service.bulkMarkAllEmployeesPresent(mockBulkMarkData);

      expect(result.message).toContain('Bulk mark present completed for 2024-12-25');
      expect(result.marked_present).toBe(2);
      expect(result.errors).toBe(0);
      expect(result.skipped).toBe(0);
    });

    it('should skip employees already marked present', async () => {
      mockPrismaService.employee.findMany.mockResolvedValue(mockEmployees);

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return await callback({
          attendanceLog: {
            findFirst: jest.fn()
              .mockResolvedValueOnce({ status: 'present' }) // First employee already present
              .mockResolvedValueOnce(null), // Second employee not present
            create: jest.fn().mockResolvedValue({ id: 1 }),
          },
          attendance: {
            findFirst: jest.fn().mockResolvedValue({
              id: 1,
              presentDays: 5,
              absentDays: 2,
            }),
            update: jest.fn().mockResolvedValue({}),
          },
          monthlyAttendanceSummary: {
            findFirst: jest.fn().mockResolvedValue({
              id: 1,
              totalPresent: 20,
              totalAbsent: 5,
            }),
            update: jest.fn().mockResolvedValue({}),
          },
          hrLog: {
            create: jest.fn().mockResolvedValue({ id: 1 }),
          },
        });
      });

      const result = await service.bulkMarkAllEmployeesPresent(mockBulkMarkData);

      expect(result.marked_present).toBe(1);
      expect(result.skipped).toBe(1);
      expect(result.errors).toBe(0);
    });

    it('should throw BadRequestException for past dates', async () => {
      const pastDateData = {
        date: '2024-01-01',
        reason: 'Past date test',
      };

      await expect(service.bulkMarkAllEmployeesPresent(pastDateData))
        .rejects
        .toThrow(BadRequestException);
    });

    it('should throw BadRequestException for invalid date format', async () => {
      const invalidDateData = {
        date: 'invalid-date',
        reason: 'Invalid date test',
      };

      await expect(service.bulkMarkAllEmployeesPresent(invalidDateData))
        .rejects
        .toThrow(BadRequestException);
    });

    it('should throw BadRequestException when no active employees found', async () => {
      mockPrismaService.employee.findMany.mockResolvedValue([]);

      await expect(service.bulkMarkAllEmployeesPresent(mockBulkMarkData))
        .rejects
        .toThrow(BadRequestException);
    });

    it('should handle errors gracefully and continue processing other employees', async () => {
      mockPrismaService.employee.findMany.mockResolvedValue(mockEmployees);

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return await callback({
          attendanceLog: {
            findFirst: jest.fn()
              .mockResolvedValueOnce(null) // First employee - success
              .mockRejectedValueOnce(new Error('Database error')), // Second employee - error
            create: jest.fn().mockResolvedValue({ id: 1 }),
          },
          attendance: {
            findFirst: jest.fn().mockResolvedValue({
              id: 1,
              presentDays: 5,
              absentDays: 2,
            }),
            update: jest.fn().mockResolvedValue({}),
          },
          monthlyAttendanceSummary: {
            findFirst: jest.fn().mockResolvedValue({
              id: 1,
              totalPresent: 20,
              totalAbsent: 5,
            }),
            update: jest.fn().mockResolvedValue({}),
          },
          hrLog: {
            create: jest.fn().mockResolvedValue({ id: 1 }),
          },
        });
      });

      const result = await service.bulkMarkAllEmployeesPresent(mockBulkMarkData);

      expect(result.marked_present).toBe(1);
      expect(result.errors).toBe(1);
      expect(result.skipped).toBe(0);
    });

    it('should update existing attendance logs if status is different from present', async () => {
      mockPrismaService.employee.findMany.mockResolvedValue(mockEmployees);

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return await callback({
          attendanceLog: {
            findFirst: jest.fn()
              .mockResolvedValueOnce({ id: 1, status: 'absent' }) // First employee was absent
              .mockResolvedValueOnce(null), // Second employee no log
            update: jest.fn().mockResolvedValue({ id: 1 }),
            create: jest.fn().mockResolvedValue({ id: 2 }),
          },
          attendance: {
            findFirst: jest.fn().mockResolvedValue({
              id: 1,
              presentDays: 5,
              absentDays: 2,
            }),
            update: jest.fn().mockResolvedValue({}),
          },
          monthlyAttendanceSummary: {
            findFirst: jest.fn().mockResolvedValue({
              id: 1,
              totalPresent: 20,
              totalAbsent: 5,
            }),
            update: jest.fn().mockResolvedValue({}),
          },
          hrLog: {
            create: jest.fn().mockResolvedValue({ id: 1 }),
          },
        });
      });

      const result = await service.bulkMarkAllEmployeesPresent(mockBulkMarkData);

      expect(result.marked_present).toBe(2);
      expect(result.errors).toBe(0);
      expect(result.skipped).toBe(0);
    });
  });
});
