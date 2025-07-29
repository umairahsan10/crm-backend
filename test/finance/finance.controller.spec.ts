import { Test, TestingModule } from '@nestjs/testing';
import { FinanceController } from '../../src/modules/finance/finance.controller';
import { FinanceService } from '../../src/modules/finance/finance.service';

describe('FinanceController', () => {
  let controller: FinanceController;
  let service: FinanceService;

  const mockFinanceService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FinanceController],
      providers: [
        {
          provide: FinanceService,
          useValue: mockFinanceService,
        },
      ],
    }).compile();

    controller = module.get<FinanceController>(FinanceController);
    service = module.get<FinanceService>(FinanceService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create finance record', async () => {
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

      mockFinanceService.create.mockResolvedValue(expectedResult);

      const result = await controller.create(createFinanceDto);

      expect(result).toEqual(expectedResult);
      expect(service.create).toHaveBeenCalledWith(createFinanceDto);
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

      mockFinanceService.findAll.mockResolvedValue(expectedResult);

      const result = await controller.findAll();

      expect(result).toEqual(expectedResult);
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a single finance record', async () => {
      const id = '1';
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

      mockFinanceService.findOne.mockResolvedValue(expectedResult);

      const result = await controller.findOne(id);

      expect(result).toEqual(expectedResult);
      expect(service.findOne).toHaveBeenCalledWith(+id);
    });
  });

  describe('update', () => {
    it('should update a finance record', async () => {
      const id = '1';
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

      mockFinanceService.update.mockResolvedValue(expectedResult);

      const result = await controller.update(id, updateFinanceDto);

      expect(result).toEqual(expectedResult);
      expect(service.update).toHaveBeenCalledWith(+id, updateFinanceDto);
    });
  });

  describe('remove', () => {
    it('should remove a finance record', async () => {
      const id = '1';
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

      mockFinanceService.remove.mockResolvedValue(expectedResult);

      const result = await controller.remove(id);

      expect(result).toEqual(expectedResult);
      expect(service.remove).toHaveBeenCalledWith(+id);
    });
  });
});