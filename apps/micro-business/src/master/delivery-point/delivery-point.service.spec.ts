import { Test, TestingModule } from '@nestjs/testing';
import { DeliveryPointService } from './delivery-point.service';
import { TenantService } from '@/tenant/tenant.service';

describe('DeliveryPointService', () => {
  let service: DeliveryPointService;

  const mockTenantService = {
    prismaTenantInstance: jest.fn(),
    getTenantInfo: jest.fn(),
    getdb_connection: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeliveryPointService,
        {
          provide: TenantService,
          useValue: mockTenantService,
        },
      ],
    }).compile();

    service = module.get<DeliveryPointService>(DeliveryPointService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
