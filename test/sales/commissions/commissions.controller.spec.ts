import { Test, TestingModule } from '@nestjs/testing';
import { CommissionsController } from '../../../src/modules/sales/commissions/commissions.controller';
import { CommissionsService } from '../../../src/modules/sales/commissions/commissions.service';

describe('CommissionsController', () => {
  let controller: CommissionsController;
  let service: CommissionsService;

  const mockCommissionsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CommissionsController],
      providers: [
        {
          provide: CommissionsService,
          useValue: mockCommissionsService,
        },
      ],
    }).compile();

    controller = module.get<CommissionsController>(CommissionsController);
    service = module.get<CommissionsService>(CommissionsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create commission record', async () => {
      const createCommissionDto = {
        salespersonId: 1,
        dealId: 1,
        amount: 5000,
        percentage: 0.1,
        status: 'PENDING',
        paymentDate: new Date(),
      };

      const expectedResult = {
        id: 1,
        ...createCommissionDto,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockCommissionsService.create.mockResolvedValue(expectedResult);

      const result = await controller.create(createCommissionDto);

      expect(result).toEqual(expectedResult);
      expect(service.create).toHaveBeenCalledWith(createCommissionDto);
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
          status: 'PENDING',
          paymentDate: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockCommissionsService.findAll.mockResolvedValue(expectedResult);

      const result = await controller.findAll();

      expect(result).toEqual(expectedResult);
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a single commission record', async () => {
      const id = '1';
      const expectedResult = {
        id: 1,
        salespersonId: 1,
        dealId: 1,
        amount: 5000,
        percentage: 0.1,
        status: 'PENDING',
        paymentDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockCommissionsService.findOne.mockResolvedValue(expectedResult);

      const result = await controller.findOne(id);

      expect(result).toEqual(expectedResult);
      expect(service.findOne).toHaveBeenCalledWith(+id);
    });
  });

  describe('update', () => {
    it('should update a commission record', async () => {
      const id = '1';
      const updateCommissionDto = {
        status: 'PAID',
        amount: 5500,
      };

      const expectedResult = {
        id: 1,
        salespersonId: 1,
        dealId: 1,
        amount: 5500,
        percentage: 0.1,
        status: 'PAID',
        paymentDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockCommissionsService.update.mockResolvedValue(expectedResult);

      const result = await controller.update(id, updateCommissionDto);

      expect(result).toEqual(expectedResult);
      expect(service.update).toHaveBeenCalledWith(+id, updateCommissionDto);
    });
  });

  describe('remove', () => {
    it('should remove a commission record', async () => {
      const id = '1';
      const expectedResult = {
        id: 1,
        salespersonId: 1,
        dealId: 1,
        amount: 5000,
        percentage: 0.1,
        status: 'PENDING',
        paymentDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockCommissionsService.remove.mockResolvedValue(expectedResult);

      const result = await controller.remove(id);

      expect(result).toEqual(expectedResult);
      expect(service.remove).toHaveBeenCalledWith(+id);
    });
  });
});