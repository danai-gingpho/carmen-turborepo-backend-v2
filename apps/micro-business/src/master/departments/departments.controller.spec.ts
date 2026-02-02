import { Test, TestingModule } from '@nestjs/testing';
import { DepartmentsController } from './departments.controller';
import { DepartmentsService } from './departments.service';
import { TenantService } from '@/tenant/tenant.service';

describe('DepartmentsController', () => {
  let controller: DepartmentsController;

  const mockTenantService = {
    prismaTenantInstance: jest.fn(),
    getTenantInfo: jest.fn(),
    getdb_connection: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DepartmentsController],
      providers: [
        DepartmentsService,
        {
          provide: TenantService,
          useValue: mockTenantService,
        },
      ],
    }).compile();

    controller = module.get<DepartmentsController>(DepartmentsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
