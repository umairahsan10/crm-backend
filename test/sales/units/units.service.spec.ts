import { Test, TestingModule } from '@nestjs/testing';
import { UnitsService } from '../../../src/modules/sales/units/units.service';
import { PrismaService } from '../../../src/prisma/prisma.service';

describe('UnitsService', () => {
  let service: UnitsService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    salesUnit: {
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
        UnitsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<UnitsService>(UnitsService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new sales unit', async () => {
      const createUnitDto = {
        name: 'Enterprise Sales Unit',
        description: 'Handles enterprise-level sales',
        headId: 1,
        target: 1000000,
        region: 'NORTH_AMERICA',
      };

      const expectedResult = {
        id: 1,
        ...createUnitDto,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.salesUnit.create.mockResolvedValue(expectedResult);

      const result = await service.create(createUnitDto);

      expect(result).toEqual(expectedResult);
      expect(mockPrismaService.salesUnit.create).toHaveBeenCalledWith({
        data: createUnitDto,
      });
    });
  });

  describe('findAll', () => {
    it('should return all sales units', async () => {
      const expectedResult = [
        {
          id: 1,
          name: 'Enterprise Sales Unit',
          description: 'Handles enterprise-level sales',
          headId: 1,
          target: 1000000,
          region: 'NORTH_AMERICA',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrismaService.salesUnit.findMany.mockResolvedValue(expectedResult);

      const result = await service.findAll();

      expect(result).toEqual(expectedResult);
      expect(mockPrismaService.salesUnit.findMany).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a single sales unit', async () => {
      const id = 1;
      const expectedResult = {
        id: 1,
        name: 'Enterprise Sales Unit',
        description: 'Handles enterprise-level sales',
        headId: 1,
        target: 1000000,
        region: 'NORTH_AMERICA',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.salesUnit.findUnique.mockResolvedValue(expectedResult);

      const result = await service.findOne(id);

      expect(result).toEqual(expectedResult);
      expect(mockPrismaService.salesUnit.findUnique).toHaveBeenCalledWith({
        where: { id },
      });
    });
  });

  describe('update', () => {
    it('should update a sales unit', async () => {
      const id = 1;
      const updateUnitDto = {
        target: 1200000,
        description: 'Updated enterprise sales unit',
      };

      const expectedResult = {
        id: 1,
        name: 'Enterprise Sales Unit',
        description: 'Updated enterprise sales unit',
        headId: 1,
        target: 1200000,
        region: 'NORTH_AMERICA',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.salesUnit.update.mockResolvedValue(expectedResult);

      const result = await service.update(id, updateUnitDto);

      expect(result).toEqual(expectedResult);
      expect(mockPrismaService.salesUnit.update).toHaveBeenCalledWith({
        where: { id },
        data: updateUnitDto,
      });
    });
  });

  describe('remove', () => {
    it('should remove a sales unit', async () => {
      const id = 1;
      const expectedResult = {
        id: 1,
        name: 'Enterprise Sales Unit',
        description: 'Handles enterprise-level sales',
        headId: 1,
        target: 1000000,
        region: 'NORTH_AMERICA',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.salesUnit.delete.mockResolvedValue(expectedResult);

      const result = await service.remove(id);

      expect(result).toEqual(expectedResult);
      expect(mockPrismaService.salesUnit.delete).toHaveBeenCalledWith({
        where: { id },
      });
    });
  });
});