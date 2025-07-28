import { Test, TestingModule } from '@nestjs/testing';
import { HrController } from '../../src/modules/hr/hr.controller';
import { HrService } from '../../src/modules/hr/hr.service';

describe('HrController', () => {
  let controller: HrController;
  let service: HrService;

  const mockHrService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HrController],
      providers: [
        {
          provide: HrService,
          useValue: mockHrService,
        },
      ],
    }).compile();

    controller = module.get<HrController>(HrController);
    service = module.get<HrService>(HrService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create hr record', async () => {
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

      mockHrService.create.mockResolvedValue(expectedResult);

      const result = await controller.create(createHrDto);

      expect(result).toEqual(expectedResult);
      expect(service.create).toHaveBeenCalledWith(createHrDto);
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

      mockHrService.findAll.mockResolvedValue(expectedResult);

      const result = await controller.findAll();

      expect(result).toEqual(expectedResult);
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a single hr record', async () => {
      const id = '1';
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

      mockHrService.findOne.mockResolvedValue(expectedResult);

      const result = await controller.findOne(id);

      expect(result).toEqual(expectedResult);
      expect(service.findOne).toHaveBeenCalledWith(+id);
    });
  });

  describe('update', () => {
    it('should update an hr record', async () => {
      const id = '1';
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

      mockHrService.update.mockResolvedValue(expectedResult);

      const result = await controller.update(id, updateHrDto);

      expect(result).toEqual(expectedResult);
      expect(service.update).toHaveBeenCalledWith(+id, updateHrDto);
    });
  });

  describe('remove', () => {
    it('should remove an hr record', async () => {
      const id = '1';
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

      mockHrService.remove.mockResolvedValue(expectedResult);

      const result = await controller.remove(id);

      expect(result).toEqual(expectedResult);
      expect(service.remove).toHaveBeenCalledWith(+id);
    });
  });
});