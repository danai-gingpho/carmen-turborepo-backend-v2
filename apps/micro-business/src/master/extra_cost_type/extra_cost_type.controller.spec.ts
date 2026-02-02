import { Test, TestingModule } from '@nestjs/testing';
import { ExtraCostTypeController } from './extra_cost_type.controller';
import { ExtraCostTypeService } from './extra_cost_type.service';
import { TenantService } from '@/tenant/tenant.service';

describe('ExtraCostTypeController', () => {
  let controller: ExtraCostTypeController;

  const mockTenantService = {
    prismaTenantInstance: jest.fn(),
    getTenantInfo: jest.fn(),
    getdb_connection: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ExtraCostTypeController],
      providers: [
        ExtraCostTypeService,
        {
          provide: TenantService,
          useValue: mockTenantService,
        },
      ],
    }).compile();

    controller = module.get<ExtraCostTypeController>(ExtraCostTypeController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
