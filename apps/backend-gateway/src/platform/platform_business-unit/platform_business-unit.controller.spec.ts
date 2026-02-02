import { Test, TestingModule } from '@nestjs/testing';
import { Platform_BusinessUnitController } from './platform_business-unit.controller';
import { Platform_BusinessUnitService } from './platform_business-unit.service';


const mockClusterService = {
  send: jest.fn(),
  emit: jest.fn(),
};
describe('platform_BusinessUnitController', () => {
  let controller: Platform_BusinessUnitController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [Platform_BusinessUnitController],
      providers: [
        Platform_BusinessUnitService,
        {
          provide: 'CLUSTER_SERVICE',
          useValue: mockClusterService,
        },
      ],
    }).compile();

    controller = module.get<Platform_BusinessUnitController>(Platform_BusinessUnitController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
