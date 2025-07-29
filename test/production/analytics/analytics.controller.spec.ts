import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsController } from '../../../src/modules/production/analytics/analytics.controller';
import { AnalyticsService } from '../../../src/modules/production/analytics/analytics.service';

describe('AnalyticsController', () => {
  let controller: AnalyticsController;
  let service: AnalyticsService;

  const mockAnalyticsService = {
    getProductionMetrics: jest.fn(),
    getTeamPerformance: jest.fn(),
    getProjectAnalytics: jest.fn(),
    getEfficiencyReport: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AnalyticsController],
      providers: [
        {
          provide: AnalyticsService,
          useValue: mockAnalyticsService,
        },
      ],
    }).compile();

    controller = module.get<AnalyticsController>(AnalyticsController);
    service = module.get<AnalyticsService>(AnalyticsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getProductionMetrics', () => {
    it('should return production metrics', async () => {
      const expectedResult = {
        totalProjects: 10,
        completedProjects: 7,
        inProgressProjects: 2,
        delayedProjects: 1,
        averageCompletionTime: 45,
        efficiencyRate: 0.85,
      };

      mockAnalyticsService.getProductionMetrics.mockResolvedValue(expectedResult);

      const result = await controller.getProductionMetrics();

      expect(result).toEqual(expectedResult);
      expect(service.getProductionMetrics).toHaveBeenCalled();
    });
  });

  describe('getTeamPerformance', () => {
    it('should return team performance data', async () => {
      const teamId = '1';
      const expectedResult = {
        teamId: 1,
        teamName: 'Development Team A',
        totalTasks: 50,
        completedTasks: 45,
        averageTaskCompletionTime: 3.2,
        productivityScore: 0.9,
        teamMembers: [
          { id: 1, name: 'John Doe', tasksCompleted: 15 },
          { id: 2, name: 'Jane Smith', tasksCompleted: 12 },
        ],
      };

      mockAnalyticsService.getTeamPerformance.mockResolvedValue(expectedResult);

      const result = await controller.getTeamPerformance(teamId);

      expect(result).toEqual(expectedResult);
      expect(service.getTeamPerformance).toHaveBeenCalledWith(+teamId);
    });
  });

  describe('getProjectAnalytics', () => {
    it('should return project analytics', async () => {
      const projectId = '1';
      const expectedResult = {
        projectId: 1,
        projectName: 'E-commerce Platform',
        progress: 0.75,
        tasksCompleted: 30,
        totalTasks: 40,
        estimatedCompletion: '2024-02-15',
        budgetUtilization: 0.65,
        resourceAllocation: {
          developers: 5,
          designers: 2,
          testers: 3,
        },
      };

      mockAnalyticsService.getProjectAnalytics.mockResolvedValue(expectedResult);

      const result = await controller.getProjectAnalytics(projectId);

      expect(result).toEqual(expectedResult);
      expect(service.getProjectAnalytics).toHaveBeenCalledWith(+projectId);
    });
  });

  describe('getEfficiencyReport', () => {
    it('should return efficiency report', async () => {
      const dateRange = {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      };

      const expectedResult = {
        period: 'January 2024',
        overallEfficiency: 0.87,
        departmentEfficiency: {
          development: 0.92,
          design: 0.85,
          testing: 0.78,
        },
        topPerformers: [
          { id: 1, name: 'John Doe', efficiency: 0.95 },
          { id: 2, name: 'Jane Smith', efficiency: 0.93 },
        ],
        improvementAreas: [
          { department: 'Testing', currentEfficiency: 0.78, target: 0.85 },
        ],
      };

      mockAnalyticsService.getEfficiencyReport.mockResolvedValue(expectedResult);

      const result = await controller.getEfficiencyReport(dateRange);

      expect(result).toEqual(expectedResult);
      expect(service.getEfficiencyReport).toHaveBeenCalledWith(dateRange);
    });
  });
});