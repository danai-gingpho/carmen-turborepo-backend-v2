import { Test, TestingModule } from '@nestjs/testing';
import { ApplicationRolePermissionController } from './role_permission.controller';
import { ApplicationRolePermissionService } from './role_permission.service';

describe('ApplicationRolePermissionController', () => {
  let controller: ApplicationRolePermissionController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ApplicationRolePermissionController],
      providers: [ApplicationRolePermissionService],
    }).compile();

    controller = module.get<ApplicationRolePermissionController>(
      ApplicationRolePermissionController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
