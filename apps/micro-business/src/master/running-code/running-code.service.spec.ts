import { Test, TestingModule } from '@nestjs/testing';
import { RunningCodeService } from './running-code.service';
import { TenantService } from '@/tenant/tenant.service';

describe('RunningCodeService', () => {
  let service: RunningCodeService;

  const mockTenantService = {
    prismaTenantInstance: jest.fn(),
    getTenantInfo: jest.fn(),
    getdb_connection: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RunningCodeService,
        {
          provide: TenantService,
          useValue: mockTenantService,
        },
      ],
    }).compile();

    service = module.get<RunningCodeService>(RunningCodeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
