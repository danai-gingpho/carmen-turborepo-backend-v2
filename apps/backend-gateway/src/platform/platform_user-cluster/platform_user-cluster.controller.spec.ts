import { Test, TestingModule } from '@nestjs/testing';
import { Platform_UserClusterController } from './platform_user-cluster.controller';
import { Platform_UserClusterService } from './platform_user-cluster.service';


const mockClusterService = {
  send: jest.fn(),
  emit: jest.fn(),
};
describe('UserClusterController', () => {
  let controller: Platform_UserClusterController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [Platform_UserClusterController],
      providers: [
        Platform_UserClusterService,
        {
          provide: 'CLUSTER_SERVICE',
          useValue: mockClusterService,
        },
      ],
    }).compile();

    controller = module.get<Platform_UserClusterController>(Platform_UserClusterController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
