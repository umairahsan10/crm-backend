import { Test, TestingModule } from '@nestjs/testing';
import { UnitsController } from '../../../src/modules/sales/units/units.controller';
import { UnitsService } from '../../../src/modules/sales/units/units.service';

describe('UnitsController', () => {
  let controller: UnitsController;
  let service: UnitsService;

  const mockUnitsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UnitsController],
      providers: [
        {
          provide: UnitsService,
          useValue: mockUnitsService,
        },
      ],
    }).compile();

    controller = module.get<UnitsController>(UnitsController);
    service = module.get<UnitsService>(UnitsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create sales unit record', async () => {
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

      mockUnitsService.create.mockResolvedValue(expectedResult);

      const result = await controller.create(createUnitDto);

      expect(result).toEqual(expectedResult);
      expect(service.create).toHaveBeenCalledWith(createUnitDto);
    });
  });

  describe('findAll', () => {
    it('should return all sales unit records', async () => {
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

      mockUnitsService.findAll.mockResolvedValue(expectedResult);

      const result = await controller.findAll();

      expect(result).toEqual(expectedResult);
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a single sales unit record', async () => {
      const id = '1';
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

      mockUnitsService.findOne.mockResolvedValue(expectedResult);

      const result = await controller.findOne(id);

      expect(result).toEqual(expectedResult);
      expect(service.findOne).toHaveBeenCalledWith(+id);
    });
  });

  describe('update', () => {
    it('should update a sales unit record', async () => {
      const id = '1';
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

      mockUnitsService.update.mockResolvedValue(expectedResult);

      const result = await controller.update(id, updateUnitDto);

      expect(result).toEqual(expectedResult);
      expect(service.update).toHaveBeenCalledWith(+id, updateUnitDto);
    });
  });

  describe('remove', () => {
    it('should remove a sales unit record', async () => {
      const id = '1';
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

      mockUnitsService.remove.mockResolvedValue(expectedResult);

      const result = await controller.remove(id);

      expect(result).toEqual(expectedResult);
      expect(service.remove).toHaveBeenCalledWith(+id);
    });
  });
});