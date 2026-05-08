import { Test, TestingModule } from '@nestjs/testing';
import { BusinessUnitService } from './business-unit.service';


const mockClusterService = {
  send: jest.fn(),
  emit: jest.fn(),
};
describe('BusinessUnitService', () => {
  let service: BusinessUnitService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BusinessUnitService,
        {
          provide: 'CLUSTER_SERVICE',
          useValue: mockClusterService,
        },
      ],
    }).compile();

    service = module.get<BusinessUnitService>(BusinessUnitService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
