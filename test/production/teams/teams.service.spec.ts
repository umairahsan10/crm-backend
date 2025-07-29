import { Test, TestingModule } from '@nestjs/testing';
import { TeamsService } from '../../../src/modules/production/teams/teams.service';
import { PrismaService } from '../../../src/prisma/prisma.service';

describe('TeamsService', () => {
  let service: TeamsService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    team: {
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
        TeamsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<TeamsService>(TeamsService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new team', async () => {
      const createTeamDto = {
        name: 'Development Team A',
        description: 'Frontend and backend development team',
        unitId: 1,
        leaderId: 1,
        maxMembers: 8,
        specialization: 'FULL_STACK',
      };

      const expectedResult = {
        id: 1,
        ...createTeamDto,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.team.create.mockResolvedValue(expectedResult);

      const result = await service.create(createTeamDto);

      expect(result).toEqual(expectedResult);
      expect(mockPrismaService.team.create).toHaveBeenCalledWith({
        data: createTeamDto,
      });
    });
  });

  describe('findAll', () => {
    it('should return all teams', async () => {
      const expectedResult = [
        {
          id: 1,
          name: 'Development Team A',
          description: 'Frontend and backend development team',
          unitId: 1,
          leaderId: 1,
          maxMembers: 8,
          specialization: 'FULL_STACK',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrismaService.team.findMany.mockResolvedValue(expectedResult);

      const result = await service.findAll();

      expect(result).toEqual(expectedResult);
      expect(mockPrismaService.team.findMany).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a single team', async () => {
      const id = 1;
      const expectedResult = {
        id: 1,
        name: 'Development Team A',
        description: 'Frontend and backend development team',
        unitId: 1,
        leaderId: 1,
        maxMembers: 8,
        specialization: 'FULL_STACK',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.team.findUnique.mockResolvedValue(expectedResult);

      const result = await service.findOne(id);

      expect(result).toEqual(expectedResult);
      expect(mockPrismaService.team.findUnique).toHaveBeenCalledWith({
        where: { id },
      });
    });
  });

  describe('update', () => {
    it('should update a team', async () => {
      const id = 1;
      const updateTeamDto = {
        maxMembers: 10,
        description: 'Updated team description',
      };

      const expectedResult = {
        id: 1,
        name: 'Development Team A',
        description: 'Updated team description',
        unitId: 1,
        leaderId: 1,
        maxMembers: 10,
        specialization: 'FULL_STACK',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.team.update.mockResolvedValue(expectedResult);

      const result = await service.update(id, updateTeamDto);

      expect(result).toEqual(expectedResult);
      expect(mockPrismaService.team.update).toHaveBeenCalledWith({
        where: { id },
        data: updateTeamDto,
      });
    });
  });

  describe('remove', () => {
    it('should remove a team', async () => {
      const id = 1;
      const expectedResult = {
        id: 1,
        name: 'Development Team A',
        description: 'Frontend and backend development team',
        unitId: 1,
        leaderId: 1,
        maxMembers: 8,
        specialization: 'FULL_STACK',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.team.delete.mockResolvedValue(expectedResult);

      const result = await service.remove(id);

      expect(result).toEqual(expectedResult);
      expect(mockPrismaService.team.delete).toHaveBeenCalledWith({
        where: { id },
      });
    });
  });
});