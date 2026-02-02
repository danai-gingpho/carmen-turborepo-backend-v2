import { Test, TestingModule } from '@nestjs/testing';
import { Platform_ClusterService } from './platform_cluster.service';


const mockClusterService = {
  send: jest.fn(),
  emit: jest.fn(),
};
describe('Platform_ClusterService', () => {
  let service: Platform_ClusterService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        Platform_ClusterService,
        {
          provide: 'CLUSTER_SERVICE',
          useValue: mockClusterService,
        },
      ],
    }).compile();

    service = module.get<Platform_ClusterService>(Platform_ClusterService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
