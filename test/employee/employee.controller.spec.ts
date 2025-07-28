import { Test, TestingModule } from '@nestjs/testing';
import { EmployeeController } from '../../src/modules/employee/employee.controller';
import { EmployeeService } from '../../src/modules/employee/employee.service';

describe('EmployeeController', () => {
  let controller: EmployeeController;
  let service: EmployeeService;

  const mockEmployeeService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EmployeeController],
      providers: [
        {
          provide: EmployeeService,
          useValue: mockEmployeeService,
        },
      ],
    }).compile();

    controller = module.get<EmployeeController>(EmployeeController);
    service = module.get<EmployeeService>(EmployeeService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create employee record', async () => {
      const createEmployeeDto = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@company.com',
        phone: '+1234567890',
        position: 'Software Engineer',
        department: 'Engineering',
        hireDate: new Date(),
        salary: 75000,
        managerId: 1,
      };

      const expectedResult = {
        id: 1,
        ...createEmployeeDto,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockEmployeeService.create.mockResolvedValue(expectedResult);

      const result = await controller.create(createEmployeeDto);

      expect(result).toEqual(expectedResult);
      expect(service.create).toHaveBeenCalledWith(createEmployeeDto);
    });
  });

  describe('findAll', () => {
    it('should return all employee records', async () => {
      const expectedResult = [
        {
          id: 1,
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@company.com',
          phone: '+1234567890',
          position: 'Software Engineer',
          department: 'Engineering',
          hireDate: new Date(),
          salary: 75000,
          managerId: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockEmployeeService.findAll.mockResolvedValue(expectedResult);

      const result = await controller.findAll();

      expect(result).toEqual(expectedResult);
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a single employee record', async () => {
      const id = '1';
      const expectedResult = {
        id: 1,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@company.com',
        phone: '+1234567890',
        position: 'Software Engineer',
        department: 'Engineering',
        hireDate: new Date(),
        salary: 75000,
        managerId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockEmployeeService.findOne.mockResolvedValue(expectedResult);

      const result = await controller.findOne(id);

      expect(result).toEqual(expectedResult);
      expect(service.findOne).toHaveBeenCalledWith(+id);
    });
  });

  describe('update', () => {
    it('should update an employee record', async () => {
      const id = '1';
      const updateEmployeeDto = {
        salary: 80000,
        position: 'Senior Software Engineer',
      };

      const expectedResult = {
        id: 1,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@company.com',
        phone: '+1234567890',
        position: 'Senior Software Engineer',
        department: 'Engineering',
        hireDate: new Date(),
        salary: 80000,
        managerId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockEmployeeService.update.mockResolvedValue(expectedResult);

      const result = await controller.update(id, updateEmployeeDto);

      expect(result).toEqual(expectedResult);
      expect(service.update).toHaveBeenCalledWith(+id, updateEmployeeDto);
    });
  });

  describe('remove', () => {
    it('should remove an employee record', async () => {
      const id = '1';
      const expectedResult = {
        id: 1,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@company.com',
        phone: '+1234567890',
        position: 'Software Engineer',
        department: 'Engineering',
        hireDate: new Date(),
        salary: 75000,
        managerId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockEmployeeService.remove.mockResolvedValue(expectedResult);

      const result = await controller.remove(id);

      expect(result).toEqual(expectedResult);
      expect(service.remove).toHaveBeenCalledWith(+id);
    });
  });
});