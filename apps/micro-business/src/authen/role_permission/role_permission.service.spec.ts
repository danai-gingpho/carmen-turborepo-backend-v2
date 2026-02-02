import { Test, TestingModule } from '@nestjs/testing';
import { ApplicationRolePermissionService } from './role_permission.service';

describe('ApplicationRolePermissionService', () => {
  let service: ApplicationRolePermissionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ApplicationRolePermissionService],
    }).compile();

    service = module.get<ApplicationRolePermissionService>(
      ApplicationRolePermissionService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
