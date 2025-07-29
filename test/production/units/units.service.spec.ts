import { Test, TestingModule } from '@nestjs/testing';
import { UnitsService } from '../../../src/modules/production/units/units.service';
import { PrismaService } from '../../../src/prisma/prisma.service';
import { CreateUnitDto } from '../../../src/modules/production/units/dto/create-unit.dto';
import { UpdateUnitDto } from '../../../src/modules/production/units/dto/update-unit.dto';

describe('UnitsService', () => {
  let service: UnitsService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    productionUnit: {
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
    it('should create a new production unit', async () => {
      const createUnitDto: CreateUnitDto = {
        name: 'Test Unit',
        headId: 1,
      };

      const expectedResult = {
        id: 1,
        name: 'Test Unit',
        headId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        head: { id: 1, firstName: 'John', lastName: 'Doe' },
        productionEmployees: [],
        teams: [],
      };

      mockPrismaService.productionUnit.create.mockResolvedValue(expectedResult);

      const result = await service.create(createUnitDto);

      expect(result).toEqual(expectedResult);
      expect(mockPrismaService.productionUnit.create).toHaveBeenCalledWith({
        data: createUnitDto,
        include: {
          head: true,
          productionEmployees: true,
          teams: true,
        },
      });
    });
  });

  describe('findAll', () => {
    it('should return all production units', async () => {
      const expectedResult = [
        {
          id: 1,
          name: 'Unit 1',
          headId: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
          head: { id: 1, firstName: 'John', lastName: 'Doe' },
          productionEmployees: [],
          teams: [],
        },
      ];

      mockPrismaService.productionUnit.findMany.mockResolvedValue(expectedResult);

      const result = await service.findAll();

      expect(result).toEqual(expectedResult);
      expect(mockPrismaService.productionUnit.findMany).toHaveBeenCalledWith({
        include: {
          head: true,
          productionEmployees: true,
          teams: true,
        },
      });
    });
  });

  describe('findOne', () => {
    it('should return a single production unit', async () => {
      const id = 1;
      const expectedResult = {
        id: 1,
        name: 'Test Unit',
        headId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        head: { id: 1, firstName: 'John', lastName: 'Doe' },
        productionEmployees: [],
        teams: [],
      };

      mockPrismaService.productionUnit.findUnique.mockResolvedValue(expectedResult);

      const result = await service.findOne(id);

      expect(result).toEqual(expectedResult);
      expect(mockPrismaService.productionUnit.findUnique).toHaveBeenCalledWith({
        where: { id },
        include: {
          head: true,
          productionEmployees: true,
          teams: true,
        },
      });
    });
  });

  describe('update', () => {
    it('should update a production unit', async () => {
      const id = 1;
      const updateUnitDto: UpdateUnitDto = {
        name: 'Updated Unit',
      };

      const expectedResult = {
        id: 1,
        name: 'Updated Unit',
        headId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        head: { id: 1, firstName: 'John', lastName: 'Doe' },
        productionEmployees: [],
        teams: [],
      };

      mockPrismaService.productionUnit.update.mockResolvedValue(expectedResult);

      const result = await service.update(id, updateUnitDto);

      expect(result).toEqual(expectedResult);
      expect(mockPrismaService.productionUnit.update).toHaveBeenCalledWith({
        where: { id },
        data: updateUnitDto,
        include: {
          head: true,
          productionEmployees: true,
          teams: true,
        },
      });
    });
  });

  describe('remove', () => {
    it('should delete a production unit', async () => {
      const id = 1;
      const expectedResult = {
        id: 1,
        name: 'Test Unit',
        headId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.productionUnit.delete.mockResolvedValue(expectedResult);

      const result = await service.remove(id);

      expect(result).toEqual(expectedResult);
      expect(mockPrismaService.productionUnit.delete).toHaveBeenCalledWith({
        where: { id },
      });
    });
  });
});