import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { DepartmentsGuard } from '../src/common/guards/departments.guard';


describe('DepartmentsGuard', () => {
  let guard: DepartmentsGuard;
  let reflector: Reflector;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DepartmentsGuard,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<DepartmentsGuard>(DepartmentsGuard);
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

    it('should allow access when no departments are required', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
      expect(guard.canActivate(mockContext)).toBe(true);
    });

    it('should allow when user belongs to required department', () => {
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue(['hr']);

      const mockRequest = { user: { department: 'hr' } };
      mockContext = {
        switchToHttp: () => ({ getRequest: () => mockRequest }),
        getHandler: () => ({}),
        getClass: () => ({}),
      } as ExecutionContext;
      expect(guard.canActivate(mockContext)).toBe(true);
    });

    it('should deny when user is unauthenticated', () => {
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue(['hr']);
      expect(() => guard.canActivate(mockContext)).toThrow(ForbiddenException);
    });

    it('should deny when user not in required department', () => {
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue(['sales']);
      const mockRequest = { user: { department: 'hr' } };
      mockContext = {
        switchToHttp: () => ({ getRequest: () => mockRequest }),
        getHandler: () => ({}),
        getClass: () => ({}),
      } as ExecutionContext;
      expect(() => guard.canActivate(mockContext)).toThrow(ForbiddenException);
    });
  });
}); 