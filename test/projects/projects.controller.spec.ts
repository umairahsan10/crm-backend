import { Test, TestingModule } from '@nestjs/testing';
import { ProjectsController } from '../../src/modules/projects/projects.controller';
import { ProjectsService } from '../../src/modules/projects/projects.service';

describe('ProjectsController', () => {
  let controller: ProjectsController;
  let service: ProjectsService;

  const mockProjectsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProjectsController],
      providers: [
        {
          provide: ProjectsService,
          useValue: mockProjectsService,
        },
      ],
    }).compile();

    controller = module.get<ProjectsController>(ProjectsController);
    service = module.get<ProjectsService>(ProjectsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create project record', async () => {
      const createProjectDto = {
        name: 'E-commerce Platform',
        description: 'Building a modern e-commerce platform',
        status: 'IN_PROGRESS',
        startDate: new Date(),
        endDate: new Date(),
        budget: 50000,
        managerId: 1,
        clientId: 1,
      };

      const expectedResult = {
        id: 1,
        ...createProjectDto,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockProjectsService.create.mockResolvedValue(expectedResult);

      const result = await controller.create(createProjectDto);

      expect(result).toEqual(expectedResult);
      expect(service.create).toHaveBeenCalledWith(createProjectDto);
    });
  });

  describe('findAll', () => {
    it('should return all project records', async () => {
      const expectedResult = [
        {
          id: 1,
          name: 'E-commerce Platform',
          description: 'Building a modern e-commerce platform',
          status: 'IN_PROGRESS',
          startDate: new Date(),
          endDate: new Date(),
          budget: 50000,
          managerId: 1,
          clientId: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockProjectsService.findAll.mockResolvedValue(expectedResult);

      const result = await controller.findAll();

      expect(result).toEqual(expectedResult);
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a single project record', async () => {
      const id = '1';
      const expectedResult = {
        id: 1,
        name: 'E-commerce Platform',
        description: 'Building a modern e-commerce platform',
        status: 'IN_PROGRESS',
        startDate: new Date(),
        endDate: new Date(),
        budget: 50000,
        managerId: 1,
        clientId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockProjectsService.findOne.mockResolvedValue(expectedResult);

      const result = await controller.findOne(id);

      expect(result).toEqual(expectedResult);
      expect(service.findOne).toHaveBeenCalledWith(+id);
    });
  });

  describe('update', () => {
    it('should update a project record', async () => {
      const id = '1';
      const updateProjectDto = {
        status: 'COMPLETED',
        budget: 55000,
      };

      const expectedResult = {
        id: 1,
        name: 'E-commerce Platform',
        description: 'Building a modern e-commerce platform',
        status: 'COMPLETED',
        startDate: new Date(),
        endDate: new Date(),
        budget: 55000,
        managerId: 1,
        clientId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockProjectsService.update.mockResolvedValue(expectedResult);

      const result = await controller.update(id, updateProjectDto);

      expect(result).toEqual(expectedResult);
      expect(service.update).toHaveBeenCalledWith(+id, updateProjectDto);
    });
  });

  describe('remove', () => {
    it('should remove a project record', async () => {
      const id = '1';
      const expectedResult = {
        id: 1,
        name: 'E-commerce Platform',
        description: 'Building a modern e-commerce platform',
        status: 'IN_PROGRESS',
        startDate: new Date(),
        endDate: new Date(),
        budget: 50000,
        managerId: 1,
        clientId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockProjectsService.remove.mockResolvedValue(expectedResult);

      const result = await controller.remove(id);

      expect(result).toEqual(expectedResult);
      expect(service.remove).toHaveBeenCalledWith(+id);
    });
  });
});