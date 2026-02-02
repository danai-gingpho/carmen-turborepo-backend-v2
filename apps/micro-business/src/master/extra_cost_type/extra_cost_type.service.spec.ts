import { Test, TestingModule } from '@nestjs/testing';
import { ExtraCostTypeService } from './extra_cost_type.service';
import { TenantService } from '@/tenant/tenant.service';

describe('ExtraCostTypeService', () => {
  let service: ExtraCostTypeService;

  const mockTenantService = {
    prismaTenantInstance: jest.fn(),
    getTenantInfo: jest.fn(),
    getdb_connection: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExtraCostTypeService,
        {
          provide: TenantService,
          useValue: mockTenantService,
        },
      ],
    }).compile();

    service = module.get<ExtraCostTypeService>(ExtraCostTypeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
