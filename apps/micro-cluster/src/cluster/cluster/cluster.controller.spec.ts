import { Test, TestingModule } from '@nestjs/testing';
import { ClusterController } from './cluster.controller';
import { ClusterService } from './cluster.service';

describe('ClusterController', () => {
  let controller: ClusterController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClusterController],
      providers: [
        ClusterService,
        {
          provide: 'KEYCLOAK_SERVICE',
          useValue: { send: jest.fn(), emit: jest.fn() },
        },
        {
          provide: 'PRISMA_SYSTEM',
          useValue: {},
        },
      ],
    }).compile();

    controller = module.get<ClusterController>(ClusterController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
