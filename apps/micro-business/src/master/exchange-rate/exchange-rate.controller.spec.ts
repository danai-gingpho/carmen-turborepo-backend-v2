import { Test, TestingModule } from '@nestjs/testing';
import { ExchangeRateController } from './exchange-rate.controller';
import { ExchangeRateService } from './exchange-rate.service';
import { TenantService } from '@/tenant/tenant.service';

describe('ExchangeRateController', () => {
  let controller: ExchangeRateController;

  const mockTenantService = {
    prismaTenantInstance: jest.fn(),
    getTenantInfo: jest.fn(),
    getdb_connection: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ExchangeRateController],
      providers: [
        ExchangeRateService,
        {
          provide: TenantService,
          useValue: mockTenantService,
        },
      ],
    }).compile();

    controller = module.get<ExchangeRateController>(ExchangeRateController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
