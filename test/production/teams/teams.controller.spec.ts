import { Test, TestingModule } from '@nestjs/testing';
import { TeamsController } from '../../../src/modules/production/teams/teams.controller';
import { TeamsService } from '../../../src/modules/production/teams/teams.service';

describe('TeamsController', () => {
  let controller: TeamsController;
  let service: TeamsService;

  const mockTeamsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TeamsController],
      providers: [
        {
          provide: TeamsService,
          useValue: mockTeamsService,
        },
      ],
    }).compile();

    controller = module.get<TeamsController>(TeamsController);
    service = module.get<TeamsService>(TeamsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create team record', async () => {
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

      mockTeamsService.create.mockResolvedValue(expectedResult);

      const result = await controller.create(createTeamDto);

      expect(result).toEqual(expectedResult);
      expect(service.create).toHaveBeenCalledWith(createTeamDto);
    });
  });

  describe('findAll', () => {
    it('should return all team records', async () => {
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

      mockTeamsService.findAll.mockResolvedValue(expectedResult);

      const result = await controller.findAll();

      expect(result).toEqual(expectedResult);
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a single team record', async () => {
      const id = '1';
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

      mockTeamsService.findOne.mockResolvedValue(expectedResult);

      const result = await controller.findOne(id);

      expect(result).toEqual(expectedResult);
      expect(service.findOne).toHaveBeenCalledWith(+id);
    });
  });

  describe('update', () => {
    it('should update a team record', async () => {
      const id = '1';
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

      mockTeamsService.update.mockResolvedValue(expectedResult);

      const result = await controller.update(id, updateTeamDto);

      expect(result).toEqual(expectedResult);
      expect(service.update).toHaveBeenCalledWith(+id, updateTeamDto);
    });
  });

  describe('remove', () => {
    it('should remove a team record', async () => {
      const id = '1';
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

      mockTeamsService.remove.mockResolvedValue(expectedResult);

      const result = await controller.remove(id);

      expect(result).toEqual(expectedResult);
      expect(service.remove).toHaveBeenCalledWith(+id);
    });
  });
});