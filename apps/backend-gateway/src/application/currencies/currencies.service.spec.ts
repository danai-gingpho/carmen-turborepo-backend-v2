import { Test, TestingModule } from '@nestjs/testing';
import { CurrenciesService } from './currencies.service';


const mockClusterService = {
  send: jest.fn(),
  emit: jest.fn(),
};
const mockMasterService = {
  send: jest.fn(),
  emit: jest.fn(),
};
describe('CurrenciesService', () => {
  let service: CurrenciesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CurrenciesService,
        {
          provide: 'CLUSTER_SERVICE',
          useValue: mockClusterService,
        },
        {
          provide: 'MASTER_SERVICE',
          useValue: mockMasterService,
        },
      ],
    }).compile();

    service = module.get<CurrenciesService>(CurrenciesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
