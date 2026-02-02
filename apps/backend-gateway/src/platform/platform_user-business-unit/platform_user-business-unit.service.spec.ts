import { Test, TestingModule } from '@nestjs/testing';
import { Platform_UserBusinessUnitService } from './platform_user-business-unit.service';


const mockClusterService = {
  send: jest.fn(),
  emit: jest.fn(),
};
describe('Platform_UserBusinessUnitService', () => {
  let service: Platform_UserBusinessUnitService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        Platform_UserBusinessUnitService,
        {
          provide: 'CLUSTER_SERVICE',
          useValue: mockClusterService,
        },
      ],
    }).compile();

    service = module.get<Platform_UserBusinessUnitService>(
      Platform_UserBusinessUnitService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
