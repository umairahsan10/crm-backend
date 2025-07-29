import { Test, TestingModule } from '@nestjs/testing';
import { TasksService } from '../../../src/modules/production/tasks/tasks.service';
import { PrismaService } from '../../../src/prisma/prisma.service';

describe('TasksService', () => {
  let service: TasksService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    task: {
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
        TasksService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new task', async () => {
      const createTaskDto = {
        title: 'Implement User Authentication',
        description: 'Create login and registration functionality',
        status: 'PENDING',
        priority: 'HIGH',
        assigneeId: 1,
        projectId: 1,
        estimatedHours: 16,
        dueDate: new Date(),
      };

      const expectedResult = {
        id: 1,
        ...createTaskDto,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.task.create.mockResolvedValue(expectedResult);

      const result = await service.create(createTaskDto);

      expect(result).toEqual(expectedResult);
      expect(mockPrismaService.task.create).toHaveBeenCalledWith({
        data: createTaskDto,
      });
    });
  });

  describe('findAll', () => {
    it('should return all tasks', async () => {
      const expectedResult = [
        {
          id: 1,
          title: 'Implement User Authentication',
          description: 'Create login and registration functionality',
          status: 'PENDING',
          priority: 'HIGH',
          assigneeId: 1,
          projectId: 1,
          estimatedHours: 16,
          dueDate: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrismaService.task.findMany.mockResolvedValue(expectedResult);

      const result = await service.findAll();

      expect(result).toEqual(expectedResult);
      expect(mockPrismaService.task.findMany).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a single task', async () => {
      const id = 1;
      const expectedResult = {
        id: 1,
        title: 'Implement User Authentication',
        description: 'Create login and registration functionality',
        status: 'PENDING',
        priority: 'HIGH',
        assigneeId: 1,
        projectId: 1,
        estimatedHours: 16,
        dueDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.task.findUnique.mockResolvedValue(expectedResult);

      const result = await service.findOne(id);

      expect(result).toEqual(expectedResult);
      expect(mockPrismaService.task.findUnique).toHaveBeenCalledWith({
        where: { id },
      });
    });
  });

  describe('update', () => {
    it('should update a task', async () => {
      const id = 1;
      const updateTaskDto = {
        status: 'IN_PROGRESS',
        estimatedHours: 20,
      };

      const expectedResult = {
        id: 1,
        title: 'Implement User Authentication',
        description: 'Create login and registration functionality',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        assigneeId: 1,
        projectId: 1,
        estimatedHours: 20,
        dueDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.task.update.mockResolvedValue(expectedResult);

      const result = await service.update(id, updateTaskDto);

      expect(result).toEqual(expectedResult);
      expect(mockPrismaService.task.update).toHaveBeenCalledWith({
        where: { id },
        data: updateTaskDto,
      });
    });
  });

  describe('remove', () => {
    it('should remove a task', async () => {
      const id = 1;
      const expectedResult = {
        id: 1,
        title: 'Implement User Authentication',
        description: 'Create login and registration functionality',
        status: 'PENDING',
        priority: 'HIGH',
        assigneeId: 1,
        projectId: 1,
        estimatedHours: 16,
        dueDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.task.delete.mockResolvedValue(expectedResult);

      const result = await service.remove(id);

      expect(result).toEqual(expectedResult);
      expect(mockPrismaService.task.delete).toHaveBeenCalledWith({
        where: { id },
      });
    });
  });
});