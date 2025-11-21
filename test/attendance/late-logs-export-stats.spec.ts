import { Test, TestingModule } from '@nestjs/testing';
import { AttendanceService } from '../../src/modules/hr/attendance/attendance.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ExportLateLogsDto } from '../../src/modules/hr/attendance/dto/export-late-logs.dto';
import { LateLogsStatsDto, StatsPeriod } from '../../src/modules/hr/attendance/dto/late-logs-stats.dto';

describe('Late Logs Export and Stats', () => {
  let service: AttendanceService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AttendanceService,
        {
          provide: PrismaService,
          useValue: {
            lateLog: {
              findMany: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<AttendanceService>(AttendanceService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  describe('getLateLogsForExport', () => {
    it('should get late logs for export', async () => {
      const mockLateLogs = [
        {
          id: 1,
          empId: 123,
          date: new Date('2024-01-01'),
          scheduledTimeIn: '09:00',
          actualTimeIn: '09:30',
          minutesLate: 30,
          reason: 'Traffic jam',
          justified: true,
          lateType: 'paid',
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

      jest.spyOn(prismaService.lateLog, 'findMany').mockResolvedValue(mockLateLogs);

      const query = {
        employee_id: 123,
        start_date: '2024-01-01',
        end_date: '2024-01-31'
      };

      const result = await service.getLateLogsForExport(query);

      expect(result).toEqual(mockLateLogs);
      expect(prismaService.lateLog.findMany).toHaveBeenCalledWith({
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

  describe('convertLateLogsToCSV', () => {
    it('should convert late logs to CSV format', () => {
      const mockLateLogs = [
        {
          id: 1,
          empId: 123,
          date: new Date('2024-01-01'),
          scheduledTimeIn: '09:00',
          actualTimeIn: '09:30',
          minutesLate: 30,
          reason: 'Traffic jam',
          justified: true,
          lateType: 'paid',
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

      const exportDto: ExportLateLogsDto = {
        format: 'csv',
        include_reviewer_details: true,
        include_late_type: true
      };

      const result = service.convertLateLogsToCSV(mockLateLogs, exportDto);

      expect(result).toContain('Late Log ID,Employee ID,Employee Name');
      expect(result).toContain('1,123,"John Doe"');
      expect(result).toContain('john.doe@example.com');
      expect(result).toContain('2024-01-01');
      expect(result).toContain('09:00');
      expect(result).toContain('09:30');
      expect(result).toContain('30');
      expect(result).toContain('Traffic jam');
      expect(result).toContain('true');
      expect(result).toContain('Completed');
      expect(result).toContain('Late Type');
      expect(result).toContain('paid');
      expect(result).toContain('Reviewed By');
      expect(result).toContain('Jane Smith');
    });
  });

  describe('getLateLogsStats', () => {
    it('should return late logs statistics', async () => {
      const mockLateLogs = [
        {
          id: 1,
          empId: 123,
          date: new Date('2024-01-01'),
          scheduledTimeIn: '09:00',
          actualTimeIn: '09:30',
          minutesLate: 30,
          reason: 'Traffic jam',
          justified: true,
          lateType: 'paid',
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
          actualTimeIn: '09:45',
          minutesLate: 45,
          reason: 'Overslept',
          justified: false,
          lateType: 'unpaid',
          actionTaken: 'Pending',
          employee: {
            firstName: 'Jane',
            lastName: 'Smith'
          }
        }
      ];

      jest.spyOn(prismaService.lateLog, 'findMany').mockResolvedValue(mockLateLogs);

      const statsDto: LateLogsStatsDto = {
        period: StatsPeriod.MONTHLY,
        include_breakdown: true
      };

      const result = await service.getLateLogsStats(statsDto);

      expect(result.total_late_logs).toBe(2);
      expect(result.completed_late_logs).toBe(1);
      expect(result.pending_late_logs).toBe(1);
      expect(result.total_minutes_late).toBe(75); // 30 + 45
      expect(result.average_minutes_late).toBe(37.5); // 75 / 2
      expect(result.most_common_reason).toBe('Traffic jam');
      expect(result.paid_late_count).toBe(1);
      expect(result.unpaid_late_count).toBe(1);
      expect(result.period_stats).toBeDefined();
      expect(result.employee_breakdown).toBeDefined();
      expect(result.reason_breakdown).toBeDefined();
    });

    it('should return statistics without breakdown', async () => {
      const mockLateLogs = [
        {
          id: 1,
          empId: 123,
          date: new Date('2024-01-01'),
          scheduledTimeIn: '09:00',
          actualTimeIn: '09:30',
          minutesLate: 30,
          reason: 'Traffic jam',
          justified: true,
          lateType: 'paid',
          actionTaken: 'Completed',
          employee: {
            firstName: 'John',
            lastName: 'Doe'
          }
        }
      ];

      jest.spyOn(prismaService.lateLog, 'findMany').mockResolvedValue(mockLateLogs);

      const statsDto: LateLogsStatsDto = {
        period: StatsPeriod.WEEKLY,
        include_breakdown: false
      };

      const result = await service.getLateLogsStats(statsDto);

      expect(result.total_late_logs).toBe(1);
      expect(result.completed_late_logs).toBe(1);
      expect(result.pending_late_logs).toBe(0);
      expect(result.total_minutes_late).toBe(30);
      expect(result.average_minutes_late).toBe(30);
      expect(result.most_common_reason).toBe('Traffic jam');
      expect(result.paid_late_count).toBe(1);
      expect(result.unpaid_late_count).toBe(0);
      expect(result.period_stats).toBeDefined();
      expect(result.employee_breakdown).toBeUndefined();
      expect(result.reason_breakdown).toBeUndefined();
    });
  });
});
