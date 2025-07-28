import { Test, TestingModule } from '@nestjs/testing';
import { CommunicationController } from '../../src/modules/communication/communication.controller';
import { CommunicationService } from '../../src/modules/communication/communication.service';

describe('CommunicationController', () => {
  let controller: CommunicationController;
  let service: CommunicationService;

  const mockCommunicationService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CommunicationController],
      providers: [
        {
          provide: CommunicationService,
          useValue: mockCommunicationService,
        },
      ],
    }).compile();

    controller = module.get<CommunicationController>(CommunicationController);
    service = module.get<CommunicationService>(CommunicationService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create communication record', async () => {
      const createCommunicationDto = {
        type: 'EMAIL',
        subject: 'Test Subject',
        content: 'Test content',
        senderId: 1,
        recipientId: 2,
      };

      const expectedResult = {
        id: 1,
        ...createCommunicationDto,
        status: 'SENT',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockCommunicationService.create.mockResolvedValue(expectedResult);

      const result = await controller.create(createCommunicationDto);

      expect(result).toEqual(expectedResult);
      expect(service.create).toHaveBeenCalledWith(createCommunicationDto);
    });
  });

  describe('findAll', () => {
    it('should return all communication records', async () => {
      const expectedResult = [
        {
          id: 1,
          type: 'EMAIL',
          subject: 'Test Subject',
          content: 'Test content',
          senderId: 1,
          recipientId: 2,
          status: 'SENT',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockCommunicationService.findAll.mockResolvedValue(expectedResult);

      const result = await controller.findAll();

      expect(result).toEqual(expectedResult);
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a single communication record', async () => {
      const id = '1';
      const expectedResult = {
        id: 1,
        type: 'EMAIL',
        subject: 'Test Subject',
        content: 'Test content',
        senderId: 1,
        recipientId: 2,
        status: 'SENT',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockCommunicationService.findOne.mockResolvedValue(expectedResult);

      const result = await controller.findOne(id);

      expect(result).toEqual(expectedResult);
      expect(service.findOne).toHaveBeenCalledWith(+id);
    });
  });

  describe('update', () => {
    it('should update a communication record', async () => {
      const id = '1';
      const updateCommunicationDto = {
        status: 'READ',
      };

      const expectedResult = {
        id: 1,
        type: 'EMAIL',
        subject: 'Test Subject',
        content: 'Test content',
        senderId: 1,
        recipientId: 2,
        status: 'READ',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockCommunicationService.update.mockResolvedValue(expectedResult);

      const result = await controller.update(id, updateCommunicationDto);

      expect(result).toEqual(expectedResult);
      expect(service.update).toHaveBeenCalledWith(+id, updateCommunicationDto);
    });
  });

  describe('remove', () => {
    it('should remove a communication record', async () => {
      const id = '1';
      const expectedResult = {
        id: 1,
        type: 'EMAIL',
        subject: 'Test Subject',
        content: 'Test content',
        senderId: 1,
        recipientId: 2,
        status: 'SENT',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockCommunicationService.remove.mockResolvedValue(expectedResult);

      const result = await controller.remove(id);

      expect(result).toEqual(expectedResult);
      expect(service.remove).toHaveBeenCalledWith(+id);
    });
  });
});