import { Test, TestingModule } from '@nestjs/testing';
import { CommunicationService } from '../../src/modules/communication/communication.service';
import { PrismaService } from '../../src/prisma/prisma.service';

describe('CommunicationService', () => {
  let service: CommunicationService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    communication: {
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
        CommunicationService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<CommunicationService>(CommunicationService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new communication record', async () => {
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

      mockPrismaService.communication.create.mockResolvedValue(expectedResult);

      const result = await service.create(createCommunicationDto);

      expect(result).toEqual(expectedResult);
      expect(mockPrismaService.communication.create).toHaveBeenCalledWith({
        data: createCommunicationDto,
      });
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

      mockPrismaService.communication.findMany.mockResolvedValue(expectedResult);

      const result = await service.findAll();

      expect(result).toEqual(expectedResult);
      expect(mockPrismaService.communication.findMany).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a single communication record', async () => {
      const id = 1;
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

      mockPrismaService.communication.findUnique.mockResolvedValue(expectedResult);

      const result = await service.findOne(id);

      expect(result).toEqual(expectedResult);
      expect(mockPrismaService.communication.findUnique).toHaveBeenCalledWith({
        where: { id },
      });
    });
  });

  describe('update', () => {
    it('should update a communication record', async () => {
      const id = 1;
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

      mockPrismaService.communication.update.mockResolvedValue(expectedResult);

      const result = await service.update(id, updateCommunicationDto);

      expect(result).toEqual(expectedResult);
      expect(mockPrismaService.communication.update).toHaveBeenCalledWith({
        where: { id },
        data: updateCommunicationDto,
      });
    });
  });

  describe('remove', () => {
    it('should remove a communication record', async () => {
      const id = 1;
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

      mockPrismaService.communication.delete.mockResolvedValue(expectedResult);

      const result = await service.remove(id);

      expect(result).toEqual(expectedResult);
      expect(mockPrismaService.communication.delete).toHaveBeenCalledWith({
        where: { id },
      });
    });
  });
});