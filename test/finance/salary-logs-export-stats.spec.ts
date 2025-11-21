import { Test, TestingModule } from '@nestjs/testing';
import { FinanceService } from '../../src/modules/finance/finance.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ExportSalaryLogsDto } from '../../src/modules/finance/dto/export-salary-logs.dto';
import { SalaryLogsStatsDto, StatsPeriod } from '../../src/modules/finance/dto/salary-logs-stats.dto';

describe('Salary Logs Export and Stats', () => {
  let service: FinanceService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FinanceService,
        {
          provide: PrismaService,
          useValue: {
            netSalaryLog: {
              findMany: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<FinanceService>(FinanceService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  describe('getSalaryLogsForExport', () => {
    it('should get salary logs for export', async () => {
      const mockSalaryLogs = [
        {
          id: 1,
          employeeId: 123,
          month: '2024-01',
          baseSalary: 50000,
          commission: 5000,
          bonus: 2000,
          deductions: 1000,
          netSalary: 56000,
          status: 'Paid',
          paidOn: new Date('2024-01-31'),
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-31'),
          employee: {
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@example.com',
            id: 123,
            department: {
              name: 'Sales'
            }
          }
        }
      ];

      jest.spyOn(prismaService.netSalaryLog, 'findMany').mockResolvedValue(mockSalaryLogs);

      const query = {
        employee_id: 123,
        month: '2024-01'
      };

      const result = await service.getSalaryLogsForExport(query);

      expect(result).toEqual(mockSalaryLogs);
      expect(prismaService.netSalaryLog.findMany).toHaveBeenCalledWith({
        where: {
          employeeId: 123,
          month: '2024-01'
        },
        include: {
          employee: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              id: true,
              department: {
                select: {
                  name: true
                }
              }
            }
          }
        },
        orderBy: {
          month: 'desc'
        }
      });
    });
  });

  describe('convertSalaryLogsToCSV', () => {
    it('should convert salary logs to CSV format', () => {
      const mockSalaryLogs = [
        {
          id: 1,
          employeeId: 123,
          month: '2024-01',
          baseSalary: 50000,
          commission: 5000,
          bonus: 2000,
          deductions: 1000,
          netSalary: 56000,
          status: 'Paid',
          paidOn: new Date('2024-01-31'),
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-31'),
          employee: {
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@example.com',
            id: 123,
            department: {
              name: 'Sales'
            }
          }
        }
      ];

      const exportDto: ExportSalaryLogsDto = {
        format: 'csv',
        include_breakdown: true,
        include_deductions: true
      };

      const result = service.convertSalaryLogsToCSV(mockSalaryLogs, exportDto);

      expect(result).toContain('Salary Log ID,Employee ID,Employee Name');
      expect(result).toContain('1,123,"John Doe"');
      expect(result).toContain('john.doe@example.com');
      expect(result).toContain('Sales');
      expect(result).toContain('2024-01');
      expect(result).toContain('50000');
      expect(result).toContain('5000');
      expect(result).toContain('2000');
      expect(result).toContain('1000');
      expect(result).toContain('56000');
      expect(result).toContain('Paid');
      expect(result).toContain('2024-01-31');
      expect(result).toContain('Deduction Details');
    });
  });

  describe('getSalaryLogsStats', () => {
    it('should return salary logs statistics', async () => {
      const mockSalaryLogs = [
        {
          id: 1,
          employeeId: 123,
          month: '2024-01',
          baseSalary: 50000,
          commission: 5000,
          bonus: 2000,
          deductions: 1000,
          netSalary: 56000,
          status: 'Paid',
          employee: {
            firstName: 'John',
            lastName: 'Doe',
            department: {
              name: 'Sales'
            }
          }
        },
        {
          id: 2,
          employeeId: 124,
          month: '2024-01',
          baseSalary: 60000,
          commission: 3000,
          bonus: 1000,
          deductions: 500,
          netSalary: 63500,
          status: 'Paid',
          employee: {
            firstName: 'Jane',
            lastName: 'Smith',
            department: {
              name: 'Marketing'
            }
          }
        }
      ];

      jest.spyOn(prismaService.netSalaryLog, 'findMany').mockResolvedValue(mockSalaryLogs);

      const statsDto: SalaryLogsStatsDto = {
        period: StatsPeriod.MONTHLY,
        include_breakdown: true
      };

      const result = await service.getSalaryLogsStats(statsDto);

      expect(result.total_salary_logs).toBe(2);
      expect(result.total_base_salary).toBe(110000); // 50000 + 60000
      expect(result.total_commission).toBe(8000); // 5000 + 3000
      expect(result.total_bonus).toBe(3000); // 2000 + 1000
      expect(result.total_deductions).toBe(1500); // 1000 + 500
      expect(result.total_net_salary).toBe(119500); // 56000 + 63500
      expect(result.average_salary).toBe(59750); // 119500 / 2
      expect(result.highest_salary).toBe(63500);
      expect(result.lowest_salary).toBe(56000);
      expect(result.period_stats).toBeDefined();
      expect(result.employee_breakdown).toBeDefined();
      expect(result.department_breakdown).toBeDefined();
    });

    it('should return statistics without breakdown', async () => {
      const mockSalaryLogs = [
        {
          id: 1,
          employeeId: 123,
          month: '2024-01',
          baseSalary: 50000,
          commission: 5000,
          bonus: 2000,
          deductions: 1000,
          netSalary: 56000,
          status: 'Paid',
          employee: {
            firstName: 'John',
            lastName: 'Doe',
            department: {
              name: 'Sales'
            }
          }
        }
      ];

      jest.spyOn(prismaService.netSalaryLog, 'findMany').mockResolvedValue(mockSalaryLogs);

      const statsDto: SalaryLogsStatsDto = {
        period: StatsPeriod.QUARTERLY,
        include_breakdown: false
      };

      const result = await service.getSalaryLogsStats(statsDto);

      expect(result.total_salary_logs).toBe(1);
      expect(result.total_base_salary).toBe(50000);
      expect(result.total_commission).toBe(5000);
      expect(result.total_bonus).toBe(2000);
      expect(result.total_deductions).toBe(1000);
      expect(result.total_net_salary).toBe(56000);
      expect(result.average_salary).toBe(56000);
      expect(result.highest_salary).toBe(56000);
      expect(result.lowest_salary).toBe(56000);
      expect(result.period_stats).toBeDefined();
      expect(result.employee_breakdown).toBeUndefined();
      expect(result.department_breakdown).toBeUndefined();
    });
  });
});
