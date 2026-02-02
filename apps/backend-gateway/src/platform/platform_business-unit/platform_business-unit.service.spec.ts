import { Test, TestingModule } from '@nestjs/testing';
import { Platform_BusinessUnitService } from './platform_business-unit.service';


const mockClusterService = {
  send: jest.fn(),
  emit: jest.fn(),
};
describe('Platform_BusinessUnitService', () => {
  let service: Platform_BusinessUnitService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        Platform_BusinessUnitService,
        {
          provide: 'CLUSTER_SERVICE',
          useValue: mockClusterService,
        },
      ],
    }).compile();

    service = module.get<Platform_BusinessUnitService>(Platform_BusinessUnitService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
