import { Test, TestingModule } from '@nestjs/testing';
import { DeliveryPointController } from './delivery-point.controller';
import { DeliveryPointService } from './delivery-point.service';
import { TenantService } from '@/tenant/tenant.service';

describe('DeliveryPointController', () => {
  let controller: DeliveryPointController;

  const mockTenantService = {
    prismaTenantInstance: jest.fn(),
    getTenantInfo: jest.fn(),
    getdb_connection: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DeliveryPointController],
      providers: [
        DeliveryPointService,
        {
          provide: TenantService,
          useValue: mockTenantService,
        },
      ],
    }).compile();

    controller = module.get<DeliveryPointController>(DeliveryPointController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
