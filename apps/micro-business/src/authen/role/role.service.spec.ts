import { Test, TestingModule } from '@nestjs/testing';
import { ApplicationRoleService } from './role.service';

describe('ApplicationRoleService', () => {
  let service: ApplicationRoleService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ApplicationRoleService],
    }).compile();

    service = module.get<ApplicationRoleService>(ApplicationRoleService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
