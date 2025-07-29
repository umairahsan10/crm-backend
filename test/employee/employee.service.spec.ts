import { Test, TestingModule } from '@nestjs/testing';
import { EmployeeService } from '../../src/modules/employee/employee.service';
import { PrismaService } from '../../src/prisma/prisma.service';

describe('EmployeeService', () => {
  let service: EmployeeService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    employee: {
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
        EmployeeService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<EmployeeService>(EmployeeService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new employee', async () => {
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

      mockPrismaService.employee.create.mockResolvedValue(expectedResult);

      const result = await service.create(createEmployeeDto);

      expect(result).toEqual(expectedResult);
      expect(mockPrismaService.employee.create).toHaveBeenCalledWith({
        data: createEmployeeDto,
      });
    });
  });

  describe('findAll', () => {
    it('should return all employees', async () => {
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

      mockPrismaService.employee.findMany.mockResolvedValue(expectedResult);

      const result = await service.findAll();

      expect(result).toEqual(expectedResult);
      expect(mockPrismaService.employee.findMany).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a single employee', async () => {
      const id = 1;
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

      mockPrismaService.employee.findUnique.mockResolvedValue(expectedResult);

      const result = await service.findOne(id);

      expect(result).toEqual(expectedResult);
      expect(mockPrismaService.employee.findUnique).toHaveBeenCalledWith({
        where: { id },
      });
    });
  });

  describe('update', () => {
    it('should update an employee', async () => {
      const id = 1;
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

      mockPrismaService.employee.update.mockResolvedValue(expectedResult);

      const result = await service.update(id, updateEmployeeDto);

      expect(result).toEqual(expectedResult);
      expect(mockPrismaService.employee.update).toHaveBeenCalledWith({
        where: { id },
        data: updateEmployeeDto,
      });
    });
  });

  describe('remove', () => {
    it('should remove an employee', async () => {
      const id = 1;
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

      mockPrismaService.employee.delete.mockResolvedValue(expectedResult);

      const result = await service.remove(id);

      expect(result).toEqual(expectedResult);
      expect(mockPrismaService.employee.delete).toHaveBeenCalledWith({
        where: { id },
      });
    });
  });
});