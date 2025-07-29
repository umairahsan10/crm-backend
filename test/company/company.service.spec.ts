import { Test, TestingModule } from '@nestjs/testing';
import { CompanyService } from '../../src/modules/company/company.service';
import { PrismaService } from '../../src/prisma/prisma.service';

describe('CompanyService', () => {
  let service: CompanyService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    company: {
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
        CompanyService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<CompanyService>(CompanyService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new company', async () => {
      const createCompanyDto = {
        name: 'Test Company',
        industry: 'Technology',
        size: 'MEDIUM',
        address: '123 Test Street',
        phone: '+1234567890',
        email: 'contact@testcompany.com',
      };

      const expectedResult = {
        id: 1,
        ...createCompanyDto,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.company.create.mockResolvedValue(expectedResult);

      const result = await service.create(createCompanyDto);

      expect(result).toEqual(expectedResult);
      expect(mockPrismaService.company.create).toHaveBeenCalledWith({
        data: createCompanyDto,
      });
    });
  });

  describe('findAll', () => {
    it('should return all companies', async () => {
      const expectedResult = [
        {
          id: 1,
          name: 'Test Company',
          industry: 'Technology',
          size: 'MEDIUM',
          address: '123 Test Street',
          phone: '+1234567890',
          email: 'contact@testcompany.com',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrismaService.company.findMany.mockResolvedValue(expectedResult);

      const result = await service.findAll();

      expect(result).toEqual(expectedResult);
      expect(mockPrismaService.company.findMany).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a single company', async () => {
      const id = 1;
      const expectedResult = {
        id: 1,
        name: 'Test Company',
        industry: 'Technology',
        size: 'MEDIUM',
        address: '123 Test Street',
        phone: '+1234567890',
        email: 'contact@testcompany.com',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.company.findUnique.mockResolvedValue(expectedResult);

      const result = await service.findOne(id);

      expect(result).toEqual(expectedResult);
      expect(mockPrismaService.company.findUnique).toHaveBeenCalledWith({
        where: { id },
      });
    });
  });

  describe('update', () => {
    it('should update a company', async () => {
      const id = 1;
      const updateCompanyDto = {
        name: 'Updated Company Name',
      };

      const expectedResult = {
        id: 1,
        name: 'Updated Company Name',
        industry: 'Technology',
        size: 'MEDIUM',
        address: '123 Test Street',
        phone: '+1234567890',
        email: 'contact@testcompany.com',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.company.update.mockResolvedValue(expectedResult);

      const result = await service.update(id, updateCompanyDto);

      expect(result).toEqual(expectedResult);
      expect(mockPrismaService.company.update).toHaveBeenCalledWith({
        where: { id },
        data: updateCompanyDto,
      });
    });
  });

  describe('remove', () => {
    it('should remove a company', async () => {
      const id = 1;
      const expectedResult = {
        id: 1,
        name: 'Test Company',
        industry: 'Technology',
        size: 'MEDIUM',
        address: '123 Test Street',
        phone: '+1234567890',
        email: 'contact@testcompany.com',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.company.delete.mockResolvedValue(expectedResult);

      const result = await service.remove(id);

      expect(result).toEqual(expectedResult);
      expect(mockPrismaService.company.delete).toHaveBeenCalledWith({
        where: { id },
      });
    });
  });
});