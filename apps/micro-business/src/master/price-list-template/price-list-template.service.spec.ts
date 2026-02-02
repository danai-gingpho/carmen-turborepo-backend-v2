import { Test, TestingModule } from '@nestjs/testing';
import { PriceListTemplateService } from './price-list-template.service';
import { TenantService } from '@/tenant/tenant.service';

describe('PriceListTemplateService', () => {
  let service: PriceListTemplateService;

  const mockTenantService = {
    prismaTenantInstance: jest.fn(),
    getTenantInfo: jest.fn(),
    getdb_connection: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PriceListTemplateService,
        {
          provide: TenantService,
          useValue: mockTenantService,
        },
      ],
    }).compile();

    service = module.get<PriceListTemplateService>(PriceListTemplateService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
