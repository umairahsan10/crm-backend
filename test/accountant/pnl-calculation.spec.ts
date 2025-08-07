import { Test, TestingModule } from '@nestjs/testing';
import { AccountantService } from '../../src/modules/finance/accountant/accountant.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('AccountantService - P&L Calculation', () => {
  let service: AccountantService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountantService,
        {
          provide: PrismaService,
          useValue: {
            revenue: {
              aggregate: jest.fn(),
            },
            expense: {
              aggregate: jest.fn(),
            },
            profitLoss: {
              findFirst: jest.fn(),
              create: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<AccountantService>(AccountantService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('calculatePnLPreview', () => {
    it('should calculate P&L for a valid month and year', async () => {
      // Mock data
      const mockRevenueSum = { _sum: { amount: 10000 } };
      const mockExpenseSum = { _sum: { amount: 6000 } };

      // Mock Prisma calls
      jest.spyOn(prismaService.revenue, 'aggregate').mockResolvedValue(mockRevenueSum as any);
      jest.spyOn(prismaService.expense, 'aggregate').mockResolvedValue(mockExpenseSum as any);

      const result = await service.calculatePnLPreview('jan', '2024');

      expect(result.status).toBe('success');
      expect(result.data).toBeDefined();
      expect(result.data?.totalIncome).toBe(10000);
      expect(result.data?.totalExpenses).toBe(6000);
      expect(result.data?.netProfit).toBe(4000);
    });

    it('should return error for invalid month', async () => {
      const result = await service.calculatePnLPreview('invalid', '2024');

      expect(result.status).toBe('error');
      expect(result.error_code).toBe('INVALID_DATE_FORMAT');
    });

    it('should return error for invalid year', async () => {
      const result = await service.calculatePnLPreview('jan', '1800');

      expect(result.status).toBe('error');
      expect(result.error_code).toBe('INVALID_DATE_FORMAT');
    });
  });

  describe('calculateAndSavePnL', () => {
    it('should save P&L record when it does not exist', async () => {
      // Mock data
      const mockRevenueSum = { _sum: { amount: 15000 } };
      const mockExpenseSum = { _sum: { amount: 8000 } };
      const mockSavedRecord = {
        id: 1,
        month: 'jan',
        year: '2024',
        totalIncome: 15000,
        totalExpenses: 8000,
        netProfit: 7000,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock Prisma calls
      jest.spyOn(prismaService.profitLoss, 'findFirst').mockResolvedValue(null);
      jest.spyOn(prismaService.revenue, 'aggregate').mockResolvedValue(mockRevenueSum as any);
      jest.spyOn(prismaService.expense, 'aggregate').mockResolvedValue(mockExpenseSum as any);
      jest.spyOn(prismaService.profitLoss, 'create').mockResolvedValue(mockSavedRecord as any);

      const result = await service.calculateAndSavePnL('jan', '2024');

      expect(result.status).toBe('success');
      expect(result.data).toBeDefined();
      expect(result.data?.totalIncome).toBe(15000);
      expect(result.data?.totalExpenses).toBe(8000);
      expect(result.data?.netProfit).toBe(7000);
    });

    it('should skip calculation when record already exists', async () => {
      const mockExistingRecord = {
        id: 1,
        month: 'jan',
        year: '2024',
        totalIncome: 12000,
        totalExpenses: 7000,
        netProfit: 5000,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(prismaService.profitLoss, 'findFirst').mockResolvedValue(mockExistingRecord as any);

      const result = await service.calculateAndSavePnL('jan', '2024');

      expect(result.status).toBe('success');
      expect(result.message).toContain('already exists');
      expect(result.data?.totalIncome).toBe(12000);
    });
  });
}); 