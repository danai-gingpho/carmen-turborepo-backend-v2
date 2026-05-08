import { Test, TestingModule } from '@nestjs/testing';
import { ProductItemGroupController } from './product-item-group.controller';
import { ProductItemGroupService } from './product-item-group.service';
import { TenantService } from '@/tenant/tenant.service';

describe('ProductItemGroupController', () => {
  let controller: ProductItemGroupController;

  const mockTenantService = {
    prismaTenantInstance: jest.fn(),
    getTenantInfo: jest.fn(),
    getdb_connection: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductItemGroupController],
      providers: [
        ProductItemGroupService,
        {
          provide: TenantService,
          useValue: mockTenantService,
        },
      ],
    }).compile();

    controller = module.get<ProductItemGroupController>(ProductItemGroupController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
