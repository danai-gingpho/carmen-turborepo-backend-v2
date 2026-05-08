import { Test, TestingModule } from '@nestjs/testing';
import { CurrenciesService } from './currencies.service';
import { TenantService } from '@/tenant/tenant.service';

describe('CurrenciesService', () => {
  let service: CurrenciesService;

  const mockTenantService = {
    prismaTenantInstance: jest.fn(),
    getTenantInfo: jest.fn(),
    getdb_connection: jest.fn(),
  };

  const mockPrismaSystem = {
    tb_business_unit: {
      findFirst: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CurrenciesService,
        {
          provide: TenantService,
          useValue: mockTenantService,
        },
        {
          provide: 'PRISMA_SYSTEM',
          useValue: mockPrismaSystem,
        },
      ],
    }).compile();

    service = module.get<CurrenciesService>(CurrenciesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
