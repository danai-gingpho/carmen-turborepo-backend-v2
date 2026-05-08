import { Test, TestingModule } from '@nestjs/testing';
import { RunningCodeController } from './running-code.controller';
import { RunningCodeService } from './running-code.service';
import { TenantService } from '@/tenant/tenant.service';

describe('RunningCodeController', () => {
  let controller: RunningCodeController;

  const mockTenantService = {
    prismaTenantInstance: jest.fn(),
    getTenantInfo: jest.fn(),
    getdb_connection: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RunningCodeController],
      providers: [
        RunningCodeService,
        {
          provide: TenantService,
          useValue: mockTenantService,
        },
      ],
    }).compile();

    controller = module.get<RunningCodeController>(RunningCodeController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
