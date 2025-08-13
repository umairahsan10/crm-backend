import { Test, TestingModule } from '@nestjs/testing';
import { AttendanceService } from './attendance.service';
import { PrismaService } from '../../prisma/prisma.service';
import { BadRequestException, InternalServerErrorException } from '@nestjs/common';

describe('AttendanceService', () => {
  let service: AttendanceService;
  let mockPrismaService: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    const mockPrismaService = {
      employee: {
        findMany: jest.fn(),
      },
      attendanceLog: {
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      attendance: {
        findFirst: jest.fn(),
        upsert: jest.fn(),
      },
      monthlyAttendanceSummary: {
        findFirst: jest.fn(),
        upsert: jest.fn(),
      },
      hRLog: {
        create: jest.fn(),
      },
      $transaction: jest.fn(),
    };

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
    mockPrismaService = module.get(PrismaService) as jest.Mocked<PrismaService>;
  });

  describe('bulkMarkAllEmployeesPresent', () => {
    const mockEmployees = [
      {
        id: 1,
        firstName: 'John',
        lastName: 'Doe',
        shiftStart: '09:00',
        shiftEnd: '17:00'
      },
      {
        id: 2,
        firstName: 'Jane',
        lastName: 'Smith',
        shiftStart: '08:00',
        shiftEnd: '16:00'
      }
    ];

    beforeEach(() => {
      jest.clearAllMocks();
      mockPrismaService.employee.findMany.mockResolvedValue(mockEmployees);
      mockPrismaService.$transaction.mockImplementation((callback) => callback(mockPrismaService));
    });

    it('should successfully mark all employees present for current day', async () => {
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
      const bulkMarkData = { date: today, reason: 'System outage' };

      mockPrismaService.attendanceLog.findFirst.mockResolvedValue(null);
      mockPrismaService.attendanceLog.create.mockResolvedValue({} as any);
      mockPrismaService.attendanceLog.update.mockResolvedValue({} as any);
      mockPrismaService.hRLog.create.mockResolvedValue({} as any);

      const result = await service.bulkMarkAllEmployeesPresent(bulkMarkData);

      expect(result.marked_present).toBe(2);
      expect(result.errors).toBe(0);
      expect(result.skipped).toBe(0);
      expect(result.message).toContain(today);
      expect(result.message).toContain('System outage');
    });

    it('should skip employees already marked present', async () => {
      const today = new Date().toISOString().split('T')[0];
      const bulkMarkData = { date: today };

      mockPrismaService.attendanceLog.findFirst
        .mockResolvedValueOnce({ id: 1, status: 'present' } as any)
        .mockResolvedValueOnce(null);
      mockPrismaService.attendanceLog.create.mockResolvedValue({} as any);
      mockPrismaService.hRLog.create.mockResolvedValue({} as any);

      const result = await service.bulkMarkAllEmployeesPresent(bulkMarkData);

      expect(result.marked_present).toBe(1);
      expect(result.skipped).toBe(1);
      expect(result.errors).toBe(0);
    });

    it('should update existing attendance logs with different status', async () => {
      const today = new Date().toISOString().split('T')[0];
      const bulkMarkData = { date: today };

      mockPrismaService.attendanceLog.findFirst
        .mockResolvedValueOnce({ id: 1, status: 'absent' } as any)
        .mockResolvedValueOnce(null);
      mockPrismaService.attendanceLog.update.mockResolvedValue({} as any);
      mockPrismaService.attendanceLog.create.mockResolvedValue({} as any);
      mockPrismaService.hRLog.create.mockResolvedValue({} as any);

      const result = await service.bulkMarkAllEmployeesPresent(bulkMarkData);

      expect(result.marked_present).toBe(2);
      expect(result.skipped).toBe(0);
      expect(mockPrismaService.attendanceLog.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: expect.objectContaining({
          status: 'present',
          mode: 'onsite'
        })
      });
    });

          it('should allow current day', async () => {
        const today = new Date();
        const todayDate = today.toISOString().split('T')[0];
        const bulkMarkData = { date: todayDate };

        // Mock successful execution for current day
        jest.spyOn(service['prisma'], 'employee').mockReturnValue({
          findMany: jest.fn().mockResolvedValue([mockEmployee])
        } as any);

        jest.spyOn(service['prisma'], '$transaction').mockImplementation((callback) => callback(mockPrismaTransaction));

        const result = await service.bulkMarkAllEmployeesPresent(bulkMarkData);
        expect(result.marked_present).toBe(1);
      });

      it('should allow past dates', async () => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const pastDate = yesterday.toISOString().split('T')[0];
        const bulkMarkData = { date: pastDate };

        // Mock successful execution for past dates
        jest.spyOn(service['prisma'], 'employee').mockReturnValue({
          findMany: jest.fn().mockResolvedValue([mockEmployee])
        } as any);

        jest.spyOn(service['prisma'], '$transaction').mockImplementation((callback) => callback(mockPrismaTransaction));

        const result = await service.bulkMarkAllEmployeesPresent(bulkMarkData);
        expect(result.marked_present).toBe(1);
      });

          it('should throw error for future dates', async () => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const futureDate = tomorrow.toISOString().split('T')[0];
        const bulkMarkData = { date: futureDate };

        await expect(service.bulkMarkAllEmployeesPresent(bulkMarkData))
          .rejects
          .toThrow('Bulk mark present is not allowed for future dates.');
      });

    it('should throw error for invalid date format', async () => {
      const bulkMarkData = { date: 'invalid-date' };

      await expect(service.bulkMarkAllEmployeesPresent(bulkMarkData))
        .rejects
        .toThrow('Invalid date format. Use YYYY-MM-DD');
    });

    it('should throw error when no active employees found', async () => {
      const today = new Date().toISOString().split('T')[0];
      const bulkMarkData = { date: today };

      mockPrismaService.employee.findMany.mockResolvedValue([]);

      await expect(service.bulkMarkAllEmployeesPresent(bulkMarkData))
        .rejects
        .toThrow('No active employees found');
    });

    it('should handle errors during batch processing', async () => {
      const today = new Date().toISOString().split('T')[0];
      const bulkMarkData = { date: today };

      mockPrismaService.attendanceLog.findFirst.mockRejectedValue(new Error('Database error'));

      const result = await service.bulkMarkAllEmployeesPresent(bulkMarkData);

      expect(result.marked_present).toBe(0);
      expect(result.errors).toBe(2);
      expect(result.skipped).toBe(0);
    });

    it('should process employees in batches', async () => {
      const today = new Date().toISOString().split('T')[0];
      const bulkMarkData = { date: today };

      // Create more than 50 employees to test batching
      const manyEmployees = Array.from({ length: 75 }, (_, i) => ({
        id: i + 1,
        firstName: `Employee${i + 1}`,
        lastName: 'Test',
        shiftStart: '09:00',
        shiftEnd: '17:00'
      }));

      mockPrismaService.employee.findMany.mockResolvedValue(manyEmployees);
      mockPrismaService.attendanceLog.findFirst.mockResolvedValue(null);
      mockPrismaService.attendanceLog.create.mockResolvedValue({} as any);
      mockPrismaService.hRLog.create.mockResolvedValue({} as any);

      const result = await service.bulkMarkAllEmployeesPresent(bulkMarkData);

      expect(result.marked_present).toBe(75);
      expect(result.errors).toBe(0);
      expect(result.skipped).toBe(0);
    });
  });
});



