import { Test, TestingModule } from '@nestjs/testing';
import { UnitsService } from './units.service';
import { TenantService } from '@/tenant/tenant.service';

describe('UnitsService', () => {
  let service: UnitsService;

  const mockTenantService = {
    prismaTenantInstance: jest.fn(),
    getTenantInfo: jest.fn(),
    getdb_connection: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UnitsService,
        {
          provide: TenantService,
          useValue: mockTenantService,
        },
      ],
    }).compile();

    service = module.get<UnitsService>(UnitsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
