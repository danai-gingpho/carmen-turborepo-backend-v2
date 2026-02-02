import { Test, TestingModule } from '@nestjs/testing';
import { WorkflowsController } from './workflows.controller';
import { WorkflowsService } from './workflows.service';
import { TenantService } from '@/tenant/tenant.service';

describe('WorkflowsController', () => {
  let controller: WorkflowsController;

  const mockTenantService = {
    prismaTenantInstance: jest.fn(),
    getTenantInfo: jest.fn(),
    getdb_connection: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WorkflowsController],
      providers: [
        WorkflowsService,
        {
          provide: TenantService,
          useValue: mockTenantService,
        },
      ],
    }).compile();

    controller = module.get<WorkflowsController>(WorkflowsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
