import { Test, TestingModule } from '@nestjs/testing';
import { PriceListController } from './price-list.controller';
import { PriceListService } from './price-list.service';
import { TenantService } from '@/tenant/tenant.service';
import { CommonLogic } from '@/common/common.logic';

describe('PriceListController', () => {
  let controller: PriceListController;

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
      controllers: [PriceListController],
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

    controller = module.get<PriceListController>(PriceListController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
