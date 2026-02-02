import { Test, TestingModule } from '@nestjs/testing';
import { ExchangeRateService } from './exchange-rate.service';
import { TenantService } from '@/tenant/tenant.service';

describe('ExchangeRateService', () => {
  let service: ExchangeRateService;

  const mockTenantService = {
    prismaTenantInstance: jest.fn(),
    getTenantInfo: jest.fn(),
    getdb_connection: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExchangeRateService,
        {
          provide: TenantService,
          useValue: mockTenantService,
        },
      ],
    }).compile();

    service = module.get<ExchangeRateService>(ExchangeRateService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
