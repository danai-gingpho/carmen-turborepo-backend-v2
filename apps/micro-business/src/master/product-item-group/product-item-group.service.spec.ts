import { Test, TestingModule } from '@nestjs/testing';
import { ProductItemGroupService } from './product-item-group.service';
import { TenantService } from '@/tenant/tenant.service';

describe('ProductItemGroupService', () => {
  let service: ProductItemGroupService;

  const mockTenantService = {
    prismaTenantInstance: jest.fn(),
    getTenantInfo: jest.fn(),
    getdb_connection: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductItemGroupService,
        {
          provide: TenantService,
          useValue: mockTenantService,
        },
      ],
    }).compile();

    service = module.get<ProductItemGroupService>(ProductItemGroupService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
