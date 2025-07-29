import { Test, TestingModule } from '@nestjs/testing';
import { LeadsService } from '../../../src/modules/sales/leads/leads.service';
import { PrismaService } from '../../../src/prisma/prisma.service';

describe('LeadsService', () => {
  let service: LeadsService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    lead: {
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
        LeadsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<LeadsService>(LeadsService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new lead', async () => {
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

      mockPrismaService.lead.create.mockResolvedValue(expectedResult);

      const result = await service.create(createLeadDto);

      expect(result).toEqual(expectedResult);
      expect(mockPrismaService.lead.create).toHaveBeenCalledWith({
        data: createLeadDto,
      });
    });
  });

  describe('findAll', () => {
    it('should return all leads', async () => {
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

      mockPrismaService.lead.findMany.mockResolvedValue(expectedResult);

      const result = await service.findAll();

      expect(result).toEqual(expectedResult);
      expect(mockPrismaService.lead.findMany).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a single lead', async () => {
      const id = 1;
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

      mockPrismaService.lead.findUnique.mockResolvedValue(expectedResult);

      const result = await service.findOne(id);

      expect(result).toEqual(expectedResult);
      expect(mockPrismaService.lead.findUnique).toHaveBeenCalledWith({
        where: { id },
      });
    });
  });

  describe('update', () => {
    it('should update a lead', async () => {
      const id = 1;
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

      mockPrismaService.lead.update.mockResolvedValue(expectedResult);

      const result = await service.update(id, updateLeadDto);

      expect(result).toEqual(expectedResult);
      expect(mockPrismaService.lead.update).toHaveBeenCalledWith({
        where: { id },
        data: updateLeadDto,
      });
    });
  });

  describe('remove', () => {
    it('should remove a lead', async () => {
      const id = 1;
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

      mockPrismaService.lead.delete.mockResolvedValue(expectedResult);

      const result = await service.remove(id);

      expect(result).toEqual(expectedResult);
      expect(mockPrismaService.lead.delete).toHaveBeenCalledWith({
        where: { id },
      });
    });
  });
});