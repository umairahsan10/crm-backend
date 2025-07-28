import { Test, TestingModule } from '@nestjs/testing';
import { FinanceService } from '../../src/modules/finance/finance.service';
import { PrismaService } from '../../src/prisma/prisma.service';

describe('FinanceService', () => {
  let service: FinanceService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    finance: {
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
        FinanceService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<FinanceService>(FinanceService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new finance record', async () => {
      const createFinanceDto = {
        type: 'INCOME',
        amount: 50000,
        description: 'Monthly revenue',
        date: new Date(),
        category: 'REVENUE',
        accountId: 1,
      };

      const expectedResult = {
        id: 1,
        ...createFinanceDto,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.finance.create.mockResolvedValue(expectedResult);

      const result = await service.create(createFinanceDto);

      expect(result).toEqual(expectedResult);
      expect(mockPrismaService.finance.create).toHaveBeenCalledWith({
        data: createFinanceDto,
      });
    });
  });

  describe('findAll', () => {
    it('should return all finance records', async () => {
      const expectedResult = [
        {
          id: 1,
          type: 'INCOME',
          amount: 50000,
          description: 'Monthly revenue',
          date: new Date(),
          category: 'REVENUE',
          accountId: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrismaService.finance.findMany.mockResolvedValue(expectedResult);

      const result = await service.findAll();

      expect(result).toEqual(expectedResult);
      expect(mockPrismaService.finance.findMany).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a single finance record', async () => {
      const id = 1;
      const expectedResult = {
        id: 1,
        type: 'INCOME',
        amount: 50000,
        description: 'Monthly revenue',
        date: new Date(),
        category: 'REVENUE',
        accountId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.finance.findUnique.mockResolvedValue(expectedResult);

      const result = await service.findOne(id);

      expect(result).toEqual(expectedResult);
      expect(mockPrismaService.finance.findUnique).toHaveBeenCalledWith({
        where: { id },
      });
    });
  });

  describe('update', () => {
    it('should update a finance record', async () => {
      const id = 1;
      const updateFinanceDto = {
        amount: 55000,
        description: 'Updated monthly revenue',
      };

      const expectedResult = {
        id: 1,
        type: 'INCOME',
        amount: 55000,
        description: 'Updated monthly revenue',
        date: new Date(),
        category: 'REVENUE',
        accountId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.finance.update.mockResolvedValue(expectedResult);

      const result = await service.update(id, updateFinanceDto);

      expect(result).toEqual(expectedResult);
      expect(mockPrismaService.finance.update).toHaveBeenCalledWith({
        where: { id },
        data: updateFinanceDto,
      });
    });
  });

  describe('remove', () => {
    it('should remove a finance record', async () => {
      const id = 1;
      const expectedResult = {
        id: 1,
        type: 'INCOME',
        amount: 50000,
        description: 'Monthly revenue',
        date: new Date(),
        category: 'REVENUE',
        accountId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.finance.delete.mockResolvedValue(expectedResult);

      const result = await service.remove(id);

      expect(result).toEqual(expectedResult);
      expect(mockPrismaService.finance.delete).toHaveBeenCalledWith({
        where: { id },
      });
    });
  });
});