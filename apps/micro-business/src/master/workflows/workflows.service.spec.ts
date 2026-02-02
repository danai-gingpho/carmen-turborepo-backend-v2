import { Test, TestingModule } from '@nestjs/testing';
import { WorkflowsService } from './workflows.service';
import { TenantService } from '@/tenant/tenant.service';

describe('WorkflowsService', () => {
  let service: WorkflowsService;

  const mockTenantService = {
    prismaTenantInstance: jest.fn(),
    getTenantInfo: jest.fn(),
    getdb_connection: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkflowsService,
        {
          provide: TenantService,
          useValue: mockTenantService,
        },
      ],
    }).compile();

    service = module.get<WorkflowsService>(WorkflowsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
