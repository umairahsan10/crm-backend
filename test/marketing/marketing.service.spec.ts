import { Test, TestingModule } from '@nestjs/testing';
import { MarketingService } from '../../src/modules/marketing/marketing.service';
import { PrismaService } from '../../src/prisma/prisma.service';

describe('MarketingService', () => {
  let service: MarketingService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    marketing: {
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
        MarketingService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<MarketingService>(MarketingService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new marketing record', async () => {
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

      mockPrismaService.marketing.create.mockResolvedValue(expectedResult);

      const result = await service.create(createMarketingDto);

      expect(result).toEqual(expectedResult);
      expect(mockPrismaService.marketing.create).toHaveBeenCalledWith({
        data: createMarketingDto,
      });
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

      mockPrismaService.marketing.findMany.mockResolvedValue(expectedResult);

      const result = await service.findAll();

      expect(result).toEqual(expectedResult);
      expect(mockPrismaService.marketing.findMany).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a single marketing record', async () => {
      const id = 1;
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

      mockPrismaService.marketing.findUnique.mockResolvedValue(expectedResult);

      const result = await service.findOne(id);

      expect(result).toEqual(expectedResult);
      expect(mockPrismaService.marketing.findUnique).toHaveBeenCalledWith({
        where: { id },
      });
    });
  });

  describe('update', () => {
    it('should update a marketing record', async () => {
      const id = 1;
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

      mockPrismaService.marketing.update.mockResolvedValue(expectedResult);

      const result = await service.update(id, updateMarketingDto);

      expect(result).toEqual(expectedResult);
      expect(mockPrismaService.marketing.update).toHaveBeenCalledWith({
        where: { id },
        data: updateMarketingDto,
      });
    });
  });

  describe('remove', () => {
    it('should remove a marketing record', async () => {
      const id = 1;
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

      mockPrismaService.marketing.delete.mockResolvedValue(expectedResult);

      const result = await service.remove(id);

      expect(result).toEqual(expectedResult);
      expect(mockPrismaService.marketing.delete).toHaveBeenCalledWith({
        where: { id },
      });
    });
  });
});