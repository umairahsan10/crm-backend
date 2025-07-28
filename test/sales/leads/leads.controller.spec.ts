import { Test, TestingModule } from '@nestjs/testing';
import { LeadsController } from '../../../src/modules/sales/leads/leads.controller';
import { LeadsService } from '../../../src/modules/sales/leads/leads.service';

describe('LeadsController', () => {
  let controller: LeadsController;
  let service: LeadsService;

  const mockLeadsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LeadsController],
      providers: [
        {
          provide: LeadsService,
          useValue: mockLeadsService,
        },
      ],
    }).compile();

    controller = module.get<LeadsController>(LeadsController);
    service = module.get<LeadsService>(LeadsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create lead record', async () => {
      const createLeadDto = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '+1234567890',
        company: 'ABC Corp',
        position: 'CTO',
        source: 'WEBSITE',
        status: 'NEW',
        notes: 'Interested in enterprise solution',
        assignedTo: 1,
      };

      const expectedResult = {
        id: 1,
        ...createLeadDto,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockLeadsService.create.mockResolvedValue(expectedResult);

      const result = await controller.create(createLeadDto);

      expect(result).toEqual(expectedResult);
      expect(service.create).toHaveBeenCalledWith(createLeadDto);
    });
  });

  describe('findAll', () => {
    it('should return all lead records', async () => {
      const expectedResult = [
        {
          id: 1,
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          phone: '+1234567890',
          company: 'ABC Corp',
          position: 'CTO',
          source: 'WEBSITE',
          status: 'NEW',
          notes: 'Interested in enterprise solution',
          assignedTo: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockLeadsService.findAll.mockResolvedValue(expectedResult);

      const result = await controller.findAll();

      expect(result).toEqual(expectedResult);
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a single lead record', async () => {
      const id = '1';
      const expectedResult = {
        id: 1,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '+1234567890',
        company: 'ABC Corp',
        position: 'CTO',
        source: 'WEBSITE',
        status: 'NEW',
        notes: 'Interested in enterprise solution',
        assignedTo: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockLeadsService.findOne.mockResolvedValue(expectedResult);

      const result = await controller.findOne(id);

      expect(result).toEqual(expectedResult);
      expect(service.findOne).toHaveBeenCalledWith(+id);
    });
  });

  describe('update', () => {
    it('should update a lead record', async () => {
      const id = '1';
      const updateLeadDto = {
        status: 'CONTACTED',
        notes: 'Initial contact made, follow up scheduled',
      };

      const expectedResult = {
        id: 1,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '+1234567890',
        company: 'ABC Corp',
        position: 'CTO',
        source: 'WEBSITE',
        status: 'CONTACTED',
        notes: 'Initial contact made, follow up scheduled',
        assignedTo: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockLeadsService.update.mockResolvedValue(expectedResult);

      const result = await controller.update(id, updateLeadDto);

      expect(result).toEqual(expectedResult);
      expect(service.update).toHaveBeenCalledWith(+id, updateLeadDto);
    });
  });

  describe('remove', () => {
    it('should remove a lead record', async () => {
      const id = '1';
      const expectedResult = {
        id: 1,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '+1234567890',
        company: 'ABC Corp',
        position: 'CTO',
        source: 'WEBSITE',
        status: 'NEW',
        notes: 'Interested in enterprise solution',
        assignedTo: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockLeadsService.remove.mockResolvedValue(expectedResult);

      const result = await controller.remove(id);

      expect(result).toEqual(expectedResult);
      expect(service.remove).toHaveBeenCalledWith(+id);
    });
  });
});