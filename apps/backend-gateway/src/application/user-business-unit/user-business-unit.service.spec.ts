import { Test, TestingModule } from '@nestjs/testing';
import { UserBusinessUnitService } from './user-business-unit.service';


const mockClusterService = {
  send: jest.fn(),
  emit: jest.fn(),
};
describe('UserBusinessUnitService', () => {
  let service: UserBusinessUnitService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserBusinessUnitService,
        {
          provide: 'CLUSTER_SERVICE',
          useValue: mockClusterService,
        },
      ],
    }).compile();

    service = module.get<UserBusinessUnitService>(UserBusinessUnitService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
