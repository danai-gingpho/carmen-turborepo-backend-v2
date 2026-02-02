import { Test, TestingModule } from '@nestjs/testing';
import { VendorBusinessTypeService } from './vendor_business_type.service';
import { TenantService } from '@/tenant/tenant.service';

describe('VendorBusinessTypeService', () => {
  let service: VendorBusinessTypeService;

  const mockTenantService = {
    prismaTenantInstance: jest.fn(),
    getTenantInfo: jest.fn(),
    getdb_connection: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VendorBusinessTypeService,
        {
          provide: TenantService,
          useValue: mockTenantService,
        },
      ],
    }).compile();

    service = module.get<VendorBusinessTypeService>(VendorBusinessTypeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
