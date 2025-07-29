import { Test, TestingModule } from '@nestjs/testing';
import { MarketingController } from '../../src/modules/marketing/marketing.controller';
import { MarketingService } from '../../src/modules/marketing/marketing.service';

describe('MarketingController', () => {
  let controller: MarketingController;
  let service: MarketingService;

  const mockMarketingService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MarketingController],
      providers: [
        {
          provide: MarketingService,
          useValue: mockMarketingService,
        },
      ],
    }).compile();

    controller = module.get<MarketingController>(MarketingController);
    service = module.get<MarketingService>(MarketingService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create marketing record', async () => {
      const createMarketingDto = {
        type: 'CAMPAIGN',
        title: 'Summer Sale Campaign',
        description: 'Promotional campaign for summer products',
        status: 'ACTIVE',
        budget: 10000,
        startDate: new Date(),
        endDate: new Date(),
        managerId: 1,
      };

      const expectedResult = {
        id: 1,
        ...createMarketingDto,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockMarketingService.create.mockResolvedValue(expectedResult);

      const result = await controller.create(createMarketingDto);

      expect(result).toEqual(expectedResult);
      expect(service.create).toHaveBeenCalledWith(createMarketingDto);
    });
  });

  describe('findAll', () => {
    it('should return all marketing records', async () => {
      const expectedResult = [
        {
          id: 1,
          type: 'CAMPAIGN',
          title: 'Summer Sale Campaign',
          description: 'Promotional campaign for summer products',
          status: 'ACTIVE',
          budget: 10000,
          startDate: new Date(),
          endDate: new Date(),
          managerId: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockMarketingService.findAll.mockResolvedValue(expectedResult);

      const result = await controller.findAll();

      expect(result).toEqual(expectedResult);
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a single marketing record', async () => {
      const id = '1';
      const expectedResult = {
        id: 1,
        type: 'CAMPAIGN',
        title: 'Summer Sale Campaign',
        description: 'Promotional campaign for summer products',
        status: 'ACTIVE',
        budget: 10000,
        startDate: new Date(),
        endDate: new Date(),
        managerId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockMarketingService.findOne.mockResolvedValue(expectedResult);

      const result = await controller.findOne(id);

      expect(result).toEqual(expectedResult);
      expect(service.findOne).toHaveBeenCalledWith(+id);
    });
  });

  describe('update', () => {
    it('should update a marketing record', async () => {
      const id = '1';
      const updateMarketingDto = {
        status: 'COMPLETED',
        budget: 12000,
      };

      const expectedResult = {
        id: 1,
        type: 'CAMPAIGN',
        title: 'Summer Sale Campaign',
        description: 'Promotional campaign for summer products',
        status: 'COMPLETED',
        budget: 12000,
        startDate: new Date(),
        endDate: new Date(),
        managerId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockMarketingService.update.mockResolvedValue(expectedResult);

      const result = await controller.update(id, updateMarketingDto);

      expect(result).toEqual(expectedResult);
      expect(service.update).toHaveBeenCalledWith(+id, updateMarketingDto);
    });
  });

  describe('remove', () => {
    it('should remove a marketing record', async () => {
      const id = '1';
      const expectedResult = {
        id: 1,
        type: 'CAMPAIGN',
        title: 'Summer Sale Campaign',
        description: 'Promotional campaign for summer products',
        status: 'ACTIVE',
        budget: 10000,
        startDate: new Date(),
        endDate: new Date(),
        managerId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockMarketingService.remove.mockResolvedValue(expectedResult);

      const result = await controller.remove(id);

      expect(result).toEqual(expectedResult);
      expect(service.remove).toHaveBeenCalledWith(+id);
    });
  });
});