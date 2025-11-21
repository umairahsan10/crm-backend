import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from '../src/common/guards/roles.guard';
import { ROLES_KEY } from '../src/common/decorators/roles.decorator';
import { RoleName } from '@prisma/client';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesGuard,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
    reflector = module.get<Reflector>(Reflector);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    let mockContext: ExecutionContext;

    beforeEach(() => {
      mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({}),
        }),
        getHandler: () => ({}),
        getClass: () => ({}),
      } as ExecutionContext;
    });

    it('should allow access when no roles are required', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

      const result = guard.canActivate(mockContext);
      expect(result).toBe(true);
    });

    it('should allow access when user has required role', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([RoleName.dep_manager]);
      
      const mockRequest = {
        user: { role: RoleName.dep_manager },
      };
      
      mockContext = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
        getHandler: () => ({}),
        getClass: () => ({}),
      } as ExecutionContext;

      const result = guard.canActivate(mockContext);
      expect(result).toBe(true);
    });

    it('should allow access when user has one of multiple required roles', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([
        RoleName.dep_manager,
        RoleName.team_lead,
      ]);
      
      const mockRequest = {
        user: { role: RoleName.team_lead },
      };
      
      mockContext = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
        getHandler: () => ({}),
        getClass: () => ({}),
      } as ExecutionContext;

      const result = guard.canActivate(mockContext);
      expect(result).toBe(true);
    });

    it('should deny access when user is not authenticated', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([RoleName.dep_manager]);
      
      const mockRequest = {};
      
      mockContext = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
        getHandler: () => ({}),
        getClass: () => ({}),
      } as ExecutionContext;

      expect(() => guard.canActivate(mockContext)).toThrow(ForbiddenException);
      expect(() => guard.canActivate(mockContext)).toThrow('User not authenticated');
    });

    it('should deny access when user does not have required role', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([RoleName.dep_manager]);
      
      const mockRequest = {
        user: { role: RoleName.junior },
      };
      
      mockContext = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
        getHandler: () => ({}),
        getClass: () => ({}),
      } as ExecutionContext;

      expect(() => guard.canActivate(mockContext)).toThrow(ForbiddenException);
      expect(() => guard.canActivate(mockContext)).toThrow(
        'User does not have the required roles. Required: dep_manager. User role: junior'
      );
    });

    it('should deny access when user does not have any of multiple required roles', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([
        RoleName.dep_manager,
        RoleName.team_lead,
      ]);
      
      const mockRequest = {
        user: { role: RoleName.junior },
      };
      
      mockContext = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
        getHandler: () => ({}),
        getClass: () => ({}),
      } as ExecutionContext;

      expect(() => guard.canActivate(mockContext)).toThrow(ForbiddenException);
      expect(() => guard.canActivate(mockContext)).toThrow(
        'User does not have the required roles. Required: dep_manager, team_lead. User role: junior'
      );
    });
  });
}); 