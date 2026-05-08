import { Test, TestingModule } from '@nestjs/testing';
import { VendorBusinessTypeController } from './vendor_business_type.controller';
import { VendorBusinessTypeService } from './vendor_business_type.service';
import { TenantService } from '@/tenant/tenant.service';

describe('VendorBusinessTypeController', () => {
  let controller: VendorBusinessTypeController;

  const mockTenantService = {
    prismaTenantInstance: jest.fn(),
    getTenantInfo: jest.fn(),
    getdb_connection: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VendorBusinessTypeController],
      providers: [
        VendorBusinessTypeService,
        {
          provide: TenantService,
          useValue: mockTenantService,
        },
      ],
    }).compile();

    controller = module.get<VendorBusinessTypeController>(VendorBusinessTypeController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
