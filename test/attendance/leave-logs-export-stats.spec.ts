import { Test, TestingModule } from '@nestjs/testing';
import { AttendanceService } from '../../src/modules/hr/attendance/attendance.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ExportLeaveLogsDto } from '../../src/modules/hr/attendance/dto/export-leave-logs.dto';
import { LeaveLogsStatsDto, StatsPeriod } from '../../src/modules/hr/attendance/dto/leave-logs-stats.dto';

describe('Leave Logs Export and Stats', () => {
  let service: AttendanceService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AttendanceService,
        {
          provide: PrismaService,
          useValue: {
            leaveLog: {
              findMany: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<AttendanceService>(AttendanceService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  describe('getLeaveLogsForExport', () => {
    it('should get leave logs for export', async () => {
      const mockLeaveLogs = [
        {
          id: 1,
          empId: 123,
          leaveType: 'Annual',
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-03'),
          reason: 'Vacation',
          status: 'Approved' as any,
          appliedOn: new Date('2023-12-15'),
          reviewedBy: 456,
          reviewedOn: new Date('2023-12-16'),
          confirmationReason: 'Approved by manager',
          createdAt: new Date('2023-12-15'),
          updatedAt: new Date('2023-12-16'),
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

      jest.spyOn(prismaService.leaveLog, 'findMany').mockResolvedValue(mockLeaveLogs);

      const query = {
        employee_id: 123,
        start_date: '2023-12-01',
        end_date: '2023-12-31'
      };

      const result = await service.getLeaveLogsForExport(query);

      expect(result).toEqual(mockLeaveLogs);
      expect(prismaService.leaveLog.findMany).toHaveBeenCalledWith({
        where: {
          empId: 123,
          appliedOn: {
            gte: new Date('2023-12-01'),
            lte: new Date('2023-12-31')
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
          appliedOn: 'desc'
        }
      });
    });
  });

  describe('convertLeaveLogsToCSV', () => {
    it('should convert leave logs to CSV format', () => {
      const mockLeaveLogs = [
        {
          id: 1,
          empId: 123,
          leaveType: 'Annual',
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-03'),
          reason: 'Vacation',
          status: 'Approved' as any,
          appliedOn: new Date('2023-12-15'),
          reviewedBy: 456,
          reviewedOn: new Date('2023-12-16'),
          confirmationReason: 'Approved by manager',
          createdAt: new Date('2023-12-15'),
          updatedAt: new Date('2023-12-16'),
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

      const exportDto: ExportLeaveLogsDto = {
        format: 'csv',
        include_reviewer_details: true,
        include_confirmation_reason: true
      };

      const result = service.convertLeaveLogsToCSV(mockLeaveLogs, exportDto);

      expect(result).toContain('Leave ID,Employee ID,Employee Name');
      expect(result).toContain('1,123,"John Doe"');
      expect(result).toContain('john.doe@example.com');
      expect(result).toContain('Annual');
      expect(result).toContain('2024-01-01');
      expect(result).toContain('2024-01-03');
      expect(result).toContain('Vacation');
      expect(result).toContain('Approved');
      expect(result).toContain('Reviewed By');
      expect(result).toContain('Confirmation Reason');
    });
  });

  describe('getLeaveLogsStats', () => {
    it('should return leave logs statistics', async () => {
      const mockLeaveLogs = [
        {
          id: 1,
          empId: 123,
          leaveType: 'Annual',
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-03'),
          reason: 'Vacation',
          status: 'Approved' as any,
          appliedOn: new Date('2023-12-15'),
          reviewedBy: 456,
          reviewedOn: new Date('2023-12-16'),
          confirmationReason: 'Approved by manager',
          createdAt: new Date('2023-12-15'),
          updatedAt: new Date('2023-12-16'),
          employee: {
            firstName: 'John',
            lastName: 'Doe'
          }
        },
        {
          id: 2,
          empId: 124,
          leaveType: 'Sick',
          startDate: new Date('2024-01-05'),
          endDate: new Date('2024-01-05'),
          reason: 'Illness',
          status: 'Pending' as any,
          appliedOn: new Date('2023-12-20'),
          reviewedBy: null,
          reviewedOn: null,
          confirmationReason: null,
          createdAt: new Date('2023-12-20'),
          updatedAt: new Date('2023-12-20'),
          employee: {
            firstName: 'Jane',
            lastName: 'Smith'
          }
        }
      ];

      jest.spyOn(prismaService.leaveLog, 'findMany').mockResolvedValue(mockLeaveLogs);

      const statsDto: LeaveLogsStatsDto = {
        period: StatsPeriod.MONTHLY,
        include_breakdown: true
      };

      const result = await service.getLeaveLogsStats(statsDto);

      expect(result.total_leaves).toBe(2);
      expect(result.approved_leaves).toBe(1);
      expect(result.pending_leaves).toBe(1);
      expect(result.rejected_leaves).toBe(0);
      expect(result.total_leave_days).toBe(4); // 3 days + 1 day
      expect(result.average_leave_duration).toBe(2);
      expect(result.most_common_leave_type).toBe('Annual');
      expect(result.period_stats).toBeDefined();
      expect(result.employee_breakdown).toBeDefined();
      expect(result.leave_type_breakdown).toBeDefined();
    });

    it('should return statistics without breakdown', async () => {
      const mockLeaveLogs = [
        {
          id: 1,
          empId: 123,
          leaveType: 'Annual',
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-02'),
          reason: 'Vacation',
          status: 'Approved' as any,
          appliedOn: new Date('2023-12-15'),
          reviewedBy: 456,
          reviewedOn: new Date('2023-12-16'),
          confirmationReason: 'Approved by manager',
          createdAt: new Date('2023-12-15'),
          updatedAt: new Date('2023-12-16'),
          employee: {
            firstName: 'John',
            lastName: 'Doe'
          }
        }
      ];

      jest.spyOn(prismaService.leaveLog, 'findMany').mockResolvedValue(mockLeaveLogs);

      const statsDto: LeaveLogsStatsDto = {
        period: StatsPeriod.WEEKLY,
        include_breakdown: false
      };

      const result = await service.getLeaveLogsStats(statsDto);

      expect(result.total_leaves).toBe(1);
      expect(result.approved_leaves).toBe(1);
      expect(result.pending_leaves).toBe(0);
      expect(result.rejected_leaves).toBe(0);
      expect(result.total_leave_days).toBe(2);
      expect(result.average_leave_duration).toBe(2);
      expect(result.most_common_leave_type).toBe('Annual');
      expect(result.period_stats).toBeDefined();
      expect(result.employee_breakdown).toBeUndefined();
      expect(result.leave_type_breakdown).toBeUndefined();
    });
  });
});
