import { Test, TestingModule } from '@nestjs/testing';
import { PermissionService } from './permission.service';
import { TenantService } from '@/tenant/tenant.service';

describe('PermissionService', () => {
  let service: PermissionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PermissionService,
        { provide: 'PRISMA_SYSTEM', useValue: {} },
        { provide: 'PRISMA_TENANT', useValue: {} },
        { provide: 'MASTER_SERVICE', useValue: {} },
        { provide: TenantService, useValue: {} },
      ],
    }).compile();

    service = module.get<PermissionService>(PermissionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
