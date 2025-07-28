import { Test, TestingModule } from '@nestjs/testing';
import { SalesService } from '../../src/modules/sales/sales.service';
import { PrismaService } from '../../src/prisma/prisma.service';

describe('SalesService', () => {
  let service: SalesService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    sales: {
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
        SalesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<SalesService>(SalesService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new sales record', async () => {
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

      mockPrismaService.sales.create.mockResolvedValue(expectedResult);

      const result = await service.create(createSalesDto);

      expect(result).toEqual(expectedResult);
      expect(mockPrismaService.sales.create).toHaveBeenCalledWith({
        data: createSalesDto,
      });
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

      mockPrismaService.sales.findMany.mockResolvedValue(expectedResult);

      const result = await service.findAll();

      expect(result).toEqual(expectedResult);
      expect(mockPrismaService.sales.findMany).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a single sales record', async () => {
      const id = 1;
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

      mockPrismaService.sales.findUnique.mockResolvedValue(expectedResult);

      const result = await service.findOne(id);

      expect(result).toEqual(expectedResult);
      expect(mockPrismaService.sales.findUnique).toHaveBeenCalledWith({
        where: { id },
      });
    });
  });

  describe('update', () => {
    it('should update a sales record', async () => {
      const id = 1;
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

      mockPrismaService.sales.update.mockResolvedValue(expectedResult);

      const result = await service.update(id, updateSalesDto);

      expect(result).toEqual(expectedResult);
      expect(mockPrismaService.sales.update).toHaveBeenCalledWith({
        where: { id },
        data: updateSalesDto,
      });
    });
  });

  describe('remove', () => {
    it('should remove a sales record', async () => {
      const id = 1;
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

      mockPrismaService.sales.delete.mockResolvedValue(expectedResult);

      const result = await service.remove(id);

      expect(result).toEqual(expectedResult);
      expect(mockPrismaService.sales.delete).toHaveBeenCalledWith({
        where: { id },
      });
    });
  });
});