import { Test, TestingModule } from '@nestjs/testing';
import { CreditTermController } from './credit_term.controller';
import { CreditTermService } from './credit_term.service';
import { TenantService } from '@/tenant/tenant.service';

describe('CreditTermController', () => {
  let controller: CreditTermController;

  const mockTenantService = {
    prismaTenantInstance: jest.fn(),
    getTenantInfo: jest.fn(),
    getdb_connection: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CreditTermController],
      providers: [
        CreditTermService,
        {
          provide: TenantService,
          useValue: mockTenantService,
        },
      ],
    }).compile();

    controller = module.get<CreditTermController>(CreditTermController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
