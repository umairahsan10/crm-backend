import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsService } from '../../../src/modules/production/analytics/analytics.service';
import { PrismaService } from '../../../src/prisma/prisma.service';

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    project: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    task: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    team: {
      findUnique: jest.fn(),
    },
    productionUnit: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getProductionMetrics', () => {
    it('should return production metrics', async () => {
      const mockProjects = [
        { id: 1, status: 'COMPLETED' },
        { id: 2, status: 'COMPLETED' },
        { id: 3, status: 'IN_PROGRESS' },
        { id: 4, status: 'DELAYED' },
      ];

      mockPrismaService.project.findMany.mockResolvedValue(mockProjects);
      mockPrismaService.project.count.mockResolvedValue(4);

      const result = await service.getProductionMetrics();

      expect(result).toBeDefined();
      expect(mockPrismaService.project.findMany).toHaveBeenCalled();
      expect(mockPrismaService.project.count).toHaveBeenCalled();
    });
  });

  describe('getTeamPerformance', () => {
    it('should return team performance data', async () => {
      const teamId = 1;
      const mockTeam = {
        id: 1,
        name: 'Development Team A',
        members: [
          { id: 1, name: 'John Doe' },
          { id: 2, name: 'Jane Smith' },
        ],
      };

      const mockTasks = [
        { id: 1, status: 'COMPLETED', assigneeId: 1 },
        { id: 2, status: 'COMPLETED', assigneeId: 2 },
        { id: 3, status: 'IN_PROGRESS', assigneeId: 1 },
      ];

      mockPrismaService.team.findUnique.mockResolvedValue(mockTeam);
      mockPrismaService.task.findMany.mockResolvedValue(mockTasks);
      mockPrismaService.task.count.mockResolvedValue(3);

      const result = await service.getTeamPerformance(teamId);

      expect(result).toBeDefined();
      expect(mockPrismaService.team.findUnique).toHaveBeenCalledWith({
        where: { id: teamId },
        include: { members: true },
      });
      expect(mockPrismaService.task.findMany).toHaveBeenCalled();
    });
  });

  describe('getProjectAnalytics', () => {
    it('should return project analytics', async () => {
      const projectId = 1;
      const mockProject = {
        id: 1,
        name: 'E-commerce Platform',
        status: 'IN_PROGRESS',
        budget: 50000,
        spentBudget: 32500,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-02-15'),
      };

      const mockTasks = [
        { id: 1, status: 'COMPLETED' },
        { id: 2, status: 'COMPLETED' },
        { id: 3, status: 'IN_PROGRESS' },
        { id: 4, status: 'PENDING' },
      ];

      mockPrismaService.project.findUnique.mockResolvedValue(mockProject);
      mockPrismaService.task.findMany.mockResolvedValue(mockTasks);
      mockPrismaService.task.count.mockResolvedValue(4);

      const result = await service.getProjectAnalytics(projectId);

      expect(result).toBeDefined();
      expect(mockPrismaService.project.findUnique).toHaveBeenCalledWith({
        where: { id: projectId },
      });
      expect(mockPrismaService.task.findMany).toHaveBeenCalled();
    });
  });

  describe('getEfficiencyReport', () => {
    it('should return efficiency report', async () => {
      const dateRange = {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      };

      const mockProjects = [
        { id: 1, status: 'COMPLETED', efficiency: 0.95 },
        { id: 2, status: 'COMPLETED', efficiency: 0.87 },
        { id: 3, status: 'IN_PROGRESS', efficiency: 0.78 },
      ];

      const mockTeams = [
        { id: 1, name: 'Development', efficiency: 0.92 },
        { id: 2, name: 'Design', efficiency: 0.85 },
        { id: 3, name: 'Testing', efficiency: 0.78 },
      ];

      mockPrismaService.project.findMany.mockResolvedValue(mockProjects);
      mockPrismaService.team.findMany.mockResolvedValue(mockTeams);

      const result = await service.getEfficiencyReport(dateRange);

      expect(result).toBeDefined();
      expect(mockPrismaService.project.findMany).toHaveBeenCalled();
      expect(mockPrismaService.team.findMany).toHaveBeenCalled();
    });
  });
});