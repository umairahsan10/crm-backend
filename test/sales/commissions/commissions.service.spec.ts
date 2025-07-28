import { Test, TestingModule } from '@nestjs/testing';
import { CommissionsService } from '../../../src/modules/sales/commissions/commissions.service';
import { PrismaService } from '../../../prisma/prisma.service';

describe('CommissionsService', () => {
  let service: CommissionsService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    commission: {
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
        CommissionsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<CommissionsService>(CommissionsService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new commission record', async () => {
      const createCommissionDto = {
        salespersonId: 1,
        dealId: 1,
        amount: 5000,
        percentage: 0.1,
        status: 'PENDING' as const,
        paymentDate: new Date(),
      };

      const expectedResult = {
        id: 1,
        ...createCommissionDto,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.commission.create.mockResolvedValue(expectedResult);

      const result = await service.create(createCommissionDto);

      expect(result).toEqual(expectedResult);
      expect(mockPrismaService.commission.create).toHaveBeenCalledWith({
        data: createCommissionDto,
      });
    });
  });

  describe('findAll', () => {
    it('should return all commission records', async () => {
      const expectedResult = [
        {
          id: 1,
          salespersonId: 1,
          dealId: 1,
          amount: 5000,
          percentage: 0.1,
          status: 'PENDING' as const,
          paymentDate: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrismaService.commission.findMany.mockResolvedValue(expectedResult);

      const result = await service.findAll();

      expect(result).toEqual(expectedResult);
      expect(mockPrismaService.commission.findMany).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a single commission record', async () => {
      const id = 1;
      const expectedResult = {
        id: 1,
        salespersonId: 1,
        dealId: 1,
        amount: 5000,
        percentage: 0.1,
        status: 'PENDING' as const,
        paymentDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.commission.findUnique.mockResolvedValue(expectedResult);

      const result = await service.findOne(id);

      expect(result).toEqual(expectedResult);
      expect(mockPrismaService.commission.findUnique).toHaveBeenCalledWith({
        where: { id },
      });
    });
  });

  describe('update', () => {
    it('should update a commission record', async () => {
      const id = 1;
      const updateCommissionDto = {
        status: 'PAID' as const,
        amount: 5500,
      };

      const expectedResult = {
        id: 1,
        salespersonId: 1,
        dealId: 1,
        amount: 5500,
        percentage: 0.1,
        status: 'PAID' as const,
        paymentDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.commission.update.mockResolvedValue(expectedResult);

      const result = await service.update(id, updateCommissionDto);

      expect(result).toEqual(expectedResult);
      expect(mockPrismaService.commission.update).toHaveBeenCalledWith({
        where: { id },
        data: updateCommissionDto,
      });
    });
  });

  describe('remove', () => {
    it('should remove a commission record', async () => {
      const id = 1;
      const expectedResult = {
        id: 1,
        salespersonId: 1,
        dealId: 1,
        amount: 5000,
        percentage: 0.1,
        status: 'PENDING' as const,
        paymentDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.commission.delete.mockResolvedValue(expectedResult);

      const result = await service.remove(id);

      expect(result).toEqual(expectedResult);
      expect(mockPrismaService.commission.delete).toHaveBeenCalledWith({
        where: { id },
      });
    });
  });
});