import { Test, TestingModule } from '@nestjs/testing';
import { ProductSubCategoryController } from './product-sub-category.controller';
import { ProductSubCategoryService } from './product-sub-category.service';
import { TenantService } from '@/tenant/tenant.service';

describe('ProductSubCategoryController', () => {
  let controller: ProductSubCategoryController;

  const mockTenantService = {
    prismaTenantInstance: jest.fn(),
    getTenantInfo: jest.fn(),
    getdb_connection: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductSubCategoryController],
      providers: [
        ProductSubCategoryService,
        {
          provide: TenantService,
          useValue: mockTenantService,
        },
      ],
    }).compile();

    controller = module.get<ProductSubCategoryController>(ProductSubCategoryController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
