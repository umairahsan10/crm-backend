import { Test, TestingModule } from '@nestjs/testing';
import { AttendanceService } from '../../src/modules/hr/attendance/attendance.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ExportHalfDayLogsDto } from '../../src/modules/hr/attendance/dto/export-half-day-logs.dto';
import { HalfDayLogsStatsDto, StatsPeriod } from '../../src/modules/hr/attendance/dto/half-day-logs-stats.dto';

describe('Half Day Logs Export and Stats', () => {
  let service: AttendanceService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AttendanceService,
        {
          provide: PrismaService,
          useValue: {
            halfDayLog: {
              findMany: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<AttendanceService>(AttendanceService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  describe('getHalfDayLogsForExport', () => {
    it('should get half day logs for export', async () => {
      const mockHalfDayLogs = [
        {
          id: 1,
          empId: 123,
          date: new Date('2024-01-01'),
          scheduledTimeIn: '09:00',
          actualTimeIn: '10:30',
          minutesLate: 90,
          reason: 'Medical appointment',
          justified: true,
          halfDayType: 'paid',
          actionTaken: 'Completed',
          reviewedBy: 456,
          reviewedOn: new Date('2024-01-01'),
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
          employee: {
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@example.com',
            id: 123
          },
          reviewer: {
            firstName: 'Jane',
            lastName: 'Smith',
            email: 'jane.smith@example.com'
          }
        }
      ];

      jest.spyOn(prismaService.halfDayLog, 'findMany').mockResolvedValue(mockHalfDayLogs);

      const query = {
        employee_id: 123,
        start_date: '2024-01-01',
        end_date: '2024-01-31'
      };

      const result = await service.getHalfDayLogsForExport(query);

      expect(result).toEqual(mockHalfDayLogs);
      expect(prismaService.halfDayLog.findMany).toHaveBeenCalledWith({
        where: {
          empId: 123,
          date: {
            gte: new Date('2024-01-01'),
            lte: new Date('2024-01-31')
          }
        },
        include: {
          employee: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              id: true
            }
          },
          reviewer: {
            select: {
              firstName: true,
              lastName: true,
              email: true
            }
          }
        },
        orderBy: {
          date: 'desc'
        }
      });
    });
  });

  describe('convertHalfDayLogsToCSV', () => {
    it('should convert half day logs to CSV format', () => {
      const mockHalfDayLogs = [
        {
          id: 1,
          empId: 123,
          date: new Date('2024-01-01'),
          scheduledTimeIn: '09:00',
          actualTimeIn: '10:30',
          minutesLate: 90,
          reason: 'Medical appointment',
          justified: true,
          halfDayType: 'paid',
          actionTaken: 'Completed',
          reviewedBy: 456,
          reviewedOn: new Date('2024-01-01'),
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
          employee: {
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@example.com',
            id: 123
          },
          reviewer: {
            firstName: 'Jane',
            lastName: 'Smith',
            email: 'jane.smith@example.com'
          }
        }
      ];

      const exportDto: ExportHalfDayLogsDto = {
        format: 'csv',
        include_reviewer_details: true,
        include_half_day_type: true
      };

      const result = service.convertHalfDayLogsToCSV(mockHalfDayLogs, exportDto);

      expect(result).toContain('Half Day Log ID,Employee ID,Employee Name');
      expect(result).toContain('1,123,"John Doe"');
      expect(result).toContain('john.doe@example.com');
      expect(result).toContain('2024-01-01');
      expect(result).toContain('09:00');
      expect(result).toContain('10:30');
      expect(result).toContain('90');
      expect(result).toContain('Medical appointment');
      expect(result).toContain('true');
      expect(result).toContain('Completed');
      expect(result).toContain('Half Day Type');
      expect(result).toContain('paid');
      expect(result).toContain('Reviewed By');
      expect(result).toContain('Jane Smith');
    });
  });

  describe('getHalfDayLogsStats', () => {
    it('should return half day logs statistics', async () => {
      const mockHalfDayLogs = [
        {
          id: 1,
          empId: 123,
          date: new Date('2024-01-01'),
          scheduledTimeIn: '09:00',
          actualTimeIn: '10:30',
          minutesLate: 90,
          reason: 'Medical appointment',
          justified: true,
          halfDayType: 'paid',
          actionTaken: 'Completed',
          employee: {
            firstName: 'John',
            lastName: 'Doe'
          }
        },
        {
          id: 2,
          empId: 124,
          date: new Date('2024-01-02'),
          scheduledTimeIn: '09:00',
          actualTimeIn: '11:00',
          minutesLate: 120,
          reason: 'Personal emergency',
          justified: false,
          halfDayType: 'unpaid',
          actionTaken: 'Pending',
          employee: {
            firstName: 'Jane',
            lastName: 'Smith'
          }
        }
      ];

      jest.spyOn(prismaService.halfDayLog, 'findMany').mockResolvedValue(mockHalfDayLogs);

      const statsDto: HalfDayLogsStatsDto = {
        period: StatsPeriod.MONTHLY,
        include_breakdown: true
      };

      const result = await service.getHalfDayLogsStats(statsDto);

      expect(result.total_half_day_logs).toBe(2);
      expect(result.completed_half_day_logs).toBe(1);
      expect(result.pending_half_day_logs).toBe(1);
      expect(result.total_minutes_late).toBe(210); // 90 + 120
      expect(result.average_minutes_late).toBe(105); // 210 / 2
      expect(result.most_common_reason).toBe('Medical appointment');
      expect(result.paid_half_day_count).toBe(1);
      expect(result.unpaid_half_day_count).toBe(1);
      expect(result.period_stats).toBeDefined();
      expect(result.employee_breakdown).toBeDefined();
      expect(result.reason_breakdown).toBeDefined();
    });

    it('should return statistics without breakdown', async () => {
      const mockHalfDayLogs = [
        {
          id: 1,
          empId: 123,
          date: new Date('2024-01-01'),
          scheduledTimeIn: '09:00',
          actualTimeIn: '10:30',
          minutesLate: 90,
          reason: 'Medical appointment',
          justified: true,
          halfDayType: 'paid',
          actionTaken: 'Completed',
          employee: {
            firstName: 'John',
            lastName: 'Doe'
          }
        }
      ];

      jest.spyOn(prismaService.halfDayLog, 'findMany').mockResolvedValue(mockHalfDayLogs);

      const statsDto: HalfDayLogsStatsDto = {
        period: StatsPeriod.WEEKLY,
        include_breakdown: false
      };

      const result = await service.getHalfDayLogsStats(statsDto);

      expect(result.total_half_day_logs).toBe(1);
      expect(result.completed_half_day_logs).toBe(1);
      expect(result.pending_half_day_logs).toBe(0);
      expect(result.total_minutes_late).toBe(90);
      expect(result.average_minutes_late).toBe(90);
      expect(result.most_common_reason).toBe('Medical appointment');
      expect(result.paid_half_day_count).toBe(1);
      expect(result.unpaid_half_day_count).toBe(0);
      expect(result.period_stats).toBeDefined();
      expect(result.employee_breakdown).toBeUndefined();
      expect(result.reason_breakdown).toBeUndefined();
    });
  });
});
