import { Test, TestingModule } from '@nestjs/testing';
import { HrService } from '../../src/modules/hr/hr.service';
import { PrismaService } from '../../src/prisma/prisma.service';

describe('HrService', () => {
  let service: HrService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    hr: {
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
        HrService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<HrService>(HrService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new hr record', async () => {
      const createHrDto = {
        type: 'RECRUITMENT',
        title: 'Software Engineer Position',
        description: 'Looking for a skilled software engineer',
        status: 'ACTIVE',
        department: 'Engineering',
        managerId: 1,
      };

      const expectedResult = {
        id: 1,
        ...createHrDto,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.hr.create.mockResolvedValue(expectedResult);

      const result = await service.create(createHrDto);

      expect(result).toEqual(expectedResult);
      expect(mockPrismaService.hr.create).toHaveBeenCalledWith({
        data: createHrDto,
      });
    });
  });

  describe('findAll', () => {
    it('should return all hr records', async () => {
      const expectedResult = [
        {
          id: 1,
          type: 'RECRUITMENT',
          title: 'Software Engineer Position',
          description: 'Looking for a skilled software engineer',
          status: 'ACTIVE',
          department: 'Engineering',
          managerId: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrismaService.hr.findMany.mockResolvedValue(expectedResult);

      const result = await service.findAll();

      expect(result).toEqual(expectedResult);
      expect(mockPrismaService.hr.findMany).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a single hr record', async () => {
      const id = 1;
      const expectedResult = {
        id: 1,
        type: 'RECRUITMENT',
        title: 'Software Engineer Position',
        description: 'Looking for a skilled software engineer',
        status: 'ACTIVE',
        department: 'Engineering',
        managerId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.hr.findUnique.mockResolvedValue(expectedResult);

      const result = await service.findOne(id);

      expect(result).toEqual(expectedResult);
      expect(mockPrismaService.hr.findUnique).toHaveBeenCalledWith({
        where: { id },
      });
    });
  });

  describe('update', () => {
    it('should update an hr record', async () => {
      const id = 1;
      const updateHrDto = {
        status: 'CLOSED',
        description: 'Position has been filled',
      };

      const expectedResult = {
        id: 1,
        type: 'RECRUITMENT',
        title: 'Software Engineer Position',
        description: 'Position has been filled',
        status: 'CLOSED',
        department: 'Engineering',
        managerId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.hr.update.mockResolvedValue(expectedResult);

      const result = await service.update(id, updateHrDto);

      expect(result).toEqual(expectedResult);
      expect(mockPrismaService.hr.update).toHaveBeenCalledWith({
        where: { id },
        data: updateHrDto,
      });
    });
  });

  describe('remove', () => {
    it('should remove an hr record', async () => {
      const id = 1;
      const expectedResult = {
        id: 1,
        type: 'RECRUITMENT',
        title: 'Software Engineer Position',
        description: 'Looking for a skilled software engineer',
        status: 'ACTIVE',
        department: 'Engineering',
        managerId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.hr.delete.mockResolvedValue(expectedResult);

      const result = await service.remove(id);

      expect(result).toEqual(expectedResult);
      expect(mockPrismaService.hr.delete).toHaveBeenCalledWith({
        where: { id },
      });
    });
  });
});