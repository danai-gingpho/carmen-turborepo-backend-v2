import { Test, TestingModule } from '@nestjs/testing';
import { PriceListTemplateController } from './price-list-template.controller';
import { PriceListTemplateService } from './price-list-template.service';
import { TenantService } from '@/tenant/tenant.service';

describe('PriceListTemplateController', () => {
  let controller: PriceListTemplateController;

  const mockTenantService = {
    prismaTenantInstance: jest.fn(),
    getTenantInfo: jest.fn(),
    getdb_connection: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PriceListTemplateController],
      providers: [
        PriceListTemplateService,
        {
          provide: TenantService,
          useValue: mockTenantService,
        },
      ],
    }).compile();

    controller = module.get<PriceListTemplateController>(
      PriceListTemplateController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
