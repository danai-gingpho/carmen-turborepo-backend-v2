import { Test, TestingModule } from '@nestjs/testing';
import { Platform_UserBusinessUnitController } from './platform_user-business-unit.controller';
import { Platform_UserBusinessUnitService } from './platform_user-business-unit.service';


const mockClusterService = {
  send: jest.fn(),
  emit: jest.fn(),
};
describe('Platform_UserBusinessUnitController', () => {
  let controller: Platform_UserBusinessUnitController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [Platform_UserBusinessUnitController],
      providers: [
        Platform_UserBusinessUnitService,
        {
          provide: 'CLUSTER_SERVICE',
          useValue: mockClusterService,
        },
      ],
    }).compile();

    controller = module.get<Platform_UserBusinessUnitController>(
      Platform_UserBusinessUnitController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
