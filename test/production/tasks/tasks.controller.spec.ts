import { Test, TestingModule } from '@nestjs/testing';
import { TasksController } from '../../../src/modules/production/tasks/tasks.controller';
import { TasksService } from '../../../src/modules/production/tasks/tasks.service';

describe('TasksController', () => {
  let controller: TasksController;
  let service: TasksService;

  const mockTasksService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TasksController],
      providers: [
        {
          provide: TasksService,
          useValue: mockTasksService,
        },
      ],
    }).compile();

    controller = module.get<TasksController>(TasksController);
    service = module.get<TasksService>(TasksService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create task record', async () => {
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

      mockTasksService.create.mockResolvedValue(expectedResult);

      const result = await controller.create(createTaskDto);

      expect(result).toEqual(expectedResult);
      expect(service.create).toHaveBeenCalledWith(createTaskDto);
    });
  });

  describe('findAll', () => {
    it('should return all task records', async () => {
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

      mockTasksService.findAll.mockResolvedValue(expectedResult);

      const result = await controller.findAll();

      expect(result).toEqual(expectedResult);
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a single task record', async () => {
      const id = '1';
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

      mockTasksService.findOne.mockResolvedValue(expectedResult);

      const result = await controller.findOne(id);

      expect(result).toEqual(expectedResult);
      expect(service.findOne).toHaveBeenCalledWith(+id);
    });
  });

  describe('update', () => {
    it('should update a task record', async () => {
      const id = '1';
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

      mockTasksService.update.mockResolvedValue(expectedResult);

      const result = await controller.update(id, updateTaskDto);

      expect(result).toEqual(expectedResult);
      expect(service.update).toHaveBeenCalledWith(+id, updateTaskDto);
    });
  });

  describe('remove', () => {
    it('should remove a task record', async () => {
      const id = '1';
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

      mockTasksService.remove.mockResolvedValue(expectedResult);

      const result = await controller.remove(id);

      expect(result).toEqual(expectedResult);
      expect(service.remove).toHaveBeenCalledWith(+id);
    });
  });
});