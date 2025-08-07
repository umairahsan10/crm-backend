import { Test, TestingModule } from '@nestjs/testing';
import { HrService } from '../../src/modules/hr/hr.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { FinanceService } from '../../src/modules/finance/finance.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('HrService', () => {
  let service: HrService;
  let prismaService: PrismaService;
  let financeService: FinanceService;

  const mockPrismaService = {
    employee: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    hR: {
      findUnique: jest.fn(),
    },
    hRLog: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  };

  const mockFinanceService = {
    calculateSalaryManual: jest.fn(),
    calculateEmployeeDeductions: jest.fn(),
    calculateAllEmployeesDeductions: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HrService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: FinanceService,
          useValue: mockFinanceService,
        },
      ],
    }).compile();

    service = module.get<HrService>(HrService);
    prismaService = module.get<PrismaService>(PrismaService);
    financeService = module.get<FinanceService>(FinanceService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('terminateEmployee', () => {
    const employeeId = 1;
    const hrEmployeeId = 2;
    const terminationDate = '2025-07-31';
    const description = 'Performance issues';

    const mockEmployee = {
      id: employeeId,
      firstName: 'John',
      lastName: 'Doe',
      status: 'active',
    };

    const mockHrEmployee = {
      id: hrEmployeeId,
      firstName: 'Jane',
      lastName: 'Smith',
    };

    const mockHrRecord = {
      id: 1,
      employeeId: hrEmployeeId,
    };

    it('should successfully terminate an employee and create HR log', async () => {
      mockPrismaService.employee.findUnique
        .mockResolvedValueOnce(mockEmployee) // First call for employee
        .mockResolvedValueOnce(mockHrEmployee); // Second call for HR employee
      mockPrismaService.hR.findUnique.mockResolvedValue(mockHrRecord);
      mockPrismaService.employee.update.mockResolvedValue({});
      mockFinanceService.calculateSalaryManual.mockResolvedValue({});
      mockPrismaService.hRLog.create.mockResolvedValue({});

      await service.terminateEmployee(employeeId, terminationDate, hrEmployeeId, description);

      expect(mockPrismaService.employee.update).toHaveBeenCalledWith({
        where: { id: employeeId },
        data: {
          endDate: new Date(terminationDate),
          status: 'terminated',
        },
      });

      expect(mockFinanceService.calculateSalaryManual).toHaveBeenCalledWith(employeeId);

      expect(mockPrismaService.hRLog.create).toHaveBeenCalledWith({
        data: {
          hrId: mockHrRecord.id,
          actionType: 'employee_termination',
          affectedEmployeeId: employeeId,
          description: description,
        },
      });
    });

    it('should create HR log with automatic description when no description provided', async () => {
      mockPrismaService.employee.findUnique
        .mockResolvedValueOnce(mockEmployee)
        .mockResolvedValueOnce(mockHrEmployee);
      mockPrismaService.hR.findUnique.mockResolvedValue(mockHrRecord);
      mockPrismaService.employee.update.mockResolvedValue({});
      mockFinanceService.calculateSalaryManual.mockResolvedValue({});
      mockPrismaService.hRLog.create.mockResolvedValue({});

      await service.terminateEmployee(employeeId, terminationDate, hrEmployeeId);

      const expectedDescription = `Employee ${mockEmployee.firstName} ${mockEmployee.lastName} (ID: ${employeeId}) was terminated on ${terminationDate} by HR ${mockHrEmployee.firstName} ${mockHrEmployee.lastName}`;

      expect(mockPrismaService.hRLog.create).toHaveBeenCalledWith({
        data: {
          hrId: mockHrRecord.id,
          actionType: 'employee_termination',
          affectedEmployeeId: employeeId,
          description: expectedDescription,
        },
      });
    });

    it('should throw BadRequestException for invalid date format', async () => {
      await expect(
        service.terminateEmployee(employeeId, 'invalid-date', hrEmployeeId)
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException for non-existent employee', async () => {
      mockPrismaService.employee.findUnique.mockResolvedValue(null);

      await expect(
        service.terminateEmployee(employeeId, terminationDate, hrEmployeeId)
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for already terminated employee', async () => {
      const terminatedEmployee = { ...mockEmployee, status: 'terminated' };
      mockPrismaService.employee.findUnique.mockResolvedValue(terminatedEmployee);

      await expect(
        service.terminateEmployee(employeeId, terminationDate, hrEmployeeId)
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getHrLogs', () => {
    const hrEmployeeId = 2;
    const mockHrRecord = {
      id: 1,
      employeeId: hrEmployeeId,
    };

    const mockLogs = [
      {
        id: 1,
        actionType: 'employee_termination',
        affectedEmployeeId: 1,
        description: 'Test termination',
        createdAt: new Date(),
        updatedAt: new Date(),
        affectedEmployee: {
          id: 1,
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
        },
        hr: {
          id: 1,
          employee: {
            id: hrEmployeeId,
            firstName: 'Jane',
            lastName: 'Smith',
            email: 'jane@example.com',
          },
        },
      },
    ];

    it('should return HR logs for the authenticated HR employee', async () => {
      mockPrismaService.hR.findUnique.mockResolvedValue(mockHrRecord);
      mockPrismaService.hRLog.findMany.mockResolvedValue(mockLogs);

      const result = await service.getHrLogs(hrEmployeeId);

      expect(mockPrismaService.hR.findUnique).toHaveBeenCalledWith({
        where: { employeeId: hrEmployeeId },
      });

      expect(mockPrismaService.hRLog.findMany).toHaveBeenCalledWith({
        where: { hrId: mockHrRecord.id },
        include: {
          affectedEmployee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          hr: {
            include: {
              employee: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      expect(result).toEqual(mockLogs);
    });

    it('should throw NotFoundException for non-existent HR record', async () => {
      mockPrismaService.hR.findUnique.mockResolvedValue(null);

      await expect(service.getHrLogs(hrEmployeeId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('calculateSalaryDeductions', () => {
    const mockDeductionResult = {
      employeeId: 1,
      baseSalary: 30000,
      perDaySalary: 1000,
      totalAbsent: 2,
      totalLateDays: 5,
      totalHalfDays: 1,
      monthlyLatesDays: 3,
      absentDeduction: 4000,
      lateDeduction: 1500,
      halfDayDeduction: 500,
      chargebackDeduction: 1000,
      refundDeduction: 500,
      totalDeduction: 6000,
      netSalary: 24000,
    };

    const mockEmployee = {
      id: 1,
      firstName: 'John',
      lastName: 'Doe',
    };

    beforeEach(() => {
      mockFinanceService.calculateEmployeeDeductions = jest.fn();
      mockFinanceService.calculateAllEmployeesDeductions = jest.fn();
      mockPrismaService.employee = {
        findUnique: jest.fn(),
        findMany: jest.fn(),
      };
    });

    it('should calculate salary deductions for a specific employee using finance service', async () => {
      mockFinanceService.calculateEmployeeDeductions.mockResolvedValue(mockDeductionResult);
      mockPrismaService.employee.findUnique.mockResolvedValue(mockEmployee);

      const dto = { employeeId: 1, month: '2025-01' };
      const result = await service.calculateSalaryDeductions(dto);

      expect(mockFinanceService.calculateEmployeeDeductions).toHaveBeenCalledWith(1, '2025-01');
      expect(result.calculations).toHaveLength(1);
      expect(result.calculations[0].employeeId).toBe(1);
      expect(result.calculations[0].employeeName).toBe('John Doe');
      expect(result.calculations[0].baseSalary).toBe(30000);
      expect(result.calculations[0].totalDeduction).toBe(6000);
      expect(result.calculations[0].netSalary).toBe(24000);
    });

    it('should calculate salary deductions for all employees using finance service', async () => {
      const mockAllEmployeesResult = {
        month: '2025-01',
        totalEmployees: 2,
        totalDeductions: 8000,
        results: [
          mockDeductionResult,
          { ...mockDeductionResult, employeeId: 2, totalDeduction: 2000, netSalary: 28000 }
        ],
      };

      const mockEmployees = [
        mockEmployee,
        { id: 2, firstName: 'Jane', lastName: 'Smith' }
      ];

      mockFinanceService.calculateAllEmployeesDeductions.mockResolvedValue(mockAllEmployeesResult);
      mockPrismaService.employee.findMany.mockResolvedValue(mockEmployees);

      const dto = { month: '2025-01' };
      const result = await service.calculateSalaryDeductions(dto);

      expect(mockFinanceService.calculateAllEmployeesDeductions).toHaveBeenCalledWith('2025-01');
      expect(result.calculations).toHaveLength(2);
      expect(result.summary.totalEmployees).toBe(2);
      expect(result.summary.totalDeductions).toBe(8000);
    });

    it('should use current month when no month is specified', async () => {
      mockFinanceService.calculateEmployeeDeductions.mockResolvedValue(mockDeductionResult);
      mockPrismaService.employee.findUnique.mockResolvedValue(mockEmployee);

      const dto = { employeeId: 1 };
      await service.calculateSalaryDeductions(dto);

      // Should call with current month format (YYYY-MM)
      const currentDate = new Date();
      const expectedMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
      expect(mockFinanceService.calculateEmployeeDeductions).toHaveBeenCalledWith(1, expectedMonth);
    });

    it('should handle employee names correctly for all employees calculation', async () => {
      const mockAllEmployeesResult = {
        month: '2025-01',
        totalEmployees: 1,
        totalDeductions: 6000,
        results: [mockDeductionResult],
      };

      mockFinanceService.calculateAllEmployeesDeductions.mockResolvedValue(mockAllEmployeesResult);
      mockPrismaService.employee.findMany.mockResolvedValue([mockEmployee]);

      const dto = { month: '2025-01' };
      const result = await service.calculateSalaryDeductions(dto);

      expect(result.calculations[0].employeeName).toBe('John Doe');
    });

    it('should handle missing employee names gracefully', async () => {
      const mockAllEmployeesResult = {
        month: '2025-01',
        totalEmployees: 1,
        totalDeductions: 6000,
        results: [mockDeductionResult],
      };

      mockFinanceService.calculateAllEmployeesDeductions.mockResolvedValue(mockAllEmployeesResult);
      mockPrismaService.employee.findMany.mockResolvedValue([]); // No employees found

      const dto = { month: '2025-01' };
      const result = await service.calculateSalaryDeductions(dto);

      expect(result.calculations[0].employeeName).toBe('Employee 1'); // Default name
    });
  });
});