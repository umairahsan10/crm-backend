import { Test, TestingModule } from '@nestjs/testing';
import { HrService } from '../../src/modules/hr/hr.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { MarkSalaryPaidDto } from '../../src/modules/hr/dto/mark-salary-paid.dto';
import { PaymentWays, SalaryStatus, TransactionType, TransactionStatus, PaymentMethod } from '@prisma/client';

describe('HrService', () => {
  let service: HrService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    $transaction: jest.fn(),
    employee: {
      findUnique: jest.fn(),
    },
    netSalaryLog: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    transaction: {
      create: jest.fn(),
    },
    expense: {
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HrService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<HrService>(HrService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('markSalaryPaid', () => {
    const mockDto: MarkSalaryPaidDto = {
      employee_id: 1,
      type: PaymentWays.bank,
    };

    const mockEmployee = {
      id: 1,
      firstName: 'John',
      lastName: 'Doe',
      status: 'active',
    };

    const mockSalaryLog = {
      id: 1,
      employeeId: 1,
      month: '2025-01',
      netSalary: { toFixed: () => '5000.00' },
      paidOn: null,
    };

    const mockTransaction = {
      id: 1,
      employeeId: 1,
      amount: mockSalaryLog.netSalary,
      transactionType: TransactionType.salary,
      paymentMethod: PaymentWays.bank,
      status: TransactionStatus.completed,
    };

    const mockExpense = {
      id: 1,
      title: 'John Doe Salary',
      category: 'salary',
      amount: mockSalaryLog.netSalary,
      transactionId: 1,
    };

    it('should successfully mark salary as paid', async () => {
      const currentUserId = 2;
      const currentDate = new Date();

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return await callback(mockPrismaService);
      });

      mockPrismaService.employee.findUnique.mockResolvedValue(mockEmployee);
      mockPrismaService.netSalaryLog.findFirst.mockResolvedValue(mockSalaryLog);
      mockPrismaService.netSalaryLog.update.mockResolvedValue({
        ...mockSalaryLog,
        paidOn: currentDate,
        processedBy: currentUserId,
        status: SalaryStatus.paid,
      });
      mockPrismaService.transaction.create.mockResolvedValue(mockTransaction);
      mockPrismaService.expense.create.mockResolvedValue(mockExpense);

      const result = await service.markSalaryPaid(mockDto, currentUserId);

      expect(result.status).toBe('success');
      expect(result.message).toBe('Salary marked as paid successfully');
      expect(result.data.employee_id).toBe(1);
      expect(result.data.payment_method).toBe(PaymentWays.bank);
    });

    it('should return error when employee not found', async () => {
      const currentUserId = 2;

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        mockPrismaService.employee.findUnique.mockResolvedValue(null);
        return await callback(mockPrismaService);
      });

      const result = await service.markSalaryPaid(mockDto, currentUserId);

      expect(result.status).toBe('error');
      expect(result.error_code).toBe('EMPLOYEE_NOT_FOUND');
      expect(result.message).toBe('Employee not found');
    });

    it('should return error when employee is inactive', async () => {
      const currentUserId = 2;

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        mockPrismaService.employee.findUnique.mockResolvedValue({
          ...mockEmployee,
          status: 'inactive',
        });
        return await callback(mockPrismaService);
      });

      const result = await service.markSalaryPaid(mockDto, currentUserId);

      expect(result.status).toBe('error');
      expect(result.error_code).toBe('EMPLOYEE_INACTIVE');
      expect(result.message).toBe('Employee is not active');
    });

    it('should return error when no unpaid salary found', async () => {
      const currentUserId = 2;

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        mockPrismaService.employee.findUnique.mockResolvedValue(mockEmployee);
        mockPrismaService.netSalaryLog.findFirst.mockResolvedValue(null);
        return await callback(mockPrismaService);
      });

      const result = await service.markSalaryPaid(mockDto, currentUserId);

      expect(result.status).toBe('error');
      expect(result.error_code).toBe('NO_UNPAID_SALARY_FOUND');
      expect(result.message).toBe('No unpaid salary found for the current month');
    });

    it('should use cash as default payment method when type is not provided', async () => {
      const currentUserId = 2;
      const dtoWithoutType = { employee_id: 1 };

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return await callback(mockPrismaService);
      });

      mockPrismaService.employee.findUnique.mockResolvedValue(mockEmployee);
      mockPrismaService.netSalaryLog.findFirst.mockResolvedValue(mockSalaryLog);
      mockPrismaService.netSalaryLog.update.mockResolvedValue({
        ...mockSalaryLog,
        paidOn: new Date(),
        processedBy: currentUserId,
        status: SalaryStatus.paid,
      });
      mockPrismaService.transaction.create.mockResolvedValue({
        ...mockTransaction,
        paymentMethod: PaymentWays.cash,
      });
      mockPrismaService.expense.create.mockResolvedValue(mockExpense);

      const result = await service.markSalaryPaid(dtoWithoutType, currentUserId);

      expect(result.status).toBe('success');
      expect(result.data.payment_method).toBe(PaymentWays.cash);
    });
  });
});