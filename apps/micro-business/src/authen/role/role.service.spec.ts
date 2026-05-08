import { Test, TestingModule } from '@nestjs/testing';
import { ApplicationRoleService } from './role.service';
import { TenantService } from '@/tenant/tenant.service';

describe('ApplicationRoleService', () => {
  let service: ApplicationRoleService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApplicationRoleService,
        { provide: 'PRISMA_SYSTEM', useValue: {} },
        { provide: 'PRISMA_TENANT', useValue: {} },
        { provide: 'MASTER_SERVICE', useValue: {} },
        { provide: TenantService, useValue: {} },
      ],
    }).compile();

    service = module.get<ApplicationRoleService>(ApplicationRoleService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
