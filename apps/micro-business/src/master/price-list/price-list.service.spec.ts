import { Test, TestingModule } from '@nestjs/testing';
import { PriceListService } from './price-list.service';
import { TenantService } from '@/tenant/tenant.service';
import { CommonLogic } from '@/common/common.logic';

describe('PriceListService', () => {
  let service: PriceListService;

  const mockTenantService = {
    prismaTenantInstance: jest.fn(),
    getTenantInfo: jest.fn(),
    getdb_connection: jest.fn(),
  };

  const mockCommonLogic = {
    getRunningCode: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PriceListService,
        {
          provide: TenantService,
          useValue: mockTenantService,
        },
        {
          provide: CommonLogic,
          useValue: mockCommonLogic,
        },
      ],
    }).compile();

    service = module.get<PriceListService>(PriceListService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
