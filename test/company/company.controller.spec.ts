import { Test, TestingModule } from '@nestjs/testing';
import { CompanyController } from '../../src/modules/company/company.controller';
import { CompanyService } from '../../src/modules/company/company.service';

describe('CompanyController', () => {
  let controller: CompanyController;
  let service: CompanyService;

  const mockCompanyService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CompanyController],
      providers: [
        {
          provide: CompanyService,
          useValue: mockCompanyService,
        },
      ],
    }).compile();

    controller = module.get<CompanyController>(CompanyController);
    service = module.get<CompanyService>(CompanyService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create company record', async () => {
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

      mockCompanyService.create.mockResolvedValue(expectedResult);

      const result = await controller.create(createCompanyDto);

      expect(result).toEqual(expectedResult);
      expect(service.create).toHaveBeenCalledWith(createCompanyDto);
    });
  });

  describe('findAll', () => {
    it('should return all company records', async () => {
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

      mockCompanyService.findAll.mockResolvedValue(expectedResult);

      const result = await controller.findAll();

      expect(result).toEqual(expectedResult);
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a single company record', async () => {
      const id = '1';
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

      mockCompanyService.findOne.mockResolvedValue(expectedResult);

      const result = await controller.findOne(id);

      expect(result).toEqual(expectedResult);
      expect(service.findOne).toHaveBeenCalledWith(+id);
    });
  });

  describe('update', () => {
    it('should update a company record', async () => {
      const id = '1';
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

      mockCompanyService.update.mockResolvedValue(expectedResult);

      const result = await controller.update(id, updateCompanyDto);

      expect(result).toEqual(expectedResult);
      expect(service.update).toHaveBeenCalledWith(+id, updateCompanyDto);
    });
  });

  describe('remove', () => {
    it('should remove a company record', async () => {
      const id = '1';
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

      mockCompanyService.remove.mockResolvedValue(expectedResult);

      const result = await controller.remove(id);

      expect(result).toEqual(expectedResult);
      expect(service.remove).toHaveBeenCalledWith(+id);
    });
  });
});