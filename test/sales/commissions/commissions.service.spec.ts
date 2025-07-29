import { Test, TestingModule } from '@nestjs/testing';
import { CommissionsService } from '../../../src/modules/sales/commissions/commissions.service';
import { PrismaService } from '../../../prisma/prisma.service';

describe('CommissionsService', () => {
  let service: CommissionsService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    commission: {
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
        CommissionsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<CommissionsService>(CommissionsService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});