import { Test, TestingModule } from '@nestjs/testing';
import { ProjectsService } from '../../src/modules/projects/projects.service';
import { PrismaService } from '../../src/prisma/prisma.service';

describe('ProjectsService', () => {
  let service: ProjectsService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    project: {
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
        ProjectsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ProjectsService>(ProjectsService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new project', async () => {
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

      mockPrismaService.project.create.mockResolvedValue(expectedResult);

      const result = await service.create(createProjectDto);

      expect(result).toEqual(expectedResult);
      expect(mockPrismaService.project.create).toHaveBeenCalledWith({
        data: createProjectDto,
      });
    });
  });

  describe('findAll', () => {
    it('should return all projects', async () => {
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

      mockPrismaService.project.findMany.mockResolvedValue(expectedResult);

      const result = await service.findAll();

      expect(result).toEqual(expectedResult);
      expect(mockPrismaService.project.findMany).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a single project', async () => {
      const id = 1;
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

      mockPrismaService.project.findUnique.mockResolvedValue(expectedResult);

      const result = await service.findOne(id);

      expect(result).toEqual(expectedResult);
      expect(mockPrismaService.project.findUnique).toHaveBeenCalledWith({
        where: { id },
      });
    });
  });

  describe('update', () => {
    it('should update a project', async () => {
      const id = 1;
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

      mockPrismaService.project.update.mockResolvedValue(expectedResult);

      const result = await service.update(id, updateProjectDto);

      expect(result).toEqual(expectedResult);
      expect(mockPrismaService.project.update).toHaveBeenCalledWith({
        where: { id },
        data: updateProjectDto,
      });
    });
  });

  describe('remove', () => {
    it('should remove a project', async () => {
      const id = 1;
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

      mockPrismaService.project.delete.mockResolvedValue(expectedResult);

      const result = await service.remove(id);

      expect(result).toEqual(expectedResult);
      expect(mockPrismaService.project.delete).toHaveBeenCalledWith({
        where: { id },
      });
    });
  });
});