import { Test, TestingModule } from '@nestjs/testing';
import { SalesController } from '../../src/modules/sales/sales.controller';
import { SalesService } from '../../src/modules/sales/sales.service';

describe('SalesController', () => {
  let controller: SalesController;
  let service: SalesService;

  const mockSalesService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SalesController],
      providers: [
        {
          provide: SalesService,
          useValue: mockSalesService,
        },
      ],
    }).compile();

    controller = module.get<SalesController>(SalesController);
    service = module.get<SalesService>(SalesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create sales record', async () => {
      const createSalesDto = {
        type: 'DEAL',
        title: 'Enterprise Software License',
        description: 'Selling enterprise software license to ABC Corp',
        status: 'IN_PROGRESS',
        value: 50000,
        probability: 0.8,
        expectedCloseDate: new Date(),
        salespersonId: 1,
        clientId: 1,
      };

      const expectedResult = {
        id: 1,
        ...createSalesDto,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockSalesService.create.mockResolvedValue(expectedResult);

      const result = await controller.create(createSalesDto);

      expect(result).toEqual(expectedResult);
      expect(service.create).toHaveBeenCalledWith(createSalesDto);
    });
  });

  describe('findAll', () => {
    it('should return all sales records', async () => {
      const expectedResult = [
        {
          id: 1,
          type: 'DEAL',
          title: 'Enterprise Software License',
          description: 'Selling enterprise software license to ABC Corp',
          status: 'IN_PROGRESS',
          value: 50000,
          probability: 0.8,
          expectedCloseDate: new Date(),
          salespersonId: 1,
          clientId: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockSalesService.findAll.mockResolvedValue(expectedResult);

      const result = await controller.findAll();

      expect(result).toEqual(expectedResult);
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a single sales record', async () => {
      const id = '1';
      const expectedResult = {
        id: 1,
        type: 'DEAL',
        title: 'Enterprise Software License',
        description: 'Selling enterprise software license to ABC Corp',
        status: 'IN_PROGRESS',
        value: 50000,
        probability: 0.8,
        expectedCloseDate: new Date(),
        salespersonId: 1,
        clientId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockSalesService.findOne.mockResolvedValue(expectedResult);

      const result = await controller.findOne(id);

      expect(result).toEqual(expectedResult);
      expect(service.findOne).toHaveBeenCalledWith(+id);
    });
  });

  describe('update', () => {
    it('should update a sales record', async () => {
      const id = '1';
      const updateSalesDto = {
        status: 'CLOSED_WON',
        value: 55000,
      };

      const expectedResult = {
        id: 1,
        type: 'DEAL',
        title: 'Enterprise Software License',
        description: 'Selling enterprise software license to ABC Corp',
        status: 'CLOSED_WON',
        value: 55000,
        probability: 0.8,
        expectedCloseDate: new Date(),
        salespersonId: 1,
        clientId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockSalesService.update.mockResolvedValue(expectedResult);

      const result = await controller.update(id, updateSalesDto);

      expect(result).toEqual(expectedResult);
      expect(service.update).toHaveBeenCalledWith(+id, updateSalesDto);
    });
  });

  describe('remove', () => {
    it('should remove a sales record', async () => {
      const id = '1';
      const expectedResult = {
        id: 1,
        type: 'DEAL',
        title: 'Enterprise Software License',
        description: 'Selling enterprise software license to ABC Corp',
        status: 'IN_PROGRESS',
        value: 50000,
        probability: 0.8,
        expectedCloseDate: new Date(),
        salespersonId: 1,
        clientId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockSalesService.remove.mockResolvedValue(expectedResult);

      const result = await controller.remove(id);

      expect(result).toEqual(expectedResult);
      expect(service.remove).toHaveBeenCalledWith(+id);
    });
  });
});