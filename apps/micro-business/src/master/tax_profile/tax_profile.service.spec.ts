import { Test, TestingModule } from '@nestjs/testing';
import { TaxProfileService } from './tax_profile.service';
import { TenantService } from '@/tenant/tenant.service';

describe('TaxProfileService', () => {
  let service: TaxProfileService;

  const mockTenantService = {
    prismaTenantInstance: jest.fn(),
    getTenantInfo: jest.fn(),
    getdb_connection: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaxProfileService,
        {
          provide: TenantService,
          useValue: mockTenantService,
        },
      ],
    }).compile();

    service = module.get<TaxProfileService>(TaxProfileService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
