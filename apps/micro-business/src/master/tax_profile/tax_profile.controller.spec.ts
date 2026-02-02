import { Test, TestingModule } from '@nestjs/testing';
import { TaxProfileController } from './tax_profile.controller';
import { TaxProfileService } from './tax_profile.service';
import { TenantService } from '@/tenant/tenant.service';

describe('TaxTypeProfileController', () => {
  let controller: TaxProfileController;

  const mockTenantService = {
    prismaTenantInstance: jest.fn(),
    getTenantInfo: jest.fn(),
    getdb_connection: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TaxProfileController],
      providers: [
        TaxProfileService,
        {
          provide: TenantService,
          useValue: mockTenantService,
        },
      ],
    }).compile();

    controller = module.get<TaxProfileController>(TaxProfileController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
