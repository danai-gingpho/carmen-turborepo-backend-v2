import { Test, TestingModule } from '@nestjs/testing';
import { CreditTermService } from './credit_term.service';
import { TenantService } from '@/tenant/tenant.service';

describe('CreditTermService', () => {
  let service: CreditTermService;

  const mockTenantService = {
    prismaTenantInstance: jest.fn(),
    getTenantInfo: jest.fn(),
    getdb_connection: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreditTermService,
        {
          provide: TenantService,
          useValue: mockTenantService,
        },
      ],
    }).compile();

    service = module.get<CreditTermService>(CreditTermService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
