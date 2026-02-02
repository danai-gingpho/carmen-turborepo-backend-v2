import { Test, TestingModule } from '@nestjs/testing';
import { ProductSubCategoryService } from './product-sub-category.service';
import { TenantService } from '@/tenant/tenant.service';

describe('ProductSubCategoryService', () => {
  let service: ProductSubCategoryService;

  const mockTenantService = {
    prismaTenantInstance: jest.fn(),
    getTenantInfo: jest.fn(),
    getdb_connection: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductSubCategoryService,
        {
          provide: TenantService,
          useValue: mockTenantService,
        },
      ],
    }).compile();

    service = module.get<ProductSubCategoryService>(ProductSubCategoryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
