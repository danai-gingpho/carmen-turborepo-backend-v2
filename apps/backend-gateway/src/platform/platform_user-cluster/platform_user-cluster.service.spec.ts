import { Test, TestingModule } from '@nestjs/testing';
import { Platform_UserClusterService } from './platform_user-cluster.service';


const mockClusterService = {
  send: jest.fn(),
  emit: jest.fn(),
};
describe('Platform_UserClusterService', () => {
  let service: Platform_UserClusterService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        Platform_UserClusterService,
        {
          provide: 'CLUSTER_SERVICE',
          useValue: mockClusterService,
        },
      ],
    }).compile();

    service = module.get<Platform_UserClusterService>(Platform_UserClusterService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
