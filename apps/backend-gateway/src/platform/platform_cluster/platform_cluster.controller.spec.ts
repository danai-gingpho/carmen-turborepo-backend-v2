import { Test, TestingModule } from '@nestjs/testing';
import { Platform_ClusterController } from './platform_cluster.controller';
import { Platform_ClusterService } from './platform_cluster.service';


const mockClusterService = {
  send: jest.fn(),
  emit: jest.fn(),
};
describe('ClusterController', () => {
  let controller: Platform_ClusterController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [Platform_ClusterController],
      providers: [
        Platform_ClusterService,
        {
          provide: 'CLUSTER_SERVICE',
          useValue: mockClusterService,
        },
      ],
    }).compile();

    controller = module.get<Platform_ClusterController>(Platform_ClusterController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
